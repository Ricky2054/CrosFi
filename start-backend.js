#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting CrosFi Backend Server...');
console.log('=====================================\n');

// Check if backend directory exists
const backendPath = path.join(__dirname, 'backend');
const fs = require('fs');

if (!fs.existsSync(backendPath)) {
  console.error('❌ Backend directory not found!');
  console.log('Please make sure the backend directory exists.');
  process.exit(1);
}

// Check if package.json exists in backend
const packageJsonPath = path.join(backendPath, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Backend package.json not found!');
  console.log('Please make sure the backend is properly set up.');
  process.exit(1);
}

// Start the backend server
const backendProcess = spawn('npm', ['run', 'dev'], {
  cwd: backendPath,
  stdio: 'inherit',
  shell: true
});

backendProcess.on('error', (error) => {
  console.error('❌ Failed to start backend server:', error.message);
  process.exit(1);
});

backendProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend server exited with code ${code}`);
  } else {
    console.log('✅ Backend server stopped');
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping backend server...');
  backendProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping backend server...');
  backendProcess.kill('SIGTERM');
});

console.log('✅ Backend server is starting...');
console.log('📡 API will be available at: http://localhost:3001');
console.log('💡 Press Ctrl+C to stop the server\n');
