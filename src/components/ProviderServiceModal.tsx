import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, DollarSign, Info, AlertCircle } from 'lucide-react';
import { ProviderService, ProviderServiceAvailability, ProviderServiceTimeSlot } from '@/hooks/useProvider';
import { getServicePricingConfig, hasServiceSizePricing } from '@/config/servicePricing';
import { ServiceImageUpload } from './ServiceImageUpload';

interface ProviderServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Omit<ProviderService, 'id' | 'provider_id' | 'created_at' | 'updated_at'>, availability?: Omit<ProviderServiceAvailability, 'id' | 'service_id' | 'created_at'>[], timeSlots?: Omit<ProviderServiceTimeSlot, 'id' | 'service_id' | 'created_at'>[]) => Promise<void>;
  service?: ProviderService | null;
  isEditing?: boolean;
  onSaveAvailability?: (serviceId: string, availability: Omit<ProviderServiceAvailability, 'id' | 'service_id' | 'created_at'>[]) => Promise<void>;
  onSaveTimeSlots?: (serviceId: string, timeSlots: Omit<ProviderServiceTimeSlot, 'id' | 'service_id' | 'created_at'>[]) => Promise<void>;
  onFetchAvailability?: (serviceId: string) => Promise<ProviderServiceAvailability[]>;
  onFetchTimeSlots?: (serviceId: string) => Promise<ProviderServiceTimeSlot[]>;
}

