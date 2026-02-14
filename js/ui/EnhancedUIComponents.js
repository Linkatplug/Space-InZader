/**
 * @fileoverview Enhanced UI Components for 3-Layer Defense System
 * Provides UI-readiness for damage types, layers, resistances, and heat
 */

/**
 * UI Constants for damage types and layers
 */
const UI_CONSTANTS = {
    // Damage type colors (as specified)
    DAMAGE_TYPE_COLORS: {
        em: '#00FFFF',         // Cyan
        thermal: '#FF8C00',    // Orange
        kinetic: '#FFFFFF',    // White
        explosive: '#FF0000'   // Red
    },
    
    // Damage type symbols
    DAMAGE_TYPE_SYMBOLS: {
        em: '✧',
        thermal: '✹',
        kinetic: '⦿',
        explosive: '💥'
    },
    
    // Layer colors
    LAYER_COLORS: {
        shield: '#00BFFF',     // Deep Sky Blue
        armor: '#8B4513',      // Saddle Brown
        structure: '#DC143C'   // Crimson
    },
    
    // Resistance indicators
    RESISTANCE_STATES: {
        weak: { color: '#00FF00', text: 'FAIBLE' },      // Green
        normal: { color: '#FFFF00', text: 'NORMAL' },    // Yellow
        resistant: { color: '#FF0000', text: 'RÉSIST' }  // Red
    },
    
    // Heat thresholds
    HEAT_THRESHOLDS: {
        safe: 0.5,      // < 50% = safe (green)
        warning: 0.75,  // 50-75% = warning (yellow)
        danger: 0.95    // 75-95% = danger (orange)
                        // > 95% = critical (red)
    }
};

/**
 * Enhanced 3-Layer Defense UI Component
 * Shows shield, armor, and structure as separate bars
 */
class ThreeLayerDefenseUI {
    constructor(containerElement) {
        this.container = containerElement;
        this.layers = {};
        this.createUI();
    }
    
    /**
     * Create the 3-layer defense UI
     */
    createUI() {
        this.container.innerHTML = `
            <div class="defense-layers">
                <div class="defense-layer" id="defense-shield">
                    <div class="layer-label">🟦 BOUCLIER</div>
                    <div class="layer-bar">
                        <div class="layer-fill shield-fill" id="shield-layer-fill"></div>
                    </div>
                    <div class="layer-value" id="shield-layer-value">120/120</div>
                </div>
                <div class="defense-layer" id="defense-armor">
                    <div class="layer-label">🟫 ARMURE</div>
                    <div class="layer-bar">
                        <div class="layer-fill armor-fill" id="armor-layer-fill"></div>
                    </div>
                    <div class="layer-value" id="armor-layer-value">150/150</div>
                </div>
                <div class="defense-layer" id="defense-structure">
                    <div class="layer-label">🔧 STRUCTURE</div>
                    <div class="layer-bar">
                        <div class="layer-fill structure-fill" id="structure-layer-fill"></div>
                    </div>
                    <div class="layer-value" id="structure-layer-value">130/130</div>
                </div>
            </div>
        `;
        
        // Cache elements
        this.layers.shield = {
            fill: document.getElementById('shield-layer-fill'),
            value: document.getElementById('shield-layer-value')
        };
        this.layers.armor = {
            fill: document.getElementById('armor-layer-fill'),
            value: document.getElementById('armor-layer-value')
        };
        this.layers.structure = {
            fill: document.getElementById('structure-layer-fill'),
            value: document.getElementById('structure-layer-value')
        };
    }
    
    /**
     * Update defense display
     * @param {Object} defense - Defense component
     */
    update(defense) {
        if (!defense) return;
        
        // Update each layer
        ['shield', 'armor', 'structure'].forEach(layerName => {
            const layer = defense[layerName];
            const ui = this.layers[layerName];
            
            if (layer && ui) {
                const percent = (layer.current / layer.max) * 100;
                ui.fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
                ui.value.textContent = `${Math.ceil(layer.current)}/${layer.max}`;
                
                // Flash on damage
                if (layer._lastCurrent !== undefined && layer.current < layer._lastCurrent) {
                    this.flashLayer(layerName);
                }
                layer._lastCurrent = layer.current;
            }
        });
    }
    
    /**
     * Flash a layer when it takes damage
     * @param {string} layerName - Layer to flash
     */
    flashLayer(layerName) {
        const ui = this.layers[layerName];
        if (!ui || !ui.fill) return;
        
        ui.fill.style.filter = 'brightness(1.5)';
        setTimeout(() => {
            if (ui.fill) ui.fill.style.filter = 'brightness(1)';
        }, 150);
    }
}

/**
 * Heat Gauge UI Component
 * Shows current heat with color-coded warnings
 */
class HeatGaugeUI {
    constructor(containerElement) {
        this.container = containerElement;
        this.createUI();
    }
    
