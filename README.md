# Simple Express Demo

> Express: fast, unopinionated, minimalist web framework for Node.js

This project shows a simple express server with MongoDB integration, serving a single HTML page and using `express.static` to serve static files.

## Prerequisites

Before running this application, make sure you have:

1. Node.js installed
2. MongoDB installed and running locally

## Setup

1. Install MongoDB if you haven't already:
   - [MongoDB Download Page](https://www.mongodb.com/try/download/community)
   - Follow the installation instructions for your OS

2. Start MongoDB:
   - Windows: Run `mongod` command
   - Linux/Mac: Run `sudo service mongod start` or `brew services start mongodb-community`

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the application:
   ```bash
   npm start
   ```

## API Endpoints

- `GET /health` - Check application health and MongoDB connection status
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user

Check out the [express documentation](https://expressjs.com/) for more information.