/* eslint-disable react-native/no-inline-styles */
import "react-native-gesture-handler";
import { useRef, useState } from "react";
import { StyleSheet, View, Text, Button, SafeAreaView } from "react-native";
import DuoDragDrop, {
  DuoDragDropRef,
  Word,
  Placeholder,
  Lines,
  DuoAnimatedStyleWorklet,
} from "@jamsch/react-native-duo-drag-drop";
import { GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";
import { withSpring, withTiming } from "react-native-reanimated";

const customAnimatedStyle: DuoAnimatedStyleWorklet = (style, isGestureActive) => {
  "worklet";
  // Scale the word when the gesture is active
  style.transform.push({
    scale: withTiming(isGestureActive ? 1.5 : 1, { duration: 200 }),
  });
  style.opacity = withTiming(isGestureActive ? 0.8 : 1, { duration: 200 });
  style.top = withTiming(isGestureActive ? -10 : 0, { duration: 200 });

  // Apply a spring when the word moves to it's destination
  if (!isGestureActive) {
    style.transform[0].translateX = withSpring(style.transform[0].translateX);
    style.transform[1].translateY = withSpring(style.transform[1].translateY);
  }

  return style;
};

export default function App() {
  const [rtl, setRtl] = useState(false);
  const [gradeWords, setGradeWords] = useState<boolean[]>([]);
  const [gesturesDisabled, setGesturesDisabled] = useState(false);
  const [answeredWords, setAnsweredWords] = useState<string[] | null>(null);
  const [shouldUseCustomWorket, setShouldUseCustomWorket] = useState(false);
  const duoDragDropRef = useRef<DuoDragDropRef>(null);
  const [log, setLog] = useState<string[]>([]);

  const words = ["Juan", "She", "apples", "today", "with", "eats", "her", "another"];

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.dragDropContainer}>
            <DuoDragDrop
              ref={duoDragDropRef}
              words={words}
              wordHeight={40}
              lineHeight={49}
              wordGap={4}
              gesturesDisabled={gesturesDisabled}
              rtl={rtl}
              wordBankOffsetY={10}
              wordBankAlignment="center"
              extraData={gradeWords}
              animatedStyleWorklet={shouldUseCustomWorket ? customAnimatedStyle : undefined}
              onDrop={(ev) => {
                const { destination, index, position } = ev;
                setLog((l) => [
                  ...l,
                  `[onDrop] Dropped word '${words[index]}' on '${destination}' at position ${position}`,
                ]);
              }}
              renderWord={(_word, index) => (
                <Word
                  containerStyle={
                    typeof gradeWords?.[index] === "boolean" && {
                      backgroundColor: gradeWords?.[index] ? "green" : "red",
                      borderColor: gradeWords?.[index] ? "green" : "red",
                    }
                  }
                  textStyle={{
                    color: typeof gradeWords?.[index] === "boolean" ? "white" : "black",
                  }}
                />
              )}
              renderPlaceholder={({ style }) => <Placeholder style={[style, { borderRadius: 5 }]} />}
              renderLines={(props) => (
                <Lines
                  {...props}
                  containerStyle={{ backgroundColor: "transparent" }}
                  lineStyle={{ borderColor: "#CCC" }}
                />
              )}
            />
            <Button
              title="Get answered words"
              onPress={() => setAnsweredWords(duoDragDropRef.current?.getAnsweredWords() || [])}
            />
            {answeredWords && (
              <View style={{ marginTop: 10 }}>
                <Text>{JSON.stringify(answeredWords)}</Text>
              </View>
            )}
            <View style={{ marginTop: 10 }}>
              <Button
                title="Grade words"
                onPress={() => {
                  if (gradeWords.length > 0) {
                    setGradeWords([]);
                  } else {
                    setGradeWords([true, false, true, false, false, true, false, false]);
                  }
                }}
              />
            </View>
            <View style={{ marginTop: 10 }}>
              <Button title={`Gestures disabled: ${gesturesDisabled}`} onPress={() => setGesturesDisabled((s) => !s)} />
            </View>
            <View style={{ marginTop: 10 }}>
              <Button
                title={`Use custom animations: ${shouldUseCustomWorket}`}
                onPress={() => setShouldUseCustomWorket((s) => !s)}
              />
            </View>
            <View style={{ marginTop: 10 }}>
              <Button title={`Right-To-Left: ${rtl}`} onPress={() => setRtl((s) => !s)} />
            </View>
          </View>
        </ScrollView>
        <View style={styles.logContainer}>
          <Text style={styles.debugLogText}>EVENT LOG</Text>
          <ScrollView>
            {log.map((l, i) => (
              <Text key={i}>{l}</Text>
            ))}
            {log.length === 0 && <Text>No events</Text>}
          </ScrollView>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dragDropContainer: {
    margin: 20,
    flex: 1,
  },
  debugLogText: {
    fontWeight: "500",
  },
  logContainer: {
    height: 130,
    padding: 5,
  },
});
