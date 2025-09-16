import { NextRequest, NextResponse } from 'next/server';
import { checkRedisHealth, initializeRedis } from '@/lib/redis';

// GET - Check overall system health
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const services = searchParams.get('services')?.split(',') || ['redis'];
    const detailed = searchParams.get('detailed') === 'true';
    
    // Initialize health status object
    const healthStatus: Record<string, any> = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
    };
    
    // Check Redis health if requested
    if (services.includes('redis')) {
      try {
        // Initialize Redis connections if not already initialized
        await initializeRedis();
        
        // Check Redis health
        const isRedisHealthy = await checkRedisHealth();
        
        healthStatus.services.redis = {
          status: isRedisHealthy ? 'healthy' : 'unhealthy',
        };
        
        // Update overall status if any service is unhealthy
        if (!isRedisHealthy) {
          healthStatus.status = 'degraded';
        }
      } catch (redisError) {
        console.error('❌ Error checking Redis health:', redisError);
        
        healthStatus.services.redis = {
          status: 'error',
          message: redisError instanceof Error ? redisError.message : 'Unknown error',
        };
        
        // Update overall status
        healthStatus.status = 'degraded';
      }
    }
    
    // Add more service health checks here in the future
    // For example: MongoDB, external APIs, etc.
    
    // Determine HTTP status code based on overall health
    const httpStatus = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 207 : 503;
    
    return NextResponse.json(healthStatus, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      } 
    });
  } catch (error) {
    console.error('❌ Error checking system health:', error);
    
    return NextResponse.json({
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