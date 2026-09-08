/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  allowedDevOrigins: [
      "localhost:3000",
      "172.20.10.5",
      "172.20.10.5:3000",
    ],
};


export default nextConfig;
