# Apex Chatbot Setup Guide

## Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- Git

## 1. Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create a virtual environment (optional but recommended):

   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # Mac/Linux
   source venv/bin/activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Configure Environment Variables:
   - Rename `.env.example` to `.env`.
   - Add your **Groq API Key** and **SerpAPI Key**.

   ```env
   GROQ_API_KEY=your_key_here
   SERPAPI_API_KEY=your_key_here
   ```

5. Run the server:
   ```bash
   python -m uvicorn main:app --reload
   ```
   The backend will start at `http://localhost:8000`.

## 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies (if not already done):

   ```bash
   npm install
   npm install axios lucide-react react-markdown remark-gfm clsx tailwind-merge
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will start at `http://localhost:3000`.

## 3. Usage

- Open `http://localhost:3000` in your browser.
- Type a message to chat with Apex.
- Try asking for "latest news on AI" to test the search functionality.
- Try asking "what is the history of Rome" to test the Wikipedia integration.

## Troubleshooting

- **Backend Connection Error**: Ensure the backend is running on port 8000 and CORS is configured for localhost:3000.
- **API Keys**: Make sure your `.env` file in `backend/` has valid keys.
