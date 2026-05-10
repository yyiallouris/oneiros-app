import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { IS_DESIGN_EXPORT_BACKGROUND_ONLY } from '../../designExport';

interface DesignExportForegroundProps extends ViewProps {
  fill?: boolean;
}

export const DesignExportForeground: React.FC<DesignExportForegroundProps> = ({
  children,
  fill = false,
  pointerEvents,
  style,
  ...rest
}) => (
  <View
    {...rest}
    pointerEvents={IS_DESIGN_EXPORT_BACKGROUND_ONLY ? 'none' : pointerEvents}
    importantForAccessibility={
      IS_DESIGN_EXPORT_BACKGROUND_ONLY ? 'no-hide-descendants' : rest.importantForAccessibility
    }
    style={[
      fill && styles.fill,
      style,
      IS_DESIGN_EXPORT_BACKGROUND_ONLY && styles.backgroundOnlyHidden,
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  backgroundOnlyHidden: {
    opacity: 0,
  },
});
