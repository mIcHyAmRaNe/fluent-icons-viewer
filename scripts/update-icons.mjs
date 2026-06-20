#!/usr/bin/env node

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  rmSync,
} from "fs";
import { join, basename, dirname, relative } from "path";
import { execSync } from "child_process";

const OUR_PROJECT = join(import.meta.dirname, "..");

const [, , MSFT_PROJECT_PATH, ...flags] = process.argv;
const FORCE = flags.includes("--force");

const FILLED_VARIANT = "filled";
const REGULAR_VARIANT = "regular";

if (!MSFT_PROJECT_PATH) {
  console.error(
    "Usage: node scripts/update-icons.mjs <path-to-fluentui-system-icons> [--force]",
  );
  console.error(
    "  --force: Regenerate all Vue components even if they already exist",
  );
  process.exit(1);
}

if (!existsSync(MSFT_PROJECT_PATH)) {
  console.error(
    `Error: Microsoft project path does not exist: ${MSFT_PROJECT_PATH}`,
  );
  process.exit(1);
}

const assetsDir = join(MSFT_PROJECT_PATH, "assets");
if (!existsSync(assetsDir)) {
  console.error(`Error: No "assets" directory found in ${MSFT_PROJECT_PATH}`);
  process.exit(1);
}

const OUR_SVG_DIR = join(OUR_PROJECT, "public", "icons", "fluent");
const FILLED_VUE_DIR = join(OUR_PROJECT, "components", "FluentIcon", "Filled");
const OUTLINED_VUE_DIR = join(
  OUR_PROJECT,
  "components",
  "FluentIcon",
  "Outlined",
);
const JSON_FLAT_DIR = join(OUR_PROJECT, "assets", "icons");
const JSON_CATEGORY_DIR = join(OUR_PROJECT, "assets", "icons", "fluent");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function snakeToPascal(str) {
  return str
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

function extractIconName(filename) {
  const name = basename(filename, ".svg");
  const parts = name.split("_");
  // ic_fluent_<name>_24_filled.svg  -> parts: ['ic','fluent','access','time','24','filled']
  // The icon name is everything between index 2 and -2 (the size), excluding variant
  const iconNameParts = parts.slice(2, -2);
  return snakeToPascal(iconNameParts.join("_"));
}

function getVariant(filename) {
  const name = basename(filename, ".svg");
  const parts = name.split("_");
  const variant = parts[parts.length - 1]; // filled or regular
  return variant;
}

function getSize(filename) {
  const name = basename(filename, ".svg");
  const parts = name.split("_");
  return parts[parts.length - 2]; // e.g. "24"
}

function getCategoryFromPath(filePath) {
  // Path pattern: <MSFT_PROJECT>/assets/<Category Name>/SVG/ic_fluent_*.svg
  const parts = filePath.replace(/\\/g, "/").split("/");
  const assetsIndex = parts.indexOf("assets");
  if (assetsIndex !== -1 && parts.length > assetsIndex + 1) {
    return parts[assetsIndex + 1];
  }
  return "Uncategorized";
}

function parseSvgPaths(svgContent) {
  const paths = [];
  const pathRegex = /<path\s+([^>]*?)\/>/g;
  let match;
  while ((match = pathRegex.exec(svgContent)) !== null) {
    const attrs = match[1];
    const dMatch = attrs.match(/\bd\s*=\s*"([^"]*)"/);
    const fillMatch = attrs.match(/\bfill\s*=\s*"([^"]*)"/);
    if (dMatch) {
      paths.push({
        d: dMatch[1],
        fill: fillMatch ? fillMatch[1] : null,
      });
    }
  }
  return paths;
}

function generateVueComponent(paths, componentName, isFilled) {
  const lines = [];
  lines.push("<template>");
  lines.push(
    '  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">',
  );
  lines.push(
    '    <linearGradient v-if="fill === \'url(#g1)\'" id="g1" :gradientTransform="`rotate(${angle})`">',
  );
  lines.push(
    '      <stop class="main-stop" offset="0%" :stop-color="start" />',
  );
  lines.push('      <stop class="alt-stop" offset="100%" :stop-color="end" />');
  lines.push("    </linearGradient>");
  lines.push(
    '    <radialGradient v-if="fill === \'url(#g2)\'" id="g2" cx = "50%" cy = "50%" r = "50%">',
  );
  lines.push('      <stop :stop-color="start" offset = "0%"/>');
  lines.push('      <stop :stop-color="end" offset = "100%"/>');
  lines.push("    </radialGradient>");
  for (const p of paths) {
    if (p.fill && p.fill !== "#212121") {
      // Special fill color (e.g. rainbow FlagPride) - keep hardcoded
      lines.push(`    <path fill="${p.fill}" d="${p.d}" />`);
    } else {
      lines.push(
        `    <path :fill="fill" :fill-opacity="opacity" d="${p.d}" />`,
      );
    }
  }
  lines.push("  </svg>");
  lines.push("</template>");
  lines.push("");
  lines.push("<script>");
  lines.push('import icon from "../../../mixins/icon.js"');
  lines.push("");
  lines.push("export default {");
  lines.push(`  name: '${componentName}',`);
  lines.push("  mixins: [icon]");
  lines.push("};");
  lines.push("</script>");
  return lines.join("\n") + "\n";
}

