/**
 * FilterPills Component
 * Handles filter pills rendering and management
 */

export function updateFilterPills(activeFilters, columnFilters) {
  const pillsContainer = document.getElementById('filterPills');
  const appliedFiltersSection = document.getElementById('applied-filters');

  if (!pillsContainer || !appliedFiltersSection) return;

  const pills = [];

  if (activeFilters.search) {
    pills.push(\
      <button type="button" class="filter-pill" tabindex="0" onclick="window.tableFilterInstance?.clearSearchFilter()" aria-label="Remove filter: \">
        <span class="filter-pill-label">\</span>
        <span class="filter-pill-close" aria-hidden="true">×</span>
      </button>
    \);
  }

  for (const [columnIndex, filterValues] of Object.entries(activeFilters.columns)) {
    const filter = columnFilters.find((f) => f.columnIndex == columnIndex);
    if (filter && Array.isArray(filterValues)) {
      filterValues.forEach((filterValue) => {
        pills.push(\
          <button type="button" class="filter-pill" tabindex="0" onclick="window.tableFilterInstance?.clearColumnFilter(\, '\')" aria-label="Remove filter: \">
            <span class="filter-pill-label">\</span>
            <span class="filter-pill-close" aria-hidden="true">×</span>
          </button>
        \);
      });
    }
  }

  if (pills.length > 0) {
    pillsContainer.innerHTML = pills.join('');
    appliedFiltersSection.classList.remove('hidden');
  } else {
    pillsContainer.innerHTML = '';
    appliedFiltersSection.classList.add('hidden');
  }
}
