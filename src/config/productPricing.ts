// Configuration for product pricing systems by category

export type PricingSystem = 
  | 'single' // Single price (no size variations)
  | 'dog_size' // Small, Medium, Large, Extra Large (by dog weight)
  | 'clothing_size'; // XS, S, M, L, XL, XXL (clothing sizes)

export interface CategoryPricingConfig {
  category: string;
  system: PricingSystem;
  sizeOptions?: {
    key: string;
    label: string;
    description?: string;
  }[];
}

// Define pricing systems for each category
export const CATEGORY_PRICING_CONFIG: CategoryPricingConfig[] = [
  {
    category: 'alimentos',
    system: 'single',
    sizeOptions: []
  },
  {
    category: 'juguetes',
    system: 'dog_size',
    sizeOptions: [
      { key: 'small', label: 'Pequeño', description: 'Hasta 10 kg' },
      { key: 'medium', label: 'Mediano', description: '11 - 25 kg' },
      { key: 'large', label: 'Grande', description: '26 - 45 kg' },
      { key: 'extra_large', label: 'Extra Grande', description: 'Más de 45 kg' }
    ]
  },
  {
    category: 'accesorios',
    system: 'clothing_size',
    sizeOptions: [
      { key: 'xs', label: 'XS', description: 'Extra Pequeño' },
      { key: 's', label: 'S', description: 'Pequeño' },
      { key: 'm', label: 'M', description: 'Mediano' },
      { key: 'l', label: 'L', description: 'Grande' },
      { key: 'xl', label: 'XL', description: 'Extra Grande' },
      { key: 'xxl', label: 'XXL', description: 'Extra Extra Grande' }
    ]
  },
  {
    category: 'higiene',
    system: 'dog_size',
    sizeOptions: [
      { key: 'small', label: 'Pequeño', description: 'Hasta 10 kg' },
      { key: 'medium', label: 'Mediano', description: '11 - 25 kg' },
      { key: 'large', label: 'Grande', description: '26 - 45 kg' },
      { key: 'extra_large', label: 'Extra Grande', description: 'Más de 45 kg' }
    ]
  },
  {
    category: 'medicamentos',
    system: 'single',
    sizeOptions: []
  },
  {
    category: 'ropa',
    system: 'clothing_size',
    sizeOptions: [
      { key: 'xs', label: 'XS', description: 'Extra Pequeño' },
      { key: 's', label: 'S', description: 'Pequeño' },
      { key: 'm', label: 'M', description: 'Mediano' },
      { key: 'l', label: 'L', description: 'Grande' },
      { key: 'xl', label: 'XL', description: 'Extra Grande' },
      { key: 'xxl', label: 'XXL', description: 'Extra Extra Grande' }
    ]
  },
  {
    category: 'camas',
    system: 'dog_size',
    sizeOptions: [
      { key: 'small', label: 'Pequeño', description: 'Hasta 10 kg' },
      { key: 'medium', label: 'Mediano', description: '11 - 25 kg' },
      { key: 'large', label: 'Grande', description: '26 - 45 kg' },
      { key: 'extra_large', label: 'Extra Grande', description: 'Más de 45 kg' }
    ]
  },
  {
    category: 'equipamiento',
    system: 'dog_size',
    sizeOptions: [
      { key: 'small', label: 'Pequeño', description: 'Hasta 10 kg' },
      { key: 'medium', label: 'Mediano', description: '11 - 25 kg' },
      { key: 'large', label: 'Grande', description: '26 - 45 kg' },
      { key: 'extra_large', label: 'Extra Grande', description: 'Más de 45 kg' }
    ]
  },
  {
    category: 'transporte',
    system: 'single',
    sizeOptions: []
  },
  {
    category: 'otro',
    system: 'single',
    sizeOptions: []
  }
];

// Helper function to get pricing config for a category
export const getPricingConfig = (category: string): CategoryPricingConfig => {
  const config = CATEGORY_PRICING_CONFIG.find(c => c.category === category);
  return config || CATEGORY_PRICING_CONFIG.find(c => c.category === 'otro')!;
};

// Helper function to check if category uses size-based pricing
export const hasSizePricing = (category: string): boolean => {
  const config = getPricingConfig(category);
  return config.system !== 'single';
};