function getComponentName(iconName, variant) {
  const prefix =
    variant === FILLED_VARIANT ? "FluentIconFilled" : "FluentIconOutlined";
  return `${prefix}${iconName}`;
}

function getVueFilename(iconName) {
  return `${iconName}.vue`;
}

// ---------------------------------------------------------------------------
// Step 1: Find all 24px SVGs in Microsoft's project
// ---------------------------------------------------------------------------

console.log("🔍 Scanning Microsoft project for 24px icons...");

const msftSvgs = [];
function walkAssets(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAssets(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".svg")) {
      const size = getSize(entry.name);
      const variant = getVariant(entry.name);
      // Only process 24px filled/regular variants (skip _color, _accent, etc.)
      if (
        size === "24" &&
        (variant === FILLED_VARIANT || variant === REGULAR_VARIANT)
      ) {
        msftSvgs.push(fullPath);
      }
    }
  }
}
walkAssets(assetsDir);

console.log(`  Found ${msftSvgs.length} 24px SVG icons`);

const filledSvgs = msftSvgs.filter((s) => getVariant(s) === FILLED_VARIANT);
const regularSvgs = msftSvgs.filter((s) => getVariant(s) === REGULAR_VARIANT);

console.log(`  - ${filledSvgs.length} filled`);
console.log(`  - ${regularSvgs.length} regular`);

// ---------------------------------------------------------------------------
// Step 2: Copy all 24px SVGs to a temp directory, then run SVGO
// ---------------------------------------------------------------------------

const TEMP_DIR = join(OUR_PROJECT, ".tmp-icon-sync");
const RAW_COPY_DIR = join(TEMP_DIR, "raw");
const CLEANED_DIR = join(TEMP_DIR, "cleaned");

if (existsSync(TEMP_DIR)) {
  rmSync(TEMP_DIR, { recursive: true });
}
mkdirSync(RAW_COPY_DIR, { recursive: true });
mkdirSync(CLEANED_DIR, { recursive: true });

console.log("\n📂 Copying 24px SVGs to temp directory...");

for (const svgPath of msftSvgs) {
  const filename = basename(svgPath);
  copyFileSync(svgPath, join(RAW_COPY_DIR, filename));
}

console.log(`  Copied ${msftSvgs.length} SVGs to temp directory`);

console.log("\n🧹 Running SVGO to clean icons...");

const svgoBin = join(OUR_PROJECT, "node_modules", ".bin", "svgo");

const svgoConfig = {
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          removeEmptyContainers: false,
          collapseGroups: false,
        },
      },
    },
    "removeDimensions",
    {
      name: "convertColors",
      params: {
        names2hex: true,
        currentColor: false,
      },
    },
    {
      name: "convertPathData",
      params: {
        noSpaceAfterFlags: false,
      },
    },
  ],
};

writeFileSync(
  join(TEMP_DIR, "svgo.config.mjs"),
  `export default ${JSON.stringify(svgoConfig, null, 2)};\n`,
);

try {
  execSync(
    `"${svgoBin}" --config="${join(TEMP_DIR, "svgo.config.mjs")}" -f "${RAW_COPY_DIR}" -r -o "${CLEANED_DIR}"`,
    { stdio: "inherit", timeout: 120000 },
  );
} catch (err) {
  console.error("SVGO processing failed:", err.message);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Step 2b: Collect cleaned files and identify dropped files
// ---------------------------------------------------------------------------

const cleanedFiles = [];
function collectCleaned(dir) {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) collectCleaned(full);
      else if (e.name.endsWith(".svg")) cleanedFiles.push(full);
    }
  } catch {}
}
collectCleaned(CLEANED_DIR);
console.log(`\n  Cleaned ${cleanedFiles.length} SVGs`);

// ---------------------------------------------------------------------------
// Identify which files SVGO dropped
// ---------------------------------------------------------------------------

const cleanedFilenames = new Set(cleanedFiles.map((f) => basename(f)));
const droppedFiles = msftSvgs.filter((s) => !cleanedFilenames.has(basename(s)));

