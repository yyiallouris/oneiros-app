import React from 'react';
import { LoadingState, LoadingStateProps } from './LoadingState';

interface ActionLoadingSlotProps {
  loading: boolean;
  children: React.ReactNode;
  loadingProps: LoadingStateProps;
}

/**
 * Replaces an action control (button row, CTA) with the shared loading visual while work is in flight.
 * Rule: hide the trigger control — do not spin inside the button.
 */
export const ActionLoadingSlot: React.FC<ActionLoadingSlotProps> = ({
  loading,
  children,
  loadingProps,
}) => {
  if (loading) {
    return <LoadingState {...loadingProps} testID={loadingProps.testID ?? 'action-loading-state'} />;
  }

  return <>{children}</>;
};
