# Shop Management App

A comprehensive offline management system for an electronics accessories shop, built with FastAPI backend and React frontend.

## Features

- Product inventory management with multiple price tiers
- Customer management (Retail, Wholesale, Distributor)
- Supplier management and purchases
- Sales and billing with POS functionality
- Payment tracking and ledger
- Reports and analytics
- Offline operation (no internet required)

## Tech Stack

- Backend: Python + FastAPI, PostgreSQL, SQLAlchemy, Alembic
- Frontend: React.js + Tailwind CSS, Zustand, Axios
- PDF: ReportLab
- Images: Pillow for compression

## Prerequisites

- Python 3.9 or higher
- PostgreSQL (locally installed)
- Node.js 16 or higher
- Git

## Setup Instructions

### 1. Database Setup

1. Install PostgreSQL on your system.
2. Create a database named `shopdb`.
3. Create a user `postgres` with a password.
4. Update the `DATABASE_URL` in `.env` file with your PostgreSQL password.

### 2. Project Setup

1. Navigate to the project directory:
   ```
   cd shop-app
   ```

2. Backend setup:
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   # Run migrations (after STEP 2 completion)
   alembic upgrade head
   ```

3. Frontend setup:
   ```
   cd ../frontend
   npm install
   ```

### 3. Environment Configuration

- Update `.env` file with your PostgreSQL password.
- Default owner credentials: `admin` / `admin123`

### 4. Running the Application

1. Start the backend:
   ```
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload
   ```
   Backend will run on http://localhost:8000

2. Start the frontend:
   ```
   cd ../frontend
   npm start
   ```
   Frontend will run on http://localhost:3000

### 5. Access the Application

- Open http://localhost:3000 in your browser
- Login with username: `admin`, password: `admin123`

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for FastAPI documentation.

## Development

- The application runs 100% offline after initial setup
- All data is stored locally in PostgreSQL
- Images are stored in `backend/uploads/products/`

## Project Structure

See the main README for detailed structure.

## License

This project is for personal use.