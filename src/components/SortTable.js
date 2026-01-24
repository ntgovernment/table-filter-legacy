/**
 * SortTable Component
 * Handles table sorting functionality with support for text, numeric, and date columns
 */

/**
 * Initialize table headers with sort icons and click handlers
 * @param {HTMLElement} table - The table element
 * @param {Function} sortCallback - Callback function to handle sorting (receives columnIndex)
 */
export function initializeTableHeaders(table, sortCallback) {
  const thead = table.querySelector("thead");
  if (!thead) return;

  const headers = thead.querySelectorAll("th");
  headers.forEach((header, index) => {
    // Skip if header already has sort icon
    if (header.querySelector(".sort-icon")) return;

    // Wrap existing text content in a div
    const textContent = header.innerHTML;
    header.innerHTML = "";

    const textDiv = document.createElement("div");
    textDiv.className = "header-text";
    textDiv.innerHTML = textContent;
    header.appendChild(textDiv);

    // Add sort icon in its own div
    const iconDiv = document.createElement("div");
    iconDiv.className = "header-icons";

    const sortIcon = document.createElement("span");
    sortIcon.className = "sort-icon";
    sortIcon.innerHTML = `
        <i class="fas fa-chevron-up sort-arrow sort-arrow-up"></i>
        <i class="fas fa-chevron-down sort-arrow sort-arrow-down"></i>
      `;

    iconDiv.appendChild(sortIcon);
    header.appendChild(iconDiv);

    // Add click handler
    header.addEventListener("click", () => sortCallback(index));
  });
}

/**
 * Sort table rows by column index
 * @param {Object} context - The TableFilter instance context
 * @param {number} columnIndex - Index of column to sort by
 */
export function sortTable(context, columnIndex) {
  if (!context.cache.tbody) return;

  const headers = context.table.querySelectorAll("thead th");

  // Determine sort direction
  let direction = "asc";
  if (context.sortState.columnIndex === columnIndex) {
    if (context.sortState.direction === "asc") {
      direction = "desc";
    } else if (context.sortState.direction === "desc") {
      // Reset sort
      direction = null;
    }
  }

  // Update sort state
  context.sortState.columnIndex = direction ? columnIndex : null;
  context.sortState.direction = direction;

  // Reset pagination to first page when sorting
  if (context.paginationState) {
    context.paginationState.currentPage = 1;
  }

  // Update header UI
  updateHeaderClasses(headers, columnIndex, direction);

  // Perform sort
  const sortedRows = performSort(
    context.cache.rowData,
    columnIndex,
    direction,
    context.cache.dateColumns,
  );

  // Re-append rows in sorted order
  sortedRows.forEach((rowData) =>
    context.cache.tbody.appendChild(rowData.element),
  );

  // Re-apply filtering to update visibility
  context.filterTable();
}

/**
 * Update header classes to reflect current sort state
 * @param {NodeList} headers - Table header elements
 * @param {number} columnIndex - Index of sorted column
 * @param {string|null} direction - Sort direction ('asc', 'desc', or null)
 */
function updateHeaderClasses(headers, columnIndex, direction) {
  // Remove sort classes from all headers
  headers.forEach((h) => {
    h.classList.remove("sort-asc", "sort-desc");
  });

  // Add sort class to current header
  if (direction) {
    headers[columnIndex].classList.add(`sort-${direction}`);
  }
}

/**
 * Perform the actual sorting of row data
 * @param {Array} rowData - Array of cached row data objects
 * @param {number} columnIndex - Index of column to sort by
 * @param {string|null} direction - Sort direction ('asc', 'desc', or null)
 * @param {Array} dateColumns - Array of column indices that contain dates
 * @returns {Array} Sorted array of row data
 */
function performSort(rowData, columnIndex, direction, dateColumns) {
  const sortedRows = [...rowData];

  if (direction) {
    const isDateColumn = dateColumns.includes(columnIndex);

    sortedRows.sort((a, b) => {
      const aCell = a.cells[columnIndex];
      const bCell = b.cells[columnIndex];

      if (!aCell || !bCell) return 0;

      // Use date sorting for date columns
      if (isDateColumn && aCell.dateValue && bCell.dateValue) {
        const comparison = aCell.dateValue.localeCompare(bCell.dateValue);
        return direction === "asc" ? comparison : -comparison;
      }

      // Use numeric comparison if available
      if (aCell.numericValue !== null && bCell.numericValue !== null) {
        return direction === "asc"
          ? aCell.numericValue - bCell.numericValue
          : bCell.numericValue - aCell.numericValue;
      }

      // Fallback to text comparison
      const comparison = aCell.text.localeCompare(bCell.text);
      return direction === "asc" ? comparison : -comparison;
    });
  } else {
    // Restore original order using original index
    sortedRows.sort((a, b) => a.originalIndex - b.originalIndex);
  }

  return sortedRows;
}
