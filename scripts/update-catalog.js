#!/usr/bin/env node

/**
 * ApexMouse Catalog Generator & Validator
 * 
 * Automatically builds or validates `catalog.json` by aggregating all
 * `.apexplugin` bundles from the `plugins/` directory.
 * 
 * Usage:
 *   node scripts/update-catalog.js               # Generate / update catalog.json
 *   node scripts/update-catalog.js --check       # CI mode: fails if catalog is out of sync
 *   node scripts/update-catalog.js --validate-only # Only validate plugins without touching catalog
 *   node scripts/update-catalog.js --force       # Force bump lastUpdated even if unchanged
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const PLUGINS_DIR = path.join(ROOT_DIR, 'plugins');
const CATALOG_PATH = path.join(ROOT_DIR, 'catalog.json');

const VALID_CATEGORIES = new Set([
  'productivity',
  'coding',
  'design',
  'media',
  'gaming',
  'hardware',
]);

const PROTECTED_BUNDLE_IDS = new Set([
  'com.apple.loginwindow',
  'com.apple.SecurityAgent',
  'com.apple.SystemSettings',
]);

// Parse CLI flags
const args = process.argv.slice(2);
const isCheckMode = args.includes('--check');
const isValidateOnly = args.includes('--validate-only');
const isForce = args.includes('--force');

function getArgValue(flag) {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : null;
}

// Determine repository and branch
function getRepoInfo() {
  const cliRepo = getArgValue('--repo');
  if (cliRepo) return cliRepo;

  if (process.env.GITHUB_REPOSITORY) {
    return process.env.GITHUB_REPOSITORY;
  }

  try {
    const remoteUrl = execSync('git remote get-url origin', { cwd: ROOT_DIR, stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    const match = remoteUrl.match(/github\.com[:/]([^/]+\/[^/.]+?)(\.git)?$/);
    if (match) return match[1];
  } catch {
    // ignore git error
  }

  return 'manishshanker/ApexMousePlugins';
}

function getBranchInfo() {
  const cliBranch = getArgValue('--branch');
  if (cliBranch) return cliBranch;

  if (process.env.GITHUB_REF_NAME) {
    return process.env.GITHUB_REF_NAME;
  }

  return 'main';
}

function validatePlugin(file, data) {
  const errors = [];
  const warnings = [];

  const expectedFilename = `${data.id}.apexplugin`;
  if (file !== expectedFilename) {
    errors.push(`File name "${file}" does not match plugin id "${data.id}" (expected "${expectedFilename}")`);
  }

  if (!data.id || typeof data.id !== 'string') {
    errors.push('Missing or invalid "id"');
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push('Missing or invalid "name"');
  }

  if (!data.author || typeof data.author !== 'object' || !data.author.name) {
    errors.push('Missing or invalid "author.name"');
  }

  if (!data.version || typeof data.version !== 'string') {
    errors.push('Missing or invalid "version"');
  }

  if (!data.targetBundleId || typeof data.targetBundleId !== 'string') {
    errors.push('Missing or invalid "targetBundleId"');
  } else if (PROTECTED_BUNDLE_IDS.has(data.targetBundleId)) {
    errors.push(`Target bundle "${data.targetBundleId}" is a protected macOS system service`);
  }

  if (!data.targetAppName || typeof data.targetAppName !== 'string') {
    errors.push('Missing or invalid "targetAppName"');
  }

  if (!data.category || !VALID_CATEGORIES.has(data.category)) {
    errors.push(`Invalid category "${data.category}". Allowed: ${Array.from(VALID_CATEGORIES).join(', ')}`);
  }

  if (!data.description || typeof data.description !== 'string') {
    errors.push('Missing or invalid "description"');
  }

  if (!data.icon || typeof data.icon !== 'string') {
    errors.push('Missing or invalid "icon"');
  }

  if (!data.contents || typeof data.contents !== 'object') {
    errors.push('Missing or invalid "contents" object');
  } else {
    const { buttonMappings } = data.contents;
    if (buttonMappings && typeof buttonMappings === 'object') {
      const dangerousButtons = ['button0', 'button1', 'button0_click', 'button1_click', '0', '1'];
      for (const btn of dangerousButtons) {
        if (buttonMappings[btn]) {
          errors.push(`Button "${btn}" cannot be remapped. Left (0) and Right (1) clicks are immutable.`);
        }
      }
    }
  }

  return { errors, warnings };
}

function loadExistingCatalog() {
  if (!fs.existsSync(CATALOG_PATH)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  } catch (err) {
    console.warn(`⚠️ Warning: Failed to parse existing catalog.json: ${err.message}`);
    return null;
  }
}

function main() {
  console.log('🔍 Scanning plugins directory:', PLUGINS_DIR);

  if (!fs.existsSync(PLUGINS_DIR)) {
    console.error(`❌ Error: Plugins directory not found at ${PLUGINS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.apexplugin')).sort();
  if (files.length === 0) {
    console.error('❌ Error: No .apexplugin files found in plugins/');
    process.exit(1);
  }

  console.log(`📦 Found ${files.length} plugin bundle(s)`);

  const repo = getRepoInfo();
  const branch = getBranchInfo();
  console.log(`🌐 Base repository: ${repo} (branch: ${branch})`);

  let hasErrors = false;
  const seenIds = new Map();
  const loadedPlugins = [];

  for (const file of files) {
    const filePath = path.join(PLUGINS_DIR, file);
    let data;
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(raw);
    } catch (err) {
      console.error(`❌ [${file}]: Invalid JSON - ${err.message}`);
      hasErrors = true;
      continue;
    }

    const { errors, warnings } = validatePlugin(file, data);

    for (const warn of warnings) {
      console.warn(`⚠️  [${file}]: ${warn}`);
    }

    if (errors.length > 0) {
      for (const err of errors) {
        console.error(`❌ [${file}]: ${err}`);
      }
      hasErrors = true;
      continue;
    }

    if (seenIds.has(data.id)) {
      console.error(`❌ [${file}]: Duplicate plugin id "${data.id}" already defined in "${seenIds.get(data.id)}"`);
      hasErrors = true;
      continue;
    }

    seenIds.set(data.id, file);

    const isGlobal = data.targetBundleId === '*';
    const relativeFile = `plugins/${file}`;
    const downloadUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${relativeFile}`;
    const deepLinkUrl = `apexmouse://plugin/install?id=${encodeURIComponent(data.id)}`;

    const catalogEntry = {
      id: data.id,
      name: data.name,
      author: data.author,
      version: data.version,
      targetBundleId: data.targetBundleId,
      targetAppName: data.targetAppName,
      isGlobal,
      category: data.category,
      description: data.description,
      icon: data.icon,
      file: relativeFile,
      downloadUrl,
      deepLinkUrl,
      contents: data.contents,
    };

    if (data.emoji) {
      catalogEntry.emoji = data.emoji;
    }

    loadedPlugins.push({
      file,
      id: data.id,
      isGlobal,
      entry: catalogEntry,
    });
  }

  if (hasErrors) {
    console.error('\n❌ Plugin validation failed. Please resolve the errors above.');
    process.exit(1);
  }

  console.log('✅ All plugin bundles passed validation!');

  if (isValidateOnly) {
    console.log('🏁 Validation-only mode completed successfully.');
    process.exit(0);
  }

  const existingCatalog = loadExistingCatalog();

  // Order preservation:
  // 1. Maintain existing catalog ordering for known IDs.
  // 2. Insert new global plugins after existing globals.
  // 3. Append new app plugins at the end.
  const orderedEntries = [];
  const existingOrder = existingCatalog?.plugins?.map(p => p.id) || [];
  const loadedMap = new Map(loadedPlugins.map(p => [p.id, p]));

  // First place existing entries that are still present
  for (const id of existingOrder) {
    if (loadedMap.has(id)) {
      orderedEntries.push(loadedMap.get(id));
      loadedMap.delete(id);
    }
  }

  // Next, remaining new plugins: separate into global and app-specific
  const newGlobals = [];
  const newApps = [];
  for (const p of loadedMap.values()) {
    if (p.isGlobal) {
      newGlobals.push(p);
    } else {
      newApps.push(p);
    }
  }

  // Insert new globals right after the last global in orderedEntries
  let lastGlobalIndex = -1;
  for (let i = 0; i < orderedEntries.length; i++) {
    if (orderedEntries[i].isGlobal) lastGlobalIndex = i;
  }

  if (lastGlobalIndex >= 0) {
    orderedEntries.splice(lastGlobalIndex + 1, 0, ...newGlobals);
  } else {
    orderedEntries.unshift(...newGlobals);
  }

  // Append remaining new app plugins
  orderedEntries.push(...newApps);

  const finalPluginEntries = orderedEntries.map(p => p.entry);

  const newCatalog = {
    version: existingCatalog?.version || '1.0.0',
    lastUpdated: existingCatalog?.lastUpdated || new Date().toISOString(),
    totalPlugins: finalPluginEntries.length,
    plugins: finalPluginEntries,
  };

  // Check if anything changed compared to existing catalog (excluding lastUpdated)
  let hasContentChanges = false;

  if (!existingCatalog) {
    hasContentChanges = true;
  } else {
    const existingPluginsStr = JSON.stringify(existingCatalog.plugins);
    const newPluginsStr = JSON.stringify(finalPluginEntries);
    if (existingPluginsStr !== newPluginsStr || existingCatalog.totalPlugins !== newCatalog.totalPlugins) {
      hasContentChanges = true;
    }
  }

  if (hasContentChanges || isForce) {
    newCatalog.lastUpdated = new Date().toISOString();
  }

  const formattedJson = JSON.stringify(newCatalog, null, 2) + '\n';

  if (isCheckMode) {
    if (hasContentChanges) {
      console.error('\n❌ catalog.json is OUT OF SYNC with plugins/ directory!');
      console.error('Run `npm run update-catalog` (or `node scripts/update-catalog.js`) to regenerate it.');
      process.exit(1);
    }
    console.log('✨ catalog.json is fully up-to-date!');
    process.exit(0);
  }

  if (!hasContentChanges && !isForce) {
    console.log('✨ catalog.json is already up to date (no changes detected).');
    process.exit(0);
  }

  fs.writeFileSync(CATALOG_PATH, formattedJson, 'utf8');
  console.log(`\n🎉 Successfully updated catalog.json! (${finalPluginEntries.length} plugins registered)`);
  if (hasContentChanges) {
    const existingCount = existingCatalog?.plugins?.length || 0;
    console.log(`📊 Plugin count: ${existingCount} → ${finalPluginEntries.length}`);
  }
}

main();
