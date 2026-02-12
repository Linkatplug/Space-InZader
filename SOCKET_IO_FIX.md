# Fix: Socket.IO Same-Origin Connection

## Problem Statement
The user reported that the multiplayer server runs on `http://games.linkatplug.be:7779/` but the client was hardcoded to connect to `http://localhost:3000`, causing connection failures in production.

## Root Cause
In `js/managers/MultiplayerManager.js`, the `connect()` method had a default parameter:
```javascript
connect(serverUrl = 'http://localhost:3000') {
    this.socket = io(serverUrl);
}
```

Since the method was called without arguments (`this.multiplayerManager.connect()`), it always used `localhost:3000` regardless of where the page was served from.

## Solution Implemented

### Code Changes

**File: `js/managers/MultiplayerManager.js`**

Changed from hardcoded localhost to same-origin connection:

```javascript
// BEFORE
connect(serverUrl = 'http://localhost:3000') {
    this.socket = io(serverUrl);
}

// AFTER
connect(serverUrl) {
    // Connect to same origin if no URL provided (recommended for production)
    // This allows the game to work on both localhost:3000 and games.linkatplug.be:7779
    this.socket = serverUrl ? io(serverUrl) : io();
}
```

**File: `MULTIPLAYER.md`**

Updated documentation to explain the automatic connection behavior.

## How It Works

When `io()` is called without a URL parameter, Socket.IO automatically connects to the origin that served the HTML page:

- **Development**: `http://localhost:3000` → connects to `http://localhost:3000`
- **Production**: `http://games.linkatplug.be:7779` → connects to `http://games.linkatplug.be:7779`

This is the **recommended approach** by Socket.IO and eliminates the need for environment-specific configuration.

## Testing Results

### Local Testing (localhost:3000)
✅ Connection successful
✅ Status shows "Connecté au serveur ✓"
✅ Socket URL: `http://localhost:3000`
✅ Page origin: `http://localhost:3000`

![Multiplayer Connected](https://github.com/user-attachments/assets/236b65f6-ee6c-4bde-9deb-8ffb56b08179)

### Production Readiness
✅ When deployed to `games.linkatplug.be:7779`, will automatically connect to that server
✅ No code changes needed for deployment
✅ No environment variables or configuration required

## Benefits

1. **Zero Configuration**: Works automatically in any environment
2. **Production Ready**: Deploy without code changes
3. **Best Practice**: Follows Socket.IO recommendations
4. **Flexible**: Still supports custom server URL via parameter if needed
5. **Debugging Friendly**: Clear console logs show connection to current origin

## API Compatibility

The change maintains backward compatibility:

```javascript
// Same-origin (recommended)
multiplayerManager.connect();

// Custom server (still supported)
multiplayerManager.connect('http://custom-server.com:8080');
```

## Deployment Instructions

No special deployment steps needed! Just:

1. Deploy the updated code to `http://games.linkatplug.be:7779/`
2. Ensure the Node.js server is running on the same host
3. Players access the game via the production URL
4. Socket.IO automatically connects to the production server

## Files Changed
- `js/managers/MultiplayerManager.js` - Updated connection logic
- `MULTIPLAYER.md` - Updated documentation

## Commit
`b69a700` - Fix Socket.IO to use same-origin connection for production deployment
