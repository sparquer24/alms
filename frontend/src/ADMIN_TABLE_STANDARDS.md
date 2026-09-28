# Admin & Super Admin Table Design Standards

## Overview
This document defines the unified design standards for all Admin and Super Admin tables to ensure a consistent, professional user experience across the entire application.

## Table Structure

### Standard Layout
```
PageSubHeader
  ├─ Title
  ├─ Meta Badge (count/info)
  └─ Actions (filters, search, buttons)

AdminTableContainer
  ├─ Title
  ├─ Description
  ├─ Subtitle (optional count/info)
  ├─ Table Content
  │   ├─ Sticky Header (with S.No column first)
  │   ├─ Table Rows
  │   ├─ Hover Effects
  │   └─ Empty/Loading States
  └─ Pagination Footer
      ├─ Items Count Display
      ├─ Page Navigation Buttons
      └─ Page Number Selection
```

## Component Classes

### Consistent Classes to Use

#### PageSubHeader
```tsx
<PageSubHeader
  title="Page Title"
  metaBadge={`${count} Items`}
  actions={
    <div className='flex items-center gap-2'>
      {/* Filters and search */}
      <select className='px-3 py-2 text-sm border border-gray-300 rounded-md...'>
      <SubHeaderSearch value={term} onChange={setTerm} />
      <SubHeaderButton variant='primary' icon={icon}>Action</SubHeaderButton>
    </div>
  }
/>
```

#### AdminTableContainer
```tsx
<AdminTableContainer
  title="Table Title"
  description="Description of table content"
  subtitle={`Showing ${count} items`}
>
  {/* Table content goes here */}
</AdminTableContainer>
```

#### Table Header
```html
<thead className='bg-gray-50 border-b border-gray-200 sticky top-0 z-10'>
  <tr>
    <!-- S.No Column (ALWAYS FIRST) -->
    <th className='px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-12'>
      S.No
    </th>
    <!-- Other Columns -->
    <th className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>
      Column Name
    </th>
  </tr>
</thead>
```

#### Table Rows
```html
<tbody className='divide-y divide-gray-200'>
  {rows.length > 0 ? (
    rows.map((row, index) => (
      <tr key={row.id} className='hover:bg-gray-50 transition-colors'>
        <!-- S.No Column (ALWAYS FIRST) -->
        <td className='px-6 py-4 text-center text-sm text-gray-600 font-medium'>
          {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
        </td>
        <!-- Data Columns -->
        <td className='px-6 py-4 text-sm text-gray-900'>Content</td>
        <td className='px-6 py-4 text-sm'>
          <span className='inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800'>
            Badge
          </span>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={numberOfColumns} className='px-6 py-12 text-center text-gray-500'>
        <p>No data found</p>
      </td>
    </tr>
  )}
</tbody>
```

## Color Palette for Status Badges

### Standard Status Colors
- **Active/Success**: `bg-green-100 text-green-800`
- **Inactive/Error**: `bg-red-100 text-red-800`
- **Pending/Warning**: `bg-yellow-100 text-yellow-800`
- **Default/Info**: `bg-blue-100 text-blue-800`
- **Neutral/Disabled**: `bg-gray-100 text-gray-800`

## Loading & Empty States

### Loading Spinner
```tsx
<div className='px-6 py-8 text-center text-gray-500'>
  <div className='flex justify-center mb-3'>
    <div className='animate-spin h-5 w-5 border-2 border-gray-300 border-t-[#001F54] rounded-full'></div>
  </div>
  <p>Loading...</p>
</div>
```

### Empty State
```tsx
<div className='px-6 py-12 text-center'>
  <p className='text-gray-500 mb-2'>No data found</p>
  <p className='text-sm text-gray-400'>Try adjusting your filters</p>
</div>
```

## Pagination Standards

### Pagination Configuration
```tsx
const ITEMS_PER_PAGE = 10; // Standard page size

const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
const paginatedItems = filteredItems.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);

<AdminTableContainer
  pagination={{
    currentPage,
    totalPages,
    totalItems: filteredItems.length,
    itemsPerPage: ITEMS_PER_PAGE,
    onPageChange: handlePageChange,
  }}
>
  {/* Table content */}
</AdminTableContainer>
```

### Pagination Features
- **Items per Page**: Always use 10 items per page
- **Previous/Next Buttons**: Navigate between pages
- **Page Number Display**: Shows current page and total pages
- **Page Selector**: Quick navigation to specific pages
- **Items Counter**: Shows "Showing X to Y of Z items"

### S.No Column Calculation
```tsx
<td className='px-6 py-4 text-center text-sm text-gray-600 font-medium'>
  {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
</td>
```

## Spacing Standards

- **Page Padding**: `p-4 sm:p-6 lg:p-8`
- **Table Cell Padding**: `px-6 py-4` (data rows), `px-6 py-3` (headers)
- **Gap Between Sections**: `gap-6`
- **Container Max Width**: `max-w-7xl`

