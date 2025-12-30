import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import NutritionProgressChart from './NutritionProgressChart';
import { 
  BarChart3, 
  Utensils, 
  Package, 
  Scale, 
  Flame, 
  Target,
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react';

interface Pet {
  id: string;
  name: string;
  species: string;
}

interface NutritionSession {
  id: string;
  pet_id: string;
  pet_name: string;
  date: string;
  meal_type: string;
  food_name: string;
  food_category: string;
  quantity_grams: number;
  calories_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  fiber_per_100g: number;
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  total_fiber: number;
  notes?: string;
  feeding_time?: string;
  created_at: string;
}

interface NutritionStats {
  total_sessions: number;
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  total_fiber: number;
  average_calories_per_session: number;
  favorite_food: string;
  daily_calorie_average: number;
  analysis_by_category: Record<string, number>;
}

const NutritionAnalytics: React.FC = () => {
  const { user } = useAuth();
  
  const [pets, setPets] = useState<Pet[]>([]);
  const [nutritionSessions, setNutritionSessions] = useState<NutritionSession[]>([]);
  const [nutritionStats, setNutritionStats] = useState<NutritionStats | null>(null);
  const [selectedPetForAnalytics, setSelectedPetForAnalytics] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Load pets and nutrition data
  useEffect(() => {
    loadPets();
    loadNutritionSessions();
  }, []);

  // Recalculate stats when data or filter changes
  useEffect(() => {
    if (nutritionSessions.length > 0) {
      calculateNutritionStats();
    }
  }, [nutritionSessions, selectedPetForAnalytics]);

  const loadPets = async () => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('id, name, species')
        .eq('owner_id', user?.id)
        .order('name');

      if (error) throw error;
      setPets(data || []);
    } catch (error) {
      console.error('Error loading pets:', error);
      toast.error("No se pudieron cargar las mascotas");
    }
  };

  const loadNutritionSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('nutrition_sessions')
        .select(`
          *,
          pets!nutrition_sessions_pet_id_fkey (name)
        `)
        .eq('owner_id', user?.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const sessionsWithPetNames = (data || []).map(session => ({
        ...session,
        pet_name: session.pets?.name || 'Unknown Pet'
      }));

      setNutritionSessions(sessionsWithPetNames);
    } catch (error) {
      console.error('Error loading nutrition sessions:', error);
      toast.error("No se pudieron cargar las sesiones de alimentación");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredNutritionSessions = () => {
    if (selectedPetForAnalytics === 'all') {
      return nutritionSessions;
    }
    return nutritionSessions.filter(session => session.pet_id === selectedPetForAnalytics);
  };

  const calculateNutritionStats = () => {
    const filteredSessions = getFilteredNutritionSessions();
    
    if (filteredSessions.length === 0) {
      setNutritionStats(null);
      return;
    }

    const totalSessions = filteredSessions.length;
    const totalCalories = filteredSessions.reduce((sum, session) => sum + (session.total_calories || 0), 0);
    const totalProtein = filteredSessions.reduce((sum, session) => sum + (session.total_protein || 0), 0);
    const totalFat = filteredSessions.reduce((sum, session) => sum + (session.total_fat || 0), 0);
    const totalCarbs = filteredSessions.reduce((sum, session) => sum + (session.total_carbs || 0), 0);
    const totalFiber = filteredSessions.reduce((sum, session) => sum + (session.total_fiber || 0), 0);

    // Calculate average calories per session
    const averageCaloriesPerSession = totalSessions > 0 ? totalCalories / totalSessions : 0;

    // Find favorite food
    const foodCounts: Record<string, number> = {};
    filteredSessions.forEach(session => {
      foodCounts[session.food_name] = (foodCounts[session.food_name] || 0) + 1;
    });
    const favoriteFood = Object.keys(foodCounts).reduce((a, b) => 
      foodCounts[a] > foodCounts[b] ? a : b, 'N/A'
    );

    // Calculate daily calorie average
    const uniqueDays = new Set(filteredSessions.map(session => session.date)).size;
    const dailyCalorieAverage = uniqueDays > 0 ? totalCalories / uniqueDays : 0;

    // Analysis by category
    const categoryAnalysis: Record<string, number> = {};
    filteredSessions.forEach(session => {
      categoryAnalysis[session.food_category] = (categoryAnalysis[session.food_category] || 0) + 1;
    });

    setNutritionStats({
      total_sessions: totalSessions,
      total_calories: Math.round(totalCalories),
      total_protein: Math.round(totalProtein),
      total_fat: Math.round(totalFat),
      total_carbs: Math.round(totalCarbs),
      total_fiber: Math.round(totalFiber),
      average_calories_per_session: Math.round(averageCaloriesPerSession),
      favorite_food: favoriteFood,
      daily_calorie_average: Math.round(dailyCalorieAverage),
      analysis_by_category: categoryAnalysis
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Activity className="w-8 h-8 mx-auto mb-4 animate-spin text-green-600" />
          <p>Cargando análisis nutricional...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pet Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Análisis Nutricional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Filtrar por mascota
              </label>
              <Select value={selectedPetForAnalytics} onValueChange={setSelectedPetForAnalytics}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar mascota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las mascotas</SelectItem>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Stats Cards */}
      {nutritionStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sesiones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{nutritionStats.total_sessions}</div>
              <p className="text-xs text-gray-500">Registros de alimentación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Calorías</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{nutritionStats.total_calories}</div>
              <p className="text-xs text-gray-500">Calorías consumidas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Comida Favorita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-indigo-600">{nutritionStats.favorite_food}</div>
              <p className="text-xs text-gray-500">Más consumida</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Promedio Diario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">{nutritionStats.daily_calorie_average}</div>
              <p className="text-xs text-gray-500">Calorías por día</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Nutrition Progress Charts */}
      {getFilteredNutritionSessions().length > 0 && (
        <NutritionProgressChart sessions={getFilteredNutritionSessions()} />
      )}

      {/* Nutrition History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-green-600" />
            Historial de Alimentación
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getFilteredNutritionSessions().length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Utensils className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>
                {selectedPetForAnalytics === 'all' 
                  ? 'No hay sesiones de alimentación registradas'
                  : `No hay sesiones de alimentación para ${pets.find(p => p.id === selectedPetForAnalytics)?.name || 'esta mascota'}`
                }
              </p>
              <p className="text-sm">Comienza registrando tu primera comida en la pestaña "Alimentación Manual"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getFilteredNutritionSessions().map((session) => (
                <div key={session.id} className="border-l-4 border-green-500 pl-4 py-3 bg-green-50 rounded-r-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {session.meal_type === 'breakfast' ? '🌅' : 
                         session.meal_type === 'lunch' ? '🌞' : 
                         session.meal_type === 'dinner' ? '🌙' : '🍪'}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {session.meal_type === 'breakfast' ? 'Desayuno' :
                         session.meal_type === 'lunch' ? 'Almuerzo' :
                         session.meal_type === 'dinner' ? 'Cena' : 'Merienda'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {session.pet_name}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(session.date).toLocaleDateString('es-GT')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {session.food_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Scale className="w-4 h-4" />
                      {session.quantity_grams}g
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4" />
                      {session.total_calories} cal
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {session.food_category.replace('_', ' ')}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center gap-1">
                      <span className="text-blue-600">🥩</span>
                      {session.total_protein}g proteína
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-600">🧈</span>
                      {session.total_fat}g grasa
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-purple-600">🍞</span>
                      {session.total_carbs}g carbos
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-600">🌾</span>
                      {session.total_fiber}g fibra
                    </div>
                  </div>
                  
                  {session.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">"{session.notes}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NutritionAnalytics;
