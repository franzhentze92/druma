import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { 
  Plus, 
  Save, 
  Clock, 
  Utensils, 
  Calendar,
  AlertCircle
} from 'lucide-react';

interface Pet {
  id: string;
  name: string;
  species: string;
}

interface PetFood {
  id: string;
  name: string;
  brand: string;
  species: string;
  is_available: boolean;
}

const ManualFeedingForm: React.FC = () => {
  const { user } = useAuth();
  
  // Form state
  const [selectedPet, setSelectedPet] = useState('');
  const [selectedFood, setSelectedFood] = useState('');
  const [quantity, setQuantity] = useState('');
  const [feedingTime, setFeedingTime] = useState('');
  const [feedingDate, setFeedingDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState('');
  const [notes, setNotes] = useState('');
  
  // Data state
  const [pets, setPets] = useState<Pet[]>([]);
  const [availableFoods, setAvailableFoods] = useState<PetFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFoods, setLoadingFoods] = useState(false);

  const mealTypes = [
    { value: 'breakfast', label: 'Desayuno' },
    { value: 'lunch', label: 'Almuerzo' },
    { value: 'dinner', label: 'Cena' },
    { value: 'snack', label: 'Merienda' }
  ];

  // Load pets on component mount
  useEffect(() => {
    loadPets();
  }, []);

  // Load foods when pet changes
  useEffect(() => {
    if (selectedPet) {
      loadFoodsForPet(selectedPet);
    } else {
      setAvailableFoods([]);
      setSelectedFood('');
    }
  }, [selectedPet]);

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

  const loadFoodsForPet = async (petId: string) => {
    try {
      setLoadingFoods(true);
      setAvailableFoods([]);
      setSelectedFood('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPet || !selectedFood || !quantity || !feedingTime || !mealType) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      const selectedFoodData = availableFoods.find(f => f.id === selectedFood);
      const quantityNum = parseFloat(quantity);
      
      const feedingData = {
        pet_id: selectedPet,
        quantity_grams: quantityNum,
        date: feedingDate,
        feeding_time: feedingTime,
        meal_type: mealType,
        notes: notes || null,
        owner_id: user?.id,
        // Required nutritional fields
        food_name: selectedFoodData?.name || 'Unknown Food',
        food_category: 'dry_food', // Default category - could be enhanced later
        calories_per_100g: 350, // Default calories per 100g
        protein_per_100g: 25, // Default protein per 100g
        fat_per_100g: 15, // Default fat per 100g
        carbs_per_100g: 40, // Default carbs per 100g
        fiber_per_100g: 5, // Default fiber per 100g
        // Calculated totals based on quantity
        total_calories: (quantityNum * 3.5), // 350 cal per 100g
        total_protein: (quantityNum * 0.25), // 25g per 100g
        total_fat: (quantityNum * 0.15), // 15g per 100g
        total_carbs: (quantityNum * 0.40), // 40g per 100g
        total_fiber: (quantityNum * 0.05) // 5g per 100g
      };

      const { error } = await supabase
        .from('nutrition_sessions')
        .insert([feedingData]);

      if (error) throw error;

      toast.success("Alimentación registrada correctamente");

      // Reset form
      setSelectedPet('');
      setSelectedFood('');
      setQuantity('');
      setFeedingTime('');
      setFeedingDate(new Date().toISOString().split('T')[0]);
      setMealType('');
      setNotes('');
      
    } catch (error) {
      console.error('Error saving manual feeding:', error);
      toast.error("No se pudo registrar la alimentación");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPet('');
    setSelectedFood('');
    setQuantity('');
    setFeedingTime('');
    setFeedingDate(new Date().toISOString().split('T')[0]);
    setMealType('');
    setNotes('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-green-600" />
          Registro Manual de Alimentación
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
                      {pet.name} ({pet.species})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="food">Alimento *</Label>
              <Select
                value={selectedFood}
                onValueChange={setSelectedFood}
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Cantidad (gramos) *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ej: 150"
              />
            </div>

            <div>
              <Label htmlFor="mealType">Tipo de Comida *</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {mealTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="feedingTime">Hora *</Label>
              <Input
                id="feedingTime"
                type="time"
                value={feedingTime}
                onChange={(e) => setFeedingTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="feedingDate">Fecha</Label>
              <Input
                id="feedingDate"
                type="date"
                value={feedingDate}
                onChange={(e) => setFeedingDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones sobre esta alimentación..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Registrando...' : 'Registrar Alimentación'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={loading}
            >
              Limpiar
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">¿Cuándo usar alimentación manual?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Meriendas fuera del horario regular</li>
                <li>Comidas especiales o medicamentos</li>
                <li>Registrar alimentación que no sigue el horario automático</li>
                <li>Corregir o agregar comidas pasadas</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualFeedingForm;
