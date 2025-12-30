import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, DollarSign, Info, Image as ImageIcon, Tag, Scale, Ruler } from 'lucide-react';
import { ProviderProduct } from '@/hooks/useProvider';
import { ProductMultipleImagesUpload } from './ProductMultipleImagesUpload';
import { getPricingConfig, hasSizePricing, type PricingSystem } from '@/config/productPricing';

interface ProviderProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<ProviderProduct, 'id' | 'provider_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  product?: ProviderProduct | null;
  isEditing?: boolean;
}

const PRODUCT_CATEGORIES = [
  { value: 'alimentos', label: 'Alimentos', icon: '🍖' },
  { value: 'juguetes', label: 'Juguetes', icon: '🎾' },
  { value: 'accesorios', label: 'Accesorios', icon: '🦮' },
  { value: 'higiene', label: 'Higiene', icon: '🧴' },
  { value: 'medicamentos', label: 'Medicamentos', icon: '💊' },
  { value: 'ropa', label: 'Ropa', icon: '👕' },
  { value: 'camas', label: 'Camas y Descanso', icon: '🛏️' },
  { value: 'transporte', label: 'Transporte', icon: '🚗' },
  { value: 'otro', label: 'Otro', icon: '🔧' }
];

const ProviderProductModal: React.FC<ProviderProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  isEditing = false
}) => {
  
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    product_name: '',
    product_category: '',
    description: '',
    detailed_description: '',
    price: '', // Precio general (para retrocompatibilidad)
    price_small: '', // Precio para perros pequeños
    price_medium: '', // Precio para perros medianos
    price_large: '', // Precio para perros grandes
    price_extra_large: '', // Precio para perros extra grandes
    price_xs: '', // Precio talla XS (ropa)
    price_s: '', // Precio talla S (ropa)
    price_m: '', // Precio talla M (ropa)
    price_l: '', // Precio talla L (ropa)
    price_xl: '', // Precio talla XL (ropa)
    price_xxl: '', // Precio talla XXL (ropa)
    currency: 'GTQ',
    stock_quantity: '',
    min_stock_alert: '5',
    is_active: true,
    product_image_url: '',
    secondary_images: [] as string[],
    brand: '',
    weight_kg: '',
    dimensions_cm: '',
    tags: [] as string[]
  });

  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (product && isEditing) {
      setFormData({
        product_name: product.product_name,
        product_category: product.product_category,
        description: product.description || '',
        detailed_description: product.detailed_description || '',
        price: product.price?.toString() || '',
        price_small: (product as any).price_small?.toString() || '',
        price_medium: (product as any).price_medium?.toString() || '',
        price_large: (product as any).price_large?.toString() || '',
        price_extra_large: (product as any).price_extra_large?.toString() || '',
        price_xs: (product as any).price_xs?.toString() || '',
        price_s: (product as any).price_s?.toString() || '',
        price_m: (product as any).price_m?.toString() || '',
        price_l: (product as any).price_l?.toString() || '',
        price_xl: (product as any).price_xl?.toString() || '',
        price_xxl: (product as any).price_xxl?.toString() || '',
        currency: product.currency || 'GTQ',
        stock_quantity: product.stock_quantity.toString(),
        min_stock_alert: product.min_stock_alert?.toString() || '5',
        is_active: product.is_active,
        product_image_url: product.product_image_url || '',
        secondary_images: (product as any).secondary_images || [],
        brand: product.brand || '',
        weight_kg: product.weight_kg?.toString() || '',
        dimensions_cm: product.dimensions_cm || '',
        tags: product.tags || []
      });
    } else {
      setFormData({
        product_name: '',
        product_category: '',
        description: '',
        detailed_description: '',
        price: '',
        price_small: '',
        price_medium: '',
        price_large: '',
        price_extra_large: '',
        price_xs: '',
        price_s: '',
        price_m: '',
        price_l: '',
        price_xl: '',
        price_xxl: '',
        currency: 'GTQ',
        stock_quantity: '',
        min_stock_alert: '5',
        is_active: true,
        product_image_url: '',
        secondary_images: [],
        brand: '',
        weight_kg: '',
        dimensions_cm: '',
        tags: []
      });
    }
  }, [product, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔄 Form submission started');
    setLoading(true);

    try {
      // Validate required fields
      console.log('🔍 Validating form data:', formData);
      if (!formData.product_name.trim()) {
        throw new Error('El nombre del producto es obligatorio');
      }
      if (!formData.product_category) {
        throw new Error('La categoría del producto es obligatoria');
      }
      // Validar que al menos un precio esté definido
      // Verificar precios por tamaño independientemente de la configuración de categoría
      // Esto permite flexibilidad para productos que tienen precios por tamaño aunque su categoría esté configurada como "single"
      const hasGeneralPrice = formData.price && parseFloat(formData.price) > 0;
      
      // Verificar precios por tamaño de perro
      const hasDogSizePrices = !!(
        (formData.price_small && parseFloat(formData.price_small) > 0) ||
        (formData.price_medium && parseFloat(formData.price_medium) > 0) ||
        (formData.price_large && parseFloat(formData.price_large) > 0) ||
        (formData.price_extra_large && parseFloat(formData.price_extra_large) > 0)
      );
      
      // Verificar precios por talla de ropa
      const hasClothingSizePrices = !!(
        (formData.price_xs && parseFloat(formData.price_xs) > 0) ||
        (formData.price_s && parseFloat(formData.price_s) > 0) ||
        (formData.price_m && parseFloat(formData.price_m) > 0) ||
        (formData.price_l && parseFloat(formData.price_l) > 0) ||
        (formData.price_xl && parseFloat(formData.price_xl) > 0) ||
        (formData.price_xxl && parseFloat(formData.price_xxl) > 0)
      );
      
      const hasAnyPrice = hasGeneralPrice || hasDogSizePrices || hasClothingSizePrices;
      
      if (!hasAnyPrice) {
        throw new Error('Debes definir al menos un precio para el producto (precio general o precio por tamaño/talla)');
      }
      if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
        throw new Error('La cantidad en stock debe ser 0 o mayor');
      }

      // Save the product
      const productData = {
        product_name: formData.product_name,
        product_category: formData.product_category,
        description: formData.description,
        detailed_description: formData.detailed_description,
        price: parseFloat(formData.price) || 0, // Precio general (para retrocompatibilidad)
        price_small: formData.price_small ? parseFloat(formData.price_small) : null,
        price_medium: formData.price_medium ? parseFloat(formData.price_medium) : null,
        price_large: formData.price_large ? parseFloat(formData.price_large) : null,
        price_extra_large: formData.price_extra_large ? parseFloat(formData.price_extra_large) : null,
        price_xs: formData.price_xs ? parseFloat(formData.price_xs) : null,
        price_s: formData.price_s ? parseFloat(formData.price_s) : null,
        price_m: formData.price_m ? parseFloat(formData.price_m) : null,
        price_l: formData.price_l ? parseFloat(formData.price_l) : null,
        price_xl: formData.price_xl ? parseFloat(formData.price_xl) : null,
        price_xxl: formData.price_xxl ? parseFloat(formData.price_xxl) : null,
        currency: formData.currency,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock_alert: parseInt(formData.min_stock_alert) || 5,
        is_active: formData.is_active,
        product_image_url: formData.product_image_url,
        secondary_images: formData.secondary_images,
        brand: formData.brand,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
        dimensions_cm: formData.dimensions_cm,
        tags: formData.tags
      };
      
      await onSave(productData);
      
      // Success - modal will close and parent will show success toast
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto" aria-describedby="product-modal-description">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </DialogTitle>

        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6" id="product-modal-description">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Información Básica</TabsTrigger>
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="inventory">Inventario</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-name">Nombre del Producto *</Label>
                  <Input
                    id="product-name"
                    value={formData.product_name}
                    onChange={(e) => handleInputChange('product_name', e.target.value)}
                    placeholder="Ej: Collar Antipulgas Premium"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="product-category">Categoría *</Label>
                  <Select value={formData.product_category} onValueChange={(value) => handleInputChange('product_category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      {PRODUCT_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <span className="mr-2">{category.icon}</span>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="product-description">Descripción Corta *</Label>
                <Textarea
                  id="product-description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descripción breve del producto..."
                  rows={2}
                  required
                />
              </div>

              {/* Precio General */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Precio General (Opcional)</Label>
                <p className="text-sm text-gray-600 mb-3">Usa este campo si el producto no requiere diferenciación por tamaño de perro.</p>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {formData.currency === 'GTQ' ? 'Q.' : '$'}
                  </span>
                  <Input
                    id="price-general"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Precios por tamaño de perro */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Precios por Tamaño de Perro (Opcional)</Label>
                <p className="text-sm text-gray-600 mb-3">O establece el precio para cada tamaño según el peso del perro. Si no aplica, déjalo vacío.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="price-small">
                      Pequeño (Q.)
                      <span className="block text-xs font-normal text-gray-500 mt-1">Hasta 10 kg</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Q.</span>
                      <Input
                        id="price-small"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price_small}
                        onChange={(e) => handleInputChange('price_small', e.target.value)}
                        placeholder="0.00"
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="price-medium">
                      Mediano (Q.)
                      <span className="block text-xs font-normal text-gray-500 mt-1">11 - 25 kg</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Q.</span>
                      <Input
                        id="price-medium"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price_medium}
                        onChange={(e) => handleInputChange('price_medium', e.target.value)}
                        placeholder="0.00"
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="price-large">
                      Grande (Q.)
                      <span className="block text-xs font-normal text-gray-500 mt-1">26 - 45 kg</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Q.</span>
                      <Input
                        id="price-large"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price_large}
                        onChange={(e) => handleInputChange('price_large', e.target.value)}
                        placeholder="0.00"
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="price-extra-large">
                      Extra Grande (Q.)
                      <span className="block text-xs font-normal text-gray-500 mt-1">Más de 45 kg</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Q.</span>
                      <Input
                        id="price-extra-large"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price_extra_large}
                        onChange={(e) => handleInputChange('price_extra_large', e.target.value)}
                        placeholder="0.00"
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-brand">Marca</Label>
                  <Input
                    id="product-brand"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="Ej: Royal Canin"
                  />
                </div>

                <div>
                  <Label htmlFor="product-currency">Moneda</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="GTQ">GTQ - Quetzales</SelectItem>
                      <SelectItem value="USD">USD - Dólares</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="product-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="product-active">Producto Activo</Label>
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <div>
                <Label htmlFor="product-detailed-description">Descripción Detallada</Label>
                <Textarea
                  id="product-detailed-description"
                  value={formData.detailed_description}
                  onChange={(e) => handleInputChange('detailed_description', e.target.value)}
                  placeholder="Describe el producto en detalle, incluyendo características, beneficios, ingredientes, etc..."
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Esta información será visible para los clientes al ver el producto
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product-weight">Peso (kg)</Label>
                  <div className="relative">
                    <Input
                      id="product-weight"
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.weight_kg}
                      onChange={(e) => handleInputChange('weight_kg', e.target.value)}
                      placeholder="0.500"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">kg</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="product-dimensions">Dimensiones (cm)</Label>
                  <Input
                    id="product-dimensions"
                    value={formData.dimensions_cm}
                    onChange={(e) => handleInputChange('dimensions_cm', e.target.value)}
                    placeholder="Ej: 20x15x10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="product-images">Imágenes del Producto</Label>
                <ProductMultipleImagesUpload
                  mainImageUrl={formData.product_image_url}
                  secondaryImages={formData.secondary_images}
                  onMainImageUpload={(url) => handleInputChange('product_image_url', url || '')}
                  onSecondaryImagesChange={(urls) => handleInputChange('secondary_images', urls)}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sube una imagen principal y hasta 5 imágenes secundarias del producto
                </p>
              </div>

              <div>
                <Label htmlFor="product-tags">Etiquetas</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="product-tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Agregar etiqueta y presionar Enter"
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      Agregar
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Etiquetas para ayudar a los clientes a encontrar el producto
                </p>
              </div>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <Info className="w-5 h-5" />
                  <span className="font-medium">Gestión de Inventario</span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  Controla el stock disponible y configura alertas para mantener un inventario saludable.
                </p>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Control de Stock
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="product-stock">Cantidad en Stock *</Label>
                      <Input
                        id="product-stock"
                        type="number"
                        min="0"
                        value={formData.stock_quantity}
                        onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                        placeholder="0"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Cantidad disponible para la venta
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="product-min-stock">Alerta de Stock Mínimo</Label>
                      <Input
                        id="product-min-stock"
                        type="number"
                        min="0"
                        value={formData.min_stock_alert}
                        onChange={(e) => handleInputChange('min_stock_alert', e.target.value)}
                        placeholder="5"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Recibirás alertas cuando el stock baje de este número
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <Info className="w-4 h-4" />
                      <span className="text-sm font-medium">Estado del Inventario</span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      {parseInt(formData.stock_quantity) === 0 ? (
                        <p className="text-red-600 font-medium">❌ Sin stock - Producto no disponible</p>
                      ) : parseInt(formData.stock_quantity) <= parseInt(formData.min_stock_alert) ? (
                        <p className="text-orange-600 font-medium">⚠️ Stock bajo - Considera reabastecer</p>
                      ) : (
                        <p className="text-green-600 font-medium">✅ Stock saludable</p>
                      )}
                      <p className="text-gray-600">
                        Stock actual: <span className="font-medium">{formData.stock_quantity || 0}</span> unidades
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                isEditing ? 'Actualizar Producto' : 'Crear Producto'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderProductModal;
