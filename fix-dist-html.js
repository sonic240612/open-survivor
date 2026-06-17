const fs = require('fs');
const path = './dist/index.html';
let html = fs.readFileSync(path, 'utf-8');
html = html.replace(/<script type="module" crossorigin/g, '<script');
fs.writeFileSync(path, html);
