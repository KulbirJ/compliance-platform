# Compliance Platform Backend

Backend service for the compliance platform.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL (v12 or higher)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration

### Running the Application

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

### API Documentation

The API runs on `http://localhost:3000` by default.

**Health Check:**
- GET `/health` - Check if the API is running

## Project Structure

```
compliance-platform-backend/
├── src/
│   ├── config/            # Configuration files
│   │   └── database.js    # Database connection
│   ├── controllers/       # Route controllers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   │   └── index.js       # Route definitions
│   ├── middleware/        # Custom middleware
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── utils/             # Utility functions
│   │   └── logger.js      # Winston logger
│   ├── app.js             # Express application setup
│   └── server.js          # Server startup
├── tests/                 # Test files
├── .env                   # Environment variables (create from .env.example)
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore rules
├── package.json          # Project dependencies
└── README.md             # Project documentation
```

## License

ISC
