#!/usr/bin/env node

const http = require('http');

const services = [
  { name: 'API Gateway', url: 'http://localhost:8080/health' },
  { name: 'Room Service', url: 'http://localhost:3001/health' },
  { name: 'User Service', url: 'http://localhost:3002/health' },
  { name: 'Question Service', url: 'http://localhost:3003/health' },
  { name: 'Arena Service', url: 'http://localhost:3004/health' },
  { name: 'Verify Service', url: 'http://localhost:3005/health' },
  { name: 'Points Service', url: 'http://localhost:3006/health' }
];

async function checkService(service) {
  return new Promise((resolve) => {
    const url = new URL(service.url);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            name: service.name,
            status: res.statusCode === 200 ? 'healthy' : 'unhealthy',
            url: service.url,
            response: response
          });
        } catch (e) {
          resolve({
            name: service.name,
            status: 'error',
            url: service.url,
            error: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        name: service.name,
        status: 'unreachable',
        url: service.url,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: service.name,
        status: 'timeout',
        url: service.url,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function checkAllServices() {
  console.log('🔍 Checking AlgoGym Backend Services...\n');

  const results = await Promise.all(services.map(checkService));
  
  let allHealthy = true;
  
  results.forEach(result => {
    const statusIcon = result.status === 'healthy' ? '✅' : '❌';
    const statusColor = result.status === 'healthy' ? '\x1b[32m' : '\x1b[31m';
    
    console.log(`${statusIcon} ${result.name}: ${statusColor}${result.status}\x1b[0m`);
    console.log(`   URL: ${result.url}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    } else if (result.response) {
      console.log(`   Service: ${result.response.service || 'unknown'}`);
      console.log(`   Timestamp: ${result.response.timestamp || 'unknown'}`);
    }
    
    console.log('');
    
    if (result.status !== 'healthy') {
      allHealthy = false;
    }
  });

  if (allHealthy) {
    console.log('🎉 All services are healthy and ready!');
    console.log('\n📊 Service Overview:');
    console.log('   🌐 API Gateway: http://localhost:8080');
    console.log('   🏠 Room Service: http://localhost:3001');
    console.log('   👤 User Service: http://localhost:3002');
    console.log('   ❓ Question Service: http://localhost:3003');
    console.log('   🏟️ Arena Service: http://localhost:3004');
    console.log('   ✅ Verify Service: http://localhost:3005');
    console.log('   🏆 Points Service: http://localhost:3006');
    console.log('\n🔗 Gateway Health Dashboard: http://localhost:8080/health/services');
  } else {
    console.log('⚠️  Some services are not healthy. Please check the logs and configuration.');
    process.exit(1);
  }
}

checkAllServices().catch(console.error);