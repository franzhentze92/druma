import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, Heart, Activity, Bell, TrendingUp, Clock, 
  Stethoscope, Utensils, ShoppingBag, Package, Users, 
  BarChart3, Target, Award, Zap, MapPin, Star, Plus, 
  ArrowUpRight, ArrowDownRight, Eye, MessageCircle, 
  ShoppingCart, CreditCard, Search, Filter, Download,
  FileText, Image as ImageIcon, Syringe, Scissors,
  Home, Car, GraduationCap, FileCheck, AlertCircle,
  CheckCircle2, XCircle, Info, ChevronRight, ChevronDown,
  ExternalLink, FileDown, Share2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isAfter, isBefore, subDays, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import PetStatusCore from '@/components/PetStatusCore';
import { PetStatusService, PetStatus, StatusRecommendation } from '@/services/petStatusService';
import SettingsDropdown from '@/components/SettingsDropdown';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age: number | null;
  weight: number | null;
  microchip: string | null;
  image_url: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface JourneyEvent {
  id: string;
  type: 'origin' | 'nutrition' | 'exercise' | 'veterinary' | 'vaccination' | 'service' | 'purchase' | 'reminder' | 'health' | 'meal' | 'adventure';
  title: string;
  description: string;
  date: string;
  icon: React.ReactNode;
  color: string;
  metadata?: any;
}

interface SectionData {
  veterinary: JourneyEvent[];
  exercise: JourneyEvent[];
  nutrition: JourneyEvent[];
  purchases: JourneyEvent[];
  reminders: JourneyEvent[];
  meals: JourneyEvent[];
  adventures: JourneyEvent[];
}

