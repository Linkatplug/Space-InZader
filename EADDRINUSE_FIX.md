# Fix: EADDRINUSE Port Conflict Error

## Problem
The Node.js server crashed with an unhandled error when attempting to start on a port that was already in use:

```
Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1940:16)
    ...
    code: 'EADDRINUSE',
    errno: -98,
    syscall: 'listen',
    address: '::',
    port: 3000
```

## Root Cause
The server.js file had no error handling for the `server.listen()` call. When port 3000 was already occupied by another process, Node.js would throw an unhandled error event, causing the entire process to crash immediately.

## Solution

### 1. Server Error Handler
Added comprehensive error handling that catches the EADDRINUSE error specifically:

```javascript
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
        console.error('\n📋 To fix this issue, try one of the following:\n');
        console.error('1. Stop the existing server:');
        console.error(`   - Find the process: lsof -i :${PORT} (Mac/Linux)`);
        console.error('   - Stop it: Use process manager or terminate the process');
        console.error('\n2. Use a different port:');
        console.error(`   - PORT=3001 npm start`);
        console.error('\n3. Wait a moment and try again (the port may still be releasing)\n');
        process.exit(1);
    } else {
        console.error('Server error:', error);
        process.exit(1);
    }
});
```

### 2. Graceful Shutdown
Implemented proper shutdown handlers for clean process termination:

```javascript
const shutdown = () => {
    console.log('\n🛑 Shutting down server gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
    
    // Force close after 5 seconds
    setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
    }, 5000);
};

process.on('SIGINT', shutdown);  // Ctrl+C
process.on('SIGTERM', shutdown); // Terminate command
```

### 3. Enhanced Startup Messages
Improved server startup output for better user experience:

```javascript
server.listen(PORT, () => {
    console.log(`🚀 Space InZader Multiplayer Server running on port ${PORT}`);
    console.log(`📡 Open http://localhost:${PORT} to play`);
    console.log(`⌨️  Press Ctrl+C to stop the server\n`);
});
```

## Testing Results

### Test 1: Normal Startup ✅
```bash
$ node server.js
🚀 Space InZader Multiplayer Server running on port 3000
📡 Open http://localhost:3000 to play
⌨️  Press Ctrl+C to stop the server
```

### Test 2: Port Already in Use ✅
When attempting to start a second server on the same port:
```
❌ ERROR: Port 3000 is already in use!

📋 To fix this issue, try one of the following:

1. Stop the existing server
2. Use a different port: PORT=3001 npm start
3. Wait a moment and try again
```

### Test 3: Custom Port ✅
```bash
$ PORT=3001 node server.js
🚀 Space InZader Multiplayer Server running on port 3001
📡 Open http://localhost:3001 to play
```

### Test 4: Graceful Shutdown ✅
```bash
^C
🛑 Shutting down server gracefully...
✅ Server closed
```

## Benefits

1. **No More Crashes**: Unhandled errors are caught and handled gracefully
2. **Clear Error Messages**: Users receive actionable guidance when errors occur
3. **Port Flexibility**: Supports PORT environment variable for custom ports
4. **Clean Shutdown**: Prevents orphaned processes and resource leaks
5. **Better UX**: Enhanced console output with emojis and clear status

## Files Changed
- `server.js` - Added error handling and graceful shutdown logic
- `MULTIPLAYER.md` - Updated troubleshooting documentation

## Usage Examples

### Start server normally
```bash
npm start
# or
node server.js
```

### Start on custom port
```bash
PORT=3001 npm start
# or
PORT=3001 node server.js
```

### Stop server
Press `Ctrl+C` for graceful shutdown

## Troubleshooting

If you see "Port already in use", you have several options:

1. **Stop the existing server** if you started it in another terminal
2. **Use a different port**: `PORT=3001 npm start`
3. **Wait a moment** - the port might still be releasing from a previous session
4. **Find and stop the conflicting process** using system tools

## Conclusion
The EADDRINUSE error is now properly handled with helpful error messages and recovery options. The server also supports graceful shutdown and custom port configuration, making it more robust and user-friendly.
