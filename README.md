# Inventory Server

Production-style backend for a smart retail inventory and checkout system built with Node.js, Express, MongoDB, Redis, BullMQ, Razorpay, Firebase, and semantic search.

This project goes beyond basic CRUD. It combines real-time inventory handling, asynchronous job processing, digital payments, AI-assisted categorization, and vector-based search into a backend designed for a small-store or POS-style workflow.

## Why This Project Stands Out

- Built a multi-service backend with API, worker, and Redis-based job processing
- Implemented automatic inventory categorization using stored embeddings with Google GenAI fallback
- Added semantic product search using text embeddings and MongoDB vector search
- Supported both cash and online checkout flows with Razorpay webhook handling
- Designed analytics pipelines for daily, monthly, and category-wise sales tracking
- Added Firebase device-token support for payment status notifications

## What It Does

The system supports a retail workflow from product intake to checkout and reporting:

- staff can add inventory with quantity, price, barcode, and expiry information
- products are categorized automatically and stored with embeddings for future reuse
- checkout supports both cash and online payment flows
- successful purchases update inventory and analytics through background workers
- users can retrieve recent transactions, graph data, category insights, and reports
- inventory can be searched semantically instead of relying only on exact keyword matches

## Tech Stack

- Node.js 20
- Express 5
- MongoDB + Mongoose
- Redis
- BullMQ
- Razorpay
- Firebase Admin SDK
- Google GenAI SDK
- Xenova Transformers
- Nodemailer
- Vitest

## Architecture

The backend follows a layered design:

- `routes` define API endpoints
- `controllers` validate requests and shape responses
- `services` contain business logic
- `models` manage MongoDB persistence
- `workers` process asynchronous jobs such as stock updates, payment handling, notifications, categorization, and report generation

This keeps the API responsive while moving heavier workflows into Redis-backed background processing.

### Key Engineering Highlights

- Inventory categorization is not hardcoded. The worker first tries to reuse an existing category embedding, then falls back to Google GenAI when the item is new.
- Semantic search is implemented with `Xenova/all-MiniLM-L6-v2` embeddings and MongoDB vector search, allowing item discovery by meaning rather than exact string match.
- Digital checkout uses Razorpay order creation plus webhook verification so payment state changes can safely trigger downstream updates.
- Analytics data is incrementally updated during checkout flows for daily, monthly, and category-level reporting.

## Core Features

### Authentication

- JWT-based access and refresh token flow
- password hashing with bcrypt middleware
- protected routes for inventory, checkout, and analytics

### Inventory Management

- add items with barcode, price, quantity, and optional expiry
- store aggregate and expiry-based stock views
- automatically categorize items during ingestion
- reuse stored embeddings for future categorization efficiency

### Semantic Search

- accepts free-text item search queries
- generates embeddings for the query
- uses MongoDB vector search to return similar in-stock items

### Checkout

- cash checkout flow
- digital checkout flow with Razorpay
- webhook-based payment confirmation
- worker-driven stock and analytics updates after payment success

### Analytics and Reporting

- recent transactions endpoint
- daily and monthly sales summaries
- category-wise sales tracking
- background report generation

### Notifications

- stores Firebase device tokens
- sends payment status notifications to client devices

## API Routes

### Auth

- `POST /auth/signup`
- `POST /auth/signin`
- `POST /auth/signout`
- `POST /auth/refresh`
- `POST /auth/postDeviceToken`

### Inventory

- `POST /inventory/addItem`
- `GET /inventory/getItemName`
- `GET /inventory/getItemInformation`
- `GET /inventory/getSearchedItem` for semantic item search

### Checkout

- `POST /checkout/cashCheckout`
- `POST /checkout/digitalCheckout`
- `POST /razor/webhook`

### Analytics

- `GET /analytics/getRecentTransactions`
- `GET /analytics/getGraphData`
- `GET /analytics/getCategories`
- `GET /analytics/getCategoryWiseSales`
- `GET /analytics/report`

## Project Structure

```text
src/
  config/        Integrations such as Firebase, Razorpay, mailer, and GenAI
  controllers/   Request validation and response handling
  middleware/    Auth and error-handling middleware
  models/        Mongoose models
  routes/        API route definitions
  services/      Core business logic
  workers/       BullMQ workers and job handlers
  index.mjs      HTTP server entrypoint
  queue.mjs      Shared BullMQ queue connection
tests/
  controllers/   Controller-level tests
  middleware/    Middleware tests
  services/      Service-layer tests
  workers/       Worker job tests
```

## Requirements

You need these services or credentials available before starting the app:

- MongoDB connection string via `MONGO_URI` or `MONGO_ATLAS_URI`
- Redis running on the configured host and port
- JWT secrets for auth
- Razorpay keys for digital checkout
- a Firebase service account JSON file if you use push notifications

Optional integrations:

- `SMTP_*` values for mail and report delivery
- `GEMINI_API_KEY` for automatic categorization when an item cannot be matched to an existing category embedding

## Environment Variables

Create a `.env` file in the project root.

```env
PORT=5000
MONGO_URI=
MONGO_ATLAS_URI=
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
SALT_ROUND=10

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/inventory-firebase-adminsdk.json

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

GEMINI_API_KEY=
```

Notes:

- set either `MONGO_URI` or `MONGO_ATLAS_URI`
- keep the Firebase service account file outside version control
- `secrets/` is a good local place for credentials

Example:

```text
secrets/inventory-firebase-adminsdk.json
```

## Run Locally

Install dependencies:

```bash
npm install
```

Start the API server:

```bash
npm run dev
```

Start the worker in a second terminal:

```bash
npm run dev:worker
```

Run tests:

```bash
npm test
```

Useful scripts:

- `npm run start` starts the API without nodemon
- `npm run start:worker` starts the worker without nodemon
- `npm run test:watch` runs Vitest in watch mode

## Docker

This repository includes two Compose setups:

- `docker-compose.yml` for a more production-like local run
- `docker-compose.dev.yml` for development with `nodemon`

Both Compose files start:

- `api`
- `worker`
- `redis`

MongoDB is not included in either Compose file, so the app must connect to an external MongoDB instance using `MONGO_URI` or `MONGO_ATLAS_URI`.

### Production-like Compose

```bash
docker compose up --build
```

Background mode:

```bash
docker compose up --build -d
```

Stop:

```bash
docker compose down
```

Default access:

- API: `http://localhost:5000`
- Redis: `localhost:6379`

### Development Compose

```bash
docker compose -f docker-compose.dev.yml up --build
```

Background mode:

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

Stop:

```bash
docker compose -f docker-compose.dev.yml down
```

The development stack uses `Dockerfile.dev`, runs `npm run dev` and `npm run dev:worker`, and mounts `./secrets` into the containers as `/app/secrets`.

## Testing

The Vitest suite focuses on fast backend feedback:

- controller validation and response behavior
- service-layer logic
- auth middleware behavior
- worker job logic

Run:

```bash
npm test
```

## Future Improvements

- add integration tests against a real test database and Redis
- add OpenAPI documentation with example requests and responses
- add healthcheck and readiness endpoints
- add stronger security hardening and rate limiting
- add deployment notes for production infrastructure
