# @jamsch/react-native-duo-drag-drop

Duolingo-style drag and drop for React Native using `react-native-gesture-handler` & `react-native-reanimated`. This library is heavily inspired by the work done by William Candillon in his video: [_Duolingo Drag-and-drop - "Can it be done in React Native?"_](https://www.youtube.com/watch?v=tHWGKdpj1rs)

![https://i.imgur.com/1YkxXk3.gif](https://i.imgur.com/1YkxXk3.gif)

## Prerequisites

Please make sure you have the the following dependencies installed in your project before continuing:

- react-native >= 0.64
- react-native-reanimated >= 2.2
- react-native-gesture-handler >= 1.10

## Installation

```sh
npm install @jamsch/react-native-duo-drag-drop
```

## Basic Usage

```tsx
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DuoDragDrop from "@jamsch/react-native-duo-drag-drop";

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ margin: 20 }}>
        <DuoDragDrop words={["Juan", "She", "apples", "today", "with", "eats", "her", "another"]} />
      </View>
    </GestureHandlerRootView>
  );
}

export default App;
```

## DuoDragDrop props

| Prop                 | Type                                                                                      | Description                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| words                | string[]                                                                                  | List of words that will be used for the drag-and-drop                                         |
| extraData            | any?                                                                                      | (Optional) A marker property for telling the words to re-render                               |
| wordHeight           | number?                                                                                   | (Optional) height of an individual word. Default: 45                                          |
| wordGap              | number?                                                                                   | (Optional) The gap between each word / line: Default: 4                                       |
| lineHeight           | number?                                                                                   | (Optional) The height of a single line in the top "answered" pile. Default: wordHeight \* 1.2 |
| wordBankOffsetY      | number?                                                                                   | (Optional) The offset between the "Bank" pile and the "Answer" pile. Default: 20              |
| wordBankAlignment    | "center" \| "right" \| "left"                                                             | (Optional) Alignment of the words in the word bank. Default "center"                          |
| gesturesDisabled     | boolean?                                                                                  | (Optional) Whether tap & drag gestures are disabled. Default: false                           |
| rtl                  | boolean?                                                                                  | (Optional) Whether to lay out words in the "Answer" pile from right-to-left (e.g.Arabic)      |
| renderWord           | (word: string, index: number) => JSX.Element                                              | (Optional) Overrides the default word renderer                                                |
| renderPlaceholder    | (props: {style: StyleProp\<ViewStyle\>}) => JSX.Element                                   | (Optional) Overrides the default placeholder renderer                                         |
| renderLines          | (props: { numLines: number; containerHeight: number; lineHeight: number }) => JSX.Element | (Optional) Overrides the default lines renderer                                               |
| animatedStyleWorklet | (style: ViewStyle, isGestureActive: boolean) => ViewStyle                                 | (Optional) A worket function that allows style modifications while gestures are active.       |
| onReady              | (ready: boolean) => void                                                                  | (Optional) Runs when the drag-and-drop has rendered or re-initializing.                       |

## DuoDragDrop ref value

```ts
/** Returns an ordered list of words that are in the "word bank" as well as answered */
getWords(): { answered: string[]; bank: string[] };
/** Returns an array of words that are outside the "word bank" */
getAnsweredWords(): string[];
/**
* Gets the order value of each word by the word's index.
* -1 indicates that it's in the "bank"
*
* e.g. ["hello", "world", "foo", "bar"] -> [1, -1, 0, 2] corresponds to:
* - ["hello", "foo", "bar"] (unordered) or
* - ["foo", "hello", "bar"] (ordered) in the "answered" pile
* - and ["world"] in the "bank" pile
*/
getOffsets(): number[];
/* Animates the word buttons to move to new positions */
setOffsets(newOffsets: number[]): void;
```

## Fetching words in the "bank" or "answered" pile

You can use refs to find whether words are in the "answered" pile or in the "bank".

As a reference, the "word bank" is the list of words at the bottom, and the "answered" words are the list of words the user has dragged up in to the lines.

```tsx
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DuoDragDrop, { DuoDragDropRef } from "@jamsch/react-native-duo-drag-drop";

function App() {
  const ref = useRef<DuoDragDropRef>(null);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ margin: 20, minHeight: 300 }}>
        <DuoDragDrop ref={ref} words={["Juan", "She", "apples", "today", "with", "eats", "her", "another"]} />
      </View>
      <Button
        title="Get words"
        onPress={() => {
          const answered = ref.current?.getAnsweredWords();
          console.log(answered); // ["Juan", "She"]
          const words = ref.current?.getWords();
          console.log(words); // { answered: ["Juan", "She"], bank: ["today", "with", ...] }
        }}
      />
    </GestureHandlerRootView>
  );
}

export default App;
```

## Customising Words/Lines/Placeholders

You can either customise the default "Word"/"Lines"/"Placeholder" components or provide your own components. For example:

```tsx
import DuoDragDrop, { Word, Lines, Placeholder } from "@jamsch/react-native-duo-drag-drop";

function DndExample() {
  return (
    <DuoDragDrop
      words={["Juan", "She", "apples", "today", "with", "eats", "her", "another"]}
      renderWord={(word, index) => (
        <Word
          containerStyle={{
            backgroundColor: "teal",
          }}
          textStyle={{
            color: index % 2 === 0 ? "white" : "black",
          }}
        />
      )}
      // Change the border radius of the default Placeholder
      renderPlaceholder={({ style }) => <Placeholder style={[style, { borderRadius: 5 }]} />}
      // Modify the container/line style of Lines.
      renderLines={(props) => (
        <Lines {...props} containerStyle={{ backgroundColor: "transparent" }} lineStyle={{ borderColor: "#CCC" }} />
      )}
    />
  );
}
```

## Customising animations

You can customise how the words are animated by providing a worklet function.

```tsx
import DuoDragDrop, { DuoAnimatedStyleWorklet } from "@jamsch/react-native-duo-drag-drop";
import { withTiming, withSpring } from "react-native-reanimated";

const customAnimatedStyle: DuoAnimatedStyleWorklet = (style, isGestureActive) => {
  "worklet";
  // Scale the word when the gesture is active
  style.transform.push({
    scale: withTiming(isGestureActive ? 1.5 : 1, { duration: 250 }),
  });
  style.opacity = withTiming(isGestureActive ? 0.8 : 1, { duration: 250 });
  style.top = withTiming(isGestureActive ? -10 : 0, { duration: 250 });

  // Apply a spring when the word moves to it's destination
  if (!isGestureActive) {
    style.transform[0].translateX = withSpring(style.transform[0].translateX);
    style.transform[1].translateY = withSpring(style.transform[1].translateY);
  }

  return style;
};

export default function DragDrop() {
  return (
    <DuoDragDrop
      words={["Juan", "She", "apples", "today", "with", "eats", "her", "another"]}
      animatedStyleWorklet={customAnimatedStyle}
    />
  );
}
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