## Typography Standards

### Table Headers
- Font Size: `text-xs`
- Font Weight: `font-semibold`
- Color: `text-gray-600`
- Uppercase: `uppercase tracking-wider`

### Table Cells
- Font Size: `text-sm`
- Color (data): `text-gray-900`
- Color (secondary): `text-gray-500`

## Interactivity

### Row Hover
```html
<tr className='hover:bg-gray-50 transition-colors'>
```

### Action Buttons
```html
<button className='text-[#001F54] hover:text-[#0A1C33] transition-colors'>
  Action Label
</button>
```

### Selection/Toggle
```html
<button className='relative inline-flex h-6 w-11 items-center rounded-full 
  transition-colors ${isEnabled ? 'bg-blue-600' : 'bg-gray-300'}'>
  <span className={`inline-block h-4 w-4 transform rounded-full bg-white 
    transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`}/>
</button>
```

## Responsive Behavior

- **Mobile**: Single column or stacked layout
- **Tablet**: Horizontal scroll for overflow
- **Desktop**: Full table display with max-width container

## Search & Filter Pattern

```tsx
<div className='flex items-center gap-2'>
  {/* Status/Type Filter */}
  <select className='px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#001F54]'>
    <option value='all'>All Items</option>
    <option value='active'>Active</option>
  </select>
  
  {/* Search Input */}
  <SubHeaderSearch 
    value={searchTerm} 
    onChange={setSearchTerm} 
    placeholder='Search...' 
  />
  
  {/* Action Button */}
  <SubHeaderButton variant='primary' icon={<Icon />}>
    Action
  </SubHeaderButton>
</div>
```

## Pages Affected

### Admin Pages
- ✅ User Management (`/admin/userManagement`)
- ✅ Role Management (`/admin/roleMapping`)
- ✅ Permissions (`/admin/permissions`)
- ✅ Flow Mapping (`/admin/flowMapping`)
- ✅ Locations Management (`/admin/locationsManagement`)
- ✅ Action Mapping (`/admin/actionMapping`)
- ✅ License Management (`/admin/licenseManagement`)

### Super Admin Pages
- ✅ User Management (`/superAdmin/userManagement`)
- ✅ Role Management (`/superAdmin/roleMapping`)
- ✅ Flow Mapping (`/superAdmin/flowMapping`)
- ✅ Locations Management (`/superAdmin/locationsManagement`)
- ✅ Action Mapping (`/superAdmin/actionMapping`)
- ✅ License Management (`/superAdmin/licenseManagement`)

## Implementation Checklist

When standardizing a table, ensure:

- [ ] Uses `PageSubHeader` for title and actions
- [ ] Uses `AdminTableContainer` for table wrapper
- [ ] **S.No Column** - First column, centered, width w-12
- [ ] Has sticky table header with `sticky top-0 z-10`
- [ ] Has proper column header styling (uppercase, semibold, gray-600)
- [ ] Rows have hover effect (`hover:bg-gray-50 transition-colors`)
- [ ] Uses consistent badge colors for status
- [ ] Has proper empty state message with colSpan
- [ ] Has loading spinner with consistent styling
- [ ] Maintains consistent spacing (px-6 py-4)
- [ ] **Pagination enabled** with AdminTableContainer pagination prop
- [ ] ITEMS_PER_PAGE constant set to 10
- [ ] Page calculation correct: `(currentPage - 1) * ITEMS_PER_PAGE + index + 1`
- [ ] Responsive on mobile devices
- [ ] Search and filter at top in header
- [ ] Page uses `max-w-7xl` container

## Common Patterns

### Status Badge Rendering
```tsx
<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
  status === 'Active' ? 'bg-green-100 text-green-800' :
  status === 'Inactive' ? 'bg-red-100 text-red-800' :
  'bg-gray-100 text-gray-800'
}`}>
  {status}
</span>
```

### Action Column
```tsx
<td className='px-6 py-4 text-sm font-medium'>
  <button onClick={() => handle(row)} className='text-[#001F54] hover:text-[#0A1C33] mr-3 transition-colors'>
    View
  </button>
  <button onClick={() => edit(row)} className='text-blue-600 hover:text-blue-900 mr-3 transition-colors'>
    Edit
  </button>
  <button onClick={() => delete(row)} className='text-red-600 hover:text-red-900 transition-colors'>
    Delete
  </button>
</td>
```

## Required Features (Completed)

- ✅ Pagination component with page navigation
- ✅ S.No (Serial Number) column
- ✅ Items per page limiter
- ✅ Page display counter

## Future Enhancements

- Column sorting indicators
- Bulk actions toolbar
- Inline editing
- Advanced filtering UI
- Column visibility toggle
- Export/Import functionality
- Row selection checkboxes
