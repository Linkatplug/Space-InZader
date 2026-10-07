import { describe, it, expect } from 'vitest';
import { normalizeSettingsPatch, percentLabel, shakeLabel } from '../components/Menu/optionsModel';
import { DEFAULT_SETTINGS } from '../engine/Meta';

describe('Options : normalisation des réglages', () => {
  it('borne les curseurs à 0..1 et arrondit au pas de 5%', () => {
    expect(normalizeSettingsPatch({ musicVolume: 1.4 }).musicVolume).toBe(1);
    expect(normalizeSettingsPatch({ sfxVolume: -0.2 }).sfxVolume).toBe(0);
    expect(normalizeSettingsPatch({ screenShake: 0.42 }).screenShake).toBeCloseTo(0.4);
    expect(normalizeSettingsPatch({ musicVolume: NaN }).musicVolume).toBe(0);
  });

  it('ne touche pas aux booléens ni aux clés absentes', () => {
    expect(normalizeSettingsPatch({ muted: true, damageNumbers: false })).toEqual({ muted: true, damageNumbers: false });
    expect('musicVolume' in normalizeSettingsPatch({ autoFire: true })).toBe(false);
  });

  it('les réglages par défaut sont déjà normalisés', () => {
    expect({ ...DEFAULT_SETTINGS, ...normalizeSettingsPatch(DEFAULT_SETTINGS) }).toEqual(DEFAULT_SETTINGS);
  });

  it('libellés', () => {
    expect(percentLabel(0.35)).toBe('35%');
    expect(shakeLabel(0)).toBe('Désactivé');
    expect(shakeLabel(0.25)).toBe('Léger');
    expect(shakeLabel(1)).toBe('Fort');
  });
});
