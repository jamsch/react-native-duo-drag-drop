import { memo, ReactElement, useCallback } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useDerivedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { calculateLayout, lastOrder, Offset, remove, reorder, between, useVector } from "./Layout";
import type { DuoAnimatedStyleWorklet, OnDropFunction } from "./types";
import type { DuoWordAnimatedStyle } from "./index";

export interface SortableWordProps {
  animatedStyleWorklet?: DuoAnimatedStyleWorklet;
  onDrop?: OnDropFunction;
  offsets: Offset[];
  children: ReactElement<{ id: number }>;
  index: number;
  containerWidth: number;
  gesturesDisabled: boolean;
  rtl: boolean;
  linesHeight: number;
  wordHeight: number;
  wordGap: number;
  wordBankOffsetY: number;
  lineGap: number;
}

const SortableWord = ({
  animatedStyleWorklet,
  offsets,
  index,
  children,
  containerWidth,
  gesturesDisabled,
  rtl,
  linesHeight,
  wordHeight,
  wordGap,
  wordBankOffsetY,
  lineGap,
  onDrop,
}: SortableWordProps) => {
  const offset = offsets[index];
  const isGestureActive = useSharedValue(false);
  const isAnimating = useSharedValue(false);
  const translation = useVector();
  const isInBank = useDerivedValue(() => offset.order.value === -1);
  const ctxX = useSharedValue(0);
  const ctxY = useSharedValue(0);
  const panOrderHasChanged = useSharedValue(false);

  const emitOnDrop = useCallback(
    () =>
      onDrop?.({
        index,
        destination: offset.order.value === -1 ? "bank" : "answered",
        position: offset.order.value,
      }),
    [index, offset, onDrop],
  );

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (isAnimating.value) {
        return;
      }
      panOrderHasChanged.value = false;

      if (isInBank.value) {
        translation.x.value = offset.originalX.value;
        translation.y.value = offset.originalY.value + wordBankOffsetY;
      } else {
        translation.x.value = offset.x.value;
        translation.y.value = offset.y.value;
      }

      ctxX.value = translation.x.value;
      ctxY.value = translation.y.value;
    })
    .onChange(({ translationX, translationY }) => {
      isGestureActive.value = true;
      translation.x.value = ctxX.value + translationX;
      translation.y.value = ctxY.value + translationY;

      if (isInBank.value && translation.y.value < linesHeight) {
        offset.order.value = lastOrder(offsets);
        calculateLayout(offsets, containerWidth, wordHeight, wordGap, lineGap, rtl);
        panOrderHasChanged.value = true;
      } else if (!isInBank.value && translation.y.value > linesHeight - wordHeight / 2) {
        offset.order.value = -1;
        remove(offsets, index);
        calculateLayout(offsets, containerWidth, wordHeight, wordGap, lineGap, rtl);
        panOrderHasChanged.value = true;
      }

      for (let i = 0; i < offsets.length; i++) {
        const o = offsets[i];
        if (i === index && o.order.value !== -1) {
          continue;
        }
        const isItemInBank = o.order.value === -1;
        const x = isItemInBank ? o.originalX.value : o.x.value;
        const y = isItemInBank ? o.originalY.value + wordBankOffsetY : o.y.value;
        if (
          between(translation.x.value, x, x + o.width.value, false) &&
          between(translation.y.value, y, y + wordHeight) && // NOTE: check y value when interacting with bottom
          offset.order.value !== o.order.value
        ) {
          reorder(offsets, offset.order.value, o.order.value);
          calculateLayout(offsets, containerWidth, wordHeight, wordGap, lineGap, rtl);
          panOrderHasChanged.value = true;
          break;
        }
      }
    })
    .onEnd(() => {
      isAnimating.value = true;
      translation.x.value = offset.x.value;
      translation.y.value = offset.y.value;
      isGestureActive.value = false;
      if (panOrderHasChanged.value) {
        runOnJS(emitOnDrop)();
      }
      panOrderHasChanged.value = false;
    });

  const translateX = useDerivedValue(() => {
    if (isGestureActive.value) {
      return translation.x.value;
    }
    return withTiming(
      isInBank.value ? offset.originalX.value : offset.x.value,
      { duration: 250 },
      () => (isAnimating.value = false),
    );
  });

  const translateY = useDerivedValue(() => {
    if (isGestureActive.value) {
      return translation.y.value;
    }

    return withTiming(
      isInBank.value ? offset.originalY.value + wordBankOffsetY : offset.y.value,
      { duration: 250 },
      () => (isAnimating.value = false),
    );
  });

  const style = useAnimatedStyle(() => {
    const style: DuoWordAnimatedStyle & ViewStyle = {
      position: "absolute",
      top: 0,
      left: -1,
      zIndex: isGestureActive.value || isAnimating.value ? 100 : Math.max(1, offset.order.value),
      width: offset.width.value + 2,
      height: wordHeight,
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    };
    return (animatedStyleWorklet?.(style, isGestureActive.value) || style) as ViewStyle;
  });

  const tapGesture = Gesture.Tap().onStart(() => {
    if (isInBank.value) {
      offset.order.value = lastOrder(offsets);
    } else {
      offset.order.value = -1;
      remove(offsets, index);
    }

    isAnimating.value = true;

    calculateLayout(offsets, containerWidth, wordHeight, wordGap, lineGap, rtl);
    translation.x.value = offset.x.value;
    translation.y.value = offset.y.value;

    runOnJS(emitOnDrop)();
  });

  return (
    <Animated.View style={style}>
      {gesturesDisabled ? (
        <Animated.View style={StyleSheet.absoluteFill}>{children}</Animated.View>
      ) : (
        <GestureDetector gesture={Gesture.Race(tapGesture, panGesture)}>
          <Animated.View style={StyleSheet.absoluteFill}>{children}</Animated.View>
        </GestureDetector>
      )}
    </Animated.View>
  );
};

export default memo(SortableWord);
