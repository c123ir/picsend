module.exports = {
  apps: [{
    name: 'logging-server',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3015
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3015
    }
  }]
}; 