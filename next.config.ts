import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "@remotion/compositor-darwin-arm64",
    "@remotion/compositor-darwin-x64",
    "@remotion/compositor-linux-arm64-gnu",
    "@remotion/compositor-linux-x64-gnu",
    "@remotion/compositor-win32-x64-msvc",
    "@rspack/binding",
    "@rspack/binding-darwin-arm64",
    "@rspack/core",
    "esbuild"
  ]
};

export default nextConfig;
