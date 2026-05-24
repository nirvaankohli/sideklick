#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');

if (process.platform !== 'darwin') {
  console.log('[cleanup:mac-downloads] This script only runs on macOS.');
  process.exit(0);
}

const downloadsDir = path.join(os.homedir(), 'Downloads');
const APP_PREFIX = 'SideKlick-';
const APP_SUFFIXES = ['.dmg', '.zip'];

if (!fs.existsSync(downloadsDir)) {
  console.log(`[cleanup:mac-downloads] Downloads folder not found: ${downloadsDir}`);
  process.exit(0);
}

const entries = fs.readdirSync(downloadsDir, { withFileTypes: true });
const candidates = entries
  .filter((entry) => entry.isFile())
  .map((entry) => {
    const fullPath = path.join(downloadsDir, entry.name);
    const lowerName = entry.name.toLowerCase();
    const isSideKlickBuild =
      entry.name.startsWith(APP_PREFIX) &&
      APP_SUFFIXES.some((suffix) => lowerName.endsWith(suffix));

    if (!isSideKlickBuild) {
      return null;
    }

    const stats = fs.statSync(fullPath);
    return {
      name: entry.name,
      fullPath,
      mtimeMs: stats.mtimeMs,
    };
  })
  .filter(Boolean)
  .sort((left, right) => right.mtimeMs - left.mtimeMs);

if (candidates.length <= 1) {
  console.log('[cleanup:mac-downloads] Nothing to delete.');
  process.exit(0);
}

const keep = candidates[0];
const toDelete = candidates.slice(1);

console.log(`[cleanup:mac-downloads] Keeping newest build: ${keep.name}`);

for (const file of toDelete) {
  try {
    fs.unlinkSync(file.fullPath);
    console.log(`[cleanup:mac-downloads] Deleted: ${file.name}`);
  } catch (error) {
    console.warn(
      `[cleanup:mac-downloads] Failed to delete ${file.name}: ${error.message}`,
    );
  }
}

console.log('[cleanup:mac-downloads] Done.');
