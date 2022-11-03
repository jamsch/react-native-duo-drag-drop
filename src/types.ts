import type { ViewStyle } from "react-native";
import type Animated from "react-native-reanimated";

export type DuoWordAnimatedStyle = {
  position: string;
  top: number;
  left: number;
  zIndex: number;
  width: number;
  height: number;
  transform: [{ translateX: number }, { translateY: number }] & ViewStyle["transform"];
};

export type DuoAnimatedStyleWorklet = (
  style: DuoWordAnimatedStyle & ViewStyle,
  isGestureActive: boolean,
) => Animated.AnimateStyle<ViewStyle | DuoWordAnimatedStyle>;

export type DropEvent = { index: number; destination: "answered" | "bank"; position: number };

export type OnDropFunction = (event: DropEvent) => void;
