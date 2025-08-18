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

export default async function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    console.log('🚀 Initializing Socket.IO server...');
    
    try {
      const io = await initializeSocketServer(res.socket.server);
      res.socket.server.io = io;
      console.log('✅ Socket.IO server successfully initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Socket.IO server:', error);
      return res.status(500).json({ error: 'Failed to initialize Socket.IO server' });
    }
  }

  res.end();
}

// Disable body parsing for Socket.IO
export const config = {
  api: {
    bodyParser: false,
  },
};