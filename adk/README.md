# Hamro Home Stay ADK Server

This repository contains the AI Development Kit (ADK) server for the Hamro Home Stay application. The ADK server provides AI assistant capabilities to help users find and book homestays.

## Overview

The ADK server is built using Google's AI Development Kit and provides a conversational interface for users to interact with the Hamro Home Stay application. It processes both text and voice inputs and generates appropriate responses.

## Prerequisites

- Python 3.11 or higher
- Google ADK SDK
- Access to Google AI models

## Installation

1. Clone the repository
2. Navigate to the ADK directory
3. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
4. Install dependencies:
   ```bash
   pip install -e .
   ```

## Configuration

Create a `.env` file in the `adk/` directory with the following variables:

```
# ADK Configuration
ADK_PORT=8000
ADK_HOST=0.0.0.0

# Google AI API Configuration
# Required: API key for Google Generative AI
GOOGLE_API_KEY=your_google_api_key
# Optional: set to 1 if you use Vertex AI routing via the SDK
GOOGLE_GENAI_USE_VERTEXAI=0

# MCP Tool Configuration
# Use the same host and port where the MCP server is running, appending the respective paths:
MCP_HOMESTAY_URL=http://localhost:8080/homestay/mcp   # Format: http://<MCP_SERVER_HOST>:<MCP_SERVER_PORT>/homestay/mcp
MCP_OFFICER_URL=http://localhost:8080/officer/mcp     # Format: http://<MCP_SERVER_HOST>:<MCP_SERVER_PORT>/officer/mcp

```

## Running the Server

To run the ADK server:

```bash
python -m adk.main
```
or cd into the adk and run the main.py
using 
```bash
python main.py

```


## Integration with Next.js Application

To integrate the ADK server with the Next.js application, ensure the following environment variable is set in the Next.js application's `.env` file:

```
NEXT_PUBLIC_ADK_API_BASE=http://localhost:8000
NEXT_PUBLIC_ADK_API_BASE=http://<ADK_SERVER_HOST>:<ADK_SERVER_PORT>

```

This allows the AI chat component to communicate with the ADK server.

In production, set it to your ADK domain origin (no trailing slash), for example:

```
NEXT_PUBLIC_ADK_API_BASE=https://adk.example.com
```

## API Endpoints

### `/send/{user_id}`

Sends a message to the ADK server for processing.

- **Method**: POST
- **Parameters**:
  - `user_id`: User identifier for session management
- **Request Body**:
  ```json
  {
    "mime_type": "text/plain" or "audio/webm",
    "data": "message content or base64 encoded audio",
    "auth_token": "optional authentication token",
    "admin_username": "optional admin username"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "response_text": "AI response text"
  }
  ```

## Troubleshooting

- If you encounter connection issues with the MCP tools, ensure the Homestay-MCP server is running and accessible.
- For authentication issues, verify that the auth_token is being correctly passed from the Next.js application.

## Deployment Notes

- Ensure ADK can reach Homestay-MCP at the URLs you configured in `MCP_HOMESTAY_URL` and `MCP_OFFICER_URL` (must end with `/mcp`).
- ADK does not require a database connection; remove any MongoDB settings from ADK's `.env`.
- Example Kubernetes/VM mapping:
  - Homestay-MCP at `https://mcp.example.com`
  - ADK at `https://adk.example.com`
  - Next.js app at `https://app.example.com`
  - Then set:
    - In `adk/.env`:
      - `MCP_HOMESTAY_URL=https://mcp.example.com/homestay/mcp`
      - `MCP_OFFICER_URL=https://mcp.example.com/officer/mcp`
    - In `app (Next.js)/.env`:
      - `NEXT_PUBLIC_ADK_API_BASE=https://adk.example.com`
      - `JWT_SECRET=your_next_server_jwt_secret` (used only by Next.js server-side route)

## License

[License information]