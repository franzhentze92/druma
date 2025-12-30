import React, { useState, useEffect } from 'react';
import { ShoppingBag, Scissors, Home, Moon, Stethoscope, GraduationCap, Star, MapPin, Package, Building2, Clock, Coins, Search, Filter, X, Image as ImageIcon } from 'lucide-react';
import PageHeader from './PageHeader';
import { useNavigation } from '@/contexts/NavigationContext';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import CartIcon from './CartIcon';
import CartModal from './CartModal';
import Checkout from './Checkout';
import ServiceBookingModal from './ServiceBookingModal';
import { toast } from 'sonner';
import { getPricingConfig, hasSizePricing } from '@/config/productPricing';

interface ProviderService {
  id: string;
  service_name: string;
  service_category: string;
  description: string;
  detailed_description?: string;
  price: number; // Precio general (para retrocompatibilidad)
  price_small?: number | null;
  price_medium?: number | null;
  price_large?: number | null;
  price_extra_large?: number | null;
  currency: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  provider_id: string;
  service_image_url?: string;
  average_rating?: number;
  review_count?: number;
  providers: {
    user_id: string;
    business_name: string;
    business_type: string;
    address: string;
    phone: string;
    profile_picture_url?: string;
    latitude?: number;
    longitude?: number;
    city_id?: number;
    has_delivery?: boolean;
    has_pickup?: boolean;
    delivery_fee?: number;
    guatemala_cities: {
      city_name: string;
    };
  };
}

interface ProviderProduct {
  id: string;
  product_name: string;
  product_category: string;
  description: string;
  brand?: string;
  price: number;
  currency: string;
  stock_quantity: number;
  weight_kg?: number;
  is_active: boolean;
  created_at: string;
  provider_id: string;
  product_image_url?: string;
  secondary_images?: string[];
  price_small?: number | null;
  price_medium?: number | null;
  price_large?: number | null;
  price_extra_large?: number | null;
  original_price?: number;
  discount_percentage?: number;
  has_delivery?: boolean;
  has_pickup?: boolean;
  delivery_fee?: number;
  average_rating?: number;
  review_count?: number;
  providers: {
    user_id: string;
    business_name: string;
    business_type: string;
    address: string;
    phone: string;
    profile_picture_url?: string;
    latitude?: number;
    longitude?: number;
    city_id?: number;
    has_delivery?: boolean;
    has_pickup?: boolean;
    delivery_fee?: number;
    guatemala_cities: {
      city_name: string;
    };
  };
}

