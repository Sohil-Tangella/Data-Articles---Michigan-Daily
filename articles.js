"use strict";

/*
=========================================================
Article Publishing System
File: articles.js

Responsibilities:
- Retrieve all published articles
- Retrieve one article by ID
- Create new articles
- Update existing articles
- Publish draft articles
- Delete articles
- Validate incoming article data
- Convert database column names into frontend-friendly names
=========================================================
*/

const express = require("express");

const {
    run,
    get,
    all
} = require("./database");

/*
 * Create an Express router.
 *
 * server.js connects this router to:
 *
 * /api/articles
 */
const router = express.Router();

/*
 * Allowed article statuses.
 */
const VALID_STATUSES = [
    "draft",
    "published"
];

/*
 * Convert an SQLite article row into the
 * object format expected by the frontend.
 *
 * Database column:
 * image_url
 *
 * Frontend property:
 * imageUrl
 */
function formatArticle(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        title: row.title,
        author: row.author,
        excerpt: row.excerpt,
        content: row.content,
        imageUrl: row.image_url,
        imageAlt: row.image_alt,
        category: row.category,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        publishedAt: row.published_at
    };
}

/*
 * Convert multiple database rows.
 */
function formatArticles(rows) {
    return rows.map(formatArticle);
}

/*
 * Convert an article ID from the URL
 * into a valid positive integer.
 */
function parseArticleId(value) {
    const articleId = Number.parseInt(value, 10);

    if (
        !Number.isInteger(articleId) ||
        articleId <= 0
    ) {
        return null;
    }

    return articleId;
}

/*
 * Validate a status value.
 */
function isValidStatus(status) {
    return VALID_STATUSES.includes(status);
}

/*
 * Check whether a value is a non-empty string.
 */
function isNonEmptyString(value) {
    return (
        typeof value === "string" &&
        value.trim().length > 0
    );
}

/*
 * Return a clean string or null.
 *
 * This is useful for optional fields.
 */
function cleanOptionalString(value) {
    if (
        value === undefined ||
        value === null
    ) {
        return null;
    }

    if (typeof value !== "string") {
        return null;
    }

    const cleanedValue = value.trim();

    return cleanedValue || null;
}

/*
 * Validate the required fields for
 * creating an article.
 */
function validateNewArticle(body) {
    const errors = [];

    if (!isNonEmptyString(body.title)) {
        errors.push(
            "The title field is required."
        );
    }

    if (!isNonEmptyString(body.author)) {
        errors.push(
            "The author field is required."
        );
    }

    if (!isNonEmptyString(body.content)) {
        errors.push(
            "The content field is required."
        );
    }

    if (
        body.status !== undefined &&
        !isValidStatus(body.status)
    ) {
        errors.push(
            "Status must be either draft or published."
        );
    }

    return errors;
}

/*
 * Validate fields submitted during an update.
 */
function validateArticleUpdate(body) {
    const errors = [];

    if (
        body.title !== undefined &&
        !isNonEmptyString(body.title)
    ) {
        errors.push(
            "The title cannot be empty."
        );
    }

    if (
        body.author !== undefined &&
        !isNonEmptyString(body.author)
    ) {
        errors.push(
            "The author cannot be empty."
        );
    }

    if (
        body.content !== undefined &&
        !isNonEmptyString(body.content)
    ) {
        errors.push(
            "The content cannot be empty."
        );
    }

    if (
        body.status !== undefined &&
        !isValidStatus(body.status)
    ) {
        errors.push(
            "Status must be either draft or published."
        );
    }

    return errors;
}

