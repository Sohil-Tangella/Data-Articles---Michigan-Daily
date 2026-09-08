# Michigan Daily Data Article Publishing System

## Overview

The Michigan Daily Data Article Publishing System is a full-stack web application designed to support data-driven journalism and article publishing workflows.

The application provides a responsive public-facing article archive backed by a REST API and PostgreSQL database. Readers can search, filter, and browse published articles, while the backend supports article creation, editing, deletion, and multi-stage editorial workflows.

The project demonstrates full-stack software engineering concepts including REST API development, relational database design, server-side search and pagination, data validation, connection pooling, responsive frontend development, and application lifecycle management.

---

## Features

- Browse published data journalism articles
- Search articles by title, author, excerpt, or content
- Filter articles by category
- Navigate articles using server-side pagination
- Create, edit, and delete articles through REST API endpoints
- Manage articles through a multi-stage editorial workflow
- Automatically track article creation, modification, and publication timestamps
- Validate article data at both the application and database levels
- Store article data in PostgreSQL
- Reuse database connections through PostgreSQL connection pooling
- Display loading, error, and empty-result states
- Responsive layouts for desktop, tablet, and mobile devices
- Health-check endpoint for application and database availability
- Graceful PostgreSQL and HTTP server shutdown

---

## Technologies

- HTML5
- CSS3
- JavaScript
- Node.js
- Express
- PostgreSQL
- SQL

---

## System Architecture

```text
Browser
   │
   ├── index.html
   ├── styles.css
   └── script.js
          │
          │ REST API requests
          ▼
      Express Server
          │
          ▼
      articles.js
          │
          │ Parameterized SQL
          ▼
      database.js
          │
          │ Connection Pool
          ▼
      PostgreSQL
```

The frontend and backend are served from the same Express application, allowing the browser to communicate with the API through relative routes such as:

```text
/api/articles
```

---

## Project Structure

```text
article-publishing-system/

├── index.html
├── styles.css
├── script.js
├── server.js
├── articles.js
├── database.js
├── schema.sql
└── README.md
```

---

## How the Files Work Together

```text
index.html
    ↓
Defines the public Data archive structure

styles.css
    ↓
Provides responsive page and article styling

script.js
    ↓
Handles search, filtering, pagination, and API requests

server.js
    ↓
Configures Express and routes incoming requests

articles.js
    ↓
Validates requests and implements article API operations

database.js
    ↓
Executes parameterized queries through a PostgreSQL pool

schema.sql
    ↓
Defines tables, constraints, indexes, and triggers

PostgreSQL
    ↓
Persists article and editorial workflow data
```

---

# Frontend

## `index.html`

`index.html` defines the public-facing Data archive.

It includes:

- Michigan Daily navigation
- Data journalism page introduction
- Article search
- Category filtering
- Results information
- Article results container
- Empty-result state
- Pagination controls
- Accessible status messages

Article cards are generated dynamically by `script.js` rather than being hard-coded into the page.

---

## `styles.css`

`styles.css` provides the responsive visual design for the application.

It handles:

- Header and navigation styling
- Data page typography
- Search and filtering controls
- Article cards
- Featured images
- Article categories
- Author and publication metadata
- Article excerpts
- Loading and empty states
- Pagination controls
- Keyboard focus states
- Responsive layouts

On larger screens, articles use a two-column layout:

```text
┌──────────────────┐    Article Category
│                  │    Article Title
│  Featured Image  │    Author • Publication Date
│                  │    Article excerpt...
└──────────────────┘    Read article →
```

On smaller screens, the layout automatically becomes:

```text
┌──────────────────────────┐
│      Featured Image      │
└──────────────────────────┘

Article Category
Article Title
Author • Publication Date
Article excerpt...

Read article →
```

---

## `script.js`

`script.js` manages frontend behavior and communication with the REST API.

It handles:

- Fetching published articles
- Building API query parameters
- Searching articles
- Filtering by category
- Server-side pagination
- Rendering article cards
- Formatting publication dates
- Displaying article counts
- Loading states
- Empty-result states
- Error handling
- Clearing active search filters

### Example API Request

```text
/api/articles?page=1&limit=5
```

Search can be combined with pagination:

