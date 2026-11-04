import { Component, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { noterEtape } from '@/boot/journal';

const BUILD = '0.1.1 (2)';

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

function Cadre({ etape, erreur }: { etape: string; erreur: string | null }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#F4F2EE', padding: 24, justifyContent: 'center' }}>
      <Text style={{ color: '#20254B', fontSize: 28 }}>Boxing Center {BUILD}</Text>
      <Text style={{ color: '#20254B', fontSize: 18, marginTop: 16 }}>{erreur ?? etape}</Text>
    </View>
  );
}

class Borne extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }

  render() {
    if (this.state.message) return <Cadre etape="rendu" erreur={this.state.message} />;
    return this.props.children;
  }
}

function image(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/**
 * Premier ecran, sans splash bloque et sans module natif lourd.
 * Le dernier mot affiche est l'etape qui ferme l'application.
 */
export default function PorteDemarrage() {
  const [etape, setEtape] = useState('porte');
  const [erreur, setErreur] = useState<string | null>(null);
  const [App, setApp] = useState<ComponentType | null>(null);

  useEffect(() => {
    let vivant = true;
    void (async () => {
      await image();
      try {
        const SplashScreen = await import('expo-splash-screen');
        await SplashScreen.hideAsync();
      } catch {
        // Le cadre est deja peint.
      }
      for (const courante of ETAPES) {
        if (!vivant) return;
        setEtape(courante.nom);
        await noterEtape(courante.nom);
        await image();
        try {
          const module = await courante.charger();
          if (courante.nom === 'app') {
            const composant = (module as { default?: ComponentType }).default;
            if (!composant) throw new Error('RootLayoutApp sans export');
            if (vivant) setApp(() => composant);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (vivant) setErreur(message);
          await noterEtape(`${courante.nom} ERREUR ${message}`);
          return;
        }
      }
    })();
    return () => {
      vivant = false;
    };
  }, []);

  if (App && !erreur) {
    return (
      <Borne>
        <App />
      </Borne>
    );
  }

  return <Cadre etape={etape} erreur={erreur} />;
}
