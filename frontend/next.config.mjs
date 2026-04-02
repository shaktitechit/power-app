/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost/api/:path*",
        // destination:
        //   "https://power-backend-production.up.railway.app/api/:path*",
      },
    ];
  },
};

export default nextConfig;
