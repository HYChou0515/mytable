import { FixedSizeList, FixedSizeListProps } from "react-window";
import React, { useCallback } from "react";
import PerfectScrollbar from "react-perfect-scrollbar";

const CustomScrollbars: React.FC<any> = ({
  onScroll,
  forwardedRef,
  style,
  children,
}) => {
  const refSetter = useCallback((scrollbarsRef: any) => {
    if (scrollbarsRef) {
      forwardedRef(scrollbarsRef.view);
    } else {
      forwardedRef(null);
    }
  }, []);

  return (
    <PerfectScrollbar
      ref={refSetter}
      style={{ ...style, overflow: "hidden" }}
      onScroll={onScroll}
      options={{ minScrollbarLength: 30 }}
    >
      {children}
    </PerfectScrollbar>
  );
};

const CustomScrollbarsVirtualList = React.forwardRef((props, ref) => (
  <CustomScrollbars {...props} forwardedRef={ref} />
));

function VirtualList<T>(props: FixedSizeListProps<T>) {
  return (
    <FixedSizeList<T> outerElementType={CustomScrollbarsVirtualList} {...props}>
      {props.children}
    </FixedSizeList>
  );
}

export default VirtualList;
