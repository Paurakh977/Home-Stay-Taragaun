import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import HomestaySingle from "@/lib/models/HomestaySingle";
import { join } from "path";
import { mkdir, writeFile, rm } from "fs/promises";
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

    // Get the adminUsername from query params if it exists
    const { searchParams } = new URL(request.url);
    const adminUsername = searchParams.get("adminUsername");
    
    console.log("Document Upload Request:", {
      homestayId,
      adminUsername,
      requestUrl: request.url
    });

    // 1. Validate homestay exists
    const homestay = await HomestaySingle.findOne({ homestayId });
    if (!homestay) {
      console.error("Homestay not found:", homestayId);
      return NextResponse.json(
        { error: "Homestay not found" },
        { status: 404 }
      );
    }
    
    // Log the found homestay details
    console.log("Found homestay:", {
      id: homestay._id,
      homestayId: homestay.homestayId,
      homeStayName: homestay.homeStayName,
      adminUsername: homestay.adminUsername // This field might not exist in the model
    });

    // If no adminUsername provided in URL, try to get it from the homestay record
    let effectiveAdminUsername = adminUsername;
    if (!effectiveAdminUsername && homestay.adminUsername) {
      effectiveAdminUsername = homestay.adminUsername;
      console.log("Using adminUsername from homestay record:", effectiveAdminUsername);
    }
    
    if (!effectiveAdminUsername) {
      console.error("No adminUsername available for upload path");
      return NextResponse.json(
        { error: "Admin username is required for document uploads" },
        { status: 400 }
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
    
    // 3. Prepare directory structure with adjusted path based on admin status
    const baseDir = join(process.cwd(), "public", "uploads");
    let docsPath: string;
    let docsUrlPath: string;
    
    if (effectiveAdminUsername) {
      // For admin routes: /uploads/adminUsername/homestayId/documents
      docsPath = join(baseDir, effectiveAdminUsername, homestayId, "documents");
      docsUrlPath = `/uploads/${effectiveAdminUsername}/${homestayId}/documents`;
    } else {
      // For regular routes: /uploads/homestayId/documents
      docsPath = join(baseDir, homestayId, "documents");
      docsUrlPath = `/uploads/${homestayId}/documents`;
    }
    
    if (!existsSync(docsPath)) {
      await mkdir(docsPath, { recursive: true });
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
        const filePathDisk = join(docsPath, uniqueFilename);
        const filePathDb = `${docsUrlPath}/${uniqueFilename}`; // Relative path for DB/URL

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const homestayId = params.id;
    const { searchParams } = new URL(request.url);
    const adminUsername = searchParams.get("adminUsername");
    
    console.log("Document Delete Request:", {
      homestayId,
      adminUsername,
      requestUrl: request.url
    });

    const body = await request.json();
    const { documentIndex } = body;

    if (documentIndex === undefined) {
      return NextResponse.json(
        { error: "Document index is required" },
        { status: 400 }
      );
    }

    const homestay = await HomestaySingle.findOne({ homestayId });
    if (!homestay) {
      return NextResponse.json(
        { error: "Homestay not found" },
        { status: 404 }
      );
    }
    
    // Log the found homestay details
    console.log("Found homestay for delete:", {
      id: homestay._id,
      homestayId: homestay.homestayId,
      adminUsername: homestay.adminUsername // This field might not exist in the model
    });

    // If no adminUsername provided in URL, try to get it from the homestay record
    let effectiveAdminUsername = adminUsername;
    if (!effectiveAdminUsername && homestay.adminUsername) {
      effectiveAdminUsername = homestay.adminUsername;
      console.log("Using adminUsername from homestay record for delete:", effectiveAdminUsername);
    }

    if (!homestay.documents || !Array.isArray(homestay.documents) || documentIndex >= homestay.documents.length) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const documentToDelete = homestay.documents[documentIndex];
    if (!documentToDelete) {
      return NextResponse.json(
        { error: "Document not found at specified index" },
        { status: 404 }
      );
    }
    
    // Delete files from filesystem
    let deletedFiles = 0;
    let failedFiles = 0;
    
    if (documentToDelete.files && documentToDelete.files.length > 0) {
      console.log(`Attempting to delete ${documentToDelete.files.length} files`);
      
      for (const file of documentToDelete.files) {
        try {
          // Get the file path relative to 'public' directory
          let publicFilePath = file.filePath;
          
          // Ensure the path starts with /uploads/
          if (!publicFilePath.startsWith('/uploads/')) {
            console.warn(`File path doesn't start with /uploads/: ${publicFilePath}`);
            publicFilePath = `/uploads/${publicFilePath.replace(/^\/+/, '')}`;
          }
          
          // Construct the absolute path by joining process.cwd() with 'public' and the relative path
          const basePath = process.cwd();
          const publicDir = join(basePath, 'public');
          
          // Remove the leading slash for joining
          const relativeFilePath = publicFilePath.replace(/^\/+/, '');
          const absoluteFilePath = join(publicDir, relativeFilePath);
          
          console.log("File deletion info:", {
            originalPath: file.filePath,
            publicFilePath,
            absoluteFilePath
          });
          
          // Check if the file exists before attempting to delete
          if (existsSync(absoluteFilePath)) {
            await rm(absoluteFilePath, { force: true });
            console.log("Successfully deleted file:", absoluteFilePath);
            deletedFiles++;
          } else {
            // Try alternative path construction as fallback
            const alternativePath = join(basePath, file.filePath);
            if (existsSync(alternativePath)) {
              await rm(alternativePath, { force: true });
              console.log("Successfully deleted file (alternative path):", alternativePath);
              deletedFiles++;
            } else {
              console.warn(`File not found for deletion: ${absoluteFilePath}`);
              failedFiles++;
            }
          }
        } catch (deleteError) {
          console.error(`Error deleting file ${file.filePath}:`, deleteError);
          failedFiles++;
        }
      }
    }
    
    console.log(`File deletion summary: ${deletedFiles} deleted, ${failedFiles} failed`);

    // 7. Update database
    try {
      // Approach 1: If the document has an _id, use that (with type safety)
      if (documentToDelete && typeof documentToDelete === 'object' && '_id' in documentToDelete && documentToDelete._id) {
        await HomestaySingle.updateOne(
          { homestayId },
          { $pull: { documents: { _id: documentToDelete._id } } }
        );
        console.log(`Removed document with _id: ${documentToDelete._id}`);
      } else {
        // Approach 2: Direct array manipulation using the index
        homestay.documents.splice(documentIndex, 1);
        await homestay.save();
        console.log(`Removed document at index: ${documentIndex}`);
      }
    } catch (dbError) {
      console.error("Error in database update:", dbError);
      // Fallback approach
      homestay.documents = homestay.documents.filter((_, idx) => idx !== documentIndex);
      await homestay.save();
      console.log(`Removed document using filter method at index: ${documentIndex}`);
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
      filesDeletion: {
        total: documentToDelete.files ? documentToDelete.files.length : 0,
        deleted: deletedFiles,
        failed: failedFiles
      }
    });

  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 