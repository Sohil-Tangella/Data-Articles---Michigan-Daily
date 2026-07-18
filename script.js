"use strict";

/*
=========================================================
Article Publishing System
File: script.js

Responsibilities:
- Request published articles from the backend
- Create article cards
- Insert cards into the page
- Handle pagination
- Format dates
- Display loading and error messages
=========================================================
*/

/*
 * The backend server runs on port 3000.
 *
 * This route is handled by articles.js.
 */
const API_URL = "http://localhost:3000/api/articles";

/*
 * Number of articles shown on each page.
 */
const ARTICLES_PER_PAGE = 5;

/*
 * Tracks the page the reader is currently viewing.
 */
let currentPage = 1;

/*
 * Stores the articles returned by the backend.
 */
let articles = [];

/*
 * Retrieve the HTML elements created in index.html.
 */
const articleContainer = document.querySelector(
    "#article-container"
);

const paginationContainer = document.querySelector(
    "#pagination"
);

const statusMessage = document.querySelector(
    "#status-message"
);

/*
 * Converts a database date into a readable date.
 *
 * Example:
 *
 * 2026-07-17T15:30:00.000Z
 *
 * becomes:
 *
 * July 17, 2026
 */
function formatDate(dateValue) {
    if (!dateValue) {
        return "Unpublished";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    }).format(date);
}

/*
 * Creates the featured-image section of an article card.
 */
function createArticleImage(article) {
    const imageLink = document.createElement("a");

    imageLink.href = `article.html?id=${article.id}`;
    imageLink.className = "article-image-link";

    const image = document.createElement("img");

    image.className = "article-image";

    image.src =
        article.imageUrl ||
        "images/article-placeholder.jpg";

    image.alt =
        article.imageAlt ||
        `Featured image for ${article.title}`;

    image.loading = "lazy";

    /*
     * If the requested image cannot be loaded,
     * replace it with the placeholder image.
     */
    image.addEventListener("error", () => {
        image.src = "images/article-placeholder.jpg";
    });

    imageLink.appendChild(image);

    return imageLink;
}

/*
 * Creates one complete article card.
 *
 * The result looks like:
 *
 * [Image]    Article title
 *            Author • Date
 *            Excerpt
 *            Read article →
 */
function createArticleCard(article) {
    const articleCard = document.createElement("article");

    articleCard.className = "article-card";

    /*
     * Create the image.
     */
    const imageElement = createArticleImage(article);

    /*
     * Create the text-content section.
     */
    const articleContent = document.createElement("div");

    articleContent.className = "article-content";

    /*
     * Create the article title.
     */
    const title = document.createElement("h3");

    title.className = "article-title";

    const titleLink = document.createElement("a");

    titleLink.href = `article.html?id=${article.id}`;
    titleLink.textContent = article.title;

    title.appendChild(titleLink);

    /*
     * Create the author and publication-date section.
     */
    const metadata = document.createElement("p");

    metadata.className = "article-meta";

    const author =
        article.author && article.author.trim()
            ? article.author
            : "Staff";

    const publicationDate = formatDate(
        article.publishedAt || article.createdAt
    );

    metadata.textContent =
        `By ${author} • ${publicationDate}`;

    /*
     * Create the article excerpt.
     */
    const excerpt = document.createElement("p");

    excerpt.className = "article-excerpt";

    excerpt.textContent =
        article.excerpt ||
        "Read the complete article for more information.";

    /*
     * Create the Read Article link.
     */
    const readMoreLink = document.createElement("a");

    readMoreLink.className = "read-more";
    readMoreLink.href = `article.html?id=${article.id}`;
    readMoreLink.textContent = "Read article →";

    /*
     * Add all text elements to the content section.
     */
    articleContent.append(
        title,
        metadata,
        excerpt,
        readMoreLink
    );

    /*
     * Add the image and content to the card.
     */
    articleCard.append(
        imageElement,
        articleContent
    );

    return articleCard;
}

/*
 * Returns only the articles that belong
 * on the selected pagination page.
 */
function getArticlesForCurrentPage() {
    const startIndex =
        (currentPage - 1) * ARTICLES_PER_PAGE;

    const endIndex =
        startIndex + ARTICLES_PER_PAGE;

    return articles.slice(
        startIndex,
        endIndex
    );
}

/*
 * Removes the existing cards and displays
 * the articles for the current page.
 */
function renderArticles() {
    articleContainer.replaceChildren();

    if (articles.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.className = "empty-message";

        emptyMessage.textContent =
            "No published articles are currently available.";

        articleContainer.appendChild(emptyMessage);

        return;
    }

    const currentArticles =
        getArticlesForCurrentPage();

    /*
     * A document fragment allows all article cards
     * to be created before inserting them into the page.
     */
    const fragment =
        document.createDocumentFragment();

    currentArticles.forEach((article) => {
        const articleCard =
            createArticleCard(article);

        fragment.appendChild(articleCard);
    });

    articleContainer.appendChild(fragment);

    updateStatusMessage();
}

