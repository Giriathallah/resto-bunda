import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      // Cloudinary
      { protocol: "https", hostname: "res.cloudinary.com" },

      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
