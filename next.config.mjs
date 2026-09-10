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
  },
  allowedDevOrigins: [
    "localhost:3000",
    "172.20.10.5",
    "172.20.10.5:3000",
    "192.168.18.6:3000",
    "192.168.18.6",
  ],
  async headers() {
    return [
      {
        source: "/logos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;