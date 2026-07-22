import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { borderRadius, colors, spacing } from '../../theme';

type Props = {
  children: React.ReactNode;
  initialIndex?: number;
  indicatorPosition?: 'top' | 'bottom';
  onIndexChange?: (index: number) => void;
  testID?: string;
};

const CARD_GAP = spacing.md;
const MAX_CARD_WIDTH = 430;

export const SubscriptionPlanCarousel: React.FC<Props> = ({
  children,
  initialIndex = 0,
  indicatorPosition = 'bottom',
  onIndexChange,
  testID,
}) => {
  const cards = useMemo(() => React.Children.toArray(children), [children]);
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const hasPositionedRef = useRef(false);

  const availableWidth = containerWidth ?? windowWidth - spacing.lg * 2;
  const cardWidth = Math.min(MAX_CARD_WIDTH, Math.max(availableWidth - spacing.xl * 1.5, 280));
  const sideInset = Math.max((availableWidth - cardWidth) / 2, 0);
  const snapInterval = cardWidth + CARD_GAP;

  const updateActiveIndex = (nextIndex: number) => {
    setActiveIndex(nextIndex);
    onIndexChange?.(nextIndex);
  };

  useEffect(() => {
    updateActiveIndex(initialIndex);
    hasPositionedRef.current = false;
  }, [initialIndex, cards.length]);

  useEffect(() => {
    if (containerWidth === null || hasPositionedRef.current) return;

    const boundedIndex = Math.min(Math.max(initialIndex, 0), Math.max(cards.length - 1, 0));
    const targetOffset = boundedIndex * snapInterval;

    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ x: targetOffset, y: 0, animated: false });
      updateActiveIndex(boundedIndex);
      hasPositionedRef.current = true;
    });
  }, [cards.length, containerWidth, initialIndex, snapInterval]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (!nextWidth || nextWidth === containerWidth) return;
    setContainerWidth(nextWidth);
  };

  const indicators = cards.length > 1 ? (
    <View
      style={[
        styles.dotsRow,
        indicatorPosition === 'top' ? styles.dotsRowTop : styles.dotsRowBottom,
      ]}
      testID={testID ? `${testID}-indicators-${indicatorPosition}` : undefined}
    >
      {cards.map((_, index) => (
        <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
      ))}
    </View>
  ) : null;

  return (
    <View style={styles.carouselWrap} onLayout={handleLayout} testID={testID}>
      {indicatorPosition === 'top' ? indicators : null}

      <ScrollView
        ref={scrollViewRef}
        testID={testID ? `${testID}-scroll` : undefined}
        horizontal
        nestedScrollEnabled
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        disableIntervalMomentum={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.track,
          {
            paddingHorizontal: sideInset,
          },
        ]}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
          updateActiveIndex(Math.min(Math.max(nextIndex, 0), Math.max(cards.length - 1, 0)));
        }}
      >
        {cards.map((card, index) => (
          <View
            key={index}
            style={[
              styles.cardFrame,
              {
                width: cardWidth,
                marginRight: index === cards.length - 1 ? 0 : CARD_GAP,
              },
            ]}
          >
            {card}
          </View>
        ))}
      </ScrollView>

      {indicatorPosition === 'bottom' ? indicators : null}
    </View>
  );
};

const styles = StyleSheet.create({
  carouselWrap: {
    width: '100%',
  },
  track: {
    alignItems: 'stretch',
  },
  cardFrame: {
    flexShrink: 0,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dotsRowTop: {
    marginBottom: spacing.md,
  },
  dotsRowBottom: {
    marginTop: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(140, 130, 144, 0.3)',
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.buttonPrimary,
  },
});
