import React, { createContext, useContext, useState } from "react";
import makeData, { RootCauseItemBody } from "./makeData";
import DataGrid from "../components/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { Popover, PopoverAlign } from "react-tiny-popover";

type PopoverHoverProps = {
  initOpen?: boolean;
};

const PopoverHover: React.FC<PopoverHoverProps> = (props, children) => {
  const [hoverOpen, setHoverOpen] = React.useState(false);
  const [clickOpen, setClickOpen] = React.useState(props.initOpen ?? false);

  return (
    <Popover
      isOpen={hoverOpen || clickOpen}
      positions={["right"]} // if you'd like, you can limit the positions
      align={"start"}
      padding={10} // adjust padding here!
      reposition={true} // prevents automatic readjustment of content position that keeps your popover content within its parent's bounds
      // onClickOutside={() => setClickOpen(false)} // handle click events outside of the popover/target here!
      content={(
        { position, nudgedLeft, nudgedTop } // you can also provide a render function that injects some useful stuff!
      ) => (
        <div>
          <div>
            Hi! I'm popover content. Here's my current position: {position}.
          </div>
          <div>
            I'm {` ${nudgedLeft} `} pixels beyond my boundary horizontally!
          </div>
          <div>
            I'm {` ${nudgedTop} `} pixels beyond my boundary vertically!
          </div>
        </div>
      )}
    >
      <div
        onClick={() => setClickOpen(!clickOpen)}
        onMouseOver={() => setHoverOpen(true)}
        onMouseLeave={() => setHoverOpen(false)}
      >
        Click me!
      </div>
    </Popover>
  );
};
type PopoverHoverState = {
  clickOpen?: boolean;
};
type RowStates = {
  states: { [id: string]: PopoverHoverState };
  setState: (id: string, newState: PopoverHoverState) => void;
};
const PlotPopoverHoverContext = createContext<RowStates>({
  states: {},
  setState: () => false,
});

type PlotPopoverHoverProps = {
  id: string;
};
const PlotPopoverHover: React.FC<PlotPopoverHoverProps> = (props) => {
  const { states, setState } = useContext(PlotPopoverHoverContext) ?? {
    state: {},
    setState: () => false,
  };
  const state = states[props.id] ?? {};
  const [hoverOpen, setHoverOpen] = React.useState(false);
  const clickOpen = state.clickOpen ?? false;
  const setClickOpen = (c: boolean) =>
    setState(props.id, { ...state, clickOpen: c });
  return (
    <Popover
      isOpen={hoverOpen || clickOpen}
      positions={["right"]} // if you'd like, you can limit the positions
      align={"start"}
      padding={10} // adjust padding here!
      reposition={true} // prevents automatic readjustment of content position that keeps your popover content within its parent's bounds
      // onClickOutside={() => setClickOpen(false)} // handle click events outside of the popover/target here!
      content={(
        { position, nudgedLeft, nudgedTop } // you can also provide a render function that injects some useful stuff!
      ) => (
        <div>
          <div>
            Hi! I'm popover content. Here's my current position: {position}.
          </div>
          <div>
            I'm {` ${nudgedLeft} `} pixels beyond my boundary horizontally!
          </div>
          <div>
            I'm {` ${nudgedTop} `} pixels beyond my boundary vertically!
          </div>
        </div>
      )}
    >
      <div
        onClick={() => setClickOpen(!clickOpen)}
        onMouseOver={() => setHoverOpen(true)}
        onMouseLeave={() => setHoverOpen(false)}
      >
        Click me!
      </div>
    </Popover>
  );
};

const dataColumns: ColumnDef<RootCauseItemBody>[] = [
  {
    accessorKey: "id",
    cell: (info) => info.getValue(),
    footer: (info) => info.column.id,
    enableGrouping: false,
    aggregationFn: undefined,
  },
  {
    accessorKey: "type",
    header: () => "type",
    footer: (info) => info.column.id,
  },
  {
    accessorKey: "ope_no",
    header: () => "OPE_NO",
    footer: (info) => info.column.id,
  },
  {
    accessorKey: "factor",
    header: "Factor",
    footer: (info) => info.column.id,
  },
  {
    accessorKey: "score",
    header: "Score",
    footer: (info) => info.column.id,
    enableGrouping: false,
    aggregationFn: "max",
    aggregatedCell: (props) => <span>max: {props.renderValue()}</span>,
  },
  {
    header: " ",
    enableGrouping: false,
    cell: (props) => (
      <span>
        <PlotPopoverHover id={props.cell.id} />
      </span>
    ),
  },
];

const DataContext = createContext(makeData(500));

const DataReport: React.FC = () => {
  const data = useContext(DataContext);
  const [states, setStates] = useState<{ [id: string]: PopoverHoverState }>(
    data.reduce((a, v) => ({ ...a, [v.id]: v }), {})
  );
  const setIdState = (id: string, state: PopoverHoverState) => {
    setStates({ ...states, [id]: state });
  };

  return (
    <PlotPopoverHoverContext.Provider
      value={{ states: states, setState: setIdState }}
    >
      <DataGrid<RootCauseItemBody>
        data={data}
        columns={dataColumns}
        pageOptions={"one-page"}
      />
    </PlotPopoverHoverContext.Provider>
  );
};

export default DataReport;
