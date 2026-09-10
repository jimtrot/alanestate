import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
const out = '/Users/jamestrotter/Projects/Alan-Estate/site/public/';
const mark = (x, y, s, ink='#1c1a17') => `<g transform="translate(${x} ${y}) scale(${s/32})">
  <rect x="1.5" y="1.5" width="29" height="29" rx="7" fill="none" stroke="${ink}" stroke-width="1.5"/>
  <path d="M7.5 23.5C11.5 23.5 12.5 12 17.5 12c3.4 0 3.8 4.8 6.2 4.8" fill="none" stroke="${ink}" stroke-width="1.75" stroke-linecap="round"/>
  <circle cx="24.5" cy="9.5" r="2.4" fill="#b8642a"/></g>`;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f6f1e9"/>
  <rect x="0" y="0" width="1200" height="8" fill="#2e5a4c"/>
  ${mark(80, 88, 56)}
  <text x="156" y="130" font-family="Georgia, 'Times New Roman', serif" font-size="40" fill="#1c1a17">Alan Estate</text>
  <text x="80" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="74" fill="#1c1a17">What to do when</text>
  <text x="80" y="386" font-family="Georgia, 'Times New Roman', serif" font-size="74" fill="#1c1a17">someone dies in Australia.</text>
  <text x="80" y="470" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#45403a">A free, step-by-step plan — personalised to your state, the will, super and SMSF.</text>
  <text x="80" y="560" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="#8f4a1c" letter-spacing="3">ALANESTATE.COM</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile(out + 'og.png');
const icon = (size, pad) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size*0.2}" fill="#f6f1e9"/>${mark(pad, pad, size - pad*2)}</svg>`;
await sharp(Buffer.from(icon(180, 18))).png().toFile(out + 'apple-touch-icon.png');
await sharp(Buffer.from(icon(512, 48))).png().toFile(out + 'icon-512.png');
console.log('images written');
