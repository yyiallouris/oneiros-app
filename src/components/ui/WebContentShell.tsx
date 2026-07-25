import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { backgrounds } from '../../theme';
import { layout, resolveWebContentWidth } from '../../theme/layout';
import { WebLayoutProvider } from '../../layout/WebLayoutContext';
import { DESIGN_EXPORT_MODE } from '../../designExport';
import { PaperBackground } from './PaperBackground';

const WEB_VIEWPORT_STYLE_ID = 'oneiros-web-viewport';

type WebContentShellProps = {
  children: React.ReactNode;
};

/**
 * On Expo web (normal browsing), centers a phone-scale content column so the
 * mobile UI stays readable on tablet/desktop. Native and design-export builds
 * pass children through unchanged.
 */
export const WebContentShell: React.FC<WebContentShellProps> = ({ children }) => {
  const { width: windowWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  const isWebShellActive = Platform.OS === 'web' && !DESIGN_EXPORT_MODE;

  useEffect(() => {
    if (!isWebShellActive || typeof document === 'undefined') {
      return;
    }

    if (document.getElementById(WEB_VIEWPORT_STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');
    style.id = WEB_VIEWPORT_STYLE_ID;
    style.textContent = `
      html, body, #root {
        height: 100%;
        height: 100dvh;
        margin: 0;
        overflow: hidden;
        background: ${backgrounds.secondary};
      }
      #root, #root > div {
        height: 100%;
        min-height: 100%;
      }
    `;
    document.head.appendChild(style);
  }, [isWebShellActive]);

  const targetWidth = useMemo(
    () => resolveWebContentWidth(windowWidth),
    [windowWidth]
  );

  const contentWidth = measuredWidth && measuredWidth > 0 ? measuredWidth : targetWidth;
  const showOuterAtmosphere = isWebShellActive && windowWidth > targetWidth + 1;

  const onColumnLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next > 0 && next !== measuredWidth) {
      setMeasuredWidth(next);
    }
  };

  if (!isWebShellActive) {
    return (
      <WebLayoutProvider contentWidth={windowWidth || layout.contentMaxWidth} isWebShellActive={false}>
        {children}
      </WebLayoutProvider>
    );
  }

  return (
    <WebLayoutProvider contentWidth={contentWidth} isWebShellActive>
      <View style={styles.outer} testID="web-content-shell-outer">
        {showOuterAtmosphere ? <PaperBackground style={styles.outerPaper} /> : null}
        <View
          style={[
            styles.column,
            {
              maxWidth: targetWidth,
              width: windowWidth <= targetWidth ? '100%' : targetWidth,
            },
            showOuterAtmosphere ? styles.columnElevated : null,
          ]}
          onLayout={onColumnLayout}
          testID="web-content-shell-column"
        >
          {children}
        </View>
      </View>
    </WebLayoutProvider>
  );
};

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: backgrounds.secondary,
  },
  outerPaper: {
    opacity: 0.55,
  },
  column: {
    flex: 1,
    height: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: backgrounds.primary,
  },
  columnElevated: Platform.select({
    web: {
      // Keep absolute tab bars / overlays clipped to the phone column on wide desks.
      boxShadow: '0 0 0 1px rgba(45, 36, 48, 0.06), 0 18px 48px rgba(45, 36, 48, 0.08)',
    },
    default: {
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(45, 36, 48, 0.08)',
    },
  }) as object,
});
