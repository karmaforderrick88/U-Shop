# E-commerce Management System

A comprehensive inventory and sales management system built with Node.js, Express, and Firebase.

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

## Production Deployment

### Environment Variables

Set the following environment variables in your production environment:

- `NODE_ENV=production`
- `PORT`: Your server port
- `SESSION_SECRET`: Strong secret key
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Firebase service account JSON

### Deployment Options

#### Heroku
1. Create a new Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy using Git:
   ```bash
   heroku git:remote -a your-app-name
   git push heroku main
   ```

#### Railway
1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically

#### VPS/Cloud Server
1. Clone repository on server
2. Install dependencies: `npm install --production`
3. Set environment variables
4. Use PM2 or similar process manager:
   ```bash
   npm install -g pm2
   pm2 start index.js --name "ecommerce"
   pm2 startup
   pm2 save
   ```

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