import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 301 redirects
  async redirects() {
    return [
      {
        source: "/programmingschool-osusume",
        destination: "/",
        permanent: true,
      },
      {
        source: "/programmingschool-osusume/",
        destination: "/",
        permanent: true,
      },
    ];
  },

  // Allow external images from Rakuten CDN and Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "thumbnail.image.rakuten.co.jp",
      },
      {
        protocol: "https",
        hostname: "shop.r10s.jp",
      },
      {
        protocol: "https",
        hostname: "**.rimg.rakuten.co.jp",
      },
      {
        protocol: "https",
        hostname: "iincrjxaedycekvkorrp.supabase.co",
      },
    ],
  },
};

export default nextConfig;
