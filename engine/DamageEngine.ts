
import { DamagePacket, DamageType, Entity } from '../types';

export const applyDamage = (target: Entity, packet: DamagePacket, time?: number): void => {
  // Si le God Mode est actif sur l'entité, on ignore purement les dégâts
  if (target.isGodMode) return;

  const stats = target.runtimeStats;
  const defense = target.defense;
  
  // Marquer le temps du dernier impact pour le délai de régénération
  target.lastDamageTime = time || performance.now();

  // Appliquer le multiplicateur de dégâts reçus (ex: Microwarpdrive)
  let remainingDamage = packet.amount * (stats.dmgTakenMult || 1.0);

  // 1. Résistances Globales (Éléments)
  let resistance = 0;
  switch (packet.type) {
    case DamageType.EM: resistance = stats.res_EM; break;
    case DamageType.KINETIC: resistance = stats.res_Kinetic; break;
    case DamageType.EXPLOSIVE: resistance = stats.res_Explosive; break;
    case DamageType.THERMAL: resistance = stats.res_Thermal; break;
  }
  remainingDamage *= (1 - Math.min(0.9, resistance));

  // 2. Couche BOUCLIER (Shield)
  if (defense.shield > 0) {
    const shieldEfficiency = packet.type === DamageType.EM ? 1.5 : 0.8; 
    const effectiveDmg = remainingDamage * shieldEfficiency;
    if (defense.shield >= effectiveDmg) {
      defense.shield -= effectiveDmg;
      return;
    } else {
      remainingDamage -= defense.shield / shieldEfficiency;
      defense.shield = 0;
    }
  }

  // 3. Couche ARMURE (Armor)
  if (defense.armor > 0) {
    const armorEfficiency = (packet.type === DamageType.KINETIC || packet.type === DamageType.EXPLOSIVE) ? 1.2 : 0.7;
    remainingDamage *= (1 - stats.armorHardness);
    const effectiveDmg = remainingDamage * armorEfficiency;
    if (defense.armor >= effectiveDmg) {
      defense.armor -= effectiveDmg;
      return;
    } else {
      remainingDamage -= defense.armor / armorEfficiency;
      defense.armor = 0;
    }
  }

  // 4. Couche COQUE (Hull) - Appliquer la résistance de coque (ex: Damage Control)
  const hullEfficiency = (packet.type === DamageType.THERMAL || packet.type === DamageType.EXPLOSIVE) ? 1.3 : 1.0;
  const hullResistance = stats.res_Hull || 0;
  defense.hull = Math.max(0, defense.hull - (remainingDamage * hullEfficiency * (1 - Math.min(0.9, hullResistance))));
};
