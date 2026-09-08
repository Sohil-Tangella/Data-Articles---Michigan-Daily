"use strict";

/*
=========================================================
Michigan Daily Article Publishing System
File: server.js

Responsibilities:
- Create and configure the Express server
- Serve the frontend application
- Enable JSON and form request bodies
- Register article API routes
- Verify and initialize PostgreSQL
- Provide API health checks
- Handle missing routes
- Handle unexpected server errors
- Start and stop the server safely
=========================================================
*/

const path = require("path");
const express = require("express");

require("dotenv").config();

const articlesRouter = require("./articles");

const {
    checkDatabaseConnection,
    initializeDatabase,
    closeDatabase
} = require("./database");


// =========================================================
// Application Configuration
// =========================================================

const app = express();

const PORT =
    Number.parseInt(
        process.env.PORT || "3000",
        10
    );


// =========================================================
// Request Middleware
// =========================================================

/*
 * Parse JSON request bodies.
 *
 * The request-size limit helps prevent unexpectedly
 * large payloads from being accepted by the API.
 */
app.use(
    express.json({
        limit: "1mb"
    })
);


/*
 * Parse standard HTML form submissions.
 */
app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb"
    })
);


/*
 * Log incoming requests.
 */
app.use(
    (
        request,
        response,
        next
    ) => {
        const currentTime =
            new Date().toISOString();

        console.log(
            `[${currentTime}] ` +
            `${request.method} ` +
            `${request.originalUrl}`
        );

        next();
    }
);


// =========================================================
// Static Frontend
// =========================================================

/*
 * Serve frontend files directly from this project.
 *
 * This allows the public site and API to use the same
 * origin, so the frontend can request:
 *
 * /api/articles
 *
 * without hard-coding localhost ports or requiring CORS.
 */
app.use(
    express.static(__dirname)
);


// =========================================================
// System Routes
// =========================================================

/*
 * Health-check endpoint.
 *
 * Verifies both the Express API and PostgreSQL connection.
 */
app.get(
    "/api/health",
    async (
        request,
        response
    ) => {
        try {
            await checkDatabaseConnection();

            return response
                .status(200)
                .json({
                    success: true,
                    status: "healthy",
                    services: {
                        api: "healthy",
                        postgresql: "healthy"
                    }
                });

        } catch (error) {
            return response
                .status(503)
                .json({
                    success: false,
                    status: "unhealthy",
                    services: {
                        api: "healthy",
                        postgresql: "unavailable"
                    }
                });
        }
    }
);


// =========================================================
// Article API
// =========================================================

app.use(
    "/api/articles",
    articlesRouter
);


// =========================================================
// Frontend Route
// =========================================================

/*
 * Return the main Data page.
 *
 * Express.static() already serves index.html at "/",
 * but this route makes the intended application entry
 * point explicit.
 */
app.get(
    "/",
    (
        request,
        response
    ) => {
        response.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );
    }
);


// =========================================================
// 404 Handler
// =========================================================

app.use(
    (
        request,
        response
    ) => {
        /*
         * API routes receive a JSON error response.
         */
        if (
            request.originalUrl.startsWith(
                "/api/"
            )
        ) {
            return response
                .status(404)
                .json({
                    success: false,
                    error: "Route not found.",
                    method:
                        request.method,
                    path:
                        request.originalUrl
                });
        }

        /*
         * Non-API routes receive a simple text response.
         */
        return response
            .status(404)
            .send(
                "Page not found."
            );
    }
);


// =========================================================
// Global Error Handler
// =========================================================

app.use(
    (
        error,
        request,
        response,
        next
    ) => {
        console.error(
            "Unexpected server error:",
            error
        );

        if (response.headersSent) {
            return next(error);
        }

        return response
            .status(500)
            .json({
                success: false,
                error:
                    "An unexpected server error occurred."
            });
    }
);


// =========================================================
// Server Lifecycle
// =========================================================

let httpServer = null;
let isShuttingDown = false;


/*
 * Verify PostgreSQL, initialize the schema,
 * and then begin accepting requests.
 */
async function startServer() {
    try {
        console.log(
            "Starting Michigan Daily Article Publishing System..."
        );

        await checkDatabaseConnection();

        await initializeDatabase();

        httpServer =
            app.listen(
                PORT,
                () => {
                    console.log(
                        `Server running at http://localhost:${PORT}`
                    );

                    console.log(
                        `Data page: http://localhost:${PORT}/`
                    );

                    console.log(
                        `Health check: http://localhost:${PORT}/api/health`
                    );

                    console.log(
                        `Articles API: http://localhost:${PORT}/api/articles`
                    );
                }
            );

    } catch (error) {
        console.error(
            "The server could not be started:",
            error
        );

        try {
            await closeDatabase();
        } catch (
            closeError
        ) {
            console.error(
                "Unable to close database after startup failure:",
                closeError
            );
        }

        process.exit(1);
    }
}


/*
 * Gracefully stop HTTP traffic and close
 * the PostgreSQL connection pool.
 */
async function shutdownServer(
    signal
) {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    console.log(
        `\nReceived ${signal}. Shutting down...`
    );

    try {
        if (httpServer) {
            await new Promise(
                (
                    resolve,
                    reject
                ) => {
                    httpServer.close(
                        (error) => {
                            if (error) {
                                reject(
                                    error
                                );

                                return;
                            }

                            resolve();
                        }
                    );
                }
            );
        }

        await closeDatabase();

        console.log(
            "Server stopped successfully."
        );

        process.exit(0);

    } catch (error) {
        console.error(
            "An error occurred while stopping the server:",
            error
        );

        process.exit(1);
    }
}


// =========================================================
// Process Signals
// =========================================================

process.on(
    "SIGINT",
    () => {
        shutdownServer(
            "SIGINT"
        );
    }
);


process.on(
    "SIGTERM",
    () => {
        shutdownServer(
            "SIGTERM"
        );
    }
);


process.on(
    "unhandledRejection",
    (
        reason
    ) => {
        console.error(
            "Unhandled promise rejection:",
            reason
        );

        shutdownServer(
            "unhandledRejection"
        );
    }
);


process.on(
    "uncaughtException",
    (
        error
    ) => {
        console.error(
            "Uncaught exception:",
            error
        );

        shutdownServer(
            "uncaughtException"
        );
    }
);


// =========================================================
// Start Application
// =========================================================

startServer();
