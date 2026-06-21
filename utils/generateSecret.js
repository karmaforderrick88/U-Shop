#!/usr/bin/env node

/**
 * Generate Secure Session Secret
 * 
 * This script generates a cryptographically secure random string
 * suitable for use as a SESSION_SECRET in your .env file.
 */

import crypto from 'crypto';

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔐 Secure Session Secret Generator');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Generate a 64-byte (128 character hex) secure random string
const secret = crypto.randomBytes(64).toString('hex');

console.log('✅ Generated secure session secret:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(secret);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📋 Instructions:\n');
console.log('1. Copy the string above');
console.log('2. Open your .env file');
console.log('3. Set SESSION_SECRET to the copied value:');
console.log(`   SESSION_SECRET=${secret}\n`);

console.log('🔒 Security Tips:\n');
console.log('• Use different secrets for development and production');
console.log('• Never commit your .env file to Git');
console.log('• Rotate secrets periodically (invalidates all active sessions)');
console.log('• Keep this secret confidential\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');