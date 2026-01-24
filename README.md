# table-filter-legacy

Table filter for legacy agency sites

## Overview

A simple, accessible table filtering component for Squiz Matrix and legacy government agency websites. This component allows users to filter table rows by typing into a search input.

## Features

- **Advanced Multi-Word Search**: Flexible search with OR logic, AND keyword, and quoted exact phrases
- **Text Search**: Real-time search across all table columns
- **Column Filters**: Multi-select dropdown filters for specific columns
- **Sortable Columns**: Click column headers to sort ascending/descending
- **Pagination**: Configurable items per page with navigation controls
- **Filter Pills**: Visual display of active filters with individual removal
- **URL-Based Sharing**: Share filter states via URL query parameters (including search keywords)
- **Auto-initialization**: Automatic setup via `data-table-filter` attribute
- **Responsive Design**: Mobile-friendly interface
- **No Dependencies**: Pure vanilla JavaScript
- **UMD Module Format**: Works with AMD, CommonJS, and global scope
- **Compiled and Ready**: Pre-built files in `dist/` folder

### Performance Features

- **Table Caching**: All table data cached on page load for 80-90% faster filtering
- **Precomputed Column Values**: Filter dropdowns generated instantly from cached data
- **Date Column Support**: Automatic detection and sorting of date columns (checks for "date" in header)
- **Smart Sorting**: Intelligent numeric, date, and text sorting with automatic type detection
- **Optimized DOM Access**: Eliminates repeated DOM queries during user interactions

### Date Column Handling

The component automatically:

- Detects columns with "date" in the header text
- Extracts the first line of cell content (before `<br>` tags)
- Normalizes dates by replacing `&nbsp;` with spaces
- Converts dates to ISO format (yyyy-mm-dd) for accurate sorting
- Stores date values in `data-date` attributes
- Sorts dates chronologically regardless of display format

Supported date formats: dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd, and more.

### Multi-Word Search

The search functionality supports three powerful search modes:

#### 1. OR Logic (Default)

Space-separated words match rows containing ANY of the words:

- `fire water` → Finds rows with "fire" OR "water" (or both)
- `John Smith 2024` → Matches rows containing "John" OR "Smith" OR "2024"

#### 2. AND Keyword

Use case-insensitive `AND` to require multiple terms:

- `fire AND water` → Finds rows with BOTH "fire" AND "water"
- `urgent AND 2024` → Matches rows containing BOTH terms
- `John AND Smith AND urgent` → All three terms must be present

#### 3. Quoted Phrases

Quote text for exact phrase matching:

- `"John Smith"` → Exact match for "John Smith" (not "Smith, John")
- `"fire report"` → Finds exact phrase "fire report"
- `"urgent" AND fire` → Exact "urgent" phrase AND contains "fire"

#### Combined Examples

- `"Alice Springs" AND 2024` → Exact location phrase AND year
- `fire water AND urgent` → ("fire" OR "water") AND "urgent"
- `"exact phrase" term1 term2` → Exact phrase AND ("term1" OR "term2")

**Search Tips:**

- Searches are case-insensitive
- Multiple spaces are ignored
- Empty quotes are ignored
- Unmatched quotes are treated as literal characters

## Installation

### Using the distributed files

Include the compiled CSS and JS files in your HTML:

```html
<link rel="stylesheet" href="dist/table-filter.css" />
<script src="dist/table-filter.js"></script>
```

### Building from source

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Run development server with hot reload
npm run dev

# Watch mode for development
npm run watch
```

## Usage

### Basic Setup

Add the `data-table-filter` attribute to enable filtering:

```html
<!-- Minimal setup (search only) -->
<div data-table-filter data-table-id="my-table"></div>

<table id="my-table" class="table table-striped">
  <thead>
    <tr>
      <th>Name</th>
      <th>Department</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Doe</td>
      <td>IT</td>
      <td>john@example.gov</td>
    </tr>
    <!-- more rows -->
  </tbody>
</table>
```

### Advanced Configuration

Use data attributes to enable additional features:

```html
<div
  data-table-filter
  data-table-id="findings-table"
  data-search-placeholder="Search by name, location..."
  data-column-filters="Department; Location"
  data-pagination-items-per-page="25"
  data-default-column="Name"
  data-order="Ascending"
></div>

<table id="findings-table" class="table table-striped">
  <!-- table content -->
</table>
```

### Data Attributes Reference

| Attribute                        | Required | Description                                                         | Example                                |
| -------------------------------- | -------- | ------------------------------------------------------------------- | -------------------------------------- |
| `data-table-filter`              | Yes      | Enables the filter component                                        | `data-table-filter`                    |
| `data-table-id`                  | Yes      | ID of the table to filter                                           | `data-table-id="my-table"`             |
| `data-search-placeholder`        | No       | Placeholder text for search input                                   | `data-search-placeholder="Search..."`  |
| `data-column-filters`            | No       | Semicolon-separated list of column names to create dropdown filters | `data-column-filters="Year; Category"` |
| `data-pagination-items-per-page` | No       | Number of rows per page (enables pagination)                        | `data-pagination-items-per-page="10"`  |
| `data-default-column`            | No       | Column name to sort by default                                      | `data-default-column="Date"`           |
| `data-order`                     | No       | Default sort order: `Ascending` or `Descending`                     | `data-order="Descending"`              |

### URL-Based Filter Sharing

The component automatically generates shareable URLs that preserve filter state:

**Features:**

- Click "Copy filter link" button to copy current filter state to clipboard
- Share URLs with colleagues to display the same filtered view
- Supports search keywords and column filters in URL parameters
- Auto-applies filters when loading a page with filter parameters

**Example URLs:**

```
# Search only
https://example.com/findings?search=walker

# Column filter only
https://example.com/findings?Year%20of%20finding=2024

# Combined filters
https://example.com/findings?search=fire&Category=inquest%20findings&Year%20of%20finding=2023
```

**Query String Format:**

- `search` - Search keyword
- Column names as keys - Filter values (multiple values create multiple parameters)

### Manual Initialization

```javascript
// Initialize with default options
const filter = new TableFilter("#my-table");

// Initialize with custom options
const filter = new TableFilter("#my-table", {
  searchInputClass: "custom-search-class",
  noResultsClass: "custom-no-results-class",
});
```

## Development

Start the development server:

```bash
npm run dev
```

This will open your browser at `http://localhost:8080` with the demo page.

## Build Output

The build process generates:

- `dist/table-filter.js` - Minified JavaScript (UMD format)
- `dist/table-filter.css` - Compiled CSS
- `dist/index.html` - Demo page
- Source maps for both files

## Browser Support

Works in all modern browsers and IE11+.

**Note:** URL-based filter sharing uses modern APIs:

- `URLSearchParams` - Supported in all modern browsers and IE11 (with polyfill)
- `navigator.clipboard` - Falls back to `document.execCommand` for older browsers

## Component APIs

### Public Methods

```javascript
const tableFilter = new TableFilter("#my-table");

// Programmatically filter the table
tableFilter.filterTable();

// Clear all active filters
tableFilter.clearAllFilters();

// Sort by column index
tableFilter.sortTable(columnIndex);

// Generate shareable URL with current filters
const url = tableFilter.generateFilterURL();

// Copy filter URL to clipboard
tableFilter.copyFilterURL();
```

### Active Filter State

Access the current filter state:

```javascript
// Get active filters object
const filters = tableFilter.activeFilters;
// { search: "walker", columns: { 1: ["2024"], 3: ["inquest findings"] } }

// Get sort state
const sortState = tableFilter.sortState;
// { columnIndex: 2, direction: "asc" }
```

## License

Apache-2.0
