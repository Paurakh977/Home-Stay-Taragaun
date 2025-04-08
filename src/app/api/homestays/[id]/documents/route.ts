import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import HomestaySingle from "@/lib/models/HomestaySingle";
import { join } from "path";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";

// Interface for the structure of metadata expected from the frontend
interface DocumentMetadata {
  title: string;
  description?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const homestayId = params.id;

    // 1. Validate homestay exists
    const homestay = await HomestaySingle.findOne({ homestayId });
    if (!homestay) {
      return NextResponse.json(
        { error: "Homestay not found" },
        { status: 404 }
      );
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const metadataJson = formData.get("metadata") as string | null;
    
    if (!metadataJson) {
        return NextResponse.json(
            { error: "Missing document metadata" },
            { status: 400 }
        );
    }

    const metadataArray: DocumentMetadata[] = JSON.parse(metadataJson);
    
    // 3. Prepare directory structure
    const documentsDir = join(process.cwd(), "public", "uploads", homestayId, "documents");
    if (!existsSync(documentsDir)) {
      await mkdir(documentsDir, { recursive: true });
    }

    const newDocumentEntries = []; // To store data for DB update

    // 4. Process and save files, associating them with metadata
    let fileUploadPromises = [];
    const processedFilesInfo: { [itemIndex: number]: any[] } = {}; // Temp store for file info { itemIndex: [IDocumentFile, ...] }

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file_")) {
        const file = value as File;
        if (!file || typeof file === 'string') continue; // Skip non-file entries or metadata

        // Extract item index from key 'file_i_j'
        const indices = key.split('_');
        const itemIndex = parseInt(indices[1], 10);

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const fileExtension = file.name.split('.').pop() || 'bin'; // Use 'bin' if no extension
        const uniqueFilename = `${timestamp}-${randomString}.${fileExtension}`;
        const filePathDisk = join(documentsDir, uniqueFilename);
        const filePathDb = `/uploads/${homestayId}/documents/${uniqueFilename}`; // Relative path for DB/URL

        // Prepare file info for DB
        const fileInfo = {
            originalName: file.name,
            filePath: filePathDb,
            fileType: file.type || 'application/octet-stream',
            size: file.size,
        };

        // Store file info grouped by item index
        if (!processedFilesInfo[itemIndex]) {
            processedFilesInfo[itemIndex] = [];
        }
        processedFilesInfo[itemIndex].push(fileInfo);

        // Add write operation to promises
        fileUploadPromises.push(
            file.arrayBuffer().then(buffer => writeFile(filePathDisk, Buffer.from(buffer)))
        );
      }
    }
    
    // Wait for all files to be written to disk
    await Promise.all(fileUploadPromises);

    // 5. Construct document entries for DB update using metadata and saved file info
    for (let i = 0; i < metadataArray.length; i++) {
        const metadata = metadataArray[i];
        const filesForItem = processedFilesInfo[i] || []; // Get files for this item index
        
        if (filesForItem.length > 0) { // Only add entry if files were uploaded for it
            newDocumentEntries.push({
                title: metadata.title,
                description: metadata.description || "",
                uploadedAt: new Date(),
                files: filesForItem,
            });
        } else {
            // Handle case where metadata was sent but no files for that item were received/processed
            console.warn(`No files processed for document item index ${i} with title "${metadata.title}"`);
        }
    }

    // 6. Update database
    if (newDocumentEntries.length > 0) {
      await HomestaySingle.updateOne(
        { homestayId },
        { $push: { documents: { $each: newDocumentEntries } } }
      );
    } else {
        // Optional: return a specific message if no valid documents were processed
        return NextResponse.json(
            { message: "No documents were uploaded or processed." },
            { status: 200 } // Or 400 if it should be an error
        );
    }

    return NextResponse.json({
      success: true,
      message: `${newDocumentEntries.length} document entr(y/ies) added successfully.`,
      addedDocuments: newDocumentEntries // Optional: return details of added docs
    });

  } catch (error) {
    console.error("Error uploading documents:", error);
    // More specific error checking
    if (error instanceof SyntaxError) { // JSON parsing error
        return NextResponse.json(
            { error: "Invalid metadata format", details: error.message },
            { status: 400 }
        );
    }
    return NextResponse.json(
      { error: "Failed to upload documents", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 