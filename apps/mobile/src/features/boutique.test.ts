import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BOUTIQUE_ROOT, urlBoutique } from './boutique.ts';

describe('liens vers la boutique', () => {
  it('sans offre : l accueil, sans parametre que la boutique ne lit pas', () => {
    assert.equal(urlBoutique(), BOUTIQUE_ROOT);
    assert.equal(urlBoutique({ club: 'minimes' }), BOUTIQUE_ROOT);
  });

  it('avec une offre : son inscription, la salle deja choisie', () => {
    assert.equal(urlBoutique({ club: 'portet', offer: '44-99-4-semaines' }), 'https://boutique.boxingcenter.fr/inscription?product=44-99-4-semaines&gym=portet');
  });

  it('Saint-Cyprien porte le nom que la boutique attend', () => {
    assert.match(urlBoutique({ club: 'saint-cyprien', offer: '44-99-4-semaines' }), /[?&]gym=st-cyprien$/);
  });

  it('une offre sans club ouvre son inscription, la salle reste a choisir', () => {
    assert.equal(urlBoutique({ offer: 'seance-essai' }), 'https://boutique.boxingcenter.fr/inscription?product=seance-essai');
  });
});
