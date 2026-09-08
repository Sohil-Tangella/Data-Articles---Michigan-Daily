"use strict";

/*
=========================================================
Michigan Daily Article Publishing System
File: script.js

Responsibilities:
- Request published articles from the backend
- Search articles
- Filter articles by category
- Render article cards
- Handle server-side pagination
- Display result counts
- Display loading, empty, and error states
- Format article metadata
=========================================================
*/


// =========================================================
// Configuration
// =========================================================

const API_URL = "/api/articles";

const ARTICLES_PER_PAGE = 5;


// =========================================================
// Application State
// =========================================================

let currentPage = 1;
let totalPages = 1;
let totalArticles = 0;

let currentSearch = "";
let currentCategory = "";


// =========================================================
// DOM Elements
// =========================================================

const articleContainer = document.querySelector(
    "#article-container"
);

const paginationContainer = document.querySelector(
    "#pagination"
);

const statusMessage = document.querySelector(
    "#status-message"
);

const resultsCount = document.querySelector(
    "#results-count"
);

const searchForm = document.querySelector(
    "#article-search-form"
);

const searchInput = document.querySelector(
    "#article-search"
);

const categoryFilter = document.querySelector(
    "#category-filter"
);

const emptyState = document.querySelector(
    "#empty-state"
);

const clearFiltersButton = document.querySelector(
    "#clear-filters"
);


// =========================================================
// Utility Functions
// =========================================================

function formatDate(dateValue) {
    if (!dateValue) {
        return "Unpublished";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    ).format(date);
}


function buildArticleUrl(articleId) {
    return `article.html?id=${articleId}`;
}


function buildApiUrl() {
    const parameters =
        new URLSearchParams();

    parameters.set(
        "page",
        String(currentPage)
    );

    parameters.set(
        "limit",
        String(ARTICLES_PER_PAGE)
    );

    if (currentSearch) {
        parameters.set(
            "search",
            currentSearch
        );
    }

    if (currentCategory) {
        parameters.set(
            "category",
            currentCategory
        );
    }

    return `${API_URL}?${parameters.toString()}`;
}


// =========================================================
// Article Card Components
// =========================================================

function createArticleImage(article) {
    const imageLink =
        document.createElement("a");

    imageLink.href =
        buildArticleUrl(article.id);

    imageLink.className =
        "article-image-link";

    const image =
        document.createElement("img");

    image.className =
        "article-image";

    image.src =
        article.imageUrl ||
        "images/article-placeholder.jpg";

    image.alt =
        article.imageAlt ||
        `Featured image for ${article.title}`;

    image.loading = "lazy";

    image.addEventListener(
        "error",
        () => {
            if (
                !image.src.endsWith(
                    "article-placeholder.jpg"
                )
            ) {
                image.src =
                    "images/article-placeholder.jpg";
            }
        }
    );

    imageLink.appendChild(image);

    return imageLink;
}


function createArticleCategory(article) {
    const category =
        document.createElement("span");

    category.className =
        "article-category";

    category.textContent =
        article.category || "General";

    return category;
}


function createArticleCard(article) {
    const articleCard =
        document.createElement("article");

    articleCard.className =
        "article-card";


    // Image
    const imageElement =
        createArticleImage(article);


    // Content wrapper
    const articleContent =
        document.createElement("div");

    articleContent.className =
        "article-content";


    // Category
    const category =
        createArticleCategory(article);


    // Title
    const title =
        document.createElement("h2");

    title.className =
        "article-title";

    const titleLink =
        document.createElement("a");

    titleLink.href =
        buildArticleUrl(article.id);

    titleLink.textContent =
        article.title;

    title.appendChild(titleLink);


    // Metadata
    const metadata =
        document.createElement("p");

    metadata.className =
        "article-meta";

    const author =
        article.author?.trim()
            ? article.author
            : "Staff";

    const publicationDate =
        formatDate(
            article.publishedAt ||
            article.createdAt
        );

    metadata.textContent =
        `By ${author} • ${publicationDate}`;


    // Excerpt
    const excerpt =
        document.createElement("p");

    excerpt.className =
        "article-excerpt";

    excerpt.textContent =
        article.excerpt ||
        "Read the complete article for more information.";


    // Read-more link
    const readMoreLink =
        document.createElement("a");

    readMoreLink.className =
        "read-more";

    readMoreLink.href =
        buildArticleUrl(article.id);

    readMoreLink.textContent =
        "Read article →";


    articleContent.append(
        category,
        title,
        metadata,
        excerpt,
        readMoreLink
    );

    articleCard.append(
        imageElement,
        articleContent
    );

    return articleCard;
}


// =========================================================
// Article Rendering
// =========================================================

function renderArticles(articles) {
    articleContainer.replaceChildren();

    if (articles.length === 0) {
        emptyState.hidden = false;

        return;
    }

    emptyState.hidden = true;

    const fragment =
        document.createDocumentFragment();

    articles.forEach((article) => {
        fragment.appendChild(
            createArticleCard(article)
        );
    });

    articleContainer.appendChild(
        fragment
    );
}


// =========================================================
// Pagination
// =========================================================

