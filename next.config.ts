import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-mariadb",
    "mariadb",
  ],
  outputFileTracingIncludes: {
    "/api/tutorial-markdown": ["./GENERATE-POSTMAN-COLLECTION.md"],
  },
};

export default nextConfig;
