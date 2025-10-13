#!/usr/bin/env node

// Render.com startup script to ensure proper port binding
const { spawn } = require('child_process');

// Get port from environment or default to 10000
const port = process.env.PORT || 10000;

// Set the port environment variable
process.env.PORT = port;

console.log(`🚀 Starting FastSchool AI on port ${port}`);

// Start Next.js
const next = spawn('npx', ['next', 'start'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: port,
    HOSTNAME: '0.0.0.0', // Important for Render.com
  }
});

next.on('close', (code) => {
  console.log(`Next.js process exited with code ${code}`);
  process.exit(code);
});

next.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});
