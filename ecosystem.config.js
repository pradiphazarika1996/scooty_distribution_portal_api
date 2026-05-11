module.exports = {
  apps: [
    {
      name: 'mac-scholarship-api',
      script: 'dist/app.js',
      instances: 5,
      exec_mode: 'cluster',

      max_memory_restart: '2500M',

      autorestart: true,
      watch: false,
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,

      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
