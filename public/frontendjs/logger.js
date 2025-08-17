// Frontend Logger - Simple and automatic
class FrontendLogger {
    constructor() {
      // Automatically detect if we're in development
      // If URL contains localhost, 127.0.0.1, or dev - it's development
      this.isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.includes('dev');
      this.isProduction = !this.isDevelopment;
 
    }
  
    // Safe logging - only shows in development
    log(message, ...args) {
      if (this.isDevelopment) {
        console.log(`[DEBUG] ${message}`, ...args);
      }
    }
  
    // Warnings - show in both dev and prod (but sanitized)
    warn(message, ...args) {
      const sanitizedMessage = this.sanitizeMessage(message);
      console.warn(`[WARN] ${sanitizedMessage}`, ...this.sanitizeArgs(args));
    }
  
    // Errors - show in both dev and prod (but sanitized)
    error(message, ...args) {
      const sanitizedMessage = this.sanitizeMessage(message);
      console.error(`[ERROR] ${sanitizedMessage}`, ...this.sanitizeArgs(args));
    }
  
    // Info - only shows in development
    info(message, ...args) {
      if (this.isDevelopment) {
        console.info(`[INFO] ${message}`, ...args);
      }
    }
  
    // Sanitize messages to remove sensitive data
    sanitizeMessage(message) {
      if (typeof message !== 'string') return '[Object]';
      
      // Remove potential sensitive patterns
      return message
        .replace(/password['"]?\s*[:=]\s*['"]?[^'"]*['"]?/gi, 'password: [REDACTED]')
        .replace(/token['"]?\s*[:=]\s*['"]?[^'"]*['"]?/gi, 'token: [REDACTED]')
        .replace(/secret['"]?\s*[:=]\s*['"]?[^'"]*['"]?/gi, 'secret: [REDACTED]')
        .replace(/key['"]?\s*[:=]\s*['"]?[^'"]*['"]?/gi, 'key: [REDACTED]')
        .replace(/api['"]?\s*[:=]\s*['"]?[^'"]*['"]?/gi, 'api: [REDACTED]');
    }
  
    // Sanitize arguments to remove sensitive objects
    sanitizeArgs(args) {
      return args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          // Remove sensitive properties from objects
          const sanitized = { ...arg };
          delete sanitized.password;
          delete sanitized.token;
          delete sanitized.secret;
          delete sanitized.key;
          delete sanitized.apiKey;
          return sanitized;
        }
        return arg;
      });
    }
  
    // Safe API logging - only log endpoint, not data
    apiCall(method, endpoint, success = true) {
      if (this.isDevelopment) {
        console.log(`[API] ${method} ${endpoint} - ${success ? 'SUCCESS' : 'FAILED'}`);
      }
    }
  
    // Safe data logging - only in development
    data(label, data) {
      if (this.isDevelopment) {
        console.log(`[DATA] ${label}:`, this.sanitizeArgs([data])[0]);
      }
    }
  }
  
  // Create global logger instance
  window.logger = new FrontendLogger();