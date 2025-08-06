const express = require("express");
const { resolve } = require("path");
const mongoose = require("mongoose");
const connectDB = require("./config/database");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const salesRoutes = require("./routes/sales.routes");
const deliveryRoutes = require("./routes/delivery.routes");
const inventoryRouter = require("./routes/inventory.routes");
const productionManagerRoutes = require("./routes/production/manager.routes");
const dcutBagmaking = require("./routes/dcut/bagmaking.routes");
const wcutBagmaking = require("./routes/wcut/bagmaking.routes");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const path = require("path");
const morgan = require("morgan");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3010;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.static("static"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure uploads directory exists
const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads", "profiles");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.get("/", (req, res) => {
  res.sendFile(resolve(__dirname, "pages/index.html"));
});

app.get("/health", (req, res) => {
  const mongoStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    status: "ok",
    mongodb: mongoStatus,
  });
});

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/production/manager", productionManagerRoutes);
app.use("/api/inventory", inventoryRouter);
app.use("/api/wcut", wcutBagmaking);
app.use("/api/dcut", dcutBagmaking);

// Error handling middleware
app.use(errorHandler);

// Create HTTP server
const server = app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
});

// Handle server errors
server.on("error", (error) => {
  logger.error("Server error:", error);
  if (error.code === "EADDRINUSE") {
    logger.error(`Port ${port} is already in use`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      logger.info("MongoDB connection closed.");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      logger.info("MongoDB connection closed.");
      process.exit(0);
    });
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  server.close(() => {
    process.exit(1);
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  server.close(() => {
    process.exit(1);
  });
});
