import type { Property } from '../models/property.model';

export const SAMPLE_PROPERTIES: Property[] = [
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
];
