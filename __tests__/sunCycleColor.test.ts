import { act, renderHook } from '@testing-library/react-native';
import { useSunCycleColor } from '../src/theme/sunCycleColor';

describe('useSunCycleColor', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts at the first palette color and interpolates over time', () => {
    const { result } = renderHook(() => useSunCycleColor());
    expect(result.current).toBe('#fc2947');

    act(() => {
      jest.advanceTimersByTime(30_000);
    });

    expect(result.current).toBe('#fd4646');
  });
});
