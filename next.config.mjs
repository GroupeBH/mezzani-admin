import path from "node:path";
import { fileURLToPath } from "node:url";

const apiUrl = process.env.MEZANI_RESTO_API_URL ?? "http://localhost:8080";
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: projectRoot,
  async rewrites() {
    return [
      {
        source: "/api/resto/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
