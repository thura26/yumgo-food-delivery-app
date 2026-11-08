import { fileURLToPath, URL } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { handleGeocode } from "./server/geocode.ts";

type NextFunction = (error?: unknown) => void;

function geocodeApi(): Plugin {
  const middleware = async (
    req: IncomingMessage,
    res: ServerResponse,
    next: NextFunction,
  ) => {
    if (!req.url?.startsWith("/api/geocode")) {
      next();
      return;
    }

    try {
      const request = new Request(
        new URL(req.url, "http://localhost"),
      );
      const response = await handleGeocode(request);

      res.statusCode = response.status;
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Geocoding service unavailable" }));
    }
  };

  return {
    name: "yumgo-geocode-api",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  plugins: [react(), geocodeApi()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: "dist",
  },
});
