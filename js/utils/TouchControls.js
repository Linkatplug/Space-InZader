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
        
        // Touch identifiers
        this.joystickTouchId = null;
        this.fireButtonTouchId = null;
        
        // Elements
        this.touchControls = document.getElementById('touchControls');
        this.joystick = document.getElementById('touchJoystick');
        this.joystickInner = document.getElementById('touchJoystickInner');
        this.fireButton = document.getElementById('touchFireButton');
        this.pauseButton = document.getElementById('touchPauseButton');
        
        // Auto-detect mobile
        this.isMobile = this.detectMobile();
        
        if (this.isMobile) {
            this.enable();
        }
        
        this.setupTouchHandlers();
        this.setupCanvasResize();
    }
    
    detectMobile() {
        // Check if device is mobile or tablet
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;
        
        // Enable on small screens regardless of device type (for mobile browsers)
        return isSmallScreen || (isMobileUA || isTouchDevice);
    }
    
    setupCanvasResize() {
        // Make canvas responsive
        const resizeCanvas = () => {
            // Re-detect if we should be in mobile mode based on screen size
            const shouldBeMobile = window.innerWidth <= 768;
            
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
                
                // Set canvas to fill viewport while maintaining aspect ratio
                const aspectRatio = 16 / 9; // Original 1280x720
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const windowAspect = windowWidth / windowHeight;
                
                let newWidth, newHeight;
                
                if (windowAspect > aspectRatio) {
                    // Window is wider than canvas aspect ratio
                    newHeight = windowHeight;
                    newWidth = newHeight * aspectRatio;
                } else {
                    // Window is taller than canvas aspect ratio
                    newWidth = windowWidth;
                    newHeight = newWidth / aspectRatio;
                }
                
                // Apply size to container
                container.style.width = `${newWidth}px`;
                container.style.height = `${newHeight}px`;
                
                // Canvas maintains internal resolution but scales visually
                canvas.style.width = `${newWidth}px`;
                canvas.style.height = `${newHeight}px`;
                
                if (menuCanvas) {
                    menuCanvas.style.width = `${newWidth}px`;
                    menuCanvas.style.height = `${newHeight}px`;
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
        if (!this.joystick || !this.fireButton) return;
        
        // Joystick touch handlers
        this.joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.joystickTouchId === null) {
                const touch = e.changedTouches[0];
                this.joystickTouchId = touch.identifier;
                this.handleJoystickStart(touch);
            }
        }, { passive: false });
        
        this.joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let touch of e.changedTouches) {
                if (touch.identifier === this.joystickTouchId) {
                    this.handleJoystickMove(touch);
                    break;
                }
            }
        }, { passive: false });
        
        this.joystick.addEventListener('touchend', (e) => {
            e.preventDefault();
            for (let touch of e.changedTouches) {
                if (touch.identifier === this.joystickTouchId) {
                    this.handleJoystickEnd();
                    break;
                }
            }
        }, { passive: false });
        
        // Fire button touch handlers
        this.fireButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.fireButtonTouchId === null) {
                const touch = e.changedTouches[0];
                this.fireButtonTouchId = touch.identifier;
                this.fireButtonPressed = true;
            }
        }, { passive: false });
        
        this.fireButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            for (let touch of e.changedTouches) {
                if (touch.identifier === this.fireButtonTouchId) {
                    this.fireButtonPressed = false;
                    this.fireButtonTouchId = null;
                    break;
                }
            }
        }, { passive: false });
        
        // Pause button handler
        this.pauseButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // Trigger ESC key event for pause
            const escEvent = new KeyboardEvent('keydown', {
                key: 'Escape',
                code: 'Escape',
                keyCode: 27
            });
            window.dispatchEvent(escEvent);
        }, { passive: false });
    }
    
    handleJoystickStart(touch) {
        this.joystickActive = true;
        const rect = this.joystick.getBoundingClientRect();
        this.joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        this.handleJoystickMove(touch);
    }
    
    handleJoystickMove(touch) {
        if (!this.joystickActive) return;
        
        const rect = this.joystick.getBoundingClientRect();
        const maxDistance = rect.width / 2 - this.JOYSTICK_INNER_RADIUS;
        
        // Calculate relative position
        const dx = touch.clientX - this.joystickCenter.x;
        const dy = touch.clientY - this.joystickCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Clamp to max distance
        const clampedDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(dy, dx);
        
        // Update joystick position
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
        
        // Update visual position
        this.joystickInner.style.transform = `translate(calc(-50% + ${this.joystickPosition.x}px), calc(-50% + ${this.joystickPosition.y}px))`;
    }
    
    handleJoystickEnd() {
        this.joystickActive = false;
        this.joystickTouchId = null;
        this.joystickDirection.x = 0;
        this.joystickDirection.y = 0;
        this.joystickPosition.x = 0;
        this.joystickPosition.y = 0;
        
        // Reset visual position
        this.joystickInner.style.transform = 'translate(-50%, -50%)';
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
