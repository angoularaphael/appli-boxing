/**
 * Trace du démarrage, écrite avant chaque étape : si le processus meurt, le dernier mot écrit nomme
 * l'étape. Chaque lancement lit la trace du précédent, puis repart d'une page blanche : le fichier
 * ne grossit pas, et un lancement qui n'est pas allé au bout se voit au suivant.
 */
const NOM = 'bc-boot.log';
/** Écrite quand l'app est à l'écran. Son absence dit que le lancement s'est arrêté avant. */
export const PRET = 'pret';
/** Sur le web, pas de fichier : la porte reste silencieuse. */
const SANS_DISQUE = typeof document !== 'undefined';

let lignes: string[] = [];

/**
 * L'étape où un lancement s'est arrêté, ou null s'il est allé au bout. Une trace vide, ou écrite
 * par une version qui ne notait pas son arrivée, ne dit rien : null aussi.
 */
export function arretDuLancement(trace: string): string | null {
  const etapes = trace
    .split('\n')
    .map((ligne) => ligne.trim().replace(/^\S+\s+/, ''))
    .filter(Boolean);
  if (!etapes.some((etape) => etape.startsWith('porte'))) return null;
  if (etapes.includes(PRET)) return null;
  return etapes[etapes.length - 1] ?? null;
}

async function fichier() {
  const { File, Paths } = await import('expo-file-system');
  return new File(Paths.cache, NOM);
}

async function ecrire(): Promise<void> {
  if (SANS_DISQUE) return;
  try {
    const f = await fichier();
    if (!f.exists) f.create();
    await f.write(`${lignes.join('\n')}\n`);
  } catch {
    // L'écran reste la trace si le disque refuse.
  }
}

/**
 * À l'ouverture : rend l'étape où le lancement précédent s'est arrêté (null s'il est allé au bout),
 * puis repart d'une page blanche.
 */
export async function ouvrirJournal(build: string): Promise<string | null> {
  let arret: string | null = null;
  if (!SANS_DISQUE) {
    try {
      const f = await fichier();
      if (f.exists) arret = arretDuLancement(await f.text());
    } catch {
      // Trace illisible : on démarre sans elle.
    }
  }
  lignes = [];
  await noterEtape(`porte ${build}`);
  return arret;
}

export async function noterEtape(ligne: string): Promise<void> {
  lignes.push(`${new Date().toISOString()} ${ligne}`);
  await ecrire();
}
