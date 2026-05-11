import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import createError from "http-errors";
import moment from "moment-timezone";
import morgan from "morgan";
import { APP_PORT } from "./config";
import Sequelize from "./config/sequelize";
import router from "./routes";

const app = express();
app.set("trust proxy", 1);
const corsOptions = {
  origin: true,
  credentials: true,
};

app.use(helmet());
app.use(compression());
app.disable("x-powered-by");
app.disable("etag");

app.get("/health", (req: Request, res: Response) => {
  res.status(200).send({ status: "ok" });
});

moment.tz.setDefault("Asia/Kolkata");

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.urlencoded({ limit: "50mb", extended: false }));
app.use(express.json({ limit: "50mb" }));
// app.use(express.static('public'));
app.use(router);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: false,
    message: "Not Found",
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (createError.isHttpError(err)) {
    res.status(err.status).send({
      status: false,
      message: err.message,
    });
  } else {
    console.error("Unhandled Error:", err);
    res.status(500).send({
      status: false,
      message: "Internal Server Error",
    });
  }
});

let server: any;

async function startServer() {
  try {
    await Sequelize.authenticate();
    console.log("Database Connected");
    if (process.env.NODE_ENV !== "production") {
      await Sequelize.sync({ alter: false, force: false });
      console.log("All models synchronized successfully.");
    }

    server = app.listen(APP_PORT, () => {
      console.log(`Server running on PORT ${APP_PORT}`);

      if (process.send) {
        process.send("ready");
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

function gracefulShutdown(signal: string) {
  console.log(`${signal} received. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      console.log("HTTP server closed.");

      try {
        await Sequelize.close();
        console.log("Database connection closed.");
      } catch (err) {
        console.error("Error closing DB:", err);
      }

      process.exit(0);
    });

    setTimeout(() => {
      console.error("Forcefully shutting down...");
      process.exit(1);
    }, 10000);
  }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

export default app;
