
import React from 'react';
import { Weapon, Keystone, Tag, Passive } from '../../types';
import { WEAPON_POOL, KEYSTONES, PASSIVES } from '../../constants';

interface UpgradeMenuProps {
  onSelect: (upgrade: { type: 'weapon' | 'keystone' | 'stat' | 'passive'; item: any }) => void;
  currentWeapons: Weapon[];
  currentKeystones: Keystone[];
}

const RARITY_COLORS = {
  common: 'text-slate-400 border-slate-700/50',
  rare: 'text-cyan-400 border-cyan-700/50',
  epic: 'text-purple-400 border-purple-700/50',
  legendary: 'text-amber-400 border-amber-700/50 shadow-[0_0_20px_rgba(251,191,36,0.1)]',
};

const RARITY_BGS = {
  common: 'bg-slate-900/60',
  rare: 'bg-cyan-950/20',
  epic: 'bg-purple-950/20',
  legendary: 'bg-amber-950/20',
};

export const UpgradeMenu: React.FC<UpgradeMenuProps> = ({ onSelect, currentWeapons, currentKeystones }) => {
  const options = React.useMemo(() => {
    // Permettre de choisir une arme si elle n'est pas déjà Tech III (level < 3)
    const availableWeapons = WEAPON_POOL.filter(w => {
      const existing = currentWeapons.find(cw => cw.id === w.id);
      return !existing || existing.level < 3;
    });

    const allPool = [
      ...availableWeapons.map(w => ({ type: 'weapon' as const, item: w })),
      ...PASSIVES.map(p => ({ type: 'passive' as const, item: p }))
    ];

    const shuffled = allPool.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [currentWeapons]);

  const getTypeName = (type: string, item: any) => {
    if (type === 'weapon') {
      const existing = currentWeapons.find(cw => cw.id === item.id);
      return existing ? `UPGRADE TECH ${existing.level + 1}` : 'NOUVEL ARMEMEMENT';
    }
    if (type === 'passive') return `${item.rarity.toUpperCase()} MODULE`;
    return 'SYSTÈME';
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-16 font-orbitron">
      <div className="max-w-7xl w-full border-x-4 border-white/5 p-16 bg-gradient-to-b from-white/5 to-transparent shadow-2xl">
        <div className="flex justify-between items-baseline mb-16 border-b-2 border-white/10 pb-8">
          <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter">Modification Système Détectée</h2>
          <span className="text-xs text-slate-500 font-bold tracking-[0.5em] uppercase opacity-60">Auth : Terminal de Commandement</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {options.map((opt, i) => {
            const rarity = (opt.item as Passive).rarity || 'common';
            const existingWeapon = opt.type === 'weapon' ? currentWeapons.find(cw => cw.id === opt.item.id) : null;
            
            return (
              <button
                key={i}
                onClick={() => onSelect(opt)}
                className={`group relative flex flex-col p-10 border-2 transition-all hover:scale-105 text-left shadow-xl ${RARITY_BGS[rarity as keyof typeof RARITY_BGS]} ${RARITY_COLORS[rarity as keyof typeof RARITY_COLORS]}`}
              >
                <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 opacity-80">
                  // {getTypeName(opt.type, opt.item)}
                </div>
                <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-cyan-300 transition-colors">
                  {opt.item.name} {existingWeapon ? `(T-${existingWeapon.level + 1})` : ''}
                </h3>
                <p className="text-sm text-slate-300 mb-12 leading-relaxed italic border-l-2 border-white/10 pl-4">
                  "{opt.item.description}"
                </p>
                
                <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest group-hover:text-white transition-colors">
                    {existingWeapon ? 'Fusionner les Matériaux' : 'Cliquer pour Intégrer'}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${rarity === 'legendary' ? 'bg-amber-400 animate-pulse' : 'bg-white/40'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
