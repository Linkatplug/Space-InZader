/**
 * @fileoverview Pure data-driven ship definitions for Space InZader
 * 
 * Ships are defined as pure configuration with:
 * - id: Unique identifier
 * - name: Display name
 * - icon: Visual representation
 * - baseStats: ShipStats instance defining base statistics
 * - specialTrait: Pure function for ship-specific behavior
 * - startingWeapon: Initial weapon ID
 * - role: Tactical role description
 * - dominantDamageType: Primary damage focus
 * 
 * All business logic is contained within the specialTrait function.
 * No direct stat mutations or cross-system calls outside of specialTrait.
 * 
 * @author Space InZader Team
 */

window.ShipData = {
  SHIPS: {
    /**
     * ION_FRIGATE - EM Specialist
     * High shields with enhanced regeneration
     * Specializes in disrupting enemy shields
     */
    ION_FRIGATE: {
      id: 'ION_FRIGATE',
      name: 'Frégate Ionique',
      icon: '⚡',
      startingWeapon: 'ion_blaster',
      role: 'Anti-shield / Disruption',
      dominantDamageType: 'em',
      
      /**
       * Base statistics for Ion Frigate
       * High shield capacity and regeneration
       * Standard offensive capabilities with EM focus
       */
      baseStats: new ShipStats({
        // Offensive
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        critChance: 0.05,
        critMultiplier: 1.5,
        // Defensive - Shield specialist
        maxShield: 180,      // Higher shield
        maxArmor: 100,       // Lower armor
        maxStructure: 120,
        shieldRegen: 12.0,   // Enhanced shield regen
        armorReduction: 0,
        // Heat/Cooldown
        heatGenerationMultiplier: 1.0,
        cooldownReduction: 0.0
      }),
      
      /**
       * Special Trait: Enhanced Shield Protocol
       * Increases shield regeneration when shields are below 50%
       * 
       * @param {Object} entity - The ship entity
       * @param {Object} context - Game context (time, events, etc)
       */
      specialTrait: function(entity, context) {
        // Shield enhancement when low
        if (entity.defense && entity.defense.shield) {
          const shieldPercent = entity.defense.shield.current / entity.defense.shield.max;
          if (shieldPercent < 0.5) {
            // Boost shield regen when shields are low
            const lowShieldBonus = 1.5; // 50% bonus
            entity.defense.shield.regenRate = entity.defense.shield.baseRegen * lowShieldBonus;
          } else {
            // Normal regen
            entity.defense.shield.regenRate = entity.defense.shield.baseRegen;
          }
        }
      }
    },
    
    /**
     * BALLISTIC_DESTROYER - Kinetic Tank
     * Heavy armor with damage reduction
     * Excels at sustained kinetic damage
     */
    BALLISTIC_DESTROYER: {
      id: 'BALLISTIC_DESTROYER',
      name: 'Destroyer Balistique',
      icon: '🔩',
      startingWeapon: 'auto_cannon',
      role: 'Anti-armor / Burst',
      dominantDamageType: 'kinetic',
      
      /**
       * Base statistics for Ballistic Destroyer
       * High armor and damage reduction
       * Slightly slower but more durable
       */
      baseStats: new ShipStats({
        // Offensive - Kinetic focus
        damageMultiplier: 1.1,   // Slightly higher damage
        fireRateMultiplier: 0.9, // Slightly slower
        critChance: 0.08,
        critMultiplier: 1.5,
        // Defensive - Armor specialist
        maxShield: 80,
        maxArmor: 220,           // Much higher armor
        maxStructure: 150,
        shieldRegen: 6.0,        // Lower shield regen
        armorReduction: 5,       // Flat damage reduction
        // Heat/Cooldown
        heatGenerationMultiplier: 1.0,
        cooldownReduction: 0.0
      }),
      
      /**
       * Special Trait: Reinforced Plating
       * Increases armor reduction when armor is above 50%
       * 
       * @param {Object} entity - The ship entity
       * @param {Object} context - Game context
       */
      specialTrait: function(entity, context) {
        // Enhanced armor when healthy
        if (entity.defense && entity.defense.armor) {
          const armorPercent = entity.defense.armor.current / entity.defense.armor.max;
          if (armorPercent > 0.5) {
            // Bonus armor reduction when healthy
            entity.defense.armor.reduction = 8; // Increased from 5
          } else {
            // Normal armor reduction
            entity.defense.armor.reduction = 5;
          }
        }
      }
    },
    
    /**
     * CATACLYSM_CRUISER - Explosive AOE Specialist
     * Balanced stats with explosive damage focus
     * Excels at wave clearing and area control
     */
    CATACLYSM_CRUISER: {
      id: 'CATACLYSM_CRUISER',
      name: 'Croiseur Cataclysm',
      icon: '💣',
      startingWeapon: 'cluster_missile',
      role: 'AOE / Wave Clear',
      dominantDamageType: 'explosive',
      
      /**
       * Base statistics for Cataclysm Cruiser
       * Balanced defensive stats
       * Higher crit for explosive payloads
       */
      baseStats: new ShipStats({
        // Offensive - Explosive focus
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        critChance: 0.12,        // Higher crit chance
        critMultiplier: 1.8,     // Higher crit damage
        // Defensive - Balanced
        maxShield: 120,
        maxArmor: 150,
        maxStructure: 130,
        shieldRegen: 8.0,
        armorReduction: 2,
        // Heat/Cooldown
        heatGenerationMultiplier: 1.1, // Slightly more heat
        cooldownReduction: 0.0
      }),
      
      /**
       * Special Trait: Chain Reaction
       * Increases critical chance after landing a critical hit
       * Stacks up to 3 times, decays over time
       * 
       * @param {Object} entity - The ship entity
       * @param {Object} context - Game context (should include deltaTime)
       */
      specialTrait: function(entity, context) {
        // Initialize chain reaction stacks if not present
        if (!entity.chainReactionStacks) {
          entity.chainReactionStacks = 0;
          entity.chainReactionTimer = 0;
        }
        
        // Decay stacks over time
        if (entity.chainReactionStacks > 0 && context.deltaTime) {
          entity.chainReactionTimer += context.deltaTime;
          if (entity.chainReactionTimer >= 3.0) { // 3 second decay
            entity.chainReactionStacks = Math.max(0, entity.chainReactionStacks - 1);
            entity.chainReactionTimer = 0;
          }
        }
        
        // Apply crit bonus from stacks
        if (entity.stats) {
          const bonusCrit = entity.chainReactionStacks * 0.05; // 5% per stack
          entity.stats.critChance = 0.12 + bonusCrit;
        }
        
        // Hook for adding stacks (external systems check entity.onCriticalHit)
        entity.onCriticalHit = function() {
          entity.chainReactionStacks = Math.min(3, entity.chainReactionStacks + 1);
          entity.chainReactionTimer = 0;
        };
      }
    },
    
    /**
     * TECH_NEXUS - Thermal & Technology Specialist
     * Enhanced heat management
     * High-tech sustain and cooldown mechanics
     */
    TECH_NEXUS: {
      id: 'TECH_NEXUS',
      name: 'Nexus Technologique',
      icon: '🔬',
      startingWeapon: 'solar_flare',
      role: 'Finisher / Tech Sustain',
      dominantDamageType: 'thermal',
      
      /**
       * Base statistics for Tech Nexus
       * Enhanced cooldown reduction and heat management
       * Moderate defenses, high tech focus
       */
      baseStats: new ShipStats({
        // Offensive - Tech focus
        damageMultiplier: 0.95,  // Slightly lower base damage
        fireRateMultiplier: 1.1, // Faster fire rate
        critChance: 0.06,
        critMultiplier: 1.5,
        // Defensive - Tech/Shield hybrid
        maxShield: 150,
        maxArmor: 120,
        maxStructure: 130,
        shieldRegen: 10.0,
        armorReduction: 1,
        // Heat/Cooldown - Tech specialist
        heatGenerationMultiplier: 0.8,  // Reduced heat generation
        cooldownReduction: 0.15          // 15% cooldown reduction
      }),
      
      /**
       * Special Trait: Thermal Conduit
       * Converts excess heat into damage bonus
       * More heat = more damage, up to a cap
       * 
       * @param {Object} entity - The ship entity
       * @param {Object} context - Game context
       */
      specialTrait: function(entity, context) {
        // Heat-based damage conversion
        if (entity.heat && entity.stats) {
          const heatPercent = entity.heat.current / entity.heat.max;
          
          if (heatPercent > 0.3) {
            // Bonus damage from heat (max 30% bonus at 80% heat)
            const heatBonus = Math.min(0.3, (heatPercent - 0.3) * 0.6);
            entity.stats.damageMultiplier = 0.95 + heatBonus;
          } else {
            // No bonus below 30% heat
            entity.stats.damageMultiplier = 0.95;
          }
          
          // Enhanced cooldown at high heat (risk/reward)
          if (heatPercent > 0.7) {
            entity.stats.cooldownReduction = 0.25; // 25% at high heat
          } else {
            entity.stats.cooldownReduction = 0.15; // Base 15%
          }
        }
      }
    }
  }
};
