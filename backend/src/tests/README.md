# Tests

This directory contains integration and unit tests for the Stockify backend.

## Running tests

```bash
npm test
```

Jest is configured to run all files matching `**/tests/**/*.test.js` in band (serially) to avoid database conflicts.

## Test file naming convention

```
auth.test.js
products.test.js
orders.test.js
```

## Setup

Tests use `supertest` to make HTTP requests against the Express app without starting a real server.
Set up a separate test database and point `DATABASE_URL` in a `.env.test` file at it.
