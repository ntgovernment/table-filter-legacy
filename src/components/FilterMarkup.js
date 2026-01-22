/**
 * FilterMarkup Component
 * Handles creation of filter UI markup
 */

export function createFilterMarkup(
  table,
  searchPlaceholder,
  columnFiltersArray,
) {
  const container = document.createElement("div");
  container.id = "ntgc-page-filters";
  container.className = "row mt-5 d-print-none";

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

    <div class="m-3 hidden" id="applied-filters">
        <div class="filter-option" id="active-filters">
            <strong>Applied filters:</strong>
            <div class="d-inline-block pt-2" id="filterPillsContainer">
                <span id="filterPills"></span>
                <a href="#" id="clearAllFilters">Clear all</a>
            </div>
        </div>
    </div>
  `;

  table.parentNode.insertBefore(container, table);
  return container;
}
