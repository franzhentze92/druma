import React, { useState, useEffect } from 'react';
import { 
  Calendar, Heart, Activity, Bell, TrendingUp, Clock, LogOut, 
  Stethoscope, Utensils, ShoppingBag, Package, Users, Settings,
  BarChart3, Target, Award, Zap, MapPin, Star, Plus, ArrowUpRight, 
  ArrowDownRight, Eye, MessageCircle, ShoppingCart, CreditCard, Search,
  Tag, Timer, Info, Building2, Coins
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FeedingNotification from './FeedingNotification';
import PageHeader from './PageHeader';
import { supabase } from '@/lib/supabase';
import '../services/AutoCompleteService'; // Initialize the auto-complete service
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  image_url?: string;
}

interface DashboardStats {
  totalPets: number;
  totalExerciseSessions: number;
  totalVeterinaryVisits: number;
  totalFeedingSchedules: number;
  avgExerciseMinutes: number;
  totalCaloriesBurned: number;
  upcomingAppointments: number;
  activeFeedingSchedules: number;
  totalOrders: number;
  totalSpent: number;
  totalReminders: number;
  activeBreedingMatches: number;
  totalAdoptionRequests: number;
}

interface ChartData {
  date: string;
  exercise: number;
  calories: number;
  vetVisits: number;
  feeding: number;
}

interface MonthlyData {
  month: string;
  exercise: number;
  vetVisits: number;
  orders: number;
  spent: number;
}