    /**
     * Create heat gauge UI
     */
    createUI() {
        this.container.innerHTML = `
            <div class="heat-gauge">
                <div class="heat-label">🔥 CHALEUR</div>
                <div class="heat-bar">
                    <div class="heat-fill" id="heat-gauge-fill"></div>
                </div>
                <div class="heat-value" id="heat-gauge-value">0%</div>
                <div class="heat-warning" id="heat-warning" style="display: none;">⚠️ SURCHAUFFE IMMINENTE</div>
            </div>
        `;
        
        // Cache elements
        this.fill = document.getElementById('heat-gauge-fill');
        this.value = document.getElementById('heat-gauge-value');
        this.warning = document.getElementById('heat-warning');
    }
    
    /**
     * Update heat display
     * @param {Object} heat - Heat component
     */
    update(heat) {
        if (!heat) return;
        
        const percent = (heat.current / heat.max) * 100;
        const ratio = heat.current / heat.max;
        
        // Update bar
        this.fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
        this.value.textContent = `${Math.round(percent)}%`;
        
        // Color based on heat level
        let color = '#00FF00'; // Green (safe)
        if (ratio >= UI_CONSTANTS.HEAT_THRESHOLDS.danger) {
            color = '#FF0000'; // Red (critical)
            this.warning.style.display = 'block';
        } else if (ratio >= UI_CONSTANTS.HEAT_THRESHOLDS.warning) {
            color = '#FF8C00'; // Orange (danger)
            this.warning.style.display = 'none';
        } else if (ratio >= UI_CONSTANTS.HEAT_THRESHOLDS.safe) {
            color = '#FFFF00'; // Yellow (warning)
            this.warning.style.display = 'none';
        } else {
            this.warning.style.display = 'none';
        }
        
        this.fill.style.background = `linear-gradient(90deg, ${color}, ${color}dd)`;
        
        // Show overheated state
        if (heat.overheated) {
            this.fill.style.animation = 'overheat-pulse 0.5s infinite';
            this.warning.textContent = '🔥 SURCHAUFFE!';
            this.warning.style.display = 'block';
            this.warning.style.color = '#FF0000';
        } else {
            this.fill.style.animation = 'none';
        }
    }
}

/**
 * Damage Type Floating Text Manager
 * Creates color-coded floating damage numbers
 */
class DamageFloatingText {
    constructor(world) {
        this.world = world;
        this.texts = [];
    }
    
    /**
     * Create floating damage text
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} damage - Damage amount
     * @param {string} damageType - Damage type (em, thermal, kinetic, explosive)
     * @param {boolean} isCrit - Whether this was a crit
     */
    create(x, y, damage, damageType = 'kinetic', isCrit = false) {
        const color = UI_CONSTANTS.DAMAGE_TYPE_COLORS[damageType] || '#FFFFFF';
        const symbol = UI_CONSTANTS.DAMAGE_TYPE_SYMBOLS[damageType] || '';
        
        this.texts.push({
            x,
            y,
            damage: Math.round(damage),
            damageType,
            color,
            symbol,
            isCrit,
            life: 1.0,
            vy: -2
        });
    }
    
    /**
     * Update and render floating texts
     * @param {number} deltaTime - Time since last frame
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    update(deltaTime, ctx) {
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const text = this.texts[i];
            
            // Update position
            text.y += text.vy;
            text.life -= deltaTime;
            
            // Remove if expired
            if (text.life <= 0) {
                this.texts.splice(i, 1);
                continue;
            }
            
            // Render
            ctx.save();
            ctx.globalAlpha = text.life;
            ctx.font = text.isCrit ? 'bold 20px monospace' : '16px monospace';
            ctx.fillStyle = text.color;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            
            const displayText = `${text.symbol}${text.damage}`;
            
            // Outline
            ctx.strokeText(displayText, text.x, text.y);
            // Fill
            ctx.fillText(displayText, text.x, text.y);
            
            ctx.restore();
        }
    }
}

/**
 * Enemy Resistance Indicator
 * Shows color-coded weakness/resistance indicators on enemies
 */
class EnemyResistanceIndicator {
    /**
     * Get resistance state for a damage type
     * @param {Object} defense - Enemy defense component
     * @param {string} damageType - Damage type to check
     * @returns {Object} Resistance state (weak/normal/resistant)
     */
    static getResistanceState(defense, damageType) {
        if (!defense) return UI_CONSTANTS.RESISTANCE_STATES.normal;
        
        // Check all layers for this damage type
        let avgResist = 0;
        let layerCount = 0;
        
        ['shield', 'armor', 'structure'].forEach(layerName => {
            const layer = defense[layerName];
            if (layer && layer.current > 0 && layer.resistances && layer.resistances[damageType] !== undefined) {
                avgResist += layer.resistances[damageType];
                layerCount++;
            }
        });
        
        if (layerCount === 0) return UI_CONSTANTS.RESISTANCE_STATES.normal;
        
        avgResist /= layerCount;
        
        // Categorize
        if (avgResist <= 0.15) {
            return UI_CONSTANTS.RESISTANCE_STATES.weak;
        } else if (avgResist >= 0.40) {
            return UI_CONSTANTS.RESISTANCE_STATES.resistant;
        } else {
            return UI_CONSTANTS.RESISTANCE_STATES.normal;
        }
    }
    
