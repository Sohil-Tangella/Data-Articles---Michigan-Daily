"use strict";

/*
=========================================================
Michigan Daily Article Publishing System
File: articles.js

Responsibilities:
- Retrieve published articles
- Retrieve individual articles
- Search and filter articles
- Paginate article results
- Create articles
- Update article content and workflow state
- Delete articles
- Validate article data
- Format database records for the frontend
=========================================================
*/

const express = require("express");

const {
    query,
    get
} = require("./database");

const router = express.Router();


/*
=========================================================
Configuration
=========================================================
*/

const VALID_STATUSES = [
    "draft",
    "in_review",
    "approved",
    "published",
    "archived"
];

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;


/*
=========================================================
Formatting Helpers
=========================================================
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


function formatArticles(rows) {
    return rows.map(formatArticle);
}


/*
=========================================================
Validation Helpers
=========================================================
*/

function parseArticleId(value) {
    const articleId = Number.parseInt(
        value,
        10
    );

    if (
        !Number.isInteger(articleId) ||
        articleId <= 0
    ) {
        return null;
    }

    return articleId;
}


function isNonEmptyString(value) {
    return (
        typeof value === "string" &&
        value.trim().length > 0
    );
}


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


function isValidStatus(status) {
    return VALID_STATUSES.includes(status);
}


function parsePagination(queryParameters) {
    let page = Number.parseInt(
        queryParameters.page,
        10
    );

    let limit = Number.parseInt(
        queryParameters.limit,
        10
    );

    if (
        !Number.isInteger(page) ||
        page < 1
    ) {
        page = 1;
    }

    if (
        !Number.isInteger(limit) ||
        limit < 1
    ) {
        limit = DEFAULT_PAGE_SIZE;
    }

    limit = Math.min(
        limit,
        MAX_PAGE_SIZE
    );

    const offset =
        (page - 1) * limit;

    return {
        page,
        limit,
        offset
    };
}


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
            `Status must be one of: ${VALID_STATUSES.join(", ")}.`
        );
    }

    return errors;
}


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
            `Status must be one of: ${VALID_STATUSES.join(", ")}.`
        );
    }

    return errors;
}


/*
=========================================================
GET /api/articles
=========================================================

Retrieve published articles.

Supported query parameters:

search
category
page
limit

Examples:

GET /api/articles

GET /api/articles?category=Data

GET /api/articles?search=election

GET /api/articles?page=2&limit=10
*/

router.get(
    "/",
    async (
        request,
        response,
        next
    ) => {
        try {
            const search =
                cleanOptionalString(
                    request.query.search
                );

            const category =
                cleanOptionalString(
                    request.query.category
                );

            const {
                page,
                limit,
                offset
            } = parsePagination(
                request.query
            );

            const conditions = [
                "status = $1"
            ];

            const parameters = [
                "published"
            ];

            let parameterIndex = 2;

            if (category) {
                conditions.push(
                    `category = $${parameterIndex}`
                );

                parameters.push(category);

                parameterIndex += 1;
            }

            if (search) {
                conditions.push(
                    `(
                        title ILIKE $${parameterIndex}
                        OR author ILIKE $${parameterIndex}
                        OR excerpt ILIKE $${parameterIndex}
                        OR content ILIKE $${parameterIndex}
                    )`
                );

                parameters.push(
                    `%${search}%`
                );

                parameterIndex += 1;
            }

            const countResult = await get(
                `
                    SELECT COUNT(*)::int AS count
                    FROM articles
                    WHERE ${conditions.join(" AND ")}
                `,
                parameters
            );

            const total =
                countResult.count;

            const articleParameters = [
                ...parameters,
                limit,
                offset
            ];

            const rows = await query(
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
                    WHERE ${conditions.join(" AND ")}
                    ORDER BY
                        published_at DESC,
                        created_at DESC
                    LIMIT $${parameterIndex}
                    OFFSET $${parameterIndex + 1}
                `,
                articleParameters
            );

            return response.status(200).json({
                success: true,
                page,
                limit,
                total,
                totalPages: Math.ceil(
                    total / limit
                ),
                articles:
                    formatArticles(rows)
            });

        } catch (error) {
            return next(error);
        }
    }
);


/*
=========================================================
GET /api/articles/:id
=========================================================

Retrieve one article by ID.
*/

router.get(
    "/:id",
    async (
        request,
        response,
        next
    ) => {
        try {
            const articleId =
                parseArticleId(
                    request.params.id
                );

            if (!articleId) {
                return response
                    .status(400)
                    .json({
                        success: false,
                        error:
                            "The article ID is invalid."
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
                    WHERE id = $1
                `,
                [articleId]
            );

            if (!row) {
                return response
                    .status(404)
                    .json({
                        success: false,
                        error:
                            "Article not found."
                    });
            }

            return response
                .status(200)
                .json({
                    success: true,
                    article:
                        formatArticle(row)
                });

        } catch (error) {
            return next(error);
        }
    }
);


/*
=========================================================
POST /api/articles
=========================================================

Create an article.

New articles default to draft status.
*/

