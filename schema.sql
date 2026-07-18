-- =========================================================
-- Article Publishing System
-- File: schema.sql
--
-- Responsibilities:
-- - Create the articles table
-- - Define the columns
-- - Apply constraints
-- - Create indexes for faster searches
-- =========================================================


-- =========================================================
-- Articles Table
-- =========================================================

CREATE TABLE IF NOT EXISTS articles (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL,

    author TEXT NOT NULL,

    excerpt TEXT,

    content TEXT NOT NULL,

    image_url TEXT,

    image_alt TEXT,

    category TEXT DEFAULT 'General',

    status TEXT NOT NULL
        CHECK (
            status IN (
                'draft',
                'published'
            )
        ),

    created_at DATETIME
        DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME
        DEFAULT CURRENT_TIMESTAMP,

    published_at DATETIME

);


-- =========================================================
-- Indexes
--
-- Indexes make searching much faster.
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_articles_status
ON articles(status);

CREATE INDEX IF NOT EXISTS idx_articles_category
ON articles(category);

CREATE INDEX IF NOT EXISTS idx_articles_published
ON articles(published_at);


-- =========================================================
-- Trigger
--
-- Automatically update updated_at whenever
-- an article changes.
-- =========================================================

CREATE TRIGGER IF NOT EXISTS update_article_timestamp

AFTER UPDATE ON articles

FOR EACH ROW

BEGIN

    UPDATE articles

    SET updated_at = CURRENT_TIMESTAMP

    WHERE id = OLD.id;

END;