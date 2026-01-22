/**
 * FilterActions Component
 * Handles filter clearing actions
 */

export function clearSearchFilter(instance) {
  instance.searchInput.value = "";
  instance.activeFilters.search = "";
  instance.filterTable();
  instance.updateClearButton();
  instance.updateFilterPills();
}

export function clearColumnFilter(instance, columnIndex, filterValue = null) {
  if (filterValue === null) {
    // Clear all filters for this column
    delete instance.activeFilters.columns[columnIndex];
  } else {
    // Remove specific filter value from the array
    const filters = instance.activeFilters.columns[columnIndex];
    if (filters) {
      const index = filters.indexOf(filterValue);
      if (index > -1) {
        filters.splice(index, 1);
      }
      // If array is empty, delete the column entry
      if (filters.length === 0) {
        delete instance.activeFilters.columns[columnIndex];
      }
    }
  }

  // Update dropdown options to show removed values
  instance.updateDropdownOptions(columnIndex);

  instance.filterTable();
  instance.updateFilterPills();
}

export function clearAllFilters(instance) {
  // Clear search
  instance.searchInput.value = "";
  instance.activeFilters.search = "";

  // Clear column filters
  instance.activeFilters.columns = {};
  instance.columnFilters.forEach((filter) => {
    const select = document.getElementById(filter.selectId);
    if (select) {
      select.value = "all";
      // Show all options again
      Array.from(select.options).forEach((option) => {
        option.style.display = "";
      });
    }
  });

  instance.filterTable();
  instance.updateClearButton();
  instance.updateFilterPills();
}

export function updateClearButton(searchInput) {
  const clearInput = document.getElementById("clearInput");
  if (clearInput) {
    if (searchInput.value) {
      clearInput.removeAttribute("hidden");
    } else {
      clearInput.setAttribute("hidden", "");
    }
  }
}
