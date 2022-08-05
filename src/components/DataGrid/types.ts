import { Cell, ColumnDef, Header, Row, Table } from "@tanstack/react-table";

export type DivTableBodyCellProps<ObjT> = {
  cell: Cell<ObjT, unknown>;
};

export type DataGridProps<ObjT> = {
  data: ObjT[];
  columns: ColumnDef<ObjT>[];
  pageOptions?: number[] | "one-page";
};

export type TextualFilterMatchModes = keyof {
  normal: string;
  wildcard: string;
  regex: string;
};
export type MultipleFilterFunctions = {
  numericFilter: [number | null, number | null];
  selection: { [value: string]: "selected" | "unselected" };
  textualFilter: {
    matchMode: TextualFilterMatchModes;
    matchCase: boolean;
    search: string;
  };
};

export type MultipleFilterValue = {
  activated: keyof MultipleFilterFunctions;
  filterValues: MultipleFilterFunctions;
};

export type TableContextProps = {
  onAutoSizeColumn: (header: Header<any, unknown>) => void;
};

export type DivTableHeadCellFilterProps<ObjT> = {
  header: Header<ObjT, unknown>;
  table: Table<ObjT>;
};

export type DivTableHeadProps<ObjT> = {
  table: Table<ObjT>;
};

export type DivTableHeaderCellProps<ObjT> = {
  header: Header<ObjT, unknown>;
};

export type DivTableBodyRowProps<ObjT> = {
  row: Row<ObjT>;
};
