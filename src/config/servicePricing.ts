// Configuration for service pricing systems by category

export type PricingSystem = 
  | 'single' // Single price (no size variations)
  | 'dog_size'; // Small, Medium, Large, Extra Large (by dog weight)

export interface CategoryPricingConfig {
  category: string;
  system: PricingSystem;
  sizeOptions?: {
    key: string;
    label: string;
    description?: string;
  }[];
}

// Define pricing systems for each service category
// All service categories use dog_size pricing (4 sizes: small, medium, large, extra_large)
export const SERVICE_CATEGORY_PRICING_CONFIG: CategoryPricingConfig[] = [
  {
    category: 'veterinaria',
    system: 'dog_size',
    sizeOptions: [
      { key: 'small', label: 'Pequeño', description: 'Hasta 10 kg' },
      { key: 'medium', label: 'Mediano', description: '11 - 25 kg' },
      { key: 'large', label: 'Grande', description: '26 - 45 kg' },
      { key: 'extra_large', label: 'Extra Grande', description: 'Más de 45 kg' }
    ]
  },
  {
    category: 'grooming',
    system: 'dog_size',
    sizeOptions: [
      { key: 'small', label: 'Pequeño', description: 'Hasta 10 kg' },
      { key: 'medium', label: 'Mediano', description: '11 - 25 kg' },
      { key: 'large', label: 'Grande', description: '26 - 45 kg' },
      { key: 'extra_large', label: 'Extra Grande', description: 'Más de 45 kg' }
    ]
  },
  {
    category: 'entrenamiento',
    system: 'dog_size',
    sizeOptions: [
      { key: 'small', label: 'Pequeño', description: 'Hasta 10 kg' },
      { key: 'medium', label: 'Mediano', description: '11 - 25 kg' },
      { key: 'large', label: 'Grande', description: '26 - 45 kg' },
      { key: 'extra_large', label: 'Extra Grande', description: 'Más de 45 kg' }
    ]
  },
  {
    category: 'alojamiento',
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
    system: 'dog_size',
    sizeOptions: [
      { key: 'small', label: 'Pequeño', description: 'Hasta 10 kg' },
      { key: 'medium', label: 'Mediano', description: '11 - 25 kg' },
      { key: 'large', label: 'Grande', description: '26 - 45 kg' },
      { key: 'extra_large', label: 'Extra Grande', description: 'Más de 45 kg' }
    ]
  },
  {
    category: 'fisioterapia',
    system: 'dog_size',
    sizeOptions: [
      { key: 'small', label: 'Pequeño', description: 'Hasta 10 kg' },
      { key: 'medium', label: 'Mediano', description: '11 - 25 kg' },
      { key: 'large', label: 'Grande', description: '26 - 45 kg' },
      { key: 'extra_large', label: 'Extra Grande', description: 'Más de 45 kg' }
    ]
  },
  {
    category: 'nutricion',
    system: 'dog_size',
    sizeOptions: [
      { key: 'small', label: 'Pequeño', description: 'Hasta 10 kg' },
      { key: 'medium', label: 'Mediano', description: '11 - 25 kg' },
      { key: 'large', label: 'Grande', description: '26 - 45 kg' },
      { key: 'extra_large', label: 'Extra Grande', description: 'Más de 45 kg' }
    ]
  },
  {
    category: 'otro',
    system: 'dog_size',
    sizeOptions: [
      { key: 'small', label: 'Pequeño', description: 'Hasta 10 kg' },
      { key: 'medium', label: 'Mediano', description: '11 - 25 kg' },
      { key: 'large', label: 'Grande', description: '26 - 45 kg' },
      { key: 'extra_large', label: 'Extra Grande', description: 'Más de 45 kg' }
    ]
  }
];

// Helper function to get pricing config for a service category
export const getServicePricingConfig = (category: string): CategoryPricingConfig => {
  const config = SERVICE_CATEGORY_PRICING_CONFIG.find(c => c.category === category);
  return config || SERVICE_CATEGORY_PRICING_CONFIG.find(c => c.category === 'otro')!;
};

// Helper function to check if service category uses size-based pricing
export const hasServiceSizePricing = (category: string): boolean => {
  const config = getServicePricingConfig(category);
  return config.system !== 'single';
};

