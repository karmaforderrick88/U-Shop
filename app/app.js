import express from 'express';
import { engine } from 'express-handlebars'; 
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import config from './config.js';

// Route Imports
import stockRouter from '../routes/stockRoutes.js';
import salesRouter from '../routes/salesRoutes.js';
import debtRouter from '../routes/debtRoutes.js';
import authRoutes from '../routes/authRoutes.js';
import userRoutes from '../routes/userRoutes.js';

// Controller Imports
import { getDashboardStats } from '../controllers/salesController.js';

// Middleware Imports
import { ensureAuthenticated, ensureAdminOrOwner } from '../middleware/authMiddleware.js';
import Logger from '../utils/logger.js';
import { 
  authLimiter, 
  apiLimiter, 
  passwordResetLimiter, 
  registrationLimiter,
  crudLimiter 
} from '../middleware/rateLimiter.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static files
app.use(express.static(path.join(__dirname, '../public')));

app.use(express.json());
app.use(express.urlencoded({extended:true}));

// Session Configuration with Redis
const redisClient = createClient({
  url: config.redisUrl || 'redis://localhost:6379'
});

redisClient.connect().catch(err => {
  Logger.error('Redis connection error:', err);
});

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: config.sessionMaxAge,
    secure: config.isProduction,
    httpOnly: true,
    sameSite: 'lax'
  },
  rolling: true
}));
// Request Logging Middleware
app.use((req, res, next) => {
  if (config.isDevelopment) {
    Logger.debug(`Request: ${req.method} ${req.path} from IP: ${req.ip}`);
  }
  next();
});
// {{businessId}} available to all authenticated views 
app.use((req, res, next) => {
    if (req.session && req.session.userId) {
        res.locals.businessId = req.session.employerId || req.session.userId;
    }
    next();
});

// Handlebars Setup
app.engine('handlebars', engine({
    defaultLayout: 'main',
     layoutsDir: path.join(__dirname, '../views/layouts'),
     partialsDir: path.join(__dirname, '../views/partials'),
     helpers:{
        eq:(a,b)=>a===b,
        or: (a,b)=>a || b,
        section: function(name, options) {
            if (!this._sections) {
                this._sections = {};
            }
            this._sections[name] = options.fn(this);
            return null; // Return null so it doesn't render inside the body
        }
     } 
}));

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '../views')); 

// --- Rate Limiting ---
app.use('/forgot-password', passwordResetLimiter);
app.use('/reset-password', passwordResetLimiter);
app.use('/register/request', registrationLimiter);
app.use('/api', apiLimiter);

// Specific CRUD limits
app.use('/api/stocks', crudLimiter);
app.use('/api/sales', crudLimiter);
app.use('/api/debts', crudLimiter);
app.use('/api/users', crudLimiter);



// Feature Routes
app.use('/api', stockRouter);
app.use('/api', salesRouter);
app.use('/api', debtRouter);
app.use('/api', userRoutes);

// --- Auth Routes ---
app.use('/', authRoutes);

// --- View Routes ---
app.get('/gallery/:businessId', (req, res) => {
  res.render('gallery', {
    pageTitle: 'Our Products',
    businessId: req.params.businessId,
    layout: false // Set to false to prevent the admin dashboard UI from wrapping the public gallery
  });
});

app.get('/', ensureAuthenticated, (req, res) => {
 res.render('home',{
    pageTitle:`Dashboard`,
    activeNav:`dashboard`,
    user: { role: req.session.role}
 })
});

app.get('/stocks', ensureAuthenticated, (req, res) => {
   res.render('stocks',{
    pageTitle:`Stocks`,
     activeNav:`stocks`
   })
});

app.get('/sales', ensureAuthenticated, (req, res) => {
   res.render('sales',{
    pageTitle:`Sale Records`,
     activeNav:`sales`
   })
});

app.get('/users', ensureAuthenticated, ensureAdminOrOwner, (req, res) => {
  res.render('users', {
    pageTitle: 'User Management',
    userRole: req.session.role,
    layout: false
  });
});

// Error Handling
app.use((err, req, res, next) => {
  if (err.name === 'RateLimitError') {
    Logger.error(`Rate limit error: ${err.message}`, { ip: req.ip, path: req.path });
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
  next(err);
});

// Start the server
export function start(){
    app.listen(config.port, () => {
    Logger.info(`Server is running on port ${config.port}`);
    if (!config.isProduction) {
      Logger.info(`Development server: http://localhost:${config.port}`);
    }
  });
}