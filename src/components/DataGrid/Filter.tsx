import { Column, ColumnDef, FilterFn, Table } from "@tanstack/react-table";
import React, { Fragment, useState } from "react";
import { sort } from "fast-sort";
import { usePopper } from "react-popper";
import { Listbox, Popover, Tab, RadioGroup } from "@headlessui/react";
import { HiOutlineFilter } from "react-icons/hi";
import {
  BiCheckbox,
  BiCheckboxChecked,
  BiCheckboxSquare,
  BiRadioCircle,
  BiRadioCircleMarked,
} from "react-icons/bi";
import { rankItem } from "@tanstack/match-sorter-utils";

import {
  MultipleFilterFunctions,
  MultipleFilterValue,
  TextualFilterMatchModes,
} from "./types";
import VirtualList from "./VirtualList";
import escapeStringRegexp from "escape-string-regexp";

export const multipleFilter: FilterFn<any> = (
  row,
  columnId,
  value: MultipleFilterValue,
  addMeta
) => {
  if (value.activated === "numericFilter") {
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
    return filterValue[rowValue as string] === "selected";
  }
  if (value.activated === "textualFilter") {
    const {
      search: _search,
      matchMode,
      matchCase,
    } = value.filterValues[value.activated];
    let rowValue: any = row.getValue(columnId);
    if (typeof rowValue === "number") {
      rowValue = String(rowValue);
    } else if (typeof rowValue !== "string") {
      return false;
    }
    if (_search.length === 0) {
      return true;
    }
    let text = rowValue;
    let search = _search;
    if (!matchCase) {
      text = text.toUpperCase();
      search = search.toUpperCase();
    }
    if (matchMode === "normal") {
      return text.includes(search);
    }
    if (matchMode === "wildcard") {
      search = escapeStringRegexp(search);
      return new RegExp(
        search.replace(/\\\*/g, ".*").replace(/\\\?/g, ".")
      ).test(text);
    }
    if (matchMode === "regex") {
      return new RegExp(search).test(text);
    }
  }
  return true;
};

