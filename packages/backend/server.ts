import mongoose from "mongoose";
import { createApp } from "./src/app.js";
import { connectDB } from "./src/shared/config/dbconfig.js";
import { env } from "./src/shared/config/env.js";
import { startGracefullShutdown } from "./src/shared/utils/applevel.utils.js";

import { reservationExpiryWorker } from "./src/composition/app.composition.js";

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const app = createApp();

    // Start background worker for reservation cleanup
    reservationExpiryWorker.start();

    const server = app.listen(env.PORT, () => {
      console.log(`server started and listening on port: ${env.PORT}`);
      console.log(`ENVIORNMNET:- ${env.NODE_ENV}`);

      if (env.NODE_ENV == "development") {
        console.log(`Health check:- http://localhost:${env.PORT}/health`);
      }
    });

    const shutdown = async (): Promise<void> => {
      reservationExpiryWorker.stop();
      await mongoose.disconnect();
    };

    process.on("SIGTERM", () =>
      startGracefullShutdown("SIGTERM", server, shutdown)
    );
    process.on("SIGINT", () =>
      startGracefullShutdown("SIGINT", server, shutdown)
    );
  } catch (error) {
    console.log(`Unable to start the server becasue of error:- ${error}`);
    process.exit(1);
  }
};

startServer();
