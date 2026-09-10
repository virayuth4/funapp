/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d2l8z96ad5k9a0.cloudfront.net",
         pathname: "/**",
      },
      
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  allowedDevOrigins: [
    "localhost:3000",
    "172.20.10.5",
    "172.20.10.5:3000",
    "192.168.18.6:3000",
    "192.168.18.6",
  ],
 
};

export default nextConfig;