if (droppedFiles.length > 0) {
  console.warn(
    `\n  ⚠️  SVGO dropped ${droppedFiles.length} files (will use raw fallback):`,
  );

  // Group dropped files by a guessed reason by inspecting raw SVG content
  const droppedReport = [];

  for (const f of droppedFiles) {
    const filename = basename(f);
    const rawContent = readFileSync(f, "utf-8");

    // Guess why SVGO dropped it
    const hasPath = /<path/i.test(rawContent);
    const hasRect = /<rect/i.test(rawContent);
    const hasCircle = /<circle/i.test(rawContent);
    const hasPolygon = /<polygon/i.test(rawContent);
    const hasGroup = /<g[\s>]/i.test(rawContent);
    const isEmpty = /<svg[^>]*>\s*<\/svg>/i.test(rawContent);

    let guessedReason = "unknown";
    if (isEmpty) {
      guessedReason = "empty SVG";
    } else if (!hasPath && (hasRect || hasCircle || hasPolygon)) {
      guessedReason = "no <path> elements (uses rect/circle/polygon)";
    } else if (!hasPath && hasGroup) {
      guessedReason = "no <path> elements (uses groups only)";
    } else if (!hasPath) {
      guessedReason = "no <path> elements";
    } else {
      guessedReason = "SVGO optimization removed all content";
    }

    droppedReport.push({ filename, guessedReason });
    console.warn(`     - ${filename}  [${guessedReason}]`);
  }

  // Write a detailed report
  const reportLines = [
    `SVGO Dropped Files Report`,
    `Generated: ${new Date().toISOString()}`,
    `Total dropped: ${droppedFiles.length} of ${msftSvgs.length}`,
    "",
    "Filename | Guessed Reason",
    "-".repeat(80),
    ...droppedReport.map((r) => `${r.filename} | ${r.guessedReason}`),
    "",
    "Summary by reason:",
  ];

  // Count by reason
  const reasonCounts = {};
  for (const r of droppedReport) {
    reasonCounts[r.guessedReason] = (reasonCounts[r.guessedReason] || 0) + 1;
  }
  for (const [reason, count] of Object.entries(reasonCounts)) {
    reportLines.push(`  ${count}x  ${reason}`);
  }

  const reportPath = join(OUR_PROJECT, "svgo-dropped-report.txt");
  writeFileSync(reportPath, reportLines.join("\n") + "\n");
  console.warn(`\n  📄 Full report written to: ${reportPath}`);

  // Use raw files as fallback for dropped ones
  console.warn(
    `\n  🔄 Applying raw fallbacks for ${droppedFiles.length} dropped files...`,
  );
  let fallbackCount = 0;
  for (const rawPath of droppedFiles) {
    const filename = basename(rawPath);
    const fallbackDst = join(CLEANED_DIR, filename);
    copyFileSync(rawPath, fallbackDst);
    cleanedFiles.push(fallbackDst);
    fallbackCount++;
  }
  console.warn(`  ✅ Applied ${fallbackCount} raw fallbacks`);
} else {
  console.log("  ✅ No files dropped by SVGO — all icons cleaned successfully");
}

console.log(`\n  Total SVGs ready for processing: ${cleanedFiles.length}`);

// Sanity check
const uniqueSourceCount = new Set(msftSvgs.map((p) => basename(p))).size;

if (cleanedFiles.length !== uniqueSourceCount) {
  console.warn(
    `  ⚠️  Cleaned files (${cleanedFiles.length}) != unique source files (${uniqueSourceCount})`,
  );
}

// ---------------------------------------------------------------------------
// Step 3: Copy cleaned SVGs to our project
// ---------------------------------------------------------------------------

console.log("\n📋 Copying cleaned SVGs to public/icons/fluent/...");

if (!existsSync(OUR_SVG_DIR)) {
  mkdirSync(OUR_SVG_DIR, { recursive: true });
}

let copied = 0;
let unchanged = 0;
const processedSvgs = new Map(); // svgFilename -> { category, variant, iconName }

for (const src of cleanedFiles) {
  const filename = basename(src);
  const dst = join(OUR_SVG_DIR, filename);

  const svgContent = readFileSync(src, "utf-8");
  const msftOriginalPath = msftSvgs.find((s) => basename(s) === filename);

  const existingContent = existsSync(dst) ? readFileSync(dst, "utf-8") : null;

  if (existingContent !== null && existingContent === svgContent) {
    unchanged++;
  } else {
    writeFileSync(dst, svgContent);
    copied++;
  }

  const iconName = extractIconName(filename);
  const variant = getVariant(filename);
  const category = msftOriginalPath
    ? getCategoryFromPath(msftOriginalPath)
    : "Uncategorized";

  processedSvgs.set(filename, { iconName, variant, category });
}

console.log(`  Copied/updated: ${copied}, already up-to-date: ${unchanged}`);

