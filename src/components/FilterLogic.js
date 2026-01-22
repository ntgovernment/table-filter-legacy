/**
 * FilterLogic Component
 * Handles table filtering logic
 */

export function filterTable(table, activeFilters) {
  const searchTerm = activeFilters.search.toLowerCase().trim();
  const tbody = table.querySelector("tbody");
  const rows = tbody
    ? tbody.querySelectorAll("tr")
    : table.querySelectorAll("tr");
  let visibleCount = 0;

  rows.forEach((row, index) => {
    if (!row.hasAttribute("data-original-index")) {
      row.setAttribute("data-original-index", index.toString());
    }

    if (!tbody && index === 0) {
      return;
    }

    let isVisible = true;

    if (searchTerm) {
      const text = row.textContent.toLowerCase();
      if (!text.includes(searchTerm)) {
        isVisible = false;
      }
    }

    if (isVisible) {
      for (const [columnIndex, filterValues] of Object.entries(
        activeFilters.columns,
      )) {
        const cells = row.querySelectorAll("td");
        const cell = cells[columnIndex];
        if (cell && filterValues.length > 0) {
          const cellText = cell.textContent.trim().toLowerCase();
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

  return visibleCount;
}
