export interface Property {
  id: number | string;
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
  ownerUid?: string;
  ownerEmail?: string;
  imageAlt: string;
  description: string;
}
