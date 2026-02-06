#!/usr/bin/env node
const { spawn } = require('child_process');

console.log('Starting Cloudflare tunnel: levelup (production mode)');

const tunnel = spawn('cloudflared', [
  'tunnel',
  '--config',
  'cloudflared-config.prod.yml',
  'run',
  'relationship-journal'
], {
  stdio: 'pipe',
  shell: false,
  cwd: process.cwd(),
  windowsHide: true
});

// Output and error handling
tunnel.stdout.on('data', (data) => {
  console.log(data.toString());
});

tunnel.stderr.on('data', (data) => {
  console.error(data.toString());
});

tunnel.on('close', (code) => {
  console.log(`Production tunnel process exited with code ${code}`);
  process.exit(code);
});

tunnel.on('error', (error) => {
  console.error('Failed to start production tunnel:', error);
  process.exit(1);
});

// Graceful shutdown handling
const shutdown = () => {
  console.log('Stopping production tunnel...');
  tunnel.kill('SIGTERM');
  setTimeout(() => tunnel.kill('SIGKILL'), 5000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGQUIT', shutdown);