```text
/api/articles?search=housing&page=1&limit=5
```

Category filtering can also be performed:

```text
/api/articles?category=Elections&page=1&limit=5
```

The backend performs the filtering and pagination before returning the results, rather than requiring the browser to download every article.

---

# Backend

## `server.js`

`server.js` is the entry point for the backend application.

It:

- Creates the Express application
- Parses JSON and form requests
- Limits incoming request sizes
- Serves frontend files
- Registers article API routes
- Verifies PostgreSQL connectivity
- Initializes the database schema
- Provides application health checks
- Logs incoming requests
- Handles missing routes
- Provides centralized error handling
- Handles graceful application shutdown

The application runs locally at:

```text
http://localhost:3000
```

The article API begins at:

```text
http://localhost:3000/api/articles
```

The health endpoint is:

```text
http://localhost:3000/api/health
```

---

## `articles.js`

`articles.js` implements the REST API for article management.

### API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/articles` | Retrieve published articles |
| `GET` | `/api/articles/:id` | Retrieve an individual article |
| `POST` | `/api/articles` | Create an article |
| `PATCH` | `/api/articles/:id` | Update an article or its workflow state |
| `DELETE` | `/api/articles/:id` | Delete an article |

The API also supports query parameters for search, filtering, and pagination.

### Search

```http
GET /api/articles?search=transportation
```

Search checks article:

- Titles
- Authors
- Excerpts
- Content

### Category Filtering

```http
GET /api/articles?category=Data
```

### Pagination

```http
GET /api/articles?page=2&limit=10
```

A paginated response includes metadata such as:

```json
{
    "success": true,
    "page": 2,
    "limit": 10,
    "total": 47,
    "totalPages": 5,
    "articles": []
}
```

### Create an Article

```http
POST /api/articles
```

Example request:

```json
{
    "title": "Campus transportation by the numbers",
    "author": "Daily Data Staff",
    "excerpt": "An analysis of transportation trends around campus.",
    "content": "The complete article content goes here.",
    "imageUrl": "images/transportation.jpg",
    "imageAlt": "Buses traveling around campus",
    "category": "Data",
    "status": "draft"
}
```

### Update an Article

```http
PATCH /api/articles/1
```

Example:

```json
{
    "status": "in_review"
}
```

### Delete an Article

```http
DELETE /api/articles/1
```

All SQL values are passed through parameterized queries rather than being directly inserted into SQL strings.

---

# Editorial Workflow

Articles support a multi-stage editorial lifecycle:

```text
DRAFT
  │
  ▼
IN_REVIEW
  │
  ▼
APPROVED
  │
  ▼
PUBLISHED
  │
  ▼
ARCHIVED
```

The supported database values are:

```text
draft
in_review
approved
published
archived
```

This allows article records to represent different stages of the publishing process rather than only distinguishing between drafts and published content.

When an article is first published, the backend automatically assigns its publication timestamp.

---

# Database

## `database.js`

`database.js` manages communication between the Express application and PostgreSQL.

It uses a PostgreSQL connection pool so database connections can be reused across API requests.

The module provides:

| Function | Purpose |
|---|---|
| `query()` | Executes SQL and returns multiple rows |
| `get()` | Executes SQL and returns one row |
| `checkDatabaseConnection()` | Verifies PostgreSQL availability |
| `initializeDatabase()` | Executes the database schema |
| `closeDatabase()` | Gracefully closes the connection pool |

### Connection Pool

Rather than opening a new PostgreSQL connection for every API request, the application maintains a reusable pool:

```text
Express Requests
      │
      ▼
PostgreSQL Connection Pool
   │      │      │
   ▼      ▼      ▼
Connection Connections...
      │
      ▼
PostgreSQL
```

Database configuration is loaded through environment variables instead of being hard-coded into application logic.

---

## `schema.sql`

`schema.sql` defines the PostgreSQL database structure.

The `articles` table stores:

| Column | Purpose |
|---|---|
| `id` | Unique article identifier |
| `title` | Article headline |
| `author` | Article author |
| `excerpt` | Short article summary |
| `content` | Complete article content |
| `image_url` | Featured image location |
| `image_alt` | Accessible image description |
| `category` | Article category |
| `status` | Editorial workflow state |
| `created_at` | Creation timestamp |
| `updated_at` | Last modification timestamp |
| `published_at` | Publication timestamp |