const SERVICE_CATEGORIES = [
  { value: 'veterinaria', label: 'Veterinaria', icon: '🐕' },
  { value: 'grooming', label: 'Grooming', icon: '✂️' },
  { value: 'entrenamiento', label: 'Entrenamiento', icon: '🎾' },
  { value: 'alojamiento', label: 'Alojamiento', icon: '🏠' },
  { value: 'transporte', label: 'Transporte', icon: '🚗' },
  { value: 'fisioterapia', label: 'Fisioterapia', icon: '💆' },
  { value: 'nutricion', label: 'Nutrición', icon: '🥩' },
  { value: 'otro', label: 'Otro', icon: '🔧' }
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' }
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

const ProviderServiceModal: React.FC<ProviderServiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  service,
  isEditing = false,
  onSaveAvailability,
  onSaveTimeSlots,
  onFetchAvailability,
  onFetchTimeSlots
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    service_name: '',
    service_category: '',
    description: '',
    detailed_description: '',
    price: '', // Precio general (opcional)
    price_small: '',
    price_medium: '',
    price_large: '',
    price_extra_large: '',
    currency: 'GTQ',
    duration_minutes: '',
    preparation_instructions: '',
    cancellation_policy: '',
    max_advance_booking_days: '30',
    min_advance_booking_hours: '2',
    is_active: true,
    service_image_url: '',
  });

  const [availability, setAvailability] = useState<ProviderServiceAvailability[]>([]);
  const [timeSlots, setTimeSlots] = useState<ProviderServiceTimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (service && isEditing) {
      setFormData({
        service_name: service.service_name,
        service_category: service.service_category,
        description: service.description || '',
        detailed_description: service.detailed_description || '',
        price: service.price?.toString() || '',
        price_small: service.price_small?.toString() || '',
        price_medium: service.price_medium?.toString() || '',
        price_large: service.price_large?.toString() || '',
        price_extra_large: service.price_extra_large?.toString() || '',
        currency: service.currency || 'GTQ',
        duration_minutes: service.duration_minutes.toString(),
        preparation_instructions: service.preparation_instructions || '',
        cancellation_policy: service.cancellation_policy || '',
        max_advance_booking_days: service.max_advance_booking_days?.toString() || '30',
        min_advance_booking_hours: service.min_advance_booking_hours?.toString() || '2',
        is_active: service.is_active,
        service_image_url: service.service_image_url || '',
      });

      // Load availability and time slots for existing service (only if functions are provided)
      if (onFetchAvailability && onFetchTimeSlots && typeof onFetchAvailability === 'function' && typeof onFetchTimeSlots === 'function') {
        const loadAvailabilityData = async () => {
          try {
            const [availabilityData, timeSlotsData] = await Promise.all([
              onFetchAvailability(service.id),
              onFetchTimeSlots(service.id)
            ]);
            // Convert time format from HH:MM:SS to HH:MM for UI
            const formattedAvailability = (availabilityData || []).map(item => ({
              ...item,
              start_time: item.start_time ? item.start_time.substring(0, 5) : '09:00',
              end_time: item.end_time ? item.end_time.substring(0, 5) : '17:00'
            }));
            
            const formattedTimeSlots = (timeSlotsData || []).map(item => ({
              ...item,
              slot_start_time: item.slot_start_time ? item.slot_start_time.substring(0, 5) : '09:00',
              slot_end_time: item.slot_end_time ? item.slot_end_time.substring(0, 5) : '10:00'
            }));
            
            setAvailability(formattedAvailability);
            setTimeSlots(formattedTimeSlots);
          } catch (error) {
            // Set empty arrays on error to prevent crashes
            setAvailability([]);
            setTimeSlots([]);
          }
        };
        loadAvailabilityData();
      } else {
        // If functions are not provided, set empty arrays
        setAvailability([]);
        setTimeSlots([]);
      }
    } else {
      setFormData({
        service_name: '',
        service_category: '',
        description: '',
        detailed_description: '',
        price: '',
        price_small: '',
        price_medium: '',
        price_large: '',
        price_extra_large: '',
        currency: 'GTQ',
        duration_minutes: '',
        preparation_instructions: '',
        cancellation_policy: '',
        max_advance_booking_days: '30',
        min_advance_booking_hours: '2',
        is_active: true,
        service_image_url: '',
      });
      setAvailability([]);
      setTimeSlots([]);
    }
  }, [service, isEditing, onFetchAvailability, onFetchTimeSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.service_name.trim()) {
        throw new Error('El nombre del servicio es requerido');
      }
      if (!formData.service_category) {
        throw new Error('La categoría del servicio es requerida');
      }
      if (!formData.description.trim()) {
        throw new Error('La descripción del servicio es requerida');
      }
      // Validate pricing based on category
      const pricingConfig = getServicePricingConfig(formData.service_category);
      const hasSizePricing = pricingConfig.system === 'dog_size';
      
      if (hasSizePricing) {
        // For size-based pricing, at least one size price must be set
        const hasGeneralPrice = formData.price && parseFloat(formData.price) > 0;
        const hasSizePrices = formData.price_small || formData.price_medium || 
                              formData.price_large || formData.price_extra_large;
        
        if (!hasGeneralPrice && !hasSizePrices) {
          throw new Error('Debes definir un precio general o al menos un precio por tamaño');
        }
      } else {
        // For single pricing, general price is required
        if (!formData.price || parseFloat(formData.price) <= 0) {
          throw new Error('El precio del servicio debe ser mayor a 0');
        }
      }

      // Transform availability data to remove id, service_id, and created_at
      // Ensure day_of_week is a number and times are in correct format
      const availabilityData = availability.map(item => {
        const dayOfWeek = typeof item.day_of_week === 'string' ? parseInt(item.day_of_week, 10) : item.day_of_week;
        const startTime = item.start_time ? item.start_time.substring(0, 5) : '09:00';
        const endTime = item.end_time ? item.end_time.substring(0, 5) : '17:00';
        
        return {
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          is_available: item.is_available !== false // Default to true if not set
        };
      });

      // Transform time slots data to remove id, service_id, and created_at
      // Ensure day_of_week is a number and times are in correct format
      const timeSlotsData = timeSlots.map(item => {
        const dayOfWeek = typeof item.day_of_week === 'string' ? parseInt(item.day_of_week, 10) : item.day_of_week;
        const slotStartTime = item.slot_start_time ? item.slot_start_time.substring(0, 5) : '09:00';
        const slotEndTime = item.slot_end_time ? item.slot_end_time.substring(0, 5) : '10:00';
        
        return {
          day_of_week: dayOfWeek,
          slot_start_time: slotStartTime,
          slot_end_time: slotEndTime,
          is_available: item.is_available !== false, // Default to true if not set
          max_bookings_per_slot: item.max_bookings_per_slot || 1
        };
      });

      console.log('=== SAVING SERVICE AVAILABILITY ===');
      console.log('Raw availability state:', availability);
      console.log('Raw availability length:', availability.length);
      console.log('Transformed availability data:', availabilityData);
      console.log('Transformed availability length:', availabilityData.length);
      console.log('Raw time slots state:', timeSlots);
      console.log('Raw time slots length:', timeSlots.length);
      console.log('Transformed time slots data:', timeSlotsData);
      console.log('Transformed time slots length:', timeSlotsData.length);
      console.log('===================================');

      // Validate that we have data to save
      if (availability.length === 0 && timeSlots.length === 0) {
        console.warn('⚠️ WARNING: No availability or time slots configured for this service!');
      }

      // Save the service
      console.log('Calling onSave with:', {
        serviceData: {
          service_name: formData.service_name,
          service_category: formData.service_category,
          // ... other fields
        },
        availability: availabilityData,
        timeSlots: timeSlotsData
      });
      
      await onSave({
        service_name: formData.service_name,
        service_category: formData.service_category,
        description: formData.description,
        detailed_description: formData.detailed_description,
        price: formData.price ? parseFloat(formData.price) : 0,
        price_small: formData.price_small ? parseFloat(formData.price_small) : null,
        price_medium: formData.price_medium ? parseFloat(formData.price_medium) : null,
        price_large: formData.price_large ? parseFloat(formData.price_large) : null,
        price_extra_large: formData.price_extra_large ? parseFloat(formData.price_extra_large) : null,
        currency: formData.currency,
        duration_minutes: parseInt(formData.duration_minutes) || 0,
        preparation_instructions: formData.preparation_instructions,
        cancellation_policy: formData.cancellation_policy,
        max_advance_booking_days: parseInt(formData.max_advance_booking_days) || 30,
        min_advance_booking_hours: parseInt(formData.min_advance_booking_hours) || 2,
        is_active: formData.is_active,
        service_image_url: formData.service_image_url || undefined,
      }, availabilityData, timeSlotsData);
      
      // Success - modal will close and parent will show success toast
      onClose();
    } catch (error) {
      console.error('Error saving service:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Show error toast (this will be handled by the parent component)
      console.error('Service validation/save error:', errorMessage);
      
      // Re-throw the error so the parent component can handle it
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addAvailability = (dayOfWeek: number) => {
    const newAvailability: ProviderServiceAvailability = {
      id: `temp-${Date.now()}`,
      service_id: service?.id || '',
      day_of_week: dayOfWeek,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
      created_at: new Date().toISOString()
    };
    setAvailability(prev => [...prev, newAvailability]);
  };

  const removeAvailability = (id: string) => {
    setAvailability(prev => prev.filter(item => item.id !== id));
  };

  const updateAvailability = (id: string, field: string, value: string | boolean) => {
    setAvailability(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addTimeSlot = (dayOfWeek: number) => {
    const newTimeSlot: ProviderServiceTimeSlot = {
      id: `temp-${Date.now()}`,
      service_id: service?.id || '',
      day_of_week: dayOfWeek,
      slot_start_time: '09:00',
      slot_end_time: '10:00',
      is_available: true,
      max_bookings_per_slot: 1,
      created_at: new Date().toISOString()
    };
    setTimeSlots(prev => [...prev, newTimeSlot]);
  };

  const removeTimeSlot = (id: string) => {
    setTimeSlots(prev => prev.filter(item => item.id !== id));
  };

  const updateTimeSlot = (id: string, field: string, value: string | number | boolean) => {
    setTimeSlots(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };


  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto" aria-describedby="service-modal-description">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6" id="service-modal-description">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Información Básica</TabsTrigger>
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="availability">Disponibilidad</TabsTrigger>
              <TabsTrigger value="policies">Políticas</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service-name">Nombre del Servicio *</Label>
                  <Input
                    id="service-name"
                    value={formData.service_name}
                    onChange={(e) => handleInputChange('service_name', e.target.value)}
                    placeholder="Ej: Consulta Veterinaria General"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="service-category">Categoría *</Label>
                  <Select value={formData.service_category} onValueChange={(value) => handleInputChange('service_category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      {SERVICE_CATEGORIES.map((category) => (
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
                <ServiceImageUpload
                  imageUrl={formData.service_image_url}
                  onImageUpload={(url) => handleInputChange('service_image_url', url || '')}
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="service-description">Descripción Corta *</Label>
                <Textarea
                  id="service-description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descripción breve del servicio..."
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service-duration">Duración (min) *</Label>
                  <Input
                    id="service-duration"
                    type="number"
                    min="1"
                    value={formData.duration_minutes}
                    onChange={(e) => handleInputChange('duration_minutes', e.target.value)}
                    placeholder="30"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="service-currency">Moneda</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GTQ">GTQ - Quetzales</SelectItem>
                      <SelectItem value="USD">USD - Dólares</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Pricing Section - Dynamic based on category */}
              {(() => {
                const pricingConfig = getServicePricingConfig(formData.service_category);
                const hasSizePricing = pricingConfig.system === 'dog_size';
                const currencySymbol = formData.currency === 'GTQ' ? 'Q.' : '$';

                if (hasSizePricing && pricingConfig.sizeOptions) {
                  return (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Precio General (Opcional)</Label>
                        <p className="text-sm text-gray-600 mb-3">Usa este campo si el servicio no requiere diferenciación por tamaño de perro.</p>
                        <div className="relative max-w-xs">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            {currencySymbol}
                          </span>
                          <Input
                            id="service-price-general"
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

                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Precios por Tamaño de Perro</Label>
                        <p className="text-sm text-gray-600 mb-3">Define precios específicos para cada tamaño de perro.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {pricingConfig.sizeOptions.map((size) => {
                            const fieldName = `price_${size.key}` as keyof typeof formData;
                            return (
                              <div key={size.key} className="space-y-2">
                                <Label htmlFor={`service-price-${size.key}`}>
                                  {size.label} {size.description && `(${size.description})`}
                                </Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    {currencySymbol}
                                  </span>
                                  <Input
                                    id={`service-price-${size.key}`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData[fieldName] as string}
                                    onChange={(e) => handleInputChange(fieldName, e.target.value)}
                                    placeholder="0.00"
                                    className="pl-8"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Single price
                  return (
                    <div>
                      <Label htmlFor="service-price">Precio ({currencySymbol}) *</Label>
                      <div className="relative max-w-xs">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          {currencySymbol}
                        </span>
                        <Input
                          id="service-price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                          placeholder="0.00"
                          className="pl-8"
                          required
                        />
                      </div>
                    </div>
                  );
                }
              })()}

              <div className="flex items-center space-x-2">
                <Switch
                  id="service-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="service-active">Servicio Activo</Label>
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <div>
                <Label htmlFor="service-detailed-description">Descripción Detallada</Label>
                <Textarea
                  id="service-detailed-description"
                  value={formData.detailed_description}
                  onChange={(e) => handleInputChange('detailed_description', e.target.value)}
                  placeholder="Describe el servicio en detalle, incluyendo qué incluye, beneficios, etc..."
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Esta información será visible para los clientes al seleccionar el servicio
                </p>
              </div>

              <div>
                <Label htmlFor="service-preparation">Instrucciones de Preparación</Label>
                <Textarea
                  id="service-preparation"
                  value={formData.preparation_instructions}
                  onChange={(e) => handleInputChange('preparation_instructions', e.target.value)}
                  placeholder="¿Qué debe preparar el cliente antes de la cita? (ej: ayuno, traer documentos, etc.)"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ayuda a los clientes a estar preparados para su cita
                </p>
              </div>
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent value="availability" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <Info className="w-5 h-5" />
                  <span className="font-medium">Configuración de Disponibilidad</span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  Esta funcionalidad permite configurar horarios de disponibilidad y franjas horarias específicas para cada servicio.
                  Los clientes podrán ver estos horarios al reservar citas.
                </p>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Horarios de Disponibilidad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{day.label}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addAvailability(day.value)}
                        >
                          Agregar Horario
                        </Button>
                      </div>
                      
                      {availability
                        .filter(a => a.day_of_week === day.value)
                        .map((avail) => (
                          <div key={avail.id} className="flex items-center gap-2 mb-2">
                            <Select value={avail.start_time} onValueChange={(value) => updateAvailability(avail.id, 'start_time', value)}>
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[10000]">
                                {TIME_SLOTS.map((time) => (
                                  <SelectItem key={time} value={time}>{time}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span>a</span>
                            <Select value={avail.end_time} onValueChange={(value) => updateAvailability(avail.id, 'end_time', value)}>
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[10000]">
                                {TIME_SLOTS.map((time) => (
                                  <SelectItem key={time} value={time}>{time}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeAvailability(avail.id)}
                              className="text-red-600"
                            >
                              Eliminar
                            </Button>
                          </div>
                        ))}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Franjas Horarias Específicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{day.label}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addTimeSlot(day.value)}
                        >
                          Agregar Franja
                        </Button>
                      </div>
                      
                      {timeSlots
                        .filter(t => t.day_of_week === day.value)
                        .map((slot) => (
                          <div key={slot.id} className="flex items-center gap-2 mb-2">
                            <Select value={slot.slot_start_time} onValueChange={(value) => updateTimeSlot(slot.id, 'slot_start_time', value)}>
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[10000]">
                                {TIME_SLOTS.map((time) => (
                                  <SelectItem key={time} value={time}>{time}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span>a</span>
                            <Select value={slot.slot_end_time} onValueChange={(value) => updateTimeSlot(slot.id, 'slot_end_time', value)}>
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-[10000]">
                                {TIME_SLOTS.map((time) => (
                                  <SelectItem key={time} value={time}>{time}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              min="1"
                              value={slot.max_bookings_per_slot}
                              onChange={(e) => updateTimeSlot(slot.id, 'max_bookings_per_slot', parseInt(e.target.value) || 1)}
                              className="w-20"
                              placeholder="Max"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeTimeSlot(slot.id)}
                              className="text-red-600"
                            >
                              Eliminar
                            </Button>
                          </div>
                        ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Policies Tab */}
            <TabsContent value="policies" className="space-y-4">
              <div>
                <Label htmlFor="service-cancellation">Política de Cancelación</Label>
                <Textarea
                  id="service-cancellation"
                  value={formData.cancellation_policy}
                  onChange={(e) => handleInputChange('cancellation_policy', e.target.value)}
                  placeholder="Ej: Cancelaciones con al menos 24 horas de anticipación. No se reembolsan cancelaciones de último momento."
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Informa a los clientes sobre las condiciones de cancelación
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service-max-advance">Reserva Máxima (días)</Label>
                  <Input
                    id="service-max-advance"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.max_advance_booking_days}
                    onChange={(e) => handleInputChange('max_advance_booking_days', e.target.value)}
                    placeholder="30"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Con cuántos días de anticipación pueden reservar los clientes
                  </p>
                </div>

                <div>
                  <Label htmlFor="service-min-notice">Aviso Mínimo (horas)</Label>
                  <Input
                    id="service-min-notice"
                    type="number"
                    min="1"
                    max="72"
                    value={formData.min_advance_booking_hours}
                    onChange={(e) => handleInputChange('min_advance_booking_hours', e.target.value)}
                    placeholder="2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tiempo mínimo requerido para reservar una cita
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6">
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
                isEditing ? 'Actualizar Servicio' : 'Crear Servicio'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderServiceModal;
