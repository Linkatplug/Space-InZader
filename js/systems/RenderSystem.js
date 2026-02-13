/**
 * @file RenderSystem.js
 * @description Main rendering system for Space InZader
 * Handles all visual rendering including starfield, entities, effects, and UI overlays
 */

class RenderSystem {
    constructor(canvas, world, gameState) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.world = world;
        this.gameState = gameState;
        
        // Screen effects reference (set from Game.js)
        this.screenEffects = null;
        
        // Starfield background
        this.stars = [];
        this.initStarfield();
        
        // Performance tracking
        this.lastFrameTime = 0;
        this.fps = 60;
        
        // Boss health bar
        this.bossHealthAlpha = 0;
        this.bossHealthTarget = 0;
    }

    /**
     * Initialize starfield background with parallax layers
     */
    initStarfield() {
        this.stars = [];
        const layers = [
            { count: 100, speed: 0.2, size: 1, alpha: 0.5 },
            { count: 75, speed: 0.5, size: 1.5, alpha: 0.7 },
            { count: 50, speed: 1.0, size: 2, alpha: 0.9 }
        ];

        layers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                this.stars.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    speed: layer.speed,
                    size: layer.size,
                    alpha: layer.alpha,
                    twinkle: Math.random() * Math.PI * 2,
                    twinkleSpeed: 0.02 + Math.random() * 0.03
                });
            }
        });
    }

    /**
     * Main render loop
     * @param {number} deltaTime - Time since last frame in seconds
     */
    render(deltaTime) {
        this.lastFrameTime = deltaTime;
        this.fps = deltaTime > 0 ? 1 / deltaTime : 60;

        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Only render game elements when playing
        if (this.gameState.isState(GameStates.RUNNING) || 
            this.gameState.isState(GameStates.LEVEL_UP) ||
            this.gameState.isState(GameStates.PAUSED)) {
            
            // Save context for screen shake
            this.ctx.save();
            
            // Apply screen shake if available
            if (this.screenEffects) {
                this.screenEffects.applyShake(this.ctx);
            }
            
            this.renderStarfield(deltaTime);
            this.renderEntities();
            
            // Restore context after shake
            this.ctx.restore();
            
            this.renderBossHealthBar();
            
            // Render flash overlay on top
            if (this.screenEffects) {
                this.screenEffects.renderFlash(this.ctx);
            }
        }
    }

    /**
     * Render animated starfield with parallax scrolling
     * @param {number} deltaTime - Time delta
     */
    renderStarfield(deltaTime) {
        this.ctx.save();
        
        this.stars.forEach(star => {
            // Parallax movement
            star.y += star.speed * 60 * deltaTime;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }

            // Twinkling effect
            star.twinkle += star.twinkleSpeed;
            const twinkleAlpha = star.alpha * (0.5 + 0.5 * Math.sin(star.twinkle));

            // Draw star
            this.ctx.fillStyle = `rgba(255, 255, 255, ${twinkleAlpha})`;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });

        this.ctx.restore();
    }

    /**
     * Render all entities in the game world
     */
    renderEntities() {
        // Render order: particles -> pickups -> projectiles -> enemies -> weather -> player
        this.renderParticles();
        this.renderPickups();
        this.renderProjectiles();
        this.renderEnemies();
        this.renderWeatherHazards();
        this.renderPlayer();
    }

    /**
     * Render particle effects
     */
    renderParticles() {
        const particles = this.world.getEntitiesByType('particle');
        
        particles.forEach(particle => {
            const pos = particle.getComponent('position');
            const render = particle.getComponent('renderable');
            const particleComp = particle.getComponent('particle');
            
            if (!pos || !render || !particleComp) return;

            const alpha = particleComp.alpha * (particleComp.lifetime / particleComp.maxLifetime);
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = render.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = render.color;
            
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, render.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }

    /**
     * Render pickups (XP, health, etc.)
     */
    renderPickups() {
        const pickups = this.world.getEntitiesByType('pickup');
        
        pickups.forEach(pickup => {
            const pos = pickup.getComponent('position');
            const render = pickup.getComponent('renderable');
            const pickupComp = pickup.getComponent('pickup');
            
            if (!pos || !render || !pickupComp) return;

            // Floating animation
            const time = Date.now() * 0.003;
            const offsetY = Math.sin(time + pickup.id) * 3;

            this.ctx.save();
            this.ctx.translate(pos.x, pos.y + offsetY);

            // Glow effect
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = render.color;

            // Draw pickup based on type
            this.drawShape(render.shape, render.color, render.size, render.rotation);

            this.ctx.restore();
        });
    }

    /**
     * Render projectiles
     */
    renderProjectiles() {
        const projectiles = this.world.getEntitiesByType('projectile');
        
        projectiles.forEach(projectile => {
            const pos = projectile.getComponent('position');
            const render = projectile.getComponent('renderable');
            const projComp = projectile.getComponent('projectile');
            
            if (!pos || !render) return;

            this.ctx.save();
            this.ctx.translate(pos.x, pos.y);
            
            // Trail effect for projectiles
            if (projComp && projComp.lifetime > 0) {
                const trailLength = 3;
                const vel = projectile.getComponent('velocity');
                
                if (vel) {
                    this.ctx.globalAlpha = 0.3;
                    this.ctx.strokeStyle = render.color;
                    this.ctx.lineWidth = render.size * 2;
                    this.ctx.lineCap = 'round';
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, 0);
                    const angle = Math.atan2(vel.vy, vel.vx);
                    this.ctx.lineTo(-Math.cos(angle) * trailLength, -Math.sin(angle) * trailLength);
                    this.ctx.stroke();
                    this.ctx.globalAlpha = 1;
                }
            }

            // Glow effect
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = render.color;

            // Draw projectile
            this.drawShape(render.shape, render.color, render.size, render.rotation);

            this.ctx.restore();
        });
    }

    /**
     * Render enemies with health bars
     */
    renderEnemies() {
        const enemies = this.world.getEntitiesByType('enemy');
        
        enemies.forEach(enemy => {
            const pos = enemy.getComponent('position');
            const render = enemy.getComponent('renderable');
            const health = enemy.getComponent('health');
            const enemyComp = enemy.getComponent('enemy');
            
            if (!pos || !render) return;

            this.ctx.save();
            this.ctx.translate(pos.x, pos.y);

            // Flash effect when damaged
            if (health && health.invulnerable && health.invulnerableTime > 0) {
                const flashAlpha = Math.sin(Date.now() * 0.05) * 0.5 + 0.5;
                this.ctx.globalAlpha = flashAlpha;
            }

            // Glow effect based on enemy type
            const isBoss = enemy.hasComponent('boss');
            this.ctx.shadowBlur = isBoss ? 25 : 15;
            this.ctx.shadowColor = render.color;

            // Draw enemy
            this.ctx.rotate(render.rotation);
            this.drawShape(render.shape, render.color, render.size, 0);

            this.ctx.restore();

            // Health bar for enemies
            if (health && (isBoss || enemyComp?.baseHealth > 50)) {
                this.drawHealthBar(pos.x, pos.y - render.size - 10, health.current, health.max, isBoss);
            }
            
            // Draw resistance indicator if tactical UI enabled
            if (!this.gameState || this.gameState.tacticalUIEnabled !== false) {
                this.drawEnemyResistanceIndicator(enemy);
            }
        });
    }

    /**
     * Draw enemy resistance indicator
     */
    drawEnemyResistanceIndicator(enemy) {
        const defense = enemy.getComponent('defense');
        const pos = enemy.getComponent('position');
        const render = enemy.getComponent('renderable');
        
        if (!defense || !pos || !render) return;

        // Get player's current weapon type
        const players = this.world.getEntitiesByType('player');
        if (players.length === 0) return;
        
        const player = players[0];
        const playerComp = player.getComponent('player');
        let damageType = 'kinetic';
        
        if (playerComp && playerComp.currentWeapon && playerComp.currentWeapon.damageType) {
            damageType = playerComp.currentWeapon.damageType;
        }

        // Calculate average resistance across active layers
        let totalResist = 0;
        let layerCount = 0;

        if (defense.shield.current > 0) {
            totalResist += defense.shield.resistances[damageType] || 0;
            layerCount++;
        }
        if (defense.armor.current > 0) {
            totalResist += defense.armor.resistances[damageType] || 0;
            layerCount++;
        }
        if (defense.structure.current > 0) {
            totalResist += defense.structure.resistances[damageType] || 0;
            layerCount++;
        }

        if (layerCount === 0) return;

        const avgResist = totalResist / layerCount;

        // Determine symbol and color
        let symbol, color;
        if (avgResist <= 0.15) {
            symbol = '▼';  // Weak
            color = '#00FF00';
        } else if (avgResist <= 0.40) {
            symbol = '■';  // Normal
            color = '#FFFF00';
        } else {
            symbol = '▲';  // Resistant
            color = '#FF0000';
        }

        // Draw above enemy
        this.ctx.save();
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = color;
        this.ctx.fillText(symbol, pos.x, pos.y - render.size - 25);
        this.ctx.restore();
    }

    /**
     * Render player ship
     */
    renderPlayer() {
        const players = this.world.getEntitiesByType('player');
        
        players.forEach(player => {
            const pos = player.getComponent('position');
            const render = player.getComponent('renderable');
            const health = player.getComponent('health');
            const playerComp = player.getComponent('player');
            
            if (!pos || !render) return;

            this.ctx.save();
            this.ctx.translate(pos.x, pos.y);

            // Render blade halo if active
            if (playerComp && playerComp.bladeHalo) {
                const orbitRadius = playerComp.stats.orbitRadius || 60;
                const haloAngle = playerComp.bladeHalo.angle;
                
                this.ctx.save();
                this.ctx.globalAlpha = 0.25;
                this.ctx.strokeStyle = '#00ffff'; // Cyan
                this.ctx.lineWidth = 3;
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#00ffff';
                
                // Draw rotating halo circle
                this.ctx.beginPath();
                this.ctx.arc(0, 0, orbitRadius, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // Draw rotating blade markers (4 blades)
                this.ctx.globalAlpha = 0.6;
                for (let i = 0; i < 4; i++) {
                    const angle = haloAngle + (i * Math.PI / 2);
                    const x = Math.cos(angle) * orbitRadius;
                    const y = Math.sin(angle) * orbitRadius;
                    
                    this.ctx.fillStyle = '#00ffff';
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 4, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                this.ctx.restore();
            }

            // Invulnerability flashing
            if (health && health.invulnerable && health.invulnerableTime > 0) {
                const flashAlpha = Math.sin(Date.now() * 0.02) * 0.4 + 0.6;
                this.ctx.globalAlpha = flashAlpha;
            }

            // Enhanced glow for player
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = render.color;

            // Draw player ship
            this.ctx.rotate(render.rotation);
            this.drawShape(render.shape, render.color, render.size, 0);

            this.ctx.restore();
        });
    }

    /**
     * Draw different shapes (circle, triangle, square)
     * @param {string} shape - Shape type
     * @param {string} color - Fill color
     * @param {number} size - Size/radius
     * @param {number} rotation - Additional rotation
     */
    drawShape(shape, color, size, rotation = 0) {
        this.ctx.save();
        this.ctx.rotate(rotation);
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;

        switch (shape) {
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size, 0, Math.PI * 2);
                this.ctx.fill();
                break;

            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -size);
                this.ctx.lineTo(-size * 0.866, size * 0.5);
                this.ctx.lineTo(size * 0.866, size * 0.5);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                break;

            case 'square':
                this.ctx.fillRect(-size, -size, size * 2, size * 2);
                this.ctx.strokeRect(-size, -size, size * 2, size * 2);
                break;

            case 'diamond':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -size);
                this.ctx.lineTo(size, 0);
                this.ctx.lineTo(0, size);
                this.ctx.lineTo(-size, 0);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
                break;

            case 'star':
                this.drawStar(size);
                break;

            case 'line':
                // Draw a line for beam weapons (railgun)
                this.ctx.lineWidth = 3;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = color;
                this.ctx.beginPath();
                this.ctx.moveTo(-size / 2, 0);
                this.ctx.lineTo(size / 2, 0);
                this.ctx.stroke();
                break;

            default:
                // Default to circle
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size, 0, Math.PI * 2);
                this.ctx.fill();
        }

        this.ctx.restore();
    }

    /**
     * Draw a star shape
     * @param {number} size - Star radius
     */
    drawStar(size) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.5;

        this.ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    /**
     * Draw health bar above entity
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} current - Current health
     * @param {number} max - Max health
     * @param {boolean} isBoss - Is boss health bar
     */
    drawHealthBar(x, y, current, max, isBoss = false) {
        const width = isBoss ? 200 : 40;
        const height = isBoss ? 8 : 4;
        const healthPercent = Math.max(0, current / max);

        this.ctx.save();
        this.ctx.translate(x - width / 2, y);

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, width, height);

        // Border
        this.ctx.strokeStyle = isBoss ? '#ff0000' : '#00ffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(0, 0, width, height);

        // Health fill
        const gradient = this.ctx.createLinearGradient(0, 0, width, 0);
        if (healthPercent > 0.5) {
            gradient.addColorStop(0, '#00ff00');
            gradient.addColorStop(1, '#88ff00');
        } else if (healthPercent > 0.25) {
            gradient.addColorStop(0, '#ffff00');
            gradient.addColorStop(1, '#ff8800');
        } else {
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(1, '#ff0000');
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(1, 1, (width - 2) * healthPercent, height - 2);

        this.ctx.restore();
    }

    /**
     * Render boss health bar at top of screen
     */
    renderBossHealthBar() {
        const bosses = this.world.getEntitiesByType('enemy').filter(e => e.hasComponent('boss'));
        
        if (bosses.length > 0) {
            const boss = bosses[0];
            const health = boss.getComponent('health');
            const bossComp = boss.getComponent('boss');
            const enemyComp = boss.getComponent('enemy');
            
            if (health) {
                this.bossHealthTarget = 1;
                this.bossHealthAlpha = Math.min(1, this.bossHealthAlpha + 0.05);

                const barWidth = this.canvas.width * 0.6;
                const barHeight = 30;
                const x = (this.canvas.width - barWidth) / 2;
                const y = 20;
                const healthPercent = health.current / health.max;

                this.ctx.save();
                this.ctx.globalAlpha = this.bossHealthAlpha;

                // Background
                this.ctx.fillStyle = 'rgba(10, 10, 26, 0.9)';
                this.ctx.fillRect(x - 10, y - 10, barWidth + 20, barHeight + 30);

                // Border with glow
                this.ctx.strokeStyle = '#ff00ff';
                this.ctx.lineWidth = 3;
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#ff00ff';
                this.ctx.strokeRect(x - 10, y - 10, barWidth + 20, barHeight + 30);

                // Boss name
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = '#ff00ff';
                this.ctx.font = 'bold 16px "Courier New"';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('BOSS', this.canvas.width / 2, y - 15);

                // Health bar background
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                this.ctx.fillRect(x, y, barWidth, barHeight);

                // Health bar fill
                const gradient = this.ctx.createLinearGradient(x, y, x + barWidth, y);
                gradient.addColorStop(0, '#ff0000');
                gradient.addColorStop(0.5, '#ff00ff');
                gradient.addColorStop(1, '#ff0000');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

                // Health text
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 14px "Courier New"';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    `${Math.ceil(health.current)} / ${health.max}`,
                    this.canvas.width / 2,
                    y + barHeight / 2 + 5
                );

                this.ctx.restore();
            }
        } else {
            // Fade out boss health bar
            this.bossHealthTarget = 0;
            this.bossHealthAlpha = Math.max(0, this.bossHealthAlpha - 0.05);
        }
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Reset starfield
     */
    reset() {
        this.initStarfield();
        this.bossHealthAlpha = 0;
        this.bossHealthTarget = 0;
    }
    
    /**
     * Render weather hazards (meteors, black holes)
     */
    renderWeatherHazards() {
        // Render meteors
        const meteors = this.world.getEntitiesByType('meteor');
        meteors.forEach(meteor => {
            const pos = meteor.getComponent('position');
            const meteorComp = meteor.getComponent('meteor');
            
            if (!pos || !meteorComp) return;
            
            this.ctx.save();
            this.ctx.translate(pos.x, pos.y);
            this.ctx.rotate(meteorComp.rotation);
            
            // Draw meteor as rocky brown circle with darker patches
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, meteorComp.size);
            gradient.addColorStop(0, '#A0522D');
            gradient.addColorStop(0.5, '#8B4513');
            gradient.addColorStop(1, '#654321');
            
            this.ctx.fillStyle = gradient;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#FF4500';
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, meteorComp.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add some crater-like details
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2;
                const dist = meteorComp.size * 0.4;
                const craterSize = meteorComp.size * 0.2;
                this.ctx.beginPath();
                this.ctx.arc(
                    Math.cos(angle) * dist,
                    Math.sin(angle) * dist,
                    craterSize,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
        
        // Render black holes
        const blackHoles = this.world.getEntitiesByType('black_hole');
        blackHoles.forEach(blackHole => {
            const pos = blackHole.getComponent('position');
            const blackHoleComp = blackHole.getComponent('black_hole');
            
            if (!pos || !blackHoleComp) return;
            
            // Calculate scale based on age (grows during grace period)
            const age = blackHoleComp.age || 0;
            const gracePeriod = blackHoleComp.gracePeriod || 1.0;
            const scale = age < gracePeriod ? (age / gracePeriod) : 1.0;
            
            this.ctx.save();
            this.ctx.translate(pos.x, pos.y);
            this.ctx.scale(scale, scale);
            
            // Draw swirling vortex effect
            const numRings = 6;
            for (let i = 0; i < numRings; i++) {
                const ringProgress = i / numRings;
                const radius = blackHoleComp.pullRadius * (1 - ringProgress * 0.8);
                const alpha = (1 - ringProgress) * 0.3 * scale; // Fade in during grace period
                const rotation = blackHoleComp.rotation + ringProgress * Math.PI;
                
                this.ctx.save();
                this.ctx.rotate(rotation);
                this.ctx.globalAlpha = alpha;
                
                // Create spiral gradient
                const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
                gradient.addColorStop(0, 'rgba(148, 0, 211, 0.8)');
                gradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.5)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            }
            
            // Draw core (event horizon)
            const coreGradient = this.ctx.createRadialGradient(
                0, 0, 0,
                0, 0, blackHoleComp.damageRadius
            );
            coreGradient.addColorStop(0, '#000000');
            coreGradient.addColorStop(0.7, '#1a001a');
            coreGradient.addColorStop(1, '#4B0082');
            
            this.ctx.fillStyle = coreGradient;
            this.ctx.shadowBlur = 30 * scale;
            this.ctx.shadowColor = '#9400D3';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, blackHoleComp.damageRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw accretion disk particles
            this.ctx.globalAlpha = 0.6 * scale;
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2 + blackHoleComp.rotation * 2;
                const dist = blackHoleComp.damageRadius * 1.5 + Math.sin(blackHoleComp.rotation + i) * 20;
                const x = Math.cos(angle) * dist;
                const y = Math.sin(angle) * dist;
                
                this.ctx.fillStyle = i % 3 === 0 ? '#9400D3' : '#4B0082';
                this.ctx.beginPath();
                this.ctx.arc(x, y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
    }
}
