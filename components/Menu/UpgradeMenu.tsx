
import React from 'react';
import { Weapon, Passive } from '../../types';
import { UpgradeOption } from '../../engine/Progression';

interface UpgradeMenuProps {
  options: UpgradeOption[];
  onSelect: (upgrade: UpgradeOption) => void;
  currentWeapons: Weapon[];
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

export const UpgradeMenu: React.FC<UpgradeMenuProps> = ({ options, onSelect, currentWeapons }) => {
  const getTypeName = (type: string, item: any) => {
    if (type === 'weapon') {
      const existing = currentWeapons.find(cw => cw.id === item.id);
      return existing ? `UPGRADE TECH ${existing.level + 1}` : 'NOUVEL ARMEMEMENT';
    }
    if (type === 'passive') return `${item.rarity.toUpperCase()} MODULE`;
    if (type === 'keystone') return 'KEYSTONE — UNIQUE';
    return 'SYSTÈME';
  };

  return (
    <div className="absolute inset-0 z-50 flex items-[safe_center] justify-center bg-black/95 backdrop-blur-2xl p-4 lg:p-16 font-orbitron overflow-y-auto">
      <div className="max-w-7xl w-full border-x-4 border-white/5 p-4 lg:p-16 bg-gradient-to-b from-white/5 to-transparent shadow-2xl">
        <div className="flex justify-between items-baseline mb-6 lg:mb-16 border-b-2 border-white/10 pb-4 lg:pb-8">
          <h2 className="text-2xl lg:text-5xl font-black text-white uppercase italic tracking-tighter">Modification Système Détectée</h2>
          <span className="text-xs text-slate-500 font-bold tracking-[0.5em] uppercase opacity-60">Auth : Terminal de Commandement</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-12">
          {options.map((opt, i) => {
            const rarity = opt.type === 'keystone' ? 'legendary' : ((opt.item as Passive).rarity || 'common');
            const existingWeapon = opt.type === 'weapon' ? currentWeapons.find(cw => cw.id === opt.item.id) : null;
            
            return (
              <button
                key={i}
                onClick={() => onSelect(opt)}
                className={`group relative flex flex-col p-5 lg:p-10 border-2 transition-all hover:scale-105 text-left shadow-xl ${RARITY_BGS[rarity as keyof typeof RARITY_BGS]} ${RARITY_COLORS[rarity as keyof typeof RARITY_COLORS]}`}
              >
                <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 opacity-80">
                  // {getTypeName(opt.type, opt.item)}
                </div>
                <h3 className="text-xl lg:text-3xl font-bold text-white mb-3 lg:mb-6 group-hover:text-cyan-300 transition-colors">
                  {opt.item.name} {existingWeapon ? `(T-${existingWeapon.level + 1})` : ''}
                </h3>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed italic border-l-2 border-white/10 pl-4">
                  "{opt.item.description}"
                </p>
                {'tags' in opt.item && (
                  <div className="flex flex-wrap gap-1 mb-6">
                    {opt.item.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-slate-400">{t}</span>
                    ))}
                  </div>
                )}
                
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
