import app from '../../app.json';

/** La version et le numéro de build Android, lus dans app.json : un seul endroit à changer. */
export const BUILD = `${app.expo.version} (${app.expo.android.versionCode})`;