// ---------------------------------------------------------------------------
// Step 4: Generate/update Vue components
// ---------------------------------------------------------------------------

console.log("\n⚙️  Generating Vue components...");

if (!existsSync(FILLED_VUE_DIR)) mkdirSync(FILLED_VUE_DIR, { recursive: true });
if (!existsSync(OUTLINED_VUE_DIR))
  mkdirSync(OUTLINED_VUE_DIR, { recursive: true });

let vueCreated = 0;
let vueSkipped = 0;

for (const [svgFilename, info] of processedSvgs) {
  const { iconName, variant } = info;
  const targetDir =
    variant === FILLED_VARIANT ? FILLED_VUE_DIR : OUTLINED_VUE_DIR;
  const vueFilename = getVueFilename(iconName);
  const vuePath = join(targetDir, vueFilename);
  const componentName = getComponentName(iconName, variant);

  if (existsSync(vuePath) && !FORCE) {
    vueSkipped++;
    continue;
  }

  const svgPath = join(OUR_SVG_DIR, svgFilename);
  const svgContent = readFileSync(svgPath, "utf-8");
  const paths = parseSvgPaths(svgContent);
  const vueContent = generateVueComponent(
    paths,
    componentName,
    variant === FILLED_VARIANT,
  );

  writeFileSync(vuePath, vueContent);
  vueCreated++;
}

console.log(`  Created: ${vueCreated}, skipped (already exist): ${vueSkipped}`);

// ---------------------------------------------------------------------------
// Step 5: Update JSON metadata files
// ---------------------------------------------------------------------------

console.log("\n📝 Updating JSON metadata files...");

function buildJsonEntries(svgMap, variant, includeCategory = false) {
  const entries = [];
  for (const [svgFilename, info] of svgMap) {
    if (info.variant !== variant) continue;
    const entry = {
      name: info.iconName,
      componentName: getComponentName(info.iconName, variant),
      svgFileName: svgFilename,
    };
    if (includeCategory) {
      entry.category = info.category;
    }
    entries.push(entry);
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  return entries;
}

// Update the flat JSON files (used by pages)
const flatFilledEntries = buildJsonEntries(
  processedSvgs,
  FILLED_VARIANT,
  false,
);
const flatRegularEntries = buildJsonEntries(
  processedSvgs,
  REGULAR_VARIANT,
  false,
);

if (!existsSync(JSON_FLAT_DIR)) mkdirSync(JSON_FLAT_DIR, { recursive: true });

writeFileSync(
  join(JSON_FLAT_DIR, "filled.json"),
  JSON.stringify(flatFilledEntries, null, 2) + "\n",
);
writeFileSync(
  join(JSON_FLAT_DIR, "outlined.json"),
  JSON.stringify(flatRegularEntries, null, 2) + "\n",
);

console.log(`  assets/icons/filled.json: ${flatFilledEntries.length} entries`);
console.log(
  `  assets/icons/outlined.json: ${flatRegularEntries.length} entries`,
);

// Update the categorized JSON files
if (!existsSync(JSON_CATEGORY_DIR))
  mkdirSync(JSON_CATEGORY_DIR, { recursive: true });

const catFilledEntries = buildJsonEntries(processedSvgs, FILLED_VARIANT, true);
const catRegularEntries = buildJsonEntries(
  processedSvgs,
  REGULAR_VARIANT,
  true,
);

writeFileSync(
  join(JSON_CATEGORY_DIR, "filled.json"),
  JSON.stringify(catFilledEntries, null, 2) + "\n",
);
writeFileSync(
  join(JSON_CATEGORY_DIR, "outlined.json"),
  JSON.stringify(catRegularEntries, null, 2) + "\n",
);

console.log(
  `  assets/icons/fluent/filled.json: ${catFilledEntries.length} entries`,
);
console.log(
  `  assets/icons/fluent/outlined.json: ${catRegularEntries.length} entries`,
);

// ---------------------------------------------------------------------------
// Step 6: Clean up temp directory
// ---------------------------------------------------------------------------

console.log("\n🧹 Cleaning up temporary files...");
rmSync(TEMP_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log("\n✅ Update complete!");
console.log(`   SVG files: ${copied} copied/updated, ${unchanged} unchanged`);
console.log(`   Vue components: ${vueCreated} created, ${vueSkipped} skipped`);
console.log(`   JSON metadata: 4 files updated`);

if (droppedFiles.length > 0) {
  console.log(
    `\n   ⚠️  ${droppedFiles.length} icons used raw fallback (SVGO dropped them)`,
  );
  console.log(`   📄 See svgo-dropped-report.txt for details`);
}

if (vueSkipped > 0 && !FORCE) {
  console.log(
    "\n💡 Tip: Re-run with --force to regenerate all Vue components (for path updates).",
  );
}
