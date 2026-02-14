/**
 * @file phaser/systems/PhaserEnemySystem.js
 * @description Enemy management system for Phaser
 * Handles enemy spawning, AI behaviors, and visual representation
 */

export class PhaserEnemySystem {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.spawnTimer = 0;
        this.waveNumber = 1;
        this.enemyTypes = this.loadEnemyTypes();
    }

    /**
     * Load enemy type definitions
     */
    loadEnemyTypes() {
        if (!window.ENEMY_PROFILES) {
            console.error('Enemy data not loaded');
            return {};
        }

        // Select 6 core enemy types
        const types = {
            SCOUT_DRONE: window.ENEMY_PROFILES.SCOUT_DRONE,
            ARMORED_CRUISER: window.ENEMY_PROFILES.ARMORED_CRUISER,
            PLASMA_ENTITY: window.ENEMY_PROFILES.PLASMA_ENTITY,
            SIEGE_HULK: window.ENEMY_PROFILES.SIEGE_HULK,
            INTERCEPTOR: window.ENEMY_PROFILES.INTERCEPTOR,
            ELITE_DESTROYER: window.ENEMY_PROFILES.ELITE_DESTROYER
        };

        console.log('Loaded enemy types:', Object.keys(types));
        return types;
    }

    /**
     * Update enemy system
     * @param {number} deltaTime - Time in seconds
     * @param {object} playerPos - Player position
     */
    update(deltaTime, playerPos) {
        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        // Spawn enemies based on wave
        const spawnInterval = Math.max(2, 5 - this.waveNumber * 0.2); // Faster over time
        if (this.spawnTimer >= spawnInterval) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }

        // Update all enemies
        this.enemies.forEach((enemy, index) => {
            if (enemy.destroyed) {
                enemy.graphics.destroy();
                if (enemy.healthBar) enemy.healthBar.destroy();
                if (enemy.healthBarBg) enemy.healthBarBg.destroy();
                this.enemies.splice(index, 1);
                return;
            }

            this.updateEnemy(enemy, deltaTime, playerPos);
        });
    }

    /**
     * Spawn a new enemy
     */
    spawnEnemy() {
        // Select enemy type based on wave
        const typeKey = this.selectEnemyType();
        const enemyData = this.enemyTypes[typeKey];
        
        if (!enemyData) {
            console.warn('Enemy type not found:', typeKey);
            return;
        }

        // Random spawn position at top
        const x = Phaser.Math.Between(50, this.scene.cameras.main.width - 50);
        const y = -50;

        // Create enemy visual
        const graphics = this.scene.add.graphics();
        this.drawEnemy(graphics, enemyData);
        graphics.x = x;
        graphics.y = y;
        graphics.setDepth(8);

        // Create health bar
        const healthBarBg = this.scene.add.rectangle(x, y - 20, 30, 3, 0x660000);
        healthBarBg.setDepth(9);
        
        const healthBar = this.scene.add.rectangle(x, y - 20, 30, 3, 0x00ff00);
        healthBar.setDepth(10);

        const enemy = {
            graphics,
            healthBar,
            healthBarBg,
            x,
            y,
            vx: 0,
            vy: 0,
            data: enemyData,
            health: enemyData.defense.shield + enemyData.defense.armor + enemyData.defense.structure,
            maxHealth: enemyData.defense.shield + enemyData.defense.armor + enemyData.defense.structure,
            shield: enemyData.defense.shield,
            armor: enemyData.defense.armor,
            structure: enemyData.defense.structure,
            maxShield: enemyData.defense.shield,
            maxArmor: enemyData.defense.armor,
            maxStructure: enemyData.defense.structure,
            destroyed: false,
            aiState: {
                type: enemyData.aiType || 'chase',
                timer: 0,
                targetOffset: { x: 0, y: 0 }
            }
        };

        this.enemies.push(enemy);
    }

    /**
     * Select enemy type based on wave
     */
    selectEnemyType() {
        const wave = this.waveNumber;
        
        // Early waves: mostly scouts
        if (wave < 3) {
            return 'SCOUT_DRONE';
        }
        
        // Mid waves: mix of types
        if (wave < 5) {
            return Phaser.Math.RND.pick(['SCOUT_DRONE', 'ARMORED_CRUISER', 'PLASMA_ENTITY']);
        }
        
        // Late waves: introduce harder enemies
        if (wave < 8) {
            return Phaser.Math.RND.pick([
                'SCOUT_DRONE', 
                'ARMORED_CRUISER', 
                'PLASMA_ENTITY',
                'INTERCEPTOR'
            ]);
        }
        
        // End game: all types
        return Phaser.Math.RND.pick(Object.keys(this.enemyTypes));
    }

    /**
     * Draw enemy visual
     */
    drawEnemy(graphics, enemyData) {
        const size = enemyData.size || 15;
        const color = parseInt(enemyData.color.replace('#', '0x'));
        const secondaryColor = parseInt((enemyData.secondaryColor || enemyData.color).replace('#', '0x'));

        graphics.clear();
        
        // Different shapes per enemy type
        switch (enemyData.id) {
            case 'scout_drone':
                // Diamond shape
                graphics.fillStyle(color, 1);
                graphics.fillTriangle(0, -size, -size * 0.7, 0, 0, size);
                graphics.fillTriangle(0, -size, size * 0.7, 0, 0, size);
                break;
                
            case 'armored_cruiser':
                // Rectangle (tank)
                graphics.fillStyle(color, 1);
                graphics.fillRect(-size, -size * 0.8, size * 2, size * 1.6);
                graphics.fillStyle(secondaryColor, 1);
                graphics.fillRect(-size * 0.6, -size * 0.5, size * 1.2, size);
                break;
                
            case 'plasma_entity':
                // Pulsing circle
                graphics.fillStyle(color, 0.8);
                graphics.fillCircle(0, 0, size);
                graphics.lineStyle(2, secondaryColor, 0.6);
                graphics.strokeCircle(0, 0, size * 1.3);
                break;
                
            case 'siege_hulk':
                // Large hexagon
                graphics.fillStyle(color, 1);
                graphics.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const x = Math.cos(angle) * size;
                    const y = Math.sin(angle) * size;
                    if (i === 0) graphics.moveTo(x, y);
                    else graphics.lineTo(x, y);
                }
                graphics.closePath();
                graphics.fillPath();
                break;
                
            case 'interceptor':
                // Fast triangle
                graphics.fillStyle(color, 1);
                graphics.fillTriangle(0, -size * 1.2, -size * 0.6, size * 0.6, size * 0.6, size * 0.6);
                graphics.fillStyle(secondaryColor, 0.7);
                graphics.fillTriangle(0, -size * 0.7, -size * 0.4, size * 0.3, size * 0.4, size * 0.3);
                break;
                
            case 'elite_destroyer':
                // Complex cross shape
                graphics.fillStyle(color, 1);
                graphics.fillRect(-size * 1.2, -size * 0.4, size * 2.4, size * 0.8);
                graphics.fillRect(-size * 0.4, -size * 1.2, size * 0.8, size * 2.4);
                graphics.fillStyle(secondaryColor, 1);
                graphics.fillCircle(0, 0, size * 0.5);
                break;
                
            default:
                // Default circle
                graphics.fillStyle(color, 1);
                graphics.fillCircle(0, 0, size);
        }

        // Add outline
        graphics.lineStyle(1, 0xffffff, 0.5);
        graphics.strokeCircle(0, 0, size);
    }

    /**
     * Update individual enemy
     */
    updateEnemy(enemy, deltaTime, playerPos) {
        // AI behavior
        this.updateAI(enemy, deltaTime, playerPos);

        // Update position
        enemy.x += enemy.vx * deltaTime;
        enemy.y += enemy.vy * deltaTime;

        // Update graphics
        enemy.graphics.x = enemy.x;
        enemy.graphics.y = enemy.y;

        // Update health bar
        if (enemy.healthBar) {
            const healthPercent = enemy.health / enemy.maxHealth;
            enemy.healthBar.width = 30 * healthPercent;
            enemy.healthBar.x = enemy.x - 15 + (30 * healthPercent) / 2;
            enemy.healthBar.y = enemy.y - 25;
            enemy.healthBarBg.x = enemy.x;
            enemy.healthBarBg.y = enemy.y - 25;

            // Color based on layer
            if (enemy.shield > 0) {
                enemy.healthBar.setFillStyle(0x00ccff); // Cyan for shield
            } else if (enemy.armor > 0) {
                enemy.healthBar.setFillStyle(0xffaa00); // Orange for armor
            } else {
                enemy.healthBar.setFillStyle(0xff0000); // Red for structure
            }
        }

        // Remove if off screen bottom
        if (enemy.y > this.scene.cameras.main.height + 100) {
            enemy.destroyed = true;
        }
    }

    /**
     * Update enemy AI
     */
    updateAI(enemy, deltaTime, playerPos) {
        const aiType = enemy.aiState.type;
        const speed = enemy.data.speed || 80;

        switch (aiType) {
            case 'chase':
                // Simple chase behavior
                const dx = playerPos.x - enemy.x;
                const dy = playerPos.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    enemy.vx = (dx / dist) * speed;
                    enemy.vy = (dy / dist) * speed;
                }
                break;

            case 'weave':
                // Weaving movement
                enemy.aiState.timer += deltaTime;
                const weaveDx = playerPos.x - enemy.x;
                const weaveDy = playerPos.y - enemy.y;
                const weaveDist = Math.sqrt(weaveDx * weaveDx + weaveDy * weaveDy);
                
                if (weaveDist > 0) {
                    // Move toward player but weave side to side
                    const weaveOffset = Math.sin(enemy.aiState.timer * 3) * 100;
                    enemy.vx = (weaveDx / weaveDist) * speed * 0.7 + weaveOffset;
                    enemy.vy = (weaveDy / weaveDist) * speed;
                }
                break;

            case 'slow_advance':
                // Slow steady advance
                enemy.vy = speed * 0.5;
                enemy.vx = 0;
                break;

            case 'aggressive':
                // Fast aggressive chase
                const aggDx = playerPos.x - enemy.x;
                const aggDy = playerPos.y - enemy.y;
                const aggDist = Math.sqrt(aggDx * aggDx + aggDy * aggDy);
                
                if (aggDist > 0) {
                    enemy.vx = (aggDx / aggDist) * speed * 1.5;
                    enemy.vy = (aggDy / aggDist) * speed * 1.5;
                }
                break;

            case 'tactical':
                // Keep distance and circle
                enemy.aiState.timer += deltaTime;
                const tactDx = playerPos.x - enemy.x;
                const tactDy = playerPos.y - enemy.y;
                const tactDist = Math.sqrt(tactDx * tactDx + tactDy * tactDy);
                
                const preferredDist = 200;
                
                if (tactDist > 0) {
                    if (tactDist < preferredDist) {
                        // Move away
                        enemy.vx = -(tactDx / tactDist) * speed;
                        enemy.vy = -(tactDy / tactDist) * speed;
                    } else {
                        // Circle around
                        const angle = Math.atan2(tactDy, tactDx) + Math.PI / 2;
                        enemy.vx = Math.cos(angle) * speed;
                        enemy.vy = Math.sin(angle) * speed * 0.5 + speed * 0.5; // Drift downward
                    }
                }
                break;

            default:
                // Default: slow descent
                enemy.vy = speed * 0.3;
        }
    }

    /**
     * Damage an enemy
     * @param {object} enemy - Enemy to damage
     * @param {number} damage - Damage amount
     * @param {string} damageType - Type of damage (em, thermal, kinetic, explosive)
     */
    damageEnemy(enemy, damage, damageType) {
        // Apply damage to defense layers
        let remainingDamage = damage;

        // Check for weakness bonus
        const weaknessMultiplier = enemy.data.weakness === damageType ? 1.5 : 1.0;
        remainingDamage *= weaknessMultiplier;

        // Shield layer
        if (enemy.shield > 0 && damageType === 'em') {
            // EM does 150% to shields
            const shieldDamage = Math.min(enemy.shield, remainingDamage * 1.5);
            enemy.shield -= shieldDamage;
            remainingDamage -= shieldDamage / 1.5;
        } else if (enemy.shield > 0) {
            const shieldDamage = Math.min(enemy.shield, remainingDamage);
            enemy.shield -= shieldDamage;
            remainingDamage -= shieldDamage;
        }

        // Armor layer
        if (remainingDamage > 0 && enemy.armor > 0) {
            if (damageType === 'kinetic' || damageType === 'explosive') {
                // Kinetic and explosive do better against armor
                const armorDamage = Math.min(enemy.armor, remainingDamage * 1.2);
                enemy.armor -= armorDamage;
                remainingDamage -= armorDamage / 1.2;
            } else {
                const armorDamage = Math.min(enemy.armor, remainingDamage * 0.5);
                enemy.armor -= armorDamage;
                remainingDamage -= armorDamage / 0.5;
            }
        }

        // Structure layer
        if (remainingDamage > 0 && enemy.structure > 0) {
            if (damageType === 'thermal') {
                // Thermal does bonus to structure
                const structureDamage = Math.min(enemy.structure, remainingDamage * 1.3);
                enemy.structure -= structureDamage;
            } else {
                enemy.structure -= Math.min(enemy.structure, remainingDamage);
            }
        }

        // Update total health
        enemy.health = enemy.shield + enemy.armor + enemy.structure;

        // Create damage number
        this.showDamageNumber(enemy.x, enemy.y - 30, Math.floor(damage));

        // Check for death
        if (enemy.health <= 0) {
            this.destroyEnemy(enemy);
        }
    }

    /**
     * Destroy an enemy
     */
    destroyEnemy(enemy) {
        enemy.destroyed = true;

        // Create explosion effect
        const color = parseInt(enemy.data.color.replace('#', '0x'));
        
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const speed = 80 + Math.random() * 40;
            
            const particle = this.scene.add.circle(
                enemy.x, 
                enemy.y, 
                3 + Math.random() * 3, 
                color, 
                1
            );
            particle.setDepth(17);
            
            this.scene.tweens.add({
                targets: particle,
                x: enemy.x + Math.cos(angle) * speed,
                y: enemy.y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0,
                duration: 400 + Math.random() * 200,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // Camera shake
        this.scene.cameras.main.shake(100, 0.005);
    }

    /**
     * Show damage number
     */
    showDamageNumber(x, y, damage) {
        const text = this.scene.add.text(x, y, `-${damage}`, {
            font: 'bold 14px monospace',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(50);

        this.scene.tweens.add({
            targets: text,
            y: y - 30,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    /**
     * Get all enemies (for targeting)
     */
    getEnemies() {
        return this.enemies.filter(e => !e.destroyed);
    }

    /**
     * Increase wave difficulty
     */
    nextWave() {
        this.waveNumber++;
        console.log('Wave', this.waveNumber);
    }

    /**
     * Cleanup
     */
    destroy() {
        this.enemies.forEach(enemy => {
            enemy.graphics.destroy();
            if (enemy.healthBar) enemy.healthBar.destroy();
            if (enemy.healthBarBg) enemy.healthBarBg.destroy();
        });
        this.enemies = [];
    }
}
