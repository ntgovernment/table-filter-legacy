/**
 * Table Filter Component
 * A simple table filtering component for legacy agency sites
 */

import {
  initializeTableHeaders as initSortHeaders,
  sortTable as performSortAction,
  performSort,
} from "./components/SortTable.js";

class TableFilter {
  constructor(tableSelector, options = {}) {
    this.table = document.querySelector(tableSelector);
    this.options = {
      searchInputClass: options.searchInputClass || "table-filter-search",
      noResultsClass: options.noResultsClass || "table-filter-no-results",
      ...options,
    };

    if (!this.table) {
      console.warn(`Table not found: ${tableSelector}`);
      return;
    }

    this.filterContainer = null;
    this.searchInput = null;
    this.columnFilters = [];
    this.activeFilters = {
      search: "",
      columns: {},
    };
    this.sortState = {
      columnIndex: null,
      direction: null, // 'asc' or 'desc'
    };

    // Find the filterDiv associated with this table instance
    // Use data-table-id to match the correct filter configuration
    const tableId = this.table.id;
    this.filterDiv = tableId
      ? document.querySelector(
          `[data-table-filter][data-table-id="${tableId}"]`,
        )
      : document.querySelector("[data-table-filter]");

    // Read pagination configuration from data attributes
    const itemsPerPageAttr = this.filterDiv?.getAttribute(
      "data-pagination-items-per-page",
    );

    this.paginationState = {
      currentPage: 1,
      itemsPerPage: itemsPerPageAttr ? parseInt(itemsPerPageAttr, 10) : 10,
      totalPages: 1,
      enabled: !!itemsPerPageAttr,
      availableSizes: [10, 25, 50, 100],
    };

    // Initialize cache structure
    this.cache = {
      tbody: null,
      thead: null,
      headerCells: [],
      allRows: [],
      rowData: [], // Original complete table data
      filteredRowData: [], // Filtered results cache
      columnValues: {},
      columnCount: 0,
      rowCount: 0,
      dateColumns: [], // Track which columns contain dates
    };

    this.init();
  }

  init() {
    // Add data-table-filter attribute to the table for CSS targeting
    this.table.setAttribute("data-table-filter", "");

    // Cache table data FIRST (before any manipulation)
    this.cacheTableData();

    this.createFilterMarkup();
    this.initializeTableHeaders();
    this.attachEventListeners();
    this.applyDefaultSort();
    this.applyQueryStringFilters();

    // Apply pagination on initial load if no filters applied
    this.filterTable();
  }

  /**
   * Cache table data on page load for performance
   * Stores DOM references, cell text, and precomputes column values
   */
  cacheTableData() {
    // Cache header and body elements
    this.cache.tbody = this.table.querySelector("tbody");
    this.cache.thead = this.table.querySelector("thead");

    if (!this.cache.tbody) {
      console.warn("No tbody found in table");
      return;
    }

    // Cache header cells and detect date columns
    if (this.cache.thead) {
      this.cache.headerCells = Array.from(
        this.cache.thead.querySelectorAll("th"),
      );
      this.cache.columnCount = this.cache.headerCells.length;

      // Detect date columns by checking if header contains "date"
      this.cache.headerCells.forEach((header, index) => {
        const headerText = header.textContent.toLowerCase();
        if (headerText.includes("date")) {
          this.cache.dateColumns.push(index);
        }
      });
    }

    // Cache all rows
    const rows = this.cache.tbody.querySelectorAll("tr");
    this.cache.allRows = Array.from(rows);
    this.cache.rowCount = rows.length;

    // Process and cache row data
    rows.forEach((row, rowIndex) => {
      // Set original index attribute
      row.setAttribute("data-original-index", rowIndex.toString());

      const cells = row.querySelectorAll("td");
      const cellData = Array.from(cells).map((cell, colIndex) => {
        // Normalize whitespace: replace newlines, tabs, and multiple spaces with single space
        let text = cell.textContent.trim().replace(/\s+/g, " ");
        let dateValue = null;
        let sortValue = null;

        // Process cells that start with anchor tags
        const anchorTag = cell.querySelector("a");
        if (anchorTag && cell.innerHTML.trim().startsWith("<a")) {
          const anchorText = anchorTag.textContent.trim().replace(/\s+/g, " ");
          sortValue = anchorText;
          cell.setAttribute("data-sort", anchorText);
        }

        // Process date columns
        if (this.cache.dateColumns.includes(colIndex)) {
          const processedDate = this.processDateCell(cell);
          if (processedDate) {
            dateValue = processedDate.isoDate;
            sortValue = processedDate.isoDate;
            cell.setAttribute("data-sort", processedDate.isoDate);
            // Use formatted date for display purposes in cache
            text = processedDate.originalText;
          }
        }

        return {
          element: cell,
          text: text,
          lowerText: text.toLowerCase(),
          numericValue: this.parseNumericValue(text),
          dateValue: dateValue,
          sortValue: sortValue,
        };
      });

      const fullText = cellData.map((c) => c.text).join(" ");

      this.cache.rowData.push({
        element: row,
        originalIndex: rowIndex,
        cells: cellData,
        fullText: fullText,
        fullTextLower: fullText.toLowerCase(),
      });
    });

    // Precompute unique column values for filters
    this.precomputeColumnValues();
  }

