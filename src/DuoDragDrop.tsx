/* eslint-disable react-hooks/rules-of-hooks */
import React, { createContext, Fragment, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { View, StyleSheet, LayoutRectangle } from "react-native";
import { useSharedValue, runOnUI } from "react-native-reanimated";
import SortableWord from "./SortableWord";
import { calculateLayout, Offset } from "./Layout";
import Word from "./Word";
import Placeholder from "./Placeholder";
import Lines from "./Lines";

export interface DuoDragDropProps {
  words: string[];
  /** Height of an individual word. Default: 45 */
  wordHeight?: number;
  /** The gap between each word / line: Default: 4 */
  wordGap?: number;
  /** The margin between the "Bank" pile and the "Answer" pile. Default: 20 */
  wordBankOffsetY?: number;
  /** Whether to lay out words in the "Answer" pile from right-to-left (for languages such as Arabic) */
  rtl?: boolean;
  /** Whether tap & drag gestures are disabled. Default: false */
  gesturesDisabled?: boolean;
  /** The offset between the "Bank" pile and the "Answer" pile. Default: 20 */
  wordBankAlignment?: "center" | "left" | "right";
  /** Overrides the default Word renderer */
  renderWord?: (word: string, index: number) => JSX.Element;
  /** Overrides the default Lines renderer */
  renderLines?: (props: { numLines: number; containerHeight: number; lineHeight: number }) => JSX.Element;
  /** Overrides the default Placeholder renderer */
  renderPlaceholder?:
    | ((props: {
        style: {
          position: "absolute";
          height: number;
          top: number;
          left: number;
          width: number;
        };
      }) => JSX.Element)
    | null;
}

export const WordContext = createContext({ wordHeight: 55, text: "", wordGap: 4 });

export type DuoDragDropRef = {
  /** Returns an ordered list of words that are in the "word bank" as well as answered */
  getWords(): { answered: string[]; bank: string[] };
  /** Returns an array of words that are outside the "word bank" */
  getAnsweredWords(): string[];
  /* Gets the order value of each word by their index */
  getOffsets(): number[];
  /* Animates the word buttons to move to new positions */
  setOffsets(newOffsets: number[]): void;
};

const DuoDragDrop = React.forwardRef<DuoDragDropRef, DuoDragDropProps>(
  (
    {
      words,
      renderWord,
      renderLines,
      renderPlaceholder,
      rtl,
      gesturesDisabled,
      wordBankAlignment = "center",
      wordGap = 4,
      wordBankOffsetY = 20,
      wordHeight = 45,
    },
    ref,
  ) => {
    const [numLines, setNumLines] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);

    const wordElements = useMemo(() => {
      return words.map((word, index) => (
        <WordContext.Provider key={word} value={{ wordHeight, wordGap, text: word }}>
          {renderWord?.(word, index) || <Word />}
        </WordContext.Provider>
      ));
    }, [words]);

    // if word input has changed, force a re-render of the component

    const offsets = words.map(() => ({
      order: useSharedValue(0),
      width: useSharedValue(0),
      height: useSharedValue(0),
      x: useSharedValue(0),
      y: useSharedValue(0),
      originalX: useSharedValue(0),
      originalY: useSharedValue(0),
    }));

    useImperativeHandle(ref, () => ({
      getWords: () => {
        const answeredWords = [];
        const bankWords = [];
        for (let i = 0; i < offsets.length; i++) {
          const offset = offsets[i];
          const word = words[i];
          if (offset.order.value !== -1) {
            answeredWords.push({ word, order: offset.order.value });
          } else {
            bankWords.push({ word, order: offset.order.value });
          }
        }
        return {
          answered: answeredWords.sort((a, b) => a.order - b.order).map((w) => w.word),
          bank: bankWords.sort((a, b) => a.order - b.order).map((w) => w.word),
        };
      },
      // Returns an array of words that are outside the "word bank"
      getAnsweredWords: () => {
        const answeredWords = [];
        for (let i = 0; i < offsets.length; i++) {
          const offset = offsets[i];
          if (offset.order.value !== -1) {
            const word = words[i];
            answeredWords.push({ word, order: offset.order.value });
          }
        }
        // Sort by the order, and return the words in an ordered array
        return answeredWords.sort((a, b) => a.order - b.order).map((w) => w.word);
      },
      // Gets the order value of each word by their index
      getOffsets() {
        return offsets.map((o) => o.order.value);
      },
      // Animates the word buttons to move to new positions
      setOffsets(newOffsets: number[]) {
        runOnUI(() => {
          for (let i = 0; i < newOffsets.length; i++) {
            offsets[i].order.value = newOffsets[i];
          }
          setTimeout(() => calculateLayout(offsets, containerWidth, wordHeight, wordGap, rtl), 16);
        })();
      },
    }));

    const initialized = numLines > 0 && containerWidth > 0;

    // Toggle right-to-left layout
    useEffect(() => {
      if (initialized) {
        runOnUI(() => {
          calculateLayout(offsets, containerWidth, wordHeight, wordGap, rtl);
        })();
      }
    }, [rtl, initialized]);

    // We first have to render the (opacity=0) child components in order to obtain x/y/width/height of every word segment
    // This will allow us to position the elements in the Lines

    if (!initialized) {
      return (
        <CalcOffsets
          offsets={offsets}
          onContainerWidth={setContainerWidth}
          onLines={setNumLines}
          wordHeight={wordHeight}
          wordBankAlignment={wordBankAlignment}
          wordBankOffsetY={wordBankOffsetY}
        >
          {wordElements}
        </CalcOffsets>
      );
    }

    const linesHeight = numLines * (wordHeight + wordGap * 2) || wordHeight;

    const PlaceholderComponent = renderPlaceholder || Placeholder;
    const LinesComponent = renderLines || Lines;

    return (
      <View style={styles.container}>
        <LinesComponent numLines={numLines} containerHeight={linesHeight} lineHeight={wordHeight + wordGap + 2} />
        {wordElements.map((child, index) => (
          <Fragment key={`${words[index]}.${index}`}>
            {renderPlaceholder === null ? null : (
              <PlaceholderComponent
                style={{
                  position: "absolute",
                  height: wordHeight,
                  top: offsets[index].originalY.value + wordBankOffsetY + wordGap,
                  left: offsets[index].originalX.value + wordGap,
                  width: offsets[index].width.value - wordGap * 2,
                }}
              />
            )}
            <SortableWord
              offsets={offsets}
              index={index}
              rtl={Boolean(rtl)}
              containerWidth={containerWidth}
              gesturesDisabled={Boolean(gesturesDisabled)}
              linesHeight={linesHeight}
              wordHeight={wordHeight}
              wordGap={wordGap}
              wordBankOffsetY={wordBankOffsetY}
            >
              {child}
            </SortableWord>
          </Fragment>
        ))}
      </View>
    );
  },
);

