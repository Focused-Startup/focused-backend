# focused-backend

Barebone Express backend.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

Or run without auto-reload:

```bash
npm start
```

## App Request Validation

Protected endpoints expect these request headers from the Focused mobile app:

```text
x-focused-app-id: focused
x-focused-app-secret: <your FOCUSED_APP_SECRET value>
```

Configure these environment variables before starting the server:

```text
FOCUSED_APP_ID=focused
FOCUSED_APP_SECRET=replace-this-with-a-long-random-secret
```

## Swagger

After the server is running, open:

```text
http://localhost:3000/api-docs
```

The OpenAPI JSON is also available at:

```text
http://localhost:3000/api-docs.json
```