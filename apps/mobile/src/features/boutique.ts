import type { ClubId } from '@/ui/theme';

export const BOUTIQUE_ROOT = 'https://boutique.boxingcenter.fr/';

export type BoutiqueContext = { club?: ClubId; offer?: string };

/** La salle telle que la boutique la nomme dans `?gym=` (sa page d'inscription, relevé en ligne le 12/11/2026). */
const GYM_BOUTIQUE: Record<ClubId, string> = {
  minimes: 'minimes',
  'saint-cyprien': 'st-cyprien',
  'etats-unis': 'etats-unis',
  ramonville: 'ramonville',
  portet: 'portet',
};

/**
 * Lien vers la boutique. Avec une offre, il ouvre directement son inscription, la salle déjà
 * choisie : `/inscription?product=…&gym=…`. Sans offre, il ouvre l'accueil ; la boutique n'y lit
 * aucun paramètre, on n'en envoie donc pas.
 */
export function urlBoutique(ctx: BoutiqueContext = {}): string {
  if (!ctx.offer) return BOUTIQUE_ROOT;
  const query = [`product=${encodeURIComponent(ctx.offer)}`];
  if (ctx.club) query.push(`gym=${GYM_BOUTIQUE[ctx.club]}`);
  return `${BOUTIQUE_ROOT}inscription?${query.join('&')}`;
}
