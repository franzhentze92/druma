import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  RefreshCw,
  Calendar,
  MapPin,
  Phone,
  CreditCard,
  Eye,
  ShoppingCart,
  Star,
  Search,
  Filter,
  X,
  CalendarDays,
  ShoppingBag,
  RotateCcw
} from 'lucide-react';
import PageHeader from './PageHeader';
import { useNavigation } from '@/contexts/NavigationContext';
import ReviewModal from './ReviewModal';
import InvoiceViewer from './InvoiceViewer';
import { FileText } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  delivery_fee: number;
  grand_total: number;
  currency: string;
  status: string;
  payment_method: string;
  payment_status: string;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_instructions?: string;
  created_at: string;
  delivered_at?: string;
  order_items: OrderItem[];
}

interface OrderItem {
  id: string;
  item_type: 'product' | 'service';
  item_id: string;
  item_name: string;
  item_description?: string;
  item_image_url?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  currency: string;
  provider_id: string;
  provider_name: string;
  provider_phone?: string;
  provider_address?: string;
  has_delivery: boolean;
  has_pickup: boolean;
  delivery_fee: number;
}

const ClientOrders: React.FC = () => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isMobileMenuOpen, toggleMobileMenu } = useNavigation();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());
  const [checkedOrders, setCheckedOrders] = useState<Set<string>>(new Set());
  const [orderReviews, setOrderReviews] = useState<Map<string, any[]>>(new Map());
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceOrderId, setInvoiceOrderId] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('pedidos');

  // Separate orders and reservations
  const productOrders = orders.filter(order => 
    order.order_items && order.order_items.some(item => item.item_type === 'product')
  );
  
  const serviceOrders = orders.filter(order => 
    order.order_items && order.order_items.some(item => item.item_type === 'service')
  );

  // Get current data based on active tab
  const getCurrentData = () => {
    if (activeTab === 'pedidos') {
      return productOrders;
    } else {
      return reservations;
    }
  };

  // Fetch orders and reservations
    const fetchOrders = async () => {
      if (!user) return;

      try {
        setLoading(true);
      
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        setOrders([]);
        return;
      }

      // Ensure each order has order_items array
      const processedOrders = (ordersData || []).map(order => ({
        ...order,
        order_items: order.order_items || []
      }));
      
      setOrders(processedOrders);

      // Fetch reservations with service details
      console.log('Fetching reservations for client_id:', user.id);
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('service_appointments')
        .select(`
          *,
          provider_services (
            id,
            service_name,
            description,
            price,
            currency,
            duration_minutes,
            provider_id,
            providers (
              id,
              business_name,
              user_id,
              address,
              phone
            )
          ),
          provider_service_time_slots:provider_service_time_slots!service_appointments_time_slot_id_fkey (
            slot_start_time,
            slot_end_time
          )
        `)
        .eq('client_id', user.id)
        .order('appointment_date', { ascending: false });

      console.log('Reservations query result:', { 
        reservationsData, 
        reservationsError,
        count: reservationsData?.length || 0
      });

      if (reservationsError) {
        console.error('Error fetching reservations:', reservationsError);
        setReservations([]);
      } else {
        // Process reservations to ensure data structure is correct
        const processedReservations = (reservationsData || []).map(reservation => {
          // Get time slot information
          const timeSlot = reservation.provider_service_time_slots;
          let appointmentTime = '';
          if (timeSlot?.slot_start_time && timeSlot?.slot_end_time) {
            appointmentTime = `${timeSlot.slot_start_time.substring(0, 5)} - ${timeSlot.slot_end_time.substring(0, 5)}`;
          } else if (reservation.appointment_time) {
            appointmentTime = reservation.appointment_time;
          } else if (reservation.appointment_date) {
            // Fallback to appointment_date if time slot not available
            const date = new Date(reservation.appointment_date);
            appointmentTime = date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
          }
          
          return {
            ...reservation,
            service: reservation.provider_services || null,
            // Ensure service name is accessible
            service_name: reservation.provider_services?.service_name || 'Servicio desconocido',
            provider_name: reservation.provider_services?.providers?.business_name || 'Proveedor desconocido',
            appointment_time: appointmentTime
          };
        });
        console.log('Processed reservations:', processedReservations);
        setReservations(processedReservations);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setOrders([]);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Check for reviews when orders change
  useEffect(() => {
    if (orders.length > 0) {
      checkOrdersForReviews();
    }
  }, [orders]);

  const checkOrdersForReviews = async () => {
    const deliveredOrders = orders.filter(order => order.status === 'delivered');
    
    for (const order of deliveredOrders) {
      if (checkedOrders.has(order.id)) continue;
      
      const hasReviews = await hasOrderBeenReviewed(order.id);
      if (hasReviews) {
        setReviewedOrders(prev => new Set([...prev, order.id]));
      }
      setCheckedOrders(prev => new Set([...prev, order.id]));
    }
  };

  const hasOrderBeenReviewed = async (orderId: string): Promise<boolean> => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return false;

      const providerIds = order.order_items.map(item => item.provider_id);
      const uniqueProviderIds = [...new Set(providerIds)];

      const { data: reviews, error } = await supabase
        .from('provider_reviews')
        .select('provider_id, rating, comment')
        .eq('client_id', user?.id)
        .in('provider_id', uniqueProviderIds);

      if (error) {
        console.error('Error checking reviews:', error);
        return false;
      }

      // Store review data
      if (reviews && reviews.length > 0) {
        setOrderReviews(prev => new Map([...prev, [orderId, reviews]]));
      }

      return reviews && reviews.length === uniqueProviderIds.length;
    } catch (error) {
      console.error('Error checking reviews:', error);
      return false;
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleReviewOrder = (orderId: string) => {
    setReviewOrderId(orderId);
    setShowReviewModal(true);
  };

  const handleViewInvoice = (orderId: string) => {
    setInvoiceOrderId(orderId);
    setShowInvoice(true);
  };

  const handleReviewSubmitted = () => {
    if (reviewOrderId) {
      setReviewedOrders(prev => new Set([...prev, reviewOrderId]));
    }
    setShowReviewModal(false);
    setReviewOrderId(null);
    fetchOrders(); // Refresh to get updated data
  };

  const handleOrderAgain = (order: Order) => {
    order.order_items.forEach(item => {
      if (item.item_type === 'product') {
        addItem({
          id: item.item_id,
          type: 'product',
          name: item.item_name,
          price: item.unit_price,
          currency: item.currency,
          image_url: item.item_image_url || '',
          provider_id: item.provider_id,
          provider_name: item.provider_name,
          description: item.item_description,
          delivery_fee: item.delivery_fee,
          has_delivery: item.has_delivery,
          has_pickup: item.has_pickup
        });
      }
    });
    
    toast({
      title: "Productos agregados al carrito",
      description: "Los productos de esta orden han sido agregados a tu carrito.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Pendiente', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' };
      case 'confirmed':
        return { text: 'Confirmado', className: 'bg-blue-100 text-blue-800 hover:bg-blue-200' };
      case 'completed':
        return { text: 'Completado', className: 'bg-green-100 text-green-800 hover:bg-green-200' };
      case 'processing':
        return { text: 'Procesando', className: 'bg-purple-100 text-purple-800 hover:bg-purple-200' };
      case 'shipped':
        return { text: 'Enviado', className: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' };
      case 'delivered':
        return { text: 'Entregado', className: 'bg-green-100 text-green-800 hover:bg-green-200' };
      case 'cancelled':
        return { text: 'Cancelado', className: 'bg-red-100 text-red-800 hover:bg-red-200' };
      default:
        return { text: status, className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' };
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { text: 'Pagado', className: 'bg-green-100 text-green-800 hover:bg-green-200' };
      case 'pending':
        return { text: 'Pendiente', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' };
      case 'failed':
        return { text: 'Fallido', className: 'bg-red-100 text-red-800 hover:bg-red-200' };
      case 'refunded':
        return { text: 'Reembolsado', className: 'bg-blue-100 text-blue-800 hover:bg-blue-200' };
      default:
        return { text: status, className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number | undefined | null, currency: string = 'GTQ') => {
    if (price === undefined || price === null || isNaN(price)) {
      return `${currency === 'GTQ' ? 'Q.' : '$'}0.00`;
    }
    return `${currency === 'GTQ' ? 'Q.' : '$'}${price.toFixed(2)}`;
  };

  const getFilteredData = () => {
    const currentData = getCurrentData();
    let filtered = currentData;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => {
        if (activeTab === 'pedidos') {
          const order = item as Order;
          return (
            order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.order_items && order.order_items.some(item => 
              item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.provider_name.toLowerCase().includes(searchTerm.toLowerCase())
            )
          );
        } else {
          const reservation = item as any;
          return (
            reservation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.provider_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.service_id.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => {
        if (activeTab === 'pedidos') {
          return (item as Order).status === statusFilter;
        } else {
          return (item as any).status === statusFilter;
        }
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(item => {
        const itemDate = new Date(activeTab === 'pedidos' ? (item as Order).created_at : (item as any).appointment_date);
        
        switch (dateFilter) {
          case 'today':
            return itemDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return itemDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return itemDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            return itemDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const filteredData = getFilteredData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-500" />
          <p className="text-gray-600">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" style={{ paddingBottom: '100px' }}>
      {/* Header Bar */}
      <PageHeader 
        title="Mis Órdenes"
        subtitle="Historial de todas tus compras"
        gradient="from-purple-600 to-pink-600"
        showHamburgerMenu={true}
        onToggleHamburger={toggleMobileMenu}
        isHamburgerOpen={isMobileMenuOpen}
      >
        <Package className="w-8 h-8" />
      </PageHeader>

      <div className="p-6 space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pedidos" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Mis Pedidos
            </TabsTrigger>
            <TabsTrigger value="reservas" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Mis Reservas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pedidos" className="space-y-6">
            {/* Filters for Orders */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por número de orden, producto o proveedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
              </div>

              {showFilters && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Estado
                      </label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los estados</SelectItem>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="processing">Procesando</SelectItem>
                          <SelectItem value="shipped">Enviado</SelectItem>
                          <SelectItem value="delivered">Entregado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Período de Tiempo
                      </label>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar período" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los períodos</SelectItem>
                          <SelectItem value="today">Hoy</SelectItem>
                          <SelectItem value="week">Última semana</SelectItem>
                          <SelectItem value="month">Último mes</SelectItem>
                          <SelectItem value="year">Último año</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Mostrando {filteredData.length} de {productOrders.length} órdenes
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setDateFilter('all');
                      }}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Limpiar Filtros
            </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Cards for Orders */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Órdenes</p>
                      <p className="text-2xl font-bold text-gray-900">{productOrders.length}</p>
                      </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Entregadas</p>
                      <p className="text-2xl font-bold text-green-600">
                        {productOrders.filter(order => order.status === 'delivered').length}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">En Proceso</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {productOrders.filter(order => ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status)).length}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Gastado</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatPrice(productOrders.length > 0 ? productOrders.reduce((sum, order) => sum + (order.grand_total || 0), 0) : 0, 'GTQ')}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <CreditCard className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Orders List */}
            {filteredData.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    {productOrders.length === 0 ? 'No tienes órdenes aún' : 'No se encontraron órdenes'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {productOrders.length === 0 
                      ? 'Cuando hagas tu primera compra, aparecerá aquí'
                      : 'Intenta ajustar los filtros para encontrar lo que buscas'
                    }
                  </p>
                  <Button onClick={() => window.location.href = '/client-dashboard'}>
                    Ir al Marketplace
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredData.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Orden #{order.order_number}
                            </h3>
                            <Badge 
                              className={`${getStatusBadge(order.status).className} flex-shrink-0`}
                            >
                              {getStatusBadge(order.status).text}
                            </Badge>
                            <Badge 
                              className={`${getPaymentStatusBadge(order.payment_status).className} flex-shrink-0`}
                            >
                              {getPaymentStatusBadge(order.payment_status).text}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {formatDate(order.created_at)}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              {order.order_items?.length || 0} producto{(order.order_items?.length || 0) !== 1 ? 's' : ''}
                            </div>
                            <div className="flex items-center gap-1">
                              {(() => {
                                const hasProducts = order.order_items?.some((item: OrderItem) => item.item_type === 'product');
                                const hasServices = order.order_items?.some((item: OrderItem) => item.item_type === 'service');
                                const orderType = hasProducts && hasServices ? 'Mixto' : hasProducts ? 'Producto' : 'Servicio';
                                const orderTypeColor = hasProducts && hasServices ? 'text-purple-600' : hasProducts ? 'text-blue-600' : 'text-emerald-600';
                                const OrderTypeIcon = hasProducts && hasServices ? Package : hasProducts ? Package : Calendar;
                                return (
                                  <Badge variant="outline" className={`text-xs ${orderTypeColor} border-current flex items-center gap-1 flex-shrink-0`}>
                                    <OrderTypeIcon className="w-3 h-3" />
                                    {orderType}
                                  </Badge>
                                );
                              })()}
                            </div>
                            <div className="flex items-center gap-1">
                              <CreditCard className="w-4 h-4" />
                              {formatPrice(order.grand_total, order.currency)}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(order)}
                            className="flex items-center gap-2 flex-1 sm:flex-initial"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Ver Detalles</span>
                            <span className="sm:hidden">Detalles</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewInvoice(order.id)}
                            className="flex items-center gap-2 flex-1 sm:flex-initial bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="hidden sm:inline">Factura</span>
                            <span className="sm:hidden">Factura</span>
                          </Button>
                          {order.status === 'delivered' && !reviewedOrders.has(order.id) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReviewOrder(order.id)}
                              className="flex items-center gap-2 flex-1 sm:flex-initial"
                            >
                              <Star className="w-4 h-4" />
                              <span className="hidden sm:inline">Calificar</span>
                              <span className="sm:hidden">Calificar</span>
                            </Button>
                          )}
                          {order.status === 'delivered' && reviewedOrders.has(order.id) && (
                            <div className="flex items-center justify-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                              <Star className="w-4 h-4" />
                              <span className="hidden sm:inline">Ya calificado</span>
                              <span className="sm:hidden">Calificado</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reservas" className="space-y-6">
            {/* Filters for Reservations */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por servicio o proveedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
              </div>

              {showFilters && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Estado
                      </label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los estados</SelectItem>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                          <SelectItem value="completed">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Período de Tiempo
                      </label>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar período" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los períodos</SelectItem>
                          <SelectItem value="today">Hoy</SelectItem>
                          <SelectItem value="week">Última semana</SelectItem>
                          <SelectItem value="month">Último mes</SelectItem>
                          <SelectItem value="year">Último año</SelectItem>
                        </SelectContent>
                      </Select>
                      </div>
                      </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Mostrando {filteredData.length} de {reservations.length} reservas
                    </div>
                      <Button
                        variant="outline"
                        size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setDateFilter('all');
                      }}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Limpiar Filtros
                      </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Cards for Reservations */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Reservas</p>
                      <p className="text-2xl font-bold text-gray-900">{reservations.length}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <CalendarDays className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completadas</p>
                      <p className="text-2xl font-bold text-green-600">
                        {reservations.filter(reservation => reservation.status === 'completed').length}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pendientes</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {reservations.filter(reservation => ['pending', 'confirmed'].includes(reservation.status)).length}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Gastado</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatPrice(reservations.length > 0 ? reservations.reduce((sum, reservation) => sum + (reservation.total_price || 0), 0) : 0, 'GTQ')}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <CreditCard className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reservations List */}
            {filteredData.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    {reservations.length === 0 ? 'No tienes reservas aún' : 'No se encontraron reservas'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {reservations.length === 0 
                      ? 'Cuando hagas tu primera reserva de servicio, aparecerá aquí'
                      : 'Intenta ajustar los filtros para encontrar lo que buscas'
                    }
                  </p>
                  <Button onClick={() => window.location.href = '/client-dashboard'}>
                    Ir al Marketplace
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredData.map((reservation) => (
                  <Card key={reservation.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {reservation.service_name || reservation.service?.service_name || reservation.provider_services?.service_name || `Servicio #${reservation.id?.slice(-8) || 'N/A'}`}
                            </h3>
                            <Badge 
                              className={`${getStatusBadge(reservation.status).className} flex-shrink-0`}
                            >
                              {getStatusBadge(reservation.status).text}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {formatDate(reservation.appointment_date)}
                            {reservation.appointment_time && (
                              <span className="ml-2 font-medium">
                                • {reservation.appointment_time}
                              </span>
                            )}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {reservation.provider_name || reservation.service?.providers?.business_name || reservation.provider_services?.providers?.business_name || `Proveedor #${reservation.provider_id?.slice(-8) || 'N/A'}`}
                            </div>
                            <div className="flex items-center gap-1">
                              <CreditCard className="w-4 h-4" />
                              {formatPrice(reservation.total_price || 0, reservation.currency || 'GTQ')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              // Fetch time slot details if available
                              let timeSlotInfo = null;
                              if (reservation.time_slot_id) {
                                const { data: timeSlotData } = await supabase
                                  .from('provider_service_time_slots')
                                  .select('slot_start_time, slot_end_time')
                                  .eq('id', reservation.time_slot_id)
                                  .maybeSingle();
                                
                                if (timeSlotData) {
                                  timeSlotInfo = timeSlotData;
                                }
                              }
                              
                              setSelectedOrder({
                                id: reservation.id,
                                order_number: `RES-${reservation.id?.slice(-8) || 'N/A'}`,
                                total_amount: reservation.total_price || 0,
                                delivery_fee: 0,
                                grand_total: reservation.total_price || 0,
                                currency: reservation.currency || 'GTQ',
                                status: reservation.status || 'pending',
                                payment_method: 'service',
                                payment_status: 'completed',
                                delivery_name: reservation.client_name || '',
                                delivery_phone: reservation.client_phone || '',
                                delivery_address: reservation.provider_services?.providers?.address || '',
                                delivery_city: '',
                                delivery_instructions: reservation.notes || '',
                                created_at: reservation.created_at,
                                reservation_data: {
                                  appointment_date: reservation.appointment_date,
                                  time_slot_id: reservation.time_slot_id,
                                  time_slot: timeSlotInfo,
                                  notes: reservation.notes,
                                  client_email: reservation.client_email
                                },
                                order_items: [{
                                  id: reservation.id,
                                  item_type: 'service',
                                  item_id: reservation.service_id,
                                  item_name: reservation.service_name || reservation.service?.service_name || reservation.provider_services?.service_name || `Servicio #${reservation.id?.slice(-8) || 'N/A'}`,
                                  provider_id: reservation.provider_id,
                                  provider_name: reservation.provider_name || reservation.service?.providers?.business_name || reservation.provider_services?.providers?.business_name || `Proveedor #${reservation.provider_id?.slice(-8) || 'N/A'}`,
                                  unit_price: reservation.total_price || 0,
                                  quantity: 1,
                                  total_price: reservation.total_price || 0,
                                  currency: reservation.currency || 'GTQ',
                                  item_description: reservation.provider_services?.description || 'Servicio reservado',
                                  item_image_url: null,
                                  provider_phone: reservation.provider_services?.providers?.phone || '',
                                  provider_address: reservation.provider_services?.providers?.address || '',
                                  has_delivery: false,
                                  has_pickup: false,
                                  delivery_fee: 0
                                }]
                              });
                              setShowOrderDetails(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Ver Detalles</span>
                            <span className="sm:hidden">Detalles</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
        </div>
      )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="client-order-details-description">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Detalles de Orden {selectedOrder.order_number}
              </DialogTitle>
              <DialogDescription id="client-order-details-description">
                Información completa de la orden incluyendo productos, proveedores y detalles de entrega.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Order Status */}
              <div className="flex items-center gap-4">
                <Badge className={getStatusBadge(selectedOrder.status).className}>
                  {getStatusBadge(selectedOrder.status).text}
                </Badge>
                <Badge className={getPaymentStatusBadge(selectedOrder.payment_status).className}>
                  {getPaymentStatusBadge(selectedOrder.payment_status).text}
                </Badge>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Información de la Orden</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Fecha de orden:</span> {formatDate(selectedOrder.created_at)}</p>
                    {(selectedOrder as any).reservation_data?.appointment_date && (
                      <p><span className="font-medium">Fecha de cita:</span> {formatDate((selectedOrder as any).reservation_data.appointment_date)}</p>
                    )}
                    {(selectedOrder as any).reservation_data?.time_slot?.slot_start_time && (
                      <p><span className="font-medium">Horario:</span> {
                        `${(selectedOrder as any).reservation_data.time_slot.slot_start_time.substring(0, 5)} - ${(selectedOrder as any).reservation_data.time_slot.slot_end_time.substring(0, 5)}`
                      }</p>
                    )}
                    <p><span className="font-medium">Total:</span> {formatPrice(selectedOrder.grand_total, selectedOrder.currency)}</p>
                    <p><span className="font-medium">Método de Pago:</span> {selectedOrder.payment_method === 'service' ? 'Servicio' : selectedOrder.payment_method}</p>
                    {selectedOrder.delivered_at && (
                      <p><span className="font-medium">Entregado:</span> {formatDate(selectedOrder.delivered_at)}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {(selectedOrder as any).reservation_data ? 'Información de Contacto' : 'Información de Entrega'}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Nombre:</span> {selectedOrder.delivery_name || 'N/A'}</p>
                    <p><span className="font-medium">Teléfono:</span> {selectedOrder.delivery_phone || 'N/A'}</p>
                    {(selectedOrder as any).reservation_data?.client_email && (
                      <p><span className="font-medium">Email:</span> {(selectedOrder as any).reservation_data.client_email}</p>
                    )}
                    {selectedOrder.delivery_address && (
                      <p><span className="font-medium">Dirección:</span> {selectedOrder.delivery_address}</p>
                    )}
                    {selectedOrder.delivery_city && (
                      <p><span className="font-medium">Ciudad:</span> {selectedOrder.delivery_city}</p>
                    )}
                    {(selectedOrder.delivery_instructions || (selectedOrder as any).reservation_data?.notes) && (
                      <p><span className="font-medium">Notas:</span> {selectedOrder.delivery_instructions || (selectedOrder as any).reservation_data?.notes}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Productos y Servicios</h3>
                <div className="space-y-4">
                  {selectedOrder.order_items.map((item) => {
                    // Check if this is a service item (from reservation)
                    const isService = item.item_type === 'service';
                    const reservationData = (selectedOrder as any).reservation_data;
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4 flex-1">
                          {item.item_image_url ? (
                            <img 
                              src={item.item_image_url} 
                              alt={item.item_name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              {isService ? (
                                <Calendar className="w-8 h-8 text-gray-400" />
                              ) : (
                                <Package className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.item_name}</h4>
                            <p className="text-sm text-gray-600">{item.provider_name}</p>
                            <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                            
                            {/* Service-specific information */}
                            {isService && reservationData && (
                              <div className="mt-2 space-y-1">
                                {reservationData.appointment_date && (
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">Fecha de cita:</span> {formatDate(reservationData.appointment_date)}
                                  </p>
                                )}
                                {reservationData.time_slot_id && (
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">Horario:</span> {(() => {
                                      // Try to get time slot info if available
                                      const timeSlot = reservationData.time_slot;
                                      if (timeSlot?.slot_start_time && timeSlot?.slot_end_time) {
                                        return `${timeSlot.slot_start_time.substring(0, 5)} - ${timeSlot.slot_end_time.substring(0, 5)}`;
                                      }
                                      return 'Horario confirmado';
                                    })()}
                                  </p>
                                )}
                                {reservationData.notes && (
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">Notas:</span> {reservationData.notes}
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {item.item_description && !isService && (
                              <p className="text-xs text-gray-500 mt-1">{item.item_description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatPrice(item.total_price, item.currency)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatPrice(item.unit_price, item.currency)} c/u
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowOrderDetails(false)}
                >
                  Cerrar
                </Button>
                {selectedOrder.status === 'delivered' && (
                <Button
                    onClick={() => handleOrderAgain(selectedOrder)}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Pedir de Nuevo
                </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Review Modal */}
      {reviewOrderId && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setReviewOrderId(null);
          }}
          orderId={reviewOrderId}
          orderItems={orders.find(o => o.id === reviewOrderId)?.order_items || []}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Invoice Viewer */}
      {invoiceOrderId && (
        <InvoiceViewer
          isOpen={showInvoice}
          onClose={() => {
            setShowInvoice(false);
            setInvoiceOrderId(null);
          }}
          orderId={invoiceOrderId}
        />
      )}
    </div>
  );
};

export default ClientOrders;