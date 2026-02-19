module.exports = {
    apps: [
        {
            name: 'ensaioregional-api',
            script: 'dist/server.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3333
            },
            env_production: {
                NODE_ENV: 'production'
            }
        }
    ]
};
