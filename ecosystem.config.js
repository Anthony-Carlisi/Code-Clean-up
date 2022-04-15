module.exports = {
  apps: [
    {
      name: 'backend-app',
      script: './server.js',
      ignore_watch: ['temp'],
      watch: true,
      force: true,
      env: {
        PORT: 4000,
        NODE_ENV: 'production',
        MY_ENV_VAR: 'MyVarValue',
      },
    },
  ],
}
