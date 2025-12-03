const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, 'public', 'electkms favicon.png');
const destFile = path.join(__dirname, 'src', 'app', 'icon.png');

try {
  fs.copyFileSync(sourceFile, destFile);
  console.log('✅ Successfully copied favicon to src/app/icon.png');
} catch (error) {
  console.error('❌ Error copying file:', error.message);
  process.exit(1);
}

