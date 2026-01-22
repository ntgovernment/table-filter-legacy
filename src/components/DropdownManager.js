/**
 * DropdownManager Component
 * Manages dropdown options visibility based on selected filters
 */

export function updateDropdownOptions(
  columnIndex,
  activeFilters,
  columnFilters,
) {
  const filter = columnFilters.find((f) => f.columnIndex == columnIndex);
  if (!filter) return;

  const select = document.getElementById(filter.selectId);
  if (!select) return;

  const selectedValues = activeFilters.columns[columnIndex] || [];

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
