import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, Heart, Activity, Stethoscope, Utensils, ShoppingBag, 
  Package, CreditCard, Eye, ChevronRight, TrendingUp, Clock,
  MapPin, Building2, Tag, Timer, Info, Coins, FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import PageHeader from '@/components/PageHeader';
import { format, parseISO, isAfter } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { toast } from 'sonner';
import { useNavigation } from '@/contexts/NavigationContext';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age: number | null;
  weight: number | null;
  image_url: string | null;
  owner_id: string;
  created_at: string;
}

interface TimelineEvent {
  id: string;
  type: 'product' | 'service' | 'veterinary' | 'exercise' | 'nutrition';
  title: string;
  description: string;
  date: string;
  cost: number;
  currency: string;
  metadata: any;
  icon: React.ReactNode;
  color: string;
}

interface PetStats {
  totalProducts: number;
  totalServices: number;
  totalVeterinaryVisits: number;
  totalExerciseSessions: number;
  totalNutritionSessions: number;
  totalCost: number;
  productsCost: number;
  servicesCost: number;
  veterinaryCost: number;
}

// Translation functions for English terms
const translateExerciseType = (type: string | null | undefined): string => {
  if (!type) return 'Actividad';
  
  const translations: { [key: string]: string } = {
    'agility': 'Agilidad',
    'walking': 'Caminata',
    'running': 'Correr',
    'swimming': 'Natación',
    'playing': 'Juego',
    'training': 'Entrenamiento',
    'hiking': 'Senderismo',
    'cycling': 'Ciclismo',
    'fetch': 'Buscar',
    'tug': 'Tirar',
    'obedience': 'Obediencia',
    'flyball': 'Flyball',
    'frisbee': 'Frisbee',
    'dock diving': 'Salto al agua',
    'rally': 'Rally',
    'nose work': 'Trabajo olfativo',
    'trick training': 'Entrenamiento de trucos',
    'other': 'Otro'
  };
  
  const lowerType = type.toLowerCase().trim();
  return translations[lowerType] || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

const translateAppointmentType = (type: string | null | undefined): string => {
  if (!type) return 'Consulta';
  
  const translations: { [key: string]: string } = {
    'checkup': 'Revisión',
    'vaccination': 'Vacunación',
    'surgery': 'Cirugía',
    'emergency': 'Emergencia',
    'grooming': 'Aseo',
    'dental': 'Dental',
    'consultation': 'Consulta',
    'follow-up': 'Seguimiento',
    'other': 'Otro'
  };
  
  const lowerType = type.toLowerCase().trim();
  return translations[lowerType] || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

const translateMealType = (type: string | null | undefined): string => {
  if (!type) return 'Comida';
  
  const translations: { [key: string]: string } = {
    'breakfast': 'Desayuno',
    'lunch': 'Almuerzo',
    'dinner': 'Cena',
    'snack': 'Merienda',
    'treat': 'Premio',
    'other': 'Otro'
  };
  
  const lowerType = type.toLowerCase().trim();
  return translations[lowerType] || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

const translateIntensity = (intensity: string | null | undefined): string => {
  if (!intensity) return 'N/A';
  
  const translations: { [key: string]: string } = {
    'low': 'Baja',
    'medium': 'Media',
    'high': 'Alta'
  };
  
  const lowerIntensity = intensity.toLowerCase().trim();
  return translations[lowerIntensity] || intensity.charAt(0).toUpperCase() + intensity.slice(1).toLowerCase();
};

const PetJourney: React.FC = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobileMenuOpen, toggleMobileMenu } = useNavigation();
  
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [stats, setStats] = useState<PetStats>({
    totalProducts: 0,
    totalServices: 0,
    totalVeterinaryVisits: 0,
    totalExerciseSessions: 0,
    totalNutritionSessions: 0,
    totalCost: 0,
    productsCost: 0,
    servicesCost: 0,
    veterinaryCost: 0
  });
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (petId && user) {
      loadPetData();
    }
  }, [petId, user]);

  const loadPetData = async () => {
    try {
      setLoading(true);
      
      // Load pet
      const { data: petData, error: petError } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .eq('owner_id', user?.id)
        .single();

      if (petError) throw petError;
      if (!petData) {
        toast.error('Mascota no encontrada');
        navigate('/dashboard');
        return;
      }

      setPet(petData);
      await loadTrazabilidadData(petData);
    } catch (error) {
      console.error('Error loading pet:', error);
      toast.error('Error al cargar la información de la mascota');
    } finally {
      setLoading(false);
    }
  };

  const loadTrazabilidadData = async (pet: Pet) => {
    try {
      const allEvents: TimelineEvent[] = [];
      let productsCost = 0;
      let servicesCost = 0;
      let veterinaryCost = 0;
      let totalProducts = 0;
      let totalServices = 0;
      let totalVeterinaryVisits = 0;
      let totalExerciseSessions = 0;
      let totalNutritionSessions = 0;

      // 1. Load products purchased for this pet using order_item_pets
      try {
        const { data: orderItemPets } = await supabase
          .from('order_item_pets')
          .select(`
            *,
            order_items (
              *,
              orders (
                id,
                order_number,
                created_at,
                currency
              )
            )
          `)
          .eq('pet_id', pet.id);

        if (orderItemPets) {
          orderItemPets.forEach((itemPet: any) => {
            const orderItem = itemPet.order_items;
            const order = orderItem?.orders;
            
            if (orderItem && order) {
              const cost = itemPet.price_per_pet || orderItem.total_price || 0;
              productsCost += cost;
              totalProducts += itemPet.quantity || 1;

              allEvents.push({
                id: `product-${itemPet.id}`,
                type: 'product',
                title: orderItem.item_name || 'Producto',
                description: `Cantidad: ${itemPet.quantity} | Orden: ${order.order_number}`,
                date: order.created_at,
                cost: cost,
                currency: order.currency || 'GTQ',
                metadata: { orderItem, order, itemPet },
                icon: <Package className="w-5 h-5" />,
                color: 'bg-blue-500'
              });
            }
          });
        }
      } catch (error) {
        console.warn('Error loading products (order_item_pets table might not exist):', error);
      }

      // 2. Load services (service_appointments) - Note: service_appointments might not have pet_id directly
      // We'll load all services for the user and try to match by notes or show all
      try {
        const { data: services } = await supabase
          .from('service_appointments')
          .select(`
            *,
            provider_services (
              service_name,
              service_category,
              description,
              price,
              currency,
              duration_minutes,
              providers (
                business_name,
                address,
                phone
              )
            )
          `)
          .eq('client_id', user?.id)
          .order('appointment_date', { ascending: false });

        if (services) {
          services.forEach((service: any) => {
            // For now, include all services. In the future, if service_appointments has pet_id, filter by it
            const cost = service.provider_services?.price || 0;
            servicesCost += cost;
            totalServices += 1;

            allEvents.push({
              id: `service-${service.id}`,
              type: 'service',
              title: service.provider_services?.service_name || 'Servicio',
              description: `${service.provider_services?.providers?.business_name || 'Proveedor'} | ${service.appointment_time || ''}`,
              date: service.appointment_date || service.created_at,
              cost: cost,
              currency: service.provider_services?.currency || 'GTQ',
              metadata: service,
              icon: <ShoppingBag className="w-5 h-5" />,
              color: 'bg-purple-500'
            });
          });
        }
      } catch (error) {
        console.warn('Error loading services:', error);
      }

      // 3. Load veterinary visits
      const { data: vetSessions } = await supabase
        .from('veterinary_sessions')
        .select('*')
        .eq('pet_id', pet.id)
        .order('date', { ascending: false });

      if (vetSessions) {
        vetSessions.forEach((session: any) => {
          const cost = session.cost || 0;
          veterinaryCost += cost;
          totalVeterinaryVisits += 1;

          allEvents.push({
            id: `vet-${session.id}`,
            type: 'veterinary',
            title: `Visita Veterinaria: ${translateAppointmentType(session.appointment_type)}`,
            description: `${session.veterinarian_name || 'Veterinario'}${session.veterinary_clinic ? ` - ${session.veterinary_clinic}` : ''}`,
            date: session.date,
            cost: cost,
            currency: 'GTQ',
            metadata: session,
            icon: <Stethoscope className="w-5 h-5" />,
            color: 'bg-red-500'
          });
        });
      }

      // 4. Load exercise sessions
      const { data: exerciseSessions } = await supabase
        .from('exercise_sessions')
        .select('*')
        .eq('pet_id', pet.id)
        .order('date', { ascending: false });

      if (exerciseSessions) {
        exerciseSessions.forEach((session: any) => {
          totalExerciseSessions += 1;

          allEvents.push({
            id: `exercise-${session.id}`,
            type: 'exercise',
            title: `Ejercicio: ${translateExerciseType(session.exercise_type)}`,
            description: `${session.duration_minutes || 0} minutos${session.calories_burned ? ` | ${session.calories_burned} calorías` : ''}`,
            date: session.date || session.session_date || session.created_at,
            cost: 0,
            currency: 'GTQ',
            metadata: session,
            icon: <Activity className="w-5 h-5" />,
            color: 'bg-green-500'
          });
        });
      }

      // 5. Load nutrition sessions (feeding schedules and meal records)
      const { data: feedingSchedules } = await supabase
        .from('pet_feeding_schedules')
        .select('*')
        .eq('pet_id', pet.id)
        .order('created_at', { ascending: false });

      if (feedingSchedules) {
        feedingSchedules.forEach((schedule: any) => {
          totalNutritionSessions += 1;

          allEvents.push({
            id: `nutrition-${schedule.id}`,
            type: 'nutrition',
            title: `Alimentación: ${schedule.food_name || 'Alimento'}`,
            description: `${schedule.quantity_per_meal || 0} ${schedule.unit || 'g'} - ${schedule.times_per_day || 0} veces al día`,
            date: schedule.created_at,
            cost: 0,
            currency: 'GTQ',
            metadata: schedule,
            icon: <Utensils className="w-5 h-5" />,
            color: 'bg-yellow-500'
          });
        });
      }

      // Try to load meal records if table exists
      try {
        const { data: mealRecords } = await supabase
          .from('meal_records')
          .select('*')
          .eq('pet_id', pet.id)
          .order('fed_at', { ascending: false })
          .limit(100);

        if (mealRecords) {
          mealRecords.forEach((meal: any) => {
            totalNutritionSessions += 1;

            allEvents.push({
              id: `meal-${meal.id}`,
              type: 'nutrition',
              title: `${translateMealType(meal.meal_type)}: ${meal.food_name || 'Alimento'}`,
              description: `${meal.quantity || 0}g${meal.notes ? ` | ${meal.notes}` : ''}`,
              date: meal.fed_at,
              cost: 0,
              currency: 'GTQ',
              metadata: meal,
              icon: <Utensils className="w-5 h-5" />,
              color: 'bg-orange-500'
            });
          });
        }
      } catch (error) {
        // Table might not exist, skip
      }

      // Sort all events by date (newest first)
      allEvents.sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      setEvents(allEvents);
      setStats({
        totalProducts,
        totalServices,
        totalVeterinaryVisits,
        totalExerciseSessions,
        totalNutritionSessions,
        totalCost: productsCost + servicesCost + veterinaryCost,
        productsCost,
        servicesCost,
        veterinaryCost
      });
    } catch (error) {
      console.error('Error loading trazabilidad data:', error);
      toast.error('Error al cargar la trazabilidad');
    }
  };

  const formatPrice = (amount: number, currency: string = 'GTQ') => {
    return `${currency === 'GTQ' ? 'Q' : '$'}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'HH:mm');
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6" style={{ paddingBottom: '100px' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando trazabilidad...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="p-6 space-y-6" style={{ paddingBottom: '100px' }}>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">Mascota no encontrada</p>
            <Button onClick={() => navigate('/dashboard')}>Volver al Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" style={{ paddingBottom: '100px' }}>
      <PageHeader 
        title={`Trazabilidad de ${pet.name}`}
        subtitle="Historial completo de actividades y gastos"
        gradient="from-purple-600 to-pink-600"
        showHamburgerMenu={true}
        onToggleHamburger={toggleMobileMenu}
        isHamburgerOpen={isMobileMenuOpen}
      >
        <Activity className="w-8 h-8" />
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="text-xl md:text-2xl font-bold">{stats.totalProducts}</div>
            <div className="text-xs md:text-sm opacity-90">Productos</div>
            <div className="text-xs opacity-75 mt-1">{formatPrice(stats.productsCost)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="text-xl md:text-2xl font-bold">{stats.totalServices}</div>
            <div className="text-xs md:text-sm opacity-90">Servicios</div>
            <div className="text-xs opacity-75 mt-1">{formatPrice(stats.servicesCost)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <Stethoscope className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="text-xl md:text-2xl font-bold">{stats.totalVeterinaryVisits}</div>
            <div className="text-xs md:text-sm opacity-90">Visitas Vet.</div>
            <div className="text-xs opacity-75 mt-1">{formatPrice(stats.veterinaryCost)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="text-xl md:text-2xl font-bold">{formatPrice(stats.totalCost)}</div>
            <div className="text-xs md:text-sm opacity-90">Costo Total</div>
            <div className="text-xs opacity-75 mt-1">Inversión total</div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalExerciseSessions}</div>
                <div className="text-sm text-gray-600">Sesiones de Ejercicio</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Utensils className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalNutritionSessions}</div>
                <div className="text-sm text-gray-600">Registros de Nutrición</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{events.length}</div>
                <div className="text-sm text-gray-600">Eventos Totales</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Timeline de Actividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No hay actividades registradas</p>
              <p className="text-sm">Las actividades de {pet.name} aparecerán aquí</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 md:left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              <div className="space-y-6">
                {events.map((event, index) => (
                  <div key={event.id} className="relative flex items-start gap-4 md:gap-6">
                    {/* Timeline dot */}
                    <div className={`relative z-10 w-8 h-8 md:w-12 md:h-12 rounded-full ${event.color} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                      {event.icon}
                    </div>

                    {/* Event content */}
                    <div className="flex-1 min-w-0 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base md:text-lg mb-1">{event.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(event.date)}</span>
                            </div>
                            {event.cost > 0 && (
                              <div className="flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                <span className="font-medium">{formatPrice(event.cost, event.currency)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowDetails(true);
                          }}
                          className="flex-shrink-0"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent?.icon}
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              {formatDate(selectedEvent?.date || '')}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {/* Product Details */}
              {selectedEvent.type === 'product' && selectedEvent.metadata?.orderItem && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Producto</label>
                      <p className="text-gray-900">{selectedEvent.metadata.orderItem.item_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Cantidad</label>
                      <p className="text-gray-900">{selectedEvent.metadata.itemPet.quantity}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Precio Unitario</label>
                      <p className="text-gray-900">{formatPrice(selectedEvent.metadata.orderItem.unit_price || 0, selectedEvent.currency)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total</label>
                      <p className="text-gray-900 font-semibold">{formatPrice(selectedEvent.cost, selectedEvent.currency)}</p>
                    </div>
                  </div>
                  {selectedEvent.metadata.orderItem.item_description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Descripción</label>
                      <p className="text-gray-900">{selectedEvent.metadata.orderItem.item_description}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Orden</label>
                    <p className="text-gray-900">{selectedEvent.metadata.order.order_number}</p>
                  </div>
                </div>
              )}

              {/* Service Details */}
              {selectedEvent.type === 'service' && selectedEvent.metadata && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Servicio</label>
                      <p className="text-gray-900">{selectedEvent.metadata.provider_services?.service_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Precio</label>
                      <p className="text-gray-900 font-semibold">{formatPrice(selectedEvent.cost, selectedEvent.currency)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Proveedor</label>
                      <p className="text-gray-900">{selectedEvent.metadata.provider_services?.providers?.business_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Duración</label>
                      <p className="text-gray-900">{selectedEvent.metadata.provider_services?.duration_minutes || 0} minutos</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Fecha</label>
                      <p className="text-gray-900">{formatDate(selectedEvent.metadata.appointment_date || selectedEvent.date)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Hora</label>
                      <p className="text-gray-900">{selectedEvent.metadata.appointment_time || formatTime(selectedEvent.date)}</p>
                    </div>
                  </div>
                  {selectedEvent.metadata.provider_services?.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Descripción</label>
                      <p className="text-gray-900">{selectedEvent.metadata.provider_services.description}</p>
                    </div>
                  )}
                  {selectedEvent.metadata.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Notas</label>
                      <p className="text-gray-900">{selectedEvent.metadata.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Veterinary Details */}
              {selectedEvent.type === 'veterinary' && selectedEvent.metadata && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tipo de Visita</label>
                      <p className="text-gray-900">{translateAppointmentType(selectedEvent.metadata.appointment_type)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Costo</label>
                      <p className="text-gray-900 font-semibold">{formatPrice(selectedEvent.cost, selectedEvent.currency)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Veterinario</label>
                      <p className="text-gray-900">{selectedEvent.metadata.veterinarian_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Clínica</label>
                      <p className="text-gray-900">{selectedEvent.metadata.veterinary_clinic || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Diagnóstico</label>
                      <p className="text-gray-900">{selectedEvent.metadata.diagnosis || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tratamiento</label>
                      <p className="text-gray-900">{selectedEvent.metadata.treatment || 'N/A'}</p>
                    </div>
                  </div>
                  {selectedEvent.metadata.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Notas</label>
                      <p className="text-gray-900">{selectedEvent.metadata.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Exercise Details */}
              {selectedEvent.type === 'exercise' && selectedEvent.metadata && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tipo de Ejercicio</label>
                      <p className="text-gray-900">{translateExerciseType(selectedEvent.metadata.exercise_type)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Duración</label>
                      <p className="text-gray-900">{selectedEvent.metadata.duration_minutes || 0} minutos</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Calorías</label>
                      <p className="text-gray-900">{selectedEvent.metadata.calories_burned || 0} cal</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Intensidad</label>
                      <p className="text-gray-900">{translateIntensity(selectedEvent.metadata.intensity)}</p>
                    </div>
                  </div>
                  {selectedEvent.metadata.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Notas</label>
                      <p className="text-gray-900">{selectedEvent.metadata.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Nutrition Details */}
              {selectedEvent.type === 'nutrition' && selectedEvent.metadata && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Alimento</label>
                      <p className="text-gray-900">{selectedEvent.metadata.food_name || 'Alimento'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Cantidad</label>
                      <p className="text-gray-900">{selectedEvent.metadata.quantity_per_meal || selectedEvent.metadata.quantity || 0} {selectedEvent.metadata.unit || 'g'}</p>
                    </div>
                    {selectedEvent.metadata.times_per_day && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Veces al Día</label>
                        <p className="text-gray-900">{selectedEvent.metadata.times_per_day}</p>
                      </div>
                    )}
                    {selectedEvent.metadata.meal_type && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tipo de Comida</label>
                        <p className="text-gray-900">{translateMealType(selectedEvent.metadata.meal_type)}</p>
                      </div>
                    )}
                  </div>
                  {selectedEvent.metadata.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Notas</label>
                      <p className="text-gray-900">{selectedEvent.metadata.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PetJourney;
