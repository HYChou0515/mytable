import React from 'react'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

// Objectives
// [V] 1. show data in data grid
// [ ] 2. filter at column header
// [ ] 3. combine multiple columns to one (as summary)
// [ ] 4. show image in a popover
// [ ] 5. score bar
// [ ] 6. group by columns
// [ ] 7. group by distribution
// [ ] 8. pagination
// [ ] 9. re-ranking (after filtering, click this to re-rank)

interface DataGridProps<ObjT> {
  data: ObjT[]
  columns: ColumnDef<ObjT>[]
}
function DataGrid<ObjT> (props: React.PropsWithChildren<DataGridProps<ObjT>>) {
  const data = props.data;
  const columns = props.columns;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
  return (
    <div className="p-2">
      <table>
        <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
              </th>
            ))}
          </tr>
        ))}
        </thead>
        <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
        </tbody>
        <tfoot>
        {table.getFooterGroups().map(footerGroup => (
          <tr key={footerGroup.id}>
            {footerGroup.headers.map(header => (
              <th key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                    header.column.columnDef.footer,
                    header.getContext()
                  )}
              </th>
            ))}
          </tr>
        ))}
        </tfoot>
      </table>
      <div className="h-4" />
    </div>
  )
}

export default DataGrid;
