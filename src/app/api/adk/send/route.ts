import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
const ADK_API_BASE = process.env.NEXT_PUBLIC_ADK_API_BASE || 'http://localhost:8000';

interface MessageRequest {
  mime_type: string;
  data: string;
  user_id?: number;
  adminUsername?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as MessageRequest;
    const { mime_type, data, user_id, adminUsername } = body;

    // Validate required fields
    if (!mime_type || !data) {
      return NextResponse.json(
        { success: false, error: 'mime_type and data are required' },
        { status: 400 }
      );
    }

    // Get the auth token from cookies
    const cookieStore = await cookies();
    let token = null as string | null;
    let extractedAdminUsername = null as string | null;

    // If adminUsername is provided, try to get the admin's token
    if (adminUsername) {
      // Try different possible formats of admin tokens
      const possibleTokenNames = [
        `${adminUsername}_auth_token`,
        `auth_token_${adminUsername}`,
        'auth_token'  // Fallback to standard token
      ];
      
      for (const tokenName of possibleTokenNames) {
        const foundToken = cookieStore.get(tokenName)?.value;
        if (foundToken) {
          token = foundToken;
          console.log(`Found admin token in cookie: ${tokenName}`);
          break;
        }
      }

      // Verify and extract admin info from token
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          if (decoded.username || decoded.userId) {
            extractedAdminUsername = decoded.username || adminUsername;
          }
        } catch (error) {
          console.error('Error verifying admin token:', error);
          // Continue without auth for now
        }
      }
    }

    // Use provided user_id or generate a random one
    const finalUserId = user_id || Math.floor(Math.random() * 1000) + 1;

    // Prepare payload for ADK server (with correct field names)
    const adkPayload: any = {
      mime_type,
      data
    };

    // Add admin context if available (convert to snake_case)
    if (token && extractedAdminUsername) {
      adkPayload.auth_token = token;
      adkPayload.admin_username = extractedAdminUsername;  // Changed from adminUsername to admin_username
    }

    // Forward request to ADK server with user_id in URL path
    const adkResponse = await fetch(`${ADK_API_BASE}/send/${finalUserId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adkPayload)
    });

    if (!adkResponse.ok) {
      const errorText = await adkResponse.text();
      console.error(`ADK server error (${adkResponse.status}):`, errorText);
      throw new Error(`ADK server responded with status: ${adkResponse.status}`);
    }

    const result = await adkResponse.json();

    // Return the response from ADK server
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error forwarding to ADK server:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to communicate with AI server',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}