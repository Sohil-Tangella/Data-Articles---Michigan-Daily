# Data-Articles---Michigan-Daily
# Article Publishing System

This project is a simple full-stack article publishing system.

It includes:

- A frontend that displays articles
- A backend API that manages articles
- A SQLite database that stores article data

The project uses:

- HTML5
- CSS3
- JavaScript
- Node.js
- Express
- SQLite
- SQL

## Project Structure

```text
article-publishing-system/
├── index.html
├── styles.css
├── script.js
├── server.js
├── database.js
├── articles.js
└── schema.sql
```

## How the Files Work Together

```text
index.html
    ↓ provides the page structure

styles.css
    ↓ controls the page design

script.js
    ↓ requests article data from the backend

server.js
    ↓ receives frontend requests

articles.js
    ↓ handles article operations

database.js
    ↓ communicates with SQLite

schema.sql
    ↓ defines the database table
```

---

## 1. `index.html`

`index.html` creates the structure of the webpage.

It contains:

- The website header
- The navigation menu
- The Data page title
- The article-list container
- The pagination container
- Links to `styles.css` and `script.js`

The article cards do not need to be written directly into this file. Instead, `script.js` retrieves the article data and inserts the cards into the page.

Example:

```html
<section id="article-list" class="article-list">
    <!-- JavaScript inserts article cards here. -->
</section>
```

---

## 2. `styles.css`

`styles.css` controls the appearance of the webpage.

It handles:

- Page spacing
- Fonts and typography
- Article-card layouts
- Featured-image sizes
- Author and publication-date styling
- Pagination buttons
- Navigation styling
- Hover effects
- Mobile responsiveness

For larger screens, each article can use a two-column layout:

```text
[ Article Image ]   Article Title
                    Author and Date
                    Article Excerpt
```

For smaller screens, the layout changes to one column:

```text
[ Article Image ]

Article Title
Author and Date
Article Excerpt
```

---

## 3. `script.js`

`script.js` controls the frontend behavior.

It:

- Requests published articles from the backend
- Reads the JSON response
- Creates article cards
- Inserts article cards into `index.html`
- Formats authors and dates
- Handles pagination
- Displays loading and error messages
- Controls the mobile navigation menu

Example request:

```javascript
fetch("http://localhost:3000/api/articles")
```

The backend returns article information such as:

```json
{
    "id": 1,
    "title": "Campus transportation by the numbers",
    "author": "Daily Data Staff",
    "excerpt": "A summary of campus transportation data.",
    "content": "The complete article content.",
    "imageUrl": "images/transportation.jpg",
    "imageAlt": "Buses traveling around campus",
    "category": "Data",
    "status": "published"
}
```

---

## 4. `server.js`

`server.js` starts and configures the backend server.

It:

- Creates the Express application
- Selects the server port
- Enables JSON request bodies
- Enables communication between the frontend and backend
- Connects the article routes
- Initializes the database
- Handles missing routes
- Handles unexpected server errors

The server runs at:

```text
http://localhost:3000
```

The article API begins at:

```text
http://localhost:3000/api/articles
```

Example:

```javascript
app.use("/api/articles", articlesRouter);
```

This sends every request beginning with `/api/articles` to `articles.js`.

---

## 5. `database.js`

`database.js` connects the backend to the SQLite database.

It:

- Opens the `articles.db` database
- Reads `schema.sql`
- Creates the database table when necessary
- Runs SQL commands
- Retrieves one database row
- Retrieves multiple database rows
- Closes the database connection safely

It provides reusable functions:

```javascript
run()
get()
all()
initializeDatabase()
closeDatabase()
```

Their purposes are:

| Function | Purpose |
|---|---|
| `run()` | Runs `INSERT`, `UPDATE`, and `DELETE` commands |
| `get()` | Retrieves one database row |
| `all()` | Retrieves multiple database rows |
| `initializeDatabase()` | Creates the required tables |
| `closeDatabase()` | Closes the database connection |

---

## 6. `articles.js`

`articles.js` contains the article API routes.

It handles the main article operations:

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/articles` | Retrieves published articles |
| `GET` | `/api/articles/:id` | Retrieves one article |
| `POST` | `/api/articles` | Creates an article |
| `PATCH` | `/api/articles/:id` | Edits or publishes an article |
| `DELETE` | `/api/articles/:id` | Deletes an article |

### Create an article

```http
POST /api/articles
```

Example request body:

```json
{
    "title": "Campus transportation by the numbers",
    "author": "Daily Data Staff",
    "excerpt": "A summary of campus transportation data.",
    "content": "The complete article content goes here.",
    "imageUrl": "images/transportation.jpg",
    "imageAlt": "Buses and students traveling across campus",
    "category": "Data",
    "status": "published"
}
```

### Edit an article

```http
PATCH /api/articles/1
```

Example request body:

```json
{
    "title": "Updated article title",
    "status": "published"
}
```

### Delete an article

```http
DELETE /api/articles/1
```

---

## 7. `schema.sql`

`schema.sql` defines the structure of the database.

It creates the `articles` table.

The table stores:

| Column | Purpose |
|---|---|
| `id` | Unique article identifier |
| `title` | Article headline |
| `author` | Article author |
| `excerpt` | Short article summary |
| `content` | Full article body |
| `image_url` | Featured-image location |
| `image_alt` | Accessible image description |
| `category` | Article category |
| `status` | Draft or published status |
| `created_at` | Date the article was created |
| `updated_at` | Date the article was last edited |
| `published_at` | Date the article was published |

The status is restricted to:

```text
draft
published
```

The file also creates indexes to make common database searches faster.

---

## Article Publishing Flow

When a writer publishes an article, the data moves through the system like this:

```text
Publishing form
      ↓
script.js sends a POST request
      ↓
server.js receives the request
      ↓
articles.js validates the article
      ↓
database.js runs the SQL command
      ↓
SQLite stores the article
```

When a reader opens the Data page:

```text
Browser opens index.html
      ↓
script.js requests published articles
      ↓
server.js receives the request
      ↓
articles.js retrieves the articles
      ↓
database.js reads the database
      ↓
JSON is returned to script.js
      ↓
Article cards appear on the page
```

---




## Important Note

This project does not include user authentication.

Anyone who can access the backend article routes could potentially create, edit, or delete articles.

A production publishing system should also include:

- User login
- Password security
- Role-based permissions
- Request validation
- Image-upload handling
- Rate limiting
- Security headers
- Automated tests
- Deployment configuration

---

## Summary

The seven files divide the system into clear responsibilities:

```text
index.html   → page structure
styles.css   → page design
script.js    → frontend article behavior
server.js    → backend server
database.js  → database connection
articles.js  → article API operations
schema.sql   → database structure
```

Together, they create a basic full-stack article publishing and display system.