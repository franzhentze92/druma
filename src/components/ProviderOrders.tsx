import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Calendar,
  MapPin,
  Phone,
  CreditCard,
  Eye,
  User,
  AlertCircle,
  Coins,
  Play,
  RotateCcw,
  CheckSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface ProviderOrder {
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
  client_email?: string;
  order_items: ProviderOrderItem[];
}

interface ProviderOrderItem {
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
  provider_name: string;
  has_delivery: boolean;
  has_pickup: boolean;
  delivery_fee: number;
  created_at: string;
}

const ProviderOrders: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<ProviderOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ProviderOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<keyof ProviderOrder>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch provider orders
  const fetchProviderOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      console.log('Fetching provider orders for user:', user.id);
      
      // Get orders that contain items from this provider
      const { data: orderItemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          orders (*)
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Order items query result:', { 
        count: orderItemsData?.length || 0, 
        itemsError 
      });

      if (itemsError) throw itemsError;

        // Get unique order IDs to fetch client emails
        const orderIds = [...new Set(orderItemsData?.map(item => item.order_id) || [])];
        
        // Fetch client emails separately from orders table
        const clientEmailsMap = new Map<string, string>();
        if (orderIds.length > 0) {
          try {
            const { data: ordersData, error: ordersError } = await supabase
              .from('orders')
              .select('id, client_email')
              .in('id', orderIds);
            
            if (!ordersError && ordersData) {
              ordersData.forEach(order => {
                clientEmailsMap.set(order.id, order.client_email || 'N/A');
              });
            }
          } catch (error) {
            console.log('Could not fetch client emails:', error);
          }
        }

        // Group order items by order_id and create order objects
        const ordersMap = new Map<string, ProviderOrder>();
        
        orderItemsData?.forEach((item) => {
          const order = item.orders;
          if (!order) return;

          const orderId = order.id;
          
          if (!ordersMap.has(orderId)) {
            ordersMap.set(orderId, {
              id: order.id,
              order_number: order.order_number,
              total_amount: order.total_amount,
              delivery_fee: order.delivery_fee,
              grand_total: order.grand_total,
              currency: order.currency,
              status: order.status,
              payment_method: order.payment_method,
              payment_status: order.payment_status,
              delivery_name: order.delivery_name,
              delivery_phone: order.delivery_phone,
              delivery_address: order.delivery_address,
              delivery_city: order.delivery_city,
              delivery_instructions: order.delivery_instructions,
              created_at: order.created_at,
              delivered_at: order.delivered_at,
              client_email: clientEmailsMap.get(order.id) || 'N/A',
              order_items: []
            });
          }

          // Add this provider's items to the order
          ordersMap.get(orderId)?.order_items.push({
            id: item.id,
            item_type: item.item_type,
            item_id: item.item_id,
            item_name: item.item_name,
            item_description: item.item_description,
            item_image_url: item.item_image_url,
            unit_price: item.unit_price,
            quantity: item.quantity,
            total_price: item.total_price,
            currency: item.currency,
            provider_name: item.provider_name,
            has_delivery: item.has_delivery,
            has_pickup: item.has_pickup,
            delivery_fee: item.delivery_fee,
            created_at: item.created_at
          });
        });

        const ordersArray = Array.from(ordersMap.values());
        console.log('Processed orders:', ordersArray.length, ordersArray.map(o => ({
          id: o.id,
          order_number: o.order_number,
          status: o.status,
          created_at: o.created_at
        })));
        setOrders(ordersArray);
      } catch (error) {
        console.error('Error fetching provider orders:', error);
        console.error('Full error object:', error);
        
        // Log more specific error details
        if (error && typeof error === 'object' && 'code' in error) {
          console.error('Error code:', (error as any).code);
          console.error('Error message:', (error as any).message);
          console.error('Error details:', (error as any).details);
        }
        
        toast({
          title: "❌ Error",
          description: "No se pudieron cargar las órdenes",
          variant: "destructive",
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchProviderOrders();
  }, [user, toast]);

  // Get status badge variant with distinct colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          variant: 'secondary' as const, 
          icon: Clock, 
          label: 'Pendiente',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
        };
      case 'confirmed':
        return { 
          variant: 'default' as const, 
          icon: CheckCircle, 
          label: 'Confirmada',
          className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
        };
      case 'processing':
        return { 
          variant: 'default' as const, 
          icon: Package, 
          label: 'Procesando',
          className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200'
        };
      case 'shipped':
        return { 
          variant: 'default' as const, 
          icon: Truck, 
          label: 'Enviada',
          className: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200'
        };
      case 'delivered':
        return { 
          variant: 'default' as const, 
          icon: CheckCircle, 
          label: 'Entregada',
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
        };
      case 'cancelled':
        return { 
          variant: 'destructive' as const, 
          icon: XCircle, 
          label: 'Cancelada',
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
        };
      default:
        return { 
          variant: 'secondary' as const, 
          icon: Clock, 
          label: status,
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
        };
    }
  };

  // Get payment status badge with distinct colors
  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'completed':
        return { 
          variant: 'default' as const, 
          label: 'Pagado',
          className: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
        };
      case 'pending':
        return { 
          variant: 'secondary' as const, 
          label: 'Pendiente',
          className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200'
        };
      case 'failed':
        return { 
          variant: 'destructive' as const, 
          label: 'Falló',
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
        };
      case 'refunded':
        return { 
          variant: 'outline' as const, 
          label: 'Reembolsado',
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
        };
      default:
        return { 
          variant: 'secondary' as const, 
          label: paymentStatus,
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
        };
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      
      console.log('Updating order status:', { orderId, newStatus });
      
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }
      
      console.log('Update data:', updateData);
      
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      console.log('Update result:', { updatedOrder, error });

      if (error) {
        console.error('Error updating order:', error);
        console.error('Error details:', {
          code: (error as any).code,
          message: (error as any).message,
          details: (error as any).details,
          hint: (error as any).hint
        });
        throw error;
      }

      if (!updatedOrder) {
        console.error('No updated order returned from database');
        throw new Error('No se recibió confirmación de la actualización');
      }

      console.log('Order updated successfully:', updatedOrder);
      console.log('Updated order status:', updatedOrder.status);

      // Verify the update was successful by checking the returned data
      if (updatedOrder.status !== newStatus) {
        console.error('Status mismatch! Expected:', newStatus, 'Got:', updatedOrder.status);
        throw new Error(`El estado no se actualizó correctamente. Esperado: ${newStatus}, Obtenido: ${updatedOrder.status}`);
      }

      // Reload orders from database to ensure we have the latest data
      console.log('Reloading orders from database...');
      await fetchProviderOrders();
      console.log('Orders reloaded successfully');

      // Update local state as backup
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: newStatus,
                updated_at: updateData.updated_at,
                ...(newStatus === 'delivered' && { delivered_at: updateData.delivered_at })
              }
            : order
        )
      );

      // Update selected order if it's the one being updated
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? {
          ...prev,
          status: newStatus,
          updated_at: updateData.updated_at,
          ...(newStatus === 'delivered' && { delivered_at: updateData.delivered_at })
        } : null);
      }

      const statusMessages = {
        'confirmed': '✅ Orden Confirmada',
        'processing': '🔄 Orden en Procesamiento',
        'shipped': '🚚 Orden Enviada',
        'delivered': '🎯 Orden Entregada',
        'cancelled': '❌ Orden Cancelada'
      };

      const statusDescriptions = {
        'confirmed': 'La orden ha sido confirmada y está lista para procesar.',
        'processing': 'La orden está siendo preparada.',
        'shipped': 'La orden ha sido enviada al cliente.',
        'delivered': 'La orden ha sido entregada exitosamente.',
        'cancelled': 'La orden ha sido cancelada.'
      };

      toast({
        title: statusMessages[newStatus as keyof typeof statusMessages] || 'Estado Actualizado',
        description: statusDescriptions[newStatus as keyof typeof statusDescriptions] || 'El estado de la orden ha sido actualizado.',
        variant: newStatus === 'cancelled' ? 'destructive' : 'default',
        duration: 4000,
      });

    } catch (error) {
      console.error('Error updating order status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "❌ Error al Actualizar",
        description: `No se pudo actualizar el estado de la orden: ${errorMessage}`,
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Get all possible status options
  const getAllStatusOptions = () => {
    return [
      { value: 'pending', label: 'Pendiente', icon: Clock },
      { value: 'confirmed', label: 'Confirmada', icon: CheckCircle },
      { value: 'processing', label: 'Procesando', icon: Play },
      { value: 'shipped', label: 'Enviada', icon: Truck },
      { value: 'delivered', label: 'Entregada', icon: CheckSquare },
      { value: 'cancelled', label: 'Cancelada', icon: XCircle }
    ];
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    const options = getAllStatusOptions();
    return options.find(opt => opt.value === status)?.label || status;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle view order details
  const handleViewDetails = (order: ProviderOrder) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    
    // Payment status filter
    if (paymentStatusFilter !== 'all' && order.payment_status !== paymentStatusFilter) return false;
    
    // Date range filter
    if (dateRangeFilter !== 'all') {
      const orderDate = new Date(order.created_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (dateRangeFilter) {
        case 'today':
          const todayStart = new Date(today);
          const todayEnd = new Date(today);
          todayEnd.setHours(23, 59, 59, 999);
          if (orderDate < todayStart || orderDate > todayEnd) return false;
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (orderDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          if (orderDate < monthAgo) return false;
          break;
        case 'year':
          const yearAgo = new Date(today);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          if (orderDate < yearAgo) return false;
          break;
      }
    }
    
    // Search query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchesOrderNumber = order.order_number.toLowerCase().includes(query);
      const matchesClientName = order.delivery_name?.toLowerCase().includes(query) || false;
      const matchesClientEmail = order.client_email?.toLowerCase().includes(query) || false;
      const matchesClientPhone = order.delivery_phone?.toLowerCase().includes(query) || false;
      
      if (!matchesOrderNumber && !matchesClientName && !matchesClientEmail && !matchesClientPhone) {
        return false;
      }
    }
    
    return true;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue: any = a[sortColumn];
    let bValue: any = b[sortColumn];
    
    // Handle nested values
    if (sortColumn === 'order_number') {
      aValue = a.order_number;
      bValue = b.order_number;
    } else if (sortColumn === 'grand_total') {
      // Calculate provider total for each order
      aValue = a.order_items.reduce((sum, item) => sum + item.total_price, 0);
      bValue = b.order_items.reduce((sum, item) => sum + item.total_price, 0);
    }
    
    // Handle dates
    if (sortColumn === 'created_at' || sortColumn === 'delivered_at') {
      aValue = new Date(aValue || 0).getTime();
      bValue = new Date(bValue || 0).getTime();
    }
    
    // Handle strings
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    // Compare values
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Handle column sort
  const handleSort = (column: keyof ProviderOrder) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc'); // Default to descending for new columns
    }
  };

  // Get sort icon
  const getSortIcon = (column: keyof ProviderOrder) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-gray-600" />
      : <ArrowDown className="w-4 h-4 text-gray-600" />;
  };

  // Calculate KPIs
  const totalRevenue = orders
    .filter(order => order.payment_status === 'completed')
    .reduce((sum, order) => {
      const providerTotal = order.order_items.reduce((itemSum, item) => itemSum + item.total_price, 0);
      return sum + providerTotal;
    }, 0);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const confirmedOrders = orders.filter(order => order.status === 'confirmed').length;
  const processingOrders = orders.filter(order => order.status === 'processing').length;
  const shippedOrders = orders.filter(order => order.status === 'shipped').length;
  const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
  const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
  
  // Monthly revenue (current month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = orders
    .filter(order => {
      const orderDate = new Date(order.created_at);
      return order.payment_status === 'completed' && 
             orderDate.getMonth() === currentMonth && 
             orderDate.getFullYear() === currentYear;
    })
    .reduce((sum, order) => {
      const providerTotal = order.order_items.reduce((itemSum, item) => itemSum + item.total_price, 0);
      return sum + providerTotal;
    }, 0);

  // Average order value
  const averageOrderValue = totalOrders > 0 
    ? orders.reduce((sum, order) => {
        const providerTotal = order.order_items.reduce((itemSum, item) => itemSum + item.total_price, 0);
        return sum + providerTotal;
      }, 0) / totalOrders
    : 0;

  // Paid vs Pending revenue
  const paidRevenue = orders
    .filter(order => order.payment_status === 'completed')
    .reduce((sum, order) => {
      const providerTotal = order.order_items.reduce((itemSum, item) => itemSum + item.total_price, 0);
      return sum + providerTotal;
    }, 0);

  const pendingRevenue = orders
    .filter(order => order.payment_status === 'pending')
    .reduce((sum, order) => {
      const providerTotal = order.order_items.reduce((itemSum, item) => itemSum + item.total_price, 0);
      return sum + providerTotal;
    }, 0);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Órdenes Recibidas</h1>
        <p className="text-gray-600">Gestiona las órdenes de tus productos y servicios</p>
      </div>

      {/* Enhanced Stats Cards - All Status KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ingresos Totales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">Q.{totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Este mes: Q.{monthlyRevenue.toFixed(2)}</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <Coins className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingOrders}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  {totalOrders > 0 ? ((pendingOrders / totalOrders) * 100).toFixed(0) : 0}% del total
                </p>
              </div>
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-7 h-7 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confirmadas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{confirmedOrders}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {totalOrders > 0 ? ((confirmedOrders / totalOrders) * 100).toFixed(0) : 0}% del total
                </p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Procesando</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{processingOrders}</p>
                <p className="text-xs text-purple-600 mt-1">
                  {totalOrders > 0 ? ((processingOrders / totalOrders) * 100).toFixed(0) : 0}% del total
                </p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <Play className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Enviadas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{shippedOrders}</p>
                <p className="text-xs text-indigo-600 mt-1">
                  {totalOrders > 0 ? ((shippedOrders / totalOrders) * 100).toFixed(0) : 0}% del total
                </p>
              </div>
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Truck className="w-7 h-7 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Entregadas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{deliveredOrders}</p>
                <p className="text-xs text-emerald-600 mt-1">
                  {totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(0) : 0}% del total
                </p>
              </div>
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckSquare className="w-7 h-7 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Órdenes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
                <p className="text-xs text-gray-500 mt-1">Promedio: Q.{averageOrderValue.toFixed(2)}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Canceladas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{cancelledOrders}</p>
                <p className="text-xs text-red-600 mt-1">
                  {totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(0) : 0}% del total
                </p>
              </div>
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-7 h-7 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-gray-700 mb-1 block">Buscar</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Orden, cliente, email, teléfono..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm pl-9 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <Package className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmadas</option>
                <option value="processing">Procesando</option>
                <option value="shipped">Enviadas</option>
                <option value="delivered">Entregadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Pago</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="completed">Pagado</option>
                <option value="pending">Pendiente</option>
                <option value="failed">Fallido</option>
                <option value="refunded">Reembolsado</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Período</label>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="year">Último año</option>
              </select>
            </div>
          </div>

          {/* Active Filters Badges */}
          {(statusFilter !== 'all' || paymentStatusFilter !== 'all' || dateRangeFilter !== 'all' || searchQuery.trim() !== '') && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-xs font-medium text-gray-600">Filtros activos:</span>
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Estado: {getStatusLabel(statusFilter)}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-2 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {paymentStatusFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Pago: {paymentStatusFilter === 'completed' ? 'Pagado' : paymentStatusFilter === 'pending' ? 'Pendiente' : paymentStatusFilter}
                  <button
                    onClick={() => setPaymentStatusFilter('all')}
                    className="ml-2 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {dateRangeFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {dateRangeFilter === 'today' ? 'Hoy' : dateRangeFilter === 'week' ? 'Última semana' : dateRangeFilter === 'month' ? 'Último mes' : 'Último año'}
                  <button
                    onClick={() => setDateRangeFilter('all')}
                    className="ml-2 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {searchQuery.trim() !== '' && (
                <Badge variant="secondary" className="text-xs">
                  Buscar: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-2 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setPaymentStatusFilter('all');
                  setDateRangeFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs text-gray-600 hover:text-gray-900 underline ml-2"
              >
                Limpiar todos
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Table */}
      {sortedOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {orders.length === 0 ? 'No tienes órdenes aún' : 'No hay órdenes con este filtro'}
            </h3>
            <p className="text-gray-600">
              {orders.length === 0 
                ? 'Cuando los clientes compren tus productos o servicios, aparecerán aquí'
                : 'Intenta cambiar el filtro para ver más órdenes'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('order_number')}
                    >
                      <div className="flex items-center gap-2">
                        Orden
                        {getSortIcon('order_number')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        Fecha
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('delivery_name')}
                    >
                      <div className="flex items-center gap-2">
                        Cliente
                        {getSortIcon('delivery_name')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('grand_total')}
                    >
                      <div className="flex items-center gap-2">
                        Total
                        {getSortIcon('grand_total')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Estado
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('payment_status')}
                    >
                      <div className="flex items-center gap-2">
                        Pago
                        {getSortIcon('payment_status')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedOrders.map((order) => {
                    const statusBadge = getStatusBadge(order.status);
                    const paymentBadge = getPaymentStatusBadge(order.payment_status);
                    const providerTotal = order.order_items.reduce((sum, item) => sum + item.total_price, 0);
                    const totalItems = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
                    
                    // Determine order type based on items
                    const hasProducts = order.order_items.some(item => item.item_type === 'product');
                    const hasServices = order.order_items.some(item => item.item_type === 'service');
                    const orderType = hasProducts && hasServices ? 'Mixto' : hasProducts ? 'Producto' : 'Servicio';
                    const OrderTypeIcon = hasProducts && hasServices ? Package : hasProducts ? Package : Calendar;
                    const orderTypeColor = hasProducts && hasServices ? 'text-purple-600' : hasProducts ? 'text-blue-600' : 'text-emerald-600';
                    
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{order.order_number}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(order.created_at)}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleTimeString('es-GT', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{order.delivery_name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{order.client_email || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-600">{order.delivery_phone || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{totalItems} {totalItems === 1 ? 'item' : 'items'}</div>
                          <div className="text-xs text-gray-500">{order.order_items.length} {order.order_items.length === 1 ? 'tipo' : 'tipos'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <OrderTypeIcon className={`w-4 h-4 ${orderTypeColor}`} />
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${orderTypeColor} border-current`}
                            >
                              {orderType}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {order.currency === 'GTQ' ? 'Q.' : '$'}{providerTotal.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={statusBadge.variant} className={`flex items-center gap-1 w-fit ${statusBadge.className}`}>
                            <statusBadge.icon className="w-3 h-3" />
                            {statusBadge.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={paymentBadge.variant} className={`w-fit ${paymentBadge.className}`}>
                            {paymentBadge.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(order)}
                              className="h-8"
                              title="Ver Detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Select
                              value={order.status}
                              onValueChange={(newStatus) => {
                                if (newStatus !== order.status) {
                                  updateOrderStatus(order.id, newStatus);
                                }
                              }}
                              disabled={updatingStatus === order.id}
                            >
                              <SelectTrigger className="w-[160px] h-8 text-xs">
                                <SelectValue>
                                  {updatingStatus === order.id ? 'Actualizando...' : getStatusLabel(order.status)}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="z-[10000]">
                                {getAllStatusOptions().map((option) => {
                                  const IconComponent = option.icon;
                                  return (
                                    <SelectItem 
                                      key={option.value} 
                                      value={option.value}
                                      disabled={option.value === order.status}
                                    >
                                      <div className="flex items-center gap-2">
                                        <IconComponent className="w-3 h-3" />
                                        <span>{option.label}</span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="order-details-description">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Detalles de Orden {selectedOrder.order_number}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6" id="order-details-description">
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Información de la Orden</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <Badge variant={getStatusBadge(selectedOrder.status).variant} className={getStatusBadge(selectedOrder.status).className}>
                        {getStatusBadge(selectedOrder.status).label}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pago:</span>
                      <Badge variant={getPaymentStatusBadge(selectedOrder.payment_status).variant} className={getPaymentStatusBadge(selectedOrder.payment_status).className}>
                        {getPaymentStatusBadge(selectedOrder.payment_status).label}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha:</span>
                      <span>{formatDate(selectedOrder.created_at)}</span>
                    </div>
                    {selectedOrder.delivered_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Entregado:</span>
                        <span>{formatDate(selectedOrder.delivered_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Información del Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Nombre:</span>
                      <p>{selectedOrder.delivery_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p>{selectedOrder.client_email}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Teléfono:</span>
                      <p>{selectedOrder.delivery_phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Dirección:</span>
                      <p>{selectedOrder.delivery_address}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Ciudad:</span>
                      <p>{selectedOrder.delivery_city}</p>
                    </div>
                    {selectedOrder.delivery_instructions && (
                      <div>
                        <span className="text-gray-600">Instrucciones:</span>
                        <p>{selectedOrder.delivery_instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Provider's Order Items */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Tus Productos en esta Orden</h3>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 rounded-md overflow-hidden border bg-gray-100 flex items-center justify-center">
                        {item.item_image_url ? (
                          <img 
                            src={item.item_image_url} 
                            alt={item.item_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.item_name}</h4>
                        {item.item_description && (
                          <p className="text-sm text-gray-500 mt-1">{item.item_description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline">
                            {item.item_type === 'product' ? 'Producto' : 'Servicio'}
                          </Badge>
                          {item.has_delivery && (
                            <Badge variant="secondary">🚚 Entrega</Badge>
                          )}
                          {item.has_pickup && (
                            <Badge variant="secondary">🏪 Recogida</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {item.quantity}x Q.{item.unit_price}
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          Q.{item.total_price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Provider's Earnings */}
              <div className="border-t pt-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Tus Ganancias</h3>
                  <div className="text-2xl font-bold text-green-900">
                    Q.{selectedOrder.order_items.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Por {selectedOrder.order_items.length} {selectedOrder.order_items.length === 1 ? 'producto' : 'productos'}
                  </p>
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Cambiar Estado</h3>
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(newStatus) => {
                      if (newStatus !== selectedOrder.status) {
                        updateOrderStatus(selectedOrder.id, newStatus);
                      }
                    }}
                    disabled={updatingStatus === selectedOrder.id}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue>
                        {updatingStatus === selectedOrder.id ? 'Actualizando...' : getStatusLabel(selectedOrder.status)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      {getAllStatusOptions().map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
                            disabled={option.value === selectedOrder.status}
                          >
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowOrderDetails(false)}
                  className="flex-1"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProviderOrders;
