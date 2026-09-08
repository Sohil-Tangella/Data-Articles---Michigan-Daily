-- =========================================================
-- Michigan Daily Article Publishing System
-- File: schema.sql
--
-- Responsibilities:
-- - Create the articles table
-- - Define PostgreSQL data types
-- - Enforce data integrity constraints
-- - Support the editorial publishing workflow
-- - Create indexes for common article queries
-- =========================================================


-- =========================================================
-- Articles Table
-- =========================================================

CREATE TABLE IF NOT EXISTS articles (

    id BIGSERIAL PRIMARY KEY,

    title VARCHAR(255) NOT NULL
        CHECK (LENGTH(TRIM(title)) > 0),

    author VARCHAR(150) NOT NULL
        CHECK (LENGTH(TRIM(author)) > 0),

    excerpt TEXT,

    content TEXT NOT NULL
        CHECK (LENGTH(TRIM(content)) > 0),

    image_url TEXT,

    image_alt VARCHAR(255),

    category VARCHAR(100)
        NOT NULL
        DEFAULT 'General'
        CHECK (LENGTH(TRIM(category)) > 0),

    status VARCHAR(20)
        NOT NULL
        DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'in_review',
                'approved',
                'published',
                'archived'
            )
        ),

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    published_at TIMESTAMPTZ,

    CONSTRAINT published_article_requires_date
        CHECK (
            status <> 'published'
            OR published_at IS NOT NULL
        )

);


-- =========================================================
-- Indexes
-- =========================================================

-- Speeds up queries that filter articles by status.
CREATE INDEX IF NOT EXISTS idx_articles_status
ON articles(status);


-- Speeds up category filtering.
CREATE INDEX IF NOT EXISTS idx_articles_category
ON articles(category);


-- Supports sorting published articles by publication date.
CREATE INDEX IF NOT EXISTS idx_articles_published_at
ON articles(published_at DESC);


-- Optimizes the common public-facing query:
-- published articles ordered by publication date.
CREATE INDEX IF NOT EXISTS idx_articles_status_published_at
ON articles(
    status,
    published_at DESC
);


-- =========================================================
-- Updated Timestamp Function
-- =========================================================

CREATE OR REPLACE FUNCTION
update_article_timestamp()

RETURNS TRIGGER AS $$

BEGIN

    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;

END;

$$ LANGUAGE plpgsql;


-- =========================================================
-- Updated Timestamp Trigger
-- =========================================================

DROP TRIGGER IF EXISTS
set_article_updated_at
ON articles;


CREATE TRIGGER set_article_updated_at

BEFORE UPDATE ON articles

FOR EACH ROW

EXECUTE FUNCTION
update_article_timestamp();
