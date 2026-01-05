import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { CreditCard, Package, MapPin, Phone, Mail, CheckCircle, Loader2, Heart, Divide, Star } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ isOpen, onClose, onSuccess }) => {
  const { state, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const { items, total, delivery_fee, grand_total } = state;

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [pets, setPets] = useState<any[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  // Store selected pets for each cart item: { itemId: [petId1, petId2, ...] }
  const [selectedPets, setSelectedPets] = useState<{ [itemId: string]: string[] }>({});
  // For food products, store whether to divide price
  const [dividePriceForFood, setDividePriceForFood] = useState<{ [itemId: string]: boolean }>({});
  const [addresses, setAddresses] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [useSavedCard, setUseSavedCard] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.email?.split('@')[0] || '',
    phone: '',
    address: '',
    city: '',
    deliveryInstructions: '',
    paymentMethod: 'card'
  });

  // Fetch user's pets, addresses, and cards
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      try {
        setLoadingPets(true);
        setLoadingAddresses(true);
        
        // Fetch pets
        const { data: petsData, error: petsError } = await supabase
          .from('pets')
          .select('id, name, species, breed, image_url')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });
        
        if (petsError) throw petsError;
        const petsList = petsData || [];
        setPets(petsList);
        
        // Auto-select first pet for all items if only one pet exists
        if (petsList.length === 1) {
          const singlePetId = petsList[0].id;
          const autoSelected: { [itemId: string]: string[] } = {};
          items.forEach(item => {
            autoSelected[item.id] = [singlePetId];
          });
          setSelectedPets(autoSelected);
        }

        // Fetch addresses
        const { data: addressesData, error: addressesError } = await supabase
          .from('client_addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });
        
        if (addressesError) throw addressesError;
        const addressesList = addressesData || [];
        setAddresses(addressesList);
        
        // Auto-select default address if exists
        const defaultAddress = addressesList.find((addr: any) => addr.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setUseSavedAddress(true);
          setFormData(prev => ({
            ...prev,
            fullName: defaultAddress.full_name,
            phone: defaultAddress.phone,
            address: defaultAddress.address,
            city: defaultAddress.city,
            deliveryInstructions: defaultAddress.delivery_instructions || ''
          }));
        }

        // Fetch payment cards
        const { data: cardsData, error: cardsError } = await supabase
          .from('payment_cards')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });
        
        if (cardsError) throw cardsError;
        const cardsList = cardsData || [];
        setCards(cardsList);
        
        // Auto-select default card if exists
        const defaultCard = cardsList.find((card: any) => card.is_default);
        if (defaultCard) {
          setSelectedCardId(defaultCard.id);
          setUseSavedCard(true);
          setFormData(prev => ({
            ...prev,
            paymentMethod: 'card'
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setPets([]);
        setAddresses([]);
        setCards([]);
      } finally {
        setLoadingPets(false);
        setLoadingAddresses(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [user, isOpen, items.length]); // Add items.length to dependency to re-run when items change

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const address = addresses.find(addr => addr.id === addressId);
    if (address) {
      setFormData(prev => ({
        ...prev,
        fullName: address.full_name,
        phone: address.phone,
        address: address.address,
        city: address.city,
        deliveryInstructions: address.delivery_instructions || ''
      }));
    }
  };

  const handleCardSelect = (cardId: string) => {
    setSelectedCardId(cardId);
    setFormData(prev => ({
      ...prev,
      paymentMethod: 'card'
    }));
  };

  const togglePetSelection = (itemId: string, petId: string) => {
    setSelectedPets(prev => {
      const currentPets = prev[itemId] || [];
      const isSelected = currentPets.includes(petId);
      
      if (isSelected) {
        return {
          ...prev,
          [itemId]: currentPets.filter(id => id !== petId)
        };
      } else {
        return {
          ...prev,
          [itemId]: [...currentPets, petId]
        };
      }
    });
  };

  const toggleDividePrice = (itemId: string) => {
    setDividePriceForFood(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const isFoodProduct = (item: any) => {
    // Check if item is a product and has category 'alimentos'
    return item.type === 'product' && item.product_category === 'alimentos';
  };

  const getItemPrice = (item: any) => {
    const selectedPetsForItem = selectedPets[item.id] || [];
    const shouldDivide = dividePriceForFood[item.id] && isFoodProduct(item) && selectedPetsForItem.length > 0;
    
    if (shouldDivide) {
      return item.price / selectedPetsForItem.length;
    }
    return item.price;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city) {
      toast({
        title: "⚠️ Información Requerida",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Check if user is authenticated
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Determine payment status based on payment method
      const paymentStatus = formData.paymentMethod === 'cash' ? 'completed' : 'completed'; // For now, all payments are completed
      
      // Generate order number ONCE and reuse it
      const generatedOrderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
      setOrderNumber(generatedOrderNumber); // Store it in state for display in success dialog
      
      // Debug: Log the data being sent
      console.log('Creating order with data:', {
        order_number: generatedOrderNumber,
        client_id: user?.id,
        total_amount: total,
        delivery_fee: delivery_fee,
        grand_total: grand_total,
        currency: items[0]?.currency || 'GTQ',
        payment_method: formData.paymentMethod,
        payment_status: paymentStatus,
        status: 'confirmed', // Set to confirmed since payment is completed
        delivery_name: formData.fullName,
        delivery_phone: formData.phone,
        delivery_address: formData.address,
        delivery_city: formData.city,
        delivery_instructions: formData.deliveryInstructions
      });

      // Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: generatedOrderNumber, // Use the same order number generated above
          client_id: user?.id,
          total_amount: total,
          delivery_fee: delivery_fee,
          grand_total: grand_total,
          currency: items[0]?.currency || 'GTQ',
          payment_method: formData.paymentMethod,
          payment_status: paymentStatus,
          status: 'confirmed', // Set to confirmed since payment is completed
          delivery_name: formData.fullName,
          delivery_phone: formData.phone,
          delivery_address: formData.address,
          delivery_city: formData.city,
          delivery_instructions: formData.deliveryInstructions
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Generate invoice number
      const generateInvoiceNumber = () => {
        const year = new Date().getFullYear();
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        return `INV-${year}-${Date.now().toString().slice(-6)}-${random}`;
      };

      const invoiceNumber = generateInvoiceNumber();

      // Get client information from user profile or form data
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('full_name, phone, address')
        .eq('user_id', user?.id)
        .maybeSingle(); // Use maybeSingle() to handle case when profile doesn't exist

      // Create invoice
      try {
        const invoiceInsertData = {
          order_id: orderData.id,
          invoice_number: invoiceNumber,
          client_id: user?.id,
          client_name: formData.fullName || userProfile?.full_name || user?.email?.split('@')[0] || 'Cliente',
          client_email: user?.email || null,
          client_phone: formData.phone || userProfile?.phone || null,
          client_address: formData.address || userProfile?.address || null,
          client_city: formData.city || null,
          subtotal: total,
          delivery_fee: delivery_fee,
          tax_amount: 0, // Can be calculated if needed
          discount_amount: 0, // Can be calculated if needed
          total_amount: grand_total,
          currency: items[0]?.currency || 'GTQ',
          payment_method: formData.paymentMethod,
          payment_status: paymentStatus,
          status: paymentStatus === 'completed' ? 'paid' : 'issued',
          paid_at: paymentStatus === 'completed' ? new Date().toISOString() : null,
          notes: formData.deliveryInstructions || null
        };

        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .insert(invoiceInsertData)
          .select()
          .single();

        if (invoiceError) {
          console.error('Error creating invoice:', invoiceError);
          console.error('Invoice data that failed:', invoiceInsertData);
          
          // Check if it's a "table doesn't exist" error
          if (invoiceError.code === '42P01' || invoiceError.message.includes('does not exist')) {
            console.warn('⚠️ Invoices table does not exist. Please run the supabase_invoices_table.sql script in Supabase SQL Editor.');
          }
          // Don't throw error - order was created successfully, invoice is optional
        } else {
          console.log('✅ Invoice created successfully:', invoiceData);
        }
      } catch (invoiceErr: any) {
        console.error('Unexpected error creating invoice:', invoiceErr);
        // Don't throw - order was created successfully
      }

      // Get provider user_ids for all items (needed for order_items foreign key)
      // The provider_id in cart items should be user_id, but we verify/convert if needed
      const uniqueProviderIds = [...new Set(items.map(item => item.provider_id))];
      const providerUserMap = new Map<string, string>();
      
      for (const providerId of uniqueProviderIds) {
        // First, check if providerId is already a user_id by checking if it exists in providers.user_id
        const { data: providerByUserId } = await supabase
          .from('providers')
          .select('user_id, id')
          .eq('user_id', providerId)
          .maybeSingle();
        
        if (providerByUserId?.user_id) {
          // providerId is already a user_id
          providerUserMap.set(providerId, providerId);
        } else {
          // Try to get user_id from providers table (in case providerId is providers.id)
          const { data: providerData } = await supabase
            .from('providers')
            .select('user_id, id')
            .eq('id', providerId)
            .maybeSingle();
          
          if (providerData?.user_id) {
            providerUserMap.set(providerId, providerData.user_id);
          } else {
            // Fallback: assume provider_id is already user_id (shouldn't happen, but safe fallback)
            console.warn(`Could not find user_id for provider_id: ${providerId}, using as-is`);
            providerUserMap.set(providerId, providerId);
          }
        }
      }

      // Create order items - provider_id must be user_id (foreign key to users table)
      const orderItems = items.map(item => {
        const providerUserId = providerUserMap.get(item.provider_id) || item.provider_id;
        
        return {
          order_id: orderData.id,
          provider_id: providerUserId, // Must be user_id for foreign key constraint
          item_type: item.type,
          // Use product_id (original UUID) for products, or service_id for services
          // item.id might have size suffix (e.g., "uuid_small") which is not a valid UUID
          item_id: item.type === 'service' 
            ? item.service_data?.service_id 
            : (item.product_id || item.id), // Use product_id if available (original UUID), fallback to item.id
          item_name: item.name,
          item_description: item.description,
          item_image_url: item.image_url,
          unit_price: item.price,
          quantity: item.quantity,
          total_price: item.price * item.quantity,
          currency: item.currency,
          provider_name: item.provider_name,
          provider_phone: null, // Optional field
          provider_address: null, // Optional field
          has_delivery: item.has_delivery || false,
          has_pickup: item.has_pickup || false,
          delivery_fee: item.delivery_fee || 0
        };
      });

      console.log('Creating order items with provider user_ids:', orderItems.map(item => ({
        item_name: item.item_name,
        provider_id: item.provider_id
      })));

      const { data: insertedOrderItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select('id');

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        console.error('Order items data:', orderItems);
        throw itemsError;
      }

      // Create pet associations for each order item
      if (insertedOrderItems && insertedOrderItems.length > 0) {
        const petAssociations: any[] = [];
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const orderItem = insertedOrderItems[i];
          const selectedPetsForItem = selectedPets[item.id] || [];
          const shouldDivide = dividePriceForFood[item.id] && isFoodProduct(item) && selectedPetsForItem.length > 0;
          const pricePerPet = shouldDivide ? item.price / selectedPetsForItem.length : null;
          
          // Create association for each selected pet
          for (const petId of selectedPetsForItem) {
            petAssociations.push({
              order_item_id: orderItem.id,
              pet_id: petId,
              price_per_pet: pricePerPet, // Store divided price if applicable
              quantity: shouldDivide ? 1 : item.quantity // If divided, each pet gets quantity 1
            });
          }
        }
        
        if (petAssociations.length > 0) {
          // Try to insert into order_item_pets table
          // If table doesn't exist, we'll catch the error and continue
          const { error: petsError } = await supabase
            .from('order_item_pets')
            .insert(petAssociations);
          
          if (petsError) {
            console.warn('Error creating pet associations (table might not exist):', petsError);
            console.log('Pet associations data:', petAssociations);
            // Don't throw - order was created successfully, just log the warning
            // The table might need to be created in Supabase
          } else {
            console.log('Successfully created pet associations:', petAssociations.length);
          }
        }
      }

      // Create service appointments for service items
      const serviceItems = items.filter(item => item.type === 'service');
      console.log('Service items to create appointments for:', serviceItems.length, serviceItems);
      
      if (serviceItems.length > 0) {
        // For each service item, we need to use the provider's user_id (not providers.id)
        // The foreign key service_appointments_provider_id_fkey references users.id, not providers.id
        const serviceAppointments = await Promise.all(serviceItems.map(async (item) => {
          console.log('Processing service item for appointment:', {
            service_id: item.service_data?.service_id,
            provider_id: item.provider_id, // This is already the user_id from the cart
            client_id: user?.id,
            appointment_date: item.service_data?.appointment_date
          });

          // The provider_id in the cart is already the user_id (from ServiceBookingModal)
          // The foreign key service_appointments_provider_id_fkey expects user_id, not providers.id
          // So we can use item.provider_id directly
          const providerUserId = item.provider_id;

          // Check if time_slot_id is a valid UUID (not a generated temporary ID)
          // Generated IDs start with "generated-" and are not valid UUIDs
          const timeSlotId = item.service_data?.time_slot_id;
          const isValidTimeSlotId = timeSlotId && 
            !timeSlotId.startsWith('generated-') && 
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(timeSlotId);
          
          const appointmentData = {
            service_id: item.service_data?.service_id,
            client_id: user?.id,
            provider_id: providerUserId, // Use user_id directly (foreign key expects users.id)
            appointment_date: item.service_data?.appointment_date,
            time_slot_id: isValidTimeSlotId ? timeSlotId : null, // Only use valid UUIDs, otherwise null
            status: 'pending',
            client_name: item.service_data?.client_name,
            client_phone: item.service_data?.client_phone,
            client_email: item.service_data?.client_email,
            notes: item.service_data?.notes,
            total_price: item.price * item.quantity,
            currency: item.currency
          };
          
          console.log('Appointment data to insert:', appointmentData);
          
          return appointmentData;
        }));

        console.log('All service appointments to insert:', serviceAppointments);

        const { data: insertedAppointments, error: appointmentsError } = await supabase
          .from('service_appointments')
          .insert(serviceAppointments)
          .select();

        if (appointmentsError) {
          console.error('Error creating service appointments:', appointmentsError);
          console.error('Appointments data that failed:', serviceAppointments);
          // Show warning toast but don't block the order completion
          toast({
            title: "⚠️ Advertencia",
            description: "La orden se creó exitosamente, pero hubo un problema al crear algunas citas. Por favor, contacta al proveedor.",
            variant: "destructive",
            duration: 8000,
          });
        } else {
          console.log('Successfully created service appointments:', insertedAppointments);
        }
      }
      
      // Set success state
      setIsSuccess(true);
      
      // Show success toast with order details
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      toast({
        title: "✅ ¡Compra Realizada Exitosamente!",
        description: `Tu orden ${generatedOrderNumber} ha sido procesada correctamente. Total: ${items[0]?.currency === 'GTQ' ? 'Q.' : '$'}${grand_total.toFixed(2)} (${totalItems} ${totalItems === 1 ? 'artículo' : 'artículos'})`,
        variant: "default",
        duration: 7000,
      });

      // Clear cart after successful payment
      setTimeout(() => {
        clearCart();
        onSuccess();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        error: error
      });
      toast({
        title: "❌ Error en el Pago",
        description: `Hubo un problema procesando tu pago: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md text-center" aria-describedby="order-success-description">
          <DialogHeader>
            <DialogTitle>¡Orden Confirmada!</DialogTitle>
          </DialogHeader>
          <div className="py-8" id="order-success-description">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Gracias por tu compra!
            </h3>
            <p className="text-gray-600 mb-4">
              Tu orden ha sido procesada exitosamente. Recibirás un email de confirmación.
            </p>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800 font-mono">
                <strong>Número de Orden:</strong> {orderNumber || 'N/A'}
              </p>
              <p className="text-xs text-green-600 mt-2">
                Puedes copiar este número para buscar tu orden en "Mis Órdenes"
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="checkout-form-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Finalizar Compra
            </DialogTitle>
          </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="checkout-form-description">
          {/* Order Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resumen de la Orden</h3>
            
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-12 h-12 rounded-md overflow-hidden border bg-gray-100 flex items-center justify-center">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.provider_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {item.type === 'product' ? 'Producto' : 'Servicio'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Cantidad: {item.quantity}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {item.currency === 'GTQ' ? 'Q.' : '$'}{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Totals */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-medium">
                  {items[0]?.currency === 'GTQ' ? 'Q.' : '$'}{total.toFixed(2)}
                </span>
              </div>
              {delivery_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Costo de entrega:</span>
                  <span className="font-medium">Q.{delivery_fee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold border-t pt-3">
                <span>Total:</span>
                <span>{items[0]?.currency === 'GTQ' ? 'Q.' : '$'}{grand_total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="space-y-4">
            {/* Pet Selection Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Vincular a Mascotas
              </h3>
              
              {loadingPets ? (
                <div className="text-center py-4 text-gray-500">
                  Cargando mascotas...
                </div>
              ) : pets.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ No tienes mascotas registradas. Por favor registra al menos una mascota antes de realizar una compra.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const selectedPetsForItem = selectedPets[item.id] || [];
                    const isFood = isFoodProduct(item);
                    const shouldDivide = dividePriceForFood[item.id] && isFood && selectedPetsForItem.length > 0;
                    const itemPrice = shouldDivide ? item.price / selectedPetsForItem.length : item.price;
                    
                    return (
                      <Card key={item.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-md object-cover" />
                            ) : (
                              <Package className="w-12 h-12 text-gray-400" />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                              <p className="text-sm text-gray-500">{item.provider_name}</p>
                              <Badge variant="outline" className="mt-1">
                                {item.type === 'product' ? 'Producto' : 'Servicio'}
                              </Badge>
                            </div>
                          </div>
                          
                          <Label className="text-sm font-medium mb-2 block">
                            Selecciona mascota(s) para este {item.type === 'product' ? 'producto' : 'servicio'} *
                          </Label>
                          
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {pets.map((pet) => {
                              const isSelected = selectedPetsForItem.includes(pet.id);
                              return (
                                <div
                                  key={pet.id}
                                  onClick={() => togglePetSelection(item.id, pet.id)}
                                  className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'border-pink-500 bg-pink-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => togglePetSelection(item.id, pet.id)}
                                  />
                                  {pet.image_url ? (
                                    <img src={pet.image_url} alt={pet.name} className="w-8 h-8 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                      {pet.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="text-sm font-medium">{pet.name}</span>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Divide price option for food products */}
                          {isFood && selectedPetsForItem.length > 1 && (
                            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                              <Checkbox
                                checked={dividePriceForFood[item.id] || false}
                                onCheckedChange={() => toggleDividePrice(item.id)}
                              />
                              <Label className="text-sm cursor-pointer flex items-center gap-2">
                                <Divide className="w-4 h-4 text-blue-600" />
                                Dividir precio entre {selectedPetsForItem.length} mascotas
                                <span className="text-xs text-gray-600">
                                  ({item.currency === 'GTQ' ? 'Q.' : '$'}{itemPrice.toFixed(2)} por mascota)
                                </span>
                              </Label>
                            </div>
                          )}
                          
                          {selectedPetsForItem.length > 0 && (
                            <div className="mt-2 text-xs text-gray-600">
                              {selectedPetsForItem.length} {selectedPetsForItem.length === 1 ? 'mascota seleccionada' : 'mascotas seleccionadas'}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold">Información de Entrega</h3>
            
            {/* Saved Addresses Section */}
            {addresses.length > 0 && (
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Usar dirección guardada</Label>
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    id="use-saved-address"
                    checked={useSavedAddress}
                    onChange={(e) => {
                      setUseSavedAddress(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedAddressId(null);
                        setFormData(prev => ({
                          ...prev,
                          fullName: user?.email?.split('@')[0] || '',
                          phone: '',
                          address: '',
                          city: '',
                          deliveryInstructions: ''
                        }));
                      } else if (selectedAddressId) {
                        handleAddressSelect(selectedAddressId);
                      }
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="use-saved-address" className="cursor-pointer text-sm">
                    Seleccionar de mis direcciones guardadas
                  </Label>
                </div>
                {useSavedAddress && (
                  <Select value={selectedAddressId || ''} onValueChange={handleAddressSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una dirección" />
                    </SelectTrigger>
                    <SelectContent>
                      {addresses.map((address: any) => (
                        <SelectItem key={address.id} value={address.id}>
                          <div className="flex items-center space-x-2">
                            <span>{address.label}</span>
                            {address.is_default && (
                              <Badge variant="default" className="ml-2 bg-orange-500">
                                <Star size={10} className="mr-1" />
                                Predeterminada
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {(!useSavedAddress || addresses.length === 0) && (
                <>
                  <div>
                    <Label htmlFor="fullName">Nombre Completo *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Tu nombre completo"
                      required
                      disabled={useSavedAddress && selectedAddressId !== null}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+502 1234-5678"
                      required
                      disabled={useSavedAddress && selectedAddressId !== null}
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Dirección *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Dirección completa"
                      required
                      disabled={useSavedAddress && selectedAddressId !== null}
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Ciudad"
                      required
                      disabled={useSavedAddress && selectedAddressId !== null}
                    />
                  </div>

                  <div>
                    <Label htmlFor="deliveryInstructions">Instrucciones de Entrega</Label>
                    <Textarea
                      id="deliveryInstructions"
                      value={formData.deliveryInstructions}
                      onChange={(e) => handleInputChange('deliveryInstructions', e.target.value)}
                      placeholder="Instrucciones especiales para la entrega..."
                      rows={3}
                      disabled={useSavedAddress && selectedAddressId !== null}
                    />
                  </div>
                </>
              )}

              {useSavedAddress && selectedAddressId && (
                <Card className="bg-gray-50 border-2 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-5 h-5 text-orange-500" />
                      <span className="font-semibold text-gray-800">
                        {addresses.find((a: any) => a.id === selectedAddressId)?.label}
                      </span>
                      {addresses.find((a: any) => a.id === selectedAddressId)?.is_default && (
                        <Badge variant="default" className="bg-orange-500">
                          <Star size={10} className="mr-1" />
                          Predeterminada
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-medium text-gray-800">{formData.fullName}</p>
                      <p>{formData.phone}</p>
                      <p>{formData.address}</p>
                      <p>{formData.city}</p>
                      {formData.deliveryInstructions && (
                        <p className="text-xs text-gray-500 italic mt-2">
                          {formData.deliveryInstructions}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Saved Payment Cards Section */}
              {cards.length > 0 && formData.paymentMethod === 'card' && (
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Usar tarjeta guardada</Label>
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="checkbox"
                      id="use-saved-card"
                      checked={useSavedCard}
                      onChange={(e) => {
                        setUseSavedCard(e.target.checked);
                        if (!e.target.checked) {
                          setSelectedCardId(null);
                        } else if (selectedCardId) {
                          handleCardSelect(selectedCardId);
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor="use-saved-card" className="cursor-pointer text-sm">
                      Seleccionar de mis tarjetas guardadas
                    </Label>
                  </div>
                  {useSavedCard && (
                    <Select value={selectedCardId || ''} onValueChange={handleCardSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una tarjeta" />
                      </SelectTrigger>
                      <SelectContent>
                        {cards.map((card: any) => (
                          <SelectItem key={card.id} value={card.id}>
                            <div className="flex items-center space-x-2">
                              <span>{card.label} - **** {card.card_number_last_four}</span>
                              {card.is_default && (
                                <Badge variant="default" className="ml-2 bg-blue-500">
                                  <Star size={10} className="mr-1" />
                                  Predeterminada
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="paymentMethod">Método de Pago</Label>
                <select
                  id="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(e) => {
                    handleInputChange('paymentMethod', e.target.value);
                    if (e.target.value !== 'card') {
                      setUseSavedCard(false);
                      setSelectedCardId(null);
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="card">Tarjeta de Crédito/Débito</option>
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia Bancaria</option>
                </select>
              </div>

              {/* Payment Method Info */}
              {formData.paymentMethod === 'card' && (
                <>
                  {useSavedCard && selectedCardId && (
                    <Card className="bg-blue-50 border-2 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CreditCard className="w-5 h-5 text-blue-500" />
                          <span className="font-semibold text-gray-800">
                            {cards.find((c: any) => c.id === selectedCardId)?.label}
                          </span>
                          {cards.find((c: any) => c.id === selectedCardId)?.is_default && (
                            <Badge variant="default" className="bg-blue-500">
                              <Star size={10} className="mr-1" />
                              Predeterminada
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="font-mono text-lg font-semibold">
                            **** **** **** {cards.find((c: any) => c.id === selectedCardId)?.card_number_last_four}
                          </p>
                          <p>{cards.find((c: any) => c.id === selectedCardId)?.card_holder_name}</p>
                          <p>
                            {cards.find((c: any) => c.id === selectedCardId)?.expiry_month.toString().padStart(2, '0')}/
                            {cards.find((c: any) => c.id === selectedCardId)?.expiry_year}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {!useSavedCard && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Información de Pago</h4>
                      <p className="text-sm text-blue-800">
                        💳 Para esta demostración, el pago se procesará automáticamente.
                        <br />
                        🔒 En producción, se integrará con pasarelas de pago seguras.
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando Pago...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Confirmar Pago - {items[0]?.currency === 'GTQ' ? 'Q.' : '$'}{grand_total.toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Checkout;
