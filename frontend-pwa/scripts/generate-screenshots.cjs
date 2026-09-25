const fs = require('fs');
const zlib = require('zlib');

// Minimal PNG generator for solid/gradient rectangles without external dependencies
function createPng(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(2, 9); // Truecolor (RGB)
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data with filter byte 0 per line
  const rawBytes = Buffer.alloc(height * (1 + width * 3));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawBytes[offset++] = 0; // Filter None
    // subtle gradient variation by line
    const factor = 1 - (y / height) * 0.25;
    const curR = Math.min(255, Math.max(0, Math.round(r * factor)));
    const curG = Math.min(255, Math.max(0, Math.round(g * factor)));
    const curB = Math.min(255, Math.max(0, Math.round(b * factor)));
    for (let x = 0; x < width; x++) {
      rawBytes[offset++] = curR;
      rawBytes[offset++] = curG;
      rawBytes[offset++] = curB;
    }
  }

  const compressed = zlib.deflateSync(rawBytes);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.slice(4, 8 + len));
  chunk.writeInt32BE(crc, 8 + len);
  return chunk;
}

// Standard CRC32 table
let crcTable = null;
function makeCrcTable() {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
}

function crc32(buf) {
  if (!crcTable) crcTable = makeCrcTable();
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return crc ^ -1;
}

// Generate desktop wide screenshot (1280x800) and mobile narrow screenshot (750x1334)
const widePng = createPng(1280, 800, 4, 140, 115); // Teal theme (#048C73)
fs.writeFileSync('public/screenshots/desktop-wide.png', widePng);
console.log('Saved desktop-wide.png:', widePng.length, 'bytes');

const mobilePng = createPng(750, 1334, 4, 140, 115);
fs.writeFileSync('public/screenshots/mobile-narrow.png', mobilePng);
console.log('Saved mobile-narrow.png:', mobilePng.length, 'bytes');
