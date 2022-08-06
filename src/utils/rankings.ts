import { ISortBy, ISortByObjectSorter, sort } from "fast-sort";
import * as _ from "lodash";

export type MyRankObjectSorter<T> =
  | {
      asc: (x: T) => any;
    }
  | {
      desc: (x: T) => any;
    };

type RankingOptions<T = any> = {
  method?: "average" | "min" | "max" | "first" | "dense";
  na_option?: "keep" | "top" | "bottom";
  sortBy?: "asc" | "desc" | MyRankObjectSorter<T> | MyRankObjectSorter<T>[];
};

const defaultRankingOptions: RankingOptions = {
  method: "average",
  na_option: "keep",
  sortBy: "asc",
};
interface FakeIFastSort<T> {
  /**
   * Sort array in ascending order.
   * @example
   * sort([3, 1, 4]).asc();
   * sort(users).asc(u => u.firstName);
   * sort(users).asc([
   *   u => u.firstName,
   *   u => u.lastName,
   * ]);
   */
  asc(sortBy?: ISortBy<T> | ISortBy<T>[]): T[];
  /**
   * Sort array in descending order.
   * @example
   * sort([3, 1, 4]).desc();
   * sort(users).desc(u => u.firstName);
   * sort(users).desc([
   *   u => u.firstName,
   *   u => u.lastName,
   * ]);
   */
  desc(sortBy?: ISortBy<T> | ISortBy<T>[]): T[];
  /**
   * Sort array in ascending or descending order. It allows sorting on multiple props
   * in different order for each of them.
   * @example
   * sort(users).by([
   *  { asc: u => u.score },
   *  { desc: u => u.age },
   * ]);
   */
  by(sortBy: ISortByObjectSorter<T> | ISortByObjectSorter<T>[]): T[];
}

function rankings<T>(arr: T[], options?: RankingOptions<T>) {
  const { method, na_option, sortBy } = {
    ...defaultRankingOptions,
    ...options,
  };
  const getPackedSortByForMyRankObjectSorter = (sb: MyRankObjectSorter<T>) => {
    if ("asc" in sb) {
      return {
        asc: (x: [T, number]) => sb.asc(x[0]),
      } as MyRankObjectSorter<[T, number]>;
    }
    return {
      desc: (x: [T, number]) => sb.desc(x[0]),
    } as MyRankObjectSorter<[T, number]>;
  };
  const getSortBy = (x: FakeIFastSort<[T, number]>) => {
    if (sortBy === "asc" || sortBy == null) {
      return x.asc();
    } else if (sortBy === "desc") {
      return x.desc();
    } else if (Array.isArray(sortBy)) {
      return x.by([
        ...sortBy.map(getPackedSortByForMyRankObjectSorter),
        { asc: (x) => x[1] },
      ]);
    } else {
      return x.by([
        getPackedSortByForMyRankObjectSorter(sortBy),
        { asc: (x) => x[1] },
      ]);
    }
  };
  const A1 = getSortBy(sort(arr.map((v, i) => [v, i]))).map(([_, i]) => i);
  const A2 = getSortBy(sort(arr.map((v, i) => [v, arr.length - i]))).map(
    ([_, i]) => arr.length - i
  );
  const argRanks = _.range(arr.length);
  let x: number[] | null = null;
  let denseIndex = 0;
  for (const i of _.range(arr.length)) {
    if (x == null) {
      if (A1[i] !== A2[i]) {
        x = [A1[i], i, -1];
      } else if (method === "dense") {
        argRanks[i] = denseIndex++;
      }
    } else {
      if (x[0] === A2[i]) {
        x[2] = i;
        if (method === "first") {
          const _r = sort(
            A1.slice(x[1], x[2] + 1).map((_v, _i) => [_v, (x ?? [])[1] + _i])
          )
            .asc()
            .map(([_, _i]) => _i);
          for (const j of _.range(x[2] - x[1] + 1)) {
            argRanks[j + x[1]] = _r[j];
          }
        } else {
          for (const j of _.range(x[1], x[2] + 1)) {
            if (method === "dense") argRanks[j] = denseIndex;
            else if (method === "min") argRanks[j] = x[1];
            else if (method === "max") argRanks[j] = x[2];
            else if (method === "average") argRanks[j] = (x[1] + x[2]) / 2;
          }
        }
        denseIndex += 1;
        x = null;
      }
    }
  }
  const ranks = _.range(arr.length);
  _.zip(A1, argRanks).forEach(([i, r]) => {
    ranks[i ?? 0] = (r ?? 0) + 1;
  });
  return ranks;
}

export default rankings;
