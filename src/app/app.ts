import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { afterNextRender, Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';

interface Property {
  id: number;
  title: string;
  type: 'Casa' | 'Apartamento' | 'Terreno';
  location: string;
  price: number;
  priceLabel: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status: string;
  image: string;
  photos?: string[];
  ownerEmail?: string;
  imageAlt: string;
  description: string;
}

interface LocalAccount {
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
}

@Component({
  imports: [NgOptimizedImage],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly query = signal('');
  protected readonly selectedType = signal('Todas');
  protected readonly myPropertiesOnly = signal(false);
  protected readonly maxPrice = signal(0);
  protected readonly favorites = signal<number[]>([]);
  protected readonly selectedProperty = signal<Property | null>(null);
  protected readonly notice = signal('');
  protected readonly accountDialog = signal<'login' | 'register' | null>(null);
  protected readonly accountError = signal('');
  protected readonly currentUser = signal<Pick<LocalAccount, 'name' | 'email' | 'avatar'> | null>(null);
  protected readonly publishAfterAccount = signal(false);
  protected readonly publishDialog = signal(false);
  protected readonly profileDialog = signal(false);
  protected readonly profileError = signal('');
  protected readonly profilePhoto = signal('');
  protected readonly propertyPhoto = signal('');
  protected readonly propertyPhotos = signal<string[]>([]);
  protected readonly editingPropertyId = signal<number | null>(null);
  protected readonly deletePropertyId = signal<number | null>(null);
  protected readonly ownedProperties = computed(() =>
    this.properties().filter((property) => property.ownerEmail === this.currentUser()?.email),
  );
  protected readonly properties = signal<Property[]>([
    {
      id: 1,
      title: 'Casa Luz de Montaña',
      type: 'Casa',
      location: 'Las Colinas, Managua',
      price: 485000,
      priceLabel: '$485,000',
      bedrooms: 4,
      bathrooms: 3,
      area: 286,
      status: 'DESTACADA',
      image:
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=85',
      imageAlt: 'Casa moderna de dos plantas con jardín y piscina',
      description:
        'Una casa contemporánea con espacios amplios, luz natural y un jardín que invita a quedarse.',
    },
    {
      id: 2,
      title: 'Refugio entre árboles',
      type: 'Casa',
      location: 'San Juan del Sur, Rivas',
      price: 620000,
      priceLabel: '$620,000',
      bedrooms: 3,
      bathrooms: 3,
      area: 320,
      status: 'NUEVA',
      image:
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85',
      imageAlt: 'Residencia de diseño rodeada de árboles tropicales',
      description:
        'Un refugio privado cerca de la bahía de San Juan del Sur, con terrazas abiertas y vistas verdes.',
    },
    {
      id: 3,
      title: 'Apartamento Aire',
      type: 'Apartamento',
      location: 'Villa Fontana, Managua',
      price: 195000,
      priceLabel: '$195,000',
      bedrooms: 2,
      bathrooms: 2,
      area: 112,
      status: 'DISPONIBLE',
      image:
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85',
      imageAlt: 'Sala luminosa de apartamento con ventanales y plantas',
      description:
        'Diseño sereno, espacios bien aprovechados y una ubicación ideal para moverse por Managua.',
    },
    {
      id: 4,
      title: 'Casa Patio del Sol',
      type: 'Casa',
      location: 'Granada, Granada',
      price: 375000,
      priceLabel: '$375,000',
      bedrooms: 3,
      bathrooms: 2,
      area: 240,
      status: 'DISPONIBLE',
      image:
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85',
      imageAlt: 'Casa cálida con patio interior y acabados de madera',
      description:
        'Arquitectura cálida, un patio central lleno de luz y el ritmo tranquilo de una ciudad colonial.',
    },
    {
      id: 5,
      title: 'Lote Bosque Vivo',
      type: 'Terreno',
      location: 'Tola, Rivas',
      price: 145000,
      priceLabel: '$145,000',
      bedrooms: 0,
      bathrooms: 0,
      area: 850,
      status: 'OPORTUNIDAD',
      image:
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=85',
      imageAlt: 'Terreno verde con árboles y montañas al fondo',
      description:
        'Un terreno rodeado de naturaleza, perfecto para crear una casa de descanso a tu manera.',
    },
    {
      id: 6,
      title: 'Loft Nómada',
      type: 'Apartamento',
      location: 'Centro histórico, León',
      price: 228000,
      priceLabel: '$228,000',
      bedrooms: 1,
      bathrooms: 1,
      area: 86,
      status: 'NUEVA',
      image:
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85',
      imageAlt: 'Interior abierto de loft contemporáneo con sala y comedor',
      description:
        'Un espacio con personalidad en el corazón de León, cerca de cafés, galerías y parques.',
    },
  ]);

  protected readonly editingProperty = computed(() =>
    this.properties().find((property) => property.id === this.editingPropertyId()) ?? null,
  );

  constructor() {
    afterNextRender(() => this.loadBrowserData());
  }

  private loadBrowserData(): void {
    if (!this.isBrowser) return;
    try {
      const savedProperties = localStorage.getItem('br-nicaragua-properties');
      if (savedProperties) {
        const customProperties: Property[] = JSON.parse(savedProperties);
        if (Array.isArray(customProperties)) this.properties.update((items) => [...customProperties, ...items]);
      }
      const accounts = this.readAccounts();
      const sessionEmail = localStorage.getItem('br-nicaragua-session');
      const account = accounts.find((item) => item.email === sessionEmail);
      if (account) this.currentUser.set({ name: account.name, email: account.email, avatar: account.avatar });
    } catch {
      this.showNotice('No se pudieron recuperar los datos guardados en este navegador.');
    }
  }

  protected readonly filteredProperties = computed(() => {
    const term = this.query().trim().toLocaleLowerCase();
    return this.properties().filter((property) => {
      const matchesQuery =
        !term ||
        `${property.title} ${property.location} ${property.type}`
          .toLocaleLowerCase()
          .includes(term);
      const matchesType = this.selectedType() === 'Todas' || property.type === this.selectedType();
      const matchesPrice = this.maxPrice() === 0 || property.price <= this.maxPrice();
      const matchesOwner = !this.myPropertiesOnly() || property.ownerEmail === this.currentUser()?.email;
      return matchesQuery && matchesType && matchesPrice && matchesOwner;
    });
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

  protected toggleFavorite(id: number): void {
    this.favorites.update((current) =>
      current.includes(id) ? current.filter((favorite) => favorite !== id) : [...current, id],
    );
  }

  protected openDetails(property: Property): void {
    this.selectedProperty.set(property);
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
    const email = String(data.get('email') ?? '').trim().toLocaleLowerCase();
    const name = String(data.get('name') ?? '').trim();
    const password = String(data.get('password') ?? '');
    this.accountError.set('');

    try {
      const accounts = this.readAccounts();
      const account = accounts.find((item) => item.email === email);

      if (this.accountDialog() === 'register') {
        const confirmation = String(data.get('confirmPassword') ?? '');
        if (password !== confirmation) {
          this.accountError.set('Las contraseñas no coinciden.');
          return;
        }
        if (account?.passwordHash) {
          this.accountError.set('Ya existe una cuenta con este correo. Inicia sesión.');
          return;
        }
        const newAccount: LocalAccount = {
          name,
          email,
          passwordHash: await this.hashPassword(password),
        };
        this.saveAccounts([...accounts.filter((item) => item.email !== email), newAccount]);
        localStorage.setItem('br-nicaragua-session', email);
        this.currentUser.set({ name, email });
        this.showNotice(`¡Cuenta creada, ${name}!`);
      } else {
        const passwordHash = await this.hashPassword(password);
        if (!account || !account.passwordHash || account.passwordHash !== passwordHash) {
          this.accountError.set('Correo o contraseña incorrectos. Revisa tus datos o crea una cuenta.');
          return;
        }
        localStorage.setItem('br-nicaragua-session', email);
        this.currentUser.set({ name: account.name, email: account.email });
        this.showNotice('Sesión iniciada. ¡Qué bueno tenerte de vuelta!');
      }

      const shouldPublish = this.publishAfterAccount();
      this.publishAfterAccount.set(false);
      this.accountDialog.set(null);
      form.reset();
      if (shouldPublish) this.publishDialog.set(true);
    } catch {
      this.accountError.set('No se pudo guardar la cuenta en este navegador.');
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

  private async hashPassword(password: string): Promise<string> {
    const bytes = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
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
    if (existing && existing.ownerEmail !== user.email) {
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
      image: this.propertyPhotos()[0] || this.propertyPhoto() || existing?.image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=85',
      photos: this.propertyPhotos().length ? this.propertyPhotos() : existing?.photos,
      imageAlt: `Propiedad publicada en ${location}`,
      description: String(data.get('description') ?? '').trim() || `Propiedad disponible en ${location}, Nicaragua.`,
      ownerEmail: user.email,
    };
    if (existing) {
      this.properties.update((items) => items.map((item) => item.id === existing.id ? property : item));
      this.showNotice('Tu publicación se actualizó.');
    } else {
      this.properties.update((items) => [property, ...items]);
      this.showNotice('Tu propiedad se publicó correctamente.');
    }
    this.persistProperties();
    this.closePublish();
    form.reset();
    document.getElementById('propiedades')?.scrollIntoView({ behavior: 'smooth' });
  }

  protected openEditProperty(property: Property): void {
    if (property.ownerEmail !== this.currentUser()?.email) return;
    this.editingPropertyId.set(property.id);
    this.propertyPhoto.set('');
    this.propertyPhotos.set([]);
    this.publishDialog.set(true);
  }

  protected closePublish(): void {
    this.publishDialog.set(false);
    this.editingPropertyId.set(null);
    this.propertyPhoto.set('');
    this.propertyPhotos.set([]);
  }

  protected requestDeleteProperty(property: Property): void {
    if (property.ownerEmail === this.currentUser()?.email) this.deletePropertyId.set(property.id);
  }

  protected confirmDeleteProperty(): void {
    const id = this.deletePropertyId();
    const user = this.currentUser();
    const property = this.properties().find((item) => item.id === id);
    if (!property || !user || property.ownerEmail !== user.email) return;
    this.properties.update((items) => items.filter((item) => item.id !== id));
    this.persistProperties();
    this.deletePropertyId.set(null);
    this.showNotice('La publicación se eliminó.');
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
      const accounts = this.readAccounts();
      const account = accounts.find((item) => item.email === current.email);
      if (!account) throw new Error('Account not found');
      const updated = { ...account, name, avatar: this.profilePhoto() || undefined };
      this.saveAccounts(accounts.map((item) => item.email === current.email ? updated : item));
      this.currentUser.set({ name, email: current.email, avatar: updated.avatar });
      this.profileDialog.set(false);
      this.showNotice('Tu perfil se actualizó.');
    } catch {
      this.profileError.set('No se pudo guardar tu perfil.');
    }
  }

  protected logout(): void {
    if (this.isBrowser) localStorage.removeItem('br-nicaragua-session');
    this.currentUser.set(null);
    this.myPropertiesOnly.set(false);
    this.showNotice('Has cerrado sesión.');
  }

  protected async onPhotoSelected(event: Event, target: 'profile' | 'property'): Promise<void> {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    const chosenFiles = Array.from(input.files ?? []).slice(0, target === 'property' ? 5 : 1);
    if (!chosenFiles.length) return;
    if (chosenFiles.some((file) => !file.type.startsWith('image/') || file.size > 8 * 1024 * 1024)) {
      const message = 'Elige hasta 5 imágenes de máximo 8 MB cada una.';
      if (target === 'profile') this.profileError.set(message);
      else this.showNotice(message);
      input.value = '';
      return;
    }
    try {
      const images = await Promise.all(chosenFiles.map(async (file) => {
        const bitmap = await createImageBitmap(file);
        const maxDimension = target === 'profile' ? 480 : 1400;
        const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas unavailable');
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        return canvas.toDataURL('image/jpeg', 0.78);
      }));
      if (target === 'profile') this.profilePhoto.set(images[0]);
      else {
        this.propertyPhotos.set(images);
        this.propertyPhoto.set(images[0]);
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

  private readAccounts(): LocalAccount[] {
    const savedAccounts = localStorage.getItem('br-nicaragua-accounts');
    if (savedAccounts) {
      const parsed: unknown = JSON.parse(savedAccounts);
      return Array.isArray(parsed) ? parsed as LocalAccount[] : [];
    }
    const legacy = localStorage.getItem('br-nicaragua-account');
    if (!legacy) return [];
    const account = JSON.parse(legacy) as Partial<LocalAccount>;
    return account.email && account.name ? [{ name: account.name, email: account.email, passwordHash: account.passwordHash ?? '' }] : [];
  }

  private saveAccounts(accounts: LocalAccount[]): void {
    localStorage.setItem('br-nicaragua-accounts', JSON.stringify(accounts));
  }

  private persistProperties(): void {
    const ownProperties = this.properties().filter((property) => property.ownerEmail);
    localStorage.setItem('br-nicaragua-properties', JSON.stringify(ownProperties));
  }
  protected contactLink(property: Property): string {
    return `mailto:hola@brdevelopers.network?subject=${encodeURIComponent(`Me interesa ${property.title}`)}`;
  }
}
