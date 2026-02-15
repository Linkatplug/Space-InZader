
import { Entity, Stats, GameState } from '../types';

/**
 * Calcule les statistiques d'une entité en prenant en compte :
 * 1. Les statistiques de base
 * 2. Les modificateurs des passifs avec RENDEMENT DÉGRESSIF
 * 3. Les modificateurs directs (Keystones, Buffs temporaires)
 */
export const calculateRuntimeStats = (entity: Entity, gameState?: GameState): Stats => {
  const result = { ...entity.baseStats };

  if (gameState && entity.id === 'player') {
    // 1. Appliquer les passifs avec rendement dégressif
    gameState.activePassives.forEach(({ passive, stacks }) => {
      passive.modifiers.forEach(mod => {
        // Formule de rendement dégressif :
        // Le premier stack est à 100%, le second à 80%, le troisième à 64% (0.8^n-1)
        // Somme des efficacités : Σ (0.8^i) pour i de 0 à stacks-1
        let effectiveStackValue = 0;
        for (let i = 0; i < stacks; i++) {
          effectiveStackValue += Math.pow(0.8, i);
        }

        if (mod.type === 'additive') {
          (result[mod.property] as number) += mod.value * effectiveStackValue;
        } else {
          // Pour le multiplicatif, on applique la puissance de l'effet
          // Si bonus de +10% (1.10), on fait 1 + (0.10 * effectiveStackValue)
          const multiplierBase = mod.value - 1;
          (result[mod.property] as number) *= (1 + (multiplierBase * effectiveStackValue));
        }
      });
    });

    // 2. Appliquer les Keystones (Directement, pas de rendement dégressif sur les keystones car uniques)
    gameState.keystones.forEach(ks => {
      ks.modifiers.forEach(mod => {
        if (mod.type === 'additive') (result[mod.property] as number) += mod.value;
        else (result[mod.property] as number) *= mod.value;
      });
    });
  }

  // 3. Modificateurs directs sur l'entité (utilisé pour les ennemis ou buffs globaux)
  const additives = entity.modifiers.filter(m => m.type === 'additive');
  const multiplicatives = entity.modifiers.filter(m => m.type === 'multiplicative');

  additives.forEach(m => { (result[m.property] as number) += m.value; });
  multiplicatives.forEach(m => { (result[m.property] as number) *= m.value; });

  return result;
};

export const syncDefenseState = (entity: Entity) => {
    entity.defense.shield = Math.min(entity.defense.shield, entity.runtimeStats.maxShield);
    entity.defense.armor = Math.min(entity.defense.armor, entity.runtimeStats.maxArmor);
    entity.defense.hull = Math.min(entity.defense.hull, entity.runtimeStats.maxHull);
};
