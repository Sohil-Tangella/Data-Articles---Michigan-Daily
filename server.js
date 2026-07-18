"use strict";

/*
=========================================================
Article Publishing System
File: server.js

Responsibilities:
- Create the Express server
- Enable JSON request bodies
- Enable frontend-to-backend communication
- Connect the article API routes
- Initialize the SQLite database
- Handle missing routes
- Handle unexpected errors
- Start and stop the server safely
=========================================================
*/

const express = require("express");
const cors = require("cors");

const articlesRouter = require("./articles");

const {
    initializeDatabase,
    closeDatabase
} = require("./database");

/*
 * Create the Express application.
 */
const app = express();

/*
 * Use the environment port when deployed.
 *
 * Otherwise, use port 3000 during local development.
 */
const PORT = process.env.PORT || 3000;

/*
 * Enable Cross-Origin Resource Sharing.
 *
 * This allows the frontend to make requests to the
 * backend when they run on different local ports.
 *
 * Example:
 *
 * Frontend:
 * http://localhost:5500
 *
 * Backend:
 * http://localhost:3000
 */
app.use(cors());

/*
 * Allow Express to read JSON request bodies.
 *
 * Example request body:
 *
 * {
 *     "title": "New article",
 *     "author": "Daily Staff"
 * }
 */
app.use(express.json());

/*
 * Allow Express to read form data.
 *
 * This is useful when data is submitted from
 * a standard HTML form.
 */
app.use(
    express.urlencoded({
        extended: true
    })
);

/*
 * Simple request logger.
 *
 * Each incoming request is printed in the terminal.
 *
 * Example:
 *
 * GET /api/articles
 * POST /api/articles
 */
app.use((request, response, next) => {
    const currentTime = new Date().toISOString();

    console.log(
        `[${currentTime}] ${request.method} ${request.originalUrl}`
    );

    next();
});

/*
 * Health-check route.
 *
 * This route can be used to confirm that
 * the backend server is running.
 *
 * Visit:
 *
 * http://localhost:3000/api/health
 */
app.get("/api/health", (request, response) => {
    response.status(200).json({
        success: true,
        message: "The article API is running."
    });
});

/*
 * Connect the article routes.
 *
 * Every route inside articles.js begins with:
 *
 * /api/articles
 *
 * Examples:
 *
 * GET    /api/articles
 * GET    /api/articles/1
 * POST   /api/articles
 * PATCH  /api/articles/1
 * DELETE /api/articles/1
 */
app.use("/api/articles", articlesRouter);

/*
 * Handle routes that do not exist.
 *
 * This middleware runs only when no earlier
 * route matched the incoming request.
 */
app.use((request, response) => {
    response.status(404).json({
        success: false,
        error: "Route not found.",
        method: request.method,
        path: request.originalUrl
    });
});

/*
 * Global error-handling middleware.
 *
 * Express recognizes this as an error handler because
 * it contains four parameters:
 *
 * error
 * request
 * response
 * next
 */
app.use((error, request, response, next) => {
    console.error("Unexpected server error:", error);

    /*
     * Avoid sending another response if Express
     * has already started sending one.
     */
    if (response.headersSent) {
        return next(error);
    }

    return response.status(500).json({
        success: false,
        error: "An unexpected server error occurred."
    });
});

/*
 * Store the running HTTP server.
 *
 * This allows the application to shut down safely.
 */
let httpServer = null;

/*
 * Initialize the database and start the server.
 */
async function startServer() {
    try {
        /*
         * Create the database tables before accepting
         * any incoming API requests.
         */
        await initializeDatabase();

        httpServer = app.listen(PORT, () => {
            console.log(
                `Server running at http://localhost:${PORT}`
            );

            console.log(
                `Health check: http://localhost:${PORT}/api/health`
            );

            console.log(
                `Articles API: http://localhost:${PORT}/api/articles`
            );
        });
    } catch (error) {
        console.error(
            "The server could not be started:",
            error
        );

        process.exit(1);
    }
}

/*
 * Safely stop the HTTP server and database connection.
 */
async function shutdownServer(signal) {
    console.log(`\nReceived ${signal}. Shutting down...`);

    try {
        /*
         * Stop accepting new HTTP requests.
         */
        if (httpServer) {
            await new Promise((resolve, reject) => {
                httpServer.close((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            });
        }

        /*
         * Close the SQLite database connection.
         */
        await closeDatabase();

        console.log("Server stopped successfully.");

        process.exit(0);
    } catch (error) {
        console.error(
            "An error occurred while stopping the server:",
            error
        );

        process.exit(1);
    }
}

/*
 * Handle common terminal shutdown signals.
 *
 * SIGINT:
 * Usually triggered by pressing Control + C.
 *
 * SIGTERM:
 * Usually sent by a hosting platform or operating system.
 */
process.on("SIGINT", () => {
    shutdownServer("SIGINT");
});

process.on("SIGTERM", () => {
    shutdownServer("SIGTERM");
});

/*
 * Catch rejected promises that were not handled elsewhere.
 */
process.on("unhandledRejection", (reason) => {
    console.error(
        "Unhandled promise rejection:",
        reason
    );
});

/*
 * Catch unexpected synchronous errors.
 */
process.on("uncaughtException", (error) => {
    console.error(
        "Uncaught exception:",
        error
    );

    shutdownServer("uncaughtException");
});

/*
 * Begin running the backend application.
 */
startServer();