# Phaser Port Implementation Guide

## Quick Start for Developers

This guide provides practical steps for implementing the Phaser port.

## 🚀 Setup

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser (should auto-open to http://localhost:3000)

# 4. Make changes and see hot reload in action
```

## 📝 Implementation Priority

### Phase 1: Core Gameplay (Current)
- [x] Basic project setup
- [x] Phaser scenes structure
- [x] Player movement
- [x] Enemy spawning
- [x] Basic collision
- [ ] **NEXT: Weapon system**

### Phase 2: Combat System
- [ ] Auto-firing weapons
- [ ] All weapon types (8 weapons)
- [ ] Projectile behaviors
- [ ] Damage system integration
- [ ] Visual feedback

### Phase 3: Enemies & AI
- [ ] All 6 enemy types
- [ ] Enemy behaviors
- [ ] Pathfinding
- [ ] Attack patterns
- [ ] Boss mechanics

### Phase 4: Progression
- [ ] XP system
- [ ] Leveling
- [ ] Level-up screen
- [ ] Boost selection
- [ ] Weapon evolution

### Phase 5: Visual Polish
- [ ] Particle effects
- [ ] Screen effects
- [ ] Better animations
- [ ] UI improvements

### Phase 6: Meta-Progression
- [ ] Noyaux currency
- [ ] Permanent upgrades
- [ ] Ship unlocks
- [ ] Save/load system

## 🔧 How to Port a System

### Example: Porting CombatSystem

#### Step 1: Understand the Original

```javascript
// js/systems/CombatSystem.js
class CombatSystem {
    update(deltaTime) {
        // Find all entities with weapons
        const entities = this.world.query(['weapon', 'position']);
        
        entities.forEach(entity => {
            const weapon = entity.components.weapon;
            weapon.cooldown -= deltaTime;
            
            if (weapon.cooldown <= 0) {
                this.fireWeapon(entity, weapon);
                weapon.cooldown = weapon.fireRate;
            }
        });
    }
    
    fireWeapon(entity, weapon) {
        // Create projectile
        const projectile = this.world.createEntity('projectile');
        projectile.addComponent('position', { 
            x: entity.components.position.x, 
            y: entity.components.position.y 
        });
        projectile.addComponent('velocity', { 
            vx: 0, 
            vy: -300 
        });
        projectile.addComponent('damage', { 
            amount: weapon.damage 
        });
    }
}
```

**Analysis**: 
- ✅ Core logic is pure (no rendering)
- ✅ Uses ECS components
- ✅ Can be reused as-is
- ❌ No sound effects (need to add)
- ❌ No visual effects (PhaserECSBridge will handle)

#### Step 2: Integrate with Phaser

```javascript
// phaser/scenes/GameScene.js
create() {
    // ... existing code ...
    
    // Add CombatSystem
    this.combatSystem = new CombatSystem(this.world);
    
    // Listen for projectile creation to add sound
    this.world.events.on('entityCreated', (entity) => {
        if (entity.type === 'projectile') {
            this.sound.play('laser_shot', { volume: 0.3 });
        }
    });
}

update(time, delta) {
    const dt = delta / 1000;
    
    // ... other systems ...
    
    // Update combat system
    this.combatSystem.update(dt);
    
    // ECS bridge creates sprites for new projectiles automatically
    this.ecsBridge.updateAll();
}
```

**That's it!** The system works with zero changes.

#### Step 3: Add Enhancements (Optional)

```javascript
// Add muzzle flash effect
fireWeapon(entity, weapon) {
    // ... create projectile ...
    
    // Emit event for effects
    this.world.events.emit('weaponFired', {
        x: entity.components.position.x,
        y: entity.components.position.y,
        weaponType: weapon.type
    });
}

// In GameScene
create() {
    this.world.events.on('weaponFired', (data) => {
        // Create muzzle flash particle
        const flash = this.add.circle(data.x, data.y, 10, 0xffff00, 0.8);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 100,
            onComplete: () => flash.destroy()
        });
    });
}
```

## 🎨 Adding Visual Effects

### Screen Shake

```javascript
// In GameScene
damagePlayer(amount) {
    this.playerHealth -= amount;
    
    // Screen shake using Phaser camera
    this.cameras.main.shake(200, 0.01);
}
```

### Flash Effect

```javascript
// In GameScene
create() {
    // Create flash overlay
    this.flashOverlay = this.add.rectangle(
        0, 0,
        this.cameras.main.width,
        this.cameras.main.height,
        0xff0000,
        0
    );
    this.flashOverlay.setOrigin(0);
    this.flashOverlay.setDepth(1000);
}

