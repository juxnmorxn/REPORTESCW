const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createIcons() {
  const iconsDir = path.join(__dirname, '../public/icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const svgContent = `
  <svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="100" fill="#0f172a"/>
    <rect x="20" y="20" width="472" height="472" rx="80" fill="url(#grad)" stroke="#0284c7" stroke-width="8"/>
    <path d="M120 180C200 100 312 100 392 180" stroke="#0284c7" stroke-width="32" stroke-linecap="round"/>
    <path d="M170 230C220 170 292 170 342 230" stroke="#38bdf8" stroke-width="28" stroke-linecap="round"/>
    <path d="M220 280C240 240 272 240 292 280" stroke="#7dd3fc" stroke-width="24" stroke-linecap="round"/>
    <circle cx="256" cy="350" r="28" fill="#38bdf8"/>
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
        <stop stop-color="#0f172a"/>
        <stop offset="1" stop-color="#1e293b"/>
      </linearGradient>
    </defs>
  </svg>
  `;

  const svgBuffer = Buffer.from(svgContent);

  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(iconsDir, 'icon-192x192.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512x512.png'));
  await sharp(svgBuffer).resize(64, 64).png().toFile(path.join(__dirname, '../public/favicon.ico'));

  console.log('✅ Iconos PWA y favicon generados exitosamente en public/');
}

createIcons().catch(err => console.error('Error generando iconos:', err));
