# Dev Tools Integration Guide

## Manual Integration Steps

The dev tools are complete but require manual integration into `index.html` to avoid automated editing risks.

## Step 1: Add Dev Tools CSS

Insert the following CSS **before the closing `</style>` tag** (around line 803 in index.html):

```css
/* ===== DEV TOOLS STYLES ===== */
.devtools-overlay {
    position: fixed;
    top: 50px;
    right: 20px;
    width: 600px;
    max-height: calc(100vh - 100px);
    background: rgba(10, 10, 26, 0.95);
    border: 2px solid #00ffff;
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
    z-index: 10000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    font-family: 'Courier New', monospace;
}

.devtools-header {
    background: rgba(0, 255, 255, 0.1);
    padding: 15px;
    border-bottom: 1px solid #00ffff;
}

.devtools-header h2 {
    color: #00ffff;
    margin: 0 0 10px 0;
    font-size: 18px;
}

.devtools-tabs {
    display: flex;
    gap: 5px;
}

.devtools-tab {
    padding: 8px 15px;
    background: rgba(0, 255, 255, 0.1);
    border: 1px solid #00ffff;
    color: #00ffff;
    cursor: pointer;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    transition: all 0.2s;
}

.devtools-tab:hover {
    background: rgba(0, 255, 255, 0.2);
}

.devtools-tab.active {
    background: #00ffff;
    color: #000;
}

.devtools-content {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
}

.devtools-search {
    margin-bottom: 15px;
}

.devtools-search input {
    width: 100%;
    padding: 8px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid #00ffff;
    color: #00ffff;
    font-family: 'Courier New', monospace;
    font-size: 12px;
}

.devtools-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.devtools-item {
    background: rgba(0, 255, 255, 0.05);
    border: 1px solid rgba(0, 255, 255, 0.3);
    padding: 10px;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.devtools-item.malus {
    border-color: rgba(255, 0, 0, 0.5);
    background: rgba(255, 0, 0, 0.05);
}

.devtools-item-info {
    flex: 1;
}

.devtools-item-name {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 4px;
}

.devtools-item-meta {
    font-size: 11px;
    color: #888;
    margin-bottom: 4px;
}

.devtools-item-desc {
    font-size: 11px;
    color: #aaa;
    margin-bottom: 4px;
}

.devtools-item-effects,
.devtools-item-tags {
    font-size: 10px;
    color: #666;
}

.devtools-item-actions {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-left: 10px;
}

.devtools-btn {
    padding: 6px 12px;
    background: rgba(0, 255, 0, 0.2);
    border: 1px solid #00ff00;
    color: #00ff00;
    cursor: pointer;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    transition: all 0.2s;
    white-space: nowrap;
}

.devtools-btn:hover {
    background: rgba(0, 255, 0, 0.3);
}

.devtools-btn-small {
    padding: 4px 8px;
    background: rgba(255, 170, 0, 0.2);
    border: 1px solid #ffaa00;
    color: #ffaa00;
    cursor: pointer;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    transition: all 0.2s;
}

.devtools-btn-small:hover {
    background: rgba(255, 170, 0, 0.3);
}

.devtools-utilities {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.utility-section {
    background: rgba(0, 255, 255, 0.05);
    padding: 15px;
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 4px;
}

.utility-section h3 {
    color: #00ffff;
    font-size: 14px;
    margin-bottom: 10px;
}

.utility-section .devtools-btn {
    margin-bottom: 8px;
    width: 100%;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    font-size: 11px;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    padding: 4px;
    background: rgba(0, 0, 0, 0.3);
}

.stat-key {
    color: #888;
}

.stat-value {
    color: #00ffff;
}

.audit-section {
    background: rgba(0, 255, 255, 0.05);
    padding: 15px;
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 4px;
}

.audit-section h3 {
    color: #00ffff;
    font-size: 14px;
    margin-bottom: 10px;
}

.audit-section .devtools-btn {
    margin-right: 10px;
    margin-bottom: 10px;
}

.audit-summary {
    padding: 15px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 4px;
}

.audit-summary h4 {
    color: #00ffff;
    font-size: 13px;
    margin-bottom: 10px;
}

.audit-summary p {
    color: #aaa;
    font-size: 12px;
    margin-bottom: 5px;
}
```

## Step 2: Add Script Includes

Insert the following **before `<script src="js/Game.js"></script>`** (around line 1322):

```html
<!-- Dev Tools -->
<script src="js/dev/ContentAuditor.js"></script>
<script src="js/dev/DevTools.js"></script>
```

## Step 3: Initialize Dev Tools

Add to `js/main.js` **after the game is created** (after `const game = new Game();`):

```javascript
// Initialize dev tools (F4 to toggle)
if (typeof DevTools !== 'undefined') {
    window.devTools = new DevTools(game);
    console.log('%c[DevTools] Initialized - Press F4 to open', 'color: #00ff00; font-weight: bold');
}
```

## Testing

After integration:

1. Reload the page
2. Press **F4** to open dev tools
3. You should see a cyan-bordered overlay on the right side
4. Click through the tabs: Weapons, Passives, Utilities, Audit
5. Try giving yourself a weapon or passive
6. Run the audit to verify all content

## Troubleshooting

**Dev tools don't appear**:
- Check browser console for errors
- Verify all script files are loaded (check Network tab)
- Make sure F4 key binding isn't captured by browser

**Items don't give properly**:
- Check console for errors
- Verify game is running (not in menu)
- Try starting a game first, then opening dev tools

**Audit shows failures**:
- This is expected! The audit is designed to find issues
- Check console for detailed error messages
- Review the specific checks that failed

## Features

### Weapons Tab
- List all 8 weapons
- Give any weapon with one click
- Test individual weapon validity
- Search/filter by name or ID

### Passives Tab
- List all 70+ passives
- Give any passive with one click
- Test passive effects
- Malus items highlighted in red
- See all effect values
- Search/filter

### Utilities Tab
- Spawn dummy enemy (10000 HP, immobile, no damage)
- Reset run without reload
- Set health to max
- Add 1000 XP
- Clear all weapons/passives
- View current stats (real-time)
- View player info

### Audit Tab
- Run full content verification
- See summary (OK/FAIL counts)
- Detailed console report
- Identifies items with no effect
- Checks for missing properties
- Validates effect values

## Console Commands

You can also use dev tools from console:

```javascript
// Give items
window.devTools.giveWeapon('laser_frontal');
window.devTools.givePassive('surchauffe');

// Utilities
window.devTools.spawnDummy();
window.devTools.setHealth(9999);
window.devTools.addXP(1000);

// Audit
window.devTools.runAudit();
window.devTools.printAuditReport();

// Verify specific items
window.devTools.verifyItem('weapon', 'missiles_guides');
window.devTools.verifyItem('passive', 'radiateur');
```

## Notes

- Dev tools only load when game is loaded
- F4 binding is global (works anytime)
- Overlay is draggable (future enhancement)
- All changes via dev tools are temporary (lost on reload)
- Stats update in real-time when items are given
- Dummy enemies don't attack or move
