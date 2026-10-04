/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Sanity serves the responsive variants directly, avoiding Vercel image cache writes.
    loader: "custom",
    loaderFile: "./src/lib/sanity.image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
};

module.exports = nextConfig;