export function modifyColumnsFilterFn<ObjT>(column: ColumnDef<ObjT>) {
  const childColumns = column.columns ?? [];
  if ((childColumns ?? []).length > 0) {
    column.columns = childColumns.map(modifyColumnsFilterFn);
  }
  if ((column as any).accessorKey) {
    column.filterFn = multipleFilter;
  }
  return column;
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

const SelectionPanel = ({
  column,
  allValues,
  columnFilterValue,
  sortedUniqueValues,
  selected,
  checkedState,
}: {
  column: Column<any, unknown>;
  allValues: string[];
  columnFilterValue: MultipleFilterValue;
  sortedUniqueValues: string[];
  selected: string[];
  checkedState: "empty" | "full" | "intermediate";
}) => {
  const rowHeight = 24;
  const shownAndSelected = sortedUniqueValues.filter((s) =>
    selected.includes(s)
  );
  const [optionFilterValue, setOptionalFilterValue] = useState("");
  const optionsFiltered = sortedUniqueValues.filter(
    (v) => rankItem(v, optionFilterValue).passed
  );

  return (
    <Listbox
      multiple
      value={shownAndSelected}
      onChange={(s) => {
        column.setFilterValue({
          ...columnFilterValue,
          activated: "selection",
          filterValues: {
            ...columnFilterValue.filterValues,
            selection: {
              ...columnFilterValue.filterValues.selection,
              ...sortedUniqueValues.reduce(
                (pre, cur) => ({
                  ...pre,
                  [cur]: s.includes(cur) ? "selected" : "unselected",
                }),
                {}
              ),
            },
          },
        } as MultipleFilterValue);
      }}
    >
      <DebouncedInput
        value={optionFilterValue}
        type={"text"}
        placeholder={"search..."}
        onChange={(value) => setOptionalFilterValue(String(value))}
      />
      <Listbox.Options static className="selection-list">
        <VirtualList<string[]>
          itemData={optionsFiltered}
          itemCount={optionsFiltered.length + 1}
          itemSize={rowHeight}
          height={rowHeight * 7}
          width={"100%"}
        >
          {({ data, index, style }) => {
            if (index === 0) {
              return (
                <li
                  key={`selection-list-item`}
                  className={`selection-list-item ${
                    checkedState === "full" && "selected"
                  }`}
                  onClick={() => {
                    if (checkedState === "full") {
                      column.setFilterValue({
                        ...columnFilterValue,
                        activated: "selection",
                        filterValues: {
                          ...columnFilterValue.filterValues,
                          selection: {
                            ...columnFilterValue.filterValues.selection,
                            ...sortedUniqueValues.reduce(
                              (pre, cur) => ({ ...pre, [cur]: "unselected" }),
                              {}
                            ),
                          },
                        },
                      } as MultipleFilterValue);
                    } else {
                      column.setFilterValue({
                        ...columnFilterValue,
                        activated: "selection",
                        filterValues: {
                          ...columnFilterValue.filterValues,
                          selection: {
                            ...columnFilterValue.filterValues.selection,
                            ...allValues.reduce(
                              (pre, cur) => ({ ...pre, [cur]: "selected" }),
                              {}
                            ),
                          },
                        },
                      } as MultipleFilterValue);
                    }
                  }}
                >
                  {checkedState === "empty" ? (
                    <BiCheckbox className={"list-checked-icon"} />
                  ) : checkedState === "full" ? (
                    <BiCheckboxChecked className={"list-checked-icon"} />
                  ) : (
                    <BiCheckboxSquare className={"list-checked-icon"} />
                  )}
                  <span>(Select All)</span>
                </li>
              );
            }
            const v = data[index - 1];
            return (
              <Listbox.Option key={v} value={v} as={Fragment}>
                {({ active, selected }) => (
                  <li
                    key={`selection-list-item-${index}-${v}`}
                    className={`selection-list-item ${selected && "selected"}`}
                    style={style}
                  >
                    {selected ? (
                      <BiCheckboxChecked className={"list-checked-icon"} />
                    ) : (
                      <BiCheckbox className={"list-checked-icon"} />
                    )}
                    <span>{v}</span>
                  </li>
                )}
              </Listbox.Option>
            );
          }}
        </VirtualList>
      </Listbox.Options>
    </Listbox>
  );
};

const getSelectionPanel = ({
  column,
  table,
  allValues,
  columnFilterValue,
  sortedUniqueValues,
}: {
  column: Column<any, unknown>;
  table: Table<any>;
  allValues: string[];
  columnFilterValue: MultipleFilterValue;
  sortedUniqueValues: string[];
}) => {
  const selected = Object.entries(columnFilterValue.filterValues.selection)
    .filter(([k, v]) => v === "selected")
    .map(([k, v]) => k);
  const checkedState =
    selected.length === 0
      ? "empty"
      : selected.length === allValues.length
      ? "full"
      : "intermediate";
  const title = (
    <div
      className="selection-list-button"
      style={{
        display: "block",
        flex: "auto",
        flexGrow: 1,
        textAlign: "left",
      }}
    >
      {checkedState === "full"
        ? "(all)"
        : checkedState === "empty"
        ? "(empty)"
        : selected.length === 1
        ? selected[0]
        : `(${selected.length}) ${selected.join(", ")}`}
    </div>
  );
  return [
    title,
    <SelectionPanel
      {...{
        column,
        allValues,
        columnFilterValue,
        sortedUniqueValues,
        selected,
        checkedState,
      }}
    />,
  ];
};

const getNumericFilterPanel = ({
  column,
  columnFilterValue,
}: {
  column: Column<any, unknown>;
  columnFilterValue: MultipleFilterValue;
}) => {
  const [minValue, maxValue] = columnFilterValue.filterValues.numericFilter;
  const facetMin = Number(column.getFacetedMinMaxValues()?.[0] ?? "");
  const facetMax = Number(column.getFacetedMinMaxValues()?.[1] ?? "");
  const title = (
    <div
      className="selection-list-button"
      style={{
        display: "block",
        flex: "auto",
        flexGrow: 1,
        textAlign: "left",
      }}
    >
      {minValue == null && maxValue == null
        ? "(all)"
        : minValue == null
        ? `≤ ${maxValue}`
        : maxValue == null
        ? `≥ ${minValue}`
        : `${minValue} ~ ${maxValue}`}
    </div>
  );
  const panel = (
    <div style={{ width: "100%" }}>
      <DebouncedInput
        type="number"
        min={facetMin}
        max={facetMax}
        value={minValue ?? ""}
        onChange={(e) =>
          column.setFilterValue({
            ...columnFilterValue,
            activated: "numericFilter",
            filterValues: {
              ...columnFilterValue.filterValues,
              numericFilter: [e === "" ? null : Number(e), maxValue],
            },
          } as MultipleFilterValue)
        }
        style={{ width: "100%" }}
      />
      <DebouncedInput
        type="number"
        min={facetMin}
        max={facetMax}
        value={maxValue ?? ""}
        onChange={(e) =>
          column.setFilterValue({
            ...columnFilterValue,
            activated: "numericFilter",
            filterValues: {
              ...columnFilterValue.filterValues,
              numericFilter: [minValue, e === "" ? null : Number(e)],
            },
          })
        }
        style={{ width: "100%" }}
      />
    </div>
  );
  return [title, panel];
};

const TextualFilterPanel = ({
  column,
  columnFilterValue,
}: {
  column: Column<any, unknown>;
  columnFilterValue: MultipleFilterValue;
}) => {
  const textualFilter = columnFilterValue.filterValues.textualFilter;
  const { search, matchMode, matchCase } = textualFilter;
  const setMatchMode = (s: TextualFilterMatchModes) => {
    column.setFilterValue({
      ...columnFilterValue,
      activated: "textualFilter",
      filterValues: {
        ...columnFilterValue.filterValues,
        textualFilter: {
          ...columnFilterValue.filterValues.textualFilter,
          matchMode: s,
        },
      },
    } as MultipleFilterValue);
  };
  const toggleMatchCase = () => {
    column.setFilterValue({
      ...columnFilterValue,
      activated: "textualFilter",
      filterValues: {
        ...columnFilterValue.filterValues,
        textualFilter: {
          ...columnFilterValue.filterValues.textualFilter,
          matchCase: !matchCase,
        },
      },
    } as MultipleFilterValue);
  };
  return (
    <div>
      <DebouncedInput
        type="text"
        value={search}
        onChange={(e) =>
          column.setFilterValue({
            ...columnFilterValue,
            activated: "textualFilter",
            filterValues: {
              ...columnFilterValue.filterValues,
              textualFilter: {
                ...textualFilter,
                search: String(e),
              },
            },
          })
        }
        placeholder={`search...`}
      />
      <div className="textual-filter-option" onClick={toggleMatchCase}>
        {matchCase ? (
          <BiCheckboxChecked className={"list-checked-icon"} />
        ) : (
          <BiCheckbox className={"list-checked-icon"} />
        )}
        <span className={`${matchCase && "selected"}`}>Match Case</span>
      </div>
      <RadioGroup value={matchMode} onChange={setMatchMode}>
        <RadioGroup.Label className={"textual-filter-option-title"}>
          Search Mode
        </RadioGroup.Label>
        <RadioGroup.Option value="normal" className="textual-filter-option">
          {({ checked }) => (
            <>
              {checked ? (
                <BiRadioCircleMarked className={"list-checked-icon"} />
              ) : (
                <BiRadioCircle className={"list-checked-icon"} />
              )}
              <span className={`${checked && "selected"}`}>normal</span>
            </>
          )}
        </RadioGroup.Option>
        <RadioGroup.Option value="wildcard" className="textual-filter-option">
          {({ checked }) => (
            <>
              {checked ? (
                <BiRadioCircleMarked className={"list-checked-icon"} />
              ) : (
                <BiRadioCircle className={"list-checked-icon"} />
              )}
              <span className={`${checked && "selected"}`}>wildcard</span>
            </>
          )}
        </RadioGroup.Option>
        <RadioGroup.Option value="regex" className="textual-filter-option">
          {({ checked }) => (
            <>
              {checked ? (
                <BiRadioCircleMarked className={"list-checked-icon"} />
              ) : (
                <BiRadioCircle className={"list-checked-icon"} />
              )}
              <span className={`${checked && "selected"}`}>regex</span>
            </>
          )}
        </RadioGroup.Option>
      </RadioGroup>
    </div>
  );
};

const getTextualFilterPanel = ({
  column,
  columnFilterValue,
}: {
  column: Column<any, unknown>;
  columnFilterValue: MultipleFilterValue;
}) => {
  const search = columnFilterValue.filterValues.textualFilter.search;
  const title = (
    <div
      className="selection-list-button"
      style={{
        display: "block",
        flex: "auto",
        flexGrow: 1,
        textAlign: "left",
      }}
    >
      {(search ?? "").length === 0 ? "(all)" : search}
    </div>
  );

  return [
    title,
    <TextualFilterPanel
      column={column}
      columnFilterValue={columnFilterValue}
    />,
  ];
};

function Filter({
  column,
  table,
}: {
  column: Column<any, unknown>;
  table: Table<any>;
}) {
  const allValues = React.useMemo(
    () =>
      sort(
        Array.from(
          new Set(
            table
              .getPreFilteredRowModel()
              .flatRows.map((r) => r.getValue(column.id))
              .filter((s) => typeof s === "number" || typeof s === "string")
          )
        )
      )
        .asc()
        .map(String),
    [table.getPreFilteredRowModel()]
  );

  const defaultColumnFilterValue: MultipleFilterValue = React.useMemo(
    () => ({
      activated: "selection",
      filterValues: {
        numericFilter: [null, null],
        selection: allValues.reduce(
          (pre, cur) => ({ ...pre, [cur]: "selected" }),
          {}
        ),
        textualFilter: {
          matchMode: "wildcard",
          search: "",
          matchCase: false,
        },
      },
    }),
    [allValues]
  );

  const sortedUniqueValues = React.useMemo(
    () =>
      sort(
        Array.from(column.getFacetedUniqueValues().keys()).filter(
          (s) => typeof s === "number" || typeof s === "string"
        )
      )
        .asc()
        .map(String),
    [column.getFacetedUniqueValues()]
  );
  let columnFilterValue = column.getFilterValue() as MultipleFilterValue;
  if (columnFilterValue == null) {
    columnFilterValue = defaultColumnFilterValue;
  }

  const [selectionTitle, selectionPanel] = getSelectionPanel({
    column,
    table,
    allValues,
    columnFilterValue,
    sortedUniqueValues,
  });
  const [numericFilterTitle, numericFilterPanel] = getNumericFilterPanel({
    column,
    columnFilterValue,
  });
  const [textualFilterTitle, textualFilterPanel] = getTextualFilterPanel({
    column,
    columnFilterValue,
  });

  const tabs: (keyof MultipleFilterFunctions)[] = [
    "selection",
    "numericFilter",
    "textualFilter",
  ];
  const tabIndex = tabs
    .map(
      (t: keyof MultipleFilterFunctions, i) =>
        [t, i] as [keyof MultipleFilterFunctions, number]
    )
    .reduce(
      (pre, [t, i]) => ({
        [t]: i,
        ...pre,
      }),
      {}
    ) as { [keys in keyof MultipleFilterFunctions]: number };

  const ButtonTitle = {
    selection: selectionTitle,
    numericFilter: numericFilterTitle,
    textualFilter: textualFilterTitle,
  }[columnFilterValue.activated];

  const [referenceElement, setReferenceElement] = useState<Element | null>(
    null
  );
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const [arrowElement, setArrowElement] = useState<HTMLElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "right-start",
    modifiers: [{ name: "arrow", options: { element: arrowElement } }],
  });

  return (
    <Popover className={"popover"}>
      <Popover.Button
        className={"popover-icon-button"}
        style={{
          width: column.getSize(),
        }}
        ref={setReferenceElement}
      >
        {ButtonTitle}
        <div
          style={{
            minWidth: 20,
          }}
        >
          <HiOutlineFilter className={"body-icon-button"} />
        </div>
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
        <Tab.Group
          onChange={(index) => {
            column.setFilterValue({
              ...columnFilterValue,
              activated: tabs[index],
            });
          }}
          defaultIndex={tabIndex[columnFilterValue.activated]}
        >
          <Tab.List>
            <Tab>Select</Tab>
            <Tab>Number</Tab>
            <Tab>Text</Tab>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>{selectionPanel}</Tab.Panel>
            <Tab.Panel>{numericFilterPanel}</Tab.Panel>
            <Tab.Panel>{textualFilterPanel}</Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </Popover.Panel>
    </Popover>
  );
}

export default Filter;