interface PetActivityData {
  name: string;
  exercise: number;
  vetVisits: number;
  feeding: number;
}

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  
  // Fetch user profile data (same as Ajustes component)
  const { data: userProfile } = useUserProfile(user?.id);
  
  // Get user's display name from profile data
  const getUserDisplayName = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Usuario';
  };
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPets: 0,
    totalExerciseSessions: 0,
    totalVeterinaryVisits: 0,
    totalFeedingSchedules: 0,
    avgExerciseMinutes: 0,
    totalCaloriesBurned: 0,
    upcomingAppointments: 0,
    activeFeedingSchedules: 0,
    totalOrders: 0,
    totalSpent: 0,
    totalReminders: 0,
    activeBreedingMatches: 0,
    totalAdoptionRequests: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [petActivityData, setPetActivityData] = useState<PetActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);


  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load pets
      const { data: petsData } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user?.id);
      
      setPets(petsData || []);

      // Load exercise sessions stats
      const { data: exerciseData } = await supabase
        .from('exercise_sessions')
        .select('duration_minutes, calories_burned, date, pet_id')
        .eq('owner_id', user?.id);

      // Load veterinary visits count
      const { data: vetData } = await supabase
        .from('veterinary_sessions')
        .select('id, date, pet_id')
        .eq('owner_id', user?.id);

      // Load feeding schedules count
      const { data: feedingData } = await supabase
        .from('pet_feeding_schedules')
        .select('id, is_active, pet_id')
        .eq('owner_id', user?.id);

      // Load orders count and total spent
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, total_amount, created_at')
        .eq('client_id', user?.id);

      // Load breeding matches count
      const { data: breedingMatchesData } = await supabase
        .from('breeding_matches')
        .select('id, status')
        .or(`owner_id.eq.${user?.id},partner_owner_id.eq.${user?.id}`)
        .in('status', ['pending', 'accepted']);

      // Load adoption requests count
      const { data: adoptionRequestsData } = await supabase
        .from('adoption_requests')
        .select('id')
        .eq('user_id', user?.id);

      // Load service appointments
      const { data: appointmentsData } = await supabase
        .from('service_appointments')
        .select(`
          *,
          provider_services (
            service_name,
            service_category,
            description,
            detailed_description,
            price,
            currency,
            duration_minutes,
            preparation_instructions,
            cancellation_policy,
            providers (
              business_name,
              address,
              phone
            )
          ),
          provider_service_time_slots:provider_service_time_slots!service_appointments_time_slot_id_fkey (
            slot_start_time,
            slot_end_time
          )
        `)
        .eq('client_id', user?.id)
        .order('appointment_date', { ascending: true });
      
      const processedAppointments = (appointmentsData || []).map(apt => {
        // Get time slot information
        const timeSlot = apt.provider_service_time_slots;
        let appointmentTime = '';
        if (timeSlot?.slot_start_time && timeSlot?.slot_end_time) {
          appointmentTime = `${timeSlot.slot_start_time.substring(0, 5)} - ${timeSlot.slot_end_time.substring(0, 5)}`;
        } else if (apt.appointment_time) {
          appointmentTime = apt.appointment_time;
        } else if (apt.appointment_date) {
          // Fallback to appointment_date if time slot not available
          appointmentTime = format(parseISO(apt.appointment_date), 'HH:mm');
        }
        
        return {
          ...apt,
          appointment_time: appointmentTime
        };
      });
      
      setAppointments(processedAppointments);

      const exerciseSessions = exerciseData || [];
      const veterinaryVisits = vetData || [];
      const feedingSchedules = feedingData || [];
      const orders = ordersData || [];
      const breedingMatches = breedingMatchesData || [];
      const adoptionRequests = adoptionRequestsData || [];

      const avgExerciseMinutes = exerciseSessions.length > 0 
        ? Math.round(exerciseSessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) / exerciseSessions.length)
        : 0;

      const totalCaloriesBurned = exerciseSessions.reduce((sum, session) => sum + (session.calories_burned || 0), 0);

      // Generate chart data for the last 7 days from real data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // Count exercise sessions for this date
        const dayExerciseSessions = exerciseSessions.filter(session => {
          if (!session.date) return false;
          const sessionDate = format(parseISO(session.date), 'yyyy-MM-dd');
          return sessionDate === dateStr;
        });
        const dayExerciseCount = dayExerciseSessions.length;
        const dayCalories = dayExerciseSessions.reduce((sum, s) => sum + (s.calories_burned || 0), 0);
        
        // Count veterinary visits for this date
        const dayVetVisits = veterinaryVisits.filter(visit => {
          if (!visit.date) return false;
          const visitDate = format(parseISO(visit.date), 'yyyy-MM-dd');
          return visitDate === dateStr;
        }).length;
        
        // Count feeding schedules active on this date (simplified - count active schedules)
        const dayFeeding = feedingSchedules.filter(s => s.is_active).length;
        
        return {
          date: format(date, 'MMM dd'),
          exercise: dayExerciseCount,
          calories: dayCalories,
          vetVisits: dayVetVisits,
          feeding: dayFeeding
        };
      });

      // Generate monthly data for the last 6 months from real data
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = subDays(new Date(), (5 - i) * 30);
        const monthStart = startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
        const monthEnd = endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
        
        // Count exercise sessions in this month
        const monthExercise = exerciseSessions.filter(session => {
          if (!session.date) return false;
          const sessionDate = parseISO(session.date);
          return sessionDate >= monthStart && sessionDate <= monthEnd;
        }).length;
        
        // Count veterinary visits in this month
        const monthVetVisits = veterinaryVisits.filter(visit => {
          if (!visit.date) return false;
          const visitDate = parseISO(visit.date);
          return visitDate >= monthStart && visitDate <= monthEnd;
        }).length;
        
        // Count orders in this month
        const monthOrders = orders.filter(order => {
          if (!order.created_at) return false;
          const orderDate = parseISO(order.created_at);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });
        const monthSpent = monthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        
        return {
          month: format(date, 'MMM'),
          exercise: monthExercise,
          vetVisits: monthVetVisits,
          orders: monthOrders.length,
          spent: monthSpent
        };
      });

      // Generate pet activity data from real data
      const petActivity = petsData?.map(pet => {
        // Count exercise sessions for this pet
        const petExerciseSessions = exerciseSessions.filter(session => session.pet_id === pet.id);
        const petExerciseCount = petExerciseSessions.length;
        
        // Count veterinary visits for this pet
        const petVetVisits = veterinaryVisits.filter(visit => visit.pet_id === pet.id).length;
        
        // Count feeding schedules for this pet
        const petFeedingSchedules = feedingSchedules.filter(schedule => schedule.pet_id === pet.id).length;
        
        return {
          name: pet.name,
          exercise: petExerciseCount,
          vetVisits: petVetVisits,
          feeding: petFeedingSchedules
        };
      }) || [];

      const totalSpent = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

      setStats({
        totalPets: petsData?.length || 0,
        totalExerciseSessions: exerciseSessions.length,
        totalVeterinaryVisits: veterinaryVisits.length,
        totalFeedingSchedules: feedingSchedules.length,
        avgExerciseMinutes,
        totalCaloriesBurned,
        upcomingAppointments: appointments.filter(apt => {
          if (!apt.appointment_date) return false;
          const aptDate = parseISO(apt.appointment_date);
          return aptDate >= startOfDay(new Date());
        }).length,
        activeFeedingSchedules: feedingSchedules.filter(schedule => schedule.is_active).length,
        totalOrders: orders.length,
        totalSpent: totalSpent,
        totalReminders: 0, // TODO: Load from reminders table when available
        activeBreedingMatches: breedingMatches.length,
        totalAdoptionRequests: adoptionRequests.length
      });

      setChartData(last7Days);
      setMonthlyData(last6Months);
      setPetActivityData(petActivity);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      localStorage.removeItem('user_role');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const platformSections = [
    // My Pet Journey Section
    {
      id: 'pet-journey',
      title: 'My Pet Journey',
      description: 'Historial completo de tus mascotas',
      icon: Calendar,
      color: 'from-purple-500 to-pink-600',
      stats: `${pets.length} ${pets.length === 1 ? 'mascota' : 'mascotas'}`,
      action: 'Ver Historial',
      path: pets.length === 1 ? `/pet-journey/${pets[0]?.id}` : '/ajustes'
    },
    // Tienda Section
    {
      id: 'marketplace',
      title: 'Tienda',
      description: 'Productos y servicios para tus mascotas',
      icon: ShoppingBag,
      color: 'from-orange-500 to-red-600',
      stats: `${stats.totalOrders} órdenes`,
      action: 'Ver Tienda',
      path: '/marketplace'
    },
    {
      id: 'orders',
      title: 'Mis Órdenes',
      description: 'Gestiona tus compras y servicios',
      icon: ShoppingCart,
      color: 'from-purple-500 to-indigo-600',
      stats: `${stats.totalOrders} órdenes`,
      action: 'Ver Órdenes',
      path: '/client-orders'
    },
    // Cuidado Section
    {
      id: 'feeding-schedules',
      title: 'Nutrición',
      description: 'Gestiona horarios de alimentación automática',
      icon: Utensils,
      color: 'from-emerald-500 to-green-600',
      stats: `${stats.activeFeedingSchedules} horarios activos`,
      action: 'Ver Nutrición',
      path: '/feeding-schedules'
    },
    {
      id: 'trazabilidad',
      title: 'Ejercicio',
      description: 'Registra y analiza el ejercicio de tus mascotas',
      icon: Activity,
      color: 'from-green-500 to-teal-600',
      stats: `${stats.totalExerciseSessions} sesiones`,
      action: 'Ver Ejercicio',
      path: '/trazabilidad'
    },
    {
      id: 'veterinaria',
      title: 'Veterinaria',
      description: 'Registra citas y análisis veterinarios',
      icon: Stethoscope,
      color: 'from-red-500 to-pink-600',
      stats: `${stats.totalVeterinaryVisits} visitas`,
      action: 'Ver Veterinaria',
      path: '/veterinaria'
    },
    // Adopción Section
    {
      id: 'adopcion',
      title: 'Adopción',
      description: 'Encuentra tu mascota perfecta',
      icon: Users,
      color: 'from-green-500 to-emerald-600',
      stats: `${stats.totalAdoptionRequests} solicitudes`,
      action: 'Ver Adopción',
      path: '/adopcion'
    },
    // Social Section
    {
      id: 'parejas',
      title: 'Parejas',
      description: 'Encuentra la pareja perfecta para tu mascota',
      icon: Heart,
      color: 'from-pink-500 to-purple-600',
      stats: `${stats.activeBreedingMatches} matches activos`,
      action: 'Ver Parejas',
      path: '/parejas'
    },
    {
      id: 'mascotas-perdidas',
      title: 'Mascotas Perdidas',
      description: 'Reporta y busca mascotas perdidas',
      icon: Search,
      color: 'from-orange-500 to-red-600',
      stats: 'Mapa de búsqueda',
      action: 'Ver Mapa',
      path: '/mascotas-perdidas'
    },
    // Ajustes Section
    {
      id: 'ajustes',
      title: 'Ajustes',
      description: 'Gestiona tu perfil y configuración',
      icon: Settings,
      color: 'from-gray-500 to-slate-600',
      stats: 'Configuración',
      action: 'Ver Ajustes',
      path: '/ajustes'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" style={{ paddingBottom: '100px' }}>
      {/* Header */}
      <PageHeader 
        title={`¡Bienvenido, ${getUserDisplayName()}!`}
        subtitle="Tu plataforma integral para el cuidado de mascotas"
        gradient="from-purple-600 to-pink-600"
        showNotifications={false}
      >
        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          <div className="flex items-center space-x-2">
            <Heart className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-sm md:text-base">
              <span className="hidden sm:inline">{stats.totalPets} mascota{stats.totalPets !== 1 ? 's' : ''}</span>
              <span className="sm:hidden">{stats.totalPets} mascota{stats.totalPets !== 1 ? 's' : ''}</span>
            </span>
          </div>
        </div>
      </PageHeader>

      {/* Feeding Notifications */}
      <FeedingNotification />

      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-teal-600 text-white border-0">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-4 h-4 md:w-5 md:h-5" />
              <div className="flex items-center text-green-200">
                <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="text-xs">+12%</span>
              </div>
            </div>
            <div className="text-xl md:text-2xl font-bold">{stats.totalExerciseSessions}</div>
            <div className="text-xs md:text-sm opacity-90">Sesiones de Ejercicio</div>
            <div className="text-xs opacity-75 mt-1">{stats.totalCaloriesBurned} calorías quemadas</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-0">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <Utensils className="w-4 h-4 md:w-5 md:h-5" />
              <div className="flex items-center text-orange-200">
                <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="text-xs">+8%</span>
              </div>
            </div>
            <div className="text-xl md:text-2xl font-bold">{stats.activeFeedingSchedules}</div>
            <div className="text-xs md:text-sm opacity-90">Horarios Activos</div>
            <div className="text-xs opacity-75 mt-1">Alimentación automatizada</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-pink-600 text-white border-0">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <Stethoscope className="w-4 h-4 md:w-5 md:h-5" />
              <div className="flex items-center text-red-200">
                <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="text-xs">+5%</span>
              </div>
            </div>
            <div className="text-xl md:text-2xl font-bold">{stats.totalVeterinaryVisits}</div>
            <div className="text-xs md:text-sm opacity-90">Visitas Veterinarias</div>
            <div className="text-xs opacity-75 mt-1">Historial médico completo</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
              <div className="flex items-center text-blue-200">
                <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="text-xs">+15%</span>
              </div>
            </div>
            <div className="text-xl md:text-2xl font-bold">Q{stats.totalSpent.toFixed(2)}</div>
            <div className="text-xs md:text-sm opacity-90">Total Gastado</div>
            <div className="text-xs opacity-75 mt-1">{stats.totalOrders} órdenes completadas</div>
          </CardContent>
        </Card>
      </div>

      {/* My Pet Journey Section - Featured */}
      {pets.length > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                  <Calendar className="w-6 h-6 md:w-7 md:h-7 text-purple-600" />
                  My Pet Journey
                </CardTitle>
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  Historial completo y trazabilidad de tus mascotas
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pets.map((pet) => (
                <div
                  key={pet.id}
                  onClick={() => navigate(`/pet-journey/${pet.id}`)}
                  className="bg-white rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {pet.image_url ? (
                      <img
                        src={pet.image_url}
                        alt={pet.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-xl font-bold">
                        {pet.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{pet.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{pet.breed || pet.species}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    {pet.age && <span>{pet.age} años</span>}
                    {pet.weight && <span>{pet.weight} kg</span>}
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/pet-journey/${pet.id}`);
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Ver Historial Completo
                  </Button>
                </div>
              ))}
            </div>
            {pets.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 mb-4">No tienes mascotas registradas</p>
                <Button
                  onClick={() => navigate('/ajustes')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                >
                  Agregar Mascota
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Appointments Calendar Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100/50">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Calendar className="w-6 h-6 text-emerald-700" />
            </div>
            <span className="text-gray-800">Mis Citas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {appointments.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                <Calendar className="w-12 h-12 text-emerald-400" />
              </div>
              <p className="text-lg font-medium text-gray-700 mb-2">No tienes citas programadas</p>
              <p className="text-sm text-gray-500 mb-4">Reserva servicios desde el marketplace</p>
              <Button
                onClick={() => navigate('/marketplace/services')}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                Ver Servicios Disponibles
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
              {/* Calendar View */}
              <div className="lg:col-span-8 w-full overflow-hidden">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 md:p-6 lg:p-8 w-full overflow-x-auto">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border w-full min-w-[280px]"
                    modifiers={{
                      hasAppointments: appointments.map(apt => 
                        startOfDay(parseISO(apt.appointment_date))
                      )
                    }}
                    modifiersClassNames={{
                      hasAppointments: "bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-800 font-semibold border border-purple-200"
                    }}
                  />
                  {selectedDate && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-900">
                        {appointments.filter(apt => isSameDay(parseISO(apt.appointment_date), selectedDate)).length} 
                        {' '}cita{appointments.filter(apt => isSameDay(parseISO(apt.appointment_date), selectedDate)).length !== 1 ? 's' : ''} 
                        {' '}el {format(selectedDate, "d 'de' MMMM", { locale: es })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Appointments List for Selected Date */}
              <div className="lg:col-span-4 w-full">
                <div className="sticky top-6 w-full">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-4 border border-gray-200">
                    <h3 className="font-bold text-lg text-gray-800 capitalize">
                      {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: es }) : 'Selecciona una fecha'}
                    </h3>
                    {selectedDate && (
                      <p className="text-sm text-gray-600 mt-1">
                        {appointments.filter(apt => isSameDay(parseISO(apt.appointment_date), selectedDate)).length} 
                        {' '}cita{appointments.filter(apt => isSameDay(parseISO(apt.appointment_date), selectedDate)).length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  {selectedDate ? (
                    <div className="space-y-4 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
                      {appointments
                        .filter(apt => isSameDay(parseISO(apt.appointment_date), selectedDate))
                        .sort((a, b) => {
                          const timeA = a.appointment_time || '00:00';
                          const timeB = b.appointment_time || '00:00';
                          return timeA.localeCompare(timeB);
                        })
                        .map((appointment) => (
                          <div 
                            key={appointment.id} 
                            className="group relative bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-lg transition-all duration-300"
                          >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <h4 className="font-bold text-gray-900 text-base truncate">
                                      {appointment.provider_services?.service_name || 'Servicio'}
                                    </h4>
                                    <Badge 
                                      variant={appointment.status === 'confirmed' ? 'default' : appointment.status === 'pending' ? 'secondary' : appointment.status === 'completed' ? 'default' : 'destructive'} 
                                      className="shrink-0 text-xs font-semibold px-2 py-1 shadow-sm"
                                    >
                                      {appointment.status === 'confirmed' && '✓ Confirmada'}
                                      {appointment.status === 'pending' && '⏳ Pendiente'}
                                      {appointment.status === 'cancelled' && '✕ Cancelada'}
                                      {appointment.status === 'completed' && '✓ Completada'}
                                    </Badge>
                                  </div>
                                  <div className="space-y-2.5">
                                    {appointment.provider_services?.service_category && (
                                      <div className="flex items-center gap-2 text-sm text-gray-700 bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                                        <Tag className="w-4 h-4 text-purple-600 shrink-0" />
                                        <span className="font-medium capitalize">{appointment.provider_services.service_category}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                                      <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span className="font-medium">{appointment.appointment_time}</span>
                                    </div>
                                    {appointment.provider_services?.duration_minutes && (
                                      <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                                        <Timer className="w-4 h-4 text-blue-600 shrink-0" />
                                        <span className="font-medium">Duración: {appointment.provider_services.duration_minutes} minutos</span>
                                      </div>
                                    )}
                                    {appointment.provider_services?.providers?.business_name && (
                                      <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                                        <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                                        <span className="truncate font-medium">{appointment.provider_services.providers.business_name}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg px-3 py-2 border border-emerald-100">
                                      <Coins className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span className="font-bold text-emerald-700">
                                        {appointment.provider_services?.currency === 'GTQ' ? 'Q.' : '$'}{appointment.provider_services?.price || 0}
                                      </span>
                                    </div>
                                    {appointment.provider_services?.description && (
                                      <div className="mt-3 pt-3 border-t border-gray-200">
                                        <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                          <div>
                                            <span className="font-semibold text-blue-700 block mb-1">Descripción:</span>
                                            <p className="text-gray-700">{appointment.provider_services.description}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {appointment.notes && (
                                      <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-xs text-gray-600 italic bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                                          <span className="font-semibold text-blue-700">Mis Notas:</span> {appointment.notes}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      {appointments.filter(apt => isSameDay(parseISO(apt.appointment_date), selectedDate)).length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <Calendar className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="font-medium text-gray-600">No hay citas para este día</p>
                          <p className="text-sm text-gray-500 mt-1">Selecciona otra fecha</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="font-medium text-gray-600">Selecciona una fecha</p>
                      <p className="text-sm text-gray-500 mt-1">en el calendario para ver las citas</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts and Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Activity Trends Chart */}
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              Tendencias de Actividad (Últimos 7 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorExercise" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip 
                  formatter={(value, name) => [
                    value, 
                    name === 'exercise' ? 'Ejercicio' : name === 'calories' ? 'Calorías' : name
                  ]}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Area type="monotone" dataKey="exercise" stroke="#10b981" fillOpacity={1} fill="url(#colorExercise)" />
                <Area type="monotone" dataKey="calories" stroke="#f59e0b" fillOpacity={1} fill="url(#colorCalories)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Overview */}
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              Resumen Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value, name) => [
                    value, 
                    name === 'exercise' ? 'Ejercicio' : 
                    name === 'vetVisits' ? 'Visitas Veterinarias' : 
                    name === 'orders' ? 'Órdenes' : 
                    name === 'spent' ? 'Gastado' : name
                  ]}
                  labelFormatter={(label) => `Mes: ${label}`}
                />
                <Legend />
                <Bar dataKey="exercise" fill="#10b981" name="Ejercicio" />
                <Bar dataKey="vetVisits" fill="#ef4444" name="Visitas Veterinarias" />
                <Bar dataKey="orders" fill="#3b82f6" name="Órdenes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pet Activity and Platform Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Pet Activity Chart */}
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Heart className="w-4 h-4 md:w-5 md:h-5 text-pink-600" />
              Actividad por Mascota
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-2 pr-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={petActivityData}
                  cx="60%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, exercise }) => `${name}: ${exercise}`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="exercise"
                >
                  {petActivityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#ef4444', '#3b82f6'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} sesiones`, 
                    name === 'exercise' ? 'Ejercicio' : name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform Sections */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              Resumen de Secciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 max-h-[600px] overflow-y-auto">
            {platformSections.map((section) => {
              const IconComponent = section.icon;
              return (
                <div 
                  key={section.id}
                  className={`bg-gradient-to-r ${section.color} rounded-xl p-3 md:p-4 text-white cursor-pointer hover:scale-105 transition-transform`}
                  onClick={() => section.path ? navigate(section.path) : navigate(`/client-dashboard?section=${section.id}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm md:text-base truncate">{section.title}</h3>
                        <p className="text-xs md:text-sm opacity-90 line-clamp-1">{section.description}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <div className="text-xs md:text-sm opacity-90">{section.stats}</div>
                      <div className="text-xs opacity-75">{section.action}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Tabs */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
            Análisis Avanzado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="overview" className="text-xs md:text-sm">Resumen</TabsTrigger>
              <TabsTrigger value="health" className="text-xs md:text-sm">Salud</TabsTrigger>
              <TabsTrigger value="spending" className="text-xs md:text-sm">Gastos</TabsTrigger>
              <TabsTrigger value="social" className="text-xs md:text-sm">Social</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4 md:mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 md:p-6 rounded-xl">
                  <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <Activity className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800 text-sm md:text-base">Ejercicio</h3>
                      <p className="text-xs md:text-sm text-green-600">{stats.totalExerciseSessions} sesiones</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Promedio diario</span>
                      <span className="font-medium text-green-800">{Math.round(stats.totalExerciseSessions / 7)} min</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-800">Visibilidad</h3>
                      <p className="text-sm text-blue-600">{stats.activeBreedingMatches} matches activos</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">Perfil completo</span>
                      <span className="font-medium text-blue-800">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-800">Social</h3>
                      <p className="text-sm text-purple-600">{stats.totalAdoptionRequests} solicitudes</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-700">Interacciones</span>
                      <span className="font-medium text-purple-800">+23%</span>
                    </div>
                    <Progress value={23} className="h-2" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="health" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-red-800 mb-4 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5" />
                    Salud Veterinaria
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-red-700">Visitas este mes</span>
                      <span className="font-medium text-red-800">{Math.floor(stats.totalVeterinaryVisits / 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">Próxima cita</span>
                      <span className="font-medium text-red-800">15 días</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">Vacunas al día</span>
                      <Badge className="bg-green-100 text-green-800">Sí</Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-orange-800 mb-4 flex items-center gap-2">
                    <Utensils className="w-5 h-5" />
                    Nutrición
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-orange-700">Horarios activos</span>
                      <span className="font-medium text-orange-800">{stats.activeFeedingSchedules}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-700">Comidas hoy</span>
                      <span className="font-medium text-orange-800">3/4</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-700">Estado</span>
                      <Badge className="bg-green-100 text-green-800">Excelente</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="spending" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <ShoppingCart className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-800">Marketplace</h3>
                      <p className="text-2xl font-bold text-green-900">${Math.floor(stats.totalSpent * 0.6)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-green-700">{stats.totalOrders} órdenes completadas</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Stethoscope className="w-8 h-8 text-red-600" />
                    <div>
                      <h3 className="font-semibold text-red-800">Veterinaria</h3>
                      <p className="text-2xl font-bold text-red-900">${Math.floor(stats.totalSpent * 0.3)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-red-700">{stats.totalVeterinaryVisits} visitas este año</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Heart className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-blue-800">Otros</h3>
                      <p className="text-2xl font-bold text-blue-900">${Math.floor(stats.totalSpent * 0.1)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700">Servicios adicionales</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="social" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-pink-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-pink-800 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Parejas
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-pink-700">Matches activos</span>
                      <span className="font-medium text-pink-800">{stats.activeBreedingMatches}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-pink-700">Solicitudes enviadas</span>
                      <span className="font-medium text-pink-800">{Math.floor(stats.activeBreedingMatches / 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-pink-700">Perfil completo</span>
                      <Badge className="bg-green-100 text-green-800">100%</Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Adopción
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-purple-700">Solicitudes enviadas</span>
                      <span className="font-medium text-purple-800">{stats.totalAdoptionRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">En proceso</span>
                      <span className="font-medium text-purple-800">{Math.floor(stats.totalAdoptionRequests / 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Favoritos</span>
                      <span className="font-medium text-purple-800">5</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;