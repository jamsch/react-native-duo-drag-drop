import React, { useContext } from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from "react-native";
import { WordContext } from "./DuoDragDrop";
import { colors } from "./colors";

export interface WordProps {
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function Word({ containerStyle, textStyle }: WordProps) {
  const { wordHeight, text, wordGap } = useContext(WordContext);

  return (
    <View style={[styles.root, { margin: wordGap }]}>
      <View>
        <View style={[styles.container, { height: wordHeight }, containerStyle]}>
          <Text style={[styles.text, textStyle]} allowFontScaling={false} numberOfLines={1}>
            {text}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.grey,
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  root: {
    margin: 4,
  },
  text: {
    fontSize: 16,
  },
});
