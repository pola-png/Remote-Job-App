const fs = require('fs');
const path = require('path');

const PT_LOAD = 1;

function patchFile(filePath) {
  let buf;
  try {
    buf = fs.readFileSync(filePath);
  } catch (e) {
    console.log(`  [16KB] Error reading ${filePath}: ${e.message}`);
    return false;
  }

  if (buf.length < 64 || buf[0] !== 0x7f || buf[1] !== 0x45 || buf[2] !== 0x4c || buf[3] !== 0x46) {
    return false;
  }

  const cls = buf[4]; // 1 = 32-bit, 2 = 64-bit
  const isLE = buf[5] === 1;
  let patched = false;

  const readU16 = (offset) => (isLE ? buf.readUInt16LE(offset) : buf.readUInt16BE(offset));
  const readU32 = (offset) => (isLE ? buf.readUInt32LE(offset) : buf.readUInt32BE(offset));
  const readU64 = (offset) => (isLE ? buf.readBigUInt64LE(offset) : buf.readBigUInt64BE(offset));
  const writeU32 = (val, offset) => (isLE ? buf.writeUInt32LE(val, offset) : buf.writeUInt32BE(val, offset));
  const writeU64 = (val, offset) => (isLE ? buf.writeBigUInt64LE(val, offset) : buf.writeBigUInt64BE(val, offset));

  if (cls === 2) {
    const phoff = Number(readU64(32));
    const phesz = readU16(54);
    const phn = readU16(56);
    for (let i = 0; i < phn; i++) {
      const ph = phoff + i * phesz;
      if (ph + 56 > buf.length) break;
      if (readU32(ph) === PT_LOAD) {
        const alignOffset = ph + 48;
        const align = readU64(alignOffset);
        if (align < 0x4000n) {
          writeU64(0x4000n, alignOffset);
          patched = true;
        }
      }
    }
  } else if (cls === 1) {
    const phoff = readU32(28);
    const phesz = readU16(42);
    const phn = readU16(44);
    for (let i = 0; i < phn; i++) {
      const ph = phoff + i * phesz;
      if (ph + 32 > buf.length) break;
      if (readU32(ph) === PT_LOAD) {
        const alignOffset = ph + 28;
        const align = readU32(alignOffset);
        if (align < 0x4000) {
          writeU32(0x4000, alignOffset);
          patched = true;
        }
      }
    }
  }

  if (patched) {
    try {
      fs.writeFileSync(filePath, buf);
      console.log(`  [16KB] Aligned ${path.basename(filePath)} to 16KB (0x4000)`);
      return true;
    } catch (e) {
      console.log(`  [16KB] Error writing ${filePath}: ${e.message}`);
      return false;
    }
  }
  return false;
}

function patchDir(dirPath) {
  let count = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      count += patchDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.so')) {
      if (patchFile(fullPath)) count++;
    }
  }
  return count;
}

const dirs = process.argv.slice(2);
for (const d of dirs) {
  if (fs.existsSync(d)) {
    console.log(`[16KB] Scanning directory: ${d}`);
    const c = patchDir(d);
    console.log(`[16KB] Successfully processed ${d} (${c} patched to 16KB)`);
  }
}