  /**
   * Process date cell: extract first line, normalize, and convert to ISO format
   */
  processDateCell(cell) {
    // Get cell HTML to properly handle <br> tags
    let cellHtml = cell.innerHTML;

    // Replace &nbsp; with regular spaces
    cellHtml = cellHtml.replace(/&nbsp;/g, " ");

    // Extract first line (before <br> tag)
    let firstLine = cellHtml.split(/<br\s*\/?>/i)[0].trim();

    // Remove HTML tags from the first line
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = firstLine;
    const textContent = tempDiv.textContent.trim();

    if (!textContent) return null;

    // Try to parse and convert to yyyy-mm-dd format
    const isoDate = this.convertToISODate(textContent);

    return isoDate
      ? {
          originalText: textContent,
          isoDate: isoDate,
        }
      : null;
  }

  /**
   * Convert various date formats to yyyy-mm-dd ISO format
   * Supports: dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy, etc.
   */
  convertToISODate(dateStr) {
    // Clean up the date string
    dateStr = dateStr.trim();

    // Try common date patterns
    // Pattern: dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy
    const dmyPattern = /^(\d{1,2})[\/ \-\.](\d{1,2})[\/ \-\.](\d{4})$/;
    const dmyMatch = dateStr.match(dmyPattern);

    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, "0");
      const month = dmyMatch[2].padStart(2, "0");
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }

    // Pattern: yyyy-mm-dd (already ISO)
    const isoPattern = /^(\d{4})[\/ \-\.](\d{1,2})[\/ \-\.](\d{1,2})$/;
    const isoMatch = dateStr.match(isoPattern);

    if (isoMatch) {
      const year = isoMatch[1];
      const month = isoMatch[2].padStart(2, "0");
      const day = isoMatch[3].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // Try parsing as Date object (fallback)
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const day = String(parsed.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    return null;
  }

  /**
   * Parse numeric value from text for sorting
   */
  parseNumericValue(text) {
    const cleaned = text.replace(/[^0-9.-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  /**
   * Parse search input into structured terms:
   * - Extracts quoted phrases for exact matching
   * - Splits remaining text by case-insensitive AND keyword
   * - Splits each AND group by spaces for OR matching within group
   * - Filters empty strings and handles edge cases
   *
   * Examples:
   *   "fire water" → { andGroups: [["fire", "water"]], exactPhrases: [] }
   *   "fire AND water" → { andGroups: [["fire"], ["water"]], exactPhrases: [] }
   *   '"John Smith"' → { andGroups: [], exactPhrases: ["john smith"] }
   *   '"urgent" AND fire water' → { andGroups: [["urgent"], ["fire", "water"]], exactPhrases: ["urgent"] }
   */
  parseSearchTerms(input) {
    const trimmed = input.trim();
    if (!trimmed) return { andGroups: [], exactPhrases: [] };

    // Extract quoted phrases and replace with placeholders
    const phrases = [];
    const placeholders = [];
    let processed = trimmed.replace(/"([^"]+)"/g, (match, phrase) => {
      const placeholder = `__PHRASE_${phrases.length}__`;
      phrases.push(phrase.toLowerCase());
      placeholders.push(placeholder);
      return placeholder;
    });

    // Split by AND (case-insensitive)
    const andParts = processed.split(/\s+and\s+/i);

    // Split each AND part by spaces for OR terms
    const andGroups = andParts
      .map((part) => {
        return part
          .split(/\s+/)
          .filter((term) => term.length > 0)
          .map((term) => {
            // Restore phrase or lowercase term
            const phraseIndex = placeholders.indexOf(term);
            return phraseIndex >= 0 ? phrases[phraseIndex] : term.toLowerCase();
          });
      })
      .filter((group) => group.length > 0);

    return { andGroups, exactPhrases: phrases };
  }

  /**
   * Precompute unique values for each column (for filter dropdowns)
   */
  precomputeColumnValues() {
    for (let colIndex = 0; colIndex < this.cache.columnCount; colIndex++) {
      const values = new Set();

      this.cache.rowData.forEach((rowData) => {
        if (rowData.cells[colIndex]) {
          const text = rowData.cells[colIndex].text;
          if (text) {
            values.add(text);
          }
        }
      });

      // Sort values
      const sortedValues = Array.from(values).sort((a, b) => {
        // Try to sort numerically if both are numbers
        const aNum = parseInt(a);
        const bNum = parseInt(b);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.localeCompare(b);
      });

      this.cache.columnValues[colIndex] = sortedValues;
    }
  }

  initializeTableHeaders() {
    // Use imported function from SortTable component
    initSortHeaders(this.table, (columnIndex) => this.sortTable(columnIndex));
  }

  createFilterMarkup() {
    // Check if filter already exists
    const existing = document.getElementById("ntgc-page-filters");
    if (existing) {
      this.filterContainer = existing;
      this.searchInput = document.getElementById("searchInput");
      return;
    }

    // Create the main filter container
    const container = document.createElement("div");
    container.id = "ntgc-page-filters";
    container.className = "row mx-1 d-print-none";

    // Get data attributes from instance-specific filterDiv
    const searchPlaceholder =
      this.filterDiv?.getAttribute("data-search-placeholder") || "Search";
    const columnFiltersAttr =
      this.filterDiv?.getAttribute("data-column-filters") || "";

    // Parse column filters
    const columnFiltersArray = columnFiltersAttr
      .split(";")
      .map((f) => f.trim())
      .filter((f) => f);

    // Build the markup
    container.innerHTML = `
    <!-- Filter inputs wrapper -->
    <div class="filter-inputs-wrapper">
        <!-- Free text search filter -->
        <div class="filter-option mb-1" id="text-question">
            <label for="searchInput">Search <span class="search-help" title="Search syntax: ''exact phrase'', fire AND water, fire water (OR)" style="cursor: help;">ⓘ</span></label>
            <div class="input-group" style="position: relative;">
                <input type="text" name="project_title" id="searchInput" class="form-control rounded-0" placeholder="${searchPlaceholder}" autocomplete="off">
                <span class="clear-input" id="clearInput" hidden=""></span>
            </div>
        </div>

        <!-- Filter dropdowns will be generated dynamically -->
        <div id="filterControls" class="filter-controls"></div>
    </div>

    <div class="m-3 w-100 hidden" id="applied-filters">
        <div class="filter-option d-flex justify-content-between align-items-start" id="active-filters">
            <div>
                <strong>Applied filters:</strong>
                <div class="d-inline-block pt-2" id="filterPillsContainer">
                    <span id="filterPills"></span>
                    <a href="#" id="clearAllFilters">Clear all</a>
                </div>
            </div>
            <button type="button" id="copyFilterLink" class="filter-link-button my-2 mx-0" style="display: none;" title="Copy filter link">
                <i class="fas fa-link"></i> Copy filter link
            </button>
        </div>
    </div>
    `;

    // Insert before table
    this.table.parentNode.insertBefore(container, this.table);

    this.filterContainer = container;
    this.searchInput = document.getElementById("searchInput");

    // Generate column filter dropdowns
    this.generateColumnFilters(columnFiltersArray);
  }

  generateColumnFilters(columnNames) {
    if (!columnNames.length) return;

    const filterControls = document.getElementById("filterControls");
    const thead = this.table.querySelector("thead");
    if (!thead) return;

    const headers = Array.from(thead.querySelectorAll("th"));

    columnNames.forEach((columnName, index) => {
      // Find the column index by matching header text
      const columnIndex = headers.findIndex(
        (th) =>
          th.textContent.trim().toLowerCase() === columnName.toLowerCase(),
      );

      if (columnIndex === -1) return;

      // Extract unique values from this column
      const values = this.getUniqueColumnValues(columnIndex);

      // Create the select dropdown
      const filterDiv = document.createElement("div");
      filterDiv.className = "filter-option mb-1";

      const selectId = `selectInput${index + 1}`;
      const label =
        columnName === "Year of finding" ? "Year of issue" : columnName;
      const placeholder = `Select ${label.toLowerCase()}`;

      filterDiv.innerHTML = `
        <label for="${selectId}" class="ntgc-form-input--label">${label}</label>
        <div>
            <select name="select-input-${index + 1}" id="${selectId}" class="form-select rounded-0">
                <option value="all" selected="">${placeholder}</option>
                ${values.map((val) => `<option value="${val}">${val}</option>`).join("")}
            </select>
        </div>
      `;

      filterControls.appendChild(filterDiv);

      // Store column filter info
      this.columnFilters.push({
        columnIndex,
        selectId,
        columnName,
      });
    });
  }

  getUniqueColumnValues(columnIndex) {
    // Return precomputed values from cache
    if (this.cache.columnValues[columnIndex]) {
      return this.cache.columnValues[columnIndex];
    }

    // Fallback (shouldn't happen after caching)
    console.warn(
      `Column ${columnIndex} values not cached, computing on demand`,
    );
    const values = new Set();

    this.cache.rowData.forEach((rowData) => {
      if (rowData.cells[columnIndex]) {
        const text = rowData.cells[columnIndex].text;
        if (text) {
          values.add(text);
        }
      }
    });

    // Sort values
    return Array.from(values).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return a.localeCompare(b);
    });
  }

  attachEventListeners() {
    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener("input", (e) => {
        this.activeFilters.search = e.target.value;
        this.paginationState.currentPage = 1; // Reset to first page
        this.filterTable();
        this.updateClearButton();
        this.updateFilterPills();
      });
    }

    // Clear input button
    const clearInput = document.getElementById("clearInput");
    if (clearInput) {
      clearInput.addEventListener("click", () => {
        this.searchInput.value = "";
        this.activeFilters.search = "";
        this.paginationState.currentPage = 1; // Reset to first page
        this.filterTable();
        this.updateClearButton();
        this.updateFilterPills();
      });
    }

    // Column filter dropdowns
    this.columnFilters.forEach((filter) => {
      const select = document.getElementById(filter.selectId);
      if (select) {
        select.addEventListener("change", (e) => {
          const value = e.target.value;
          if (value !== "all") {
            // Initialize array if it doesn't exist
            if (!this.activeFilters.columns[filter.columnIndex]) {
              this.activeFilters.columns[filter.columnIndex] = [];
            }
            // Add value to array if not already present
            if (
              !this.activeFilters.columns[filter.columnIndex].includes(value)
            ) {
              this.activeFilters.columns[filter.columnIndex].push(value);
            }
            // Reset dropdown to "all" after adding filter
            e.target.value = "all";
            // Update dropdown options to hide selected values
            this.updateDropdownOptions(filter.columnIndex);
          }
          this.paginationState.currentPage = 1; // Reset to first page
          this.filterTable();
          this.updateFilterPills();
        });
      }
    });

    // Clear all filters
    const clearAll = document.getElementById("clearAllFilters");
    if (clearAll) {
      clearAll.addEventListener("click", (e) => {
        e.preventDefault();
        this.clearAllFilters();
      });
    }

    // Copy filter link button
    const copyButton = document.getElementById("copyFilterLink");
    if (copyButton) {
      copyButton.addEventListener("click", () => {
        this.copyFilterURL();
      });
    }
  }

  updateClearButton() {
    const clearInput = document.getElementById("clearInput");
    if (clearInput) {
      if (this.searchInput.value) {
        clearInput.removeAttribute("hidden");
      } else {
        clearInput.setAttribute("hidden", "");
      }
    }
  }

  filterTable() {
    const { andGroups, exactPhrases } = this.parseSearchTerms(
      this.activeFilters.search,
    );
    let visibleRows = [];

    // Hide all rows first to ensure clean state
    this.cache.rowData.forEach((rowData) => {
      rowData.element.style.display = "none";
    });

    // Filter rows to determine which should be visible
    this.cache.rowData.forEach((rowData) => {
      let isVisible = true;

      // Check search terms: all exact phrases must match, all AND groups must have at least one OR term match
      if (andGroups.length > 0 || exactPhrases.length > 0) {
        // All exact phrases must match
        const allPhrasesMatch = exactPhrases.every((phrase) =>
          rowData.fullTextLower.includes(phrase),
        );

        // All AND groups must have at least one term match (OR within group)
        const allGroupsMatch = andGroups.every((orTerms) =>
          orTerms.some((term) => rowData.fullTextLower.includes(term)),
        );

        if (!allPhrasesMatch || !allGroupsMatch) {
          isVisible = false;
        }
      }

      // Check column filters using cached cell data
      if (isVisible) {
        for (const [columnIndex, filterValues] of Object.entries(
          this.activeFilters.columns,
        )) {
          const cell = rowData.cells[columnIndex];
          if (cell && filterValues.length > 0) {
            const cellText = cell.text;
            // OR logic: row must match at least ONE of the filter values for this column
            if (!filterValues.includes(cellText)) {
              isVisible = false;
              break;
            }
          }
        }
      }

      if (isVisible) {
        visibleRows.push(rowData);
      }
    });

    // Save filtered results to cache
    this.cache.filteredRowData = visibleRows;

    // Apply sorting if active
    if (this.sortState.direction && this.sortState.columnIndex !== null) {
      // Sort the filtered data
      this.cache.filteredRowData = performSort(
        this.cache.filteredRowData,
        this.sortState.columnIndex,
        this.sortState.direction,
        this.cache.dateColumns,
      );

      // Re-append filtered rows in sorted order to physically reorder the DOM
      this.cache.filteredRowData.forEach((rowData) => {
        this.cache.tbody.appendChild(rowData.element);
      });
    } else {
      // No active sort - restore original order for filtered rows
      const originalOrder = [...this.cache.filteredRowData].sort(
        (a, b) => a.originalIndex - b.originalIndex,
      );
      originalOrder.forEach((rowData) => {
        this.cache.tbody.appendChild(rowData.element);
      });
    }

    const visibleCount = this.cache.filteredRowData.length;

    // Apply pagination if enabled
    if (this.paginationState.enabled && visibleCount > 0) {
      // Calculate total pages
      this.paginationState.totalPages = Math.ceil(
        visibleCount / this.paginationState.itemsPerPage,
      );

      // Ensure current page is within bounds
      if (this.paginationState.currentPage > this.paginationState.totalPages) {
        this.paginationState.currentPage = 1;
      }

      // Calculate page boundaries
      const startIndex =
        (this.paginationState.currentPage - 1) *
        this.paginationState.itemsPerPage;
      const endIndex = startIndex + this.paginationState.itemsPerPage;

      // Show/hide rows based on pagination
      this.cache.filteredRowData.forEach((rowData, index) => {
        if (index >= startIndex && index < endIndex) {
          rowData.element.style.display = "";
        } else {
          rowData.element.style.display = "none";
        }
      });

      // Render pagination controls
      this.renderPaginationControls(visibleCount);
    } else {
      // No pagination - show all visible rows
      this.cache.filteredRowData.forEach((rowData) => {
        rowData.element.style.display = "";
      });

      // Remove pagination controls if they exist
      this.removePaginationControls();
    }

    this.updateNoResultsMessage(visibleCount === 0);
  }

  updateFilterPills() {
    const pillsContainer = document.getElementById("filterPills");
    const appliedFiltersSection = document.getElementById("applied-filters");

    if (!pillsContainer || !appliedFiltersSection) return;

    const pills = [];

    // Add search pill
    if (this.activeFilters.search) {
      pills.push(`
        <button type="button" class="filter-pill" tabindex="0" onclick="window.tableFilterInstance?.clearSearchFilter()" aria-label="Remove filter: ${this.activeFilters.search}">
          <span class="filter-pill-label">${this.activeFilters.search}</span>
          <span class="filter-pill-close" aria-hidden="true">×</span>
        </button>
      `);
    }

    // Add column filter pills
    for (const [columnIndex, filterValues] of Object.entries(
      this.activeFilters.columns,
    )) {
      const filter = this.columnFilters.find(
        (f) => f.columnIndex == columnIndex,
      );
      if (filter && Array.isArray(filterValues)) {
        // Create a pill for each filter value (grouped by column)
        filterValues.forEach((filterValue) => {
          pills.push(`
            <button type="button" class="filter-pill" tabindex="0" onclick="window.tableFilterInstance?.clearColumnFilter(${columnIndex}, '${filterValue}')" aria-label="Remove filter: ${filterValue}">
              <span class="filter-pill-label">${filterValue}</span>
              <span class="filter-pill-close" aria-hidden="true">×</span>
            </button>
          `);
        });
      }
    }

    if (pills.length > 0) {
      pillsContainer.innerHTML = pills.join("");
      appliedFiltersSection.classList.remove("hidden");

      // Show copy button when there are active filters
      const copyButton = document.getElementById("copyFilterLink");
      if (copyButton) {
        copyButton.style.display = "inline-flex";
      }
    } else {
      pillsContainer.innerHTML = "";
      appliedFiltersSection.classList.add("hidden");

      // Hide copy button when there are no active filters
      const copyButton = document.getElementById("copyFilterLink");
      if (copyButton) {
        copyButton.style.display = "none";
      }
    }
  }

  clearSearchFilter() {
    this.searchInput.value = "";
    this.activeFilters.search = "";
    this.filterTable();
    this.updateClearButton();
    this.updateFilterPills();
  }

  clearColumnFilter(columnIndex, filterValue = null) {
    if (filterValue === null) {
      // Clear all filters for this column
      delete this.activeFilters.columns[columnIndex];
    } else {
      // Remove specific filter value from the array
      const filters = this.activeFilters.columns[columnIndex];
      if (filters) {
        const index = filters.indexOf(filterValue);
        if (index > -1) {
          filters.splice(index, 1);
        }
        // If array is empty, delete the column entry
        if (filters.length === 0) {
          delete this.activeFilters.columns[columnIndex];
        }
      }
    }

    // Update dropdown options to show removed values
    this.updateDropdownOptions(columnIndex);

    // Reset pagination to first page
    this.paginationState.currentPage = 1;

    this.filterTable();
    this.updateFilterPills();
  }

  updateDropdownOptions(columnIndex) {
    const filter = this.columnFilters.find((f) => f.columnIndex == columnIndex);
    if (!filter) return;

    const select = document.getElementById(filter.selectId);
    if (!select) return;

    const selectedValues = this.activeFilters.columns[columnIndex] || [];

    // Show/hide options based on whether they're selected
    Array.from(select.options).forEach((option) => {
      if (option.value !== "all") {
        if (selectedValues.includes(option.value)) {
          option.style.display = "none";
        } else {
          option.style.display = "";
        }
      }
    });
  }

  sortTable(columnIndex) {
    // Use imported function from SortTable component
    performSortAction(this, columnIndex);
  }

  applyDefaultSort() {
    const defaultColumn = this.filterDiv?.getAttribute("data-default-column");
    const defaultOrder = this.filterDiv?.getAttribute("data-order");

    if (!defaultColumn || !this.cache.thead) {
      if (!defaultColumn) {
        console.log(
          "[TableFilter] No default column specified for initial sort",
        );
      }
      return;
    }

    // Find column index by matching header text
    const headers = Array.from(this.cache.thead.querySelectorAll("th"));
    const columnIndex = headers.findIndex(
      (th) =>
        th.textContent.trim().toLowerCase() === defaultColumn.toLowerCase(),
    );

    if (columnIndex === -1) {
      console.warn(
        `[TableFilter] Default column "${defaultColumn}" not found in table headers. Available headers:`,
        headers.map((h) => h.textContent.trim()),
      );
      return;
    }

    // Set sort state
    const direction =
      defaultOrder && defaultOrder.toLowerCase() === "descending"
        ? "desc"
        : "asc";
    this.sortState.columnIndex = columnIndex;
    this.sortState.direction = direction;

    // Update header UI
    const allHeaders = this.table.querySelectorAll("thead th");
    allHeaders.forEach((h) => {
      h.classList.remove("sort-asc", "sort-desc");
    });
    if (headers[columnIndex]) {
      headers[columnIndex].classList.add(`sort-${direction}`);
    }

    console.log(
      `[TableFilter] Initial sort applied: column "${defaultColumn}" (index ${columnIndex}), direction: ${direction}`,
    );
  }

  applyQueryStringFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    let filtersApplied = false;

    // Apply search keyword if present
    const searchParam = urlParams.get("search");
    if (searchParam && this.searchInput) {
      this.searchInput.value = searchParam;
      this.activeFilters.search = searchParam;
      this.updateClearButton();
      filtersApplied = true;
    }

    // Apply page number if present (for pagination)
    const pageParam = urlParams.get("page");
    if (pageParam && this.paginationState.enabled) {
      const pageNum = parseInt(pageParam, 10);
      if (pageNum > 0) {
        this.paginationState.currentPage = pageNum;
      }
    }

    // Apply filters from query string
    urlParams.forEach((value, key) => {
      // Skip search and page parameters as they're already handled
      if (key === "search" || key === "page") return;

      // Check if this key matches a column filter
      const filter = this.columnFilters.find((f) => f.columnName === key);

      if (filter) {
        const select = document.getElementById(filter.selectId);
        if (!select) return;

        // Check if the value exists in the dropdown options
        const option = Array.from(select.options).find(
          (opt) => opt.value === value,
        );

        if (option) {
          // Initialize array if it doesn't exist
          if (!this.activeFilters.columns[filter.columnIndex]) {
            this.activeFilters.columns[filter.columnIndex] = [];
          }
          // Add value to array if not already present
          if (!this.activeFilters.columns[filter.columnIndex].includes(value)) {
            this.activeFilters.columns[filter.columnIndex].push(value);
          }
          // Update dropdown options to hide selected values
          this.updateDropdownOptions(filter.columnIndex);
          filtersApplied = true;
        }
      }
    });

    // Apply filters and update UI if any filters were added
    if (filtersApplied) {
      this.filterTable();
      this.updateFilterPills();
    }
  }

  generateFilterURL() {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();

    // Add search keyword to query string
    if (this.activeFilters.search) {
      params.append("search", this.activeFilters.search);
    }

    // Add column filters to query string
    for (const [columnIndex, filterValues] of Object.entries(
      this.activeFilters.columns,
    )) {
      const filter = this.columnFilters.find(
        (f) => f.columnIndex == columnIndex,
      );
      if (filter && Array.isArray(filterValues)) {
        filterValues.forEach((value) => {
          // Use the original column name as the key
          params.append(filter.columnName, value);
        });
      }
    }

    // Add current page if pagination is enabled and not on page 1
    if (this.paginationState.enabled && this.paginationState.currentPage > 1) {
      params.append("page", this.paginationState.currentPage.toString());
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  copyFilterURL() {
    const url = this.generateFilterURL();

    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          this.showCopyFeedback(true);
        })
        .catch((err) => {
          console.warn("Clipboard API failed, using fallback:", err);
          this.fallbackCopyURL(url);
        });
    } else {
      // Use fallback for older browsers
      this.fallbackCopyURL(url);
    }
  }

  fallbackCopyURL(url) {
    const textArea = document.createElement("textarea");
    textArea.value = url;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      this.showCopyFeedback(successful);
    } catch (err) {
      console.error("Fallback copy failed:", err);
      this.showCopyFeedback(false);
    }

    document.body.removeChild(textArea);
  }

  showCopyFeedback(success) {
    const copyButton = document.getElementById("copyFilterLink");
    if (!copyButton) return;

    if (success) {
      // Store original content
      const originalHTML = copyButton.innerHTML;

      // Show success state
      copyButton.classList.add("copied");
      copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
      copyButton.disabled = true;

      // Reset after 2 seconds
      setTimeout(() => {
        copyButton.classList.remove("copied");
        copyButton.innerHTML = originalHTML;
        copyButton.disabled = false;
      }, 2000);
    } else {
      // Show error message
      alert("Failed to copy link. Please try again.");
    }
  }

  clearAllFilters() {
    // Clear search
    this.searchInput.value = "";
    this.activeFilters.search = "";

    // Clear column filters
    this.activeFilters.columns = {};
    this.columnFilters.forEach((filter) => {
      const select = document.getElementById(filter.selectId);
      if (select) {
        select.value = "all";
        // Show all options again
        Array.from(select.options).forEach((option) => {
          option.style.display = "";
        });
      }
    });

    // Reset pagination to first page
    this.paginationState.currentPage = 1;

    this.filterTable();
    this.updateClearButton();
    this.updateFilterPills();
  }

  renderPaginationControls(visibleCount) {
    // Remove existing pagination if present
    this.removePaginationControls();

    // Determine if mobile view
    const isMobile = window.innerWidth <= 768;

    // Generate pagination HTML
    let paginationHTML;
    if (isMobile) {
      paginationHTML = this.generateMobilePaginationHTML(visibleCount);
    } else {
      paginationHTML = this.generatePaginationHTML(visibleCount);
    }

    // Create pagination container
    const paginationContainer = document.createElement("div");
    paginationContainer.id = "tablePaginationControls";
    paginationContainer.className = "table-pagination-wrapper mt-3";
    paginationContainer.innerHTML = paginationHTML;

    // Insert after table
    this.table.parentNode.insertBefore(
      paginationContainer,
      this.table.nextSibling,
    );

    // Attach event listeners to pagination controls
    this.attachPaginationEventListeners();
  }

  removePaginationControls() {
    const existingPagination = document.getElementById(
      "tablePaginationControls",
    );
    if (existingPagination) {
      existingPagination.remove();
    }
  }

  generatePaginationHTML(visibleCount) {
    const { currentPage, itemsPerPage, totalPages, availableSizes } =
      this.paginationState;

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
    const pageButtons = this.buildPageButtons(currentPage, totalPages);

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

  generateMobilePaginationHTML(visibleCount) {
    const { currentPage, itemsPerPage, totalPages, availableSizes } =
      this.paginationState;

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

  buildPageButtons(currentPage, totalPages) {
    const buttons = [];

    // Previous button (tertiary style)
    buttons.push(`
      <li class="page-item page-item-nav ${currentPage === 1 ? "disabled" : ""}">
        <button class="page-link page-link-nav" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="Previous">
          <i class="fas fa-chevron-left"></i>
          <span class="page-nav-text">Previous</span>
        </button>
      </li>
    `);

    // Page number buttons with ellipsis logic
    const pageNumbers = this.getPageNumbers(currentPage, totalPages);

    pageNumbers.forEach((pageNum) => {
      if (pageNum === "...") {
        // Non-clickable ellipsis (plain text)
        buttons.push(`
          <li class="page-item page-item-ellipsis">
            <span class="page-ellipsis">...</span>
          </li>
        `);
      } else {
        buttons.push(`
          <li class="page-item ${pageNum === currentPage ? "active" : ""}">
            <button class="page-link page-link-number" data-page="${pageNum}" data-selected="${pageNum === currentPage ? "True" : "False"}" ${pageNum === currentPage ? 'aria-current="page"' : ""}>
              ${pageNum}
            </button>
          </li>
        `);
      }
    });

    // Next button (tertiary style with chevron) (tertiary style with chevron)
    buttons.push(`
      <li class="page-item page-item-nav ${currentPage === totalPages ? "disabled" : ""}">
        <button class="page-link page-link-nav" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} aria-label="Next">
          <span class="page-nav-text">Next</span>
          <i class="fas fa-chevron-right"></i>
        </button>
      </li>
    `);

    return buttons.join("");
  }

  getPageNumbers(currentPage, totalPages) {
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

  attachPaginationEventListeners() {
    // Page size change handler
    const pageSizeSelect = document.getElementById("pageSizeSelect");
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener("change", (e) => {
        this.paginationState.itemsPerPage = parseInt(e.target.value, 10);
        this.paginationState.currentPage = 1; // Reset to first page
        this.filterTable();
      });
    }

    // Page navigation button handlers
    const pageButtons = document.querySelectorAll(
      ".pagination-container .page-link[data-page]",
    );
    pageButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const newPage = parseInt(button.getAttribute("data-page"), 10);
        if (newPage >= 1 && newPage <= this.paginationState.totalPages) {
          this.paginationState.currentPage = newPage;
          this.filterTable();

          // Scroll to top of table
          this.table.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  updateNoResultsMessage(show) {
    let message = document.querySelector(`.${this.options.noResultsClass}`);

    if (show && !message) {
      message = document.createElement("div");
      message.className = this.options.noResultsClass;
      message.innerHTML = `
        <div class="info-alert-bar"></div>
        <div class="info-alert-content">
          <div class="info-alert-header">
            <svg class="info-alert-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4.33335C19.0942 4.33335 22.0616 5.56252 24.2495 7.75044C26.4375 9.93837 27.6666 12.9058 27.6666 16C27.6666 19.0942 26.4375 22.0617 24.2495 24.2496C22.0616 26.4375 19.0942 27.6667 16 27.6667C12.9058 27.6667 9.9383 26.4375 7.75038 24.2496C5.56246 22.0617 4.33329 19.0942 4.33329 16C4.33329 12.9058 5.56246 9.93837 7.75038 7.75044C9.9383 5.56252 12.9058 4.33335 16 4.33335ZM16 29.3334C19.5362 29.3334 22.9276 27.9286 25.428 25.4281C27.9285 22.9276 29.3333 19.5362 29.3333 16C29.3333 12.4638 27.9285 9.07241 25.428 6.57193C22.9276 4.07145 19.5362 2.66669 16 2.66669C12.4637 2.66669 9.07235 4.07145 6.57187 6.57193C4.07138 9.07241 2.66663 12.4638 2.66663 16C2.66663 19.5362 4.07138 22.9276 6.57187 25.4281C9.07235 27.9286 12.4637 29.3334 16 29.3334ZM13.5 21C13.0416 21 12.6666 21.375 12.6666 21.8334C12.6666 22.2917 13.0416 22.6667 13.5 22.6667H18.5C18.9583 22.6667 19.3333 22.2917 19.3333 21.8334C19.3333 21.375 18.9583 21 18.5 21H16.8333V15.1667C16.8333 14.7084 16.4583 14.3334 16 14.3334H13.9166C13.4583 14.3334 13.0833 14.7084 13.0833 15.1667C13.0833 15.625 13.4583 16 13.9166 16H15.1666V21H13.5ZM16 12.25C16.3315 12.25 16.6494 12.1183 16.8838 11.8839C17.1183 11.6495 17.25 11.3315 17.25 11C17.25 10.6685 17.1183 10.3506 16.8838 10.1161C16.6494 9.88172 16.3315 9.75002 16 9.75002C15.6684 9.75002 15.3505 9.88172 15.1161 10.1161C14.8817 10.3506 14.75 10.6685 14.75 11C14.75 11.3315 14.8817 11.6495 15.1161 11.8839C15.3505 12.1183 15.6684 12.25 16 12.25Z" fill="#107CC0"/>
            </svg>
            <div class="info-alert-text">
              <div class="info-alert-title">No matching results found</div>
              <div class="info-alert-message">Try adjusting your search terms or filters to find what you're looking for.</div>
            </div>
          </div>
        </div>
      `;
      this.table.parentNode.insertBefore(message, this.table.nextSibling);
    } else if (!show && message) {
      message.remove();
    }
  }
}

// Auto-initialize on DOMContentLoaded if data-table-filter attribute is present
document.addEventListener("DOMContentLoaded", () => {
  const tables = document.querySelectorAll("[data-table-filter]");
  tables.forEach((table) => {
    const tableId = table.getAttribute("data-table-id");
    const selector = tableId
      ? `#${tableId}`
      : table.id
        ? `#${table.id}`
        : table;
    const instance = new TableFilter(selector);

    // Store instance globally for pill close buttons
    if (!window.tableFilterInstance) {
      window.tableFilterInstance = instance;
    }
  });
});

// Export for use as module
export default TableFilter;

// Also expose globally for legacy use
if (typeof window !== "undefined") {
  window.TableFilter = TableFilter;
}
