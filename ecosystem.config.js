module.exports = {
  apps: [
    {
      name: 'levelup-tunnel',
      script: 'scripts/tools/start-prod-tunnel.js',
      cwd: '/home/admin/proj/levelup',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production'
      },
      log_file: 'logs/pm2-tunnel.log',
      out_file: 'logs/pm2-tunnel-out.log',
      error_file: 'logs/pm2-tunnel-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
      time: true
    },
    {
      name: 'levelup-app',
      script: 'scripts/tools/start.js',
      cwd: '/home/admin/proj/levelup',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: '8081'
      },
      log_file: 'logs/pm2-combined.log',
      out_file: 'logs/pm2-out.log',
      error_file: 'logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
      time: true
    }
  ]
};