const PetJourney: React.FC = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<JourneyEvent[]>([]);
  const [sectionData, setSectionData] = useState<SectionData>({
    veterinary: [],
    exercise: [],
    nutrition: [],
    purchases: [],
    reminders: [],
    meals: [],
    adventures: []
  });
  const [filteredEvents, setFilteredEvents] = useState<JourneyEvent[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  
  // Pet Status (Tamagotchi-style)
  const [petStatus, setPetStatus] = useState<PetStatus | null>(null);
  const [statusRecommendations, setStatusRecommendations] = useState<StatusRecommendation[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);

  // Load pet data
  useEffect(() => {
    if (petId && user) {
      loadPetData();
    }
  }, [petId, user]);

  // Load all journey data
  useEffect(() => {
    if (pet && user) {
      loadJourneyData();
      loadPetStatus();
    }
  }, [pet, user]);

  // Reload status periodically (every 5 minutes)
  useEffect(() => {
    if (pet && user) {
      const interval = setInterval(() => {
        loadPetStatus();
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [pet, user]);

  // Filter events
  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, filterType, dateRange]);

  const loadPetData = async () => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .eq('owner_id', user?.id)
        .single();

      if (error) throw error;
      setPet(data);
    } catch (error) {
      console.error('Error loading pet:', error);
      toast.error('Error al cargar la información de la mascota');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadPetStatus = async () => {
    if (!pet || !user) return;

    try {
      setStatusLoading(true);
      const status = await PetStatusService.calculatePetStatus(pet.id);
      const recommendations = PetStatusService.getRecommendations(status);
      
      setPetStatus(status);
      setStatusRecommendations(recommendations);
    } catch (error) {
      console.error('Error loading pet status:', error);
      // Don't show error toast, just log it
    } finally {
      setStatusLoading(false);
    }
  };

  const loadJourneyData = async () => {
    if (!pet || !user) return;

    try {
      setLoading(true);
      const allEvents: JourneyEvent[] = [];
      const sections: SectionData = {
        veterinary: [],
        exercise: [],
        nutrition: [],
        purchases: [],
        reminders: [],
        meals: [],
        adventures: []
      };

      // 1. Origin & Profile
      allEvents.push({
        id: `origin-${pet.id}`,
        type: 'origin',
        title: 'Registro en PetHub',
        description: `${pet.name} fue registrado en PetHub`,
        date: pet.created_at,
        icon: <Star className="w-5 h-5" />,
        color: 'bg-blue-500',
        metadata: { pet }
      });

      // 2. Veterinary Sessions
      const { data: vetSessions } = await supabase
        .from('veterinary_sessions')
        .select('*')
        .eq('pet_id', pet.id)
        .order('date', { ascending: false });

      if (vetSessions) {
        vetSessions.forEach(session => {
          const event: JourneyEvent = {
            id: `vet-${session.id}`,
            type: 'veterinary',
            title: `Visita Veterinaria: ${session.appointment_type}`,
            description: `${session.veterinarian_name}${session.veterinary_clinic ? ` - ${session.veterinary_clinic}` : ''}${session.diagnosis ? ` | ${session.diagnosis}` : ''}`,
            date: session.date,
            icon: <Stethoscope className="w-5 h-5" />,
            color: 'bg-red-500',
            metadata: session
          };
          allEvents.push(event);
          sections.veterinary.push(event);
        });
      }

      // 3. Exercise Sessions
      const { data: exerciseSessions } = await supabase
        .from('exercise_sessions')
        .select('*')
        .eq('pet_id', pet.id)
        .order('session_date', { ascending: false });

      if (exerciseSessions) {
        exerciseSessions.forEach(session => {
          const event: JourneyEvent = {
            id: `exercise-${session.id}`,
            type: 'exercise',
            title: `Ejercicio: ${session.exercise_type}`,
            description: `${session.duration_minutes} minutos${session.calories_burned ? ` | ${session.calories_burned} calorías` : ''}`,
            date: session.session_date,
            icon: <Activity className="w-5 h-5" />,
            color: 'bg-green-500',
            metadata: session
          };
          allEvents.push(event);
          sections.exercise.push(event);
        });
      }

      // 4. Feeding Schedules
      const { data: feedingSchedules } = await supabase
        .from('pet_feeding_schedules')
        .select('*')
        .eq('pet_id', pet.id)
        .order('created_at', { ascending: false });

      if (feedingSchedules) {
        feedingSchedules.forEach(schedule => {
          const event: JourneyEvent = {
            id: `feeding-${schedule.id}`,
            type: 'nutrition',
            title: `Horario de Alimentación: ${schedule.food_name || 'Alimento'}`,
            description: `${schedule.quantity_per_meal} ${schedule.unit || 'g'} - ${schedule.times_per_day} veces al día`,
            date: schedule.created_at,
            icon: <Utensils className="w-5 h-5" />,
            color: 'bg-yellow-500',
            metadata: schedule
          };
          allEvents.push(event);
          sections.nutrition.push(event);
        });
      }

      // 5. Meal Records (if table exists)
      try {
        const { data: mealRecords } = await supabase
          .from('meal_records')
          .select('*')
          .eq('pet_id', pet.id)
          .order('fed_at', { ascending: false })
          .limit(50);

        if (mealRecords) {
          mealRecords.forEach(meal => {
            const event: JourneyEvent = {
              id: `meal-${meal.id}`,
              type: 'meal',
              title: `${meal.meal_type}: ${meal.food_name}`,
              description: `${meal.quantity}g${meal.notes ? ` | ${meal.notes}` : ''}`,
              date: meal.fed_at,
              icon: <Utensils className="w-5 h-5" />,
              color: 'bg-orange-500',
              metadata: meal
            };
            allEvents.push(event);
            sections.meals.push(event);
          });
        }
      } catch (error) {
        // Table might not exist, skip
      }

      // 6. Adventure Logs (if table exists)
      try {
        const { data: adventures } = await supabase
          .from('adventure_logs')
          .select('*')
          .eq('pet_id', pet.id)
          .order('adventure_date', { ascending: false })
          .limit(50);

        if (adventures) {
          adventures.forEach(adventure => {
            const event: JourneyEvent = {
              id: `adventure-${adventure.id}`,
              type: 'adventure',
              title: `Aventura: ${adventure.activity_type}`,
              description: `${adventure.duration_minutes} min${adventure.distance_km ? ` | ${adventure.distance_km} km` : ''}${adventure.calories_burned ? ` | ${adventure.calories_burned} cal` : ''}`,
              date: adventure.adventure_date,
              icon: <MapPin className="w-5 h-5" />,
              color: 'bg-indigo-500',
              metadata: adventure
            };
            allEvents.push(event);
            sections.adventures.push(event);
          });
        }
      } catch (error) {
        // Table might not exist, skip
      }

      // 7. Health Records (if table exists)
      try {
        const { data: healthRecords } = await supabase
          .from('health_records')
          .select('*')
          .eq('pet_id', pet.id)
          .order('date', { ascending: false });

        if (healthRecords) {
          healthRecords.forEach(record => {
            if (record.visit_type === 'vaccination') {
              const event: JourneyEvent = {
                id: `vaccination-${record.id}`,
                type: 'vaccination',
                title: `Vacunación: ${record.diagnosis || 'Vacuna'}`,
                description: `${record.veterinarian} - ${record.clinic}`,
                date: record.date,
                icon: <Syringe className="w-5 h-5" />,
                color: 'bg-blue-500',
                metadata: record
              };
              allEvents.push(event);
            } else {
              const event: JourneyEvent = {
                id: `health-${record.id}`,
                type: 'health',
                title: `Registro de Salud: ${record.visit_type}`,
                description: `${record.veterinarian}${record.diagnosis ? ` | ${record.diagnosis}` : ''}`,
                date: record.date,
                icon: <Heart className="w-5 h-5" />,
                color: 'bg-pink-500',
                metadata: record
              };
              allEvents.push(event);
            }
          });
        }
      } catch (error) {
        // Table might not exist, skip
      }

      // 8. Reminders
      try {
        const { data: reminders } = await supabase
          .from('pet_reminders')
          .select('*')
          .eq('pet_id', pet.id)
          .order('due_date', { ascending: false })
          .limit(50);

        if (reminders) {
          reminders.forEach(reminder => {
            const event: JourneyEvent = {
              id: `reminder-${reminder.id}`,
              type: 'reminder',
              title: reminder.title,
              description: reminder.description || '',
              date: reminder.due_date,
              icon: <Bell className="w-5 h-5" />,
              color: reminder.is_completed ? 'bg-gray-500' : reminder.priority === 'urgent' ? 'bg-red-600' : 'bg-yellow-500',
              metadata: reminder
            };
            allEvents.push(event);
            sections.reminders.push(event);
          });
        }
      } catch (error) {
        // Table might not exist, skip
      }

      // 9. Orders (Marketplace purchases)
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (orders) {
        orders.forEach(order => {
          const event: JourneyEvent = {
            id: `order-${order.id}`,
            type: 'purchase',
            title: `Compra: ${order.order_number}`,
            description: `${order.order_items?.length || 0} items | Total: ${order.currency === 'GTQ' ? 'Q.' : '$'}${order.grand_total.toFixed(2)}`,
            date: order.created_at,
            icon: <ShoppingBag className="w-5 h-5" />,
            color: 'bg-purple-500',
            metadata: order
          };
          allEvents.push(event);
          sections.purchases.push(event);
        });
      }

      // Sort all events by date (newest first)
      allEvents.sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      setEvents(allEvents);
      setSectionData(sections);
    } catch (error) {
      console.error('Error loading journey data:', error);
      toast.error('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(term) ||
        event.description.toLowerCase().includes(term)
      );
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(event => {
        const eventDate = parseISO(event.date);
        switch (dateRange) {
          case 'today':
            return startOfDay(eventDate).getTime() === startOfDay(now).getTime();
          case 'week':
            return isAfter(eventDate, subDays(now, 7));
          case 'month':
            return isAfter(eventDate, subDays(now, 30));
          case 'year':
            return isAfter(eventDate, subDays(now, 365));
          default:
            return true;
        }
      });
    }

    setFilteredEvents(filtered);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getHealthStatus = () => {
    const recentVetVisits = events.filter(e => 
      e.type === 'veterinary' && 
      isAfter(parseISO(e.date), subDays(new Date(), 90))
    );
    
    if (recentVetVisits.length === 0) {
      return { status: 'warning', label: 'Sin visitas recientes', color: 'text-yellow-600', bgColor: 'bg-yellow-400' };
    }
    
    return { status: 'good', label: 'Salud al día', color: 'text-green-600', bgColor: 'bg-green-400' };
  };

  const calculateInsights = () => {
    const now = new Date();
    const last30Days = subDays(now, 30);
    
    const recentExercise = sectionData.exercise.filter(e => isAfter(parseISO(e.date), last30Days));
    const recentMeals = sectionData.meals.filter(e => isAfter(parseISO(e.date), last30Days));
    const recentVet = sectionData.veterinary.filter(e => isAfter(parseISO(e.date), last30Days));
    
    const totalExerciseMinutes = recentExercise.reduce((sum, e) => sum + (e.metadata?.duration_minutes || 0), 0);
    const avgExercisePerWeek = totalExerciseMinutes / 4;
    
    const upcomingReminders = sectionData.reminders.filter(r => {
      const dueDate = parseISO(r.date);
      return isAfter(dueDate, now) && !r.metadata?.is_completed;
    }).slice(0, 5);
    
    const overdueReminders = sectionData.reminders.filter(r => {
      const dueDate = parseISO(r.date);
      return isBefore(dueDate, now) && !r.metadata?.is_completed;
    });
    
    return {
      totalExerciseMinutes,
      avgExercisePerWeek,
      recentMeals: recentMeals.length,
      recentVet: recentVet.length,
      upcomingReminders,
      overdueReminders,
      wellnessScore: Math.min(100, (recentVet.length * 20 + (avgExercisePerWeek > 60 ? 30 : 15) + (recentMeals.length > 20 ? 30 : 15)))
    };
  };

  const generateChartData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayEvents = events.filter(e => {
        const eventDate = format(parseISO(e.date), 'yyyy-MM-dd');
        return eventDate === dateStr;
      });
      
      return {
        date: format(date, 'dd/MM'),
        exercise: dayEvents.filter(e => e.type === 'exercise').length,
        meals: dayEvents.filter(e => e.type === 'meal').length,
        veterinary: dayEvents.filter(e => e.type === 'veterinary').length
      };
    });
    
    return last7Days;
  };

  const exportToPDF = () => {
    toast.info('Funcionalidad de exportar PDF próximamente');
    // TODO: Implement PDF export using jsPDF or similar
  };

  if (loading && !pet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Mascota no encontrada</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const healthStatus = getHealthStatus();
  const insights = calculateInsights();
  const chartData = generateChartData();
  const eventCounts = {
    all: events.length,
    veterinary: sectionData.veterinary.length,
    exercise: sectionData.exercise.length,
    nutrition: sectionData.nutrition.length + sectionData.meals.length,
    purchase: sectionData.purchases.length,
    reminders: sectionData.reminders.length,
    adventures: sectionData.adventures.length
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingBottom: '100px' }}>
      {/* Header - Pet Identity */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-4 border-white/30 flex-shrink-0">
              {pet.image_url ? (
                <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
              ) : (
                <Star className="w-12 h-12 text-white/70" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{pet.name}</h1>
              <div className="flex flex-wrap items-center gap-3 md:gap-4 text-purple-100 text-sm">
                {pet.breed && <span className="flex items-center gap-1"><Info className="w-3 h-3" /> {pet.breed}</span>}
                {pet.age !== null && <span>{pet.age} años</span>}
                {pet.weight !== null && <span>{pet.weight} kg</span>}
                <span className={`flex items-center gap-1 ${healthStatus.color}`}>
                  <div className={`w-3 h-3 rounded-full ${healthStatus.bgColor}`} />
                  {healthStatus.label}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Button 
                variant="outline" 
                className="bg-white/20 border-white/40 text-white hover:bg-white/30 flex-1 md:flex-none"
                onClick={() => navigate(`/veterinaria`)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Añadir Evento
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/20 border-white/40 text-white hover:bg-white/30 flex-1 md:flex-none"
                onClick={() => navigate('/pet-reminders')}
              >
                <Bell className="w-4 h-4 mr-2" />
                Recordatorios
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/20 border-white/40 text-white hover:bg-white/30 flex-1 md:flex-none"
                onClick={() => navigate('/marketplace')}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Comprar
              </Button>
              <div className="flex-shrink-0">
                <SettingsDropdown variant="gradient" />
              </div>
              <Button 
                variant="outline" 
                className="bg-white/20 border-white/40 text-white hover:bg-white/30 flex-1 md:flex-none"
                onClick={exportToPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pet Status Core - Tamagotchi Dashboard */}
        {pet && petStatus && (
          <div className="mb-8">
            <PetStatusCore
              pet={pet}
              status={petStatus}
              recommendations={statusRecommendations}
              loading={statusLoading}
            />
          </div>
        )}
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Eventos Totales</p>
                  <p className="text-2xl font-bold">{eventCounts.all}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Visitas Veterinarias</p>
                  <p className="text-2xl font-bold">{eventCounts.veterinary}</p>
                </div>
                <Stethoscope className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Sesiones de Ejercicio</p>
                  <p className="text-2xl font-bold">{eventCounts.exercise}</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Compras</p>
                  <p className="text-2xl font-bold">{eventCounts.purchase}</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="health">Salud</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrición</TabsTrigger>
            <TabsTrigger value="activity">Actividad</TabsTrigger>
            <TabsTrigger value="purchases">Compras</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Insights & Wellness */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    Insights & Bienestar
                  </CardTitle>
                  <Badge variant="outline" className="text-lg font-bold">
                    {insights.wellnessScore}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Puntuación de Bienestar</span>
                    <span className="text-sm text-gray-500">{insights.wellnessScore}%</span>
                  </div>
                  <Progress value={insights.wellnessScore} className="h-3" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800">Ejercicio</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{Math.round(insights.avgExercisePerWeek)} min/semana</p>
                    <p className="text-sm text-green-700 mt-1">Últimos 30 días</p>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Utensils className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold text-orange-800">Alimentación</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">{insights.recentMeals} comidas</p>
                    <p className="text-sm text-orange-700 mt-1">Últimos 30 días</p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="w-5 h-5 text-red-600" />
                      <span className="font-semibold text-red-800">Salud</span>
                    </div>
                    <p className="text-2xl font-bold text-red-900">{insights.recentVet} visitas</p>
                    <p className="text-sm text-red-700 mt-1">Últimos 30 días</p>
                  </div>
                </div>

                {insights.overdueReminders.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="font-semibold text-red-800">Recordatorios Vencidos</span>
                    </div>
                    <p className="text-sm text-red-700">{insights.overdueReminders.length} recordatorios requieren atención</p>
                  </div>
                )}

                {insights.upcomingReminders.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-3">Próximos Recordatorios</h4>
                    <div className="space-y-2">
                      {insights.upcomingReminders.map(reminder => (
                        <div key={reminder.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <div>
                            <p className="font-medium">{reminder.title}</p>
                            <p className="text-sm text-gray-600">{reminder.description}</p>
                          </div>
                          <Badge variant="outline">
                            {format(parseISO(reminder.date), 'dd MMM')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Actividad (Últimos 7 días)
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
                      <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Area type="monotone" dataKey="exercise" stroke="#10b981" fillOpacity={1} fill="url(#colorExercise)" name="Ejercicio" />
                    <Area type="monotone" dataKey="meals" stroke="#f59e0b" fillOpacity={1} fill="url(#colorMeals)" name="Comidas" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Section Quick Access */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('health')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Salud & Veterinaria</h3>
                      <p className="text-sm text-gray-600">{eventCounts.veterinary} visitas registradas</p>
                    </div>
                    <Stethoscope className="w-10 h-10 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('nutrition')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Nutrición & Consumo</h3>
                      <p className="text-sm text-gray-600">{eventCounts.nutrition} registros</p>
                    </div>
                    <Utensils className="w-10 h-10 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('activity')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Actividad & Ejercicio</h3>
                      <p className="text-sm text-gray-600">{eventCounts.exercise} sesiones</p>
                    </div>
                    <Activity className="w-10 h-10 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('purchases')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Compras & Marketplace</h3>
                      <p className="text-sm text-gray-600">{eventCounts.purchase} compras</p>
                    </div>
                    <ShoppingBag className="w-10 h-10 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <CardTitle>Historial Completo - Timeline</CardTitle>
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Input
                      placeholder="Buscar eventos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full md:w-64"
                    />
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-full md:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="veterinary">Veterinaria</SelectItem>
                        <SelectItem value="exercise">Ejercicio</SelectItem>
                        <SelectItem value="nutrition">Nutrición</SelectItem>
                        <SelectItem value="purchase">Compras</SelectItem>
                        <SelectItem value="reminder">Recordatorios</SelectItem>
                        <SelectItem value="meal">Comidas</SelectItem>
                        <SelectItem value="adventure">Aventuras</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="w-full md:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todo</SelectItem>
                        <SelectItem value="today">Hoy</SelectItem>
                        <SelectItem value="week">Semana</SelectItem>
                        <SelectItem value="month">Mes</SelectItem>
                        <SelectItem value="year">Año</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No se encontraron eventos</p>
                      <p className="text-sm mt-2">Intenta ajustar los filtros</p>
                    </div>
                  ) : (
                    filteredEvents.map((event, index) => {
                      const eventDate = parseISO(event.date);
                      const daysAgo = differenceInDays(new Date(), eventDate);
                      const isRecent = daysAgo <= 7;
                      
                      return (
                        <div
                          key={event.id}
                          className={`flex gap-4 p-4 border-l-4 rounded-lg hover:bg-gray-50 transition-all ${
                            isRecent ? 'bg-blue-50/50' : ''
                          }`}
                          style={{ borderLeftColor: event.color }}
                        >
                          <div className={`${event.color} text-white rounded-full p-2 w-10 h-10 flex items-center justify-center flex-shrink-0`}>
                            {event.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                                  {isRecent && (
                                    <Badge variant="secondary" className="text-xs">Reciente</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 break-words">{event.description}</p>
                                {event.metadata && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {event.metadata.veterinary_clinic && (
                                      <Badge variant="outline" className="text-xs">
                                        {event.metadata.veterinary_clinic}
                                      </Badge>
                                    )}
                                    {event.metadata.cost && (
                                      <Badge variant="outline" className="text-xs">
                                        {event.metadata.cost > 0 ? `${event.metadata.cost.toFixed(2)}` : 'Sin costo'}
                                      </Badge>
                                    )}
                                    {event.metadata.is_completed !== undefined && (
                                      <Badge variant={event.metadata.is_completed ? "default" : "destructive"} className="text-xs">
                                        {event.metadata.is_completed ? 'Completado' : 'Pendiente'}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-sm text-gray-500 block whitespace-nowrap">
                                  {format(eventDate, 'dd MMM yyyy')}
                                </span>
                                {daysAgo > 0 && (
                                  <span className="text-xs text-gray-400">
                                    {daysAgo === 1 ? 'Ayer' : `Hace ${daysAgo} días`}
                                  </span>
                                )}
                                {daysAgo === 0 && (
                                  <span className="text-xs text-green-600 font-medium">Hoy</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-red-600" />
                  Visitas Veterinarias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sectionData.veterinary.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay visitas veterinarias registradas</p>
                    <Button onClick={() => navigate('/veterinaria')} className="mt-4">
                      Registrar Visita
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sectionData.veterinary.map(event => {
                      const session = event.metadata;
                      return (
                        <Card key={event.id} className="border-l-4 border-l-red-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{session.appointment_type}</h3>
                                  <Badge variant="outline">{format(parseISO(event.date), 'dd MMM yyyy')}</Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  <strong>Veterinario:</strong> {session.veterinarian_name}
                                  {session.veterinary_clinic && ` - ${session.veterinary_clinic}`}
                                </p>
                                {session.diagnosis && (
                                  <p className="text-sm text-gray-700 mb-1">
                                    <strong>Diagnóstico:</strong> {session.diagnosis}
                                  </p>
                                )}
                                {session.treatment && (
                                  <p className="text-sm text-gray-700 mb-1">
                                    <strong>Tratamiento:</strong> {session.treatment}
                                  </p>
                                )}
                                {session.cost && session.cost > 0 && (
                                  <p className="text-sm font-medium text-gray-900 mt-2">
                                    Costo: {session.currency === 'GTQ' ? 'Q.' : '$'}{session.cost.toFixed(2)}
                                  </p>
                                )}
                                <div className="flex gap-2 mt-3">
                                  {session.pdf_url && (
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={session.pdf_url} target="_blank" rel="noopener noreferrer">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Ver Documento
                                      </a>
                                    </Button>
                                  )}
                                  {session.invoice_url && (
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={session.invoice_url} target="_blank" rel="noopener noreferrer">
                                        <FileCheck className="w-4 h-4 mr-2" />
                                        Ver Factura
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vaccinations Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="w-5 h-5 text-blue-600" />
                  Vacunación & Prevención
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <Info className="w-4 h-4 inline mr-2" />
                    Las vacunaciones se registran como parte de las visitas veterinarias. 
                    Revisa el historial de visitas para ver las vacunas aplicadas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-yellow-600" />
                  Horarios de Alimentación
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sectionData.nutrition.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Utensils className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay horarios de alimentación registrados</p>
                    <Button onClick={() => navigate('/feeding-schedules')} className="mt-4">
                      Crear Horario
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sectionData.nutrition.map(event => {
                      const schedule = event.metadata;
                      return (
                        <Card key={event.id} className="border-l-4 border-l-yellow-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold mb-2">{schedule.food_name || 'Alimento'}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-500">Cantidad:</span>
                                    <p className="font-medium">{schedule.quantity_per_meal} {schedule.unit || 'g'}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Frecuencia:</span>
                                    <p className="font-medium">{schedule.times_per_day} veces/día</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Estado:</span>
                                    <p className="font-medium">
                                      <Badge variant={schedule.is_active ? "default" : "secondary"}>
                                        {schedule.is_active ? 'Activo' : 'Inactivo'}
                                      </Badge>
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Creado:</span>
                                    <p className="font-medium">{format(parseISO(event.date), 'dd MMM yyyy')}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Meal Records */}
            {sectionData.meals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-orange-600" />
                    Registro de Comidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sectionData.meals.slice(0, 20).map(event => {
                      const meal = event.metadata;
                      return (
                        <div key={event.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div>
                            <p className="font-medium">{meal.meal_type}: {meal.food_name}</p>
                            <p className="text-sm text-gray-600">{meal.quantity}g</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{format(parseISO(event.date), 'dd MMM')}</p>
                            <p className="text-xs text-gray-500">{format(parseISO(event.date), 'HH:mm')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Sesiones de Ejercicio
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sectionData.exercise.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay sesiones de ejercicio registradas</p>
                    <Button onClick={() => navigate('/trazabilidad')} className="mt-4">
                      Registrar Ejercicio
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sectionData.exercise.map(event => {
                      const session = event.metadata;
                      return (
                        <Card key={event.id} className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold capitalize">{session.exercise_type}</h3>
                                  <Badge variant="outline">{format(parseISO(event.date), 'dd MMM yyyy')}</Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-500">Duración:</span>
                                    <p className="font-medium">{session.duration_minutes} minutos</p>
                                  </div>
                                  {session.calories_burned && (
                                    <div>
                                      <span className="text-gray-500">Calorías:</span>
                                      <p className="font-medium">{session.calories_burned} cal</p>
                                    </div>
                                  )}
                                  {session.distance_km && (
                                    <div>
                                      <span className="text-gray-500">Distancia:</span>
                                      <p className="font-medium">{session.distance_km} km</p>
                                    </div>
                                  )}
                                </div>
                                {session.notes && (
                                  <p className="text-sm text-gray-600 mt-2">{session.notes}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Adventure Logs */}
            {sectionData.adventures.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    Aventuras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sectionData.adventures.slice(0, 20).map(event => {
                      const adventure = event.metadata;
                      return (
                        <div key={event.id} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                          <div>
                            <p className="font-medium capitalize">{adventure.activity_type}</p>
                            <p className="text-sm text-gray-600">
                              {adventure.duration_minutes} min
                              {adventure.distance_km && ` • ${adventure.distance_km} km`}
                              {adventure.location && ` • ${adventure.location}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{format(parseISO(event.date), 'dd MMM')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-purple-600" />
                  Compras & Marketplace
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sectionData.purchases.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay compras registradas</p>
                    <Button onClick={() => navigate('/marketplace')} className="mt-4">
                      Ir al Marketplace
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sectionData.purchases.map(event => {
                      const order = event.metadata;
                      return (
                        <Card key={event.id} className="border-l-4 border-l-purple-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{order.order_number}</h3>
                                  <Badge variant="outline">{format(parseISO(event.date), 'dd MMM yyyy')}</Badge>
                                  <Badge variant={order.status === 'completed' ? "default" : "secondary"}>
                                    {order.status}
                                  </Badge>
                                </div>
                                {order.order_items && order.order_items.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-sm text-gray-600 mb-2">
                                      <strong>Items:</strong> {order.order_items.length}
                                    </p>
                                    <div className="space-y-1">
                                      {order.order_items.slice(0, 3).map((item: any, idx: number) => (
                                        <p key={idx} className="text-sm text-gray-700">
                                          • {item.item_name} x{item.quantity}
                                        </p>
                                      ))}
                                      {order.order_items.length > 3 && (
                                        <p className="text-sm text-gray-500">
                                          ... y {order.order_items.length - 3} más
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div className="mt-3 flex items-center gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Subtotal:</span>
                                    <span className="font-medium ml-2">
                                      {order.currency === 'GTQ' ? 'Q.' : '$'}{order.total_amount.toFixed(2)}
                                    </span>
                                  </div>
                                  {order.delivery_fee > 0 && (
                                    <div>
                                      <span className="text-gray-500">Entrega:</span>
                                      <span className="font-medium ml-2">
                                        {order.currency === 'GTQ' ? 'Q.' : '$'}{order.delivery_fee.toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-gray-500">Total:</span>
                                    <span className="font-bold text-lg ml-2">
                                      {order.currency === 'GTQ' ? 'Q.' : '$'}{order.grand_total.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PetJourney;
