# Backend

This directory contains the backend code for the portfolio project.

## Getting Started

### Prerequisites

- Node.js (v18.x)
- npm

### Installation

1.  Navigate to the `backend` directory:
    ```sh
    cd backend
    ```

2.  Install the dependencies:
    ```sh
    npm install
    ```

3.  Create a `.env` file in the `backend` directory and add the following environment variables:

    ```
    GEMINI_API_KEY=your_gemini_api_key
    QDRANT_API_KEY=your_qdrant_api_key
    QDRANT_URL=your_qdrant_url
    ```

### Running the application

1.  Build the TypeScript code:

    ```sh
    npm run build
    ```

2.  Start the server:

    ```sh
    npm start
    ```

The backend will be running on `http://localhost:3001`.

## Available Scripts

- `npm run build`: Compiles the TypeScript code to JavaScript.
- `npm start`: Starts the server.

## API Endpoints

### POST /chat

This endpoint is used to interact with the chatbot.

**Request Body:**

```json
{
  "message": "Your message to the chatbot"
}
```

**Response Body:**

```json
{
  "text": "The chatbot's response"
}
```
