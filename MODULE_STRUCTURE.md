# Table Filter - Modular Structure

## Overview

The table filter component has been refactored into a modular architecture with separate CSS and JavaScript files organized by functionality.

## Project Structure

\\\
src/
├── styles/ # CSS Modules
│ ├── filter-container.css # Filter container styles
│ ├── search-input.css # Search input styles
│ ├── dropdown.css # Dropdown/select styles
│ ├── filter-pills.css # Filter pill/badge styles
│ ├── table.css # Table styling
│ ├── no-results.css # No results message
│ └── responsive.css # Media queries
├── components/ # JavaScript Modules  
│ ├── FilterMarkup.js # Filter UI markup generation
│ ├── ColumnFilters.js # Column filter dropdowns
│ ├── FilterLogic.js # Table filtering algorithm
│ ├── FilterPills.js # Filter pills rendering
│ └── [Additional modules] # See below
├── table-filter.css # Main CSS with @imports
├── table-filter.js # Main JS class (refactored)
└── index.js # Entry point

\\\

## CSS Modules (@import)

The main \ able-filter.css\ file imports all component stylesheets:

\\\css
@import './styles/filter-container.css';
@import './styles/search-input.css';
@import './styles/dropdown.css';
@import './styles/filter-pills.css';
@import './styles/table.css';
@import './styles/no-results.css';
@import './styles/responsive.css';
\\\

## JavaScript Modules (ES6 imports)

Each component is exported as a function or class and imported into the main TableFilter class.

### Completed Modules

1. **FilterMarkup.js** - Creates the filter UI container and markup
2. **ColumnFilters.js** - Generates dropdown filters from table columns
3. **FilterLogic.js** - Handles the table row filtering algorithm
4. **FilterPills.js** - Renders and manages filter pills

### Remaining Modules to Create

The following component modules still need to be created based on the original table-filter.js:

1. **EventListeners.js** - Attach all event handlers
2. **DropdownManager.js** - Manages dropdown options visibility
3. **FilterActions.js** - Clear filter actions
4. **NoResults.js** - No results message management

## Implementation Status

✅ **CSS Modularization**: Complete - All styles split into component files
✅ **CSS Main File**: Complete - Uses @import for all modules  
✅ **JS Core Modules**: Partial - 4 of 8 modules created
⏳ **JS Main File Refactor**: Pending - Needs to import and use modules
⏳ **Testing**: Pending - Verify modular build works

## Current Feature Set

The main table-filter.js currently includes:

### Core Features

- ✅ Text-based search filtering
- ✅ Column-based dropdown filters
- ✅ Sortable table columns (click headers)
- ✅ Pagination with configurable items per page
- ✅ Filter pills (visual display of active filters)
- ✅ URL-based filter sharing with search keyword support
- ✅ Copy filter link to clipboard functionality
- ✅ Auto-apply filters from URL query parameters
- ✅ Responsive design with mobile support

### Data Attributes Supported

- `data-table-filter` - Enable component
- `data-table-id` - Target table ID
- `data-search-placeholder` - Custom search placeholder
- `data-column-filters` - Semicolon-separated column names
- `data-pagination-items-per-page` - Rows per page
- `data-default-column` - Default sort column
- `data-order` - Default sort order (Ascending/Descending)

### URL Filter Sharing

- Query parameter: `?search=keyword` for search terms
- Query parameters: `?ColumnName=value` for column filters
- Example: `?search=walker&Year%20of%20finding=2024&Category=inquest%20findings`
- Auto-applies filters on page load
- Copy button generates and copies filter URL to clipboard
- Browser fallback for older clipboard APIs

## Next Steps

1. Create remaining JavaScript component modules
2. Refactor main table-filter.js to import and use all modules
3. Update webpack configuration if needed
4. Test the modular implementation
5. ~~Update documentation~~ ✅ Complete

## Benefits

- **Maintainability**: Each component is isolated and easier to update
- **Reusability**: Components can be imported individually
- **Clarity**: Clear separation of concerns
- **Testing**: Easier to unit test individual modules
- **Bundle Size**: Potential for tree-shaking unused components
