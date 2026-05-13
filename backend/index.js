import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Keep backend date/time calculations aligned to IST globally.
process.env.TZ = process.env.TZ || "Asia/Kolkata";

import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import { assertFileManagementConfig } from "./config/fileManagement.js";
import { registerV1ApiRoutes } from "./registerV1ApiRoutes.js";

import requestContextMiddleware from "./middlewares/requestContextMiddleware.js";
import requestLoggerMiddleware from "./middlewares/requestLoggerMiddleware.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

import socketServer from "./socket/socketServer.js";

assertFileManagementConfig();

const frontendOrigins = (process.env.FRONTEND_URL ?? "https://power.spspl.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

connectDB();

const app = express();

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(cookieParser());

app.use(
  cors({
    origin: frontendOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
  }),
);

app.options(/.*/, cors());

app.use(requestContextMiddleware);
app.use(requestLoggerMiddleware);

app.get("/", (req, res) => {
  res.send("Welcome to Power DB Server.");
});

registerV1ApiRoutes(app);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: frontendOrigins,
    credentials: true,
  },
});

app.set("io", io);

socketServer(io);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";
const MODE = process.env.NODE_ENV || "development";

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT} in ${MODE} mode`);
});
