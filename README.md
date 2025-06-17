# Money Jars Application

A modern web application for managing personal finances using the "Money Jars" method. This application helps users allocate their income into different categories (jars) for better financial management.

## Features

- 🔐 User Authentication (Login/Register)
- 💰 Create and manage multiple money jars
- 📊 Track income and expenses
- 📈 Visual progress tracking for each jar
- 📱 Responsive design for all devices
- 🔄 Real-time updates
- 📅 Transaction history with date filtering
- 🏷️ Category management for transactions

## Tech Stack

### Frontend
- React.js with Vite
- Redux Toolkit for state management
- Material-UI for components
- Framer Motion for animations
- React Router for navigation
- Axios for API calls
- Date-fns for date handling

### Backend
- Node.js with Express
- JWT for authentication
- Bcrypt for password hashing
- File-based storage (db.json)

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── store/        # Redux store and slices
│   │   ├── services/     # API services
│   │   └── App.jsx       # Main application component
│   └── package.json
│
└── server/                # Backend Express application
    ├── controllers/      # Route controllers
    ├── routes/          # API routes
    ├── middleware/      # Custom middleware
    ├── db.json         # Database file
    └── index.js        # Server entry point
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd money-jars
```

2. Install frontend dependencies:
```bash
cd client
npm install
```

3. Install backend dependencies:
```bash
cd ../server
npm install
```

4. Create a `.env` file in the client directory:
```
VITE_API_URL=http://localhost:5001/api
```

### Running the Application

1. Start the backend server:
```bash
cd server
npm start
```

2. Start the frontend development server:
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Jars
- `GET /api/jars` - Get all jars for the user
- `GET /api/jars/:id` - Get a specific jar
- `POST /api/jars` - Create a new jar
- `PUT /api/jars/:id` - Update a jar
- `DELETE /api/jars/:id` - Delete a jar

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/jars/:id/transactions` - Get transactions for a specific jar
- `POST /api/transactions` - Create a new transaction
- `PUT /api/transactions/:id` - Update a transaction
- `DELETE /api/transactions/:id` - Delete a transaction

## Test User

For testing purposes, you can use the following credentials:
- Email: test@example.com
- Password: password123

## Development

### Creating a Test User

To create a new test user with a properly hashed password:

```bash
cd server
node scripts/createTestUser.js
```

### Code Style

The project uses ESLint for code linting. Run the linter:

```bash
cd client
npm run lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Material-UI for the component library
- Redux Toolkit for state management
- Vite for the build tool
- Express.js for the backend framework 