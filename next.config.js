/** @type {import("next").NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
};

module.exports = nextConfig;
