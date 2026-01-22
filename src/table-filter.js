/**
 * Table Filter Component
 * A simple table filtering component for legacy agency sites
 */

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

    this.init();
  }

  init() {
    this.createFilterMarkup();
    this.attachEventListeners();
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
    container.className = "row mt-5 d-print-none";

    // Get data attributes
    const filterDiv = document.querySelector("[data-table-filter]");
    const searchPlaceholder =
      filterDiv?.getAttribute("data-search-placeholder") || "Search";
    const columnFiltersAttr =
      filterDiv?.getAttribute("data-column-filters") || "";

    // Parse column filters
    const columnFiltersArray = columnFiltersAttr
      .split(";")
      .map((f) => f.trim())
      .filter((f) => f);

    // Build the markup
    container.innerHTML = `
    <!-- Free text search filter -->
    <div class="filter-option mb-1 col-lg-4" id="text-question">
        <label for="searchInput">Search</label>
        <div class="input-group">
            <input type="text" name="project_title" id="searchInput" class="form-control rounded-0" placeholder="${searchPlaceholder}" autocomplete="off">
            <span class="clear-input" id="clearInput" hidden=""></span>
        </div>
    </div>

    <!-- Filter dropdowns will be generated dynamically -->
    <div id="filterControls" class="d-flex flex-nowrap col-lg-8" style="gap: 16px;"></div>

    <div class="mt-3 hidden" id="applied-filters">
        <div class="filter-option" id="active-filters">
            <strong>Applied filters:</strong>
            <div class="d-inline-block pt-2" id="filterPillsContainer">
                <span id="filterPills"></span>
                <a href="#" id="clearAllFilters">Clear all</a>
            </div>
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
      filterDiv.className = "filter-option flex-fill";
      filterDiv.style.cssText = "flex: 1 1 0; min-width: 0;";

      const selectId = `selectInput${index + 1}`;
      const label =
        columnName === "Year of finding" ? "Year of issue" : columnName;
      const placeholder = `Select ${label.toLowerCase()}`;

      filterDiv.innerHTML = `
        <label for="${selectId}" class="ntgc-form-input--label">${label}</label>
        <div>
            <select name="select-input-${index + 1}" id="${selectId}" class="form-select rounded-0">
                <option value="all" selected="">${placeholder}</option>
                ${values.map((val) => `<option value="${val.toLowerCase()}">${val}</option>`).join("")}
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
    const tbody = this.table.querySelector("tbody");
    const rows = tbody ? Array.from(tbody.querySelectorAll("tr")) : [];
    const values = new Set();

    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells[columnIndex]) {
        const text = cells[columnIndex].textContent.trim();
        if (text) {
          values.add(text);
        }
      }
    });

    // Sort values
    return Array.from(values).sort((a, b) => {
      // Try to sort numerically if both are numbers
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
    const searchTerm = this.activeFilters.search.toLowerCase().trim();
    const tbody = this.table.querySelector("tbody");
    const rows = tbody
      ? tbody.querySelectorAll("tr")
      : this.table.querySelectorAll("tr");
    let visibleCount = 0;

    rows.forEach((row, index) => {
      // Skip header row if no tbody
      if (!tbody && index === 0) {
        return;
      }

      let isVisible = true;

      // Check search term
      if (searchTerm) {
        const text = row.textContent.toLowerCase();
        if (!text.includes(searchTerm)) {
          isVisible = false;
        }
      }

      // Check column filters
      if (isVisible) {
        for (const [columnIndex, filterValues] of Object.entries(
          this.activeFilters.columns,
        )) {
          const cells = row.querySelectorAll("td");
          const cell = cells[columnIndex];
          if (cell && filterValues.length > 0) {
            const cellText = cell.textContent.trim().toLowerCase();
            // OR logic: row must match at least ONE of the filter values for this column
            if (!filterValues.includes(cellText)) {
              isVisible = false;
              break;
            }
          }
        }
      }

      if (isVisible) {
        row.style.display = "";
        visibleCount++;
      } else {
        row.style.display = "none";
      }
    });

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
    } else {
      pillsContainer.innerHTML = "";
      appliedFiltersSection.classList.add("hidden");
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

    this.filterTable();
    this.updateClearButton();
    this.updateFilterPills();
  }

  updateNoResultsMessage(show) {
    let message = document.querySelector(`.${this.options.noResultsClass}`);

    if (show && !message) {
      message = document.createElement("div");
      message.className = this.options.noResultsClass;
      message.textContent = "No matching results found.";
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