    /**
     * Draw resistance indicator on enemy
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} defense - Enemy defense component
     * @param {string} playerDamageType - Current player weapon damage type
     */
    static draw(ctx, x, y, defense, playerDamageType = 'kinetic') {
        if (!defense || !playerDamageType) return;
        
        const state = this.getResistanceState(defense, playerDamageType);
        
        // Draw small indicator above enemy
        ctx.save();
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = state.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        
        // Symbol based on state
        const symbol = state === UI_CONSTANTS.RESISTANCE_STATES.weak ? '▼' :
                       state === UI_CONSTANTS.RESISTANCE_STATES.resistant ? '▲' : '■';
        
        // Outline
        ctx.strokeText(symbol, x, y - 15);
        // Fill
        ctx.fillText(symbol, x, y - 15);
        
        ctx.restore();
    }
}

/**
 * Weapon Damage Type Display
 * Shows current weapon damage type in UI
 */
class WeaponDamageTypeDisplay {
    constructor(containerElement) {
        this.container = containerElement;
        this.createUI();
    }
    
    /**
     * Create weapon damage type UI
     */
    createUI() {
        this.container.innerHTML = `
            <div class="weapon-damage-type">
                <div class="damage-type-label">TYPE DE DÉGÂTS</div>
                <div class="damage-type-indicator" id="damage-type-indicator">
                    <span id="damage-type-symbol">⦿</span>
                    <span id="damage-type-name">KINETIC</span>
                </div>
            </div>
        `;
        
        // Cache elements
        this.symbol = document.getElementById('damage-type-symbol');
        this.name = document.getElementById('damage-type-name');
        this.indicator = document.getElementById('damage-type-indicator');
    }
    
    /**
     * Update weapon damage type display
     * @param {string} damageType - Current damage type
     */
    update(damageType) {
        if (!damageType) damageType = 'kinetic';
        
        const color = UI_CONSTANTS.DAMAGE_TYPE_COLORS[damageType] || '#FFFFFF';
        const symbol = UI_CONSTANTS.DAMAGE_TYPE_SYMBOLS[damageType] || '⦿';
        const name = damageType.toUpperCase();
        
        this.symbol.textContent = symbol;
        this.name.textContent = name;
        this.indicator.style.color = color;
        this.indicator.style.borderColor = color;
        this.indicator.style.boxShadow = `0 0 10px ${color}`;
    }
}

/**
 * Layer Damage Notification
 * Shows which layer was damaged
 */
class LayerDamageNotification {
    constructor() {
        this.notifications = [];
    }
    
    /**
     * Show layer damage notification
     * @param {string} layerName - Layer that was damaged
     * @param {number} damage - Damage amount
     */
    show(layerName, damage) {
        const color = UI_CONSTANTS.LAYER_COLORS[layerName] || '#FFFFFF';
        const emoji = layerName === 'shield' ? '🟦' : 
                     layerName === 'armor' ? '🟫' : '🔧';
        
        this.notifications.push({
            layerName: layerName.toUpperCase(),
            damage: Math.round(damage),
            color,
            emoji,
            life: 1.5,
            opacity: 1.0
        });
        
        // Limit number of notifications
        if (this.notifications.length > 3) {
            this.notifications.shift();
        }
    }
    
    /**
     * Update and render notifications
     * @param {number} deltaTime - Time since last frame
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    update(deltaTime, ctx, x, y) {
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notif = this.notifications[i];
            
            notif.life -= deltaTime;
            notif.opacity = Math.max(0, notif.life / 1.5);
            
            if (notif.life <= 0) {
                this.notifications.splice(i, 1);
                continue;
            }
            
            // Render
            ctx.save();
            ctx.globalAlpha = notif.opacity;
            ctx.font = 'bold 12px monospace';
            ctx.fillStyle = notif.color;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            
            const text = `${notif.emoji} ${notif.layerName} -${notif.damage}`;
            const yPos = y + (i * 15);
            
            // Outline
            ctx.strokeText(text, x, yPos);
            // Fill
            ctx.fillText(text, x, yPos);
            
            ctx.restore();
        }
    }
}

// ========== GLOBAL EXPOSURE ==========
// Expose to window for passive loading
if (typeof window !== 'undefined') {
    window.EnhancedUIComponents = {
        UI_CONSTANTS: UI_CONSTANTS,
        ThreeLayerDefenseUI: ThreeLayerDefenseUI,
        HeatGaugeUI: HeatGaugeUI,
        WeaponDamageTypeDisplay: WeaponDamageTypeDisplay,
        DamageFloatingText: DamageFloatingText,
        EnemyResistanceIndicator: EnemyResistanceIndicator,
        LayerDamageNotification: LayerDamageNotification
    };
    
    // Console log confirmation
    console.log('[Content] Enhanced UI components loaded (6 components ready)');
}