function changePage(pageNumber) {
    if (
        pageNumber < 1 ||
        pageNumber > totalPages ||
        pageNumber === currentPage
    ) {
        return;
    }

    currentPage = pageNumber;

    loadArticles();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function createPaginationButton(
    text,
    pageNumber,
    options = {}
) {
    const button =
        document.createElement("button");

    button.type = "button";
    button.textContent = text;

    if (options.disabled) {
        button.disabled = true;
    }

    if (options.active) {
        button.classList.add(
            "active-page"
        );

        button.setAttribute(
            "aria-current",
            "page"
        );
    }

    button.setAttribute(
        "aria-label",
        options.label ||
        `Go to page ${pageNumber}`
    );

    button.addEventListener(
        "click",
        () => {
            changePage(pageNumber);
        }
    );

    return button;
}


function renderPagination() {
    paginationContainer.replaceChildren();

    if (totalPages <= 1) {
        return;
    }


    // Previous
    paginationContainer.appendChild(
        createPaginationButton(
            "Previous",
            currentPage - 1,
            {
                disabled:
                    currentPage === 1,
                label:
                    "Go to previous page"
            }
        )
    );


    // Page numbers
    for (
        let page = 1;
        page <= totalPages;
        page += 1
    ) {
        paginationContainer.appendChild(
            createPaginationButton(
                String(page),
                page,
                {
                    active:
                        page === currentPage,
                    label:
                        `Go to page ${page}`
                }
            )
        );
    }


    // Next
    paginationContainer.appendChild(
        createPaginationButton(
            "Next",
            currentPage + 1,
            {
                disabled:
                    currentPage === totalPages,
                label:
                    "Go to next page"
            }
        )
    );
}


// =========================================================
// Status Messages
// =========================================================

function updateResultsInformation(
    articleCount
) {
    if (totalArticles === 0) {
        resultsCount.textContent = "";
        statusMessage.textContent = "";

        return;
    }

    const startingArticle =
        (currentPage - 1) *
        ARTICLES_PER_PAGE +
        1;

    const endingArticle =
        startingArticle +
        articleCount -
        1;

    resultsCount.textContent =
        `${totalArticles} article${
            totalArticles === 1
                ? ""
                : "s"
        } found`;

    statusMessage.textContent =
        `Showing articles ${startingArticle}–` +
        `${endingArticle} of ${totalArticles}.`;
}


function showLoadingState() {
    articleContainer.replaceChildren();
    paginationContainer.replaceChildren();

    emptyState.hidden = true;

    statusMessage.textContent =
        "Loading articles...";

    resultsCount.textContent = "";
}


function showErrorState(message) {
    articleContainer.replaceChildren();
    paginationContainer.replaceChildren();

    emptyState.hidden = true;

    resultsCount.textContent = "";

    statusMessage.textContent = "";

    const errorMessage =
        document.createElement("p");

    errorMessage.className =
        "empty-message";

    errorMessage.textContent =
        message;

    articleContainer.appendChild(
        errorMessage
    );
}


// =========================================================
// API Requests
// =========================================================

async function loadArticles() {
    showLoadingState();

    try {
        const response = await fetch(
            buildApiUrl()
        );

        if (!response.ok) {
            throw new Error(
                `Server returned status ${response.status}.`
            );
        }

        const data =
            await response.json();

        if (
            !data ||
            !Array.isArray(data.articles)
        ) {
            throw new Error(
                "The server returned an invalid article response."
            );
        }

        totalArticles =
            Number(data.total) || 0;

        totalPages =
            Number(data.totalPages) || 1;

        currentPage =
            Number(data.page) || currentPage;

        renderArticles(
            data.articles
        );

        renderPagination();

        updateResultsInformation(
            data.articles.length
        );

    } catch (error) {
        console.error(
            "Unable to load articles:",
            error
        );

        showErrorState(
            "The articles could not be loaded. Please try again."
        );
    }
}


// =========================================================
// Search and Filtering
// =========================================================

function handleSearch(event) {
    event.preventDefault();

    currentSearch =
        searchInput.value.trim();

    currentPage = 1;

    loadArticles();
}


function handleCategoryChange() {
    currentCategory =
        categoryFilter.value;

    currentPage = 1;

    loadArticles();
}


function clearFilters() {
    currentSearch = "";
    currentCategory = "";
    currentPage = 1;

    searchInput.value = "";
    categoryFilter.value = "";

    loadArticles();

    searchInput.focus();
}


// =========================================================
// Event Listeners
// =========================================================

function registerEventListeners() {
    searchForm.addEventListener(
        "submit",
        handleSearch
    );

    categoryFilter.addEventListener(
        "change",
        handleCategoryChange
    );

    clearFiltersButton.addEventListener(
        "click",
        clearFilters
    );
}


// =========================================================
// Application Initialization
// =========================================================

function initializePage() {
    const requiredElements = [
        articleContainer,
        paginationContainer,
        statusMessage,
        resultsCount,
        searchForm,
        searchInput,
        categoryFilter,
        emptyState,
        clearFiltersButton
    ];

    const missingElement =
        requiredElements.some(
            (element) => !element
        );

    if (missingElement) {
        console.error(
            "Required page elements were not found."
        );

        return;
    }

    registerEventListeners();

    loadArticles();
}


document.addEventListener(
    "DOMContentLoaded",
    initializePage
);
