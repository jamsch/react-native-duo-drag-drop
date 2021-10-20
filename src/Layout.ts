import type Animated from "react-native-reanimated";
import { move } from "react-native-redash";

type SharedValues<T extends Record<string, string | number | boolean>> = {
  [K in keyof T]: Animated.SharedValue<T[K]>;
};

export type Offset = SharedValues<{
  order: number;
  height: number;
  width: number;
  x: number;
  y: number;
  originalX: number;
  originalY: number;
}>;

const isNotInBank = (offset: Offset) => {
  "worklet";
  return offset.order.value !== -1;
};

const byOrder = (a: Offset, b: Offset) => {
  "worklet";
  return a.order.value - b.order.value;
};

export const lastOrder = (input: Offset[]) => {
  "worklet";
  return input.filter(isNotInBank).length;
};

export const remove = (input: Offset[], index: number) => {
  "worklet";
  const offsets = input
    .filter((_, i) => i !== index)
    .filter(isNotInBank)
    .sort(byOrder);

  for (let i = 0; i < offsets.length; i++) {
    offsets[i].order.value = i;
  }
};

export const reorder = (input: Offset[], from: number, to: number) => {
  "worklet";
  const offsets = input.filter(isNotInBank).sort(byOrder);
  const newOffset = move(offsets, from, to);
  for (let i = 0; i < newOffset.length; i++) {
    newOffset[i].order.value = i;
  }
};

export const calculateLayout = (
  input: Offset[],
  containerWidth: number,
  wordHeight: number,
  wordGap: number,
  lineGap: number,
  rtl = false,
) => {
  "worklet";
  const offsets = input.filter(isNotInBank).sort(byOrder);

  if (offsets.length === 0) {
    return;
  }
  let lineNumber = 0;
  let lineBreak = 0;
  for (let i = 0; i < offsets.length; i++) {
    const offset = offsets[i];
    const total = offsets.slice(lineBreak, i).reduce((acc, o) => acc + o.width.value + wordGap / 2, 0);
    if (total + offset.width.value > containerWidth) {
      lineNumber += 1;
      lineBreak = i;
      offset.x.value = rtl ? containerWidth - offset.width.value : 0;
    } else {
      offset.x.value = rtl ? containerWidth - total - offset.width.value : total;
    }
    offset.y.value = (wordHeight + lineGap) * lineNumber + lineGap / 2;
  }
};
