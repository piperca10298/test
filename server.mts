import { createServer } from "node:http";

import next from "next";

import { initSocket } from "./src/lib/socket.mts";

const hostname = "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const isProduction = process.argv.includes("--prod");
const runtimeEnv = process.env as Record<string, string | undefined>;

runtimeEnv.NODE_ENV = isProduction ? "production" : "development";

const server = createServer();
const app = next({
  dev: !isProduction,
  hostname,
  httpServer: server,
  port,
});
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    server.on("request", (request, response) => {
      void handle(request, response);
    });

    initSocket(server);

    server.listen(port, hostname, () => {
      console.log(
        `> NeuroGrid server ready on http://localhost:${port} (${isProduction ? "production" : "development"})`,
      );
    });
  })
  .catch((error: unknown) => {
    console.error("Failed to start NeuroGrid server.", error);
    process.exit(1);
  });
