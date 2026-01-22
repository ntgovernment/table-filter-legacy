# table-filter-legacy

Table filter for legacy agency sites

## Overview

A simple, accessible table filtering component for Squiz Matrix and legacy government agency websites. This component allows users to filter table rows by typing into a search input.

## Features

- Simple text-based filtering
- Auto-initialization via `data-table-filter` attribute
- Responsive design
- No dependencies
- UMD module format for maximum compatibility
- Compiled and ready to use

## Installation

### Using the distributed files

Include the compiled CSS and JS files in your HTML:

```html
<link rel="stylesheet" href="dist/table-filter.css">
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

### Automatic initialization

Add the `data-table-filter` attribute to any table:

```html
<table id="my-table" data-table-filter>
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

### Manual initialization

```javascript
// Initialize with default options
const filter = new TableFilter('#my-table');

// Initialize with custom options
const filter = new TableFilter('#my-table', {
  searchInputClass: 'custom-search-class',
  noResultsClass: 'custom-no-results-class'
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

## License

Apache-2.0

