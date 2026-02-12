/**
 * @file TouchControls.js
 * @description Handles touch input for mobile devices
 */

class TouchControls {
    constructor(canvas) {
        this.canvas = canvas;
        this.enabled = false;
        this.joystickActive = false;
        this.joystickCenter = { x: 0, y: 0 };
        this.joystickPosition = { x: 0, y: 0 };
        this.joystickDirection = { x: 0, y: 0 };
        this.fireButtonPressed = false;
        
        // Joystick configuration constants
        this.JOYSTICK_INNER_RADIUS = 30; // Half of inner circle size (60px / 2)
        this.JOYSTICK_DEAD_ZONE = 5; // Minimum distance to register movement
        this.JOYSTICK_MAX_DISTANCE = 75; // Maximum distance from center for full input
        
        // Mobile detection thresholds
        this.MOBILE_SMALLER_DIMENSION_THRESHOLD = 768; // Max height/width for mobile
        this.MOBILE_LARGER_DIMENSION_THRESHOLD = 1024; // Max other dimension for mobile
        this.TABLET_DIMENSION_THRESHOLD = 1366; // Max dimension for tablets
        this.SMALL_TOUCH_DEVICE_THRESHOLD = 600; // Clearly mobile touch devices
        
        // Touch identifiers
        this.joystickTouchId = null;
        this.fireButtonTouchId = null;
        
        // Elements
        this.touchControls = document.getElementById('touchControls');
        this.joystick = document.getElementById('touchJoystick');
        this.joystickInner = document.getElementById('touchJoystickInner');
        this.fireButton = document.getElementById('touchFireButton');
        this.pauseButton = document.getElementById('touchPauseButton');
        this.fullscreenButton = document.getElementById('touchFullscreenButton');
        
        // Auto-detect mobile
        this.isMobile = this.detectMobile();
        this.isAndroidDevice = /android/i.test(navigator.userAgent);
        
        if (this.isMobile) {
            this.enable();
        }
        
        this.setupTouchHandlers();
        this.setupFullscreenHandler();
        this.setupCanvasResize();
        this.applyAndroidUIAdjustments();
    }
    
    applyAndroidUIAdjustments() {
        if (!this.isAndroidDevice) return;

        const statsDisplay = document.getElementById('statsDisplay');
        const statsOverlayPanel = document.getElementById('statsOverlayPanel');

        if (statsDisplay) {
            statsDisplay.style.display = 'none';
        }

        if (statsOverlayPanel) {
            statsOverlayPanel.style.display = 'none';
        }
    }
    
    detectMobile() {
        // Check if device is mobile or tablet
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const smallerDimension = Math.min(window.innerWidth, window.innerHeight);
        
        // Enable on small screens OR mobile devices (both portrait and landscape)
        // In landscape, smaller dimension (height) determines if it's a mobile device
        return smallerDimension <= this.MOBILE_SMALLER_DIMENSION_THRESHOLD || isMobileUA || isTouchDevice;
    }
    
