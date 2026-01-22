/**
 * EventListeners Component
 * Attaches all event listeners for the filter component
 */

export function attachEventListeners(instance) {
  // Search input
  if (instance.searchInput) {
    instance.searchInput.addEventListener("input", (e) => {
      instance.activeFilters.search = e.target.value;
      instance.filterTable();
      instance.updateClearButton();
      instance.updateFilterPills();
    });
  }

  // Clear input button
  const clearInput = document.getElementById("clearInput");
  if (clearInput) {
    clearInput.addEventListener("click", () => {
      instance.clearSearchFilter();
    });
  }

  // Column filter dropdowns
  instance.columnFilters.forEach((filter) => {
    const select = document.getElementById(filter.selectId);
    if (select) {
      select.addEventListener("change", (e) => {
        const value = e.target.value;
        if (value !== "all") {
          // Initialize array if it doesn't exist
          if (!instance.activeFilters.columns[filter.columnIndex]) {
            instance.activeFilters.columns[filter.columnIndex] = [];
          }
          // Add value to array if not already present
          if (
            !instance.activeFilters.columns[filter.columnIndex].includes(value)
          ) {
            instance.activeFilters.columns[filter.columnIndex].push(value);
          }
          // Reset dropdown to "all" after adding filter
          e.target.value = "all";
          // Update dropdown options to hide selected values
          instance.updateDropdownOptions(filter.columnIndex);
        }
        instance.filterTable();
        instance.updateFilterPills();
      });
    }
  });

  // Clear all filters
  const clearAll = document.getElementById("clearAllFilters");
  if (clearAll) {
    clearAll.addEventListener("click", (e) => {
      e.preventDefault();
      instance.clearAllFilters();
    });
  }
}