/*
=========================================================
GET /api/articles
=========================================================

Retrieve published articles.

Optional query parameters:

category:
Filter by category.

limit:
Limit the number of returned articles.

Examples:

GET /api/articles

GET /api/articles?category=Data

GET /api/articles?limit=10
*/
router.get("/", async (request, response, next) => {
    try {
        const category =
            cleanOptionalString(
                request.query.category
            );

        let limit = Number.parseInt(
            request.query.limit,
            10
        );

        if (
            !Number.isInteger(limit) ||
            limit <= 0
        ) {
            limit = null;
        }

        /*
         * Begin with the base query.
         *
         * Only published articles are returned
         * to the public archive page.
         */
        let sql = `
            SELECT
                id,
                title,
                author,
                excerpt,
                content,
                image_url,
                image_alt,
                category,
                status,
                created_at,
                updated_at,
                published_at
            FROM articles
            WHERE status = ?
        `;

        const parameters = [
            "published"
        ];

        /*
         * Add a category filter when provided.
         */
        if (category) {
            sql += `
                AND category = ?
            `;

            parameters.push(category);
        }

        /*
         * Display the newest published articles first.
         */
        sql += `
            ORDER BY
                published_at DESC,
                created_at DESC
        `;

        /*
         * Add a result limit when provided.
         */
        if (limit) {
            sql += `
                LIMIT ?
            `;

            parameters.push(limit);
        }

        const rows = await all(
            sql,
            parameters
        );

        response.status(200).json({
            success: true,
            count: rows.length,
            articles: formatArticles(rows)
        });
    } catch (error) {
        next(error);
    }
});

/*
=========================================================
GET /api/articles/:id
=========================================================

Retrieve one article by its ID.

Example:

GET /api/articles/1
*/
router.get("/:id", async (request, response, next) => {
    try {
        const articleId = parseArticleId(
            request.params.id
        );

        if (!articleId) {
            return response.status(400).json({
                success: false,
                error: "The article ID is invalid."
            });
        }

        const row = await get(
            `
                SELECT
                    id,
                    title,
                    author,
                    excerpt,
                    content,
                    image_url,
                    image_alt,
                    category,
                    status,
                    created_at,
                    updated_at,
                    published_at
                FROM articles
                WHERE id = ?
            `,
            [articleId]
        );

        if (!row) {
            return response.status(404).json({
                success: false,
                error: "Article not found."
            });
        }

        return response.status(200).json({
            success: true,
            article: formatArticle(row)
        });
    } catch (error) {
        return next(error);
    }
});