    setupCanvasResize() {
        // Make canvas responsive
        const resizeCanvas = () => {
            // Improved mobile detection for both portrait and landscape
            // Check screen dimensions to determine if we're on a mobile device
            const smallerDimension = Math.min(window.innerWidth, window.innerHeight);
            const largerDimension = Math.max(window.innerWidth, window.innerHeight);
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const userAgent = navigator.userAgent.toLowerCase();
            const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
            
            // Enable on mobile-sized screens:
            // - Smaller dimension <= threshold AND larger dimension < threshold (mobile in any orientation)
            // - OR mobile UA with reasonable dimensions
            // - OR touch device with clearly mobile dimensions
            const shouldBeMobile = 
                (smallerDimension <= this.MOBILE_SMALLER_DIMENSION_THRESHOLD && 
                 largerDimension < this.MOBILE_LARGER_DIMENSION_THRESHOLD) || 
                (isMobileUA && largerDimension <= this.TABLET_DIMENSION_THRESHOLD) || 
                (isTouchDevice && smallerDimension <= this.SMALL_TOUCH_DEVICE_THRESHOLD);
            
            if (shouldBeMobile !== this.enabled) {
                if (shouldBeMobile) {
                    this.enable();
                } else {
                    this.disable();
                }
            }
            
            if (shouldBeMobile) {
                const container = document.getElementById('gameContainer');
                const canvas = this.canvas;
                const menuCanvas = document.getElementById('menuStarfield');
                
                // Make canvas fill entire viewport for full screen experience
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                
                // Apply full viewport size to container
                container.style.width = `${windowWidth}px`;
                container.style.height = `${windowHeight}px`;
                
                // Canvas scales to fill container
                canvas.style.width = `${windowWidth}px`;
                canvas.style.height = `${windowHeight}px`;
                
                if (menuCanvas) {
                    menuCanvas.style.width = `${windowWidth}px`;
                    menuCanvas.style.height = `${windowHeight}px`;
                }
            } else {
                // Reset to default desktop size
                const container = document.getElementById('gameContainer');
                const canvas = this.canvas;
                const menuCanvas = document.getElementById('menuStarfield');
                
                container.style.width = '';
                container.style.height = '';
                canvas.style.width = '';
                canvas.style.height = '';
                
                if (menuCanvas) {
                    menuCanvas.style.width = '';
                    menuCanvas.style.height = '';
                }
            }
        };
        
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', () => {
            setTimeout(resizeCanvas, 100);
        });
        
        // Initial resize
        resizeCanvas();
    }
    
    setupTouchHandlers() {
        if (!this.canvas) return;
        
        // Use the entire game container as joystick area
        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer) return;
        
        // Full-screen joystick handlers on the game container
        gameContainer.addEventListener('touchstart', (e) => {
            // Check if touch is on pause button or other UI elements
            const target = e.target;
            if (target.closest('.touch-pause-button') || 
                target.closest('.touch-fullscreen-button') ||
                target.closest('#mainMenu') ||
                target.closest('#pauseMenu') ||
                target.closest('#commandsScreen') ||
                target.closest('#optionsScreen') ||
                target.closest('#scoreboardScreen') ||
                target.closest('#creditsScreen') ||
                target.closest('.menu-screen') ||
                target.closest('.level-up-screen') ||
                target.closest('.game-over-screen') ||
                target.closest('.meta-screen') ||
                target.closest('button') ||
                target.closest('a') ||
                target.closest('input') ||
                target.closest('select') ||
                target.closest('textarea')) {
                return; // Let UI elements handle their own touch
            }
            
            e.preventDefault();
            if (this.joystickTouchId === null && e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                this.joystickTouchId = touch.identifier;
                this.handleJoystickStart(touch);
            }
        }, { passive: false });
        
        gameContainer.addEventListener('touchmove', (e) => {
            if (this.joystickTouchId === null) return;

            for (let touch of e.changedTouches) {
                if (touch.identifier === this.joystickTouchId) {
                    e.preventDefault();
                    this.handleJoystickMove(touch);
                    break;
                }
            }
        }, { passive: false });
        
        gameContainer.addEventListener('touchend', (e) => {
            if (this.joystickTouchId === null) return;

            for (let touch of e.changedTouches) {
                if (touch.identifier === this.joystickTouchId) {
                    e.preventDefault();
                    this.handleJoystickEnd();
                    break;
                }
            }
        }, { passive: false });
        
        gameContainer.addEventListener('touchcancel', (e) => {
            for (let touch of e.changedTouches) {
                if (touch.identifier === this.joystickTouchId) {
                    this.handleJoystickEnd();
                    break;
                }
            }
        }, { passive: false });
        
        // Pause button handler
        if (this.pauseButton) {
            this.pauseButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Trigger ESC key event for pause
                const escEvent = new KeyboardEvent('keydown', {
                    key: 'Escape',
                    code: 'Escape',
                    keyCode: 27
                });
                window.dispatchEvent(escEvent);
            }, { passive: false });
        }
    }
    
    setupFullscreenHandler() {
        if (!this.fullscreenButton) return;
        
        this.fullscreenButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleFullscreen();
        }, { passive: false });
        
        this.fullscreenButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleFullscreen();
        });
        
        // Update button icon when fullscreen state changes
        document.addEventListener('fullscreenchange', () => this.updateFullscreenButton());
        document.addEventListener('webkitfullscreenchange', () => this.updateFullscreenButton());
        document.addEventListener('mozfullscreenchange', () => this.updateFullscreenButton());
        document.addEventListener('msfullscreenchange', () => this.updateFullscreenButton());
    }
    
    toggleFullscreen() {
        const elem = document.documentElement;
        
        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && 
            !document.msFullscreenElement) {
            // Enter fullscreen
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
    
    updateFullscreenButton() {
        if (!this.fullscreenButton) return;
        
        const isFullscreen = document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.mozFullScreenElement || 
                           document.msFullscreenElement;
        
        // Update button icon:
        // ⛶ (U+26F6) = "Square Four Corners" - indicates expand to fullscreen
        // ⊗ (U+2297) = "Circled Times" - indicates close/exit fullscreen
        this.fullscreenButton.textContent = isFullscreen ? '⊗' : '⛶';
    }
    
    handleJoystickStart(touch) {
        this.joystickActive = true;
        // Set joystick center at the touch position
        this.joystickCenter = {
            x: touch.clientX,
            y: touch.clientY
        };
        
        // Position the joystick visual at the touch point
        if (this.joystick) {
            this.joystick.style.left = `${touch.clientX}px`;
            this.joystick.style.top = `${touch.clientY}px`;
            this.joystick.style.transform = 'translate(-50%, -50%)';
            this.joystick.style.opacity = '1';
        }
        
        this.handleJoystickMove(touch);
    }
    
    handleJoystickMove(touch) {
        if (!this.joystickActive) return;
        
        const maxDistance = this.JOYSTICK_MAX_DISTANCE;
        
        // Calculate relative position from joystick center
        const dx = touch.clientX - this.joystickCenter.x;
        const dy = touch.clientY - this.joystickCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Clamp to max distance
        const clampedDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(dy, dx);
        
        // Update joystick position for visual feedback
        this.joystickPosition.x = Math.cos(angle) * clampedDistance;
        this.joystickPosition.y = Math.sin(angle) * clampedDistance;
        
        // Calculate normalized direction with dead zone
        if (distance > this.JOYSTICK_DEAD_ZONE) {
            this.joystickDirection.x = dx / distance;
            this.joystickDirection.y = dy / distance;
        } else {
            this.joystickDirection.x = 0;
            this.joystickDirection.y = 0;
        }
        
        // Update visual position of inner joystick
        if (this.joystickInner) {
            this.joystickInner.style.transform = `translate(calc(-50% + ${this.joystickPosition.x}px), calc(-50% + ${this.joystickPosition.y}px))`;
        }
    }
    
    handleJoystickEnd() {
        this.joystickActive = false;
        this.joystickTouchId = null;
        this.joystickDirection.x = 0;
        this.joystickDirection.y = 0;
        this.joystickPosition.x = 0;
        this.joystickPosition.y = 0;
        
        // Fade out the joystick visual
        if (this.joystick) {
            this.joystick.style.opacity = '0';
        }
        
        // Reset visual position
        if (this.joystickInner) {
            this.joystickInner.style.transform = 'translate(-50%, -50%)';
        }
    }
    
    enable() {
        this.enabled = true;
        if (this.touchControls) {
            this.touchControls.classList.add('active');
        }
    }
    
    disable() {
        this.enabled = false;
        if (this.touchControls) {
            this.touchControls.classList.remove('active');
        }
    }
    
    getDirection() {
        return {
            x: this.joystickDirection.x,
            y: this.joystickDirection.y
        };
    }
    
    isFirePressed() {
        return this.fireButtonPressed;
    }
    
    isEnabled() {
        return this.enabled;
    }
}
