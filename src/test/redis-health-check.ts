import { checkRedisHealth, initializeRedis, closeRedisConnections } from '../lib/redis';

async function testRedisHealth() {
  try {
    console.log('Initializing Redis connections...');
    await initializeRedis();
    
    console.log('Checking Redis health...');
    const isHealthy = await checkRedisHealth();
    
    console.log('Redis health check result:', isHealthy ? 'HEALTHY' : 'UNHEALTHY');
    
    // Clean up
    console.log('Closing Redis connections...');
    await closeRedisConnections();
    
    console.log('Test completed.');
  } catch (error) {
    console.error('Error during Redis health check test:', error);
  }
}

// Run the test
testRedisHealth();