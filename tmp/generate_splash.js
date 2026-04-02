const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../public/logo.svg');
const destPath = path.join(__dirname, '../public/logo-splash.svg');

const originalSVG = fs.readFileSync(srcPath, 'utf8');

// Extract everything inside the root <svg ...> tag
const match = originalSVG.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
if (match && match[1]) {
  const innerPaths = match[1];

  const newSVG = `<svg width="1150" height="1150" viewBox="0 0 1150 1150" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(0, 389)">
    ${innerPaths}
  </g>
  <text x="575" y="1000" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle" opacity="0.9" letter-spacing="4">by Tahseena</text>
</svg>`;

  fs.writeFileSync(destPath, newSVG, 'utf8');
  console.log('Successfully created logo-splash.svg!');
} else {
  console.error('Failed to parse original logo.svg');
}
