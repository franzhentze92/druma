import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { FeedingScheduleService, FeedingSchedule, AutomatedMeal } from '../services/FeedingScheduleService';
import ManualFeedingForm from './ManualFeedingForm';
import NutritionAnalytics from './NutritionAnalytics';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Calendar, 
  Bell, 
  Settings, 
  Utensils,
  Save,
  Edit,
  Play,
  Pause,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import PageHeader from './PageHeader';
import { useNavigation } from '@/contexts/NavigationContext';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
}

interface PetFood {
  id: string;
  name: string;
  brand: string;
  food_type: string;
  species: string;
  calories_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
}

interface FeedingTime {
  time: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_id: string;
  quantity_grams: number;
}

interface FeedingSchedule {
  id: string;
  owner_id: string;
  pet_id: string;
  schedule_name: string;
  is_active: boolean;
  feeding_times: FeedingTime[];
  days_of_week: number[];
  start_date: string;
  end_date?: string;
  auto_generate_meals: boolean;
  send_notifications: boolean;
  notification_minutes_before: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface AutomatedMeal {
  id: string;
  pet_id: string;
  schedule_id: string;
  scheduled_date: string;
  scheduled_time: string;
  meal_type: string;
  food_id: string;
  quantity_grams: number;
  status: 'scheduled' | 'completed' | 'skipped' | 'modified';
  completed_at?: string;
  actual_quantity_grams?: number;
  actual_food_id?: string;
  actual_notes?: string;
  pets?: { name: string };
  pet_foods?: { name: string; brand: string };
}

const FeedingScheduleManager: React.FC = () => {
  const { user } = useAuth();
  const { isMobileMenuOpen, toggleMobileMenu } = useNavigation();
  
  // State management
  const [pets, setPets] = useState<Pet[]>([]);
  const [availableFoods, setAvailableFoods] = useState<PetFood[]>([]);
  const [schedules, setSchedules] = useState<FeedingSchedule[]>([]);
  const [automatedMeals, setAutomatedMeals] = useState<AutomatedMeal[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingFoods, setLoadingFoods] = useState(false);
  const [activeTab, setActiveTab] = useState('schedules');
  
  // Form states
  const [selectedPet, setSelectedPet] = useState('');
  const [scheduleName, setScheduleName] = useState('');
  const [feedingTimes, setFeedingTimes] = useState<FeedingTime[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [sendNotifications, setSendNotifications] = useState(true);
  const [notificationMinutes, setNotificationMinutes] = useState(15);
  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState(false);
  const [autoCompleteMinutes, setAutoCompleteMinutes] = useState(30);
  const [notes, setNotes] = useState('');
  
  // UI states
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const daysOfWeek = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 7, label: 'Domingo' }
  ];

  const mealTypes = [
    { value: 'breakfast', label: 'Desayuno', icon: '🌅' },
    { value: 'lunch', label: 'Almuerzo', icon: '🌞' },
    { value: 'dinner', label: 'Cena', icon: '🌙' },
    { value: 'snack', label: 'Merienda', icon: '🍪' }
  ];

  // Load initial data
  useEffect(() => {
    if (user) {
      loadPets();
      loadSchedules();
      loadAutomatedMeals();
    }
  }, [user]);

  // Load foods when pet is selected
  useEffect(() => {
    if (selectedPet) {
      loadFoodsForPet(selectedPet);
    }
  }, [selectedPet]);

  const loadPets = async () => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('id, name, species, breed')
        .eq('owner_id', user?.id)
        .order('name');