interface CalcOffsetsProps {
  children: JSX.Element[];
  offsets: Offset[];
  onLines(numLines: number): void;
  onContainerWidth(width: number): void;
  wordBankAlignment: "center" | "left" | "right";
  wordBankOffsetY: number;
  wordHeight: number;
}

function CalcOffsets({
  children,
  offsets,
  onLines,
  onContainerWidth,
  wordHeight,
  wordBankAlignment,
  wordBankOffsetY,
}: CalcOffsetsProps) {
  const calculatedOffsets = useRef<LayoutRectangle[]>([]);

  return (
    <View
      style={[styles.hiddenRow, styles[wordBankAlignment]]}
      onLayout={(e) => {
        onContainerWidth(e.nativeEvent.layout.width);
      }}
    >
      {children.map((child, index) => {
        return (
          <View
            key={index}
            onLayout={(e) => {
              const { x, y, width, height } = e.nativeEvent.layout;
              calculatedOffsets.current[index] = { width, height, x, y };
              if (calculatedOffsets.current.length === children.length) {
                const numLines = new Set();
                for (const index in calculatedOffsets.current) {
                  const { y } = calculatedOffsets.current[index];
                  numLines.add(y);
                }
                const numLinesSize = numLines.size < 3 ? numLines.size + 1 : numLines.size;
                const linesHeight = numLinesSize * wordHeight;
                for (const index in calculatedOffsets.current) {
                  const { x, y, width } = calculatedOffsets.current[index];
                  const offset = offsets[index];
                  offset.order.value = -1;
                  offset.width.value = width;
                  offset.originalX.value = x;
                  offset.originalY.value = y + linesHeight + wordBankOffsetY;
                }

                onLines(numLinesSize);
              }
            }}
          >
            {child}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hiddenRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    alignSelf: "center",
    opacity: 0,
    backgroundColor: "pink",
  },
  center: {
    justifyContent: "center",
  },
  right: {
    justifyContent: "flex-end",
  },
  left: {
    justifyContent: "flex-start",
  },
});

const DuoDragDropInstance = React.forwardRef<DuoDragDropRef, DuoDragDropProps>((props, ref) => {
  const wordsKey = JSON.stringify(props.words);
  // We need to re-mount the component if words are modified to avoid hook mismatches. "useSharedValue" is initialized on every word
  return <DuoDragDrop ref={ref} {...props} key={wordsKey} />;
});

export default React.memo(DuoDragDropInstance);
