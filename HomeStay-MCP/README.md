# Hamro Home Stay MCP Server

This repository contains the Model-Control-Presenter (MCP) server for the Hamro Home Stay application. The MCP server provides specialized tools for homestay filtering and officer management that are used by the ADK AI assistant.

## Overview

The Homestay-MCP server is built using the MCP framework and FastAPI. It provides two main components:

1. **Homestay Filter Service**: Provides tools for searching and filtering homestays based on various criteria.
2. **Officer Management Service**: Provides tools for managing officers under admin accounts.

## Prerequisites

- Python 3.11 or higher
- MongoDB database
- MCP SDK

## Installation

1. Clone the repository
2. Navigate to the Homestay-MCP directory
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

Create a `.env` file in the `Homestay-mcp/` directory with the following variables:

```
# Server Configuration
HOST=0.0.0.0
PORT=8080
# Backward compatibility (optional): MCP_HOST / MCP_PORT are also read if HOST/PORT are not set

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/HomestayDB

# Next.js Base URL BASE
# Examples:
#   NEXT_API_BASE=http://localhost:3000/api
#   NEXT_API_BASE=https://devhomestay.sthaniyataha.com/api

```

## Running the Server

To run the MCP server:

```bash
python main.py
```

This will start both the Homestay and Officer MCP services on the configured port.

## Integration with ADK Server

The MCP server provides tools that are used by the ADK server. To integrate with the ADK server, ensure the following environment variables are set in the ADK server's `.env` file. Note the required `/mcp` suffixes:

```
MCP_HOMESTAY_URL=http://localhost:8080/homestay/mcp
MCP_OFFICER_URL=http://localhost:8080/officer/mcp
```

## Integration with Next.js Application

The Next.js application primarily talks to the ADK server. For server-to-server callbacks from MCP to Next APIs (e.g., officer management via Next routes), set in the MCP `.env`:

```
NEXT_API_BASE=http://localhost:3000
```

If deploying with a custom domain:

```
NEXT_API_BASE=https://app.example.com
```

## Available Services

### Homestay Filter Service

Endpoint: `/homestay`

Provides tools for searching and filtering homestays based on various criteria such as location, features, ratings, etc.

### Officer Management Service

Endpoint: `/officer`

Provides tools for managing officers under admin accounts, including creating, listing, updating, and deleting officers.

## Authentication

MCP does not validate JWTs directly. For officer operations, MCP forwards the `auth_token` cookie sent by the Next.js server to its own API endpoints. The JWT is issued and validated by the Next.js backend only.

## Troubleshooting

- If you encounter database connection issues, verify that MongoDB is running and accessible.
- If officer API calls fail, confirm `NEXT_API_BASE` points to your Next.js app and that the `auth_token` cookie is set.

## Deployment Notes

- Example production mapping:
  - Homestay-MCP at `https://mcp.example.com`
  - ADK at `https://adk.example.com`
  - Next.js app at `https://app.example.com`
- Then set:
  - In `Homestay-mcp/.env`:
    - `NEXT_API_BASE=https://app.example.com`
  - In `adk/.env`:
    - `MCP_HOMESTAY_URL=https://mcp.example.com/homestay/mcp`
    - `MCP_OFFICER_URL=https://mcp.example.com/officer/mcp`
  - In Next.js `.env`:
    - `NEXT_PUBLIC_ADK_API_BASE=https://adk.example.com`

## License

[License information]