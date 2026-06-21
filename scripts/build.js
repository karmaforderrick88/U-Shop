import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('starting production build...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 1. Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ ERROR: .env file not found!\n');
  console.error('   Please create a .env file from .env.example:');
  console.error('   1. Copy .env.example to .env');
  console.error('   2. Fill in all required values');
  console.error('   3. Run this script again\n');
  console.error('   Quick start:');
  console.error('   cp .env.example .env');
  console.error('   nano .env  # or use your preferred editor\n');
  process.exit(1);
}

console.log('.env file found');

// 2. Validate environment by importing config (this will throw if invalid)
console.log('🔍 Validating environment variables...\n');
try {
  // Import config which runs validation
  await import('../app/config.js');
  console.log(' Environment validation passed\n');
} catch (error) {
  console.error('❌ Environment validation failed:\n');
  console.error(error.message);
  console.error('\nFix the issues above and try again.\n');
  process.exit(1);
}

// 3. Check if node_modules exists
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log(' Installing dependencies...\n');
  const { execSync } = await import('child_process');
  try {
    execSync('npm install --production', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('\n Dependencies installed successfully\n');
  } catch (error) {
    console.error('\n❌ Failed to install dependencies');
    console.error('Try running: npm install\n');
    process.exit(1);
  }
} else {
  console.log(' Dependencies already installed\n');
}

// 4. Create required production directories
const requiredDirs = [
  { path: 'logs', description: 'Application logs' },
  { path: 'tmp', description: 'Temporary files' },
  { path: 'sessions', description: 'Session storage' }
];

console.log(' Creating required directories...');
requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir.path);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(` Created ${dir.path}/ (${dir.description})`);
  } else {
    console.log(`✓ ${dir.path}/ already exists`);
  }
});

// 5. Create .gitignore if it doesn't exist
const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  console.log('\nWARNING: No .gitignore file found');
  console.log('   Creating .gitignore to protect sensitive files...');
  
  const gitignoreContent = `# Environment variables
.env
.env.*

# Sessions
sessions/

# Logs
logs/
*.log

# Node modules
node_modules/

# Firebase keys
*-firebase-adminsdk-*.json
`;
  
  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log('    Created .gitignore');
} else {
  console.log('\n .gitignore file exists');
}

// 6. Security check
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔒 Security Checklist');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const checks = {
  gitignoreExists: fs.existsSync(path.join(__dirname, '..', '.gitignore')),
  envExists: fs.existsSync(path.join(__dirname, '..', '.env')),
  environmentCheck: process.env.NODE_ENV === 'production'
}

const securityChecks = [
  {
     message:checks.gitignoreExists ? '✅ .gitignore file exists':'❌ .gitignore file is not present. Please create one'  
  },
  {
    message: checks.envExists? '✅ .env file is present':'❌ .env file does not exist'
  },
  {
    message: checks.environmentCheck ? '✅ environment is set to production' : '❌ environment is not set to production. Check your .env'
  }
];

securityChecks.forEach(({ message }) => {
  console.log(`${message}`);
});

