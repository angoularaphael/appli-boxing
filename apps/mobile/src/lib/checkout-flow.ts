import type { CheckoutSessionView } from '@bc/contract';
import * as WebBrowser from 'expo-web-browser';

import { creerSessionCheckout, lireSessionCheckout } from '@/lib/api';
import { configReady } from '@/lib/config';
import type { ClubId } from '@/ui/theme';

/** « Sans engagement Adulte » à la boutique (`GET /api/products`, vérifié le 02/11/2026). */
export const DEFAULT_OFFER_SLUG = '44-99-4-semaines';

/**
 * Les clubs pour lesquels le tunnel relié au compte attend une correction de la boutique : elle y
 * reçoit `saint-cyprien`, alors que sa table des salles connaît `st-cyprien`. D'ici là, ces clubs
 * passent par l'inscription de la boutique, qui porte la bonne salle (`urlBoutique`). À vider dès
 * que le tunnel accepte le club.
 */
const TUNNEL_EN_ATTENTE: readonly ClubId[] = ['saint-cyprien'];

export function tunnelOuvert(club: ClubId): boolean {
  return !TUNNEL_EN_ATTENTE.includes(club);
}

export async function ouvrirCheckoutBoutique(offerSlug: string, club: ClubId): Promise<CheckoutSessionView | null> {
  if (!configReady) return null;
  const session = await creerSessionCheckout({ offerSlug, club });
  await WebBrowser.openBrowserAsync(session.checkoutUrl, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
  });
  return lireSessionCheckout(session.id);
}