The database enforces constraints for required article fields and valid editorial states.

A published article is also required to have a publication timestamp.

---

## Database Indexing

Indexes support frequently used article queries.

The database includes indexes for:

- Article status
- Article category
- Publication date
- Published articles ordered by publication date

These indexes support common operations such as retrieving recent published articles and filtering articles by category.

---

## Automatic Timestamps

PostgreSQL automatically assigns creation timestamps when articles are inserted.

The database also includes a trigger that automatically updates:

```text
updated_at
```

whenever an article record changes.

This keeps modification timestamps consistent without relying entirely on application code.

---

# Search and Pagination

Search and pagination are performed on the server.

For example:

```text
User searches "housing"
        │
        ▼
script.js
        │
        ▼
GET /api/articles?search=housing&page=1&limit=5
        │
        ▼
articles.js
        │
        ▼
PostgreSQL
        │
        ├── Search matching records
        ├── Count matching records
        ├── Sort published articles
        └── Return requested page
        │
        ▼
JSON Response
        │
        ▼
Article cards rendered in browser
```

PostgreSQL `ILIKE` queries provide case-insensitive article searching.

---

# Application Flow

## Reader Workflow

When a reader opens the Data page:

```text
Browser requests Data page
        ↓
Express serves index.html
        ↓
script.js requests published articles
        ↓
articles.js processes search/filter parameters
        ↓
database.js queries PostgreSQL
        ↓
PostgreSQL returns matching records
        ↓
API returns JSON
        ↓
script.js renders article cards
```

---

## Publishing Workflow

When an article is created or updated through the API:

```text
Article request
      ↓
Express
      ↓
articles.js
      ↓
Request validation
      ↓
Parameterized SQL query
      ↓
PostgreSQL
      ↓
Database constraints
      ↓
Updated article returned as JSON
```

---

# Error Handling

The application handles errors across multiple layers.

### Frontend

The browser displays:

- Loading states
- Empty search results
- API failures
- Invalid response states

### API

The backend returns appropriate HTTP responses for:

- Invalid article IDs
- Invalid article data
- Missing articles
- Invalid editorial statuses
- Missing routes
- Unexpected server errors

### Database

PostgreSQL provides an additional layer of data validation through:

- `NOT NULL` constraints
- `CHECK` constraints
- Valid status enforcement
- Publication-date requirements

---

# Responsive Design

The frontend adapts across desktop, tablet, and mobile screen sizes.

Responsive behavior includes:

- Two-column and single-column article layouts
- Flexible search controls
- Responsive category filtering
- Mobile navigation
- Flexible typography
- Wrapping pagination controls

The interface also includes semantic HTML, accessible form labels, keyboard focus states, alternative image text, and ARIA attributes for dynamic content.

---

# Health Monitoring

The backend exposes:

```http
GET /api/health
```

The endpoint verifies both:

```text
Express API
PostgreSQL
```

A healthy response indicates that the application is running and can communicate with its database.

---

# Skills Demonstrated

- Full-Stack Web Development
- JavaScript
- Node.js
- Express
- PostgreSQL
- SQL
- REST API Design
- Relational Database Design
- PostgreSQL Connection Pooling
- Parameterized SQL Queries
- Server-Side Search
- Server-Side Pagination
- API Validation
- Editorial Workflow Design
- Database Constraints
- Database Indexing
- Responsive Web Design
- Error Handling
- Application Lifecycle Management
- Accessibility

---

## Summary

The project separates frontend, API, and database responsibilities into focused modules:

```text
index.html
    ↓
Page structure

styles.css
    ↓
Responsive interface

script.js
    ↓
Frontend behavior and API communication

server.js
    ↓
Express application and lifecycle

articles.js
    ↓
REST API and article business logic

database.js
    ↓
PostgreSQL connection management

schema.sql
    ↓
Database structure and constraints
```

Together, these components create a full-stack article publishing system with a responsive public interface, RESTful article management, server-side search and pagination, PostgreSQL persistence, and a structured editorial workflow.
