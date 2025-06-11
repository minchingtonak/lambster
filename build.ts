#!/usr/bin/env bun

/**
 * Build script for lambster library
 * Creates ESM, CommonJS, and minified distributions
 */

import { $ } from "bun";
import { rmSync, existsSync, mkdirSync } from "fs";

const DIST_DIR = "dist";
const SRC_ENTRY = "src/index.ts";

interface BuildConfig {
  format: "esm" | "cjs";
  outdir: string;
  minify?: boolean;
  sourcemap?: boolean;
  suffix?: string;
}

const buildConfigs: BuildConfig[] = [
  // ESM builds
  { format: "esm", outdir: `${DIST_DIR}/esm`, sourcemap: true },
  {
    format: "esm",
    outdir: `${DIST_DIR}/esm`,
    minify: true,
    sourcemap: true,
    suffix: ".min",
  },
  // CommonJS builds
  { format: "cjs", outdir: `${DIST_DIR}/cjs`, sourcemap: true },
  {
    format: "cjs",
    outdir: `${DIST_DIR}/cjs`,
    minify: true,
    sourcemap: true,
    suffix: ".min",
  },
];

async function cleanDist() {
  console.log("🧹 Cleaning dist directory...");
  if (existsSync(DIST_DIR)) {
    rmSync(DIST_DIR, { recursive: true, force: true });
  }
  mkdirSync(DIST_DIR, { recursive: true });
}

async function generateTypes() {
  console.log("📝 Generating TypeScript declarations...");
  try {
    await $`bunx tsc --project tsconfig.build.json`;
    console.log("✅ TypeScript declarations generated");
  } catch (error) {
    console.error("❌ Failed to generate TypeScript declarations:", error);
    process.exit(1);
  }
}

async function buildBundle(config: BuildConfig) {
  const {
    format,
    outdir,
    minify = false,
    sourcemap = false,
    suffix = "",
  } = config;

  console.log(
    `📦 Building ${format.toUpperCase()}${minify ? " (minified)" : ""}...`,
  );

  try {
    const result = await Bun.build({
      entrypoints: [SRC_ENTRY],
      outdir,
      format,
      minify,
      sourcemap: sourcemap ? "external" : "none",
      target: format === "esm" ? "browser" : "node",
      external: ["nearley", "ts-pattern"], // Keep as external dependencies
      splitting: format === "esm", // Enable code splitting for ESM
      naming: { entry: `index${suffix}.${format === "esm" ? "js" : "cjs"}` },
    });

    if (!result.success) {
      console.error(`❌ Build failed for ${format}:`, result.logs);
      process.exit(1);
    }

    console.log(
      `✅ ${format.toUpperCase()}${minify ? " (minified)" : ""} build complete`,
    );
  } catch (error) {
    console.error(`❌ Build error for ${format}:`, error);
    process.exit(1);
  }
}

async function copyTypesToRoot() {
  console.log("📁 Copying type definitions to root...");

  try {
    // Copy main index.d.ts to root of types directory
    await $`cp ${DIST_DIR}/types/src/index.d.ts ${DIST_DIR}/types/index.d.ts`;

    console.log("✅ Type definitions copied to root");
  } catch (error) {
    console.error("❌ Failed to copy type definitions:", error);
    process.exit(1);
  }
}

async function validateBuild() {
  console.log("🔍 Validating build outputs...");

  const requiredFiles = [
    `${DIST_DIR}/esm/index.js`,
    `${DIST_DIR}/esm/index.min.js`,
    `${DIST_DIR}/cjs/index.cjs`,
    `${DIST_DIR}/cjs/index.min.cjs`,
    `${DIST_DIR}/types/index.d.ts`,
  ];

  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      console.error(`❌ Missing required file: ${file}`);
      process.exit(1);
    }
  }

  console.log("✅ Build validation passed");
}

async function showBundleStats() {
  console.log("📊 Bundle Statistics:");

  try {
    const stats = await Promise.all([
      Bun.file(`${DIST_DIR}/esm/index.js`).size,
      Bun.file(`${DIST_DIR}/esm/index.min.js`).size,
      Bun.file(`${DIST_DIR}/cjs/index.cjs`).size,
      Bun.file(`${DIST_DIR}/cjs/index.min.cjs`).size,
    ]);

    console.log(`  ESM: ${(stats[0] / 1024).toFixed(2)}KB`);
    console.log(`  ESM (minified): ${(stats[1] / 1024).toFixed(2)}KB`);
    console.log(`  CommonJS: ${(stats[2] / 1024).toFixed(2)}KB`);
    console.log(`  CommonJS (minified): ${(stats[3] / 1024).toFixed(2)}KB`);
  } catch (error) {
    console.warn("⚠️ Could not calculate bundle stats:", error);
  }
}

async function main() {
  console.log("🚀 Starting lambster build process...\n");

  const startTime = Date.now();

  try {
    // Clean previous builds
    await cleanDist();

    // Generate TypeScript declarations first
    await generateTypes();

    // Build all configurations
    for (const config of buildConfigs) {
      await buildBundle(config);
    }

    // Copy type definitions to root
    await copyTypesToRoot();

    // Validate build outputs
    await validateBuild();

    // Show bundle statistics
    await showBundleStats();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 Build completed successfully in ${duration}s`);
  } catch (error) {
    console.error("\n💥 Build failed:", error);
    process.exit(1);
  }
}

// Run the build if this script is executed directly
if (import.meta.main) {
  main();
}

export { main as build };
