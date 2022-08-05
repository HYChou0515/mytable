import { createContext } from "react";
import { TableContextProps } from "./types";

export const TableContext = createContext<TableContextProps>({
  onAutoSizeColumn: () => false,
});