router.post(
    "/",
    async (
        request,
        response,
        next
    ) => {
        try {
            const validationErrors =
                validateNewArticle(
                    request.body
                );

            if (
                validationErrors.length > 0
            ) {
                return response
                    .status(400)
                    .json({
                        success: false,
                        errors:
                            validationErrors
                    });
            }

            const title =
                request.body.title.trim();

            const author =
                request.body.author.trim();

            const content =
                request.body.content.trim();

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
                request.body.status ||
                "draft";

            const publishedAt =
                status === "published"
                    ? new Date()
                    : null;

            const createdRow = await get(
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
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9
                    )
                    RETURNING
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

            return response
                .status(201)
                .json({
                    success: true,
                    message:
                        "Article created successfully.",
                    article:
                        formatArticle(
                            createdRow
                        )
                });

        } catch (error) {
            return next(error);
        }
    }
);


/*
=========================================================
PATCH /api/articles/:id
=========================================================

Update article content or editorial status.

Supported workflow:

draft
  ↓
in_review
  ↓
approved
  ↓
published
  ↓
archived
*/

router.patch(
    "/:id",
    async (
        request,
        response,
        next
    ) => {
        try {
            const articleId =
                parseArticleId(
                    request.params.id
                );

            if (!articleId) {
                return response
                    .status(400)
                    .json({
                        success: false,
                        error:
                            "The article ID is invalid."
                    });
            }

            const validationErrors =
                validateArticleUpdate(
                    request.body
                );

            if (
                validationErrors.length > 0
            ) {
                return response
                    .status(400)
                    .json({
                        success: false,
                        errors:
                            validationErrors
                    });
            }

            const existingArticle =
                await get(
                    `
                        SELECT *
                        FROM articles
                        WHERE id = $1
                    `,
                    [articleId]
                );

            if (!existingArticle) {
                return response
                    .status(404)
                    .json({
                        success: false,
                        error:
                            "Article not found."
                    });
            }

            const updates = [];
            const parameters = [];

            let parameterIndex = 1;

            function addUpdate(
                column,
                value
            ) {
                updates.push(
                    `${column} = $${parameterIndex}`
                );

                parameters.push(value);

                parameterIndex += 1;
            }

            if (
                request.body.title !==
                undefined
            ) {
                addUpdate(
                    "title",
                    request.body.title.trim()
                );
            }

            if (
                request.body.author !==
                undefined
            ) {
                addUpdate(
                    "author",
                    request.body.author.trim()
                );
            }

            if (
                request.body.excerpt !==
                undefined
            ) {
                addUpdate(
                    "excerpt",
                    cleanOptionalString(
                        request.body.excerpt
                    )
                );
            }

            if (
                request.body.content !==
                undefined
            ) {
                addUpdate(
                    "content",
                    request.body.content.trim()
                );
            }

            if (
                request.body.imageUrl !==
                undefined
            ) {
                addUpdate(
                    "image_url",
                    cleanOptionalString(
                        request.body.imageUrl
                    )
                );
            }

            if (
                request.body.imageAlt !==
                undefined
            ) {
                addUpdate(
                    "image_alt",
                    cleanOptionalString(
                        request.body.imageAlt
                    )
                );
            }

            if (
                request.body.category !==
                undefined
            ) {
                addUpdate(
                    "category",
                    cleanOptionalString(
                        request.body.category
                    ) || "General"
                );
            }

            if (
                request.body.status !==
                undefined
            ) {
                const newStatus =
                    request.body.status;

                addUpdate(
                    "status",
                    newStatus
                );

                if (
                    newStatus ===
                        "published" &&
                    !existingArticle
                        .published_at
                ) {
                    addUpdate(
                        "published_at",
                        new Date()
                    );
                }

                if (
                    newStatus ===
                    "draft"
                ) {
                    addUpdate(
                        "published_at",
                        null
                    );
                }
            }

            if (
                updates.length === 0
            ) {
                return response
                    .status(400)
                    .json({
                        success: false,
                        error:
                            "No valid fields were provided."
                    });
            }

            updates.push(
                "updated_at = CURRENT_TIMESTAMP"
            );

            parameters.push(
                articleId
            );

            const updatedRow =
                await get(
                    `
                        UPDATE articles
                        SET
                            ${updates.join(", ")}
                        WHERE id =
                            $${parameterIndex}
                        RETURNING
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
                    `,
                    parameters
                );

            return response
                .status(200)
                .json({
                    success: true,
                    message:
                        "Article updated successfully.",
                    article:
                        formatArticle(
                            updatedRow
                        )
                });

        } catch (error) {
            return next(error);
        }
    }
);


/*
=========================================================
DELETE /api/articles/:id
=========================================================

Delete one article.
*/

router.delete(
    "/:id",
    async (
        request,
        response,
        next
    ) => {
        try {
            const articleId =
                parseArticleId(
                    request.params.id
                );

            if (!articleId) {
                return response
                    .status(400)
                    .json({
                        success: false,
                        error:
                            "The article ID is invalid."
                    });
            }

            const deletedArticle =
                await get(
                    `
                        DELETE FROM articles
                        WHERE id = $1
                        RETURNING
                            id,
                            title
                    `,
                    [articleId]
                );

            if (!deletedArticle) {
                return response
                    .status(404)
                    .json({
                        success: false,
                        error:
                            "Article not found."
                    });
            }

            return response
                .status(200)
                .json({
                    success: true,
                    message:
                        "Article deleted successfully.",
                    deletedArticle
                });

        } catch (error) {
            return next(error);
        }
    }
);


module.exports = router;