      if (error) throw error;
      setPets(data || []);
    } catch (error) {
      console.error('Error loading pets:', error);
      toast.error("No se pudieron cargar las mascotas");
    }
  };

  const loadFoodsForPet = async (petId: string) => {
    try {
      setLoadingFoods(true);
      setAvailableFoods([]); // Clear previous foods
      
      // First get the pet data to know the species
      const { data: petData, error: petError } = await supabase
        .from('pets')
        .select('species')
        .eq('id', petId)
        .single();

      if (petError) throw petError;
      if (!petData) return;

      // Then get foods for that species
      let { data, error } = await supabase
        .from('pet_foods')
        .select('*')
        .eq('species', petData.species)
        .eq('is_available', true)
        .order('brand')
        .order('name');

      if (error) throw error;

      // If no foods found for this species, try to get all available foods
      if (!data || data.length === 0) {
        console.log('No foods found for species, fetching all available foods');
        const allFoodsResult = await supabase
          .from('pet_foods')
          .select('*')
          .eq('is_available', true)
          .order('brand')
          .order('name');
        
        data = allFoodsResult.data;
        error = allFoodsResult.error;
      }

      if (error) throw error;
      setAvailableFoods(data || []);
    } catch (error) {
      console.error('Error loading foods:', error);
      toast.error("No se pudieron cargar los alimentos");
    } finally {
      setLoadingFoods(false);
    }
  };

  const loadSchedules = async () => {
    try {
      console.log('Loading feeding schedules for user:', user?.id);
      
      const { data, error } = await supabase
        .from('pet_feeding_schedules')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading schedules:', error);
        // If table doesn't exist, initialize with empty data
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.log('Feeding schedules table not found, initializing with empty data');
          setSchedules([]);
          return;
        }
        throw error;
      }
      
      console.log('Feeding schedules loaded:', data);
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast.error("No se pudieron cargar los horarios");
    }
  };

  const loadAutomatedMeals = async () => {
    try {
      setLoadingMeals(true);
      console.log('Loading automated meals for date:', selectedDate);
      console.log('User ID:', user?.id);
      
      const { data, error } = await supabase
        .from('automated_meals')
        .select(`
          *,
          pets (name),
          pet_foods!automated_meals_food_id_fkey (name, brand)
        `)
        .eq('owner_id', user?.id)
        .gte('scheduled_date', selectedDate)
        .lte('scheduled_date', selectedDate)
        .order('scheduled_time');

      if (error) {
        console.error('Error loading automated meals:', error);
        // If table doesn't exist, initialize with empty data
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.log('Automated meals table not found, initializing with empty data');
          setAutomatedMeals([]);
          return;
        }
        throw error;
      }
      
      console.log('Automated meals loaded:', data);
      
      // If no meals exist for this date, try to generate them from schedules
      if (data && data.length === 0 && schedules.length > 0) {
        console.log('No meals found, attempting to generate from schedules...');
        await generateMealsFromSchedules();
        return;
      }
      
      setAutomatedMeals(data || []);
    } catch (error) {
      console.error('Error loading automated meals:', error);
      toast.error("No se pudieron cargar las comidas automáticas");
    } finally {
      setLoadingMeals(false);
    }
  };

  const generateMealsFromSchedules = async () => {
    try {
      console.log('Generating meals from schedules for date:', selectedDate);
      
      // Get the day of the week for the selected date
      const selectedDateObj = new Date(selectedDate);
      const dayOfWeek = selectedDateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Find schedules that apply to this day of the week
      const applicableSchedules = schedules.filter(schedule => {
        const scheduleDays = schedule.days_of_week || [];
        return scheduleDays.includes(dayOfWeek);
      });
      
      console.log('Applicable schedules for day', dayOfWeek, ':', applicableSchedules);
      
      if (applicableSchedules.length === 0) {
        console.log('No schedules apply to this day of the week');
        setAutomatedMeals([]);
        return;
      }
      
      // Generate meals for each applicable schedule
      const mealsToCreate = [];
      
      for (const schedule of applicableSchedules) {
        const feedingTimes = schedule.feeding_times || [];
        
        for (const feedingTime of feedingTimes) {
          // Validate required fields
          if (!schedule.pet_id || !feedingTime.food_id) {
            console.warn('Skipping meal due to missing required fields:', {
              pet_id: schedule.pet_id,
              food_id: feedingTime.food_id,
              schedule: schedule,
              feedingTime: feedingTime
            });
            continue;
          }
          
          mealsToCreate.push({
            pet_id: schedule.pet_id,
            food_id: feedingTime.food_id,
            schedule_id: schedule.id, // Add the missing schedule_id
            quantity_grams: feedingTime.quantity_grams || 100,
            scheduled_date: selectedDate,
            scheduled_time: feedingTime.time,
            meal_type: feedingTime.meal_type,
            status: 'scheduled', // Use 'scheduled' instead of 'pending'
            owner_id: user?.id,
            created_at: new Date().toISOString()
          });
        }
      }
      
      console.log('Creating meals:', mealsToCreate);
      console.log('Meal validation:', mealsToCreate.map(meal => ({
        pet_id: meal.pet_id ? 'valid' : 'MISSING',
        food_id: meal.food_id ? 'valid' : 'MISSING',
        owner_id: meal.owner_id ? 'valid' : 'MISSING'
      })));
      
      if (mealsToCreate.length > 0) {
        const { data, error } = await supabase
          .from('automated_meals')
          .insert(mealsToCreate)
          .select(`
            *,
            pets (name),
            pet_foods!automated_meals_food_id_fkey (name, brand)
          `);

        if (error) {
          console.error('Error creating meals:', error);
          console.error('Failed meals data:', mealsToCreate);
          
          // Show more specific error message
          let errorMessage = "No se pudieron crear las comidas automáticas";
          if (error.message.includes('invalid input syntax for type uuid')) {
            errorMessage = "Error: Algunos campos requeridos están vacíos. Revisa que tus horarios tengan mascota y comida asignados.";
          }
          
          toast.error(errorMessage);
          return;
        }
        
        console.log('Meals created successfully:', data);
        setAutomatedMeals(data || []);
        
        toast.success(`${mealsToCreate.length} comidas generadas para ${selectedDate}`);
      } else {
        setAutomatedMeals([]);
      }
    } catch (error) {
      console.error('Error generating meals:', error);
      toast.error("No se pudieron generar las comidas");
    }
  };

  const addFeedingTime = () => {
    const newTime: FeedingTime = {
      time: '08:00',
      meal_type: 'breakfast',
      food_id: '', // Don't set a food_id until foods are loaded
      quantity_grams: 150
    };
    setFeedingTimes([...feedingTimes, newTime]);
  };

  const updateFeedingTime = (index: number, field: keyof FeedingTime, value: any) => {
    const updated = [...feedingTimes];
    updated[index] = { ...updated[index], [field]: value };
    setFeedingTimes(updated);
  };

  const removeFeedingTime = (index: number) => {
    setFeedingTimes(feedingTimes.filter((_, i) => i !== index));
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const saveSchedule = async () => {
    if (!selectedPet || !scheduleName || feedingTimes.length === 0) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setLoading(true);
    try {
      const scheduleData = {
        owner_id: user?.id,
        pet_id: selectedPet,
        schedule_name: scheduleName,
        feeding_times: feedingTimes,
        days_of_week: selectedDays,
        start_date: startDate,
        end_date: endDate || null,
        auto_generate_meals: autoGenerate,
        send_notifications: sendNotifications,
        notification_minutes_before: notificationMinutes,
        auto_complete_enabled: autoCompleteEnabled,
        auto_complete_minutes_after: autoCompleteMinutes,
        notes: notes || null
      };

      let result;
      if (editingSchedule) {
        result = await supabase
          .from('pet_feeding_schedules')
          .update(scheduleData)
          .eq('id', editingSchedule);
      } else {
        result = await supabase
          .from('pet_feeding_schedules')
          .insert(scheduleData);
      }

      if (result.error) throw result.error;

      // Generate meals for the next 7 days if auto-generate is enabled
      if (autoGenerate) {
        await supabase.rpc('generate_daily_meals_from_schedules', {
          target_date: new Date().toISOString().split('T')[0]
        });
      }

      toast.success(`Horario ${editingSchedule ? 'actualizado' : 'creado'} exitosamente`);

      // Reset form
      resetForm();
      loadSchedules();
      loadAutomatedMeals();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error("No se pudo guardar el horario");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPet('');
    setScheduleName('');
    setFeedingTimes([]);
    setSelectedDays([1, 2, 3, 4, 5, 6, 7]);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setAutoGenerate(true);
    setSendNotifications(true);
    setNotificationMinutes(15);
    setAutoCompleteEnabled(false);
    setAutoCompleteMinutes(30);
    setNotes('');
    setEditingSchedule(null);
  };

  const editSchedule = (schedule: FeedingSchedule) => {
    setEditingSchedule(schedule.id);
    setSelectedPet(schedule.pet_id);
    setScheduleName(schedule.schedule_name);
    setFeedingTimes(schedule.feeding_times);
    setSelectedDays(schedule.days_of_week);
    setStartDate(schedule.start_date);
    setEndDate(schedule.end_date || '');
    setAutoGenerate(schedule.auto_generate_meals);
    setSendNotifications(schedule.send_notifications);
    setNotificationMinutes(schedule.notification_minutes_before);
    setAutoCompleteEnabled(schedule.auto_complete_enabled);
    setAutoCompleteMinutes(schedule.auto_complete_minutes_after);
    setNotes(schedule.notes || '');
    
    // Switch to the create/edit tab
    setActiveTab('create');
  };

  const toggleScheduleStatus = async (scheduleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('pet_feeding_schedules')
        .update({ is_active: !isActive })
        .eq('id', scheduleId);

      if (error) throw error;

      toast.success(`Horario ${!isActive ? 'activado' : 'pausado'}`);

      loadSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error("No se pudo actualizar el horario");
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este horario de alimentación?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pet_feeding_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      toast.success("Horario eliminado correctamente");

      loadSchedules();
      loadAutomatedMeals();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error("No se pudo eliminar el horario");
    }
  };

  const markMealAsCompleted = async (mealId: string) => {
    try {
      const { error } = await supabase
        .from('automated_meals')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user?.id
        })
        .eq('id', mealId);

      if (error) throw error;

      toast.success("Comida marcada como completada");

      loadAutomatedMeals();
    } catch (error) {
      console.error('Error marking meal as completed:', error);
      toast.error("No se pudo marcar la comida como completada");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'skipped':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'modified':
        return <Edit className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'skipped':
        return 'bg-red-50 border-red-200';
      case 'modified':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6" style={{ paddingBottom: '100px' }}>
      <PageHeader 
        title="Horarios de Alimentación"
        subtitle="Configura horarios automáticos para la alimentación de tus mascotas"
        gradient="from-green-500 to-emerald-500"
        showHamburgerMenu={true}
        onToggleHamburger={toggleMobileMenu}
        isHamburgerOpen={isMobileMenuOpen}
      >
        <Utensils className="w-8 h-8" />
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="schedules" className="text-sm">Mis Horarios</TabsTrigger>
          <TabsTrigger value="create" className="text-sm">Crear</TabsTrigger>
          <TabsTrigger value="manual" className="text-sm">Manual</TabsTrigger>
          <TabsTrigger value="meals" className="text-sm hidden md:block">Comidas</TabsTrigger>
          <TabsTrigger value="analytics" className="text-sm hidden md:block">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-6">
          <div className="grid gap-4">
            {schedules.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No hay horarios configurados
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Crea tu primer horario de alimentación automática
                  </p>
                </CardContent>
              </Card>
            ) : (
              schedules.map((schedule) => (
                <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {schedule.is_active ? (
                            <Play className="w-5 h-5 text-green-600" />
                          ) : (
                            <Pause className="w-5 h-5 text-gray-400" />
                          )}
                          <CardTitle className="text-lg">{schedule.schedule_name}</CardTitle>
                        </div>
                        <Badge variant={schedule.is_active ? "default" : "secondary"}>
                          {schedule.is_active ? "Activo" : "Pausado"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editSchedule(schedule)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleScheduleStatus(schedule.id, schedule.is_active)}
                        >
                          {schedule.is_active ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Activar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteSchedule(schedule.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Mascota</Label>
                        <p className="text-sm">
                          {pets.find(p => p.id === schedule.pet_id)?.name || 'Desconocida'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Horarios</Label>
                        <p className="text-sm">
                          {schedule.feeding_times.length} comida(s) por día
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Días</Label>
                        <p className="text-sm">
                          {schedule.days_of_week.length === 7 ? 'Todos los días' : 
                           `${schedule.days_of_week.length} días por semana`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Label className="text-sm font-medium text-gray-600">Horarios de Comida</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {schedule.feeding_times.map((time, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {time.time} - {mealTypes.find(m => m.value === time.meal_type)?.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {schedule.notes && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium text-gray-600">Notas</Label>
                        <p className="text-sm text-gray-600 mt-1">{schedule.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-green-600" />
                {editingSchedule ? 'Editar Horario' : 'Crear Nuevo Horario'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pet">Mascota *</Label>
                  <Select value={selectedPet} onValueChange={setSelectedPet}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar mascota" />
                    </SelectTrigger>
                    <SelectContent>
                      {pets.map((pet) => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.name} ({pet.breed})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="scheduleName">Nombre del Horario *</Label>
                  <Input
                    id="scheduleName"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                    placeholder="Ej: Horario Mañana"
                  />
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Horarios de Comida</Label>
                <div className="space-y-4 mt-4">
                  {feedingTimes.map((time, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Hora</Label>
                          <Input
                            type="time"
                            value={time.time}
                            onChange={(e) => updateFeedingTime(index, 'time', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Tipo de Comida</Label>
                          <Select
                            value={time.meal_type}
                            onValueChange={(value) => updateFeedingTime(index, 'meal_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {mealTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.icon} {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Alimento</Label>
                          <Select
                            value={time.food_id}
                            onValueChange={(value) => updateFeedingTime(index, 'food_id', value)}
                            disabled={!selectedPet || loadingFoods || availableFoods.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={
                                !selectedPet 
                                  ? "Selecciona una mascota primero" 
                                  : loadingFoods
                                    ? "Cargando alimentos..." 
                                    : availableFoods.length === 0 
                                      ? "No hay alimentos disponibles" 
                                      : "Seleccionar alimento"
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {loadingFoods ? (
                                <SelectItem value="loading" disabled>
                                  Cargando alimentos...
                                </SelectItem>
                              ) : availableFoods.length === 0 ? (
                                <SelectItem value="no-foods" disabled>
                                  {!selectedPet 
                                    ? "Selecciona una mascota primero" 
                                    : "No hay alimentos disponibles"}
                                </SelectItem>
                              ) : (
                                availableFoods.map((food) => (
                                  <SelectItem key={food.id} value={food.id}>
                                    {food.brand} - {food.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {!selectedPet && (
                            <p className="text-xs text-gray-500 mt-1">
                              Selecciona una mascota para cargar los alimentos disponibles
                            </p>
                          )}
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Label>Cantidad (g)</Label>
                            <Input
                              type="number"
                              min="1"
                              value={time.quantity_grams}
                              onChange={(e) => updateFeedingTime(index, 'quantity_grams', parseFloat(e.target.value))}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFeedingTime(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={addFeedingTime}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Horario de Comida
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Días de la Semana</Label>
                <div className="grid grid-cols-7 gap-2 mt-4">
                  {daysOfWeek.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={selectedDays.includes(day.value)}
                        onCheckedChange={() => toggleDay(day.value)}
                      />
                      <Label htmlFor={`day-${day.value}`} className="text-sm">
                        {day.label.slice(0, 3)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Fecha de Fin (opcional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Generar Comidas Automáticamente</Label>
                    <p className="text-sm text-gray-600">
                      Crear entradas automáticas en el historial de nutrición
                    </p>
                  </div>
                  <Switch
                    checked={autoGenerate}
                    onCheckedChange={setAutoGenerate}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enviar Notificaciones</Label>
                    <p className="text-sm text-gray-600">
                      Recibir recordatorios antes de cada comida
                    </p>
                  </div>
                  <Switch
                    checked={sendNotifications}
                    onCheckedChange={setSendNotifications}
                  />
                </div>

                {sendNotifications && (
                  <div>
                    <Label htmlFor="notificationMinutes">Minutos antes de la comida</Label>
                    <Input
                      id="notificationMinutes"
                      type="number"
                      min="1"
                      max="60"
                      value={notificationMinutes}
                      onChange={(e) => setNotificationMinutes(parseInt(e.target.value))}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Auto-Completar Comidas</Label>
                    <p className="text-sm text-gray-600">
                      Marcar automáticamente como completadas después del tiempo programado
                    </p>
                  </div>
                  <Switch
                    checked={autoCompleteEnabled}
                    onCheckedChange={setAutoCompleteEnabled}
                  />
                </div>

                {autoCompleteEnabled && (
                  <div>
                    <Label htmlFor="autoCompleteMinutes">Minutos después del horario programado</Label>
                    <Input
                      id="autoCompleteMinutes"
                      type="number"
                      min="5"
                      max="120"
                      value={autoCompleteMinutes}
                      onChange={(e) => setAutoCompleteMinutes(parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Las comidas se marcarán automáticamente como completadas después de este tiempo
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionales sobre este horario..."
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={saveSchedule}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingSchedule ? 'Actualizar Horario' : 'Crear Horario'}
                </Button>
                {editingSchedule && (
                  <Button
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-green-600" />
                Comidas Programadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div>
                  <Label htmlFor="selectedDate">Fecha</Label>
                  <Input
                    id="selectedDate"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      loadAutomatedMeals();
                    }}
                    disabled={loadingMeals}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={loadAutomatedMeals}
                  disabled={loadingMeals}
                >
                  {loadingMeals ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Cargando...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Actualizar
                    </>
                  )}
                </Button>
              </div>

              {loadingMeals ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p>Cargando comidas para {selectedDate}...</p>
                </div>
              ) : automatedMeals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No hay comidas programadas para esta fecha</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {automatedMeals.map((meal) => (
                    <Card key={meal.id} className={`${getStatusColor(meal.status)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(meal.status)}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  {meal.scheduled_time}
                                </span>
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                  {new Date(meal.scheduled_date).toLocaleDateString('es-ES', { 
                                    day: '2-digit', 
                                    month: '2-digit', 
                                    year: 'numeric' 
                                  })}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {mealTypes.find(m => m.value === meal.meal_type)?.label}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {meal.pets?.name}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">
                                  {meal.pet_foods?.brand} - {meal.pet_foods?.name}
                                </span>
                                <span className="ml-2">
                                  {meal.quantity_grams}g
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {meal.status === 'scheduled' && (
                              <Button
                                size="sm"
                                onClick={() => markMealAsCompleted(meal.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Completar
                              </Button>
                            )}
                            <Badge variant={meal.status === 'completed' ? 'default' : 'secondary'}>
                              {meal.status === 'completed' ? 'Completada' :
                               meal.status === 'skipped' ? 'Omitida' :
                               meal.status === 'modified' ? 'Modificada' : 'Programada'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <ManualFeedingForm />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <NutritionAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeedingScheduleManager;
