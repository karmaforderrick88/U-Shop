import Logger from '../utils/logger.js';  

/**
 * Check if user is logged in
 */
export function ensureAuthenticated(req, res, next) {
  Logger.log('Session in ensureAuthenticated:', req.session);
  if (req.session && req.session.userId) {
    return next();
  }
  // Not logged in, redirect to login page or return unauthorized for API
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }
  res.redirect('/login');
}

/**
 * Check if user is an employee (or higher)
 */
export function ensureEmployee(req, res, next) {
  //  Allow employees, admins, and owners
  const authorizedRoles = ['employee', 'admin', 'owner'];
  if (req.session && authorizedRoles.includes(req.session.role)) {
    return next();
  }
  
  if (req.path.startsWith('/api/')) {
    return res.status(403).json({ 
      message: 'Access denied. Employee privileges required.',
      role: req.session.role 
    });
  }
  
  return res.status(403).render('auth/accessDenied', { 
      pageTitle: 'Access Denied', 
      message: 'You do not have the necessary employee privileges to access this page.',
      role: req.session.role 
  });
}

/**
 * Check if user is the owner or admin
 */
export function ensureAdminOrOwner(req, res, next) {
  if (req.session && (req.session.role === 'owner' || req.session.role === 'admin')) {
    return next();
  }
  
  if (req.path.startsWith('/api/')) {
    return res.status(403).json({ 
      message: 'Access denied. Admin or owner privileges required.',
      role: req.session.role 
    });
  }
  
  return res.status(403).render('auth/accessDenied', { 
      pageTitle: 'Access Denied', 
      message: 'You do not have the necessary admin or owner privileges to access this page.',
      role: req.session.role 
  });
}