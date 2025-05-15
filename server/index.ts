import * as dotenv from 'dotenv';
dotenv.config();
console.log("Environment variables loaded, DATABASE_URL exists:", !!process.env.DATABASE_URL);

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createProxyMiddleware, type Options } from 'http-proxy-middleware';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create a simple proxy middleware function
function djangoApiProxy(req: Request, res: Response, next: NextFunction) {
  if (req.url.startsWith('/django-api')) {
    // Log that we're proxying the request
    log(`Proxying request: ${req.method} ${req.url} to Django backend`);
    
    // We'll implement a proper proxy later
    res.status(501).json({ 
      error: 'Django API proxy not fully implemented yet',
      message: 'The Django backend integration is under development' 
    });
    return;
  }
  next();
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Apply the Django API proxy middleware
  app.use(djangoApiProxy);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
