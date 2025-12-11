#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const services = [
  {
    name: 'API Gateway',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'api-gateway'),
    port: 8080,
    color: '\x1b[36m' // Cyan
  },
  {
    name: 'Room Service',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'microservices', 'room-service'),
    port: 3001,
    color: '\x1b[32m' // Green
  },
  {
    name: 'User Service',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'microservices', 'user-service'),
    port: 3002,
    color: '\x1b[33m' // Yellow
  },
  {
    name: 'Question Service',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'microservices', 'question-service'),
    port: 3003,
    color: '\x1b[35m' // Magenta
  },
  {
    name: 'Verify Service',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'microservices', 'verify-codeforces-service'),
    port: 3004,
    color: '\x1b[34m' // Blue
  }
];

const processes = [];

function startService(service) {
  console.log(`${service.color}🚀 Starting ${service.name} on port ${service.port}...\x1b[0m`);
  
  const process = spawn(service.command, service.args, {
    cwd: service.cwd,
    stdio: 'pipe',
    shell: true
  });

  process.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${service.color}[${service.name}]\x1b[0m ${line}`);
    });
  });

  process.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${service.color}[${service.name}]\x1b[31m ERROR:\x1b[0m ${line}`);
    });
  });

  process.on('close', (code) => {
    console.log(`${service.color}[${service.name}]\x1b[0m Process exited with code ${code}`);
  });

  processes.push({ name: service.name, process });
  return process;
}

function stopAllServices() {
  console.log('\n🛑 Stopping all services...');
  processes.forEach(({ name, process }) => {
    console.log(`Stopping ${name}...`);
    process.kill('SIGTERM');
  });
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', stopAllServices);
process.on('SIGTERM', stopAllServices);

// Start all services
console.log('\x1b[1m🎯 AlgoGym Microservices Startup\x1b[0m\n');

services.forEach((service, index) => {
  setTimeout(() => {
    startService(service);
  }, index * 2000); // Stagger startup by 2 seconds
});

// Show status after all services have had time to start
setTimeout(() => {
  console.log('\n\x1b[1m📊 Service Status:\x1b[0m');
  console.log('🌐 API Gateway: http://localhost:8080');
  console.log('🏠 Room Service: http://localhost:3001');
  console.log('👤 User Service: http://localhost:3002');
  console.log('❓ Question Service: http://localhost:3003');
  console.log('✅ Verify Service: http://localhost:3004');
  console.log('\n🔍 Health Check: http://localhost:8080/health/services');
  console.log('\n\x1b[33m💡 Press Ctrl+C to stop all services\x1b[0m\n');
}, 10000);