import { NextRequest, NextResponse } from 'next/server';
import { checkRedisHealth, initializeRedis, getRedisClient, getRedisPublisher, getRedisSubscriber } from '@/lib/redis';

// GET - Check Redis health status with detailed information
export async function GET(request: NextRequest) {
  try {
    // Initialize Redis connections if not already initialized
    await initializeRedis();
    
    // Check Redis health
    const isHealthy = await checkRedisHealth();
    
    // Get detailed status information
    let detailedStatus = {};
    
    try {
      // Only attempt to get detailed status if basic health check passes
      // or if the detailed parameter is explicitly requested
      const { searchParams } = new URL(request.url);
      const detailed = searchParams.get('detailed') === 'true';
      
      if (isHealthy || detailed) {
        const redisClient = getRedisClient();
        const redisPublisher = getRedisPublisher();
        const redisSubscriber = getRedisSubscriber();
        
        detailedStatus = {
          clients: {
            main: {
              status: redisClient.status,
              connected: redisClient.status === 'ready',
            },
            publisher: {
              status: redisPublisher.status,
              connected: redisPublisher.status === 'ready',
            },
            subscriber: {
              status: redisSubscriber.status,
              connected: redisSubscriber.status === 'ready',
            },
          },
        };
      }
    } catch (statusError) {
      console.warn('⚠️ Error getting detailed Redis status:', statusError);
      // Don't fail the entire request if detailed status fails
      detailedStatus = { error: 'Failed to retrieve detailed status' };
    }
    
    // Return health status with appropriate HTTP status code
    return NextResponse.json({
      service: 'redis',
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      details: detailedStatus,
    }, { 
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      } 
    });
  } catch (error) {
    console.error('❌ Error checking Redis health:', error);
    
    return NextResponse.json({
      service: 'redis',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      } 
    });
  }
}