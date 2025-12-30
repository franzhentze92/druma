import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FeedingScheduleService, AutomatedMeal } from '../services/FeedingScheduleService';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Utensils,
  Calendar,
  Edit
} from 'lucide-react';

interface FeedingNotificationProps {
  onMealCompleted?: () => void;
}

const FeedingNotification: React.FC<FeedingNotificationProps> = ({ onMealCompleted }) => {
  const { user } = useAuth();
  const [upcomingMeals, setUpcomingMeals] = useState<AutomatedMeal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUpcomingMeals();
    }
  }, [user]);

  const loadUpcomingMeals = async () => {
    try {
      setLoading(true);
      const meals = await FeedingScheduleService.getUpcomingMeals(user?.id || '', 24);
      setUpcomingMeals(meals);
    } catch (error) {
      console.error('Error loading upcoming meals:', error);
      // Don't show error toast for missing tables, just log it
      if (error.code !== '42P01' && !error.message?.includes('does not exist')) {
        toast.error("No se pudieron cargar las comidas próximas");
      }
      setUpcomingMeals([]);
    } finally {
      setLoading(false);
    }
  };

  const markMealAsCompleted = async (mealId: string) => {
    try {
      await FeedingScheduleService.markMealAsCompleted(mealId, user?.id || '');
      toast.success("Comida marcada como completada");
      loadUpcomingMeals();
      onMealCompleted?.();
    } catch (error) {
      console.error('Error marking meal as completed:', error);
      toast.error("No se pudo marcar la comida como completada");
    }
  };

  const overrideAutoCompletedMeal = async (mealId: string) => {
    try {
      // This would allow users to modify an auto-completed meal
      // For now, we'll just show a message that manual override is available
      toast.success("Esta comida fue completada automáticamente. Puedes editarla en el historial.");
    } catch (error) {
      console.error('Error overriding auto-completed meal:', error);
      toast.error("No se pudo modificar la comida");
    }
  };

  const skipMeal = async (mealId: string) => {
    try {
      await FeedingScheduleService.skipMeal(mealId, user?.id || '', 'Comida omitida por el usuario');
      toast.success("La comida ha sido marcada como omitida");
      loadUpcomingMeals();
    } catch (error) {
      console.error('Error skipping meal:', error);
      toast.error("No se pudo omitir la comida");
    }
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '🌞';
      case 'dinner':
        return '🌙';
      case 'snack':
        return '🍪';
      default:
        return '🍽️';
    }
  };

  const getMealLabel = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return 'Desayuno';
      case 'lunch':
        return 'Almuerzo';
      case 'dinner':
        return 'Cena';
      case 'snack':
        return 'Merienda';
      default:
        return 'Comida';
    }
  };

  const getTimeUntilMeal = (scheduledDate: string, scheduledTime: string) => {
    const now = new Date();
    const mealTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const diffMs = mealTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) {
      return 'Tiempo pasado';
    } else if (diffHours > 0) {
      return `En ${diffHours}h ${diffMinutes}m`;
    } else {
      return `En ${diffMinutes}m`;
    }
  };

  const getUrgencyColor = (scheduledDate: string, scheduledTime: string) => {
    const now = new Date();
    const mealTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const diffMs = mealTime.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMs < 0) {
      return 'text-red-600 bg-red-50 border-red-200';
    } else if (diffMinutes <= 30) {
      return 'text-orange-600 bg-orange-50 border-orange-200';
    } else if (diffMinutes <= 60) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    } else {
      return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  if (upcomingMeals.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          Próximas Comidas
          <Badge variant="outline" className="ml-auto">
            {upcomingMeals.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingMeals.slice(0, 5).map((meal) => (
            <div
              key={meal.id}
              className={`p-4 rounded-lg border ${getUrgencyColor(meal.scheduled_date, meal.scheduled_time)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {getMealIcon(meal.meal_type)}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {meal.scheduled_time}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getMealLabel(meal.meal_type)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {meal.pets?.name}
                      </Badge>
                    </div>
                    <div className="text-sm opacity-80 mt-1">
                      <span className="font-medium">
                        {meal.pet_foods?.brand} - {meal.pet_foods?.name}
                      </span>
                      <span className="ml-2">
                        {meal.quantity_grams}g
                      </span>
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {getTimeUntilMeal(meal.scheduled_date, meal.scheduled_time)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {meal.status === 'scheduled' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => markMealAsCompleted(meal.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => skipMeal(meal.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Omitir
                      </Button>
                    </>
                  )}
                  {meal.status === 'completed' && meal.actual_notes?.includes('Auto-completed') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => overrideAutoCompletedMeal(meal.id)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  )}
                  <Badge variant={meal.status === 'completed' ? 'default' : 'secondary'}>
                    {meal.status === 'completed' ? 
                      (meal.actual_notes?.includes('Auto-completed') ? 'Auto-Completada' : 'Completada') :
                     meal.status === 'skipped' ? 'Omitida' :
                     meal.status === 'modified' ? 'Modificada' : 'Programada'}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
          
          {upcomingMeals.length > 5 && (
            <div className="text-center pt-2">
              <Button variant="outline" size="sm">
                Ver todas las comidas ({upcomingMeals.length})
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedingNotification;
