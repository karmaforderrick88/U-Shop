import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(' Starting production build...');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error(' .env file not found! Please create one from env.example');
  process.exit(1);
}

// Check required environment variables
const envContent = fs.readFileSync(envPath, 'utf8');
const requiredVars = ['SESSION_SECRET', 'FIREBASE_SERVICE_ACCOUNT_KEY'];
const missingVars = [];

requiredVars.forEach(varName => {
  if (!envContent.includes(`${varName}=`)) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.error(` Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log(' Installing dependencies...');
  const { execSync } = await import('child_process');
  try {
    execSync('npm install --production', { stdio: 'inherit' });
  } catch (error) {
    console.error(' Failed to install dependencies');
    process.exit(1);
  }
}

// Create production directories if they don't exist
const dirs = ['logs', 'tmp'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

console.log('Production build completed successfully!');
console.log(' Next steps:');
console.log('   1. Set NODE_ENV=production');
console.log('   2. Start the application: npm start');
console.log('   3. Or use PM2: pm2 start index.js --name "ecommerce"'); 