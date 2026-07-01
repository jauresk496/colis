const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL || '/api';
const indexPath = path.join('dist', 'collis', 'browser', 'index.html');

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  html = html.replace(
    /<meta name="api-url" content="[^"]*">/,
    `<meta name="api-url" content="${apiUrl}">`
  );
  fs.writeFileSync(indexPath, html);
  console.log(`API_URL set to: ${apiUrl}`);
} else {
  console.error('index.html not found at', indexPath);
  process.exit(1);
}
