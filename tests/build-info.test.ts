import { describe, it, expect } from 'vitest';
import { formatBuild, BUILD } from '../buildInfo';

describe('version affichée', () => {
  it('numéro + date au format français', () => {
    expect(formatBuild('142', '2026-10-09')).toBe('v142 · mis à jour le 09/10/2026');
  });
  it('sans date (dev) : numéro seul', () => {
    expect(formatBuild('1.0.0-dev', '')).toBe('v1.0.0-dev');
  });
  it('hors Vite (tests) : repli « dev »', () => {
    expect(BUILD).toBe('dev');
  });
});
