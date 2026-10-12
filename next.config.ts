import type { NextConfig } from "next";

// Fictitious comparison prices can only be enabled in Vercel Preview builds.
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SM_DEMO_DISCOUNTS_ENABLED: process.env.VERCEL_ENV === "preview" ? "true" : "false",
  },
  poweredByHeader: false,
  experimental: {
    useTypeScriptCli: false,
  },
};

export default nextConfig;
