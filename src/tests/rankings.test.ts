import rankings from "../utils/rankings";

test("rankings-1", () => {
  expect(rankings([8, 6, 7, 5, 4])).toEqual([5, 3, 4, 2, 1]);
});
test("rankings-2", () => {
  expect(rankings([8, 6, 7, 5, 4], { sortBy: "desc" })).toEqual([
    1, 3, 2, 4, 5,
  ]);
});
test("rankings-3", () => {
  expect(rankings([4, 6, 5, 7, 8])).toEqual([1, 3, 2, 4, 5]);
});
test("rankings-4", () => {
  expect(rankings([4, 6, 5, 7, 8], { sortBy: "desc" })).toEqual([
    5, 3, 4, 2, 1,
  ]);
});
test("rankings-5", () => {
  expect(
    rankings(
      [9, 4, 5, 6, 8, 6, 9, 6].map((x) => ({ a: x })),
      { sortBy: { asc: (a) => a.a }, method: "dense" }
    )
  ).toEqual([5, 1, 2, 3, 4, 3, 5, 3]);
});
test("rankings-6", () => {
  expect(
    rankings(
      [9, 4, 5, 6, 8, 6, 9, 6].map((x) => ({ a: x })),
      { sortBy: { desc: (a) => a.a }, method: "dense" }
    )
  ).toEqual([1, 5, 4, 3, 2, 3, 1, 3]);
});
test("rankings-7", () => {
  expect(
    rankings(
      [9, 4, 5, 6, 8, 6, 9, 6].map((x, i) => ({ a: x, b: i })),
      { sortBy: { asc: (a) => a.a }, method: "dense" }
    )
  ).toEqual([5, 1, 2, 3, 4, 3, 5, 3]);
});
test("rankings-8", () => {
  expect(
    rankings(
      [9, 4, 5, 6, 8, 6, 9, 6].map((x, i) => ({ a: x, b: i })),
      { sortBy: { desc: (a) => a.a }, method: "dense" }
    )
  ).toEqual([1, 5, 4, 3, 2, 3, 1, 3]);
});
test("rankings-9", () => {
  expect(
    rankings(
      [9, 4, 5, 6, 8, 6, 9, 6].map((x, i) => ({ a: x, b: i })),
      { sortBy: [{ asc: (a) => a.a }, { desc: (a) => a.b }], method: "dense" }
    )
  ).toEqual([8, 1, 2, 5, 6, 4, 7, 3]);
});
test("rankings-10", () => {
  expect(
    rankings(
      [9, 4, 5, 6, 8, 9, 6, 6].map((x, i) => ({ a: x, b: i % 2 })),
      { sortBy: [{ desc: (a) => a.a }, { asc: (a) => a.b }], method: "dense" }
    )
  ).toEqual([1, 7, 6, 5, 3, 2, 4, 5]);
});
test("rankings-11", () => {
  expect(
    rankings(
      [9, 4, 5, 6, 8, 9, 6, 6].map((x, i) => ({ a: x, b: i % 2 })),
      { sortBy: [{ desc: (a) => a.a }, { asc: (a) => a.b }], method: "first" }
    )
  ).toEqual([1, 8, 7, 5, 3, 2, 4, 6]);
});
test("rankings-12", () => {
  expect(
    rankings(
      [9, 4, 5, 6, 8, 9, 6, 6].map((x, i) => ({ a: x, b: i % 2 })),
      { sortBy: [{ asc: (a) => a.a }, { asc: (a) => a.b }], method: "first" }
    )
  ).toEqual([7, 1, 2, 4, 6, 8, 3, 5]);
});
test("rankings-13", () => {
  expect(
    rankings(
      [9, 4, 5, 6, 8, 9, 6, 6].map((x, i) => ({ a: x, b: i % 2 })),
      { sortBy: [{ desc: (a) => a.b }, { asc: (a) => a.a }], method: "min" }
    )
  ).toEqual([8, 1, 5, 2, 7, 4, 6, 2]);
});
test("rankings-14", () => {
  expect(
    rankings(
      [9, 4, 5, 6, 8, 9, 6, 6].map((x, i) => ({ a: x, b: i % 2 })),
      { sortBy: [{ asc: (a) => a.b + a.a }], method: "max" }
    )
  ).toEqual([7, 2, 2, 5, 6, 8, 3, 5]);
});
