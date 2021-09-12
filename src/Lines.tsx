import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { colors } from "./colors";

export default function Lines(props: {
  numLines: number;
  containerHeight: number;
  lineHeight: number;
  lineStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const arr = new Array(props.numLines).fill(0);

  return (
    <View style={[{ height: props.containerHeight }, props.containerStyle]}>
      {arr.map((_, idx) => (
        <View
          key={`line.${idx}`}
          style={[
            { borderBottomWidth: 2, borderBottomColor: colors.grey, height: props.lineHeight + 2 },
            idx === 0 && { borderTopWidth: 2, borderTopColor: colors.grey },
            props.lineStyle,
          ]}
        />
      ))}
    </View>
  );
}
