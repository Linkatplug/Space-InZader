/**
 * @file ScreenEffects.js
 * @description Screen shake, flash, and juice effects for game feedback
 */

class ScreenEffects {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Shake state
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
        this.shakeOffset = { x: 0, y: 0 };
        
        // Flash state
        this.flashColor = null;
        this.flashIntensity = 0;
        this.flashDuration = 0;
        this.flashTimer = 0;
        
        logger.info('ScreenEffects', 'Initialized');
    }

    /**
     * Trigger screen shake effect
     * @param {number} intensity - Shake intensity (pixels)
     * @param {number} duration - Shake duration (seconds)
     */
    shake(intensity, duration) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
        this.shakeTimer = 0;
    }

    /**
     * Trigger screen flash effect
     * @param {string} color - Flash color
     * @param {number} intensity - Flash opacity (0-1)
     * @param {number} duration - Flash duration (seconds)
     */
    flash(color, intensity, duration) {
        this.flashColor = color;
        this.flashIntensity = Math.max(this.flashIntensity, intensity);
        this.flashDuration = Math.max(this.flashDuration, duration);
        this.flashTimer = 0;
    }

    /**
     * Update effects
     * @param {number} deltaTime - Time elapsed since last frame
     */
    update(deltaTime) {
        // Update shake
        if (this.shakeTimer < this.shakeDuration) {
            this.shakeTimer += deltaTime;
            
            // Calculate shake offset with decay
            const progress = this.shakeTimer / this.shakeDuration;
            const currentIntensity = this.shakeIntensity * (1 - progress);
            
            this.shakeOffset.x = (Math.random() - 0.5) * currentIntensity * 2;
            this.shakeOffset.y = (Math.random() - 0.5) * currentIntensity * 2;
        } else {
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
        }
        
        // Update flash
        if (this.flashTimer < this.flashDuration) {
            this.flashTimer += deltaTime;
        }
    }

    /**
     * Apply shake offset to context
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    applyShake(ctx) {
        if (this.shakeOffset.x !== 0 || this.shakeOffset.y !== 0) {
            ctx.translate(this.shakeOffset.x, this.shakeOffset.y);
        }
    }

    /**
     * Render flash overlay
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    renderFlash(ctx) {
        if (this.flashTimer < this.flashDuration && this.flashColor) {
            const progress = this.flashTimer / this.flashDuration;
            const currentIntensity = this.flashIntensity * (1 - progress);
            
            ctx.save();
            ctx.globalAlpha = currentIntensity;
            ctx.fillStyle = this.flashColor;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.restore();
        }
    }

    /**
     * Get current shake offset (returns direct reference for performance)
     * @returns {{x: number, y: number}} Shake offset
     */
    getShakeOffset() {
        return this.shakeOffset;
    }

    /**
     * Reset all effects
     */
    reset() {
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
        this.shakeOffset = { x: 0, y: 0 };
        this.flashColor = null;
        this.flashIntensity = 0;
        this.flashDuration = 0;
        this.flashTimer = 0;
    }
}
