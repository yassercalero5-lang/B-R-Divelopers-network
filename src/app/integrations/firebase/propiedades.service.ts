import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import type { FirebaseUser } from '../../models/firebase-user.model';
import type { Property } from '../../models/property.model';
import { getFirebaseApp } from './firebase';

const LEGACY_PROPERTIES_KEY = 'br-nicaragua-properties';

@Injectable({ providedIn: 'root' })
export class PropiedadesService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  watchProperties(
    onData: (properties: Property[]) => void,
    onError: (error: unknown) => void,
  ): () => void {
    if (!this.isBrowser) return () => undefined;
    let active = true;
    let unsubscribe: () => void = () => undefined;
    void Promise.all([import('firebase/firestore'), getFirebaseApp()])
      .then(([firestore, app]) => {
        if (!active) return;
        unsubscribe = firestore.onSnapshot(
          firestore.collection(firestore.getFirestore(app), 'properties'),
          (snapshot) => {
            const properties = snapshot.docs.map((item) => ({
              ...(item.data() as Omit<Property, 'id'>),
              id: item.id,
            }));
            onData(properties);
          },
          onError,
        );
      })
      .catch(onError);
    return () => {
      active = false;
      unsubscribe();
    };
  }

  async saveProperty(property: Property, user: FirebaseUser): Promise<Property> {
    const [firestore, storageSdk, app] = await Promise.all([
      import('firebase/firestore'),
      import('firebase/storage'),
      getFirebaseApp(),
    ]);
    const db = firestore.getFirestore(app);
    const properties = firestore.collection(db, 'properties');
    const propertyRef =
      typeof property.id === 'string'
        ? firestore.doc(properties, property.id)
        : firestore.doc(properties);
    const storage = storageSdk.getStorage(app);
    const previous = typeof property.id === 'string' ? await firestore.getDoc(propertyRef) : null;
    const storedPhotos = previous?.data()?.['photos'];
    const previousPhotoCount = Array.isArray(storedPhotos) ? storedPhotos.length : 0;
    const selectedPhotos = property.photos?.length ? property.photos : [property.image];
    const photos = await Promise.all(
      selectedPhotos.map(async (photo, index) => {
        if (!photo.startsWith('data:image/')) return photo;
        const imageRef = storageSdk.ref(
          storage,
          `properties/${user.uid}/${propertyRef.id}/${index}.jpg`,
        );
        await storageSdk.uploadString(imageRef, photo, 'data_url', {
          contentType: 'image/jpeg',
        });
        return storageSdk.getDownloadURL(imageRef);
      }),
    );
    const saved: Property = {
      ...property,
      id: propertyRef.id,
      image: photos[0] ?? property.image,
      photos,
      ownerUid: user.uid,
      ownerEmail: user.email,
    };
    const publicData = { ...saved };
    delete publicData.ownerEmail;
    await firestore.setDoc(
      propertyRef,
      {
        ...publicData,
        ...(typeof property.id === 'string' ? {} : { createdAt: Date.now() }),
        updatedAt: Date.now(),
      },
      { merge: true },
    );
    if (previousPhotoCount > photos.length) {
      await Promise.allSettled(
        Array.from({ length: previousPhotoCount - photos.length }, (_, index) =>
          storageSdk.deleteObject(
            storageSdk.ref(
              storage,
              `properties/${user.uid}/${propertyRef.id}/${photos.length + index}.jpg`,
            ),
          ),
        ),
      );
    }
    return saved;
  }

  async deleteProperty(property: Property): Promise<void> {
    if (typeof property.id !== 'string' || !property.ownerUid) return;
    const [firestore, storageSdk, app] = await Promise.all([
      import('firebase/firestore'),
      import('firebase/storage'),
      getFirebaseApp(),
    ]);
    await firestore.deleteDoc(
      firestore.doc(firestore.getFirestore(app), 'properties', property.id),
    );
    const storage = storageSdk.getStorage(app);
    const photoCount = property.photos?.length ?? 1;
    await Promise.allSettled(
      Array.from({ length: photoCount }, (_, index) =>
        storageSdk.deleteObject(
          storageSdk.ref(storage, `properties/${property.ownerUid}/${property.id}/${index}.jpg`),
        ),
      ),
    );
  }

  async uploadAvatar(user: FirebaseUser, dataUrl: string): Promise<string> {
    const [storageSdk, app] = await Promise.all([import('firebase/storage'), getFirebaseApp()]);
    const storage = storageSdk.getStorage(app);
    const avatarRef = storageSdk.ref(storage, `users/${user.uid}/avatar.jpg`);
    await storageSdk.uploadString(avatarRef, dataUrl, 'data_url', { contentType: 'image/jpeg' });
    return storageSdk.getDownloadURL(avatarRef);
  }

  async migrateLocalProperties(user: FirebaseUser): Promise<number> {
    if (!this.isBrowser) return 0;
    const migrationKey = `br-nicaragua-properties-migrated-${user.uid}`;
    if (localStorage.getItem(migrationKey)) return 0;

    const raw = localStorage.getItem(LEGACY_PROPERTIES_KEY);
    const legacy: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(legacy))
      throw new Error('Los anuncios locales no tienen un formato válido.');

    const owned = (legacy as Property[]).filter(
      (property) => property.ownerEmail?.toLocaleLowerCase() === user.email.toLocaleLowerCase(),
    );
    for (const property of owned) {
      await this.saveProperty(
        { ...property, id: `legacy_${user.uid}_${property.id}`, ownerUid: user.uid },
        user,
      );
    }
    localStorage.setItem(migrationKey, 'true');
    return owned.length;
  }
}
