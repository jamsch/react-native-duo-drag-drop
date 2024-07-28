import type { ViewStyle } from "react-native";
import type { AnimatedStyle } from "react-native-reanimated";

type TransformType =
  | { perspective: number }
  | { rotate: string }
  | { rotateX: string }
  | { rotateY: string }
  | { rotateZ: string }
  | { scale: number }
  | { scaleX: number }
  | { scaleY: number }
  | { translateX: number }
  | { translateY: number }
  | { skewX: string }
  | { skewY: string }
  | { matrix: number[] };

export type DuoWordAnimatedStyle = {
  position: string;
  top: number;
  left: number;
  zIndex: number;
  width: number;
  height: number;
  transform: [{ translateX: number }, { translateY: number }] & TransformType[];
};

export type DuoAnimatedStyleWorklet = (
  style: DuoWordAnimatedStyle & ViewStyle,
  isGestureActive: boolean,
) => AnimatedStyle<ViewStyle>;

export type DropEvent = { index: number; destination: "answered" | "bank"; position: number };

export type OnDropFunction = (event: DropEvent) => void;