/*
 * Creates one pagination button.
 */
function createPageButton(pageNumber) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = String(pageNumber);

    button.setAttribute(
        "aria-label",
        `Go to page ${pageNumber}`
    );

    /*
     * Visually identify the current page.
     */
    if (pageNumber === currentPage) {
        button.classList.add("active-page");

        button.setAttribute(
            "aria-current",
            "page"
        );
    }

    button.addEventListener("click", () => {
        currentPage = pageNumber;

        renderArticles();
        renderPagination();

        /*
         * Move the browser back to the page title
         * after the reader changes pages.
         */
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    return button;
}

/*
 * Creates the Previous button.
 */
function createPreviousButton() {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = "Previous";

    button.disabled = currentPage === 1;

    button.addEventListener("click", () => {
        if (currentPage <= 1) {
            return;
        }

        currentPage -= 1;

        renderArticles();
        renderPagination();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    return button;
}

/*
 * Creates the Next button.
 */
function createNextButton(totalPages) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = "Next";

    button.disabled =
        currentPage === totalPages;

    button.addEventListener("click", () => {
        if (currentPage >= totalPages) {
            return;
        }

        currentPage += 1;

        renderArticles();
        renderPagination();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    return button;
}

/*
 * Creates all pagination controls.
 */
function renderPagination() {
    paginationContainer.replaceChildren();

    const totalPages = Math.ceil(
        articles.length / ARTICLES_PER_PAGE
    );

    /*
     * Pagination is unnecessary when there is
     * only one page of results.
     */
    if (totalPages <= 1) {
        return;
    }

    paginationContainer.appendChild(
        createPreviousButton()
    );

    for (
        let pageNumber = 1;
        pageNumber <= totalPages;
        pageNumber += 1
    ) {
        paginationContainer.appendChild(
            createPageButton(pageNumber)
        );
    }

    paginationContainer.appendChild(
        createNextButton(totalPages)
    );
}

/*
 * Displays information such as:
 *
 * Showing articles 1–5 of 12.
 */
function updateStatusMessage() {
    if (articles.length === 0) {
        statusMessage.textContent = "";
        return;
    }

    const startingArticle =
        (currentPage - 1) * ARTICLES_PER_PAGE + 1;

    const endingArticle = Math.min(
        currentPage * ARTICLES_PER_PAGE,
        articles.length
    );

    statusMessage.textContent =
        `Showing articles ${startingArticle}–` +
        `${endingArticle} of ${articles.length}.`;
}

/*
 * Displays a loading message while waiting
 * for the backend server.
 */
function showLoadingMessage() {
    articleContainer.replaceChildren();
    paginationContainer.replaceChildren();

    statusMessage.textContent =
        "Loading articles...";
}

/*
 * Displays an error message when the backend
 * cannot return the article data.
 */
function showErrorMessage(message) {
    articleContainer.replaceChildren();
    paginationContainer.replaceChildren();

    const errorMessage = document.createElement("p");

    errorMessage.className = "empty-message";

    errorMessage.textContent = message;

    articleContainer.appendChild(errorMessage);

    statusMessage.textContent = "";
}

/*
 * Requests published articles from the backend API.
 */
async function loadArticles() {
    showLoadingMessage();

    try {
        const response = await fetch(API_URL);

        /*
         * fetch() only throws for network errors.
         * We manually check HTTP errors such as 404 or 500.
         */
        if (!response.ok) {
            throw new Error(
                `The server returned status ${response.status}.`
            );
        }

        const responseData = await response.json();

        /*
         * The API may return either:
         *
         * 1. A direct array of articles
         *
         * or:
         *
         * 2. An object containing an articles array
         */
        if (Array.isArray(responseData)) {
            articles = responseData;
        } else if (
            responseData &&
            Array.isArray(responseData.articles)
        ) {
            articles = responseData.articles;
        } else {
            throw new Error(
                "The server returned an invalid article response."
            );
        }

        currentPage = 1;

        renderArticles();
        renderPagination();
    } catch (error) {
        console.error(
            "Unable to load articles:",
            error
        );

        showErrorMessage(
            "The articles could not be loaded. " +
            "Make sure the backend server is running."
        );
    }
}

/*
 * Starts the frontend application.
 */
function initializePage() {
    if (
        !articleContainer ||
        !paginationContainer ||
        !statusMessage
    ) {
        console.error(
            "The required HTML containers were not found."
        );

        return;
    }

    loadArticles();
}

/*
 * Wait until the HTML structure has loaded,
 * then begin requesting the articles.
 */
document.addEventListener(
    "DOMContentLoaded",
    initializePage
);