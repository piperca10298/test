/** @type {import("next").NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
  ],
};

module.exports = nextConfig;
