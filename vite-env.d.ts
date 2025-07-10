// This file provides type definitions for Vite environment variables.
// It manually defines the ImportMeta and ImportMetaEnv interfaces
// to work around issues where `/// <reference types="vite/client" />`
// cannot be resolved by the TypeScript compiler.

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Add other environment variables here as needed.
  // For example: readonly VITE_SOME_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
