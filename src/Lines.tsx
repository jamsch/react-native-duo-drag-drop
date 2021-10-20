import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "./colors";

interface LinesProps {
  numLines: number;
  containerHeight: number;
  lineHeight: number;
  lineStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  renderTopLine?: boolean;
}

export default function Lines(props: LinesProps) {
  const { containerHeight, containerStyle, numLines, lineHeight, lineStyle, renderTopLine = true } = props;
  const arr = new Array(numLines).fill(0);

  return (
    <View style={[{ height: containerHeight }, containerStyle]}>
      {arr.map((_, idx) => (
        <View
          key={`line.${idx}`}
          style={[{ height: lineHeight }, styles.line, idx === 0 && renderTopLine && styles.firstLine, lineStyle]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { borderBottomWidth: 2, borderBottomColor: colors.grey },
  firstLine: { borderTopWidth: 2, borderTopColor: colors.grey },
});
