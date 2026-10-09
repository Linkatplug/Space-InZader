import { describe, it, expect } from 'vitest';
import { clampViewZoom, normalizeSettingsPatch, percentLabel, shakeLabel } from '../components/Menu/optionsModel';
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

describe('Options : zoom de la zone de jeu', () => {
  it('borne à 70–130 % par pas de 5 %', () => {
    expect(clampViewZoom(0.1)).toBe(0.7);
    expect(clampViewZoom(3)).toBe(1.3);
    expect(clampViewZoom(0.83)).toBeCloseTo(0.85);
    expect(normalizeSettingsPatch({ viewZoom: 0.5 }).viewZoom).toBe(0.7);
  });

  it('valeur absente ou invalide : zoom par défaut (anciennes sauvegardes)', () => {
    expect(clampViewZoom(undefined)).toBe(1);
    expect(clampViewZoom(NaN)).toBe(1);
    expect(clampViewZoom('1.2')).toBe(1);
    expect(DEFAULT_SETTINGS.viewZoom).toBe(1);
  });
});
