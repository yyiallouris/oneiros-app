import React, { createContext, useContext, useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { layout, resolveWebContentWidth } from '../theme/layout';

export type WebLayoutValue = {
  /** Measured or resolved width of the app content column. */
  contentWidth: number;
  /** True when the browser is wider than the content column (desktop gutters visible). */
  isConstrained: boolean;
  /** Platform is web and normal browsing (not design-export phone frame). */
  isWebShellActive: boolean;
};

const WebLayoutContext = createContext<WebLayoutValue | null>(null);

export type WebLayoutProviderProps = {
  contentWidth: number;
  isWebShellActive: boolean;
  children: React.ReactNode;
};

export const WebLayoutProvider: React.FC<WebLayoutProviderProps> = ({
  contentWidth,
  isWebShellActive,
  children,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const value = useMemo<WebLayoutValue>(
    () => ({
      contentWidth,
      isConstrained: isWebShellActive && windowWidth > contentWidth,
      isWebShellActive,
    }),
    [contentWidth, isWebShellActive, windowWidth]
  );

  return <WebLayoutContext.Provider value={value}>{children}</WebLayoutContext.Provider>;
};

/**
 * Width of the readable app column. On native (and when the shell is inactive)
 * this matches the window width. Prefer this over `Dimensions.get('window')`
 * for horizontal pagers and size-bound UI inside the web shell.
 */
export function useContentWidth(): number {
  const ctx = useContext(WebLayoutContext);
  const { width: windowWidth } = useWindowDimensions();

  if (ctx?.contentWidth && ctx.contentWidth > 0) {
    return ctx.contentWidth;
  }

  if (Platform.OS === 'web') {
    return resolveWebContentWidth(windowWidth);
  }

  return windowWidth > 0 ? windowWidth : layout.contentMaxWidth;
}

export function useWebLayout(): WebLayoutValue {
  const ctx = useContext(WebLayoutContext);
  const { width: windowWidth } = useWindowDimensions();

  if (ctx) {
    return ctx;
  }

  const contentWidth =
    Platform.OS === 'web' ? resolveWebContentWidth(windowWidth) : windowWidth;

  return {
    contentWidth,
    isConstrained: Platform.OS === 'web' && windowWidth > contentWidth,
    isWebShellActive: false,
  };
}
