import React, {
  createContext,
  ReactElement,
  useContext,
  useState,
} from "react";
import makeData, { RootCauseItemBody } from "./makeData";
import { faker } from "@faker-js/faker";
import DataGrid from "../components/DataGrid";
import { ColumnDef } from "@tanstack/react-table";
import { Popover, PopoverAlign } from "react-tiny-popover";
import { BiBarChartSquare } from "react-icons/bi";
import { Facebook, Ring, Spinner } from "../components/Loading";

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
  states: { [rowId: string]: PopoverHoverState };
  setState: (rowId: string, newState: PopoverHoverState) => void;
  plots: { [rowId: string]: string };
};
const PlotPopoverHoverContext = createContext<RowStates>({
  states: {},
  setState: () => false,
  plots: {},
});

type PlotPopoverHoverProps = {
  rowId: string;
};
const PlotPopoverHover: React.FC<PlotPopoverHoverProps> = (props) => {
  const { states, setState, plots } = useContext(PlotPopoverHoverContext) ?? {
    state: {},
    setState: () => false,
    plots: {},
  };
  const state = states[props.rowId] ?? {};
  const [hoverOpen, setHoverOpen] = React.useState(false);
  const clickOpen = state.clickOpen ?? false;
  const setClickOpen = (c: boolean) =>
    setState(props.rowId, { ...state, clickOpen: c });
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <Popover
      isOpen={hoverOpen || clickOpen}
      positions={["right"]} // if you'd like, you can limit the positions
      align={"start"}
      padding={10} // adjust padding here!
      reposition={true} // prevents automatic readjustment of content position that keeps your popover content within its parent's bounds
      content={(
        { position, nudgedLeft, nudgedTop } // you can also provide a render function that injects some useful stuff!
      ) => (
        <div>
          <img
            onLoad={() => setIsLoaded(true)}
            src={plots[props.rowId]}
            alt="plot"
          />
          {isLoaded ? null : <Spinner />}
        </div>
      )}
    >
      <button
        className={`myui ${clickOpen ? "myui-clicked" : ""}`}
        onClick={() => setClickOpen(!clickOpen)}
        onMouseOver={() => setHoverOpen(true)}
        onMouseLeave={() => setHoverOpen(false)}
      >
        <BiBarChartSquare style={{ transform: "scale(2,2)" }} />
      </button>
    </Popover>
  );
};

const dataColumns: ColumnDef<RootCauseItemBody>[] = [
  {
    accessorKey: "index",
    header: "Index",
    cell: (info) => info.getValue(),
    footer: (info) => info.column.id,
    enableGrouping: false,
    aggregationFn: undefined,
    size: 60,
    minSize: 30,
  },
  {
    header: "Factor",
    columns: [
      {
        accessorKey: "type",
        header: () => "Type",
        footer: (info) => info.column.id,
        size: 90,
        minSize: 30,
      },
      {
        accessorKey: "ope_no",
        header: () => "OPE_NO",
        footer: (info) => info.column.id,
        size: 90,
        minSize: 30,
      },
      {
        accessorKey: "factor",
        header: "Factor",
        footer: (info) => info.column.id,
        size: 500,
      },
    ],
  },
  {
    accessorKey: "score",
    header: "Score",
    footer: (info) => info.column.id,
    enableGrouping: false,
    aggregationFn: "max",
    aggregatedCell: (props) => <span>max: {props.renderValue()}</span>,
    size: 90,
  },
  {
    id: "plot",
    header: () => "",
    enableGrouping: false,
    cell: (props) => (
      <span>
        <PlotPopoverHover rowId={props.row.id} />
      </span>
    ),
    size: 24,
  },
];

const DataContext = createContext(makeData(10));

const DataReport: React.FC = () => {
  const data = useContext(DataContext);
  const [plots] = useState(
    data.reduce(
      (a, v, rowId) => ({ ...a, [rowId]: faker.image.cats(300, 300, true) }),
      {}
    )
  );
  const [states, setStates] = useState<{ [rowId: string]: PopoverHoverState }>(
    data.reduce((a, v, rowId) => ({ ...a, [rowId]: v }), {})
  );
  const setIdState = (rowId: string, state: PopoverHoverState) => {
    setStates({ ...states, [rowId]: state });
  };

  return (
    <PlotPopoverHoverContext.Provider
      value={{ states, setState: setIdState, plots }}
    >
      <div>
        <p>{faker.lorem.paragraphs()}</p>
      </div>
      <DataGrid<RootCauseItemBody>
        data={data}
        columns={dataColumns}
        pageOptions={"one-page"}
      />
    </PlotPopoverHoverContext.Provider>
  );
};

export default DataReport;
