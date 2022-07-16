import React from "react";
import makeData, {RootCauseItemBody} from "./makeData";
import DataGrid from "../components/DataGrid";
import {ColumnDef} from "@tanstack/react-table";

const dataColumns: ColumnDef<RootCauseItemBody>[] = [
  {
    accessorKey: 'id',
    cell: info => info.getValue(),
    footer: info => info.column.id,
  },
  {
    accessorKey: 'type',
    header: () => 'type',
    footer: info => info.column.id,
  },
  {
    accessorKey: 'ope_no',
    header: () => "OPE_NO",
    footer: info => info.column.id,
  },
  {
    accessorKey: 'factor',
    header: 'Factor',
    footer: info => info.column.id,
  },
  {
    accessorKey: 'score',
    header: 'Score',
    footer: info => info.column.id,
  },
]


const DataReport: React.FC = () => {
  return <DataGrid<RootCauseItemBody> data={makeData(100)} columns={dataColumns}/>;
}

export default DataReport;