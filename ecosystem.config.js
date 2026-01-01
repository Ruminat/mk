module.exports = {
  apps: [
    {
      name: "mooduck.server",
      cwd: "./",
      script: "pnpm",
      args: "run start.server",
      interpreter: "none",
      instances: 1,
      autorestart: true,
      watch: false,
      env: { NODE_ENV: "production" },
    },
  ],
};
