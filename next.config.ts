import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Toda a plataforma é autenticada e dinâmica por natureza (dashboard,
   * laudos, admin) — Cache Components (PPR) não se aplica, desligamos. */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
