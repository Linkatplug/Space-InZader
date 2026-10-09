import { describe, it, expect } from 'vitest';
import { buildErrorReport, createErrorQueue, ERROR_LIMITS } from '../components/errorReporter';

describe('rapporteur d’erreurs JS', () => {
  it('rapport borné au format du serveur', () => {
    const r = buildErrorReport({ message: 'x'.repeat(900), file: 'http://a/b.js', line: 12 }, '162', 'UA');
    expect(r.message.length).toBe(ERROR_LIMITS.message);
    expect(r.source).toBe('http://a/b.js');
    expect(r.line).toBe(12);
    expect(Object.keys(r).sort()).toEqual(['browser', 'build', 'line', 'message', 'source']);
    expect(r.build).toBe('162');
  });
  it('sans fichier : source vide', () => {
    expect(buildErrorReport({ message: 'boom' }, 'b', 'u').source).toBe('');
  });
  it('dédoublonne et plafonne par session', () => {
    const accept = createErrorQueue(2);
    const r = (m: string) => buildErrorReport({ message: m }, 'b', 'u');
    expect(accept(r('a'))).toBe(true);
    expect(accept(r('a'))).toBe(false);
    expect(accept(r('b'))).toBe(true);
    expect(accept(r('c'))).toBe(false);
    expect(createErrorQueue()(r(''))).toBe(false);
  });
});
