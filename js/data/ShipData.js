/**
 * @fileoverview Ship data definitions for Space InZader
 * Defines 4 playable ships with unique damage types and stats
 */

window.ShipData = {
  SHIPS: {
    ION_FRIGATE: {
      id: "ION_FRIGATE",
      name: "Frégate Ionique",
      icon: "⚡",
      dominantDamageType: "em",
      role: "Anti-shield / Disruption",
      difficulty: "FACILE",
      startingWeaponId: "ION_BLASTER",

      defenses: {
        shieldMax: 150,
        armorMax: 110,
        structureMax: 120,
        shieldRegenMult: 1.15,
        coolingMult: 1.0
      },

      offense: {
        damageTypeMult: { em: 1.25 },
        damageTypeMultMalus: { kinetic: 0.80 }
      },

      tradeoffs: {
        armorResistAllMult: 0.90,
        nonDominantHeatGenMult: 1.15
      },

      passive: {
        id: "ION_FEEDBACK",
        name: "Ion Feedback",
        desc: "Quand un shield ennemi tombe : petite explosion EM."
      }
    },

    BALLISTIC_DESTROYER: {
      id: "BALLISTIC_DESTROYER",
      name: "Destroyer Balistique",
      icon: "🔩",
      dominantDamageType: "kinetic",
      role: "Anti-armor / Burst",
      difficulty: "MOYEN",
      startingWeaponId: "AUTO_CANNON",

      defenses: {
        shieldMax: 100,
        armorMax: 200,
        structureMax: 150,
        shieldRegenMult: 0.85,
        coolingMult: 1.0
      },

      offense: {
        damageTypeMult: { kinetic: 1.30 },
        damageTypeMultMalus: { em: 0.80 },
        kineticPenetrationBonus: 0.15
      },

      tradeoffs: {
        shieldResistAllMult: 0.90
      },

      passive: {
        id: "ARMOR_BREAK",
        name: "Armor Break",
        desc: "Crit kinetic : -10% resist armor cible (stack 3)."
      }
    },

    CATACLYSM_CRUISER: {
      id: "CATACLYSM_CRUISER",
      name: "Croiseur Cataclysm",
      icon: "💣",
      dominantDamageType: "explosive",
      role: "AOE / Wave Clear",
      difficulty: "MOYEN",
      startingWeaponId: "CLUSTER_MISSILE",

      defenses: {
        shieldMax: 110,
        armorMax: 170,
        structureMax: 160,
        shieldRegenMult: 1.0,
        coolingMult: 1.0
      },

      offense: {
        damageTypeMult: { explosive: 1.25 },
        explosionRadiusMult: 1.20,
        structureDamageMult: 1.10
      },

      tradeoffs: {
        globalFireRateMult: 0.85,
        globalHeatGenMult: 1.20,
        shieldResistEMMult: 0.90
      },

      passive: {
        id: "CHAIN_REACTION",
        name: "Chain Reaction",
        desc: "Explosion kill : 20% chance micro explosion secondaire (no retrigger)."
      }
    },

    TECH_NEXUS: {
      id: "TECH_NEXUS",
      name: "Nexus Technologique",
      icon: "🔬",
      dominantDamageType: "thermal",
      role: "Finisher / Tech Sustain",
      difficulty: "DIFFICILE",
      startingWeaponId: "SOLAR_FLARE",

      defenses: {
        shieldMax: 130,
        armorMax: 140,
        structureMax: 160,
        shieldRegenMult: 1.0,
        coolingMult: 1.20
      },

      offense: {
        damageTypeMult: { thermal: 1.25 },
        structureDamageMult: 1.15,
        effectDurationMult: 1.10
      },

      tradeoffs: {
        damageTypeMultMalus: { explosive: 0.85 },
        kineticPenetrationMult: 0.90
      },

      passive: {
        id: "CORE_EXPOSURE",
        name: "Core Exposure",
        desc: "Thermal DOT sur structure : +8% dégâts subis (non stack)."
      }
    }
  }
};
