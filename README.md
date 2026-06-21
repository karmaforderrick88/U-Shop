# U-Shop - E-commerce Management System

A comprehensive inventory and sales management system built with Node.js, Express, and Firebase.

## Recent Updates (v2.0)

✅ **Render Deployment Ready**
- Migrated from file-based to Redis-based session storage
- Added production environment validation
- Updated configuration for cloud deployment
- Support for multiple deployment platforms

## Features

- **Inventory Management**: Add, edit, and delete stock items
- **Sales Tracking**: Record sales with payment modes and customer details
- **Debt Management**: Track customer debts and repayments
- **User Management**: Role-based access control (Admin, Owner, User)
- **Sales Analytics**: View sales summaries and reports
- **Real-time Data**: Firebase Firestore integration for real-time updates

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase project with Firestore database
- Firebase service account key

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   - `PORT`: Server port (default: 3000)
   - `SESSION_SECRET`: Secret key for sessions
   - `FIREBASE_SERVICE_ACCOUNT_KEY`: Your Firebase service account JSON

4. **Create First User**
   ```bash
   npm run create-owner
   ```

## Development

```bash
npm run dev
```

## Quick Start: Deploy to Render

1. **Create Redis Add-on** (Render Dashboard → Databases → New Redis)
2. **Create Web Service** (Render Dashboard → New Web Service, connect GitHub)
3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3000
   BASE_URL=https://your-app-name.onrender.com
   SESSION_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
   REDIS_URL=<copy from Redis add-on>
   FIREBASE_SERVICE_ACCOUNT_KEY=<from Firebase Console>
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=<Gmail app password>
   CLOUD_NAME=<Cloudinary>
   CLOUD_API_KEY=<Cloudinary>
   API_SECRET=<Cloudinary>
   ```
4. **Deploy** (automatic on git push or click "Deploy")
5. **Test**: Click the URL and verify all features work

## Production Deployment

### Required Environment Variables

Set the following environment variables in your production environment:

**Server & Session:**
- `NODE_ENV=production`
- `PORT=3000`
- `BASE_URL`: Your application URL (e.g., `https://your-app.onrender.com`)
- `SESSION_SECRET`: Strong secret key (min 32 characters)
- `REDIS_URL`: Redis connection URL (required for production)

**Firebase:**
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Firebase service account JSON

**Email (Gmail):**
- `EMAIL_USER`: Gmail address
- `EMAIL_PASS`: Gmail app password (not regular password)

**Cloudinary (Image Storage):**
- `CLOUD_NAME`: Cloudinary cloud name
- `CLOUD_API_KEY`: Cloudinary API key
- `API_SECRET`: Cloudinary API secret

### Deployment Options

#### Render (Recommended for this app) ⭐
1. **Create GitHub Repository**
   - Push code to GitHub (already done)

2. **Create Web Service on Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free or Starter

3. **Add Redis Add-on**
   - In Render dashboard, go to "Databases"
   - Click "New +" → "Redis"
   - Copy the Internal Redis URL

4. **Set Environment Variables**
   - In Web Service dashboard, go to "Environment"
   - Add all required variables listed above
   - Use the Redis URL from the add-on for `REDIS_URL`

5. **Deploy**
   - Render auto-deploys on git push or manually click "Deploy"

**Benefits:**
- Free tier available
- Automatic HTTPS
- Built-in Redis support
- Auto-deploys on push
- Persistent data with Firebase

#### Heroku
1. Create a new Heroku app
2. Add Redis add-on: `heroku addons:create heroku-redis`
3. Set environment variables in Heroku dashboard
4. Deploy using Git:
   ```bash
   heroku git:remote -a your-app-name
   git push heroku main
   ```

#### Railway
1. Connect your GitHub repository
2. Add PostgreSQL service (for Redis alternative)
3. Set environment variables in Railway dashboard
4. Deploy automatically

#### VPS/Cloud Server
1. Clone repository on server
2. Install Node.js and Redis
3. Install dependencies: `npm install --production`
4. Set environment variables
5. Use PM2 or similar process manager:
   ```bash
   npm install -g pm2
   pm2 start index.js --name "ecommerce"
   pm2 startup
   pm2 save
   ```
   
**Note**: Ensure Redis server is running for session persistence

## Session Management

### Development
Sessions are stored in memory with file fallback. Install and run Redis locally for testing:

```bash
# macOS
brew install redis
redis-server

# Linux
sudo apt install redis-server
redis-server

# Then run the app
npm run dev
```

### Production
**This app uses Redis for session persistence** to ensure sessions survive application restarts and work across multiple server instances.

- Render: Redis add-on provides this automatically
- Heroku: Use `heroku-redis` add-on
- Other: Deploy Redis separately and set `REDIS_URL`

**Why Redis for sessions?**
- File-based sessions won't work on platforms with ephemeral storage (like Render)
- Redis provides fast, reliable session persistence
- Enables horizontal scaling

## API Endpoints

### Authentication
- `POST /login` - User login
- `GET /logout` - User logout

### Stocks
- `GET /api/stocks` - Get all stock items
- `POST /api/stocks` - Add new stock item
- `PUT /api/stocks/:id` - Update stock item
- `DELETE /api/stocks/:id` - Delete stock item

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Add new sale
- `GET /api/sales/today` - Get today's total sales
- `GET /api/sales/summary` - Get sales summary

### Debts
- `GET /api/debts` - Get all debts
- `POST /api/debts` - Add new debt
- `DELETE /api/debts/:id` - Delete debt
- `POST /api/debts/:id/repayment` - Record debt repayment
- `GET /api/debts/:id/repayments` - Get debt repayments

### Users
- `GET /api/users` - Get all users (Admin/Owner only)
- `POST /api/users` - Create new user (Admin/Owner only)

## Security Features

- Session-based authentication
- Role-based access control
- Input validation and sanitization
- Environment variable protection
- Production-ready logging

## File Structure

```
ecommerce/
├── app/
│   ├── app.js          # Main application setup
│   └── config.js       # Configuration management
├── controllers/        # Route controllers
├── middleware/         # Authentication middleware
├── models/            # Data models
├── routes/            # API routes
├── public/            # Static assets
├── views/             # Handlebars templates
├── utils/             # Utility functions
└── scripts/           # Setup scripts
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License. 