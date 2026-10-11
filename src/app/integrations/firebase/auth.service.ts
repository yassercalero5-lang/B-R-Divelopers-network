import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { User } from 'firebase/auth';

import { getFirebaseApp } from './firebase';
import type { FirebaseUser } from '../../models/firebase-user.model';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  watch(callback: (user: FirebaseUser | null) => void): () => void {
    if (!this.isBrowser) return () => undefined;
    let active = true;
    let unsubscribe: () => void = () => undefined;
    void Promise.all([import('firebase/auth'), getFirebaseApp()])
      .then(([auth, app]) => {
        if (!active) return;
        unsubscribe = auth.onAuthStateChanged(auth.getAuth(app), (user) =>
          callback(this.toUser(user)),
        );
      })
      .catch(() => callback(null));
    return () => {
      active = false;
      unsubscribe();
    };
  }

  async register(name: string, email: string, password: string): Promise<FirebaseUser> {
    const [auth, app] = await Promise.all([import('firebase/auth'), getFirebaseApp()]);
    const credentials = await auth.createUserWithEmailAndPassword(
      auth.getAuth(app),
      email,
      password,
    );
    await auth.updateProfile(credentials.user, { displayName: name });
    return this.toUser(credentials.user)!;
  }

  async login(email: string, password: string): Promise<FirebaseUser> {
    const [auth, app] = await Promise.all([import('firebase/auth'), getFirebaseApp()]);
    const credentials = await auth.signInWithEmailAndPassword(auth.getAuth(app), email, password);
    return this.toUser(credentials.user)!;
  }

  async updateUser(user: User, name: string, avatar?: string): Promise<FirebaseUser> {
    const auth = await import('firebase/auth');
    await auth.updateProfile(user, { displayName: name, photoURL: avatar ?? null });
    return this.toUser(user)!;
  }

  async updateCurrentUser(name: string, avatar?: string): Promise<FirebaseUser> {
    const [auth, app] = await Promise.all([import('firebase/auth'), getFirebaseApp()]);
    const user = auth.getAuth(app).currentUser;
    if (!user) throw new Error('No hay una sesión de Firebase activa.');
    return this.updateUser(user, name, avatar);
  }

  async logout(): Promise<void> {
    const [auth, app] = await Promise.all([import('firebase/auth'), getFirebaseApp()]);
    await auth.signOut(auth.getAuth(app));
  }

  private toUser(user: User | null): FirebaseUser | null {
    if (!user?.email) return null;
    return {
      uid: user.uid,
      email: user.email,
      name: user.displayName || user.email,
      avatar: user.photoURL ?? undefined,
    };
  }
}
