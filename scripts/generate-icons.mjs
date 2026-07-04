// Generates PWA PNG icons without any native/image dependencies.
// Draws a dark rounded background with a green checkmark, matching favicon.svg.
// Usage: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
mkdirSync(publicDir, { recursive: true });

// ---- CRC32 (for PNG chunks) ----
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Add filter byte (0) at the start of every scanline.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- Drawing helpers ----
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function drawIcon(size) {
  const bg = hexToRgb('#0f172a');
  const green = hexToRgb('#22c55e');
  const rgba = Buffer.alloc(size * size * 4);

  const radius = size * 0.22; // rounded-corner radius
  const half = size * 0.055; // checkmark half-thickness

  // Checkmark points (normalized from the 512 favicon).
  const pts = [
    [0.289 * size, 0.512 * size],
    [0.414 * size, 0.637 * size],
    [0.711 * size, 0.34 * size],
  ];

  const inRoundedRect = (x, y) => {
    const rx = Math.max(radius - x, x - (size - radius), 0);
    const ry = Math.max(radius - y, y - (size - radius), 0);
    return Math.hypot(rx, ry) <= radius;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const cx = x + 0.5;
      const cy = y + 0.5;

      if (!inRoundedRect(cx, cy)) {
        rgba[i] = rgba[i + 1] = rgba[i + 2] = rgba[i + 3] = 0; // transparent
        continue;
      }

      // Background.
      let r = bg[0];
      let g = bg[1];
      let b = bg[2];

      // Distance to the checkmark (two segments).
      const d = Math.min(
        distToSegment(cx, cy, pts[0][0], pts[0][1], pts[1][0], pts[1][1]),
        distToSegment(cx, cy, pts[1][0], pts[1][1], pts[2][0], pts[2][1]),
      );
      // Antialiased edge over ~1.5px.
      const alpha = 1 - Math.min(1, Math.max(0, (d - half) / 1.5));
      if (alpha > 0) {
        r = Math.round(r + (green[0] - r) * alpha);
        g = Math.round(g + (green[1] - g) * alpha);
        b = Math.round(b + (green[2] - b) * alpha);
      }

      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = 255;
    }
  }
  return encodePng(size, size, rgba);
}

const targets = [
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['apple-touch-icon.png', 180],
];

for (const [name, size] of targets) {
  const png = drawIcon(size);
  writeFileSync(join(publicDir, name), png);
  console.log(`Wrote public/${name} (${size}x${size}, ${png.length} bytes)`);
}
