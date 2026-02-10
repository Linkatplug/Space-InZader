# DevTools Scrolling Fix

## Issue
The DevTools overlay had a scrolling problem where content below the visible area was not accessible. Users couldn't scroll down to see additional controls and information.

## Root Cause
The `.devtools-content` CSS had `overflow-y: auto` and `flex: 1`, but was missing the critical `min-height: 0` property. Without this, flex items don't shrink below their content size, preventing the scrollbar from appearing.

## Solution
Added `min-height: 0` to the `.devtools-content` CSS class in `index.html`.

### Before:
```css
.devtools-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}
```

### After:
```css
.devtools-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    min-height: 0; /* Allow flex item to shrink below content size for scrolling */
}
```

## Technical Explanation

### Flex Layout Issue
When using `flex: 1` on a flex item:
- The item tries to grow to fill available space
- By default, it won't shrink below its content size
- This prevents `overflow-y: auto` from working correctly

### The Fix
Adding `min-height: 0`:
- Allows the flex item to shrink below its content size
- Enables the scrollbar to appear when content exceeds container height
- Works in conjunction with `overflow-y: auto`

## DevTools Structure

```
.devtools-overlay (fixed, flex container)
├── .devtools-header (fixed height)
└── .devtools-content (flex: 1, scrollable) ← FIXED HERE
    ├── Weapons tab content
    ├── Passives tab content
    ├── Utilities tab content (with new sections)
    └── Audit tab content
```

## Affected Areas
All DevTools tabs now scroll properly:
- ⚔️ **Weapons Tab**: Full list of weapons
- ✨ **Passives Tab**: Full list of passives  
- 🔧 **Utilities Tab**: All control sections
  - Player Control (with God Mode)
  - Wave Control (new section)
  - Weather Events
  - Current Stats
  - Player Info
- 📊 **Audit Tab**: Full audit reports

## Testing

### How to Test
1. Open DevTools (Press F4 or L)
2. Go to Utilities tab
3. Look for the scrollbar on the right
4. Scroll down to see all sections
5. Try other tabs with many items

### Expected Behavior
- Scrollbar appears when content exceeds visible height
- Smooth scrolling with mouse wheel
- All content is accessible
- No hidden sections

### Visual Check
Before fix:
- ❌ Content cut off at bottom
- ❌ No scrollbar visible
- ❌ Cannot access Wave Control and other sections

After fix:
- ✅ Scrollbar appears when needed
- ✅ Can scroll to see all content
- ✅ All sections accessible

## Browser Compatibility
This fix works on all modern browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Related CSS Properties

### Why Not Just `overflow: auto` on Parent?
The parent (`.devtools-overlay`) needs `overflow: hidden` to:
- Maintain border-radius clipping
- Prevent horizontal scrolling
- Keep the overlay contained

### Flex Layout Best Practices
When using flex with scrollable areas:
1. Parent: `display: flex; flex-direction: column; overflow: hidden`
2. Header: Fixed height or `flex: 0 0 auto`
3. Content: `flex: 1; overflow-y: auto; min-height: 0`

## Files Modified
- **index.html**: Added `min-height: 0` to `.devtools-content` CSS (line ~932)

## Commits
- Initial fix: Added min-height property
- Tested on: Utilities tab with new Wave Control section

## Known Issues
None. The fix is complete and working as intended.

## References
- [CSS Tricks: Flexbox and Truncated Text](https://css-tricks.com/flexbox-truncated-text/)
- [MDN: min-height in Flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/min-height)
- [Stack Overflow: Flexbox scroll issue](https://stackoverflow.com/questions/36130760/use-css-flexbox-to-scroll-content)
