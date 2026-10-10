export interface Property {
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
