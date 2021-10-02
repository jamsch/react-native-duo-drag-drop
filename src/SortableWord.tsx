import React, { ReactElement } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useAnimatedGestureHandler,
  useSharedValue,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import { PanGestureHandler, PanGestureHandlerGestureEvent, TapGestureHandler } from "react-native-gesture-handler";
import { between, useVector } from "react-native-redash";
import { calculateLayout, lastOrder, Offset, remove, reorder } from "./Layout";
import type { DuoAnimatedStyleWorklet } from "./types";
import type { DuoWordAnimatedStyle } from ".";

export interface SortableWordProps {
  animatedStyleWorklet?: DuoAnimatedStyleWorklet;
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
}: SortableWordProps) => {
  const offset = offsets[index];
  const isGestureActive = useSharedValue(false);
  const isAnimating = useSharedValue(false);
  const translation = useVector();
  const isInBank = useDerivedValue(() => offset.order.value === -1);

  const onGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { x: number; y: number }>({
    onStart(_, ctx) {
      if (isAnimating.value) {
        return;
      }
      if (isInBank.value) {
        translation.x.value = offset.originalX.value;
        translation.y.value = offset.originalY.value + wordBankOffsetY;
      } else {
        translation.x.value = offset.x.value;
        translation.y.value = offset.y.value;
      }

      ctx.x = translation.x.value;
      ctx.y = translation.y.value;
    },
    onActive({ translationX, translationY }, ctx) {
      isGestureActive.value = true;
      translation.x.value = ctx.x + translationX;
      translation.y.value = ctx.y + translationY;

      if (isInBank.value && translation.y.value < linesHeight) {
        offset.order.value = lastOrder(offsets);
        calculateLayout(offsets, containerWidth, wordHeight, wordGap, rtl);
      } else if (!isInBank.value && translation.y.value > linesHeight - wordHeight / 2) {
        offset.order.value = -1;
        remove(offsets, index);
        calculateLayout(offsets, containerWidth, wordHeight, wordGap, rtl);
      }

      for (let i = 0; i < offsets.length; i++) {
        const o = offsets[i];
        if (i === index && o.order.value !== -1) {
          continue;
        }
        const isInBank = o.order.value === -1;
        const x = isInBank ? o.originalX.value : o.x.value;
        const y = isInBank ? o.originalY.value + wordBankOffsetY : o.y.value;
        if (
          between(translation.x.value, x, x + o.width.value, false) &&
          between(translation.y.value, y, y + wordHeight) && // NOTE: check y value when interacting with bottom
          offset.order.value !== o.order.value
        ) {
          reorder(offsets, offset.order.value, o.order.value);
          calculateLayout(offsets, containerWidth, wordHeight, wordGap, rtl);
          break;
        }
      }
    },
    onEnd() {
      isAnimating.value = true;
      translation.x.value = offset.x.value;
      translation.y.value = offset.y.value;
      isGestureActive.value = false;
    },
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
      height: wordHeight + 2,
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    };
    return (animatedStyleWorklet?.(style, isGestureActive.value) || style) as ViewStyle;
  });
  return (
    <Animated.View style={style}>
      {gesturesDisabled ? (
        <Animated.View style={StyleSheet.absoluteFill}>{children}</Animated.View>
      ) : (
        <PanGestureHandler enabled={true} onGestureEvent={onGestureEvent}>
          <Animated.View style={StyleSheet.absoluteFill}>
            <TapGestureHandler
              enabled={true}
              onActivated={() => {
                if (isInBank.value) {
                  offset.order.value = lastOrder(offsets);
                } else {
                  offset.order.value = -1;
                  remove(offsets, index);
                }

                isAnimating.value = true;
                setTimeout(() => {
                  calculateLayout(offsets, containerWidth, wordHeight, wordGap, rtl);
                  translation.x.value = offset.x.value;
                  translation.y.value = offset.y.value;
                }, 16);
              }}
            >
              <Animated.View>{children}</Animated.View>
            </TapGestureHandler>
          </Animated.View>
        </PanGestureHandler>
      )}
    </Animated.View>
  );
};

export default React.memo(SortableWord);
