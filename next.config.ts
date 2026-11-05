import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // In dev, Next prints server action arguments to the terminal, including the login password.
  logging: { serverFunctions: false },
};

export default nextConfig;