const Marketplace: React.FC = () => {
  const { isMobileMenuOpen, toggleMobileMenu } = useNavigation();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [services, setServices] = useState<ProviderService[]>([]);
  const [products, setProducts] = useState<ProviderProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Initialize activeTab based on URL path
  const getInitialTab = () => {
    if (location.pathname === '/marketplace/products') return 'products';
    if (location.pathname === '/marketplace/services') return 'services';
    return 'services'; // default
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Update activeTab when URL changes
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedProviderType, setSelectedProviderType] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedRadius, setSelectedRadius] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Get unique locations and provider types for filters
  const locations = ['all', ...Array.from(new Set([
    ...services.map(s => s.providers.guatemala_cities.city_name).filter(Boolean),
    ...products.map(p => p.providers.guatemala_cities.city_name).filter(Boolean)
  ]))];

  const providerTypes = ['all', ...Array.from(new Set([
    ...services.map(s => s.providers.business_type).filter(Boolean),
    ...products.map(p => p.providers.business_type).filter(Boolean)
  ]))];

  // Get unique providers and cities for filters
  const providers = ['all', ...Array.from(new Set([
    ...services.map(s => s.providers.business_name).filter(Boolean),
    ...products.map(p => p.providers.business_name).filter(Boolean)
  ]))];

  const cities = ['all', ...Array.from(new Set([
    ...services.map(s => s.providers.guatemala_cities.city_name).filter(Boolean),
    ...products.map(p => p.providers.guatemala_cities.city_name).filter(Boolean)
  ]))];

  // Rating and radius options
  const ratingOptions = [
    { value: 'all', label: 'Todas las calificaciones' },
    { value: '4.5', label: '4.5+ estrellas' },
    { value: '4.0', label: '4.0+ estrellas' },
    { value: '3.5', label: '3.5+ estrellas' },
    { value: '3.0', label: '3.0+ estrellas' }
  ];

  const radiusOptions = [
    { value: 'all', label: 'Cualquier distancia' },
    { value: '1', label: '1 km o menos' },
    { value: '5', label: '5 km o menos' },
    { value: '10', label: '10 km o menos' },
    { value: '25', label: '25 km o menos' },
    { value: '50', label: '50 km o menos' }
  ];

  // Service categories
  const serviceCategories = [
    { id: 'all', label: 'Todo', icon: ShoppingBag, color: 'from-purple-500 to-pink-500' },
    { id: 'veterinaria', label: 'Veterinaria', icon: Stethoscope, color: 'from-red-500 to-pink-500' },
    { id: 'grooming', label: 'Grooming', icon: Scissors, color: 'from-pink-500 to-rose-500' },
    { id: 'entrenamiento', label: 'Entrenamiento', icon: GraduationCap, color: 'from-green-500 to-emerald-500' },
    { id: 'alojamiento', label: 'Alojamiento', icon: Home, color: 'from-blue-500 to-cyan-500' },
    { id: 'transporte', label: 'Transporte', icon: Moon, color: 'from-purple-500 to-indigo-500' },
    { id: 'fisioterapia', label: 'Fisioterapia', icon: Building2, color: 'from-orange-500 to-red-500' },
    { id: 'nutricion', label: 'Nutrición', icon: Package, color: 'from-yellow-500 to-orange-500' },
  ];

  // Product categories
  const productCategories = [
    { id: 'all', label: 'Todo', icon: ShoppingBag, color: 'from-purple-500 to-pink-500' },
    { id: 'alimentos', label: 'Alimentos', icon: Package, color: 'from-green-500 to-emerald-500' },
    { id: 'juguetes', label: 'Juguetes', icon: Star, color: 'from-yellow-500 to-orange-500' },
    { id: 'accesorios', label: 'Accesorios', icon: ShoppingBag, color: 'from-blue-500 to-cyan-500' },
    { id: 'higiene', label: 'Higiene', icon: Scissors, color: 'from-pink-500 to-rose-500' },
    { id: 'medicamentos', label: 'Medicamentos', icon: Stethoscope, color: 'from-red-500 to-pink-500' },
    { id: 'ropa', label: 'Ropa', icon: Home, color: 'from-purple-500 to-indigo-500' },
    { id: 'equipamiento', label: 'Equipamiento', icon: Building2, color: 'from-orange-500 to-red-500' },
  ];

  // Modal states
  const [selectedItem, setSelectedItem] = useState<ProviderService | ProviderProduct | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large' | 'extra_large' | 'general' | null>(null);

  // User location and wishlist states
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());

  // Cart states
  const { state: cartState, addItem } = useCart();
  const [showCartModal, setShowCartModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showServiceBookingModal, setShowServiceBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ProviderService | null>(null);
  const [productQuantity, setProductQuantity] = useState<{ [key: string]: number }>({});

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Error getting location:', error);
        }
      );
    }
  }, []);

  // Fetch user's wishlist
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: wishlistData } = await supabase
            .from('user_wishlist')
            .select('product_id')
            .eq('user_id', user.id);
          
          if (wishlistData) {
            const wishlistIds = new Set(wishlistData.map(item => item.product_id));
            setWishlistItems(wishlistIds);
          }
        }
      } catch (error) {
        console.log('Error fetching wishlist:', error);
      }
    };

    fetchWishlist();
  }, [supabase]);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Format distance
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  // Handle wishlist toggle
  const toggleWishlist = async (productId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (wishlistItems.has(productId)) {
        // Remove from wishlist
        await supabase
          .from('user_wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        
        setWishlistItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      } else {
        // Add to wishlist
        await supabase
          .from('user_wishlist')
          .insert({
            user_id: user.id,
            product_id: productId
          });
        
        setWishlistItems(prev => {
          const newSet = new Set(prev);
          newSet.add(productId);
          return newSet;
        });
      }
    } catch (error) {
      console.log('Error toggling wishlist:', error);
    }
  };

  // Handle add to cart
  const handleAddToCart = (product: ProviderProduct, quantity?: number) => {
    // Validate size is selected if product has size-based pricing
    const pricingConfig = getPricingConfig(product.product_category);
    if (pricingConfig.system !== 'single' && !selectedSize) {
      toast.error("⚠️ Selecciona un tamaño. Por favor selecciona un tamaño antes de agregar al carrito");
      return;
    }

    // Validate provider_id exists
    if (!product.provider_id) {
      toast.error("❌ Error: Producto sin proveedor válido");
      return;
    }

    // Use the provider's user_id (auth.users.id) instead of provider_id (providers.id)
    const providerUserId = product.providers?.user_id;
    if (!providerUserId) {
      toast.error("❌ Error: No se pudo identificar el usuario del proveedor");
      return;
    }

    // Get quantity from state or use provided quantity or default to 1
    const qty = quantity || productQuantity[product.id] || 1;
    
    // Validate quantity doesn't exceed stock
    if (qty > product.stock_quantity) {
      toast.error(`❌ Error: Solo hay ${product.stock_quantity} unidades disponibles`);
      return;
    }

    // Calculate price based on selected size
    let finalPrice = product.price;
    let sizeLabel = '';
    
    if (selectedSize && selectedSize !== 'general') {
      const sizePrice = (product as any)[`price_${selectedSize}`];
      if (sizePrice) {
        finalPrice = sizePrice;
        // Get size label from config
        const sizeOption = pricingConfig.sizeOptions?.find(s => s.key === selectedSize);
        if (sizeOption) {
          sizeLabel = ` - ${sizeOption.label}`;
        }
      }
    }

    // Create unique ID that includes size to allow multiple sizes of same product in cart
    const itemId = selectedSize && selectedSize !== 'general' 
      ? `${product.id}_${selectedSize}` 
      : product.id;

    addItem({
      id: itemId,
      type: 'product',
      name: product.product_name + sizeLabel,
      price: finalPrice,
      currency: product.currency,
      provider_id: providerUserId, // Use user_id from providers table
      provider_name: product.providers.business_name,
      image_url: product.product_image_url,
      description: product.description,
      delivery_fee: product.providers.delivery_fee,
      has_delivery: product.providers.has_delivery,
      has_pickup: product.providers.has_pickup,
      product_size: selectedSize || 'general',
      product_id: product.id, // Store original product ID (without size suffix)
      product_category: product.product_category, // Store product category for food division logic
    }, qty);

    const sizeText = sizeLabel ? ` (${sizeLabel.replace(' - ', '')})` : '';
    toast.success(`✅ Producto Agregado: ${product.product_name}${sizeText} ha sido agregado al carrito`);
  };

  // Handle service booking (open booking modal instead of adding to cart)
  const handleServiceBooking = (service: ProviderService) => {
    setSelectedService(service);
    setShowServiceBookingModal(true);
  };

  // Handle add service to cart (for services that don't need booking)
  const handleAddServiceToCart = (service: ProviderService) => {
    // Debug: Log the service data
    console.log('Adding service to cart:', {
      id: service.id,
      provider_id: service.provider_id,
      provider_user_id: service.providers?.user_id,
      name: service.service_name,
      price: service.price
    });

    // Validate provider_id exists
    if (!service.provider_id) {
      toast.error("❌ Error: Servicio sin proveedor válido");
      return;
    }

    // Use the provider's user_id (auth.users.id) instead of provider_id (providers.id)
    const providerUserId = service.providers?.user_id;
    if (!providerUserId) {
      toast.error("❌ Error: No se pudo identificar el usuario del proveedor");
      return;
    }

    addItem({
      id: service.id,
      type: 'service',
      name: service.service_name,
      price: service.price,
      currency: service.currency,
      provider_id: providerUserId, // Use user_id from providers table
      provider_name: service.providers.business_name,
      image_url: service.service_image_url || undefined,
      description: service.description,
      delivery_fee: service.providers.delivery_fee,
      has_delivery: service.providers.has_delivery,
      has_pickup: service.providers.has_pickup,
    });

    toast.success(`✅ Servicio Agregado: ${service.service_name} ha sido agregado al carrito`);
  };

  // Handle cart modal
  const handleOpenCart = () => {
    setShowCartModal(true);
  };

  const handleCloseCart = () => {
    setShowCartModal(false);
  };

  // Handle checkout
  const handleCheckout = () => {
    // Debug: Log cart state before checkout
    console.log('Cart state before checkout:', {
      items: cartState.items,
      total: cartState.total,
      delivery_fee: cartState.delivery_fee,
      grand_total: cartState.grand_total
    });
    
    setShowCartModal(false);
    setShowCheckout(true);
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
  };

  const handleCheckoutSuccess = () => {
    setShowCheckout(false);
    toast.success("🎉 ¡Compra Completada! Tu orden ha sido procesada exitosamente. Recibirás una confirmación por correo electrónico.");
  };

  // Fetch real services and products from database
  useEffect(() => {
    const fetchMarketplaceData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch active services with provider information (no reviews for now)
        const { data: servicesData, error: servicesError } = await supabase
          .from('provider_services')
          .select(`
            *,
            providers (
              user_id,
              business_name,
              business_type,
              address,
              phone,
              profile_picture_url,
              latitude,
              longitude,
              city_id,
              has_delivery,
              has_pickup,
              delivery_fee,
              guatemala_cities!inner (
                city_name
              )
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (servicesError) throw servicesError;

        // Set default ratings for services (no reviews for now)
        const servicesWithRatings = (servicesData || []).map(service => ({
          ...service,
          average_rating: 0,
          review_count: 0
        }));

        // Fetch active products with provider information and reviews
        const { data: productsData, error: productsError } = await supabase
          .from('provider_products')
          .select(`
            *,
            providers (
              user_id,
              business_name,
              business_type,
              address,
              phone,
              profile_picture_url,
              latitude,
              longitude,
              city_id,
              has_delivery,
              has_pickup,
              delivery_fee,
              guatemala_cities!inner (
                city_name
              )
            ),
            product_reviews (
              rating
            )
          `)
          .eq('is_active', true)
          .gt('stock_quantity', 0)
          .order('created_at', { ascending: false });

        if (productsError) {
          console.error('Products query error:', productsError);
          // If product reviews table has issues, try without reviews
          const { data: productsDataFallback, error: productsErrorFallback } = await supabase
            .from('provider_products')
            .select(`
              *,
              providers (
                user_id,
                business_name,
                business_type,
                address,
                phone,
                profile_picture_url,
                latitude,
                longitude,
                city_id,
                has_delivery,
                has_pickup,
                delivery_fee,
                guatemala_cities!inner (
                  city_name
                )
              )
            `)
            .eq('is_active', true)
            .gt('stock_quantity', 0)
            .order('created_at', { ascending: false });

          if (productsErrorFallback) throw productsErrorFallback;
          
          // Set products without reviews
          const productsWithoutReviews = (productsDataFallback || []).map(product => ({
            ...product,
            average_rating: 0,
            review_count: 0
          }));
          
          setServices(servicesWithRatings);
          setProducts(productsWithoutReviews);
          return;
        }

        // Debug: Log the fetched products data
        console.log('=== MARKETPLACE DEBUG ===');
        console.log('Total products fetched:', productsData?.length || 0);
        console.log('Total services fetched:', servicesData?.length || 0);
        console.log('Products data:', productsData?.map(p => ({
          id: p.id,
          provider_id: p.provider_id,
          name: p.product_name,
          provider_name: p.providers?.business_name
        })));
        console.log('Services data:', servicesData?.map(s => ({
          id: s.id,
          provider_id: s.provider_id,
          name: s.service_name,
          provider_name: s.providers?.business_name
        })));
        console.log('=== END MARKETPLACE DEBUG ===');

        // Calculate average ratings for products
        const productsWithRatings = (productsData || []).map(product => {
          const reviews = product.product_reviews || [];
          const averageRating = reviews.length > 0 
            ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
            : 0;
          
          return {
            ...product,
            average_rating: averageRating,
            review_count: reviews.length
          };
        });

        setServices(servicesWithRatings);
        setProducts(productsWithRatings);
      } catch (err) {
        console.error('Error fetching marketplace data:', err);
        console.error('Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          code: (err as any)?.code,
          details: (err as any)?.details,
          hint: (err as any)?.hint
        });
        setError(err instanceof Error ? err.message : 'Error al cargar el marketplace');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketplaceData();
  }, [supabase]);

  // Filter services by category and other filters
  const filteredServices = services.filter(service => {
    const matchesCategory = activeCategory === 'all' || service.service_category === activeCategory;
    const matchesSearch = searchTerm === '' || 
      service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.providers.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = service.price >= priceRange[0] && service.price <= priceRange[1];
    const matchesProviderType = selectedProviderType === 'all' || service.providers.business_type === selectedProviderType;
    const matchesProvider = selectedProvider === 'all' || service.providers.business_name === selectedProvider;
    const matchesCity = selectedCity === 'all' || service.providers.guatemala_cities.city_name === selectedCity;
    const matchesRating = selectedRating === 'all' || (service.average_rating && service.average_rating >= parseFloat(selectedRating));
    const matchesRadius = selectedRadius === 'all' || !userLocation || !service.providers.latitude || !service.providers.longitude || 
      calculateDistance(userLocation.lat, userLocation.lng, service.providers.latitude, service.providers.longitude) <= parseFloat(selectedRadius);
    
    return matchesCategory && matchesSearch && matchesPrice && matchesProviderType && 
           matchesProvider && matchesCity && matchesRating && matchesRadius;
  });

  // Filter products by category and other filters
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.product_category === activeCategory;
    const matchesSearch = searchTerm === '' || 
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.providers.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    const matchesProviderType = selectedProviderType === 'all' || product.providers.business_type === selectedProviderType;
    const matchesProvider = selectedProvider === 'all' || product.providers.business_name === selectedProvider;
    const matchesCity = selectedCity === 'all' || product.providers.guatemala_cities.city_name === selectedCity;
    const matchesRating = selectedRating === 'all' || (product.average_rating && product.average_rating >= parseFloat(selectedRating));
    const matchesRadius = selectedRadius === 'all' || !userLocation || !product.providers.latitude || !product.providers.longitude || 
      calculateDistance(userLocation.lat, userLocation.lng, product.providers.latitude, product.providers.longitude) <= parseFloat(selectedRadius);
    
    return matchesCategory && matchesSearch && matchesPrice && matchesProviderType && 
           matchesProvider && matchesCity && matchesRating && matchesRadius;
  });

  // Sort filtered results
  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.service_name.localeCompare(b.service_name);
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.product_name.localeCompare(b.product_name);
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Get category icon
  const getCategoryIcon = (category: string, isProduct: boolean = false) => {
    const categories = isProduct ? productCategories : serviceCategories;
    const found = categories.find(c => c.id === category);
    return found ? found.icon : ShoppingBag;
  };

  // Handle item details
  const handleShowDetails = (item: ProviderService | ProviderProduct) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
    setSelectedImageIndex(0); // Reset to first image when opening
    // Reset size selection when opening modal
    if ('product_image_url' in item) {
      const product = item as ProviderProduct;
      // Auto-select first available size, or general price if no sizes
      if (product.price_small) {
        setSelectedSize('small');
      } else if (product.price_medium) {
        setSelectedSize('medium');
      } else if (product.price_large) {
        setSelectedSize('large');
      } else if (product.price_extra_large) {
        setSelectedSize('extra_large');
      } else if (product.price && product.price > 0) {
        setSelectedSize('general');
      } else {
        setSelectedSize(null);
      }
    } else {
      setSelectedSize(null);
    }
  };

  // Close details modal
  const handleCloseDetails = () => {
    setSelectedItem(null);
    setShowDetailsModal(false);
    setSelectedImageIndex(0); // Reset image index when closing
    setSelectedSize(null); // Reset size selection when closing
  };

  // Format price
  const formatPrice = (price: number, currency: string) => {
    const symbol = currency === 'GTQ' ? 'Q.' : '$';
    return `${symbol}${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 pb-40 md:pb-6">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Marketplace</h2>
          <p className="text-purple-100">Cargando productos y servicios...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6 pb-40 md:pb-6">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Marketplace</h2>
          <p className="text-purple-100">Error al cargar el marketplace</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" style={{ paddingBottom: '100px' }}>
      {/* Header */}
      <PageHeader 
        title="Marketplace"
        subtitle="Encuentra servicios y productos para tu mascota"
        gradient="from-blue-500 to-cyan-500"
      >
        <CartIcon onOpenCart={handleOpenCart} />
      </PageHeader>

      {/* Tabs for Services and Products */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="services" className="text-lg font-semibold">
            Servicios ({sortedServices.length})
          </TabsTrigger>
          <TabsTrigger value="products" className="text-lg font-semibold">
            Productos ({sortedProducts.length})
          </TabsTrigger>
        </TabsList>

        {/* Services Tab Content */}
        <TabsContent value="services" className="space-y-6">
          {/* Service Categories */}
          <div className="grid grid-cols-2 lg:grid-cols-8 gap-3">
            {serviceCategories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  flex flex-col items-center space-y-2 p-4 rounded-xl transition-all duration-200 h-auto
                  ${activeCategory === category.id
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg transform scale-105`
                    : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md'
                  }
                `}
              >
                <category.icon size={24} />
                <span className="text-sm font-medium text-center">{category.label}</span>
              </Button>
            ))}
          </div>

          {/* Search and Filters for Services */}
          <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar servicios o proveedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtros
                {showFilters && <X className="w-4 h-4" />}
              </Button>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Más recientes</SelectItem>
                  <SelectItem value="price-low">Precio: menor a mayor</SelectItem>
                  <SelectItem value="price-high">Precio: mayor a menor</SelectItem>
                  <SelectItem value="name">Nombre A-Z</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters Button */}
              {(searchTerm !== '' || priceRange[0] !== 0 || priceRange[1] !== 1000 || selectedProviderType !== 'all' || selectedProvider !== 'all' || selectedCity !== 'all' || selectedRating !== 'all' || selectedRadius !== 'all') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm('');
                    setPriceRange([0, 1000]);
                    setSelectedProviderType('all');
                    setSelectedProvider('all');
                    setSelectedCity('all');
                    setSelectedRating('all');
                    setSelectedRadius('all');
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Limpiar Filtros
                </Button>
              )}

              <div className="text-sm text-gray-600 ml-auto">
                <span>{sortedServices.length} servicios encontrados</span>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Rango de Precio</label>
                  <div className="px-3">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={1000}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Q.{priceRange[0]}</span>
                      <span>Q.{priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Provider Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Proveedor</label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los proveedores" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {provider === 'all' ? 'Todos los proveedores' : provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Ciudad</label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las ciudades" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city === 'all' ? 'Todas las ciudades' : city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Calificación Mínima</label>
                  <Select value={selectedRating} onValueChange={setSelectedRating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las calificaciones" />
                    </SelectTrigger>
                    <SelectContent>
                      {ratingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Radius Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Radio de Búsqueda</label>
                  <Select value={selectedRadius} onValueChange={setSelectedRadius}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cualquier distancia" />
                    </SelectTrigger>
                    <SelectContent>
                      {radiusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Provider Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tipo de Proveedor</label>
                  <Select value={selectedProviderType} onValueChange={setSelectedProviderType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      {providerTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type === 'all' ? 'Todos los tipos' : type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Services Grid */}
          {sortedServices.length === 0 ? (
            <div className="text-center py-12">
              <Scissors className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No hay servicios disponibles
              </h3>
              <p className="text-gray-500">
                {activeCategory === 'all'
                  ? 'Los proveedores aún no han agregado servicios.'
                  : `No hay servicios de ${serviceCategories.find(c => c.id === activeCategory)?.label.toLowerCase()} disponibles en este momento.`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedServices.map((service) => {
                const CategoryIcon = getCategoryIcon(service.service_category);
                return (
                  <Card key={service.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    {/* Service Image */}
                    {service.service_image_url && (
                      <div className="relative w-full h-48 overflow-hidden">
                        <img
                          src={service.service_image_url}
                          alt={service.service_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2 pt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-gray-500 capitalize">{service.service_category}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {service.duration_minutes} min
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <h3 className="font-bold text-lg text-gray-800 mb-2">{service.service_name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {service.description}
                      </p>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center text-gray-500 text-sm">
                          <Building2 size={14} className="mr-2" />
                          <span className="truncate">{service.providers.business_name}</span>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Clock size={14} className="mr-2" />
                          <span>{service.duration_minutes} min</span>
                        </div>
                        {service.providers.address && (
                          <div className="flex items-center text-gray-500 text-sm">
                            <MapPin size={14} className="mr-2" />
                            <span className="truncate">{service.providers.address}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-purple-600">
                          {(() => {
                            // Check if service has size-based pricing
                            const hasSizePrices = service.price_small || service.price_medium || 
                                                  service.price_large || service.price_extra_large;
                            
                            if (hasSizePrices) {
                              const sizePrices = [
                                service.price_small,
                                service.price_medium,
                                service.price_large,
                                service.price_extra_large
                              ].filter((p): p is number => p !== null && p !== undefined);
                              
                              if (sizePrices.length > 0) {
                                const minPrice = Math.min(...sizePrices);
                                const maxPrice = Math.max(...sizePrices);
                                
                                if (minPrice === maxPrice) {
                                  return formatPrice(minPrice, service.currency);
                                } else {
                                  return `${formatPrice(minPrice, service.currency)} - ${formatPrice(maxPrice, service.currency)}`;
                                }
                              }
                            }
                            
                            // Fallback to general price
                            return formatPrice(service.price, service.currency);
                          })()}
                        </span>
                        <Button 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" 
                          size="sm"
                          onClick={() => handleServiceBooking(service)}
                        >
                          Reservar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Products Tab Content */}
        <TabsContent value="products" className="space-y-6">
          {/* Product Categories */}
          <div className="grid grid-cols-2 lg:grid-cols-8 gap-3">
            {productCategories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  flex flex-col items-center space-y-2 p-4 rounded-xl transition-all duration-200 h-auto
                  ${activeCategory === category.id
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg transform scale-105`
                    : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md'
                  }
                `}
              >
                <category.icon size={24} />
                <span className="text-sm font-medium text-center">{category.label}</span>
              </Button>
            ))}
          </div>

          {/* Search and Filters for Products */}
          <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar productos o proveedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtros
                {showFilters && <X className="w-4 h-4" />}
              </Button>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Más recientes</SelectItem>
                  <SelectItem value="price-low">Precio: menor a mayor</SelectItem>
                  <SelectItem value="price-high">Precio: mayor a menor</SelectItem>
                  <SelectItem value="name">Nombre A-Z</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters Button */}
              {(searchTerm !== '' || priceRange[0] !== 0 || priceRange[1] !== 1000 || selectedProviderType !== 'all' || selectedProvider !== 'all' || selectedCity !== 'all' || selectedRating !== 'all' || selectedRadius !== 'all') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm('');
                    setPriceRange([0, 1000]);
                    setSelectedProviderType('all');
                    setSelectedProvider('all');
                    setSelectedCity('all');
                    setSelectedRating('all');
                    setSelectedRadius('all');
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Limpiar Filtros
                </Button>
              )}

              <div className="text-sm text-gray-600 ml-auto">
                <span>{sortedProducts.length} productos encontrados</span>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Rango de Precio</label>
                  <div className="px-3">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={1000}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Q.{priceRange[0]}</span>
                      <span>Q.{priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Provider Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Proveedor</label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los proveedores" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {provider === 'all' ? 'Todos los proveedores' : provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Ciudad</label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las ciudades" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city === 'all' ? 'Todas las ciudades' : city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Calificación Mínima</label>
                  <Select value={selectedRating} onValueChange={setSelectedRating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las calificaciones" />
                    </SelectTrigger>
                    <SelectContent>
                      {ratingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Radius Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Radio de Búsqueda</label>
                  <Select value={selectedRadius} onValueChange={setSelectedRadius}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cualquier distancia" />
                    </SelectTrigger>
                    <SelectContent>
                      {radiusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Provider Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tipo de Proveedor</label>
                  <Select value={selectedProviderType} onValueChange={setSelectedProviderType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      {providerTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type === 'all' ? 'Todos los tipos' : type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Products Grid */}
          {sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No hay productos disponibles
              </h3>
              <p className="text-gray-500">
                {activeCategory === 'all'
                  ? 'Los proveedores aún no han agregado productos.'
                  : `No hay productos de ${productCategories.find(c => c.id === activeCategory)?.label.toLowerCase()} disponibles en este momento.`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => {
                const CategoryIcon = getCategoryIcon(product.product_category, true);
                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    {/* Product Image */}
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      {(() => {
                        const allImages = [
                          product.product_image_url,
                          ...(product.secondary_images || [])
                        ].filter(Boolean) as string[];
                        
                        if (allImages.length === 0) {
                          return (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-12 h-12 text-gray-300" />
                            </div>
                          );
                        }
                        
                        return (
                          <div className="relative w-full h-full">
                            <img
                              src={allImages[0]}
                              alt={product.product_name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                            {allImages.length > 1 && (
                              <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" />
                                {allImages.length}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      
                      {/* Category Badge Overlay */}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs font-medium bg-white/90 text-gray-700">
                          {product.product_category}
                        </Badge>
                      </div>

                      {/* Wishlist Button Overlay */}
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product.id);
                          }}
                          className={`w-8 h-8 p-0 rounded-full transition-all duration-200 ${
                            wishlistItems.has(product.id) 
                              ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg' 
                              : 'bg-white/90 text-gray-600 hover:bg-white hover:shadow-md'
                          }`}
                        >
                          <Star className="w-4 h-4" fill={wishlistItems.has(product.id) ? "currentColor" : "none"} />
                        </Button>
                      </div>

                      {/* Discount Badge Overlay */}
                      {product.discount_percentage && product.discount_percentage > 0 && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="destructive" className="text-xs font-medium shadow-lg">
                            -{product.discount_percentage}%
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <CardHeader className="pb-2 pt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-gray-500 capitalize">{product.product_category}</span>
                        </div>
                        {product.brand && (
                          <Badge variant="outline" className="text-xs">
                            {product.brand}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <h3 className="font-bold text-lg text-gray-800 mb-2">{product.product_name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Provider and Location Info */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center text-gray-500 text-sm">
                          <Building2 size={14} className="mr-2" />
                          <span className="truncate">{product.providers.business_name}</span>
                        </div>
                        
                        {/* Distance */}
                        {userLocation && product.providers.latitude && product.providers.longitude && (
                          <div className="flex items-center text-gray-500 text-sm">
                            <MapPin size={14} className="mr-2" />
                            <span className="truncate">{product.providers.address}</span>
                            <span className="ml-2 text-purple-600 font-medium">
                              ({formatDistance(calculateDistance(
                                userLocation.lat, 
                                userLocation.lng, 
                                product.providers.latitude, 
                                product.providers.longitude
                              ))})
                            </span>
                          </div>
                        )}

                        {/* Delivery Options */}
                        <div className="flex items-center gap-2 text-xs">
                          {product.has_delivery && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              🚚 Delivery
                              {product.delivery_fee && product.delivery_fee > 0 && ` Q.${product.delivery_fee}`}
                            </Badge>
                          )}
                          {product.has_pickup && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              📍 Pickup
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Reviews */}
                      {product.average_rating && product.average_rating > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={`${
                                  star <= (product.average_rating || 0)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {product.average_rating.toFixed(1)} ({product.review_count || 0} reviews)
                          </span>
                        </div>
                      )}

                      {/* Price Section */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          {(() => {
                            const pricingConfig = getPricingConfig(product.product_category);
                            
                            // Always check if product has size-based pricing, regardless of category config
                            // This allows products to have size prices even if category is set to 'single'
                            const hasDogSizePrices = product.price_small || 
                              product.price_medium || 
                              product.price_large || 
                              product.price_extra_large;
                            
                            const hasClothingSizePrices = (product as any).price_xs ||
                              (product as any).price_s ||
                              (product as any).price_m ||
                              (product as any).price_l ||
                              (product as any).price_xl ||
                              (product as any).price_xxl;
                            
                            const hasSizePrices = hasDogSizePrices || hasClothingSizePrices;
                            
                            if (hasSizePrices) {
                              // Collect all available size prices (only valid numbers)
                              const sizePrices: number[] = [];
                              
                              // Always check for dog size prices (only if they're valid numbers)
                              if (product.price_small != null && !isNaN(Number(product.price_small)) && product.price_small > 0) {
                                sizePrices.push(Number(product.price_small));
                              }
                              if (product.price_medium != null && !isNaN(Number(product.price_medium)) && product.price_medium > 0) {
                                sizePrices.push(Number(product.price_medium));
                              }
                              if (product.price_large != null && !isNaN(Number(product.price_large)) && product.price_large > 0) {
                                sizePrices.push(Number(product.price_large));
                              }
                              if (product.price_extra_large != null && !isNaN(Number(product.price_extra_large)) && product.price_extra_large > 0) {
                                sizePrices.push(Number(product.price_extra_large));
                              }
                              
                              // Always check for clothing size prices (only if they're valid numbers)
                              const clothingPrices = ['price_xs', 'price_s', 'price_m', 'price_l', 'price_xl', 'price_xxl'];
                              clothingPrices.forEach(priceKey => {
                                const price = (product as any)[priceKey];
                                if (price != null && !isNaN(Number(price)) && price > 0) {
                                  sizePrices.push(Number(price));
                                }
                              });
                              
                              // Don't include general price in the range if we have size-specific prices
                              // Only include it if it's different from the size prices
                              
                              // Debug log
                              console.log('Product:', product.product_name, 'Category:', product.product_category);
                              console.log('Has size prices:', hasSizePrices);
                              console.log('Size prices array:', sizePrices);
                              console.log('Product price fields:', {
                                price_small: product.price_small,
                                price_medium: product.price_medium,
                                price_large: product.price_large,
                                price_extra_large: product.price_extra_large,
                                price_xs: (product as any).price_xs,
                                price_s: (product as any).price_s,
                                price_m: (product as any).price_m,
                                price_l: (product as any).price_l,
                                price_xl: (product as any).price_xl,
                                price_xxl: (product as any).price_xxl
                              });
                              
                              if (sizePrices.length > 0) {
                                const minPrice = Math.min(...sizePrices);
                                const maxPrice = Math.max(...sizePrices);
                                
                                console.log('Calculated price range:', { minPrice, maxPrice });
                                
                                if (product.discount_percentage && product.discount_percentage > 0 && product.original_price) {
                                  return (
                                    <div className="flex items-center gap-2">
                                      <div className="flex flex-col">
                                        <span className="text-xl font-bold text-purple-600">
                                          {minPrice === maxPrice 
                                            ? formatPrice(minPrice, product.currency)
                                            : `${formatPrice(minPrice, product.currency)} - ${formatPrice(maxPrice, product.currency)}`
                                          }
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {minPrice === maxPrice ? 'Precio único' : 'Rango de precios'}
                                        </span>
                                      </div>
                                      <span className="text-sm text-gray-500 line-through">
                                        {formatPrice(product.original_price, product.currency)}
                                      </span>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="flex flex-col">
                                      <span className="text-xl font-bold text-purple-600">
                                        {minPrice === maxPrice 
                                          ? formatPrice(minPrice, product.currency)
                                          : `${formatPrice(minPrice, product.currency)} - ${formatPrice(maxPrice, product.currency)}`
                                        }
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {minPrice === maxPrice ? 'Precio único' : 'Rango de precios por tamaño'}
                                      </span>
                                    </div>
                                  );
                                }
                              }
                            }
                            
                            // Fallback to general price display
                            if (product.discount_percentage && product.discount_percentage > 0 && product.original_price) {
                              return (
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-bold text-purple-600">
                                    {formatPrice(product.price, product.currency)}
                                  </span>
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatPrice(product.original_price, product.currency)}
                                  </span>
                                </div>
                              );
                            } else {
                              return (
                                <span className="text-xl font-bold text-purple-600">
                                  {formatPrice(product.price, product.currency)}
                                </span>
                              );
                            }
                          })()}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {product.stock_quantity > 0 && (
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`quantity-${product.id}`} className="text-xs text-gray-600 whitespace-nowrap">Cantidad:</Label>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  const currentQty = productQuantity[product.id] || 1;
                                  if (currentQty > 1) {
                                    setProductQuantity(prev => ({ ...prev, [product.id]: currentQty - 1 }));
                                  }
                                }}
                                disabled={(productQuantity[product.id] || 1) <= 1}
                              >
                                -
                              </Button>
                              <Input
                                id={`quantity-${product.id}`}
                                type="number"
                                min="1"
                                max={product.stock_quantity}
                                value={productQuantity[product.id] || 1}
                                onChange={(e) => {
                                  const qty = Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1));
                                  setProductQuantity(prev => ({ ...prev, [product.id]: qty }));
                                }}
                                className="w-12 h-7 text-center text-xs p-1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  const currentQty = productQuantity[product.id] || 1;
                                  if (currentQty < product.stock_quantity) {
                                    setProductQuantity(prev => ({ ...prev, [product.id]: currentQty + 1 }));
                                  }
                                }}
                                disabled={(productQuantity[product.id] || 1) >= product.stock_quantity}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            size="sm"
                            disabled={product.stock_quantity === 0}
                            onClick={() => {
                              // If product has size-based pricing, open details modal instead
                              const hasSizeOptions = product.price_small || product.price_medium || product.price_large || product.price_extra_large;
                              if (hasSizeOptions) {
                                handleShowDetails(product);
                              } else {
                                // If no size options, add directly to cart
                                const qty = productQuantity[product.id] || 1;
                                handleAddToCart(product, qty);
                              }
                            }}
                          >
                            {product.stock_quantity === 0 ? 'Sin Stock' : 'Comprar'}
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1" 
                            size="sm"
                            onClick={() => handleShowDetails(product)}
                          >
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Details Modal */}
      {showDetailsModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[70vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {('service_name' in selectedItem) ? selectedItem.service_name : selectedItem.product_name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Item Image Gallery (for products) */}
              {('product_image_url' in selectedItem) && (
                <div className="mb-3">
                  {(() => {
                    const product = selectedItem as ProviderProduct;
                    const allImages = [
                      product.product_image_url,
                      ...(product.secondary_images || [])
                    ].filter(Boolean) as string[];
                    
                    if (allImages.length === 0) return null;
                    
                    return (
                      <div className="space-y-2">
                        {/* Main Image */}
                        <div className="relative">
                          <img
                            src={allImages[selectedImageIndex]}
                            alt={product.product_name}
                            className="w-full h-64 object-cover rounded-lg"
                          />
                          {allImages.length > 1 && (
                            <>
                              {/* Previous Button */}
                              {selectedImageIndex > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                                  onClick={() => setSelectedImageIndex(selectedImageIndex - 1)}
                                >
                                  ←
                                </Button>
                              )}
                              {/* Next Button */}
                              {selectedImageIndex < allImages.length - 1 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                                  onClick={() => setSelectedImageIndex(selectedImageIndex + 1)}
                                >
                                  →
                                </Button>
                              )}
                              {/* Image Counter */}
                              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                {selectedImageIndex + 1} / {allImages.length}
                              </div>
                            </>
                          )}
                        </div>
                        
                        {/* Thumbnail Gallery */}
                        {allImages.length > 1 && (
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {allImages.map((img, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedImageIndex(idx)}
                                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                  selectedImageIndex === idx
                                    ? 'border-emerald-500 ring-2 ring-emerald-200'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <img
                                  src={img}
                                  alt={`${product.product_name} ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Service Image (for services) */}
              {('service_name' in selectedItem) && (selectedItem as ProviderService).service_image_url && (
                <div className="mb-3">
                  <img
                    src={(selectedItem as ProviderService).service_image_url}
                    alt={(selectedItem as ProviderService).service_name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Item Details */}
              <div className="space-y-3">
                {/* Description */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Descripción</h4>
                  <p className="text-gray-600 text-sm">
                    {('service_name' in selectedItem) ? selectedItem.description : selectedItem.description}
                  </p>
                  {('detailed_description' in selectedItem) && selectedItem.detailed_description && (
                    <p className="text-gray-600 text-sm mt-1">{selectedItem.detailed_description}</p>
                  )}
                </div>

                {/* Provider Information */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Información del Proveedor</h4>
                  <div className="bg-gray-50 p-2 rounded-lg space-y-1">
                    <div className="flex items-center text-gray-600 text-sm">
                      <Building2 size={14} className="mr-2" />
                      <span className="font-medium">{selectedItem.providers.business_name}</span>
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
                      <Package size={14} className="mr-2" />
                      <span>{selectedItem.providers.business_type}</span>
                    </div>
                    {selectedItem.providers.address && (
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin size={14} className="mr-2" />
                        <span>{selectedItem.providers.address}</span>
                      </div>
                    )}
                    {selectedItem.providers.phone && (
                      <div className="flex items-center text-gray-600 text-sm">
                        <Clock size={14} className="mr-2" />
                        <span>{selectedItem.providers.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service/Product Specific Details */}
                {('service_name' in selectedItem) ? (
                  // Service details
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Detalles del Servicio</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <span className="text-xs text-gray-500">Duración</span>
                        <p className="font-medium text-sm">{selectedItem.duration_minutes} minutos</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <span className="text-xs text-gray-500">Categoría</span>
                        <p className="font-medium text-sm capitalize">{selectedItem.service_category}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Product details
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Detalles del Producto</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <span className="text-xs text-gray-500">Categoría</span>
                          <p className="font-medium text-sm capitalize">{selectedItem.product_category}</p>
                        </div>
                        {selectedItem.brand && (
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <span className="text-xs text-gray-500">Marca</span>
                            <p className="font-medium text-sm">{selectedItem.brand}</p>
                          </div>
                        )}
                        {selectedItem.weight_kg && (
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <span className="text-xs text-gray-500">Peso</span>
                            <p className="font-medium text-sm">{selectedItem.weight_kg} kg</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selector de Tamaño */}
                    {(() => {
                      const product = selectedItem as ProviderProduct;
                      const pricingConfig = getPricingConfig(product.product_category);
                      
                      // Build size options based on pricing system
                      let sizeOptions: Array<{ key: string; label: string; description?: string; price?: number | null }> = [];
                      
                      if (pricingConfig.system === 'dog_size') {
                        sizeOptions = pricingConfig.sizeOptions?.map(size => ({
                          key: size.key,
                          label: size.label,
                          description: size.description,
                          price: (product as any)[`price_${size.key}`]
                        })) || [];
                      } else if (pricingConfig.system === 'clothing_size') {
                        sizeOptions = pricingConfig.sizeOptions?.map(size => ({
                          key: size.key,
                          label: size.label,
                          description: size.description,
                          price: (product as any)[`price_${size.key}`]
                        })) || [];
                      }

                      // Filter out options without prices
                      const availableSizeOptions = sizeOptions.filter(p => p.price !== null && p.price !== undefined);
                      const hasSizeOptions = availableSizeOptions.length > 0;
                      const hasGeneralPrice = product.price && product.price > 0;

                      if (pricingConfig.system === 'single') {
                        // Single price system - no size selector needed
                        return null;
                      }

                      if (!hasSizeOptions && !hasGeneralPrice) return null;

                      return (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-3">Selecciona el Tamaño *</h4>
                          {hasSizeOptions && (
                            <div className={`grid gap-3 mb-3 ${
                              pricingConfig.system === 'clothing_size' 
                                ? 'grid-cols-2 md:grid-cols-3' 
                                : 'grid-cols-2'
                            }`}>
                              {availableSizeOptions.map((size) => (
                                <button
                                  key={size.key}
                                  onClick={() => setSelectedSize(size.key as 'small' | 'medium' | 'large' | 'extra_large' | 'general')}
                                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                                    selectedSize === size.key
                                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                                      : 'border-gray-200 hover:border-purple-300 bg-white'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-medium ${selectedSize === size.key ? 'text-purple-700' : 'text-gray-700'}`}>
                                      {pricingConfig.system === 'clothing_size' ? `Talla ${size.label}` : size.label}
                                    </span>
                                    {selectedSize === size.key && (
                                      <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                                        <span className="text-white text-xs">✓</span>
                                      </div>
                                    )}
                                  </div>
                                  {size.description && (
                                    <span className="text-xs text-gray-500 block mb-1">{size.description}</span>
                                  )}
                                  <p className={`text-lg font-bold ${selectedSize === size.key ? 'text-purple-600' : 'text-gray-600'}`}>
                                    {selectedItem.currency === 'GTQ' ? 'Q.' : '$'}
                                    {size.price?.toFixed(2)}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                          {hasGeneralPrice && (
                            <button
                              onClick={() => setSelectedSize('general')}
                              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                selectedSize === 'general'
                                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                                  : 'border-gray-200 hover:border-purple-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className={`text-sm font-medium block ${selectedSize === 'general' ? 'text-purple-700' : 'text-gray-700'}`}>
                                    Precio General
                                  </span>
                                  <span className="text-xs text-gray-500">Sin diferenciación por tamaño</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className={`text-lg font-bold ${selectedSize === 'general' ? 'text-purple-600' : 'text-gray-600'}`}>
                                    {selectedItem.currency === 'GTQ' ? 'Q.' : '$'}
                                    {product.price.toFixed(2)}
                                  </p>
                                  {selectedSize === 'general' && (
                                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                                      <span className="text-white text-xs">✓</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Price and Action */}
                <div className="border-t pt-3">
                  <div className="space-y-3">
                    {(() => {
                      if ('service_name' in selectedItem) {
                        return (
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm text-gray-500">Precio</span>
                              <p className="text-2xl font-bold text-purple-600">
                                {formatPrice(selectedItem.price, selectedItem.currency)}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      const product = selectedItem as ProviderProduct;
                      const pricingConfig = getPricingConfig(product.product_category);
                      let displayPrice = product.price;
                      let sizeLabel = '';

                      if (selectedSize && selectedSize !== 'general') {
                        const sizePrice = (product as any)[`price_${selectedSize}`];
                        if (sizePrice) {
                          displayPrice = sizePrice;
                          const sizeOption = pricingConfig.sizeOptions?.find(s => s.key === selectedSize);
                          if (sizeOption) {
                            sizeLabel = ` (${sizeOption.label})`;
                          }
                        }
                      } else if (selectedSize === 'general' && product.price) {
                        displayPrice = product.price;
                        sizeLabel = '';
                      }

                      return (
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm text-gray-500">Precio{sizeLabel}</span>
                            <p className="text-2xl font-bold text-purple-600">
                              {formatPrice(displayPrice, selectedItem.currency)}
                            </p>
                            {!selectedSize && (
                              <p className="text-xs text-red-500 mt-1">Por favor selecciona un tamaño</p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    {!('service_name' in selectedItem) && selectedItem.stock_quantity > 0 && (
                      <div className="flex items-center gap-3">
                        <Label htmlFor="quantity-modal" className="text-sm font-medium">Cantidad:</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentQty = productQuantity[selectedItem.id] || 1;
                              if (currentQty > 1) {
                                setProductQuantity(prev => ({ ...prev, [selectedItem.id]: currentQty - 1 }));
                              }
                            }}
                            disabled={(productQuantity[selectedItem.id] || 1) <= 1}
                          >
                            -
                          </Button>
                          <Input
                            id="quantity-modal"
                            type="number"
                            min="1"
                            max={selectedItem.stock_quantity}
                            value={productQuantity[selectedItem.id] || 1}
                            onChange={(e) => {
                              const qty = Math.max(1, Math.min(selectedItem.stock_quantity, parseInt(e.target.value) || 1));
                              setProductQuantity(prev => ({ ...prev, [selectedItem.id]: qty }));
                            }}
                            className="w-20 text-center"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentQty = productQuantity[selectedItem.id] || 1;
                              if (currentQty < selectedItem.stock_quantity) {
                                setProductQuantity(prev => ({ ...prev, [selectedItem.id]: currentQty + 1 }));
                              }
                            }}
                            disabled={(productQuantity[selectedItem.id] || 1) >= selectedItem.stock_quantity}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {('service_name' in selectedItem) ? (
                        <Button 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" 
                          size="sm"
                          onClick={() => {
                            handleServiceBooking(selectedItem as ProviderService);
                            setShowDetailsModal(false);
                          }}
                        >
                          Reservar Servicio
                        </Button>
                      ) : (
                        <Button 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          disabled={selectedItem.stock_quantity === 0 || !selectedSize}
                          size="sm"
                          onClick={() => {
                            if (!selectedSize) {
                              toast.error("⚠️ Selecciona un tamaño. Por favor selecciona un tamaño antes de comprar");
                              return;
                            }
                            const qty = productQuantity[selectedItem.id] || 1;
                            handleAddToCart(selectedItem, qty);
                            setShowDetailsModal(false);
                          }}
                        >
                          {selectedItem.stock_quantity === 0 ? 'Sin Stock' : !selectedSize ? 'Selecciona un tamaño' : 'Comprar Ahora'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      <CartModal
        isOpen={showCartModal}
        onClose={handleCloseCart}
        onCheckout={handleCheckout}
      />

      {/* Checkout Modal */}
      <Checkout
        isOpen={showCheckout}
        onClose={handleCloseCheckout}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Service Booking Modal */}
      <ServiceBookingModal
        isOpen={showServiceBookingModal}
        onClose={() => {
          setShowServiceBookingModal(false);
          setSelectedService(null);
        }}
        service={selectedService}
        onBookingSuccess={() => {
          // Refresh marketplace data or show success message
          toast.success("✅ Reserva Confirmada: Tu reserva ha sido creada exitosamente");
        }}
      />
    </div>
  );
};

export default Marketplace;