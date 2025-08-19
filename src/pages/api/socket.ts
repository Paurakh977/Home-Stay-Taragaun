import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as IOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';
import { initializeSocketServer } from '@/lib/socket-server';

interface SocketServer extends HTTPServer {
  io?: IOServer | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  // Only allow GET and HEAD methods
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', ['GET', 'HEAD']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Check if Socket.IO server is already initialized
    if (!res.socket.server.io) {
      console.log('🚀 Initializing Socket.IO server...');
      
      // Initialize the Socket.IO server with proper error handling
      const io = await initializeSocketServer(res.socket.server);
      res.socket.server.io = io;
      
      console.log('✅ Socket.IO server successfully initialized');
      
      // Set up proper cleanup on server shutdown
      process.on('SIGTERM', () => {
        console.log('🔄 SIGTERM received, closing Socket.IO server...');
        io.close(() => {
          console.log('✅ Socket.IO server closed');
        });
      });

      process.on('SIGINT', () => {
        console.log('🔄 SIGINT received, closing Socket.IO server...');
        io.close(() => {
          console.log('✅ Socket.IO server closed');
        });
      });
    } else {
      console.log('✅ Socket.IO server already initialized');
    }

    // Return success response
    return res.status(200).json({ 
      status: 'ok', 
      message: 'Socket server ready',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to initialize Socket.IO server:', error);
    
    // Return detailed error information for debugging
    return res.status(500).json({ 
      error: 'Failed to initialize Socket.IO server',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

// Disable body parsing for Socket.IO
export const config = {
  api: {
    bodyParser: false,
  },
};