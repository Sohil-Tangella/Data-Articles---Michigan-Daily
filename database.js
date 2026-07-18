"use strict";

/*
=========================================================
Article Publishing System
File: database.js

Responsibilities:
- Connect to the SQLite database
- Read and execute schema.sql
- Create database tables
- Run INSERT, UPDATE, and DELETE statements
- Retrieve one database row
- Retrieve multiple database rows
- Close the database connection safely
=========================================================
*/

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

/*
 * Create the path to the SQLite database file.
 *
 * The database will be stored in the same folder
 * as this JavaScript file.
 */
const databasePath = path.join(
    __dirname,
    "articles.db"
);

/*
 * Create the path to schema.sql.
 */
const schemaPath = path.join(
    __dirname,
    "schema.sql"
);

/*
 * Open the SQLite database.
 *
 * If articles.db does not already exist,
 * SQLite creates it automatically.
 */
const database = new sqlite3.Database(
    databasePath,
    (error) => {
        if (error) {
            console.error(
                "Unable to connect to the SQLite database:",
                error.message
            );

            return;
        }

        console.log(
            `Connected to SQLite database: ${databasePath}`
        );
    }
);

/*
 * Enable foreign-key support.
 *
 * SQLite does not always enforce foreign keys
 * automatically, so this command turns them on.
 */
database.run(
    "PRAGMA foreign_keys = ON;",
    (error) => {
        if (error) {
            console.error(
                "Unable to enable foreign keys:",
                error.message
            );
        }
    }
);

/*
 * Run an SQL statement that changes the database.
 *
 * Use this function for:
 *
 * INSERT
 * UPDATE
 * DELETE
 * CREATE TABLE
 *
 * The returned object contains:
 *
 * id:
 * The ID of a newly inserted row.
 *
 * changes:
 * The number of rows affected.
 */
function run(sql, parameters = []) {
    return new Promise((resolve, reject) => {
        database.run(
            sql,
            parameters,
            function handleResult(error) {
                if (error) {
                    reject(error);
                    return;
                }

                resolve({
                    id: this.lastID,
                    changes: this.changes
                });
            }
        );
    });
}

/*
 * Retrieve one row from the database.
 *
 * Use this function when expecting
 * a single result.
 *
 * Example:
 *
 * SELECT * FROM articles WHERE id = ?
 */
function get(sql, parameters = []) {
    return new Promise((resolve, reject) => {
        database.get(
            sql,
            parameters,
            (error, row) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(row);
            }
        );
    });
}

/*
 * Retrieve multiple rows from the database.
 *
 * Use this function when expecting
 * a list of results.
 *
 * Example:
 *
 * SELECT * FROM articles
 */
function all(sql, parameters = []) {
    return new Promise((resolve, reject) => {
        database.all(
            sql,
            parameters,
            (error, rows) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(rows);
            }
        );
    });
}

/*
 * Execute a complete SQL script.
 *
 * Unlike run(), exec() can execute multiple
 * SQL statements from one string.
 *
 * This is useful for schema.sql because that
 * file may contain several CREATE statements.
 */
function executeScript(sqlScript) {
    return new Promise((resolve, reject) => {
        database.exec(
            sqlScript,
            (error) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            }
        );
    });
}

/*
 * Initialize the database.
 *
 * This function:
 *
 * 1. Reads schema.sql.
 * 2. Executes its SQL commands.
 * 3. Creates the required tables and indexes.
 *
 * CREATE TABLE IF NOT EXISTS prevents existing
 * tables from being recreated or erased.
 */
async function initializeDatabase() {
    try {
        const schema = await fs.promises.readFile(
            schemaPath,
            "utf8"
        );

        await executeScript(schema);

        console.log(
            "Database tables initialized successfully."
        );
    } catch (error) {
        console.error(
            "Unable to initialize the database:",
            error.message
        );

        throw error;
    }
}

/*
 * Close the SQLite connection safely.
 *
 * server.js calls this function when
 * the backend shuts down.
 */
function closeDatabase() {
    return new Promise((resolve, reject) => {
        database.close((error) => {
            if (error) {
                reject(error);
                return;
            }

            console.log(
                "SQLite database connection closed."
            );

            resolve();
        });
    });
}

/*
 * Export the reusable database functions.
 *
 * articles.js imports run(), get(), and all().
 *
 * server.js imports initializeDatabase()
 * and closeDatabase().
 */
module.exports = {
    run,
    get,
    all,
    initializeDatabase,
    closeDatabase
};