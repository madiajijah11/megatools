#!/usr/bin/env node

/**
 * MegaTools Automated Workflow & Quality Gate Validator
 * Usage: npm run verify
 */

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { execSync } from "child_process";

console.log("\n🔍 [MegaTools Validator] Running automated workflow check...\n");

let hasErrors = false;

// 1. Check ToolLayout coverage
const appDir = path.join(process.cwd(), "src", "app");
const excludedDirs = new Set(["about", "privacy", "terms", "changelog"]);
const appEntries = fs.readdirSync(appDir).filter((d) => {
  const p = path.join(appDir, d);
  return fs.statSync(p).isDirectory() && !excludedDirs.has(d);
});

console.log(`1. Checking <ToolLayout /> coverage across ${appEntries.length} tools...`);
const missingToolLayout = [];

for (const slug of appEntries) {
  const toolDir = path.join(appDir, slug);
  const clientFile = fs.readdirSync(toolDir).find((f) => f.endsWith("Client.tsx"));
  if (!clientFile) {
    console.error(`   ❌ [Missing Client] src/app/${slug}/ has no *Client.tsx component!`);
    hasErrors = true;
    continue;
  }

  const content = fs.readFileSync(path.join(toolDir, clientFile), "utf8");
  if (!content.includes("<ToolLayout")) {
    missingToolLayout.push(`src/app/${slug}/${clientFile}`);
  }
}

if (missingToolLayout.length > 0) {
  console.error("   ❌ [ToolLayout Error] The following tools do not use <ToolLayout />:");
  missingToolLayout.forEach((f) => console.error(`      - ${f}`));
  hasErrors = true;
} else {
  console.log(`   ✅ 100% ToolLayout coverage (${appEntries.length}/${appEntries.length} tools verified).`);
}

// 2. Check tool-data.ts synchronization
console.log("\n2. Checking TOOLS & TOOL_CATEGORIES synchronization in src/lib/tool-data.ts...");
try {
  const tdUrl = pathToFileURL(path.join(process.cwd(), "src", "lib", "tool-data.ts")).href;
  const toolDataModule = await import(tdUrl);
  const toolsList = toolDataModule.TOOLS || [];
  const categories = toolDataModule.TOOL_CATEGORIES || [];

  const categoryToolIds = new Set();
  categories.forEach((cat) => cat.toolIds.forEach((id) => categoryToolIds.add(id)));

  const toolIds = toolsList.map((t) => t.id);
  const missingInCategories = toolIds.filter((id) => !categoryToolIds.has(id));
  const missingInTools = Array.from(categoryToolIds).filter((id) => !toolIds.includes(id));

  if (missingInCategories.length > 0) {
    console.error("   ❌ [Category Sync Error] Tools present in TOOLS but missing in TOOL_CATEGORIES:");
    missingInCategories.forEach((id) => console.error(`      - "${id}"`));
    hasErrors = true;
  }

  if (missingInTools.length > 0) {
    console.error("   ❌ [Registry Sync Error] Tool IDs present in TOOL_CATEGORIES but missing in TOOLS:");
    missingInTools.forEach((id) => console.error(`      - "${id}"`));
    hasErrors = true;
  }

  if (missingInCategories.length === 0 && missingInTools.length === 0) {
    console.log(`   ✅ Perfect Category Sync: ${toolIds.length} tools registered across ${categories.length} categories.`);
  }
} catch (err) {
  console.error(`   ❌ [tool-data Import Error] ${err.message}`);
  hasErrors = true;
}

// 3. Check changelog-data.ts
console.log("\n3. Checking changelog entries in src/lib/changelog-data.ts...");
try {
  const clUrl = pathToFileURL(path.join(process.cwd(), "src", "lib", "changelog-data.ts")).href;
  const clModule = await import(clUrl);
  const changelog = clModule.CHANGELOG_ITEMS || [];

  if (changelog.length === 0) {
    console.error("   ❌ [Changelog Error] CHANGELOG_ITEMS array is empty!");
    hasErrors = true;
  } else {
    const invalidDates = changelog.filter((item) => !/^\d{4}-\d{2}-\d{2}$/.test(item.date));
    if (invalidDates.length > 0) {
      console.error("   ❌ [Changelog Date Error] Invalid date formats found in changelog:");
      invalidDates.forEach((i) => console.error(`      - ID: ${i.id}, Date: "${i.date}"`));
      hasErrors = true;
    } else {
      console.log(`   ✅ Valid Changelog: ${changelog.length} entries verified (Latest: ${changelog[0].id}).`);
    }
  }
} catch (err) {
  console.error(`   ❌ [changelog-data Import Error] ${err.message}`);
  hasErrors = true;
}

// 4. Check TypeScript Compiler
console.log("\n4. Running TypeScript Type Check (tsc --noEmit)...");
try {
  execSync("npx tsc --noEmit", { stdio: "inherit" });
  console.log("   ✅ TypeScript: Zero type errors.");
} catch {
  console.error("   ❌ [TypeScript Error] tsc --noEmit failed with errors.");
  hasErrors = true;
}

console.log("\n-------------------------------------------------------------");
if (hasErrors) {
  console.error("🚨 [VERIFICATION FAILED] Please fix the errors above before committing!\n");
  process.exit(1);
} else {
  console.log("🎉 [VERIFICATION PASSED] All workflow rules and quality checks satisfied!\n");
}
