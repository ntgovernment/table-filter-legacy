/**
 * ColumnFilters Component
 * Handles column filter dropdown generation
 */

export function generateColumnFilters(table, columnNames, columnFilters) {
  if (!columnNames.length) return;

  const filterControls = document.getElementById("filterControls");
  const thead = table.querySelector("thead");
  if (!thead) return;

  const headers = Array.from(thead.querySelectorAll("th"));

  columnNames.forEach((columnName, index) => {
    const columnIndex = headers.findIndex(
      (th) => th.textContent.trim().toLowerCase() === columnName.toLowerCase(),
    );

    if (columnIndex === -1) return;

    const values = getUniqueColumnValues(table, columnIndex);

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

    columnFilters.push({
      columnIndex,
      selectId,
      columnName,
    });
  });
}

export function getUniqueColumnValues(table, columnIndex) {
  const tbody = table.querySelector("tbody");
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

  return Array.from(values).sort((a, b) => {
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    return a.localeCompare(b);
  });
}
