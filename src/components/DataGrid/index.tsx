import React, { useContext } from "react";
import {
  Table,
  useReactTable,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  GroupingState,
  getGroupedRowModel,
  PaginationState,
  FilterFn,
  flexRender,
  Header,
  Row,
} from "@tanstack/react-table";
import * as _ from "lodash";
import { FaAngleDown, FaAngleRight } from "react-icons/fa";
import { rankItem } from "@tanstack/match-sorter-utils";
import { getTextWidth, getCanvasFont } from "../../utils/textWidth";
import "react-perfect-scrollbar/dist/css/styles.css";
import Filter, { modifyColumnsFilterFn, multipleFilter } from "./Filter";
import {
  DataGridProps,
  DivTableBodyCellProps,
  DivTableBodyRowProps,
  DivTableHeadCellFilterProps,
  DivTableHeaderCellProps,
  DivTableHeadProps,
} from "./types";
import { TableContext } from "./context";
import VirtualList from "./VirtualList";
import rankings from "../../utils/rankings";
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

function ColumnResizer<ObjT>(
  props: React.PropsWithChildren<{ header: Header<ObjT, unknown> }>
) {
  const { onAutoSizeColumn } = useContext(TableContext);
  const header = props.header;
  return (
    <div
      onDoubleClick={() => onAutoSizeColumn(header)}
      onMouseDown={header.getResizeHandler()}
      {...{
        className: "resizer",
      }}
    />
  );
}

function DivTable<ObjT>(
  props: React.PropsWithChildren<React.InputHTMLAttributes<HTMLDivElement>>
) {
  const children = props.children;
  return <div className={"table"}>{children}</div>;
}

function DivTableRow<ObjT>(
  props: React.PropsWithChildren<React.InputHTMLAttributes<HTMLDivElement>>
) {
  const children = props.children;
  return (
    <div {...props} className={`table-row ${props.className ?? ""}`}>
      {children}
    </div>
  );
}

function DivTableHeadCellFilter<ObjT>(
  props: React.PropsWithChildren<DivTableHeadCellFilterProps<ObjT>>
) {
  const header = props.header;
  const table = props.table;
  return (
    <div
      key={header.id}
      className={"table-head-cell"}
      style={{
        left: header.getStart(),
        width: header.getSize(),
      }}
    >
      {header.column.getCanFilter() ? (
        <Filter column={header.column} table={table} />
      ) : null}
    </div>
  );
}

function DivTableHead<ObjT>(
  props: React.PropsWithChildren<
    DivTableHeadProps<ObjT> & React.InputHTMLAttributes<HTMLDivElement>
  >
) {
  const table = props.table;
  const headerGroups = table.getHeaderGroups();
  const leafHeaderGroup = headerGroups[headerGroups.length - 1];
  const columnsHead = headerGroups.map((headerGroup) => (
    <DivTableRow<ObjT> key={headerGroup.id}>
      {headerGroup.headers.map((header) => (
        <DivTableHeadCell header={header} />
      ))}
    </DivTableRow>
  ));
  columnsHead.push(
    <DivTableRow<ObjT> key={`${leafHeaderGroup.id}-filter`}>
      {leafHeaderGroup.headers.map((header) => (
        <DivTableHeadCellFilter header={header} table={table} />
      ))}
    </DivTableRow>
  );
  return (
    <div {...props} className={"table-head"}>
      {columnsHead}
    </div>
  );
}

function DivTableHeadCell<ObjT>(
  props: React.PropsWithChildren<DivTableHeaderCellProps<ObjT>>
) {
  const header = props.header;
  return (
    <div
      key={header.id}
      className={"table-head-cell"}
      style={{
        justifyContent: "space-between",
        left: header.getStart(),
        width: header.getSize(),
      }}
    >
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}
      {header.column.getCanGroup() ? (
        <button
          onClick={header.column.getToggleGroupingHandler()}
          style={{
            cursor: "pointer",
          }}
          className={"icon-button"}
        >
          {header.column.getIsGrouped() ? (
            <img src="cross-group.svg" />
          ) : (
            <img src="group.svg" />
          )}
        </button>
      ) : null}
      <ColumnResizer<ObjT> header={header} />
    </div>
  );
}
function _DivTableBodyRow<ObjT>(
  props: React.PropsWithChildren<
    DivTableBodyRowProps<ObjT> & React.InputHTMLAttributes<HTMLDivElement>
  >
) {
  const row = props.row;
  return (
    <DivTableRow<ObjT> {...props}>
      {row.getVisibleCells().map((cell) => (
        <DivTableBodyCell cell={cell} />
      ))}
    </DivTableRow>
  );
}
const DivTableBodyRow = React.memo(_DivTableBodyRow) as typeof _DivTableBodyRow;

