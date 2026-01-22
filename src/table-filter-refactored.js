/**
 * Table Filter Component
 * A simple table filtering component for legacy agency sites
 * Refactored into modular architecture
 */

import { createFilterMarkup } from "./components/FilterMarkup.js";
import { generateColumnFilters } from "./components/ColumnFilters.js";
import { filterTable } from "./components/FilterLogic.js";
import { updateFilterPills } from "./components/FilterPills.js";
import { updateDropdownOptions } from "./components/DropdownManager.js";
import {
  clearSearchFilter,
  clearColumnFilter,
  clearAllFilters,
  updateClearButton,
} from "./components/FilterActions.js";
import { updateNoResultsMessage } from "./components/NoResults.js";
import { attachEventListeners } from "./components/EventListeners.js";

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
      columns: {}, // columnIndex -> array of filter values
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

    // Create filter markup using module
    this.filterContainer = createFilterMarkup(
      this.table,
      searchPlaceholder,
      columnFiltersArray,
    );
    this.searchInput = document.getElementById("searchInput");

    // Generate column filter dropdowns using module
    generateColumnFilters(this.table, columnFiltersArray, this.columnFilters);
  }

  attachEventListeners() {
    attachEventListeners(this);
  }

  filterTable() {
    const visibleCount = filterTable(this.table, this.activeFilters);
    this.updateNoResultsMessage(visibleCount === 0);
  }

  updateFilterPills() {
    updateFilterPills(this.activeFilters, this.columnFilters);
  }

  updateDropdownOptions(columnIndex) {
    updateDropdownOptions(columnIndex, this.activeFilters, this.columnFilters);
  }

  clearSearchFilter() {
    clearSearchFilter(this);
  }

  clearColumnFilter(columnIndex, filterValue = null) {
    clearColumnFilter(this, columnIndex, filterValue);
  }

  clearAllFilters() {
    clearAllFilters(this);
  }

  updateClearButton() {
    updateClearButton(this.searchInput);
  }

  updateNoResultsMessage(show) {
    updateNoResultsMessage(this.table, show, this.options.noResultsClass);
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
