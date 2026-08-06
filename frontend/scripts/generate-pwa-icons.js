const sharp = require('sharp');
const fs = require('fs');

// Buat folder icons jika belum ada
if (!fs.existsSync('public/icons')) {
  fs.mkdirSync('public/icons', { recursive: true });
}

// Fungsi untuk membuat icon dengan huruf D
async function createIcon(size, filename) {
  // Buat SVG dengan huruf D
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
    <text x="${size/2}" y="${size * 0.68}" font-family="Arial, sans-serif" font-size="${size * 0.55}" font-weight="bold" fill="white" text-anchor="middle">D</text>
  </svg>`;

  // Convert SVG ke PNG menggunakan sharp
  await sharp(Buffer.from(svg))
    .png()
    .toFile(filename);
  
  console.log(`✅ ${filename} created`);
}

// Buat icon untuk berbagai ukuran
createIcon(192, 'public/icons/icon-192x192.png');
createIcon(512, 'public/icons/icon-512x512.png');
createIcon(64, 'public/favicon.png');
createIcon(16, 'public/favicon.ico');

console.log('🎨 All PWA icons created!');
