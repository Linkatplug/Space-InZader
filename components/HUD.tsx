
import React, { useMemo, useState, useEffect } from 'react';
import { GameState, Tag, Weapon, DamageType, ActiveAbility } from '../types';
import { DAMAGE_COLORS } from '../constants';

interface HUDProps {
  state: GameState;
}

const SegmentedBar: React.FC<{ 
  value: number; 
  max: number; 
  segments: number; 
  color: string;
  vertical?: boolean;
}> = ({ value, max, segments, color, vertical }) => {
  const activeSegments = Math.round((Math.max(0, Math.min(max, value)) / (max || 1)) * segments);
  return (
    <div className={`flex gap-1.5 ${vertical ? 'flex-col-reverse h-48 w-6' : 'flex-row w-full h-4'}`}>
      {Array.from({ length: segments }).map((_, i) => (
        <div 
          key={i} 
          className={`${vertical ? 'w-full flex-1' : 'h-full flex-1'} transition-colors duration-200 shadow-sm`}
          style={{ backgroundColor: i < activeSegments ? color : '#020617', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      ))}
    </div>
  );
};

const ShipBlueprint: React.FC<{ shield: number, maxShield: number, isGodMode?: boolean }> = ({ shield, maxShield, isGodMode }) => {
  const shieldPerc = shield / (maxShield || 1);
  return (
    <div className={`relative w-56 h-56 flex items-center justify-center border-2 bg-cyan-400/5 shadow-2xl transition-all duration-500 ${isGodMode ? 'border-amber-400 shadow-amber-500/20' : 'border-cyan-400/30'}`}>
      <svg viewBox="0 0 100 100" className={`w-40 h-40 fill-none stroke-[1.5] transition-colors ${isGodMode ? 'stroke-amber-400/50' : 'stroke-cyan-400/50'}`}>
        <path d="M50 10 L85 85 L50 75 L15 85 Z" />
        <path d="M30 45 L30 75 M70 45 L70 75" />
        <circle cx="50" cy="45" r="5" />
      </svg>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="46" className="stroke-slate-900/40 fill-none" strokeWidth="8" />
        <circle 
          cx="50" cy="50" r="46" 
          className={`fill-none transition-all duration-700 shadow-lg ${isGodMode ? 'stroke-amber-400' : 'stroke-cyan-400'}`} 
          strokeWidth="8"
          strokeDasharray="289"
          strokeDashoffset={isGodMode ? 0 : 289 - (289 * shieldPerc)}
        />
      </svg>
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-black text-[10px] px-2 py-0.5 font-black tracking-widest shadow-md uppercase transition-colors ${isGodMode ? 'bg-amber-400' : 'bg-cyan-400'}`}>
        {isGodMode ? 'GOD_MODE' : 'BOUCLIER'}
      </div>
    </div>
  );
};

const AbilitySlot: React.FC<{ ability: ActiveAbility }> = ({ ability }) => {
  const progress = ability.currentCooldown / ability.cooldown;
  const isReady = ability.currentCooldown <= 0;
  
  return (
    <div className={`relative w-16 h-16 border-2 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm transition-all shadow-xl ${isReady ? 'border-cyan-400' : 'border-slate-700 opacity-60'}`}>
      <span className="text-2xl">{ability.icon}</span>
      {!isReady && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-xs font-black text-white">{Math.ceil(ability.currentCooldown)}s</span>
        </div>
      )}
      <div className="absolute -bottom-2 -right-2 bg-white text-black text-[10px] px-1 font-black uppercase shadow-md">
        {ability.key}
      </div>
      {!isReady && (
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
          <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(34, 211, 238, 0.4)" strokeWidth="4" strokeDasharray="188.5" strokeDashoffset={188.5 * (1 - progress)} />
        </svg>
      )}
    </div>
  );
};

const TECH_LABELS: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III' };

export const HUD: React.FC<HUDProps> = ({ state }) => {
  const { player, heat, maxHeat, isOverheated, score, level, experience, expToNextLevel, activeWeapons, activeAbilities, wave, waveKills, waveQuota, totalKills, startTime, comboCount, comboTimer, currentMisses } = state;
  const { runtimeStats, defense, isGodMode } = player;

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const missionTime = useMemo(() => {
    const elapsed = (now - startTime) / 1000;
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [startTime, now]);

  return (
    <div className="absolute inset-0 pointer-events-none p-10 font-orbitron overflow-hidden">
      
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="bg-cyan-950/40 border-x-2 border-t-2 border-cyan-400/60 px-12 py-3 backdrop-blur-xl flex gap-12 items-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center min-w-[100px]">
             <span className="text-[9px] text-cyan-500 font-bold uppercase tracking-widest opacity-80">Chrono</span>
             <span className="text-2xl text-white font-black tabular-nums tracking-widest drop-shadow-md">{missionTime}</span>
          </div>
          <div className="h-10 w-px bg-cyan-400/30" />
          <div className="flex flex-col items-center min-w-[150px]">
             <span className="text-[9px] text-cyan-500 font-bold uppercase tracking-widest opacity-80">Secteur</span>
             <span className="text-2xl text-cyan-400 font-black tracking-widest italic">{wave}</span>
          </div>
          <div className="h-10 w-px bg-cyan-400/30" />
          <div className="flex flex-col items-center min-w-[100px]">
             <span className="text-[9px] text-cyan-500 font-bold uppercase tracking-widest opacity-80">Éliminations</span>
             <span className="text-2xl text-white font-black tabular-nums tracking-widest drop-shadow-md">{totalKills}</span>
          </div>
        </div>
        
        <div className="w-[700px] h-3 bg-slate-950 border-2 border-cyan-400/40 overflow-hidden shadow-2xl relative">
          <div 
            className="h-full bg-cyan-400 transition-all duration-500 ease-out shadow-[0_0_20px_rgba(34,211,238,0.6)]" 
            style={{ width: `${(waveKills / waveQuota) * 100}%` }} 
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <span className="text-[9px] font-black text-white uppercase mix-blend-difference tracking-[0.6em]">
               VAGUE {wave} : {waveKills} / {waveQuota} SUPPRESSIONS
             </span>
          </div>
        </div>

        <div className="flex justify-between w-full mt-3 px-2 text-[10px] text-slate-400 font-black tracking-widest uppercase">
          <span className="flex gap-2">Niveau <span className="text-white">{level}</span></span>
          <span className="text-orange-400 tracking-widest">Score: {score.toLocaleString()}</span>
        </div>
        <div className="w-[500px] h-[3px] bg-slate-900 mt-1 opacity-50">
           <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${(experience / expToNextLevel) * 100}%` }} />
        </div>
      </div>

      <div className="absolute bottom-12 left-12 flex items-end gap-10">
        <ShipBlueprint shield={defense.shield} maxShield={runtimeStats.maxShield} isGodMode={isGodMode} />
        <div className="flex flex-col gap-6">
          <div className="flex gap-4 mb-2">
            {activeAbilities.map(a => <AbilitySlot key={a.id} ability={a} />)}
          </div>
          <div className="w-64">
            <div className="flex justify-between text-xs text-slate-400 mb-2 font-black uppercase tracking-[0.3em]">
              <span>Armure</span>
              <span className="text-white text-lg">{Math.round(defense.armor)}</span>
            </div>
            <SegmentedBar value={defense.armor} max={runtimeStats.maxArmor} segments={12} color="#f97316" />
          </div>
          <div className="w-64">
            <div className="flex justify-between text-xs text-slate-400 mb-2 font-black uppercase tracking-[0.3em]">
              <span>Coque</span>
              <span className="text-white text-lg">{Math.round(defense.hull)}</span>
            </div>
            <SegmentedBar value={defense.hull} max={runtimeStats.maxHull} segments={12} color="#ef4444" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-6">
        {activeWeapons.map((w, i) => {
          const cooldown = 1000 / (w.fireRate * runtimeStats.fireRate * (w.level > 1 ? (w.level === 2 ? 1.5 : 1.9) : 1.0));
          const elapsed = performance.now() - w.lastFired;
          const progress = Math.min(1, elapsed / cooldown);
          return (
            <div key={i} className="relative w-48 bg-slate-900/60 border-2 border-white/20 p-4 backdrop-blur-sm shadow-xl overflow-hidden">
              <div className="absolute top-0 right-0 bg-white/10 px-2 py-0.5 text-[10px] font-black text-cyan-400 border-l border-b border-white/10">
                TECH {TECH_LABELS[w.level]}
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-white uppercase truncate tracking-tighter w-2/3">{w.name}</span>
                <div className="w-2.5 h-2.5 shadow-md" style={{ backgroundColor: DAMAGE_COLORS[w.type] }} />
              </div>
              <div className="h-2 bg-black border border-white/10 overflow-hidden">
                <div className="h-full transition-all duration-75" style={{ width: `${progress * 100}%`, backgroundColor: progress >= 1 ? DAMAGE_COLORS[w.type] : '#1e293b' }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-12 right-12 flex gap-10 items-end">
        {comboCount > 0 && (
          <div className="absolute -top-20 right-0 flex flex-col items-end animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">SÉRIE</span>
              <span className="text-4xl font-black text-white italic tabular-nums">x{comboCount}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-slate-500 mb-3 uppercase [writing-mode:vertical-lr] tracking-[0.5em]">Thermique</span>
          <SegmentedBar value={heat} max={maxHeat} segments={10} color={isOverheated ? '#ef4444' : '#f97316'} vertical />
        </div>

        <div className="flex flex-col items-center">
          <span className={`text-[10px] font-black mb-3 uppercase [writing-mode:vertical-lr] tracking-[0.5em] transition-colors ${comboCount > 0 ? 'text-cyan-400' : 'text-slate-500'}`}>
            {comboCount > 0 ? 'Série' : 'Neutre'}
          </span>
          <SegmentedBar 
            value={comboCount > 0 ? comboTimer : 0} 
            max={runtimeStats.comboWindow} 
            segments={10} 
            color="#22d3ee" 
            vertical 
          />
        </div>
      </div>

    </div>
  );
};
