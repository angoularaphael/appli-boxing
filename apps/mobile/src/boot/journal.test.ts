import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { PRET, arretDuLancement } from './journal.ts';

const ici = dirname(fileURLToPath(import.meta.url));
const ligne = (etape: string) => `2026-11-12T09:00:00.000Z ${etape}`;
const trace = (...etapes: string[]) => `${etapes.map(ligne).join('\n')}\n`;

describe('la trace du lancement precedent', () => {
  it('un lancement alle au bout ne signale rien', () => {
    assert.equal(arretDuLancement(trace('porte 0.1.2 (3)', 'sentry', 'reanimated', 'gestes', 'fond', 'app', PRET)), null);
  });

  it('un lancement arrete en route rend sa derniere etape', () => {
    assert.equal(arretDuLancement(trace('porte 0.1.2 (3)', 'sentry', 'reanimated', 'gestes', 'fond')), 'fond');
  });

  it('une etape en erreur garde son message', () => {
    assert.equal(arretDuLancement(trace('porte 0.1.2 (3)', 'sentry', 'app ERREUR module introuvable')), 'app ERREUR module introuvable');
  });

  it('un processus mort des la porte se voit aussi', () => {
    assert.equal(arretDuLancement(trace('porte 0.1.2 (3)')), 'porte 0.1.2 (3)');
  });

  it('pas de trace, ou une trace d une version qui ne notait pas son arrivee : rien a signaler', () => {
    assert.equal(arretDuLancement(''), null);
    assert.equal(arretDuLancement(trace('sentry', 'reanimated', 'gestes', 'fond', 'app')), null);
  });
});

describe('la porte de demarrage', () => {
  const layout = readFileSync(join(ici, '../app/_layout.tsx'), 'utf8');
  const app = readFileSync(join(ici, 'RootLayoutApp.tsx'), 'utf8');

  it('garde l ecran natif : elle ne le retire que pour montrer une etape ou une panne', () => {
    assert.match(layout, /preventAutoHideAsync\(\)/);
    const retraits = layout.match(/SplashScreen\.hideAsync\(\)/g) ?? [];
    assert.equal(retraits.length, 2, 'un retrait dans montrer(), un dans la borne de rendu');
  });

  it('lit sa version dans app.json, pas dans une constante a part', () => {
    assert.equal(/const BUILD\s*=/.test(layout), false);
    assert.match(layout, /from '@\/boot\/version'/);
  });

  it('l app note qu elle est a l ecran', () => {
    assert.match(app, /noterEtape\(PRET\)/);
  });
});
