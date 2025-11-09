const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Creating cPanel deployment package...\n');

const packageName = 'hotel-frontend-cpanel.zip';
const filesToInclude = [
  '.next',
  'public',
  'node_modules',
  'package.json',
  'package-lock.json',
  'next.config.ts',
  'server.js',
  '.env.production',
];

// Check if .next exists
if (!fs.existsSync('.next')) {
  console.error('❌ Error: .next folder not found. Run "npm run build" first.');
  process.exit(1);
}

// Create list of files for zip
const includeArgs = filesToInclude
  .filter(file => fs.existsSync(file))
  .join(' ');

try {
  // Remove old package if exists
  if (fs.existsSync(packageName)) {
    console.log(`🗑️  Removing old ${packageName}...`);
    fs.unlinkSync(packageName);
  }

  // Create zip package
  console.log('📦 Creating zip package...');
  execSync(`zip -r ${packageName} ${includeArgs}`, { stdio: 'inherit' });

  // Get file size
  const stats = fs.statSync(packageName);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n✅ Package created successfully!');
  console.log(`📦 Package: ${packageName}`);
  console.log(`📊 Size: ${fileSizeInMB} MB`);
  console.log('\n📋 Next steps for cPanel deployment:');
  console.log('1. Upload this zip file to your cPanel File Manager');
  console.log('2. Extract the zip file in your web root (e.g., public_html)');
  console.log('3. Set up Node.js app in cPanel:');
  console.log('   - Application root: /home/username/public_html');
  console.log('   - Application URL: your-domain.com');
  console.log('   - Application startup file: server.js');
  console.log('   - Node.js version: 18.x or higher');
  console.log('4. Set environment variables in cPanel (copy from .env.production)');
  console.log('5. Restart the application');

} catch (error) {
  console.error('❌ Error creating package:', error.message);
  process.exit(1);
}
