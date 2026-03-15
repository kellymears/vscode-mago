import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  output: "export",
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  turbopack: {
    root: new URL("..", import.meta.url).pathname,
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
