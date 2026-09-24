/* ============================================================
   画廊数据生成脚本
   扫描 assets/gallery/ 目录 → 生成 GALLERY_DATA → 写入 site-data.js
   用法：node scripts/generate-gallery.mjs
   ============================================================ */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const GALLERY_DIR = join(ROOT, 'assets', 'gallery');
const SITE_DATA_FILE = join(ROOT, 'js', 'data', 'site-data.js');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']);

function isImage(filename) {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return IMAGE_EXTS.has(ext);
}

function scanFolder(absPath) {
  const name = absPath.split(/[/\\]/).pop();
  const images = [];
  const children = [];

  let entries;
  try {
    entries = readdirSync(absPath, { withFileTypes: true });
  } catch {
    return { name, images, children };
  }

  // 排序：文件夹在前，文件在后；各自按名称排序
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name, 'zh');
  });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const child = scanFolder(join(absPath, entry.name));
      children.push(child);
    } else if (isImage(entry.name)) {
      const relPath = relative(ROOT, join(absPath, entry.name)).replace(/\\/g, '/');
      images.push({
        file: entry.name,
        path: './' + relPath
      });
    }
  }

  return { name, images, children };
}

function countImages(folder) {
  let count = folder.images.length;
  for (const child of folder.children) {
    count += countImages(child);
  }
  return count;
}

function countFolders(folder) {
  let count = folder.images.length > 0 || folder.children.length > 0 ? 1 : 0;
  for (const child of folder.children) {
    count += countFolders(child);
  }
  return count;
}

// ---- Main ----
console.log('Scanning: ' + GALLERY_DIR + '\n');

const tree = scanFolder(GALLERY_DIR);
const data = tree.children; // 顶层是一个虚拟根，取 children 即可

const totalFolders = data.reduce((sum, f) => sum + countFolders(f), 0);
const totalImages = data.reduce((sum, f) => sum + countImages(f), 0);

console.log('Found ' + totalFolders + ' folder(s), ' + totalImages + ' image(s):');
for (const folder of data) {
  const imgCount = countImages(folder);
  console.log('  ' + folder.name + (imgCount > 0 ? ' (' + imgCount + ' images)' : ' (empty)'));
  for (const child of folder.children) {
    console.log('    ' + child.name + ' (' + child.images.length + ' images)');
  }
}

// 生成 JS 代码
const json = JSON.stringify(data, null, 2);
const newBlock = 'const GALLERY_DATA = ' + json + ';';

// 读取 site-data.js 并替换 GALLERY_DATA 块
let content = readFileSync(SITE_DATA_FILE, 'utf-8');

// 匹配从 "const GALLERY_DATA = " 到对应的 "};" 之间的内容
const startMarker = 'const GALLERY_DATA = ';
const startIdx = content.indexOf(startMarker);
if (startIdx === -1) {
  console.error('ERROR: Could not find GALLERY_DATA in site-data.js');
  process.exit(1);
}

// 找到对应的结束分号（需要正确处理嵌套的 {}）
let depth = 0;
let endIdx = startIdx + startMarker.length;
let inString = false;
let stringChar = '';
for (let i = startIdx + startMarker.length; i < content.length; i++) {
  const ch = content[i];
  if (inString) {
    if (ch === '\\') { i++; continue; }
    if (ch === stringChar) { inString = false; }
    continue;
  }
  if (ch === '"' || ch === "'") { inString = true; stringChar = ch; continue; }
  if (ch === '{') depth++;
  if (ch === '}') {
    depth--;
    if (depth === 0) {
      endIdx = i + 1; // 包含 }
      if (content[endIdx] === ';') endIdx++; // 吃掉分号
      break;
    }
  }
}

const before = content.slice(0, startIdx);
const after = content.slice(endIdx);
const newContent = before + newBlock + '\n' + after;

writeFileSync(SITE_DATA_FILE, newContent, 'utf-8');
console.log('\n✓ Written GALLERY_DATA to site-data.js (' + newBlock.length + ' bytes)');
console.log('Done!');
