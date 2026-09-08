"use strict";

/*
=========================================================
Michigan Daily Article Publishing System
File: database.js

Responsibilities:
- Connect to PostgreSQL
- Manage a reusable connection pool
- Execute parameterized SQL queries
- Retrieve single database rows
- Read and execute schema.sql
- Initialize database tables and indexes
- Verify database connectivity
- Close database connections safely
=========================================================
*/

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

require("dotenv").config();


/*
=========================================================
PostgreSQL Connection Pool
=========================================================
*/

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number.parseInt(
        process.env.DB_PORT || "5432",
        10
    ),
    database:
        process.env.DB_NAME ||
        "michigan_daily",
    user:
        process.env.DB_USER ||
        "postgres",
    password:
        process.env.DB_PASSWORD ||
        "postgres",

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});


/*
 * Log unexpected connection-pool errors.
 *
 * This prevents idle PostgreSQL client errors
 * from failing silently.
 */
pool.on("error", (error) => {
    console.error(
        "Unexpected PostgreSQL connection error:",
        error.message
    );
});


/*
=========================================================
Schema Path
=========================================================
*/

const schemaPath = path.join(
    __dirname,
    "schema.sql"
);


/*
=========================================================
Database Query Helpers
=========================================================
*/

/*
 * Execute a parameterized PostgreSQL query.
 *
 * Use this function when:
 * - retrieving multiple rows
 * - running general SQL statements
 *
 * Example:
 *
 * query(
 *     "SELECT * FROM articles WHERE status = $1",
 *     ["published"]
 * )
 */
async function query(
    sql,
    parameters = []
) {
    try {
        const result = await pool.query(
            sql,
            parameters
        );

        return result.rows;

    } catch (error) {
        console.error(
            "Database query failed:",
            error.message
        );

        throw error;
    }
}


/*
 * Execute a query and return the first row.
 *
 * Returns null when no matching record exists.
 *
 * This is useful for:
 * - retrieving one article
 * - INSERT ... RETURNING
 * - UPDATE ... RETURNING
 * - DELETE ... RETURNING
 */
async function get(
    sql,
    parameters = []
) {
    try {
        const result = await pool.query(
            sql,
            parameters
        );

        return result.rows[0] || null;

    } catch (error) {
        console.error(
            "Database query failed:",
            error.message
        );

        throw error;
    }
}


/*
=========================================================
Database Health Check
=========================================================
*/

async function checkDatabaseConnection() {
    let client;

    try {
        client = await pool.connect();

        await client.query(
            "SELECT 1;"
        );

        console.log(
            "PostgreSQL connection verified."
        );

        return true;

    } catch (error) {
        console.error(
            "Unable to connect to PostgreSQL:",
            error.message
        );

        throw error;

    } finally {
        if (client) {
            client.release();
        }
    }
}


/*
=========================================================
Database Initialization
=========================================================
*/

/*
 * Initialize the PostgreSQL schema.
 *
 * This function:
 *
 * 1. Reads schema.sql.
 * 2. Opens a PostgreSQL client.
 * 3. Starts a transaction.
 * 4. Executes the schema.
 * 5. Commits the transaction.
 *
 * If initialization fails, the transaction
 * is rolled back.
 */
async function initializeDatabase() {
    let client;

    try {
        const schema =
            await fs.promises.readFile(
                schemaPath,
                "utf8"
            );

        client = await pool.connect();

        await client.query("BEGIN");

        await client.query(schema);

        await client.query("COMMIT");

        console.log(
            "PostgreSQL schema initialized successfully."
        );

    } catch (error) {
        if (client) {
            try {
                await client.query(
                    "ROLLBACK"
                );
            } catch (
                rollbackError
            ) {
                console.error(
                    "Database rollback failed:",
                    rollbackError.message
                );
            }
        }

        console.error(
            "Unable to initialize PostgreSQL schema:",
            error.message
        );

        throw error;

    } finally {
        if (client) {
            client.release();
        }
    }
}


/*
=========================================================
Database Shutdown
=========================================================
*/

/*
 * Close all PostgreSQL connections.
 *
 * server.js should call this function when
 * the application shuts down.
 */
async function closeDatabase() {
    try {
        await pool.end();

        console.log(
            "PostgreSQL connection pool closed."
        );

    } catch (error) {
        console.error(
            "Unable to close PostgreSQL connections:",
            error.message
        );

        throw error;
    }
}


/*
=========================================================
Exports
=========================================================
*/

module.exports = {
    query,
    get,
    checkDatabaseConnection,
    initializeDatabase,
    closeDatabase
};
