import * as SplashScreen from 'expo-splash-screen';
import { Component, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { noterEtape, ouvrirJournal } from '@/boot/journal';
import { BUILD } from '@/boot/version';

// L'écran natif reste jusqu'à ce que l'écran de lancement, identique, soit dessiné : c'est lui qui
// le congédie (ui/BootScreen). La porte ne le retire elle-même que pour montrer une étape ou une panne.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

type Etape = {
  nom: string;
  charger: () => Promise<unknown>;
};

const ETAPES: Etape[] = [
  { nom: 'sentry', charger: () => import('@/lib/sentry') },
  { nom: 'reanimated', charger: () => import('react-native-reanimated') },
  { nom: 'gestes', charger: () => import('react-native-gesture-handler') },
  { nom: 'fond', charger: () => import('@/lib/background') },
  { nom: 'app', charger: () => import('@/boot/RootLayoutApp') },
];

/** Les deux fonds de l'écran natif (app.json, expo-splash-screen) : la porte ne s'en distingue pas. */
const FOND = { clair: '#F4F2EE', sombre: '#0D1120' } as const;
const ENCRE = { clair: '#20254B', sombre: '#F5F5F5' } as const;
/** Passé ce délai sans que l'app soit montée, la porte se montre : une étape nommée vaut mieux qu'un logo figé. */
const PATIENCE_MS = 8000;

type Vue = { etape: string; erreur: string | null };

function Cadre({ etape, erreur, sombre, onReessayer }: Vue & { sombre: boolean; onReessayer: () => void }) {
  const encre = sombre ? ENCRE.sombre : ENCRE.clair;
  const fond = sombre ? FOND.sombre : FOND.clair;
  // Un lancement à découvert : la version, puis l'étape en cours.
  if (erreur === null) {
    return (
      <View style={{ flex: 1, backgroundColor: fond, padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: encre, fontSize: 28 }}>Boxing Center {BUILD}</Text>
        <Text style={{ color: encre, fontSize: 18, marginTop: 16 }}>{etape}</Text>
      </View>
    );
  }
  // Une panne : ce qui se passe d'abord, pour tout le monde ; la version et l'étape en petit, pour qui dépanne.
  return (
    <View style={{ flex: 1, backgroundColor: fond, padding: 24, justifyContent: 'center' }}>
      <Text style={{ color: encre, fontSize: 26, fontWeight: '700' }}>L’application n’a pas pu démarrer.</Text>
      <Text style={{ color: encre, fontSize: 16, marginTop: 6, opacity: 0.7 }}>The app could not start.</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onReessayer}
        style={{ alignSelf: 'flex-start', marginTop: 28, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 12, backgroundColor: '#E8001C' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Réessayer · Try again</Text>
      </Pressable>
      <Text selectable numberOfLines={8} style={{ color: encre, fontSize: 13, marginTop: 32, opacity: 0.6 }}>
        Boxing Center {BUILD} · {etape} · {erreur}
      </Text>
    </View>
  );
}

class Borne extends Component<{ children: ReactNode; sombre: boolean }, { message: string | null }> {
  state = { message: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }

  componentDidCatch(error: Error) {
    // L'écran natif peut encore couvrir l'app : on le retire pour que la panne se lise.
    void SplashScreen.hideAsync().catch(() => undefined);
    void noterEtape(`rendu ERREUR ${error.message}`);
    void import('@/lib/sentry').then(
      ({ Sentry }) => Sentry.captureException(error),
      () => undefined,
    );
  }

  render() {
    if (this.state.message !== null) {
      return <Cadre etape="rendu" erreur={this.state.message} sombre={this.props.sombre} onReessayer={() => this.setState({ message: null })} />;
    }
    return this.props.children;
  }
}

function image(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/** Le lancement précédent s'est arrêté en route : Sentry le reçoit, une fois chargé. */
function signalerArret(arret: string) {
  void import('@/lib/sentry').then(
    ({ Sentry }) => Sentry.captureMessage(`Lancement précédent interrompu : ${arret}`, 'warning'),
    () => undefined,
  );
}

/**
 * Premier écran, sans module natif lourd. Les modules se chargent un par un, et chaque étape est
 * notée avant d'être tentée (boot/journal) : si le processus meurt, le dernier mot écrit la nomme.
 *
 * Un lancement qui se passe bien ne montre rien de tout cela : l'écran natif reste, puis l'écran
 * de lancement prend sa suite. La porte ne se montre, étape par étape, que si le lancement
 * précédent n'est pas allé au bout, si une étape échoue, ou si le chargement dure trop.
 */
export default function PorteDemarrage() {
  const sombre = useColorScheme() === 'dark';
  const [essai, setEssai] = useState(0);
  const [vue, setVue] = useState<Vue | null>(null);
  const [App, setApp] = useState<ComponentType | null>(null);

  useEffect(() => {
    let vivant = true;
    let etape = 'porte';
    let aDecouvert = false;
    const montrer = async (erreur: string | null) => {
      aDecouvert = true;
      if (vivant) setVue({ etape, erreur });
      await SplashScreen.hideAsync().catch(() => undefined);
      await image();
    };
    const garde = setTimeout(() => {
      if (!aDecouvert) void montrer(null);
    }, PATIENCE_MS);
    void (async () => {
      const arret = await ouvrirJournal(BUILD);
      if (arret !== null) await montrer(null);
      for (const courante of ETAPES) {
        if (!vivant) return;
        etape = courante.nom;
        if (aDecouvert) await montrer(null);
        await noterEtape(courante.nom);
        try {
          const module = await courante.charger();
          if (courante.nom === 'app') {
            const composant = (module as { default?: ComponentType }).default;
            if (!composant) throw new Error('RootLayoutApp sans export');
            if (vivant) setApp(() => composant);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          clearTimeout(garde);
          await noterEtape(`${courante.nom} ERREUR ${message}`);
          await montrer(message);
          return;
        }
      }
      clearTimeout(garde);
      if (arret !== null) signalerArret(arret);
    })();
    return () => {
      vivant = false;
      clearTimeout(garde);
    };
  }, [essai]);

  if (App && (vue === null || vue.erreur === null)) {
    return (
      <Borne sombre={sombre}>
        <App />
      </Borne>
    );
  }
  // Rien à montrer : l'écran natif couvre ce fond, qui est le sien.
  if (vue === null) return <View style={{ flex: 1, backgroundColor: sombre ? FOND.sombre : FOND.clair }} />;
  return (
    <Cadre
      etape={vue.etape}
      erreur={vue.erreur}
      sombre={sombre}
      onReessayer={() => {
        setVue({ etape: 'porte', erreur: null });
        setEssai((n) => n + 1);
      }}
    />
  );
}
