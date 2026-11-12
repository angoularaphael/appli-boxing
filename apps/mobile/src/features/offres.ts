import { Linking } from 'react-native';

import { track } from '@/features/analytics';
import { urlBoutique } from '@/features/sections';
import type { ClubId } from '@/ui/theme';

/** Le catalogue de la boutique. Le clic se compte dans le back office ; la boutique ne lit pas de club sur son accueil. */
export function ouvrirOffres(club: ClubId | null | undefined, from: string) {
  track('offer_open', { from, value: 'catalogue' });
  void Linking.openURL(urlBoutique({ club: club ?? undefined }));
}
