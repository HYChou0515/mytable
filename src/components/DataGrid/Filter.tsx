import { Column, Table } from "@tanstack/react-table";
import React, { Fragment, useState } from "react";
import { sort } from "fast-sort";
import { usePopper } from "react-popper";
import { Listbox, Popover, Tab } from "@headlessui/react";
import { HiOutlineFilter } from "react-icons/hi";
import {
  BiCheckbox,
  BiCheckboxChecked,
  BiCheckboxSquare,
} from "react-icons/bi";
import { rankItem } from "@tanstack/match-sorter-utils";

import { MultipleFilterValue } from "./types";

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

const SelectionPanel: React.FC<{
  column: Column<any, unknown>;
  allValues: string[];
  columnFilterValue: MultipleFilterValue;
  sortedUniqueValues: string[];
  selected: string[];
  checkedState: "empty" | "full" | "intermediate";
}> = ({
  column,
  allValues,
  columnFilterValue,
  sortedUniqueValues,
  selected,
  checkedState,
}) => {
  const shownAndSelected = sortedUniqueValues.filter((s) =>
    selected.includes(s)
  );
  const [optionFilterValue, setOptionalFilterValue] = useState("");
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
            <BiCheckbox className={"selection-item-icon"} />
          ) : checkedState === "full" ? (
            <BiCheckboxChecked className={"selection-item-icon"} />
          ) : (
            <BiCheckboxSquare className={"selection-item-icon"} />
          )}
          <span>(Select All)</span>
        </li>
        {sortedUniqueValues
          .filter((v) => rankItem(v, optionFilterValue).passed)
          .map((v, i) => (
            <Listbox.Option key={v} value={v} as={Fragment}>
              {({ active, selected }) => (
                <li
                  key={`selection-list-item-${i}-${v}`}
                  className={`selection-list-item ${selected && "selected"}`}
                >
                  {selected ? (
                    <BiCheckboxChecked className={"selection-item-icon"} />
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

const getNumberBetweenPanel = ({
  column,
  table,
  columnFilterValue,
}: {
  column: Column<any, unknown>;
  table: Table<any>;
  columnFilterValue: MultipleFilterValue;
}) => {
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
      {`${columnFilterValue.filterValues.numericBetween[0]}~${columnFilterValue.filterValues.numericBetween[1]}`}
    </div>
  );
  return [
    title,
    <>
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
    </>,
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
        numericBetween: [null, null],
        selection: allValues.reduce(
          (pre, cur) => ({ ...pre, [cur]: "selected" }),
          {}
        ),
        textContains: "",
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
  const [numberBetweenTitle, numberBetweenPanel] = getNumberBetweenPanel({
    column,
    table,
    columnFilterValue,
  });
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
        {columnFilterValue.activated === "selection"
          ? selectionTitle
          : numberBetweenTitle}
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
              activated: index === 0 ? "selection" : "numericBetween",
            });
          }}
        >
          <Tab.List>
            <Tab>Select</Tab>
            <Tab>Number</Tab>
            <Tab>Text</Tab>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>{selectionPanel}</Tab.Panel>
            <Tab.Panel>{numberBetweenPanel}</Tab.Panel>
            <Tab.Panel></Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </Popover.Panel>
    </Popover>
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

export default Filter;
