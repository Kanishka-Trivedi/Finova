# Finova - Personal Finance Tracker

Finova is a comprehensive mobile application designed to help users manage their financial health by tracking income, expenses, and data backups. Built with React Native (Expo) and a Node.js/Express backend, it provides a seamless interface for modern financial management.

---

## 🚀 Key Features

### 1. Financial Management

- **Expense Tracking:** Log daily expenditures with categories and detailed descriptions.
- **Income Logging:** Record various revenue streams to maintain a balanced budget.
- **Transaction History:** View and manage historical data through interactive list views.

### 2. Data Visualization & Insights

- **Interactive Charts:** Visual representation of spending habits using `react-native-chart-kit`.
- **Real-time Dashboard:** A central hub (Index screen) providing a summary of your financial status.

### 3. Security & Privacy

- **App Lock:** Secure access using biometric or PIN-based authentication via `expo-local-authentication`.
- **Protected Routes:** Backend endpoints are secured using JWT-based authentication middleware.

### 4. Cloud Integration

- **Data Backup:** Securely backup and restore financial records to the cloud.
- **Image Handling:** Profile and receipt image processing supported by Cloudinary.

---

## 📁 File Structure

The project is split into a mobile frontend and a backend server.

### Frontend (`/my-app`)
```plaintext
my-app/
├── app/                  # Expo Router (File-based routing)
│   ├── (tabs)/           # Main navigation: Dashboard, Income, Expense, Profile
│   ├── login.jsx         # User Authentication screens
│   ├── expense-detail.jsx# Transaction management screens
│   └── _layout.tsx       # Root layout & Context providers
├── components/           # Reusable UI (AppLock, Themed components)
├── context/              # State management (Auth, Data, Settings)
├── hooks/                # Custom hooks (Theme, Color scheme)
└── assets/               # Local data (Finance.json) and images
```

### Backend (`/my-app/backend`)
```plaintext
backend/
├── config/               # External service configurations (Cloudinary)
├── controllers/          # Business logic for API endpoints
├── middleware/           # Auth verification (JWT)
├── models/               # MongoDB Schemas (User, Expense, Income, Backup)
├── routes/               # API route definitions
└── server.js             # Entry point & Express server setup
```

---

## 🛠 API Endpoints

The backend server runs on `PORT 5000` by default and uses MongoDB for persistence.

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Authenticate user and return JWT |

### Expenses (`/expenses`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/expenses/` | Fetch all user expenses |
| `POST` | `/expenses/add` | Create a new expense record |
| `DELETE` | `/expenses/:id` | Remove an expense record |

### Income (`/incomes`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/incomes/` | Fetch all user income records |
| `POST` | `/incomes/add` | Create a new income record |

### Data Management (`/api/data`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/data/backup` | Upload current records to backup |
| `GET` | `/api/data/restore` | Retrieve records from last backup |

---

## ⚙️ Installation & Setup

### 1. Backend Setup
```bash
cd my-app/backend
npm install
# Create a .env file with MONGO_URI and PORT
node server.js
```

### 2. Frontend Setup
```bash
cd my-app
npm install
npx expo start
```
