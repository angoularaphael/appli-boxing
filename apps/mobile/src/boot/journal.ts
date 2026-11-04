/** Trace du demarrage, ecrite avant chaque etape. Le dernier mot reste si le processus meurt. */
export async function noterEtape(ligne: string): Promise<void> {
  try {
    const { File, Paths } = await import('expo-file-system');
    const fichier = new File(Paths.cache, 'bc-boot.log');
    const avant = fichier.exists ? await fichier.text() : '';
    await fichier.write(`${avant}${new Date().toISOString()} ${ligne}\n`);
  } catch {
    // L'ecran reste la trace si le disque refuse.
  }
}