function DivTableBody<ObjT>(
  props: React.PropsWithChildren<{ table: Table<ObjT> }>
) {
  const table = props.table;
  const rowHeight = 28;
  return (
    <VirtualList<Row<ObjT>[]>
      itemData={table.getRowModel().rows}
      itemCount={table.getRowModel().rows.length}
      itemSize={rowHeight}
      height={Math.min(600, table.getRowModel().rows.length * rowHeight)}
      width={`calc(${table.getTotalSize()}px + 2*var(--border-width))`}
    >
      {({ data, index, style }) => {
        const row = data[index];
        return (
          <DivTableBodyRow<ObjT>
            key={row.id}
            style={style}
            className={`table-body ${
              index % 2 === 0 ? "even-child" : "odd-child"
            }`}
            row={row}
          />
        );
      }}
    </VirtualList>
  );
}
function DivTableBodyCell<ObjT>(
  props: React.PropsWithChildren<DivTableBodyCellProps<ObjT>>
) {
  const cell = props.cell;
  let cellContent = null;
  if (cell.getIsGrouped()) {
    cellContent = (
      <>
        <button
          onClick={cell.row.getToggleExpandedHandler()}
          className={"icon-button"}
          style={{
            cursor: cell.row.getCanExpand() ? "pointer" : "normal",
          }}
        >
          {cell.row.getIsExpanded() ? (
            <FaAngleDown className={"body-icon-button"} />
          ) : (
            <FaAngleRight className={"body-icon-button"} />
          )}
        </button>
        {flexRender(cell.column.columnDef.cell, cell.getContext())}(
        {cell.row.subRows.length})
      </>
    );
  } else if (cell.getIsAggregated()) {
    cellContent = flexRender(
      cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
      cell.getContext()
    );
  } else if (cell.getIsPlaceholder()) {
    cellContent = null;
  } else {
    cellContent = flexRender(cell.column.columnDef.cell, cell.getContext());
  }
  return (
    <div
      {...{
        key: cell.id,
        className: "table-body-cell",
        style: {
          position: "absolute",
          left: cell.column.getStart(),
          width: cell.column.getSize(),
        },
      }}
    >
      {cellContent}
    </div>
  );
}

function DataGrid<ObjT>(props: React.PropsWithChildren<DataGridProps<ObjT>>) {
  const [data, setData] = React.useState(props.data);
  const columns = props.columns.map(modifyColumnsFilterFn);
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
  const [internalIndex, setInternalIndex] = React.useState<
    (number | undefined)[]
  >(_.range(1, data.length + 1));
  if (props.indexing != null) {
    columns.unshift({
      accessorFn: (_, i) => internalIndex[i] ?? null,
      header: props.indexing.header,
      filterFn: multipleFilter,
      aggregationFn: props.indexing.aggregationFn,
      aggregatedCell: props.indexing.aggregatedCell,
    });
  }
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
    const columnSizing = table.getState().columnSizing;
    const resizeColumnOfKey = (columnKey: string) => {
      const textMinWidth: number = data
        .map((x: any) => {
          const v = x[columnKey];
          if (v != null) {
            return getTextWidth(String(v), getCanvasFont());
          } else {
            return 0;
          }
        })
        .reduce((pre, cur) => Math.max(pre, cur), 0);
      if (textMinWidth === 0) {
        return;
      }
      columnSizing[columnKey] = textMinWidth + 8;
    };
    header.column.getFlatColumns().forEach((c) => {
      if (c.columnDef != null) {
        const k = (c.columnDef as any).accessorKey;
        if (typeof k === "string") {
          resizeColumnOfKey(k);
        }
      }
    });
    table.setColumnSizing(columnSizing);
  };

  const [rankingMode, setRankingMode] = React.useState("score");
  const calRanking = (): (number | undefined)[] => {
    let ret: (number | undefined)[] = _.range(1, data.length + 1);
    if (rankingMode === "score") {
      const flatRows = table.getFilteredRowModel().flatRows;
      const ranks = rankings(flatRows, {
        sortBy: { desc: (x) => x.getValue("score") },
        method: "min",
      });
      ret = ret.map(() => undefined);
      for (const i of _.range(flatRows.length)) {
        ret[flatRows[i].index] = ranks[i];
      }
    }
    return ret;
  };

  return (
    <TableContext.Provider value={{ onAutoSizeColumn }}>
      <div>
        <button
          onClick={() => {
            setInternalIndex(calRanking());
            setData([...data]);
          }}
        >
          Re-rank
        </button>
        <div>
          <DivTable<ObjT>>
            <DivTableHead table={table} />
            <DivTableBody table={table} />
          </DivTable>
        </div>
        <pre>{JSON.stringify(table.getState(), null, 2)}</pre>
      </div>
    </TableContext.Provider>
  );
}

export default DataGrid;
