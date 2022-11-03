import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "./colors";

interface PlaceholderProps {
  style: StyleProp<ViewStyle>;
}

export default function Placeholder({ style }: PlaceholderProps) {
  return <View style={[styles.placeholder, style]} />;
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.grey,
    borderRadius: 8,
  },
});
