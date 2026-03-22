# Inventory Server

Backend for a retail inventory and checkout system built with Node.js, Express, MongoDB, BullMQ, Redis, Razorpay, and Firebase.

This project handles inventory management, cash and digital checkout workflows, background job processing, and sales analytics for a small-store style environment.

## Features

- JWT authentication with access and refresh tokens
- Inventory management with barcode and expiry tracking
- Cash checkout workflow
- Digital checkout workflow with Razorpay
- Background processing with BullMQ and Redis
- Sales analytics by day, month, and category
- Firebase push notifications for payment updates
- Request validation with Zod

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- BullMQ
- Redis
- Razorpay
- Firebase Admin SDK
- Zod

## Project Structure

```text
src/
  controllers/   Request validation and response handling
  middleware/    Authentication and request middleware
  models/        Mongoose schemas and indexes
  routes/        Express route definitions
  services/      Business logic
  workers/       Queue job processors
  index.mjs      API entrypoint
  queue.mjs      BullMQ queue setup
```

## Architecture

The backend follows a layered structure:

- `routes` define API endpoints
- `controllers` validate input and shape responses
- `services` hold business logic
- `models` define MongoDB collections
- `workers` process asynchronous jobs for checkout, inventory updates, and analytics aggregation

This keeps request handling lightweight while moving heavier workflows into background jobs.

## Core Workflows

### Authentication

- Users sign up with email and password
- Passwords are hashed with bcrypt
- Signin returns access and refresh tokens
- Protected routes use JWT verification middleware

### Add Inventory

- Authenticated users submit item details
- Request payload is validated with Zod
- The API enqueues an inventory job
- Worker logic updates total stock and expiry-based stock collections

### Cash Checkout

- User submits purchased items and total amount
- Checkout data is added to the queue
- Worker logic reduces stock, stores transaction data, and updates analytics

### Digital Checkout

- Razorpay order is created for the purchase
- Individual item transaction records are stored
- Payment status is updated through the webhook flow
- Successful payments update inventory and analytics
- Firebase notifications can be sent back to the user device

### Analytics

The backend stores and serves:

- recent transactions
- daily sales
- monthly sales
- category-wise daily sales
- category-wise monthly sales

## Main API Routes

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
- `GET /inventory/getSearchedItem`

### Checkout

- `POST /checkout/cashCheckout`
- `POST /checkout/digitalCheckout`
- `POST /razor/webhook`

### Analytics

- `GET /analytics/getRecentTransactions`
- `GET /analytics/getGraphData`
- `GET /analytics/getCategories`
- `GET /analytics/getCategoryWiseSales`

## Environment Variables

Create a `.env` file with:

```env
MONGO_URI=
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/inventory-firebase-adminsdk.json
```

This project also requires:

- a running Redis instance
- a Firebase service account JSON file

Store the Firebase service account outside version control, for example:

```text
secrets/inventory-firebase-adminsdk.json
```

The `secrets/` directory is gitignored, so credentials do not get committed.

## Installation

```bash
npm install
```

## Run the Project

Start the API server:

```bash
npm run dev
```

Start the worker:

```bash
npm run dev:worker
```

Run tests:

```bash
npm test
```

## Run With Docker

This repo now includes:

- `Dockerfile` for the Node app image
- `docker-compose.yml` for the API server, BullMQ worker, and Redis

Before starting, make sure your `.env` has valid values for MongoDB, JWT, Razorpay, and Firebase.

If you use Firebase notifications, the service account file also needs to exist at the path referenced by `FIREBASE_SERVICE_ACCOUNT_PATH`.

Build and start everything:

```bash
docker compose up --build
```

Run in the background:

```bash
docker compose up --build -d
```

Stop the stack:

```bash
docker compose down
```

By default:

- API runs on `http://localhost:5000`
- Redis runs on `localhost:6379`
- the worker runs as a separate container

The app image uses:

- `npm run start` for the API
- `npm run start:worker` for the worker

The Docker setup expects:

- `MONGO_ATLAS_URI` or `MONGO_URI`
- `REDIS_HOST` and `REDIS_PORT` are injected automatically in Compose

## Test Strategy

The test setup focuses on the parts that give the best backend signal:

- controller validation and response behavior
- service-layer queue payload creation
- business-logic units that can be verified without spinning up the full stack

The current scaffold uses Vitest and mocks external dependencies so tests stay fast and deterministic.

## Future Improvements

- Add MongoDB transactions for checkout consistency
- Add integration tests against a test database
- Add centralized error handling
- Add API documentation
- Add rate limiting and security hardening
