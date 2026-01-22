/**
 * Table Filter Component
 * A simple table filtering component for legacy agency sites
 */

class TableFilter {
  constructor(tableSelector, options = {}) {
    this.table = document.querySelector(tableSelector);
    this.options = {
      searchInputClass: options.searchInputClass || 'table-filter-search',
      noResultsClass: options.noResultsClass || 'table-filter-no-results',
      ...options
    };
    
    if (!this.table) {
      console.warn(`Table not found: ${tableSelector}`);
      return;
    }
    
    this.init();
  }
  
  init() {
    this.createSearchInput();
    this.attachEventListeners();
  }
  
  createSearchInput() {
    // Check if search input already exists
    const existingInput = document.querySelector(`.${this.options.searchInputClass}`);
    if (existingInput) {
      this.searchInput = existingInput;
      return;
    }
    
    // Create search input container
    const container = document.createElement('div');
    container.className = 'table-filter-container';
    
    // Create label
    const label = document.createElement('label');
    label.textContent = 'Filter table: ';
    label.htmlFor = 'table-filter-input';
    
    // Create input
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.id = 'table-filter-input';
    this.searchInput.className = this.options.searchInputClass;
    this.searchInput.placeholder = 'Type to filter...';
    
    container.appendChild(label);
    container.appendChild(this.searchInput);
    
    // Insert before table
    this.table.parentNode.insertBefore(container, this.table);
  }
  
  attachEventListeners() {
    this.searchInput.addEventListener('input', (e) => {
      this.filterTable(e.target.value);
    });
  }
  
  filterTable(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const tbody = this.table.querySelector('tbody');
    const rows = tbody ? tbody.querySelectorAll('tr') : this.table.querySelectorAll('tr');
    let visibleCount = 0;
    
    rows.forEach((row, index) => {
      // Skip header row if no tbody
      if (!tbody && index === 0) {
        return;
      }
      
      const text = row.textContent.toLowerCase();
      
      if (term === '' || text.includes(term)) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });
    
    this.updateNoResultsMessage(visibleCount === 0);
  }
  
  updateNoResultsMessage(show) {
    let message = document.querySelector(`.${this.options.noResultsClass}`);
    
    if (show && !message) {
      message = document.createElement('div');
      message.className = this.options.noResultsClass;
      message.textContent = 'No matching results found.';
      this.table.parentNode.insertBefore(message, this.table.nextSibling);
    } else if (!show && message) {
      message.remove();
    }
  }
}

// Auto-initialize on DOMContentLoaded if data-table-filter attribute is present
document.addEventListener('DOMContentLoaded', () => {
  const tables = document.querySelectorAll('[data-table-filter]');
  tables.forEach(table => {
    const selector = table.id ? `#${table.id}` : table;
    new TableFilter(selector);
  });
});

// Export for use as module
export default TableFilter;

// Also expose globally for legacy use
if (typeof window !== 'undefined') {
  window.TableFilter = TableFilter;
}
