import type { FirebaseOptions } from 'firebase/app';

const firebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyD7HeS60Hd9T1dUk4W--fn5FPaX4poXY4o',
  authDomain: 'byr-developer-network.firebaseapp.com',
  projectId: 'byr-developer-network',
  storageBucket: 'byr-developer-network.firebasestorage.app',
  messagingSenderId: '574501659176',
  appId: '1:574501659176:web:42ade53145851c4b698b1d',
  measurementId: 'G-TCWYQBKKFS',
  // AquÃ­ van tus valores de la consola
};

export async function getFirebaseApp() {
  const { getApp, getApps, initializeApp } = await import('firebase/app');
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}
