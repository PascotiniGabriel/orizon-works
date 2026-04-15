import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @langchain/textsplitters tem ESM build problemático com Turbopack
  // Excluir do bundle e deixar o Node.js resolver via require() nativo
  serverExternalPackages: ["@langchain/textsplitters"],
};

export default nextConfig;
