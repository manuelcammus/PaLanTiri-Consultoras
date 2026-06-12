import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // CVs en PDF/Word de hasta 10 MB (límite del bucket "cvs")
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
