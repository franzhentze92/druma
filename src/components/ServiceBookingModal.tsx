import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Building2, User, Phone, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { getServicePricingConfig, hasServiceSizePricing } from '@/config/servicePricing';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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

interface ServiceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ProviderService | null;
  onBookingSuccess: () => void;
}

interface TimeSlot {
  id: string;
  service_id: string;
  day_of_week: number;
  slot_start_time: string;
  slot_end_time: string;
  is_available: boolean;
  created_at: string;
}

interface Availability {
  id: string;
  service_id: string;
  day_of_week: number;
  slot_start_time: string;
  slot_end_time: string;
  is_available: boolean;
  created_at: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' }
];

const ServiceBookingModal: React.FC<ServiceBookingModalProps> = ({
  isOpen,
  onClose,
  service,
  onBookingSuccess
}) => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    name: '',
    phone: '',
    email: user?.email || '',
    notes: ''
  });

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Calculate price based on selected size
  const getServicePrice = (): number => {
    if (!service) return 0;
    
    const pricingConfig = getServicePricingConfig(service.service_category);
    const hasSizePricing = pricingConfig.system === 'dog_size';
    
    if (hasSizePricing && selectedSize) {
      const sizePriceMap: { [key: string]: number | null | undefined } = {
        'small': service.price_small,
        'medium': service.price_medium,
        'large': service.price_large,
        'extra_large': service.price_extra_large
      };
      
      const sizePrice = sizePriceMap[selectedSize];
      if (sizePrice !== null && sizePrice !== undefined) {
        return sizePrice;
      }
    }
    
    // Fallback to general price
    return service.price || 0;
  };

  // Auto-select first available size when service changes
  useEffect(() => {
    if (service) {
      const pricingConfig = getServicePricingConfig(service.service_category);
      const hasSizePricing = pricingConfig.system === 'dog_size';
      
      if (hasSizePricing && pricingConfig.sizeOptions) {
        // Find first available size
        const availableSize = pricingConfig.sizeOptions.find(size => {
          const sizeKey = size.key;
          const sizePriceMap: { [key: string]: number | null | undefined } = {
            'small': service.price_small,
            'medium': service.price_medium,
            'large': service.price_large,
            'extra_large': service.price_extra_large
          };
          return sizePriceMap[sizeKey] !== null && sizePriceMap[sizeKey] !== undefined;
        });
        
        if (availableSize) {
          setSelectedSize(availableSize.key);
        } else if (service.price && service.price > 0) {
          // If no size prices but general price exists, don't require size
          setSelectedSize(null);
        } else {
          setSelectedSize(null);
        }
      } else {
        setSelectedSize(null);
      }
    }
  }, [service]);

  // Fetch user profile information on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        console.log('No user ID, skipping profile fetch');
        return;
      }

      console.log('Fetching user profile for:', user.id, user.email);
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();

        if (error) {
          console.log('No profile found, using auth user data');
          // If no profile exists, use auth user data directly
          const newInfo = {
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
            phone: '',
            email: user.email || ''
          };
          console.log('Setting client info from auth user:', newInfo);
          setClientInfo(prev => ({ ...prev, ...newInfo }));
        } else {
          const newInfo = {
            name: profile.full_name || '',
            phone: profile.phone || '',
            email: user.email || ''
          };
          console.log('Setting client info from profile:', newInfo);
          setClientInfo(prev => ({ ...prev, ...newInfo }));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback: use basic user info
        const fallbackInfo = {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
          phone: '',
          email: user.email || ''
        };
        console.log('Using fallback client info:', fallbackInfo);
        setClientInfo(prev => ({ ...prev, ...fallbackInfo }));
      }
    };

    fetchUserProfile();
  }, [user]);

  // Generate next 30 days for date selection
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      });
    }
    return dates;
  };

  const availableDates = generateAvailableDates();

  // Fetch available time slots for selected date
  useEffect(() => {
    if (service && selectedDate) {
      fetchAvailableTimeSlots();
    }
  }, [service, selectedDate]);

  // Helper function to generate time slots from availability range
  const generateTimeSlotsFromAvailability = (startTime: string, endTime: string, durationMinutes: number): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    
    // Ensure time format is HH:MM (remove seconds if present, e.g., "09:00:00" -> "09:00")
    const cleanStartTime = startTime ? startTime.substring(0, 5) : '09:00';
    const cleanEndTime = endTime ? endTime.substring(0, 5) : '17:00';
    
    const [startHour, startMin] = cleanStartTime.split(':').map(Number);
    const [endHour, endMin] = cleanEndTime.split(':').map(Number);
    
    // Validate parsed times
    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      console.error('Invalid time format:', { startTime, endTime, cleanStartTime, cleanEndTime });
      return [];
    }
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Validate time range
    if (startMinutes >= endMinutes) {
      console.error('Invalid time range: start time must be before end time', { startTime, endTime });
      return [];
    }
    
    let currentMinutes = startMinutes;
    let slotIndex = 1;
    
    while (currentMinutes + durationMinutes <= endMinutes) {
      const slotStartHour = Math.floor(currentMinutes / 60);
      const slotStartMin = currentMinutes % 60;
      const slotEndMinutes = currentMinutes + durationMinutes;
      const slotEndHour = Math.floor(slotEndMinutes / 60);
      const slotEndMin = slotEndMinutes % 60;
      
      const slotStart = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMin.toString().padStart(2, '0')}`;
      const slotEnd = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMin.toString().padStart(2, '0')}`;
      
      slots.push({
        id: `generated-${Date.now()}-${slotIndex}`,
        service_id: service?.id || '',
        day_of_week: new Date(selectedDate).getDay(),
        slot_start_time: slotStart,
        slot_end_time: slotEnd,
        is_available: true,
        created_at: new Date().toISOString()
      });
      
      currentMinutes += durationMinutes;
      slotIndex++;
    }
    
    return slots;
  };

  const fetchAvailableTimeSlots = async () => {
    if (!service || !selectedDate) return;

    try {
      setLoading(true);
      
      // Get the day of week for selected date
      const selectedDateObj = new Date(selectedDate);
      const dayOfWeek = selectedDateObj.getDay();

      console.log('Fetching time slots for service:', service.id, 'day:', dayOfWeek, 'day name:', DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label);
      
      // First, try to get specific time slots
      const { data: timeSlots, error: timeSlotsError } = await supabase
        .from('provider_service_time_slots')
        .select('*')
        .eq('service_id', service.id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true)
        .order('slot_start_time');
      
      console.log('Time slots query result:', { 
        timeSlots, 
        error: timeSlotsError,
        count: timeSlots?.length || 0,
        dayOfWeek: dayOfWeek
      });

      let finalSlots: TimeSlot[] = [];

      // If we have specific time slots, use them
      if (timeSlots && timeSlots.length > 0) {
        console.log(`Using ${timeSlots.length} specific time slots for day ${dayOfWeek}`);
        finalSlots = timeSlots.map(slot => ({
          id: slot.id,
          service_id: slot.service_id,
          day_of_week: slot.day_of_week,
          slot_start_time: slot.slot_start_time,
          slot_end_time: slot.slot_end_time,
          is_available: slot.is_available,
          created_at: slot.created_at
        }));
      } else {
        // If no specific time slots, check availability table and generate slots
        console.log('No specific time slots found, checking availability table for day', dayOfWeek);
        
        // Debug: First check ALL availability for this service (without day filter)
        const { data: allAvailability, error: allAvailabilityError } = await supabase
          .from('provider_service_availability')
          .select('*')
          .eq('service_id', service.id);
        
        console.log('=== ALL availability for this service (all days) ===');
        console.log('Service ID:', service.id);
        console.log('Service ID type:', typeof service.id);
        console.log('All availability records (including unavailable):', allAvailability);
        console.log('All availability error:', allAvailabilityError);
        
        if (allAvailability && allAvailability.length > 0) {
          console.log('Day breakdown:');
          allAvailability.forEach(avail => {
            console.log(`  Day ${avail.day_of_week} (type: ${typeof avail.day_of_week}) (${DAYS_OF_WEEK.find(d => d.value === avail.day_of_week)?.label || 'Unknown'}): ${avail.start_time} - ${avail.end_time}, is_available: ${avail.is_available}`);
          });
        } else {
          console.warn('⚠️ NO AVAILABILITY RECORDS FOUND FOR THIS SERVICE!');
          console.warn('This could mean:');
          console.warn('1. The service has no availability configured');
          console.warn('2. The service_id does not match');
          console.warn('3. RLS policies are blocking the query');
          console.warn('4. The data was not saved correctly');
        }
        console.log('==================================================');
        
        // Now query for specific day - also check without is_available filter first
        const { data: availabilityForDay, error: availabilityForDayError } = await supabase
          .from('provider_service_availability')
          .select('*')
          .eq('service_id', service.id)
          .eq('day_of_week', dayOfWeek);
        
        console.log('Availability for day', dayOfWeek, '(without is_available filter):', {
          availabilityForDay,
          error: availabilityForDayError,
          count: availabilityForDay?.length || 0
        });
        
        // Now query with is_available filter
        const { data: availability, error: availabilityError } = await supabase
          .from('provider_service_availability')
          .select('*')
          .eq('service_id', service.id)
          .eq('day_of_week', dayOfWeek)
          .eq('is_available', true)
          .order('start_time');
        
        console.log('Availability query result for day', dayOfWeek, ':', { 
          availability, 
          error: availabilityError,
          count: availability?.length || 0,
          dayOfWeek: dayOfWeek,
          dayOfWeekType: typeof dayOfWeek,
          serviceId: service.id
        });

        // Use availabilityForDay if availability is empty (in case is_available filter is too restrictive)
        const availabilityToUse = (availability && availability.length > 0) 
          ? availability 
          : (availabilityForDay && availabilityForDay.length > 0 
              ? availabilityForDay.filter(a => a.is_available !== false) 
              : []);
        
        if (availabilityToUse && availabilityToUse.length > 0) {
          // Generate time slots from availability ranges
          const durationMinutes = service.duration_minutes || 60;
          
          console.log('✅ Processing availability for day', dayOfWeek, ':', availabilityToUse);
          
          availabilityToUse.forEach(avail => {
            // Ensure time format is HH:MM (remove seconds if present)
            // Handle both HH:MM and HH:MM:SS formats
            let startTime = '09:00';
            let endTime = '17:00';
            
            if (avail.start_time) {
              // If format is HH:MM:SS, take first 5 chars, otherwise use as is
              startTime = avail.start_time.length >= 5 ? avail.start_time.substring(0, 5) : avail.start_time;
            }
            
            if (avail.end_time) {
              // If format is HH:MM:SS, take first 5 chars, otherwise use as is
              endTime = avail.end_time.length >= 5 ? avail.end_time.substring(0, 5) : avail.end_time;
            }
            
            console.log(`  Raw times from DB: start=${avail.start_time}, end=${avail.end_time}`);
            console.log(`  Parsed times: start=${startTime}, end=${endTime}`);
            console.log(`  Generating slots from ${startTime} to ${endTime} for day ${dayOfWeek} (day_of_week in DB: ${avail.day_of_week}, type: ${typeof avail.day_of_week})`);
            
            const generatedSlots = generateTimeSlotsFromAvailability(
              startTime,
              endTime,
              durationMinutes
            );
            
            console.log(`  ✅ Generated ${generatedSlots.length} slots for this availability range`);
            if (generatedSlots.length > 0) {
              console.log(`  First slot: ${generatedSlots[0].slot_start_time} - ${generatedSlots[0].slot_end_time}`);
              console.log(`  Last slot: ${generatedSlots[generatedSlots.length - 1].slot_start_time} - ${generatedSlots[generatedSlots.length - 1].slot_end_time}`);
            }
            finalSlots.push(...generatedSlots);
          });
          
          console.log(`✅ Total slots generated for day ${dayOfWeek}: ${finalSlots.length}`);
        } else {
          // If no availability found, show message instead of default slots
          console.warn(`⚠️ No availability found for day ${dayOfWeek} (${DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label}). This service may not be available on this day.`);
          // Don't show default slots - show empty state instead
          finalSlots = [];
        }
      }

      // Check for existing bookings on this date to filter out booked slots
      // Wrap in try-catch to handle cases where table doesn't exist or has different schema
      try {
        const { data: existingBookings, error: bookingsError } = await supabase
          .from('service_appointments')
          .select('time_slot_id, appointment_time, status')
          .eq('service_id', service.id)
          .eq('appointment_date', selectedDate);

        if (bookingsError) {
          console.warn('Error fetching existing bookings (table might not exist or have different schema):', bookingsError);
          // Continue without filtering - show all available slots
        } else if (existingBookings) {
          // Filter to only confirmed/pending appointments
          const activeBookings = existingBookings.filter(b => 
            b.status === 'confirmed' || b.status === 'pending'
          );
          
          const bookedTimes = activeBookings
            .map(b => b.appointment_time || '')
            .filter(Boolean);
          
          // Filter out slots that overlap with booked times
          finalSlots = finalSlots.filter(slot => {
            return !bookedTimes.some(bookedTime => {
              const bookedStart = bookedTime.substring(0, 5); // HH:MM format
              return slot.slot_start_time === bookedStart;
            });
          });
        }
      } catch (error) {
        console.warn('Error checking existing bookings:', error);
        // Continue without filtering - show all available slots
      }

      console.log('Final available slots:', finalSlots);
      setAvailableTimeSlots(finalSlots);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast.error("No se pudieron cargar los horarios disponibles");
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!service || !selectedDate || !selectedTimeSlot || !user) {
      toast.error("Por favor selecciona una fecha y horario");
      return;
    }

    // Check if we have the required user information
    if (!clientInfo.name || !clientInfo.email) {
      toast.error("No se pudo obtener tu información de perfil. Por favor actualiza tu perfil primero.");
      return;
    }

    try {
      setBookingLoading(true);

      // First, get the provider's user_id from the providers table
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('user_id')
        .eq('id', service.provider_id)
        .single();

      if (providerError) {
        console.error('Error fetching provider user_id:', providerError);
        throw providerError;
      }

      console.log('Provider user_id:', providerData.user_id);

      // Validate size selection if required
      const pricingConfig = getServicePricingConfig(service.service_category);
      const hasSizePricing = pricingConfig.system === 'dog_size';
      
      if (hasSizePricing && !selectedSize && !service.price) {
        toast.error("Por favor selecciona un tamaño de perro");
        return;
      }

      // Calculate final price
      const finalPrice = getServicePrice();
      if (finalPrice <= 0) {
        toast.error("El precio del servicio no está configurado correctamente");
        return;
      }

      // Get the selected time slot to extract the time
      const selectedSlot = availableTimeSlots.find(slot => slot.id === selectedTimeSlot);
      if (!selectedSlot) {
        toast.error("No se pudo encontrar el horario seleccionado");
        return;
      }

      // Create service booking item for cart
      // IMPORTANT: Use providerData.user_id (not service.provider_id) because order_items.provider_id 
      // foreign key references users.id, not providers.id
      const sizeLabel = selectedSize ? pricingConfig.sizeOptions?.find(s => s.key === selectedSize)?.label : null;
      const serviceName = sizeLabel ? `${service.service_name} (${sizeLabel})` : service.service_name;
      
      const serviceBookingItem = {
        id: `service-${service.id}${selectedSize ? `_${selectedSize}` : ''}-${Date.now()}`,
        type: 'service' as const,
        name: serviceName,
        price: finalPrice,
        currency: service.currency,
        provider_id: providerData.user_id, // Use user_id, not provider.id (for foreign key constraint)
        provider_name: service.providers.business_name,
        description: service.description,
        service_size: selectedSize || undefined,
        service_id: service.id, // Store original service ID
        // Service-specific fields (we'll store these in a custom way)
        service_data: {
          service_id: service.id,
          appointment_date: selectedDate,
          time_slot_id: selectedTimeSlot,
          appointment_time: selectedSlot.slot_start_time, // Store the actual time (HH:MM format)
          slot_end_time: selectedSlot.slot_end_time, // Also store end time for reference
          client_name: clientInfo.name,
          client_phone: clientInfo.phone,
          client_email: clientInfo.email,
          notes: clientInfo.notes
        }
      };

      // Add to cart with quantity
      for (let i = 0; i < quantity; i++) {
        addItem(serviceBookingItem);
      }

      console.log('Adding service to cart:', serviceBookingItem, 'quantity:', quantity);

      toast.success(`${quantity} ${quantity === 1 ? 'servicio' : 'servicios'} de ${service.service_name} agregado${quantity === 1 ? '' : 's'} al carrito`);

      onBookingSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding service to cart:', error);
      toast.error("No se pudo agregar el servicio al carrito. Inténtalo de nuevo.");
    } finally {
      setBookingLoading(false);
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: currency || 'GTQ',
      minimumFractionDigits: 2
    }).format(price);
  };

  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Reservar Servicio
          </DialogTitle>
          <DialogDescription>
            Selecciona la fecha y hora para tu reserva
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Información del Servicio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{service.service_name}</h3>
                <p className="text-gray-600 text-sm">{service.description}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>{service.providers.business_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{service.providers.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{service.duration_minutes} minutos</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-semibold">
                    Precio: {(() => {
                      const pricingConfig = getServicePricingConfig(service.service_category);
                      const hasSizePricing = pricingConfig.system === 'dog_size';
                      
                      if (hasSizePricing) {
                        const sizePrices = [
                          service.price_small,
                          service.price_medium,
                          service.price_large,
                          service.price_extra_large
                        ].filter((p): p is number => p !== null && p !== undefined);
                        
                        if (sizePrices.length > 0) {
                          const minPrice = Math.min(...sizePrices);
                          const maxPrice = Math.max(...sizePrices);
                          const currencySymbol = service.currency === 'GTQ' ? 'Q.' : '$';
                          
                          if (minPrice === maxPrice) {
                            return `${currencySymbol}${minPrice.toFixed(2)}`;
                          } else {
                            return `${currencySymbol}${minPrice.toFixed(2)} - ${currencySymbol}${maxPrice.toFixed(2)}`;
                          }
                        }
                      }
                      
                      // Fallback to general price
                      const currencySymbol = service.currency === 'GTQ' ? 'Q.' : '$';
                      return `${currencySymbol}${service.price.toFixed(2)}`;
                    })()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información de Reserva
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Selection - Moved to top */}
              <div>
                <label className="text-sm font-medium text-gray-700">Seleccionar Fecha *</label>
                <select
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTimeSlot(''); // Reset time slot when date changes
                  }}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona una fecha</option>
                  {availableDates.map(date => (
                    <option key={date.value} value={date.value}>
                      {date.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Slot Selection - Moved to top */}
              {selectedDate && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Seleccionar Horario *</label>
                  {loading ? (
                    <div className="mt-1 p-4 text-center text-gray-500">
                      Cargando horarios disponibles...
                    </div>
                  ) : availableTimeSlots.length > 0 ? (
                    <div className="mt-1 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {availableTimeSlots.map(slot => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedTimeSlot(slot.id)}
                          className={`p-2 text-sm border rounded-md transition-colors ${
                            selectedTimeSlot === slot.id
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {formatTime(slot.slot_start_time)} - {formatTime(slot.slot_end_time)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 p-4 text-center text-gray-500">
                      No hay horarios disponibles para esta fecha
                    </div>
                  )}
                </div>
              )}

              {/* Profile Information Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-blue-800 font-medium">
                    Información de tu perfil
                  </p>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Los datos de contacto se obtienen automáticamente de tu perfil. Solo necesitas agregar notas adicionales si las tienes.
                </p>
              </div>

              {/* Client Information */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                  <input
                    type="text"
                    value={clientInfo.name}
                    readOnly
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    placeholder="Cargando información del perfil..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Información de tu perfil</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    type="tel"
                    value={clientInfo.phone}
                    readOnly
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    placeholder="Cargando información del perfil..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Información de tu perfil</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={clientInfo.email}
                    readOnly
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    placeholder="Cargando información del perfil..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Información de tu perfil</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Notas Adicionales</label>
                  <textarea
                    value={clientInfo.notes}
                    onChange={(e) => setClientInfo(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Información adicional sobre tu mascota o necesidades especiales"
                    rows={3}
                  />
                </div>
              </div>

              {/* Size Selection (if service has size-based pricing) */}
              {(() => {
                const pricingConfig = getServicePricingConfig(service.service_category);
                const hasSizePricing = pricingConfig.system === 'dog_size';
                
                if (hasSizePricing && pricingConfig.sizeOptions) {
                  return (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Tamaño de Perro *</Label>
                      <Select value={selectedSize || ''} onValueChange={setSelectedSize}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tamaño" />
                        </SelectTrigger>
                        <SelectContent className="z-[10000]">
                          {pricingConfig.sizeOptions.map((size) => {
                            const sizePriceMap: { [key: string]: number | null | undefined } = {
                              'small': service.price_small,
                              'medium': service.price_medium,
                              'large': service.price_large,
                              'extra_large': service.price_extra_large
                            };
                            const sizePrice = sizePriceMap[size.key];
                            
                            if (sizePrice === null || sizePrice === undefined) {
                              return null; // Don't show sizes without prices
                            }
                            
                            return (
                              <SelectItem key={size.key} value={size.key}>
                                {size.label} {size.description && `(${size.description})`} - {formatPrice(sizePrice, service.currency)}
                              </SelectItem>
                            );
                          })}
                          {/* Show general price option if available */}
                          {service.price && service.price > 0 && (
                            <SelectItem value="general">
                              Precio General - {formatPrice(service.price, service.currency)}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Quantity Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Cantidad de Servicios</label>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  {quantity === 1 ? '1 servicio' : `${quantity} servicios`} - Total: {formatPrice(getServicePrice() * quantity, service.currency)}
                </p>
              </div>

              {/* Booking Button */}
              <Button
                onClick={handleBooking}
                disabled={
                  !selectedDate || 
                  !selectedTimeSlot || 
                  !clientInfo.name || 
                  !clientInfo.email || 
                  bookingLoading ||
                  (hasServiceSizePricing(service.service_category) && !selectedSize && !service.price)
                }
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {bookingLoading ? 'Agregando al Carrito...' : 'Agregar al Carrito'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceBookingModal;
