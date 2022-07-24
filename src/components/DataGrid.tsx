import React, {createContext, useContext} from "react";

import {
  Column,
  Table,
  useReactTable,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  sortingFns,
  getExpandedRowModel,
  getSortedRowModel,
  GroupingState,
  getGroupedRowModel,
  PaginationState,
  FilterFn,
  SortingFn,
  ColumnDef,
  flexRender,
  Header,
  HeaderGroup,
  Cell,
} from "@tanstack/react-table";
import {
  FaArrowUp,
  FaArrowDown,
  FaAngleDown,
  FaAngleRight,
} from "react-icons/fa";
import { VscListTree } from "react-icons/vsc";
import { GrClose } from "react-icons/gr";
import {
  RankingInfo,
  rankItem,
  compareItems,
} from "@tanstack/match-sorter-utils";
import {getTextWidth, getCanvasFont} from "../utils/textWidth";

// Objectives
// [V] 1. show data in data grid
// [V] 2. filter at column header
// [ ] 3. combine multiple columns to one (as summary)
// [ ] 4. show image in a popover
// [ ] 5. score bar
// [V] 6. group by columns
// [ ] 7. group by distribution
// [V] 8. pagination
// [ ] 9. re-ranking (after filtering, click this to re-rank)

const GroupIcon: React.FC = () => <VscListTree />;
const CloseIcon: React.FC = () => <GrClose />;

type TableContextProps = {
  onAutoSizeColumn: (header: Header<any, unknown>) => void;
}
const TableContext = createContext<TableContextProps>({
  onAutoSizeColumn: () => false,
});

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value);

  // Store the itemRank info
  addMeta({
    itemRank,
  });

  // Return if the item should be filtered in/out
  return itemRank.passed;
};

function Filter({
  column,
  table,
}: {
  column: Column<any, unknown>;
  table: Table<any>;
}) {
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id);

  const columnFilterValue = column.getFilterValue();

  const sortedUniqueValues = React.useMemo(
    () =>
      typeof firstValue === "number"
        ? []
        : Array.from(column.getFacetedUniqueValues().keys()).sort(),
    [column.getFacetedUniqueValues()]
  );

  return typeof firstValue === "number" ? (
    <div>
      <div className="flex space-x-2">
        <DebouncedInput
          type="number"
          min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
          max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
          value={(columnFilterValue as [number, number])?.[0] ?? ""}
          onChange={(value) =>
            column.setFilterValue((old: [number, number]) => [value, old?.[1]])
          }
          placeholder={`Min ${
            column.getFacetedMinMaxValues()?.[0]
              ? `(${column.getFacetedMinMaxValues()?.[0]})`
              : ""
          }`}
          className="w-24 border shadow rounded"
        />
        <DebouncedInput
          type="number"
          min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
          max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
          value={(columnFilterValue as [number, number])?.[1] ?? ""}
          onChange={(value) =>
            column.setFilterValue((old: [number, number]) => [old?.[0], value])
          }
          placeholder={`Max ${
            column.getFacetedMinMaxValues()?.[1]
              ? `(${column.getFacetedMinMaxValues()?.[1]})`
              : ""
          }`}
          className="w-24 border shadow rounded"
        />
      </div>
      <div className="h-1" />
    </div>
  ) : (
    <>
      <datalist id={column.id + "list"}>
        {sortedUniqueValues.slice(0, 5000).map((value: any) => (
          <option value={value} key={value} />
        ))}
      </datalist>
      <DebouncedInput
        type="text"
        value={(columnFilterValue ?? "") as string}
        onChange={(value) => column.setFilterValue(value)}
        placeholder={`Search... (${column.getFacetedUniqueValues().size})`}
        className="w-36 border shadow rounded"
        list={column.id + "list"}
      />
      <div className="h-1" />
    </>
  );
}

// A debounced input react component
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

function ColumnResizer<ObjT> (props: React.PropsWithChildren<{header: Header<ObjT, unknown>}>) {
    const {onAutoSizeColumn} = useContext(TableContext);
    const header = props.header;
  return (
      <div
        onDoubleClick={() => onAutoSizeColumn(header)}
        onMouseDown={header.getResizeHandler()}
        {...{
          className: `resizer ${
            header.column.getIsResizing() ? "isResizing" : ""
          }`,
        }}
      />
    );
}

