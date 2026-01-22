/**
 * Pagination Component
 * Generates pagination UI including page size selector, results info, and page navigation buttons
 */

/**
 * Renders the complete pagination UI
 * @param {number} visibleCount - Total number of visible/filtered rows
 * @param {object} paginationState - Current pagination state (currentPage, itemsPerPage, totalPages, availableSizes)
 * @param {function} onPageChange - Callback when page button is clicked (receives page number)
 * @param {function} onPageSizeChange - Callback when page size dropdown changes (receives new size)
 * @returns {string} HTML markup for pagination controls
 */
export function renderPagination(
  visibleCount,
  paginationState,
  onPageChange,
  onPageSizeChange,
) {
  const { currentPage, itemsPerPage, totalPages, availableSizes } =
    paginationState;

  // Calculate result range
  const startResult =
    visibleCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endResult = Math.min(currentPage * itemsPerPage, visibleCount);

  // Build page size selector
  const pageSizeOptions = availableSizes
    .map(
      (size) =>
        `<option value="${size}" ${size === itemsPerPage ? "selected" : ""}>${size}</option>`,
    )
    .join("");

  const pageSizeSelector = `
    <div class="page-size-control">
      <label for="pageSizeSelect" class="page-size-label">Show:</label>
      <select id="pageSizeSelect" class="form-select form-select-sm page-size-select">
        ${pageSizeOptions}
      </select>
      <span class="results-info">Showing ${startResult}-${endResult} of ${visibleCount} results</span>
    </div>
  `;

  // Build page navigation buttons
  const pageButtons = buildPageButtons(currentPage, totalPages);

  return `
    <div class="pagination-container">
      ${pageSizeSelector}
      <nav aria-label="Table pagination" class="pagination-nav">
        <ul class="pagination pagination-sm mb-0">
          ${pageButtons}
        </ul>
      </nav>
    </div>
  `;
}

/**
 * Builds the page navigation buttons with ellipsis for large page counts
 * @param {number} currentPage - Current active page
 * @param {number} totalPages - Total number of pages
 * @returns {string} HTML markup for page buttons
 */
function buildPageButtons(currentPage, totalPages) {
  const buttons = [];

  // Previous button
  buttons.push(`
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
      <button class="page-link" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="Previous">
        <i class="fas fa-chevron-left"></i>
      </button>
    </li>
  `);

  // Page number buttons with ellipsis logic
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  pageNumbers.forEach((pageNum, index) => {
    if (pageNum === "...") {
      // Non-clickable ellipsis
      buttons.push(`
        <li class="page-item disabled">
          <span class="page-link page-ellipsis">...</span>
        </li>
      `);
    } else {
      buttons.push(`
        <li class="page-item ${pageNum === currentPage ? "active" : ""}">
          <button class="page-link" data-page="${pageNum}" ${pageNum === currentPage ? 'aria-current="page"' : ""}>
            ${pageNum}
          </button>
        </li>
      `);
    }
  });

  // Next button
  buttons.push(`
    <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
      <button class="page-link" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} aria-label="Next">
        <i class="fas fa-chevron-right"></i>
      </button>
    </li>
  `);

  return buttons.join("");
}

/**
 * Generates array of page numbers to display with ellipsis for condensed view
 * Shows: [1] ... [currentPage-1] [currentPage] [currentPage+1] ... [totalPages]
 * @param {number} currentPage - Current active page
 * @param {number} totalPages - Total number of pages
 * @returns {array} Array of page numbers and ellipsis strings
 */
function getPageNumbers(currentPage, totalPages) {
  const pages = [];

  if (totalPages <= 7) {
    // Show all pages if 7 or fewer
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    // Show pages around current page
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    // Always show last page
    pages.push(totalPages);
  }

  return pages;
}

/**
 * Renders condensed mobile pagination (fewer page buttons)
 * @param {number} visibleCount - Total number of visible/filtered rows
 * @param {object} paginationState - Current pagination state
 * @returns {string} HTML markup for mobile pagination
 */
export function renderMobilePagination(visibleCount, paginationState) {
  const { currentPage, itemsPerPage, totalPages, availableSizes } =
    paginationState;

  // Calculate result range
  const startResult =
    visibleCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endResult = Math.min(currentPage * itemsPerPage, visibleCount);

  // Build page size selector (same as desktop)
  const pageSizeOptions = availableSizes
    .map(
      (size) =>
        `<option value="${size}" ${size === itemsPerPage ? "selected" : ""}>${size}</option>`,
    )
    .join("");

  const pageSizeSelector = `
    <div class="page-size-control">
      <label for="pageSizeSelect" class="page-size-label">Show:</label>
      <select id="pageSizeSelect" class="form-select form-select-sm page-size-select">
        ${pageSizeOptions}
      </select>
      <span class="results-info">Showing ${startResult}-${endResult} of ${visibleCount}</span>
    </div>
  `;

  // Condensed page navigation (only prev/current/next)
  const mobileButtons = `
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
      <button class="page-link" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="Previous">
        <i class="fas fa-chevron-left"></i>
      </button>
    </li>
    <li class="page-item active">
      <span class="page-link">${currentPage} of ${totalPages}</span>
    </li>
    <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
      <button class="page-link" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} aria-label="Next">
        <i class="fas fa-chevron-right"></i>
      </button>
    </li>
  `;

  return `
    <div class="pagination-container pagination-mobile">
      ${pageSizeSelector}
      <nav aria-label="Table pagination" class="pagination-nav">
        <ul class="pagination pagination-sm mb-0">
          ${mobileButtons}
        </ul>
      </nav>
    </div>
  `;
}
