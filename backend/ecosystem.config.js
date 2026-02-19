module.exports = {
    apps: [
        {
            name: 'ensaioregional-api',
            script: './dist/server.js',
            cwd: './',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3344
            },
            env_production: {
                NODE_ENV: 'production'
            }
        }
    ]
};