type DivTableProps<ObjT> = {
  table: Table<ObjT>;
};
function DivTable<ObjT>(props: React.PropsWithChildren<DivTableProps<ObjT>>) {
  const table = props.table;
  const children = props.children;
  return (
    <div
      {...{
        className: "table",
        style: {
          width: table.getTotalSize(),
        },
      }}
    >
      {children}
    </div>
  );
}
function DivTableHead<ObjT>(props: React.PropsWithChildren) {
  const children = props.children;
  return <div className={"thead"}>{children}</div>;
}

type DivTableRowProps<ObjT> = {
  key: any;
};

function DivTableRow<ObjT>(
  props: React.PropsWithChildren<DivTableRowProps<ObjT>>
) {
  const children = props.children;
  const key = props.key;
  return (
    <div
      {...{
        key: key,
        className: "tr",
        style: {
          position: "relative",
        },
      }}
    >
      {children}
    </div>
  );
}

type DivTableHeaderCellProps<ObjT> = {
  header: Header<ObjT, unknown>;
};

function DivTableHeadCell<ObjT>(
  props: React.PropsWithChildren<DivTableHeaderCellProps<ObjT>>
) {
  const header = props.header;
  return (
    <div
      {...{
        key: header.id,
        className: "th",
        style: {
          position: "absolute",
          left: header.getStart(),
          width: header.getSize(),
        },
      }}
    >
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}
      <ColumnResizer<ObjT> header={header} />
    </div>
  );
}
function DivTableBody<ObjT>(props: React.PropsWithChildren) {
  const children = props.children;
  return <div className={"tbody"}>{children}</div>;
}
type DivTableBodyCellProps<ObjT> = {
  cell: Cell<ObjT, unknown>;
};
function DivTableBodyCell<ObjT>(
  props: React.PropsWithChildren<DivTableBodyCellProps<ObjT>>
) {
  const cell = props.cell;
  return (
    <div
      {...{
        key: cell.id,
        className: "td",
        style: {
          position: "absolute",
          left: cell.column.getStart(),
          width: cell.column.getSize(),
        },
      }}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </div>
  );
}

type DataGridProps<ObjT> = {
  data: ObjT[];
  columns: ColumnDef<ObjT>[];
  pageOptions?: number[] | "one-page";
};
function DataGrid<ObjT>(props: React.PropsWithChildren<DataGridProps<ObjT>>) {
  const data = props.data;
  const columns = props.columns;
  const pageOptions = props.pageOptions ?? [10, 20, 30, 40, 50];
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [grouping, setGrouping] = React.useState<GroupingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageOptions === "one-page" ? data.length : pageOptions[0],
  });
  const table = useReactTable<ObjT>({
    data,
    columns,
    columnResizeMode: "onChange",
    state: {
      columnFilters,
      globalFilter,
      grouping,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    onGroupingChange: setGrouping,
    onPaginationChange: setPagination,
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
  });

  const onAutoSizeColumn = (header: Header<ObjT, unknown>) => {
    const targetAccessorKey = (header.column.columnDef as any).accessorKey;
    if (targetAccessorKey == null) {
      return
    }
    const textMinWidth: number = data.map((x: any) => {
        const v = x[targetAccessorKey];
        if(v != null) {
          return getTextWidth(String(v), getCanvasFont());
        } else {
          return 0;
        }
      }).reduce((pre, cur) => Math.max(pre, cur), 0);
    if(textMinWidth === 0) {
      return
    }
    const columnSizing = table.getState().columnSizing;
    columnSizing[targetAccessorKey] = textMinWidth + 7
    table.setColumnSizing(columnSizing)
  }

  return (
    <TableContext.Provider value={{onAutoSizeColumn}}>
    <div>
      <div className="overflow-x-auto">
        <DivTable<ObjT> table={table}>
          <DivTableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <DivTableRow<ObjT> key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <DivTableHeadCell header={header} />
                ))}
              </DivTableRow>
            ))}
          </DivTableHead>
          <DivTableBody>
            {table.getRowModel().rows.map((row) => (
              <DivTableRow<ObjT> key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <DivTableBodyCell cell={cell} />
                ))}
              </DivTableRow>
            ))}
          </DivTableBody>
        </DivTable>
      </div>
      <pre>{JSON.stringify(table.getState(), null, 2)}</pre>
    </div>
    </TableContext.Provider>
  );
}

export default DataGrid;