flashScreen(color = 0xff0000, duration = 100) {
    this.flashOverlay.setFillStyle(color, 0.5);
    this.tweens.add({
        targets: this.flashOverlay,
        alpha: 0,
        duration: duration
    });
}
```

### Particle Explosion

```javascript
// Create explosion at position
createExplosion(x, y, color = 0xff6600) {
    // Method 1: Simple particles with graphics
    for (let i = 0; i < 10; i++) {
        const particle = this.add.circle(x, y, 3, color, 1);
        const angle = (Math.PI * 2 * i) / 10;
        const speed = 100 + Math.random() * 100;
        
        this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * speed,
            y: y + Math.sin(angle) * speed,
            alpha: 0,
            duration: 500,
            onComplete: () => particle.destroy()
        });
    }
    
    // Method 2: Phaser particle emitter (more efficient)
    // const emitter = this.add.particles(x, y, 'particle', {
    //     speed: { min: 50, max: 200 },
    //     scale: { start: 1, end: 0 },
    //     lifespan: 500,
    //     quantity: 10
    // });
    // emitter.explode();
}
```

## 🎵 Adding Audio

### Setup Audio Manager

```javascript
// phaser/scenes/BootScene.js
preload() {
    // Load audio files (when you have them)
    // this.load.audio('laser_shot', 'assets/audio/laser.mp3');
    // this.load.audio('explosion', 'assets/audio/explosion.mp3');
    // this.load.audio('powerup', 'assets/audio/powerup.mp3');
}

// phaser/scenes/GameScene.js
create() {
    // Play sound
    this.sound.play('laser_shot', { volume: 0.5 });
    
    // Background music (loop)
    this.bgMusic = this.sound.add('bg_music', { 
        loop: true, 
        volume: 0.3 
    });
    this.bgMusic.play();
}
```

### Procedural Audio (Without Files)

```javascript
// phaser/utils/ProceduralAudio.js
export class ProceduralAudio {
    static playLaserSound(scene) {
        // Create simple beep using Web Audio API
        const context = scene.sound.context;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        
        oscillator.connect(gain);
        gain.connect(context.destination);
        
        oscillator.frequency.value = 440;
        oscillator.type = 'sine';
        
        gain.gain.setValueAtTime(0.3, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.1);
    }
}
```

## 🎮 Adding UI Elements

### Health Bar

```javascript
// In GameScene.create()
createHealthBar() {
    const x = 60;
    const y = 30;
    const width = 200;
    const height = 20;
    
    // Background
    this.healthBarBg = this.add.rectangle(x, y, width, height, 0x330000);
    this.healthBarBg.setOrigin(0, 0.5);
    this.healthBarBg.setDepth(100);
    
    // Fill
    this.healthBar = this.add.rectangle(x, y, width, height, 0x00ff00);
    this.healthBar.setOrigin(0, 0.5);
    this.healthBar.setDepth(101);
    
    // Text
    this.healthText = this.add.text(20, y, 'HP:', {
        font: 'bold 16px monospace',
        fill: '#ffffff'
    });
    this.healthText.setOrigin(0, 0.5);
    this.healthText.setDepth(102);
}

