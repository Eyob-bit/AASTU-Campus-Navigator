# AASTU Campus Navigator

Indoor navigation platform developed for Addis Ababa Science and Technology University.

## Features

- Building management
- Floor management
- Office management
- Staff management
- Search aliases
- Intelligent search
- Indoor panorama navigation
- Shortest path generation
- REST API

## Tech Stack

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- Zod

## Installation

```bash
git clone https://github.com/AASTU-AI-and-robotics-Center/AASTU-Campus-Navigator.git
cd AASTU-Campus-Navigator/server
npm install
cp .env.example .env
npm run dev
```

Update `DATABASE_URL` in `.env` with your PostgreSQL connection string before starting the server.

The API is available at `http://localhost:5000/api`.

## Documentation

- [API Reference](server/docs/API.md)
- [Error Reference](server/docs/ERRORS.md)

## Project Structure

```
server/
├── docs/           API and error documentation
├── prisma/         Database schema and migrations
└── src/
    ├── config/     Application configuration and environment setup
    ├── controllers/ Receives HTTP requests and sends HTTP responses
    ├── dto/        Data transfer objects exposed in API responses
    ├── middlewares/ Express middleware for auth, uploads, and validation
    ├── repositories/ Database access and query logic
    ├── routes/     HTTP route definitions mapped to controllers
    ├── scripts/    Development and maintenance utility scripts
    ├── services/   Business logic and orchestration layer
    ├── utils/      Shared helpers and response utilities
    ├── validators/ Request body and query validation schemas
    ├── app.ts      Express application setup
    └── server.ts   HTTP server entry point
```

### Folder Descriptions

| Folder | Description |
| ------ | ----------- |
| `controllers/` | Receives HTTP requests and sends HTTP responses. |
| `repositories/` | Handles database queries and persistence operations. |
| `services/` | Implements business rules and coordinates repository calls. |
| `dto/` | Defines the shape of data returned to API clients. |
| `validators/` | Validates incoming request bodies and query parameters with Zod. |
| `routes/` | Maps URL paths and HTTP methods to controller handlers. |
| `config/` | Loads environment variables and configures shared clients. |
| `middlewares/` | Runs cross-cutting request processing such as uploads and errors. |
| `utils/` | Provides reusable helpers used across the application. |
| `scripts/` | Contains one-off development and database utility scripts. |

## Environment Variables

Copy `server/.env.example` to `server/.env` and configure:

| Variable | Description |
| -------- | ----------- |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default: `5000`) |
| `NODE_ENV` | Runtime environment (`development`, `production`) |
| `JWT_SECRET` | Secret key for JWT signing |

Never commit the real `.env` file.
