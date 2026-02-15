
import React, { useState, useEffect } from 'react';
import { GameState } from '../../types';
import { INITIAL_STATS, WEAPON_POOL, PASSIVES, KEYSTONES } from '../../constants';

interface DevMenuProps {
  state: GameState;
  isLabMenuOpen: boolean;
  onClose: () => void;
  onLaunchSandbox: () => void;
  onTriggerAction: (action: string, data?: any) => void;
}

export const DevMenu: React.FC<DevMenuProps> = ({ state, isLabMenuOpen, onClose, onLaunchSandbox, onTriggerAction }) => {
  const isLabMode = state.status === 'lab';
  const [activeTab, setActiveTab] = useState<'tuning' | 'sim' | 'index' | 'stats'>(isLabMode ? 'tuning' : 'index');
  
  useEffect(() => {
    if (isLabMode) setActiveTab('tuning');
    else setActiveTab('index');
  }, [isLabMode]);

  const [selectedAsset, setSelectedAsset] = useState<{type: 'Armes' | 'Keystones' | 'Modules', item: any}>({
    type: 'Armes',
    item: WEAPON_POOL[0]
  });

  const TabButton = ({ id, label, icon }: { id: any, label: string, icon?: string }) => (
    <button 
      onMouseDown={(e) => { 
        e.preventDefault();
        e.stopPropagation(); 
        setActiveTab(id); 
      }}
      className={`flex-1 px-4 py-4 font-black text-[10px] uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2 pointer-events-auto ${activeTab === id ? 'border-cyan-400 text-cyan-400 bg-cyan-400/10' : 'border-transparent text-slate-500 hover:text-white hover:bg-white/5'}`}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );

  const TuningSlider = ({ label, prop, min, max, step }: { label: string, prop: string, min: number, max: number, step: number }) => {
    const val = (state.player.baseStats as any)[prop] ?? (INITIAL_STATS as any)[prop] ?? 1;
    return (
      <div 
        className="space-y-2 p-4 bg-slate-900 border border-white/5 rounded-sm shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between text-[10px] font-bold uppercase">
          <span className="text-slate-400">{label}</span>
          <span className="text-cyan-400 font-mono text-xs">{val.toFixed(2)}</span>
        </div>
        <input 
          type="range" min={min} max={max} step={step} value={val}
          onChange={(e) => {
            e.stopPropagation();
            onTriggerAction('tune_stat', { prop, val: parseFloat(e.target.value) });
          }}
          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </div>
    );
  };

  if (!isLabMode) {
    return (
      <div 
        className="absolute inset-0 z-[100] bg-slate-950 flex flex-col font-orbitron text-slate-200 pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-12 py-8 border-b border-white/10 bg-black shadow-2xl">
          <div className="flex items-center gap-12">
            <div>
              <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">Database Dev</h2>
              <div className="text-[9px] text-cyan-500 font-mono opacity-60 uppercase">// Central Intelligence v2.6</div>
            </div>
            <div className="flex bg-slate-900/60 p-1 border border-white/5 rounded-sm min-w-[400px]">
              <TabButton id="index" label="Asset Index" icon="📁" />
              <TabButton id="stats" label="Global Stats" icon="📊" />
            </div>
          </div>
          <div className="flex gap-4">
             <button onMouseDown={() => onTriggerAction('change_status', 'lab')} className="px-8 py-3 bg-indigo-600 text-white font-black uppercase text-[11px] hover:bg-indigo-500 transition-all">ACCÉDER_LABORATOIRE</button>
             <button onMouseDown={onClose} className="px-8 py-3 border-2 border-red-500 text-red-500 font-bold uppercase text-[11px] hover:bg-red-500 hover:text-white transition-all">SORTIR</button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'index' && (
            <div className="flex-1 flex overflow-hidden">
               <div className="w-[450px] border-r border-white/10 flex flex-col bg-slate-900/20 overflow-y-auto p-8 gap-6">
                  <section>
                    <h3 className="text-[10px] font-black text-cyan-500 mb-4 uppercase tracking-widest">Armement</h3>
                    {WEAPON_POOL.map(w => (
                      <button key={w.id} onMouseDown={() => setSelectedAsset({type: 'Armes', item: w})} className={`w-full text-left px-4 py-3 text-[10px] font-bold border-l-2 mb-1 pointer-events-auto ${selectedAsset.item.id === w.id ? 'bg-cyan-500/10 border-cyan-400 text-white' : 'border-transparent text-slate-500 hover:text-white'}`}>{w.name}</button>
                    ))}
                  </section>
                  <section>
                    <h3 className="text-[10px] font-black text-purple-500 mb-4 uppercase tracking-widest">Modules</h3>
                    {PASSIVES.map(p => (
                      <button key={p.id} onMouseDown={() => setSelectedAsset({type: 'Modules', item: p})} className={`w-full text-left px-4 py-3 text-[10px] font-bold border-l-2 mb-1 pointer-events-auto ${selectedAsset.item.id === p.id ? 'bg-purple-500/10 border-purple-400 text-white' : 'border-transparent text-slate-500 hover:text-white'}`}>{p.name}</button>
                    ))}
                  </section>
               </div>
               <div className="flex-1 p-20 bg-black/40 overflow-y-auto">
                 <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
                    <h1 className="text-7xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl">{selectedAsset.item.name}</h1>
                    <p className="text-2xl text-slate-400 italic leading-relaxed">"{selectedAsset.item.description}"</p>
                    <button 
                      onMouseDown={() => onTriggerAction(selectedAsset.type === 'Armes' ? 'install_weapon' : 'install_passive', selectedAsset.item)}
                      className="bg-white text-black font-black px-12 py-5 text-sm tracking-widest uppercase hover:bg-cyan-400 transition-all shadow-xl pointer-events-auto"
                    >ACTIVER_INJECTION</button>
                 </div>
               </div>
            </div>
          )}
          {activeTab === 'stats' && (
            <div className="flex-1 p-20 grid grid-cols-3 gap-6 overflow-y-auto">
               {(Object.entries(state.player.runtimeStats) as [string, any][]).map(([k, v]) => (
                  <div key={k} className="bg-slate-900 p-8 border border-white/5">
                    <div className="text-[10px] text-slate-500 uppercase font-black mb-2">{k}</div>
                    <div className="text-4xl font-black text-white font-mono">{typeof v === 'number' ? v.toFixed(2) : v}</div>
                  </div>
               ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[100] flex font-orbitron overflow-hidden pointer-events-none">
      
      <button 
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onTriggerAction('toggle_lab_menu'); }}
        className={`absolute top-1/2 -translate-y-1/2 z-[110] p-3 bg-indigo-600 text-white border-y border-r border-indigo-400 transition-all pointer-events-auto shadow-2xl rounded-r-xl ${isLabMenuOpen ? 'left-[450px]' : 'left-0'}`}
        style={{ writingMode: 'vertical-lr' }}
      >
        <span className="text-[10px] font-black uppercase tracking-widest py-6">
          {isLabMenuOpen ? '<<< RÉDUIRE_LAB' : 'AGRANDIR_LAB >>>'}
        </span>
      </button>

      <div 
        className={`h-full bg-slate-950 border-r border-white/10 flex flex-col shadow-2xl z-[100] pointer-events-auto transition-all duration-500 ease-in-out ${isLabMenuOpen ? 'w-[450px] translate-x-0' : 'w-[450px] -translate-x-full'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-10 border-b border-white/10 bg-black/80">
           <div className="flex items-center gap-3 mb-2">
             <div className="w-3 h-3 bg-indigo-500 animate-pulse rounded-full" />
             <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">Engineering Lab</h2>
           </div>
           <p className="text-[9px] text-slate-500 font-mono tracking-widest mb-6 uppercase">// SIMULATION_ACTIVE</p>
           
           <div className="flex flex-col gap-3">
             <button onMouseDown={onLaunchSandbox} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 text-xs font-black uppercase tracking-widest transition-all pointer-events-auto">RETOUR_MISSION</button>
             <div className="flex gap-2">
                <button onMouseDown={() => onTriggerAction('change_status', 'dev')} className="flex-1 bg-slate-800 hover:bg-white hover:text-black text-white py-3 text-[10px] font-black uppercase transition-all pointer-events-auto">DATABASE</button>
                <button onMouseDown={onClose} className="px-6 border border-red-500 text-red-500 py-3 text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all pointer-events-auto">QUITTER</button>
             </div>
           </div>
        </div>

        <div className="flex border-b border-white/5 bg-slate-900/30">
           <TabButton id="tuning" label="Physique" icon="⚙️" />
           <TabButton id="sim" label="Unit Spawner" icon="👾" />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-black/20 space-y-8">
           
           {activeTab === 'tuning' && (
             <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="flex justify-between items-center mb-2">
                   <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">// System Physics</h3>
                   <div className="flex gap-2">
                     <button onMouseDown={() => onTriggerAction('reset_physics')} className="text-[8px] text-amber-500 border border-amber-500/30 px-2 py-1 hover:bg-amber-500 hover:text-black transition-all pointer-events-auto">RESET_VARS</button>
                     <button onMouseDown={() => onTriggerAction('clear_loadout')} className="text-[8px] text-red-500 border border-red-500/30 px-2 py-1 hover:bg-red-500 hover:text-white transition-all pointer-events-auto">PURGE_LOADOUT</button>
                   </div>
                </div>
                
                <TuningSlider label="Multiplicateur Dégâts" prop="damageMult" min={0.1} max={20} step={0.1} />
                <TuningSlider label="Vitesse de Poussée" prop="speed" min={1} max={40} step={0.5} />
                <TuningSlider label="Cadence de Tir (System)" prop="fireRate" min={0.1} max={15} step={0.1} />
                <TuningSlider label="Vélocité Projectiles" prop="projectileSpeedMult" min={0.5} max={10} step={0.1} />
                <TuningSlider label="Rayon du Magnet" prop="magnetRange" min={50} max={3000} step={100} />
                
                <div className="pt-6 grid grid-cols-2 gap-3">
                   <button 
                    onMouseDown={() => onTriggerAction('god_mode')} 
                    className={`p-4 border font-black text-[10px] transition-all pointer-events-auto uppercase tracking-tighter ${state.player.isGodMode ? 'bg-amber-500 text-black border-white shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-amber-500/10 text-amber-500 border-amber-500 hover:bg-amber-500 hover:text-black'}`}
                   >
                     {state.player.isGodMode ? 'GOD_MODE: ACTIF' : 'GOD_MODE: INACTIF'}
                   </button>
                   <button onMouseDown={() => onTriggerAction('heal_player')} className="p-4 bg-green-500/10 border border-green-500 text-green-500 text-[10px] font-black hover:bg-green-500 hover:text-white transition-all pointer-events-auto uppercase tracking-tighter">RESTAURER_SANTÉ</button>
                </div>
             </div>
           )}

           {activeTab === 'sim' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4">// Entity Injection</h3>
                
                <div className="grid grid-cols-1 gap-3">
                   <button 
                    onMouseDown={() => onTriggerAction('spawn_basic')} 
                    className="p-5 bg-slate-900 border border-white/10 hover:border-white transition-all text-left flex justify-between items-center group pointer-events-auto"
                   >
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white">BASIC_DRONE_v1</span>
                      <span className="text-[9px] font-mono text-slate-600">INJECT ></span>
                   </button>
                   <button 
                    onMouseDown={() => onTriggerAction('spawn_swarmer')} 
                    className="p-5 bg-slate-900 border border-white/10 hover:border-purple-500 transition-all text-left flex justify-between items-center group pointer-events-auto"
                   >
                      <span className="text-xs font-bold text-slate-300 group-hover:text-purple-400">SWARM_CELL_B</span>
                      <span className="text-[9px] font-mono text-slate-600">INJECT ></span>
                   </button>
                   <button 
                    onMouseDown={() => onTriggerAction('spawn_sniper')} 
                    className="p-5 bg-slate-900 border border-white/10 hover:border-blue-500 transition-all text-left flex justify-between items-center group pointer-events-auto"
                   >
                      <span className="text-xs font-bold text-slate-300 group-hover:text-blue-400">PRECISION_SNIPER</span>
                      <span className="text-[9px] font-mono text-slate-600">INJECT ></span>
                   </button>
                   <button 
                    onMouseDown={() => onTriggerAction('spawn_kamikaze')} 
                    className="p-5 bg-slate-900 border border-white/10 hover:border-orange-500 transition-all text-left flex justify-between items-center group pointer-events-auto"
                   >
                      <span className="text-xs font-bold text-slate-300 group-hover:text-orange-400">BOOM_INTERCEPTOR</span>
                      <span className="text-[9px] font-mono text-slate-600">INJECT ></span>
                   </button>
                   
                   <button 
                    onMouseDown={() => onTriggerAction('spawn_boss')} 
                    className="mt-4 p-6 bg-red-600/10 border-2 border-red-600 text-red-500 font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] pointer-events-auto"
                   >
                      SPAWN_ALPHA_BOSS
                   </button>
                </div>
                
                <div className="pt-10 border-t border-white/10 space-y-3">
                   <button onMouseDown={() => onTriggerAction('clear_enemies')} className="w-full py-4 bg-slate-900 text-[10px] font-black uppercase hover:bg-red-600 transition-all pointer-events-auto">PURGE_ENTITIES</button>
                   <button onMouseDown={() => onTriggerAction('reset_simulation')} className="w-full py-4 border border-white/20 text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all pointer-events-auto">REBOOT_SCENARIO</button>
                </div>
             </div>
           )}

        </div>

        <div className="p-6 bg-black text-[8px] font-mono text-slate-700 text-center border-t border-white/5 uppercase tracking-[0.4em]">
           SECURE_CONNECTION // 0x42AF_ACCESS
        </div>
      </div>

      <div className="flex-1 relative">
         <div className="absolute top-12 right-12 p-8 bg-black/90 backdrop-blur-xl border-l-4 border-indigo-500 animate-in slide-in-from-right duration-700 shadow-2xl pointer-events-auto w-[320px] max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              <div className="text-[11px] text-indigo-400 font-black tracking-widest uppercase">Telemetry_Realtime</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 font-mono text-[10px] mb-4">
               <span className="text-slate-500">Entities:</span> <span className="text-white text-right font-bold">{state.enemies.length}</span>
               <span className="text-slate-500">Projectiles:</span> <span className="text-white text-right font-bold">{state.projectiles.length}</span>
               <span className="text-slate-500">God_Mode:</span> <span className={`${state.player.isGodMode ? 'text-amber-400 animate-pulse' : 'text-slate-600'} text-right font-bold uppercase`}>{state.player.isGodMode ? 'ACTIVE' : 'OFF'}</span>
            </div>

            {/* Defense Stats Section */}
            <div className="space-y-3 mb-6 bg-white/5 p-3 border border-white/10 rounded-sm">
               <div className="text-[9px] text-cyan-400 font-black uppercase tracking-widest mb-1">Hull_integrity_Matrix</div>
               <div className="space-y-2">
                  <div className="flex flex-col">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-cyan-500">BOUCLIER</span>
                      <span className="text-white font-mono">{state.player.defense.shield.toFixed(0)} / {state.player.runtimeStats.maxShield.toFixed(0)}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800"><div className="h-full bg-cyan-400" style={{width: `${(state.player.defense.shield / state.player.runtimeStats.maxShield) * 100}%`}}></div></div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-orange-500">ARMURE</span>
                      <span className="text-white font-mono">{state.player.defense.armor.toFixed(0)} / {state.player.runtimeStats.maxArmor.toFixed(0)}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800"><div className="h-full bg-orange-500" style={{width: `${(state.player.defense.armor / state.player.runtimeStats.maxArmor) * 100}%`}}></div></div>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-red-500">STRUCTURE</span>
                      <span className="text-white font-mono">{state.player.defense.hull.toFixed(0)} / {state.player.runtimeStats.maxHull.toFixed(0)}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800"><div className="h-full bg-red-500" style={{width: `${(state.player.defense.hull / state.player.runtimeStats.maxHull) * 100}%`}}></div></div>
                  </div>
               </div>
            </div>

            {/* Additional Secondary Stats */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 font-mono text-[10px] mb-6 px-1">
               <span className="text-slate-500">Shield_Regen:</span> <span className="text-cyan-300 text-right font-bold">{state.player.runtimeStats.shieldRegen.toFixed(1)}/s</span>
               <span className="text-slate-500">Thermal_Load:</span> <span className={`${state.isOverheated ? 'text-red-500' : 'text-orange-400'} text-right font-bold`}>{state.heat.toFixed(0)} units</span>
            </div>

            <div className="space-y-4">
              <section>
                <div className="text-[9px] text-indigo-500 font-black uppercase tracking-[0.2em] mb-2 border-b border-indigo-500/20 pb-1">Equipped_Weapons</div>
                {state.activeWeapons.length > 0 ? (
                  state.activeWeapons.map(w => (
                    <div key={w.id} className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-slate-300 truncate w-32">{w.name}</span>
                      <span className="text-cyan-400 font-bold">TECH_{w.level}</span>
                    </div>
                  ))
                ) : <span className="text-[10px] text-slate-600 italic">No weapons equipped</span>}
              </section>

              <section>
                <div className="text-[9px] text-purple-500 font-black uppercase tracking-[0.2em] mb-2 border-b border-purple-500/20 pb-1">Active_Passives</div>
                {state.activePassives.length > 0 ? (
                  state.activePassives.map(({passive, stacks}) => (
                    <div key={passive.id} className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-slate-300 truncate w-32">{passive.name}</span>
                      <span className="text-purple-400 font-bold">x{stacks}</span>
                    </div>
                  ))
                ) : <span className="text-[10px] text-slate-600 italic">No passive modules</span>}
              </section>

              {state.keystones.length > 0 && (
                <section>
                  <div className="text-[9px] text-amber-500 font-black uppercase tracking-[0.2em] mb-2 border-b border-amber-500/20 pb-1">Keystones</div>
                  {state.keystones.map(k => (
                    <div key={k.id} className="text-[10px] font-mono text-amber-400 mb-1 leading-tight">
                      {k.name}
                    </div>
                  ))}
                </section>
              )}
            </div>
         </div>
      </div>

    </div>
  );
};