updateHealthBar() {
    const percent = this.playerHealth / this.playerMaxHealth;
    this.healthBar.width = 200 * percent;
    
    // Color based on health
    if (percent > 0.5) {
        this.healthBar.setFillStyle(0x00ff00);
    } else if (percent > 0.25) {
        this.healthBar.setFillStyle(0xffff00);
    } else {
        this.healthBar.setFillStyle(0xff0000);
    }
}
```

### Damage Numbers

```javascript
showDamageNumber(x, y, damage) {
    const text = this.add.text(x, y, `-${damage}`, {
        font: 'bold 20px monospace',
        fill: '#ff0000',
        stroke: '#000000',
        strokeThickness: 3
    });
    text.setOrigin(0.5);
    text.setDepth(50);
    
    this.tweens.add({
        targets: text,
        y: y - 50,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => text.destroy()
    });
}
```

## 📊 Debugging Tips

### Enable Phaser Debug Mode

```javascript
// phaser/config.js
export const GAME_CONFIG = {
    // ...
    physics: {
        default: 'arcade',
        arcade: {
            debug: true, // Shows collision boxes
            gravity: { y: 0 }
        }
    }
};
```

### ECS Inspector

```javascript
// Add to GameScene
create() {
    // Press F1 to toggle ECS inspector
    this.input.keyboard.on('keydown-F1', () => {
        console.log('=== ECS World State ===');
        console.log('Total entities:', this.world.entities.size);
        
        const types = {};
        this.world.entities.forEach(entity => {
            types[entity.type] = (types[entity.type] || 0) + 1;
        });
        console.table(types);
        
        console.log('Systems:', this.systems.map(s => s.constructor.name));
    });
}
```

### Performance Monitoring

```javascript
// Add FPS counter
create() {
    this.fpsText = this.add.text(10, 10, 'FPS: 60', {
        font: '14px monospace',
        fill: '#00ff00'
    });
    this.fpsText.setDepth(1000);
}

update() {
    this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
}
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Player moves smoothly with WASD
- [ ] Enemies spawn and move toward player
- [ ] Collisions work (player-enemy, projectile-enemy)
- [ ] Health bar updates correctly
- [ ] Score increases when enemies die
- [ ] Game over screen appears when health reaches 0
- [ ] Can restart from game over
- [ ] Can return to menu from game over
- [ ] No console errors
- [ ] Performance is smooth (60 FPS)

### Comparing with Original

```javascript
// Open both versions side by side
// http://localhost:3000/index.html (original)
// http://localhost:3000/index-phaser.html (Phaser)

// Verify:
// 1. Same movement speed
// 2. Same enemy spawn rate
// 3. Same collision behavior
// 4. Same damage values
```

## 🐛 Common Issues

### Issue: Sprites not appearing

**Solution**: Check if PhaserECSBridge is being called:
```javascript
update(time, delta) {
    // Make sure this is called!
    this.ecsBridge.updateAll();
}
```

### Issue: Entity position not updating

**Solution**: Make sure system is in the update loop:
```javascript
create() {
    this.systems = [
        this.movementSystem, // Must be in this array!
        this.combatSystem
    ];
}

update(time, delta) {
    this.systems.forEach(system => system.update(delta / 1000));
}
```

### Issue: Performance is slow

**Solutions**:
1. Use object pooling for frequently created/destroyed objects
2. Disable physics debug mode
3. Reduce number of particles
4. Use texture atlases instead of individual graphics

## 📚 Next Steps

1. **Complete weapon system**: Port CombatSystem fully
2. **Add all enemy types**: Create enemy factories
3. **Implement XP system**: Add XP orbs and collection
4. **Create level-up screen**: Port UI system
5. **Add visual polish**: Particles and effects
6. **Port audio system**: Sound effects and music
7. **Meta-progression**: Permanent upgrades

## 🎯 Contribution Guidelines

When adding features:
1. Keep game logic in `js/systems/` (reusable)
2. Put Phaser-specific code in `phaser/`
3. Update both README files
4. Test in both vanilla and Phaser versions when possible
5. Document new systems in architecture guide
6. Add code comments for complex logic

---

**Remember**: The goal is not to rewrite everything in Phaser, but to use Phaser where it adds value (rendering, effects, input) while keeping the solid game logic intact.
