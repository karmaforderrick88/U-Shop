import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Validates that all required environment variables are present
 * Throws an error with helpful message if any are missing
 */
function validateEnvironment() {
  // Define required environment variables
  const required = {
    SESSION_SECRET: 'A secure random string for session encryption (generate with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))")',
    FIREBASE_SERVICE_ACCOUNT_KEY: 'Firebase service account JSON (get from Firebase Console)',
    EMAIL_USER: 'Gmail address for sending emails',
    EMAIL_PASS: 'Gmail app password (not your regular password)',
    REDIS_URL: 'Redis connection URL (from Render add-on) - only required in production',
    BASE_URL: 'Your application URL (e.g., http://localhost:3000 or https://yourdomain.com)',
    NODE_ENV:'Your current environment mode',
    PORT:'the port you are using',
    CLOUD_NAME:'cloudinary cloud name',
    CLOUD_API_KEY:'cloudinary api key',
    API_SECRET:'cloudinary api secret'

  };

  const missing = [];
  const invalid = [];

  // Check each required variable
  for (const [key, description] of Object.entries(required)) {
    // REDIS_URL only required in production
    if (key === 'REDIS_URL' && process.env.NODE_ENV !== 'production') {
      continue;
    }
    if (!process.env[key]) {
      missing.push(`  ❌ ${key}: ${description}`);
    } else if (key === 'SESSION_SECRET' && process.env[key].length < 32) {
      invalid.push(`  ⚠️  ${key}: Must be at least 32 characters long (current: ${process.env[key].length})`);
    } else if (key === 'FIREBASE_SERVICE_ACCOUNT_KEY') {
      try {
        JSON.parse(process.env[key]);
      } catch (e) {
        invalid.push(`  ⚠️  ${key}: Must be valid JSON format`);
      }
    }
  }

  // If there are missing or invalid variables, throw detailed error
  if (missing.length > 0 || invalid.length > 0) {
    const errorMessage = [
      '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '❌ CONFIGURATION ERROR: Missing or invalid environment variables',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      ''
    ];

    if (missing.length > 0) {
      errorMessage.push('Missing variables:');
      errorMessage.push(...missing);
      errorMessage.push('');
    }

    if (invalid.length > 0) {
      errorMessage.push('Invalid variables:');
      errorMessage.push(...invalid);
      errorMessage.push('');
    }

    errorMessage.push(' Please create a .env file in your project root with these variables.');
    errorMessage.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    throw new Error(errorMessage.join('\n'));
  }
}

// Run validation before creating config
validateEnvironment();

// Configuration constants
const SESSION_DURATION_MINUTES = 30;

const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  //Redis configuration
  redisUrl: process.env.REDIS_URL,
  
  // Email configuration
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  
  // Session configuration
  sessionSecret: process.env.SESSION_SECRET, // No fallback - must be provided!
  sessionMaxAge: SESSION_DURATION_MINUTES * 60 * 1000, // 30 minutes in milliseconds
  
  // Firebase configuration
  firebaseServiceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  
  // Application URL
  BASE_URL: process.env.BASE_URL,
  
  // Environment flags
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  
  // Logging
  enableDebugLogs: process.env.NODE_ENV !== 'production',

  //cloudinary
  CLOUD_NAME:process.env.CLOUD_NAME,
  CLOUD_API_KEY: process.env.CLOUD_API_KEY,
  API_SECRET : process.env.API_SECRET
};

// Log configuration status (without sensitive values)
if (config.enableDebugLogs) {
  console.log('\n Configuration loaded successfully');
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Base URL: ${config.BASE_URL}`);
  console.log(`   Session Duration: ${SESSION_DURATION_MINUTES} minutes`);
  console.log(`   Debug Logs: ${config.enableDebugLogs ? 'Enabled' : 'Disabled'}\n`);
}

export default config;