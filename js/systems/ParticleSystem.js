/**
 * @file ParticleSystem.js
 * @description Particle effects system for explosions, impacts, and visual feedback
 */

class ParticleSystem {
    constructor(world) {
        this.world = world;
    }

    /**
     * Update all particles
     * @param {number} deltaTime - Time elapsed since last frame
     */
    update(deltaTime) {
        const particles = this.world.getEntitiesByType('particle');
        
        for (const particle of particles) {
            this.updateParticle(particle, deltaTime);
        }
    }

    /**
     * Update individual particle
     * @param {Entity} particle - Particle entity
     * @param {number} deltaTime - Time elapsed
     */
    updateParticle(particle, deltaTime) {
        const particleComp = particle.getComponent('particle');
        const pos = particle.getComponent('position');
        const vel = particle.getComponent('velocity');
        const renderable = particle.getComponent('renderable');
        
        if (!particleComp || !pos || !renderable) return;

        // Update lifetime
        particleComp.lifetime -= deltaTime;
        
        if (particleComp.lifetime <= 0) {
            this.world.removeEntity(particle.id);
            return;
        }

        // Update position with velocity
        if (vel) {
            pos.x += vel.vx * deltaTime;
            pos.y += vel.vy * deltaTime;
            
            // Apply decay to velocity
            vel.vx *= particleComp.decay;
            vel.vy *= particleComp.decay;
        }

        // Update alpha based on lifetime
        const lifetimePercent = particleComp.lifetime / particleComp.maxLifetime;
        particleComp.alpha = lifetimePercent;
        renderable.alpha = particleComp.alpha;

        // Update size based on lifetime (shrink over time)
        if (renderable.baseSize) {
            renderable.size = renderable.baseSize * lifetimePercent;
        }
    }

    /**
     * Create explosion particle effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} size - Explosion size
     * @param {string} color - Explosion color
     * @param {number} particleCount - Number of particles
     */
    createExplosion(x, y, size, color, particleCount = 20) {
        const colors = this.getColorVariations(color, 3);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const speed = (50 + Math.random() * 150) * (size / 20);
            const particleSize = 3 + Math.random() * 5 * (size / 20);
            const particleColor = colors[Math.floor(Math.random() * colors.length)];
            
            const particle = this.world.createEntity('particle');
            particle.addComponent('position', Components.Position(x, y));
            particle.addComponent('velocity', Components.Velocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            ));
            particle.addComponent('renderable', Components.Renderable(
                particleColor,
                particleSize,
                'circle'
            ));
            particle.addComponent('particle', Components.Particle(
                0.5 + Math.random() * 0.5,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                0.92
            ));
            
