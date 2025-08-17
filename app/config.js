import dotenv from 'dotenv';

dotenv.config();

const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Session configuration
  sessionSecret: process.env.SESSION_SECRET || '93af3bb77ae42c07c5b08dc29399dc9d2b890e827fe775fa8cfbab87931ffa516e829f682ec8c5ba939e79f36766c3d49e561eb07bd5800dbd9d37f4d92279f7',
  sessionMaxAge: 30 * 60 * 1000, // 30 minutes
  
  // Firebase configuration
  firebaseServiceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  
  // Security
  isProduction: process.env.NODE_ENV === 'production',
  
  // Logging
  enableDebugLogs: process.env.NODE_ENV !== 'production',
};

export default config; 