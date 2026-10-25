import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { env } from "./shared/config/env.js";
import compression from "compression";
import morgan from "morgan";
import { logger } from "./shared/utils/logging.utils.js";
import { randomUUID } from "node:crypto";
import { globalErrorHandler } from "./shared/middlewares/globalErrorHandler.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import {
  authRouter,
  userRouter,
  brandRouter,
  cartRouter,
  categoryRouter,
  orderRouter,
  productRouter,
  uploadRouter,
  variantRouter,
} from "./composition/app.composition.js";

const setupMiddleWares = (app: express.Application): void => {
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV == "development" ? false : undefined,
    }),
  );

  const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
      optionsSuccessStatus: 200,
    }),
  );

  app.use(compression());

  app.use((req: Request, res: Response, next: NextFunction) => {
    req.id = randomUUID();
    req.log = logger.child({ reqId: req.id });

    req.log.info({ method: req.method, url: req.url }, "Incoming Request");

    next();
  });

  if (env.NODE_ENV == "production") {
    morgan.token("user-id", (req) =>
      //@ts-ignore
      req.user?.id ? String(req.user.id) : "Guest",
    );
    //@ts-ignore
    morgan.token("req-id", (req) => req.id);

    app.use(
      morgan(
        (tokens, req, res) => {
          return JSON.stringify({
            timestamp: new Date().toISOString(),
            reqId: tokens["req-id"](req, res),
            method: tokens.method(req, res),
            url: tokens.url(req, res),
            status: tokens.status(req, res),
            responseTime: tokens["response-time"](req, res),
            userId: tokens["user-id"](req, res),
          });
        },
        {
          stream: {
            write: (mssg: string) => {
              try {
                logger.info(JSON.parse(mssg));
              } catch (error) {
                logger.error("failed to parse morgan log ");
              }
            },
          },
        },
      ),
    );
  } else {
    app.use(morgan("dev"));
  }

  app.use(cookieParser());

  app.use(
    express.json({
      limit: "10mb",
      type: "application/json",
      verify: (req: Request, _res: Response, buf: Buffer) => {
        req.rawBody = buf.toString("utf-8");
      },
    }),
  );

  app.use(
    express.urlencoded({
      limit: "10mb",
      extended: true,
    }),
  );
};

export const createApp = (): express.Application => {
  const app = express();

  //setting up the  middlewares
  setupMiddleWares(app);

  app.get("/health", (req: Request, res: Response) => {
    res.json({
      status: "OK",
      timeStamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  // Auth & User endpoints for REST API
  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);

  // Catalog endpoints
  app.use("/api/catalog/brands", brandRouter);
  app.use("/api/catalog/categories", categoryRouter);
  app.use("/api/catalog/products", productRouter);
  app.use("/api/catalog/variants", variantRouter);

  // Cart & Order endpoints
  app.use("/api/cart", cartRouter);
  app.use("/api/orders", orderRouter);

  // Upload signing endpoint (direct-to-cloud upload)
  app.use("/api/upload", uploadRouter);

  //global error handler
  app.use(globalErrorHandler);

  return app;
};
