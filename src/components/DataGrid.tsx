import React, { Fragment, createContext, useContext, useState } from "react";

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
import { Popover, Tab, Listbox } from "@headlessui/react";
import { usePopper } from "react-popper";
import {
  FaArrowUp,
  FaArrowDown,
  FaAngleDown,
  FaAngleRight,
  FaCheck,
} from "react-icons/fa";
import {
  BiCheckboxChecked,
  BiCheckbox,
  BiCheckboxSquare,
} from "react-icons/bi";
import { VscListTree } from "react-icons/vsc";
import { GrClose } from "react-icons/gr";
import { HiOutlineFilter } from "react-icons/hi";
import {
  RankingInfo,
  rankItem,
  compareItems,
} from "@tanstack/match-sorter-utils";
import { getTextWidth, getCanvasFont } from "../utils/textWidth";

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
};
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

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [filterType, setFilterType] = useState(typeof firstValue);
  const [textValue, setTextValue] = useState<string>("");

  const sortedUniqueValues = React.useMemo(
    () =>
      Array.from(column.getFacetedUniqueValues().keys())
        .sort()
        .filter((s) => typeof s === "number" || typeof s === "string")
        .map(String),
    [column.getFacetedUniqueValues()]
  );
  let columnFilterValue = column.getFilterValue() as MultipleFilterValue;
  if (columnFilterValue == null) {
    columnFilterValue = {
      activated: "selection",
      filterValues: {
        numericBetween: [null, null],
        selection: sortedUniqueValues,
        textContains: "",
      },
    } as MultipleFilterValue;
  }

  const [referenceElement, setReferenceElement] = useState<Element | null>(
    null
  );
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const [arrowElement, setArrowElement] = useState<HTMLElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    modifiers: [
      { name: "offset", options: { offset: [0, 10] } },
      { name: "arrow", options: { element: arrowElement } },
    ],
  });
  const checkedState =
    columnFilterValue.filterValues.selection.length === 0
      ? "empty"
      : columnFilterValue.filterValues.selection.length ===
        sortedUniqueValues.length
      ? "full"
      : "intermediate";

  return (
    <div>
      <Popover>
        <Popover.Button className={"icon-button"} ref={setReferenceElement}>
          <HiOutlineFilter className={"body-icon-button"} />
        </Popover.Button>
        <Popover.Panel
          {...attributes.popper}
          ref={setPopperElement}
          style={{ ...styles.popper, width: 200 }}
          className={"popover-panel"}
        >
          <div
            className={"popover-arrow"}
            ref={setArrowElement}
            style={styles.arrow}
          />
          <Tab.Group>
            <Tab.List>
              <Tab>Select</Tab>
              <Tab>Number</Tab>
              <Tab>Text</Tab>
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel>
                <Listbox
                  multiple
                  value={columnFilterValue.filterValues.selection}
                  onChange={(s) => {
                    column.setFilterValue({
                      ...columnFilterValue,
                      activated: "selection",
                      filterValues: {
                        ...columnFilterValue.filterValues,
                        selection: s,
                      },
                    } as MultipleFilterValue);
                  }}
                >
                  <Listbox.Button as={Fragment}>
                    <div className="selection-list-button">
                      {columnFilterValue.filterValues.selection.length === 0
                        ? "(empty)"
                        : columnFilterValue.filterValues.selection.length === 1
                        ? columnFilterValue.filterValues.selection[0]
                        : `(${
                            columnFilterValue.filterValues.selection.length
                          }) ${columnFilterValue.filterValues.selection.join(
                            ", "
                          )}`}
                    </div>
                  </Listbox.Button>
                  <Listbox.Options static className="selection-list">
                    <li
                      key={`selection-list-item`}
                      className={`selection-list-item ${
                        columnFilterValue.filterValues.selection.length ===
                          sortedUniqueValues.length && "selected"
                      }`}
                      onClick={() => {
                        if (checkedState === "full") {
                          column.setFilterValue({
                            ...columnFilterValue,
                            activated: "selection",
                            filterValues: {
                              ...columnFilterValue.filterValues,
                              selection: [],
                            },
                          } as MultipleFilterValue);
                        } else {
                          column.setFilterValue({
                            ...columnFilterValue,
                            activated: "selection",
                            filterValues: {
                              ...columnFilterValue.filterValues,
                              selection: sortedUniqueValues,
                            },
                          } as MultipleFilterValue);
                        }
                      }}
                    >
                      {checkedState === "empty" ? (
                        <BiCheckbox className={"selection-item-icon"} />
                      ) : checkedState === "full" ? (
                        <BiCheckboxChecked className={"selection-item-icon"} />
                      ) : (
                        <BiCheckboxSquare className={"selection-item-icon"} />
                      )}
                      <span>(Select All)</span>
                    </li>
                    {sortedUniqueValues.map((v, i) => (
                      <Listbox.Option key={v} value={v} as={Fragment}>
                        {({ active, selected }) => (
                          <li
                            key={`selection-list-item-${i}-${v}`}
                            className={`selection-list-item ${
                              selected && "selected"
                            }`}
                          >
                            {selected ? (
                              <BiCheckboxChecked
                                className={"selection-item-icon"}
                              />
                            ) : (
                              <BiCheckbox className={"selection-item-icon"} />
                            )}
                            <span>{v}</span>
                          </li>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Listbox>
              </Tab.Panel>
              <Tab.Panel>
                <DebouncedInput
                  type="number"
                  min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
                  max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
                  value={columnFilterValue.filterValues.numericBetween[0] ?? ""}
                  onChange={(e) =>
                    column.setFilterValue({
                      ...columnFilterValue,
                      activated: "numericBetween",
                      filterValues: {
                        ...columnFilterValue.filterValues,
                        numericBetween: [
                          e === "" ? null : Number(e),
                          columnFilterValue.filterValues.numericBetween[1],
                        ],
                      },
                    } as MultipleFilterValue)
                  }
                  style={{ width: "100%" }}
                />
                <DebouncedInput
                  type="number"
                  min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
                  max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
                  value={columnFilterValue.filterValues.numericBetween[1] ?? ""}
                  onChange={(e) =>
                    column.setFilterValue({
                      ...columnFilterValue,
                      activated: "numericBetween",
                      filterValues: {
                        ...columnFilterValue.filterValues,
                        numericBetween: [
                          columnFilterValue.filterValues.numericBetween[0],
                          e === "" ? null : Number(e),
                        ],
                      },
                    })
                  }
                  style={{ width: "100%" }}
                />
              </Tab.Panel>
              <Tab.Panel></Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </Popover.Panel>
      </Popover>
    </div>
  );
}

function Filter2({
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
        className: "table-row",
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

type DivTableHeadCellFilterProps<ObjT> = {
  header: Header<ObjT, unknown>;
  table: Table<ObjT>;
};
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
        justifyContent: "space-between",
        left: header.getStart(),
        width: header.getSize(),
      }}
    >
      {header.column.getCanFilter() ? (
        <div>
          <Filter column={header.column} table={table} />
        </div>
      ) : null}
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

type DataGridProps<ObjT> = {
  data: ObjT[];
  columns: ColumnDef<ObjT>[];
  pageOptions?: number[] | "one-page";
};

type MultipleFilterFunctions = {
  numericBetween: [number | null, number | null];
  selection: string[];
  textContains: string;
};

type MultipleFilterValue = {
  activated: keyof MultipleFilterFunctions;
  filterValues: MultipleFilterFunctions;
};

const multipleFilter: FilterFn<any> = (
  row,
  columnId,
  value: MultipleFilterValue,
  addMeta
) => {
  if (value.activated === "numericBetween") {
    const filterValue = value.filterValues[value.activated];
    const [min, max] = filterValue;
    const rowValue = row.getValue(columnId) as number;
    if (min != null && min > rowValue) return false;
    if (max != null && max < rowValue) return false;
    return true;
  }
  if (value.activated === "selection") {
    const filterValue = value.filterValues[value.activated];
    let rowValue = row.getValue(columnId);
    if (typeof rowValue === "number") {
      rowValue = String(rowValue);
    } else if (typeof rowValue !== "string") {
      return false;
    }
    return filterValue.includes(rowValue as string);
  }
  return true;
};

function modifyColumnsFilterFn<ObjT>(column: ColumnDef<ObjT>) {
  const childColumns = column.columns ?? [];
  if ((childColumns ?? []).length > 0) {
    column.columns = childColumns.map(modifyColumnsFilterFn);
  }
  if ((column as any).accessorKey) {
    column.filterFn = multipleFilter;
  }
  return column;
}

function DataGrid<ObjT>(props: React.PropsWithChildren<DataGridProps<ObjT>>) {
  const data = props.data;
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
    const allChildColumns: string[] = [];
    const recursiveFindColumns = (column: Column<ObjT, unknown>) => {
      if (column.columnDef != null) {
        const k = (column.columnDef as any).accessorKey;
        if (typeof k === "string") {
          allChildColumns.push(k);
        }
      }
      if (column.columns != null) {
        column.columns.forEach(recursiveFindColumns);
      }
    };
    recursiveFindColumns(header.column);
    allChildColumns.forEach(resizeColumnOfKey);
    table.setColumnSizing(columnSizing);
  };

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

  const [referenceElement, setReferenceElement] = useState<Element | null>(
    null
  );
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement);
  return (
    <TableContext.Provider value={{ onAutoSizeColumn }}>
      <div>
        <div>
          <DivTable<ObjT> table={table}>
            <DivTableHead>{columnsHead}</DivTableHead>
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
