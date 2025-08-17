import express from 'express';
import { engine } from 'express-handlebars'; 
import path from 'path';
import { fileURLToPath } from 'url';
import stockRouter from '../routes/stockRoutes.js';
import salesRouter from '../routes/salesRoutes.js';
import debtRouter from '../routes/debtRoutes.js';
import authRoutes from '../routes/authRoutes.js';
import { ensureAuthenticated, ensureAdminOrOwner } from '../middleware/authMiddleware.js';
import userRoutes from '../routes/userRoutes.js';
import config from './config.js';
import Logger from '../utils/logger.js';
import session from 'express-session';
import FileStore from 'session-file-store';

const FileStoreSession = FileStore(session);


const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

let __filename = fileURLToPath(import.meta.url);
if (process.platform === 'win32' && __filename.startsWith('/')) {
  __filename = __filename.substring(1);
}
const __dirname = path.dirname(__filename);



app.use(session({
  store: new FileStoreSession({
    path: './sessions',
    ttl: config.sessionMaxAge / 1000, 
    reapInterval: 86400,
    retries:5,
    logFn:function (){}
  }),
  secret: config.sessionSecret, 
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge: config.sessionMaxAge},
  rolling: true
}));


app.engine('handlebars', engine({
    defaultLayout: 'main',
     layoutsDir: path.join(__dirname, '../views/layouts'),
     partialsDir: path.join(__dirname, '../views/partials'),
     helpers:{
        eq:(a,b)=>a===b,
        or: (a,b)=>a || b
     } 
}));

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '../views')); 


app.use(express.static(path.join(__dirname, '../public')));



app.use('/api', stockRouter);

app.use('/api', salesRouter);

app.use('/api', debtRouter);

app.use('/api', userRoutes);

app.use('/', authRoutes);
//  serve  dashboard
app.get('/', ensureAuthenticated, (req, res) => {
    
 res.render('home',{
    pageTitle:`Dashboard`,
    activeNav:`dashboard`,
    user: { role: req.session.role}
 })
});
// serve stocks
app.get('/stocks', ensureAuthenticated, (req, res) => {
   res.render('stocks',{
    pageTitle:`Stocks`,
     activeNav:`stocks`
   })
});

// serve sales
app.get('/sales', ensureAuthenticated, (req, res) => {
   res.render('sales',{
    pageTitle:`Sale Records`,
     activeNav:`sales`
   })
});

// serve user management page (admin/owner only)
app.get('/users',ensureAuthenticated,ensureAdminOrOwner, (req, res) => {
  res.render('users', {
    pageTitle: 'User Management',
    userRole: req.session.role,
    layout: false
  });
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