/*
=========================================================
POST /api/articles
=========================================================

Create a new article.

Example request body:

{
    "title": "Campus transportation by the numbers",
    "author": "Daily Data Staff",
    "excerpt": "A summary of transportation data.",
    "content": "The complete article content.",
    "imageUrl": "images/transportation.jpg",
    "imageAlt": "Buses traveling across campus",
    "category": "Data",
    "status": "published"
}
*/
router.post("/", async (request, response, next) => {
    try {
        const validationErrors =
            validateNewArticle(request.body);

        if (validationErrors.length > 0) {
            return response.status(400).json({
                success: false,
                errors: validationErrors
            });
        }

        const title = request.body.title.trim();
        const author = request.body.author.trim();
        const content = request.body.content.trim();

        const excerpt =
            cleanOptionalString(
                request.body.excerpt
            );

        const imageUrl =
            cleanOptionalString(
                request.body.imageUrl
            );

        const imageAlt =
            cleanOptionalString(
                request.body.imageAlt
            );

        const category =
            cleanOptionalString(
                request.body.category
            ) || "General";

        const status =
            request.body.status || "draft";

        /*
         * Set the published timestamp only when
         * the article is initially published.
         */
        const publishedAt =
            status === "published"
                ? new Date().toISOString()
                : null;

        const result = await run(
            `
                INSERT INTO articles (
                    title,
                    author,
                    excerpt,
                    content,
                    image_url,
                    image_alt,
                    category,
                    status,
                    published_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                title,
                author,
                excerpt,
                content,
                imageUrl,
                imageAlt,
                category,
                status,
                publishedAt
            ]
        );

        const createdRow = await get(
            `
                SELECT
                    id,
                    title,
                    author,
                    excerpt,
                    content,
                    image_url,
                    image_alt,
                    category,
                    status,
                    created_at,
                    updated_at,
                    published_at
                FROM articles
                WHERE id = ?
            `,
            [result.id]
        );

        return response.status(201).json({
            success: true,
            message: "Article created successfully.",
            article: formatArticle(createdRow)
        });
    } catch (error) {
        return next(error);
    }
});

/*
=========================================================
PATCH /api/articles/:id
=========================================================

Update an existing article.

Only submitted fields are changed.

Example request body:

{
    "title": "Updated article title",
    "status": "published"
}
*/
router.patch("/:id", async (request, response, next) => {
    try {
        const articleId = parseArticleId(
            request.params.id
        );

        if (!articleId) {
            return response.status(400).json({
                success: false,
                error: "The article ID is invalid."
            });
        }

        const validationErrors =
            validateArticleUpdate(request.body);

        if (validationErrors.length > 0) {
            return response.status(400).json({
                success: false,
                errors: validationErrors
            });
        }

        const existingArticle = await get(
            `
                SELECT *
                FROM articles
                WHERE id = ?
            `,
            [articleId]
        );

        if (!existingArticle) {
            return response.status(404).json({
                success: false,
                error: "Article not found."
            });
        }

        /*
         * Build the UPDATE statement dynamically.
         *
         * Only fields included in the request body
         * will be changed.
         */
        const updates = [];
        const parameters = [];

        if (request.body.title !== undefined) {
            updates.push("title = ?");
            parameters.push(
                request.body.title.trim()
            );
        }

        if (request.body.author !== undefined) {
            updates.push("author = ?");
            parameters.push(
                request.body.author.trim()
            );
        }

        if (request.body.excerpt !== undefined) {
            updates.push("excerpt = ?");
            parameters.push(
                cleanOptionalString(
                    request.body.excerpt
                )
            );
        }

        if (request.body.content !== undefined) {
            updates.push("content = ?");
            parameters.push(
                request.body.content.trim()
            );
        }

        if (request.body.imageUrl !== undefined) {
            updates.push("image_url = ?");
            parameters.push(
                cleanOptionalString(
                    request.body.imageUrl
                )
            );
        }

        if (request.body.imageAlt !== undefined) {
            updates.push("image_alt = ?");
            parameters.push(
                cleanOptionalString(
                    request.body.imageAlt
                )
            );
        }

        if (request.body.category !== undefined) {
            updates.push("category = ?");
            parameters.push(
                cleanOptionalString(
                    request.body.category
                ) || "General"
            );
        }

        if (request.body.status !== undefined) {
            const newStatus = request.body.status;

            updates.push("status = ?");
            parameters.push(newStatus);

            /*
             * When a draft becomes published for the
             * first time, assign a publication date.
             */
            if (
                newStatus === "published" &&
                !existingArticle.published_at
            ) {
                updates.push("published_at = ?");
                parameters.push(
                    new Date().toISOString()
                );
            }

            /*
             * When an article is returned to draft
             * status, remove the publication date.
             */
            if (newStatus === "draft") {
                updates.push("published_at = ?");
                parameters.push(null);
            }
        }

        if (updates.length === 0) {
            return response.status(400).json({
                success: false,
                error: "No valid fields were provided."
            });
        }

        /*
         * Always update the modification timestamp.
         */
        updates.push(
            "updated_at = CURRENT_TIMESTAMP"
        );

        parameters.push(articleId);

        const result = await run(
            `
                UPDATE articles
                SET ${updates.join(", ")}
                WHERE id = ?
            `,
            parameters
        );

        if (result.changes === 0) {
            return response.status(404).json({
                success: false,
                error: "Article not found."
            });
        }

        const updatedRow = await get(
            `
                SELECT
                    id,
                    title,
                    author,
                    excerpt,
                    content,
                    image_url,
                    image_alt,
                    category,
                    status,
                    created_at,
                    updated_at,
                    published_at
                FROM articles
                WHERE id = ?
            `,
            [articleId]
        );

        return response.status(200).json({
            success: true,
            message: "Article updated successfully.",
            article: formatArticle(updatedRow)
        });
    } catch (error) {
        return next(error);
    }
});

/*
=========================================================
DELETE /api/articles/:id
=========================================================

Delete one article permanently.

Example:

DELETE /api/articles/1
*/
router.delete("/:id", async (request, response, next) => {
    try {
        const articleId = parseArticleId(
            request.params.id
        );

        if (!articleId) {
            return response.status(400).json({
                success: false,
                error: "The article ID is invalid."
            });
        }

        const existingArticle = await get(
            `
                SELECT id, title
                FROM articles
                WHERE id = ?
            `,
            [articleId]
        );

        if (!existingArticle) {
            return response.status(404).json({
                success: false,
                error: "Article not found."
            });
        }

        await run(
            `
                DELETE FROM articles
                WHERE id = ?
            `,
            [articleId]
        );

        return response.status(200).json({
            success: true,
            message: "Article deleted successfully.",
            deletedArticle: {
                id: existingArticle.id,
                title: existingArticle.title
            }
        });
    } catch (error) {
        return next(error);
    }
});

/*
 * Export the router so server.js can use it.
 */
module.exports = router;