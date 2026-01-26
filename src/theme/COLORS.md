# Color System Guide

## Overview

All colors used in the app are centralized in `src/theme/colors.ts`. **Never use hardcoded colors** - always import from the color system.

## Import Methods

### Method 1: Flat Object (Backward Compatible)
```typescript
import { colors } from '../theme';

// Usage
backgroundColor: colors.background
color: colors.textPrimary
borderColor: colors.border
```

### Method 2: Grouped Exports (Recommended)
```typescript
import { backgrounds, text, accent, semantic, borders } from '../theme';

// Usage
backgroundColor: backgrounds.primary
color: text.primary
borderColor: borders.primary
```

## Color Groups

### 🎨 Backgrounds
- `backgrounds.primary` - Main app background (#F4EFEA)
- `backgrounds.secondary` - Card backgrounds (#EDE6DF)
- `backgrounds.cardTransparent` - Semi-transparent cards
- `backgrounds.overlay` - Dark overlays
- `backgrounds.backdrop` - Light backdrops

### 📝 Text
- `text.primary` - Main text color (#3A2F2A)
- `text.secondary` - Secondary text (#6E625B)
- `text.muted` - Placeholder/muted text (#9A8F88)
- `text.white` - White text for dark backgrounds

### ✨ Accent
- `accent.primary` - Main accent color (#A89CCF)
- `accent.light` - Light accent (#C3B8E0)
- `accent.dark` - Dark accent (#7E70A8)
- `accent.turquoise*` - Turquoise variants for animations
- `accent.orange` - Warm orange for calendar

### 🚦 Semantic
- `semantic.success` - Success states (#4CAF50)
- `semantic.error` - Error states (#FF3B30)
- `semantic.warning` - Warning states (#FFA726)
- `semantic.info` - Info states (#2196F3)

### 🔲 Borders
- `borders.primary` - Main border (#E2D8CC)
- `borders.input` - Input borders (#D8CEC2)
- `borders.divider` - Divider lines (#EAE0D4)

### 🌈 Gradients
- `gradients.mountainStart` - Mountain wave start
- `gradients.mountainMid` - Mountain wave middle
- `gradients.mountainEnd` - Mountain wave end
- `gradients.sunMoon*` - Sun/Moon gradient variants

### 📅 Calendar
- `calendar.noDreams` - No dreams state
- `calendar.hasDreams` - Has dreams state
- `calendar.orange` - Orange variant

## Best Practices

### ✅ DO
```typescript
// Use centralized colors
import { colors, backgrounds, text } from '../theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: backgrounds.primary,
    borderColor: borders.primary,
  },
  text: {
    color: text.primary,
  },
});
```

### ❌ DON'T
```typescript
// Never use hardcoded colors
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F4EFEA', // ❌ BAD
    color: '#3A2F2A',            // ❌ BAD
  },
});
```

## Migration Guide

If you find hardcoded colors in components:

1. **Find the color** in the component
2. **Check if it exists** in `colors.ts`
3. **If it exists**: Replace with import
4. **If it doesn't exist**: Add it to the appropriate group in `colors.ts`
5. **Update the component** to use the centralized color

## Examples

### Before (Bad)
```typescript
backgroundColor: '#F4EFEA'
color: 'rgba(58, 47, 42, 0.08)'
borderColor: '#E2D8CC'
```

### After (Good)
```typescript
import { backgrounds, text, borders } from '../theme';

backgroundColor: backgrounds.primary
color: text.primary
borderColor: borders.primary
```

## Adding New Colors

When adding a new color:

1. **Determine the group** (background, text, accent, semantic, etc.)
2. **Add to the appropriate group** in `colors.ts`
3. **Add to legacy `colors` object** if needed for backward compatibility
4. **Use descriptive name** that indicates purpose
5. **Add comment** explaining usage if needed

Example:
```typescript
// In colors.ts
export const semantic = {
  // ... existing colors
  danger: '#FF0000', // For critical errors
} as const;
```