            const renderable = particle.getComponent('renderable');
            renderable.baseSize = particleSize;
            renderable.glow = true;
        }

        // Add a shockwave ring
        this.createShockwave(x, y, size, color);
    }

    /**
     * Create impact particle effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} angle - Impact direction
     * @param {string} color - Impact color
     */
    createImpact(x, y, angle, color) {
        const particleCount = 8;
        const spreadAngle = Math.PI / 3;
        
        for (let i = 0; i < particleCount; i++) {
            const offsetAngle = angle + (i - particleCount / 2) * (spreadAngle / particleCount);
            const speed = 100 + Math.random() * 100;
            const particleSize = 2 + Math.random() * 3;
            
            const particle = this.world.createEntity('particle');
            particle.addComponent('position', Components.Position(x, y));
            particle.addComponent('velocity', Components.Velocity(
                Math.cos(offsetAngle) * speed,
                Math.sin(offsetAngle) * speed
            ));
            particle.addComponent('renderable', Components.Renderable(
                color,
                particleSize,
                'circle'
            ));
            particle.addComponent('particle', Components.Particle(
                0.3 + Math.random() * 0.2,
                Math.cos(offsetAngle) * speed,
                Math.sin(offsetAngle) * speed,
                0.88
            ));
            
            const renderable = particle.getComponent('renderable');
            renderable.baseSize = particleSize;
            renderable.glow = true;
        }
    }

    /**
     * Create spark particle effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Spark color
     * @param {number} count - Number of sparks
     */
    createSparks(x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 150;
            const size = 2 + Math.random() * 2;
            
            const particle = this.world.createEntity('particle');
            particle.addComponent('position', Components.Position(x, y));
            particle.addComponent('velocity', Components.Velocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            ));
            particle.addComponent('renderable', Components.Renderable(
                color,
                size,
                'circle'
            ));
            particle.addComponent('particle', Components.Particle(
                0.4 + Math.random() * 0.3,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                0.85
            ));
            
            const renderable = particle.getComponent('renderable');
            renderable.baseSize = size;
            renderable.glow = true;
            renderable.glowIntensity = 0.8;
        }
    }

    /**
     * Create trail particle effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Trail color
     * @param {number} size - Trail size
     */
    createTrail(x, y, color, size = 3) {
        const particle = this.world.createEntity('particle');
        particle.addComponent('position', Components.Position(x, y));
        particle.addComponent('renderable', Components.Renderable(color, size, 'circle'));
        particle.addComponent('particle', Components.Particle(
            0.2,
            0,
            0,
            1.0
        ));
        
        const renderable = particle.getComponent('renderable');
        renderable.baseSize = size;
        renderable.glow = true;
        renderable.glowIntensity = 0.5;
    }

    /**
     * Create shockwave effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} size - Shockwave size
     * @param {string} color - Shockwave color
     */
    createShockwave(x, y, size, color) {
        const ringCount = 2;
        
        for (let ring = 0; ring < ringCount; ring++) {
            const delay = ring * 0.05;
            const particleCount = 20;
            
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2;
                const speed = (150 + ring * 50) * (size / 20);
                
                const particle = this.world.createEntity('particle');
                particle.addComponent('position', Components.Position(x, y));
                particle.addComponent('velocity', Components.Velocity(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                ));
                particle.addComponent('renderable', Components.Renderable(
                    color,
                    3,
                    'circle'
                ));
                particle.addComponent('particle', Components.Particle(
                    0.4 - delay,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    0.95
                ));
                
                const renderable = particle.getComponent('renderable');
                renderable.baseSize = 3;
                renderable.glow = true;
                renderable.glowIntensity = 0.6;
            }
        }
    }

    /**
     * Create glow pulse effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Glow color
     * @param {number} size - Glow size
     */
    createGlow(x, y, color, size) {
        const particle = this.world.createEntity('particle');
        particle.addComponent('position', Components.Position(x, y));
        particle.addComponent('renderable', Components.Renderable(color, size, 'circle'));
        particle.addComponent('particle', Components.Particle(
            0.5,
            0,
            0,
            1.0
        ));
        
        const renderable = particle.getComponent('renderable');
        renderable.baseSize = size;
        renderable.glow = true;
        renderable.glowIntensity = 1.0;
    }

    /**
     * Create lightning arc effect
     * @param {number} x1 - Start X position
     * @param {number} y1 - Start Y position
     * @param {number} x2 - End X position
     * @param {number} y2 - End Y position
     * @param {string} color - Lightning color
     */
    createLightning(x1, y1, x2, y2, color) {
        const segments = 8;
        const jitter = 15;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * jitter;
            const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * jitter;
            
            const particle = this.world.createEntity('particle');
            particle.addComponent('position', Components.Position(x, y));
            particle.addComponent('renderable', Components.Renderable(color, 4, 'circle'));
            particle.addComponent('particle', Components.Particle(
                0.15,
                0,
                0,
                1.0
            ));
            
            const renderable = particle.getComponent('renderable');
            renderable.baseSize = 4;
            renderable.glow = true;
            renderable.glowIntensity = 1.0;
        }
    }

    /**
     * Create damage numbers effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} damage - Damage amount
     * @param {boolean} isCrit - Whether it's a critical hit
     */
    createDamageNumber(x, y, damage, isCrit = false) {
        // This would require text rendering support
        // Placeholder for future implementation
        const color = isCrit ? '#FF00FF' : '#FFFFFF';
        const size = isCrit ? 10 : 6;
        
        const particle = this.world.createEntity('particle');
        particle.addComponent('position', Components.Position(x, y));
        particle.addComponent('velocity', Components.Velocity(0, -50));
        particle.addComponent('renderable', Components.Renderable(color, size, 'circle'));
        particle.addComponent('particle', Components.Particle(
            1.0,
            0,
            -50,
            0.98
        ));
        
        const particleComp = particle.getComponent('particle');
        particleComp.damageText = Math.floor(damage);
        particleComp.isCrit = isCrit;
    }

    /**
     * Get color variations for particle effects
     * @param {string} baseColor - Base color hex
     * @param {number} count - Number of variations
     * @returns {Array<string>} Array of color variations
     */
    getColorVariations(baseColor, count) {
        // Neon sci-fi color palette
        const neonColors = {
            '#FF1493': ['#FF1493', '#FF69B4', '#FF00FF'], // Pink/Magenta
            '#00FFFF': ['#00FFFF', '#00BFFF', '#40E0D0'], // Cyan/Aqua
            '#FF4500': ['#FF4500', '#FF6347', '#FF8C00'], // Orange/Red
            '#00FF00': ['#00FF00', '#32CD32', '#7FFF00'], // Green
            '#FFD700': ['#FFD700', '#FFFF00', '#FFA500'], // Yellow/Gold
            '#4169E1': ['#4169E1', '#6495ED', '#00BFFF'], // Blue
            '#9370DB': ['#9370DB', '#BA55D3', '#DA70D6'], // Purple
            '#DC143C': ['#DC143C', '#FF0000', '#8B0000']  // Red/Crimson
        };
        
        return neonColors[baseColor] || [baseColor, baseColor, baseColor];
    }

    /**
     * Create chain lightning effect between points
     * @param {Array<{x: number, y: number}>} points - Array of positions
     * @param {string} color - Lightning color
     */
    createChainLightning(points, color) {
        for (let i = 0; i < points.length - 1; i++) {
            this.createLightning(
                points[i].x,
                points[i].y,
                points[i + 1].x,
                points[i + 1].y,
                color
            );
        }
    }

    /**
     * Create beam effect
     * @param {number} x1 - Start X position
     * @param {number} y1 - Start Y position
     * @param {number} x2 - End X position
     * @param {number} y2 - End Y position
     * @param {string} color - Beam color
     * @param {number} width - Beam width
     */
    createBeam(x1, y1, x2, y2, color, width = 5) {
        const distance = MathUtils.distance(x1, y1, x2, y2);
        const segments = Math.floor(distance / 10);
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            
            const particle = this.world.createEntity('particle');
            particle.addComponent('position', Components.Position(x, y));
            particle.addComponent('renderable', Components.Renderable(color, width, 'circle'));
            particle.addComponent('particle', Components.Particle(
                0.1,
                0,
                0,
                1.0
            ));
            
            const renderable = particle.getComponent('renderable');
            renderable.baseSize = width;
            renderable.glow = true;
            renderable.glowIntensity = 0.8;
        }
    }

    /**
     * Create orbital trail effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Trail color
     */
    createOrbitalTrail(x, y, color) {
        const particle = this.world.createEntity('particle');
        particle.addComponent('position', Components.Position(x, y));
        particle.addComponent('renderable', Components.Renderable(color, 8, 'circle'));
        particle.addComponent('particle', Components.Particle(
            0.15,
            0,
            0,
            1.0
        ));
        
        const renderable = particle.getComponent('renderable');
        renderable.baseSize = 8;
        renderable.glow = true;
        renderable.glowIntensity = 0.4;
    }
}
