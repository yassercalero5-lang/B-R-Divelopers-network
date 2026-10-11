import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { afterNextRender, Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';

import { SAMPLE_PROPERTIES } from './data/sample-properties';
import type { FirebaseUser } from './models/firebase-user.model';
import type { Property } from './models/property.model';
import { FirebaseAuthService } from './integrations/firebase/auth.service';
import { PropiedadesService } from './integrations/firebase/propiedades.service';

const PROPERTY_PHOTO_MAX_DIMENSION = 1400;
const PROFILE_PHOTO_MAX_DIMENSION = 480;

@Component({
  imports: [NgOptimizedImage],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly firebaseAuth = inject(FirebaseAuthService);
  private readonly propiedadesService = inject(PropiedadesService);
  protected readonly query = signal('');
  protected readonly selectedType = signal('Todas');
  protected readonly myPropertiesOnly = signal(false);
  protected readonly maxPrice = signal(0);
  protected readonly favorites = signal<Array<number | string>>([]);
  protected readonly selectedProperty = signal<Property | null>(null);
  protected readonly detailPhotoIndex = signal(0);
  protected readonly detailPhotos = computed(() => {
    const property = this.selectedProperty();
    return property ? (property.photos?.length ? property.photos : [property.image]) : [];
  });
  protected readonly notice = signal('');
  protected readonly accountDialog = signal<'login' | 'register' | null>(null);
  protected readonly accountError = signal('');
  protected readonly currentUser = signal<FirebaseUser | null>(null);
  protected readonly publishAfterAccount = signal(false);
  protected readonly publishDialog = signal(false);
  protected readonly profileDialog = signal(false);
  protected readonly profileError = signal('');
  protected readonly profilePhoto = signal('');
  protected readonly propertyPhoto = signal('');
  protected readonly propertyPhotos = signal<string[]>([]);
  protected readonly deletePropertyId = signal<number | string | null>(null);
  protected readonly ownedProperties = computed(() =>
    this.properties().filter((property) => property.ownerUid === this.currentUser()?.uid),
  );
  protected readonly properties = signal<Property[]>(SAMPLE_PROPERTIES);
  private readonly searchableProperties = computed(() =>
    this.properties().map((property) => ({
      property,
      searchText: `${property.title} ${property.location} ${property.type}`.toLocaleLowerCase(),
    })),
  );

  protected readonly editingPropertyId = signal<number | string | null>(null);
  protected readonly editingProperty = computed(
    () => this.properties().find((property) => property.id === this.editingPropertyId()) ?? null,
  );

  constructor() {
    afterNextRender(() => {
      if (!this.isBrowser) return;
      this.propiedadesService.watchProperties(
        (cloudProperties) => this.properties.set([...cloudProperties, ...SAMPLE_PROPERTIES]),
        () =>
          this.showNotice('No se pudieron cargar anuncios de Firebase. Revisa la configuración.'),
      );
      this.firebaseAuth.watch((user) => {
        this.currentUser.set(user);
        if (user) void this.migrateLocalProperties(user);
      });
    });
  }

  private async migrateLocalProperties(user: FirebaseUser): Promise<void> {
    try {
      const count = await this.propiedadesService.migrateLocalProperties(user);
      if (count)
        this.showNotice(`Se sincronizaron ${count} anuncios guardados en este dispositivo.`);
    } catch {
      this.showNotice('Iniciaste sesión, pero no se pudieron sincronizar los anuncios locales.');
    }
  }

  protected readonly filteredProperties = computed(() => {
    const term = this.query().trim().toLocaleLowerCase();
    const selectedType = this.selectedType();
    const maxPrice = this.maxPrice();
    const ownerUid = this.currentUser()?.uid;
    const myPropertiesOnly = this.myPropertiesOnly();

    return this.searchableProperties()
      .filter(({ property, searchText }) => {
        const matchesQuery = !term || searchText.includes(term);
        const matchesType = selectedType === 'Todas' || property.type === selectedType;
        const matchesPrice = maxPrice === 0 || property.price <= maxPrice;
        const matchesOwner = !myPropertiesOnly || (!!ownerUid && property.ownerUid === ownerUid);
        return matchesQuery && matchesType && matchesPrice && matchesOwner;
      })
      .map(({ property }) => property);
  });

  protected applySearch(): void {
    document.getElementById('propiedades')?.scrollIntoView({ behavior: 'smooth' });
  }

  protected resetFilters(): void {
    this.query.set('');
    this.selectedType.set('Todas');
    this.maxPrice.set(0);
    this.myPropertiesOnly.set(false);
  }

  protected showMyProperties(): void {
    this.query.set('');
    this.selectedType.set('Todas');
    this.maxPrice.set(0);
    this.myPropertiesOnly.set(true);
    document.getElementById('propiedades')?.scrollIntoView({ behavior: 'smooth' });
  }

  protected toggleFavorite(id: number | string): void {
    this.favorites.update((current) =>
      current.includes(id) ? current.filter((favorite) => favorite !== id) : [...current, id],
    );
  }

  protected openDetails(property: Property): void {
    this.detailPhotoIndex.set(0);
    this.selectedProperty.set(property);
  }

  protected changeDetailPhoto(direction: -1 | 1): void {
    const count = this.detailPhotos().length;
    if (count < 2) return;
    this.detailPhotoIndex.update((index) => (index + direction + count) % count);
  }

  protected selectDetailPhoto(index: number): void {
    if (index >= 0 && index < this.detailPhotos().length) this.detailPhotoIndex.set(index);
  }

  protected closeDetails(): void {
    this.selectedProperty.set(null);
  }

  protected showNotice(message: string): void {
    this.notice.set(message);
  }

  protected openAccount(mode: 'login' | 'register'): void {
    this.accountError.set('');
    this.accountDialog.set(mode);
  }

  protected openPublish(): void {
    if (this.currentUser()) {
      this.editingPropertyId.set(null);
      this.propertyPhoto.set('');
      this.propertyPhotos.set([]);
      this.publishDialog.set(true);
      return;
    }
    this.publishAfterAccount.set(true);
    this.openAccount('register');
  }

  protected async submitAccount(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    const data = new FormData(form);
    const email = String(data.get('email') ?? '')
      .trim()
      .toLocaleLowerCase();
    const name = String(data.get('name') ?? '').trim();
    const password = String(data.get('password') ?? '');
    this.accountError.set('');

    try {
      if (this.accountDialog() === 'register') {
        const confirmation = String(data.get('confirmPassword') ?? '');
        if (password !== confirmation) {
          this.accountError.set('Las contraseñas no coinciden.');
          return;
        }
        const user = await this.firebaseAuth.register(name, email, password);
        this.currentUser.set(user);
        this.showNotice(`¡Cuenta creada, ${name}! Tus datos ya se guardan en Firebase.`);
      } else {
        const user = await this.firebaseAuth.login(email, password);
        this.currentUser.set(user);
        this.showNotice('Sesión iniciada. Tus propiedades se sincronizan con Firebase.');
      }

      const shouldPublish = this.publishAfterAccount();
      this.publishAfterAccount.set(false);
      this.accountDialog.set(null);
      form.reset();
      if (shouldPublish) this.publishDialog.set(true);
    } catch (error) {
      this.accountError.set(this.getFirebaseError(error));
    }
  }

  protected switchAccountMode(mode: 'login' | 'register'): void {
    this.accountError.set('');
    this.accountDialog.set(mode);
  }

  protected closeAccount(): void {
    this.accountDialog.set(null);
    this.accountError.set('');
    this.publishAfterAccount.set(false);
  }

  private getFirebaseError(error: unknown): string {
    const code =
      typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
    if (code === 'auth/email-already-in-use') return 'Ese correo ya tiene cuenta. Inicia sesión.';
    if (code === 'auth/invalid-credential' || code === 'auth/user-not-found')
      return 'Correo o contraseña incorrectos.';
    if (code === 'auth/weak-password') return 'La contraseña debe tener al menos 6 caracteres.';
    if (code === 'auth/invalid-email') return 'Escribe un correo válido.';
    if (code === 'permission-denied')
      return 'Firebase rechazó la operación. Revisa las reglas de Firestore y Storage.';
    return 'No se pudo conectar con Firebase. Revisa la configuración del proyecto.';
  }
  protected async submitProperty(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const user = this.currentUser();
    if (!user) {
      this.closePublish();
      this.publishAfterAccount.set(true);
      this.openAccount('register');
      return;
    }
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    const data = new FormData(form);
    const title = String(data.get('title') ?? '').trim();
    const location = String(data.get('location') ?? '').trim();
    const price = Number(data.get('price'));
    if (!title || !location || !Number.isFinite(price) || price < 1) return;
    const type = String(data.get('type') ?? 'Casa') as Property['type'];
    const existing = this.editingProperty();
    if (existing && existing.ownerUid !== user.uid) {
      this.closePublish();
      return;
    }
    const property: Property = {
      id: existing?.id ?? Date.now(),
      title,
      type,
      location,
      price,
      priceLabel: `$${price.toLocaleString('en-US')}`,
      bedrooms: Number(data.get('bedrooms')) || 0,
      bathrooms: Number(data.get('bathrooms')) || 0,
      area: Number(data.get('area')) || 0,
      status: existing?.status ?? 'NUEVA',
      image:
        this.propertyPhotos()[0] ||
        this.propertyPhoto() ||
        existing?.image ||
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=85',
      photos: this.propertyPhotos().length ? this.propertyPhotos() : existing?.photos,
      imageAlt: `Propiedad publicada en ${location}`,
      description:
        String(data.get('description') ?? '').trim() ||
        `Propiedad disponible en ${location}, Nicaragua.`,
      ownerUid: user.uid,
      ownerEmail: user.email,
    };
    try {
      const saved = await this.propiedadesService.saveProperty(property, user);
      if (existing) {
        this.properties.update((items) =>
          items.map((item) => (item.id === existing.id ? saved : item)),
        );
        this.showNotice('Tu publicación se actualizó y sincronizó.');
      } else {
        this.properties.update((items) => [saved, ...items]);
        this.showNotice('Tu propiedad se publicó y sincronizó.');
      }
      this.closePublish();
      form.reset();
      document.getElementById('propiedades')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      this.showNotice(this.getFirebaseError(error));
    }
  }

  protected openEditProperty(property: Property): void {
    if (!this.canManageProperty(property, 'editar')) return;
    this.editingPropertyId.set(property.id);
    const photos = property.photos?.length ? property.photos : [property.image];
    this.propertyPhotos.set(photos);
    this.propertyPhoto.set(photos[0] ?? '');
    this.publishDialog.set(true);
  }

  protected closePublish(): void {
    this.publishDialog.set(false);
    this.editingPropertyId.set(null);
    this.propertyPhoto.set('');
    this.propertyPhotos.set([]);
  }

  protected requestDeleteProperty(property: Property): void {
    if (!this.canManageProperty(property, 'eliminar')) return;
    this.deletePropertyId.set(property.id);
  }

  private canManageProperty(property: Property, action: 'editar' | 'eliminar'): boolean {
    const user = this.currentUser();
    if (!user) {
      this.showNotice(`Inicia sesión con tu cuenta para ${action} un anuncio.`);
      this.openAccount('login');
      return false;
    }
    if (property.ownerUid !== user.uid) {
      this.showNotice('Solo puedes administrar anuncios publicados con tu cuenta.');
      return false;
    }
    return true;
  }

  protected async confirmDeleteProperty(): Promise<void> {
    const id = this.deletePropertyId();
    const user = this.currentUser();
    const property = this.properties().find((item) => item.id === id);
    if (!property) return;
    if (!user) {
      this.deletePropertyId.set(null);
      this.showNotice('Inicia sesión con tu cuenta para eliminar este anuncio.');
      this.openAccount('login');
      return;
    }
    if (property.ownerUid !== user.uid) {
      this.deletePropertyId.set(null);
      this.showNotice('Solo puedes eliminar anuncios publicados con tu cuenta.');
      return;
    }
    if (typeof id !== 'string') return;
    try {
      await this.propiedadesService.deleteProperty(property);
      this.properties.update((items) => items.filter((item) => item.id !== id));
      this.deletePropertyId.set(null);
      this.showNotice('La publicación se eliminó de Firebase.');
    } catch (error) {
      this.showNotice(this.getFirebaseError(error));
    }
  }

  protected cancelDeleteProperty(): void {
    this.deletePropertyId.set(null);
  }

  protected openProfile(): void {
    this.profileError.set('');
    this.profilePhoto.set(this.currentUser()?.avatar ?? '');
    this.profileDialog.set(true);
  }

  protected async submitProfile(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const current = this.currentUser();
    if (!(form instanceof HTMLFormElement) || !current) return;
    const name = String(new FormData(form).get('name') ?? '').trim();
    if (!name) return;
    try {
      let avatar = this.profilePhoto() || undefined;
      if (avatar?.startsWith('data:image/')) {
        avatar = await this.propiedadesService.uploadAvatar(current, avatar);
      }
      const updated = await this.firebaseAuth.updateCurrentUser(name, avatar);
      this.currentUser.set(updated);
      this.profileDialog.set(false);
      this.showNotice('Tu perfil se actualizó.');
    } catch (error) {
      this.profileError.set(this.getFirebaseError(error));
    }
  }

  protected async logout(): Promise<void> {
    this.myPropertiesOnly.set(false);
    try {
      await this.firebaseAuth.logout();
      this.currentUser.set(null);
      this.showNotice('Has cerrado sesión.');
    } catch (error) {
      this.showNotice(this.getFirebaseError(error));
    }
  }

  protected async onPhotoSelected(event: Event, target: 'profile' | 'property'): Promise<void> {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    const chosenFiles =
      target === 'property'
        ? Array.from(input.files ?? [])
        : Array.from(input.files ?? []).slice(0, 1);
    if (!chosenFiles.length) return;
    const currentPhotos = target === 'property' ? this.propertyPhotos() : [];
    if (target === 'property' && currentPhotos.length + chosenFiles.length > 8) {
      this.showNotice(
        `Puedes agregar hasta 8 fotos por propiedad. Ya tienes ${currentPhotos.length}.`,
      );
      input.value = '';
      return;
    }
    if (
      chosenFiles.some((file) => !file.type.startsWith('image/') || file.size > 8 * 1024 * 1024)
    ) {
      const message =
        target === 'profile'
          ? 'Elige una imagen de máximo 8 MB.'
          : 'Elige fotos de máximo 8 MB cada una.';
      if (target === 'profile') this.profileError.set(message);
      else this.showNotice(message);
      input.value = '';
      return;
    }
    try {
      const images = await Promise.all(
        chosenFiles.map(async (file) => {
          const bitmap = await createImageBitmap(file);
          const maxDimension =
            target === 'profile' ? PROFILE_PHOTO_MAX_DIMENSION : PROPERTY_PHOTO_MAX_DIMENSION;
          const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(bitmap.width * scale);
          canvas.height = Math.round(bitmap.height * scale);
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Canvas unavailable');
          context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          bitmap.close();
          return canvas.toDataURL('image/jpeg', 0.78);
        }),
      );
      if (target === 'profile') this.profilePhoto.set(images[0]);
      else {
        const allPhotos = [...currentPhotos, ...images];
        this.propertyPhotos.set(allPhotos);
        this.propertyPhoto.set(allPhotos[0]);
      }
    } catch {
      if (target === 'profile') this.profileError.set('No se pudo leer esa imagen.');
      else this.showNotice('No se pudieron leer las imágenes seleccionadas.');
    }
    input.value = '';
  }
  protected isLocalImage(image: string): boolean {
    return image.startsWith('data:image/');
  }

  protected contactLink(property: Property): string {
    return `mailto:hola@brdevelopers.network?subject=${encodeURIComponent(`Me interesa ${property.title}`)}`;
  }
}
