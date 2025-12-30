import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  useShelter, 
  useAdoptionPetsByShelter, 
  useShelterAdoptionApplications,
  useUpdateAdoptionApplication,
  useAddShelterPet,
  useUpdateShelterPet,
  useDeleteShelterPet,
  useShelterImages,
  useShelterVideos,
  useCreateShelter
} from '@/hooks/useAdoption';
import { useUserProfile } from '@/hooks/useSettings';
import { useQueryClient } from '@tanstack/react-query';
import SettingsDropdown from './SettingsDropdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Building2, 
  Users, 
  PawPrint, 
  Calendar, 
  Star, 
  Edit, 
  Plus, 
  Trash2, 
  Eye, 
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Video,
  LogOut,
  Image,
  Play,
  Grid,
  List
} from 'lucide-react';
import { storage, fileValidation } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

interface Pet {
  id: string;
  name: string;
  species?: string;
  breed?: string;
  age?: number;
  size?: string;
  sex?: string;
  color?: string;
  weight?: number;
  description?: string;
  image_url?: string;
  good_with_kids?: boolean;
  good_with_dogs?: boolean;
  good_with_cats?: boolean;
  house_trained?: boolean;
  spayed_neutered?: boolean;
  special_needs?: boolean;
  special_needs_description?: string;
  medical_notes?: string;
  adoption_fee?: string;
  location?: string;
  created_at: string;
}

interface Quote {
  id: string;
  pet_id: string;
  applicant_id: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  pet_name?: string;
  applicant_name?: string;
}

const ShelterDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      return localStorage.getItem('shelterDashboardActiveTab') || 'profile';
    } catch {
      return 'profile';
    }
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    try {
      localStorage.setItem('shelterDashboardActiveTab', value);
    } catch {
      // ignore storage errors
    }
  };

  // Listen for tab change events from SettingsDropdown
  useEffect(() => {
    const handleTabChangeEvent = (event: CustomEvent) => {
      setActiveTab(event.detail);
      try {
        localStorage.setItem('shelterDashboardActiveTab', event.detail);
      } catch {
        // ignore storage errors
      }
    };

    window.addEventListener('shelterDashboardTabChange', handleTabChangeEvent as EventListener);
    return () => {
      window.removeEventListener('shelterDashboardTabChange', handleTabChangeEvent as EventListener);
    };
  }, []);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [showAddPet, setShowAddPet] = useState(false);
  const [showAddPetForm, setShowAddPetForm] = useState(false);
  const [petViewMode, setPetViewMode] = useState<'cards' | 'list'>('cards');
  const [quoteViewMode, setQuoteViewMode] = useState<'cards' | 'list'>('cards');
  const [showShelterForm, setShowShelterForm] = useState(false);
  const [newShelter, setNewShelter] = useState({
    name: '',
    location: '',
    phone: '',
    description: ''
  });
  const [shelterForm, setShelterForm] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    mission_statement: '',
    years_experience: 0,
    total_volunteers: 0
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();


  const [petFilters, setPetFilters] = useState({
    search: '',
    size: '',
    species: '',
    age: '',
    gender: '',
    house_trained: false,
    spayed_neutered: false,
    special_needs: false,
    good_with_kids: false,
    good_with_dogs: false,
    good_with_cats: false
  });
  const [quoteFilters, setQuoteFilters] = useState({
    search: '',
    status: '',
    dateRange: ''
  });
  const [newPet, setNewPet] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    age: '',
    size: '',
    gender: '',
    color: '',
    weight: '',
    description: '',
    image_url: '',
    good_with_kids: false,
    good_with_dogs: false,
    good_with_cats: false,
    house_trained: false,
    spayed_neutered: false,
    special_needs: false,
    special_needs_description: '',
    medical_notes: '',
    adoption_fee: '',
    location: ''
  });


  const handleLogout = async () => {
    try {
      await signOut();
      localStorage.removeItem('user_role');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };



  // Mock data for testing
  const mockPets = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Luna',
      species: 'Dog',
      breed: 'Golden Retriever',
      age: 2,
      size: 'Grande',
      sex: 'hembra',
      description: 'Luna es una perrita muy cariñosa y juguetona. Le encanta estar con niños y otros perros.',
      image_url: '',
      good_with_kids: true,
      good_with_dogs: true,
      good_with_cats: false,
      created_at: '2024-01-15'
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Max',
      species: 'Dog',
      breed: 'Labrador',
      age: 1,
      size: 'Grande',
      sex: 'macho',
      description: 'Max es muy activo y necesita ejercicio diario. Perfecto para familias deportistas.',
      image_url: '',
      good_with_kids: true,
      good_with_dogs: true,
      good_with_cats: true,
      created_at: '2024-01-20'
    }
  ];

  const mockQuotes = [
    {
      id: '00000000-0000-0000-0000-000000000011',
      pet_id: '00000000-0000-0000-0000-000000000001',
      applicant_id: 'user1',
      message: 'Me encantaría adoptar a Luna. Tengo experiencia con perros y una casa con jardín.',
      status: 'pending',
      created_at: '2024-01-25',
      pet_name: 'Luna',
      applicant_name: 'María González'
    },
    {
      id: '00000000-0000-0000-0000-000000000012',
      pet_id: '00000000-0000-0000-0000-000000000002',
      applicant_id: 'user2',
      message: 'Max sería perfecto para mi familia. Tenemos tiempo para ejercitarlo diariamente.',
      status: 'approved',
      created_at: '2024-01-26',
      pet_name: 'Max',
      applicant_name: 'Carlos Rodríguez'
    }
  ];

  // Get shelter data for the current user
  const { data: shelter, isLoading: shelterLoading, error: shelterError } = useShelter(user?.id); // Assuming user ID is shelter ID
  const { data: pets = [], isLoading: petsLoading, error: petsError } = useAdoptionPetsByShelter(user?.id);
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useUserProfile(user?.id);
  const { data: quotes = [], isLoading: quotesLoading, error: quotesError } = useShelterAdoptionApplications(user?.id);
  const { data: shelterImages = [], isLoading: imagesLoading, error: imagesError } = useShelterImages(user?.id);
  const { data: shelterVideos = [], isLoading: videosLoading, error: videosError } = useShelterVideos(user?.id);

  // Initialize form when shelter data is available
  React.useEffect(() => {
    if (shelter) {
      setShelterForm({
        name: shelter.name || '',
        location: shelter.location || '',
        phone: shelter.phone || '',
        email: shelter.email || '',
        mission_statement: shelter.mission_statement || '',
        years_experience: shelter.years_experience || 0,
        total_volunteers: shelter.total_volunteers || 0
      });
    }
  }, [shelter]);

  // Check for any errors
  const hasErrors = shelterError || petsError || profileError || quotesError || imagesError || videosError;
  // Only block UI for critical loading states, not all data
  const isCriticalLoading = shelterLoading || profileLoading;
  const isLoading = shelterLoading || petsLoading || profileLoading || quotesLoading || imagesLoading || videosLoading;


  // Log errors for debugging
  if (shelterError) console.error('Shelter error:', shelterError);
  if (petsError) console.error('Pets error:', petsError);
  if (profileError) console.error('Profile error:', profileError);
  if (quotesError) console.error('Quotes error:', quotesError);
  if (imagesError) console.error('Images error:', imagesError);
  if (videosError) console.error('Videos error:', videosError);

  // Use mock data for testing when real data is not available
  const isUsingMockData = pets.length === 0;
  const displayPets = pets.length > 0 ? pets : mockPets;
  const displayQuotes = quotes.length > 0 ? quotes : mockQuotes;

  // Filter pets based on current filters
  const filteredPets = displayPets.filter(pet => {
    // Search filter (name, breed, description)
    if (petFilters.search && 
        !pet.name.toLowerCase().includes(petFilters.search.toLowerCase()) && 
        !pet.breed?.toLowerCase().includes(petFilters.search.toLowerCase()) &&
        !pet.description?.toLowerCase().includes(petFilters.search.toLowerCase())) {
      return false;
    }
    
    // Size filter
    if (petFilters.size && pet.size !== petFilters.size) {
      return false;
    }
    
    // Species filter
    if (petFilters.species && pet.species !== petFilters.species) {
      return false;
    }
    
    // Age filter
    if (petFilters.age && pet.age?.toString() !== petFilters.age) {
      return false;
    }
    
    // Gender filter
    if (petFilters.gender && pet.sex !== petFilters.gender) {
      return false;
    }
    
    // Behavior filters
    if (petFilters.good_with_kids && !pet.good_with_kids) {
      return false;
    }
    if (petFilters.good_with_dogs && !pet.good_with_dogs) {
      return false;
    }
    if (petFilters.good_with_cats && !pet.good_with_cats) {
      return false;
    }
    
    // Training filters
    if (petFilters.house_trained && !pet.house_trained) {
      return false;
    }
    if (petFilters.spayed_neutered && !pet.spayed_neutered) {
      return false;
    }
    
    // Special needs filter
    if (petFilters.special_needs && !pet.special_needs) {
      return false;
    }
    
    return true;
  });

  // Filter quotes based on current filters
  const filteredQuotes = displayQuotes.filter(quote => {
    if (quoteFilters.search && 
        !quote.pet_name?.toLowerCase().includes(quoteFilters.search.toLowerCase()) && 
        !quote.applicant_name?.toLowerCase().includes(quoteFilters.search.toLowerCase())) {
      return false;
    }
    if (quoteFilters.status && quote.status !== quoteFilters.status) {
      return false;
    }
    return true;
  });

  // Hooks for mutations
  const updateApplication = useUpdateAdoptionApplication();
  const addPet = useAddShelterPet();
  const updatePet = useUpdateShelterPet();
  const deletePet = useDeleteShelterPet();
  const createShelter = useCreateShelter();

  const handleCreateShelter = async () => {
    if (!user?.id || !newShelter.name.trim()) {
      toast({ title: 'Campo requerido', description: 'El nombre del albergue es obligatorio' });
      return;
    }

    try {
      await createShelter.mutateAsync({
        name: newShelter.name.trim(),
        location: newShelter.location.trim() || undefined,
        phone: newShelter.phone.trim() || undefined,
        description: newShelter.description.trim() || undefined,
        owner_id: user.id
      });

      // Reset form and hide it
      setNewShelter({ name: '', location: '', phone: '', description: '' });
      setShowShelterForm(false);
      
      // Show success message
      toast({ title: 'Albergue creado', description: '¡Albergue creado exitosamente!' });
      
      // Refresh data without page reload
      queryClient.invalidateQueries({ queryKey: ['shelter', user.id] });
    } catch (error) {
      console.error('Error creating shelter:', error);
      toast({ title: 'Error', description: 'Error al crear el albergue. Por favor, intenta de nuevo.', variant: 'destructive' });
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      toast({ title: 'Error de autenticación', description: 'No se pudo identificar el usuario', variant: 'destructive' });
      return;
    }

    try {
      console.log('Attempting to save shelter profile...', {
        userId: user.id,
        shelterForm: shelterForm,
        currentShelter: currentShelter
      });

      // First, check if the shelters table exists and has the right structure
      const { data: tableInfo, error: tableError } = await supabase
        .from('shelters')
        .select('*')
        .limit(1);

      if (tableError) {
        console.error('Shelters table error:', tableError);
        toast({ title: 'Error de base de datos', description: `La tabla 'shelters' no existe o no es accesible. ${tableError.message}`, variant: 'destructive' });
        return;
      }

      // Check if shelter exists for this user
      const { data: existingShelter, error: checkError } = await supabase
        .from('shelters')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no results gracefully

      if (checkError) {
        console.error('Error checking for existing shelter:', checkError);
        toast({ title: 'Error', description: `Error al verificar el albergue existente: ${checkError.message}`, variant: 'destructive' });
        return;
      }

      let shelterId = existingShelter?.id;

      if (!existingShelter) {
        // Create a new shelter if it doesn't exist
        console.log('No existing shelter found, creating new one...');
        const { data: newShelter, error: createError } = await supabase
          .from('shelters')
          .insert({
            owner_id: user.id,
            name: shelterForm.name || 'Mi Albergue',
            location: shelterForm.location || '',
            phone: shelterForm.phone || '',
            email: shelterForm.email || '',
            description: shelterForm.mission_statement || '',
            mission_statement: shelterForm.mission_statement || '',
            years_experience: shelterForm.years_experience || 0,
            total_volunteers: shelterForm.total_volunteers || 0
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating new shelter:', createError);
          toast({ title: 'Error', description: `Error al crear el albergue: ${createError.message}`, variant: 'destructive' });
          return;
        }

        shelterId = newShelter.id;
        console.log('New shelter created successfully:', newShelter);
      } else {
        // Update existing shelter
        console.log('Updating existing shelter...');
        const { error: updateError } = await supabase
          .from('shelters')
          .update({
            name: shelterForm.name,
            location: shelterForm.location,
            phone: shelterForm.phone,
            email: shelterForm.email,
            description: shelterForm.mission_statement,
            mission_statement: shelterForm.mission_statement,
            years_experience: shelterForm.years_experience || 0,
            total_volunteers: shelterForm.total_volunteers || 0
          })
          .eq('owner_id', user.id);

        if (updateError) {
          console.error('Error updating shelter:', updateError);
          toast({ title: 'Error', description: `Error al actualizar el albergue: ${updateError.message}`, variant: 'destructive' });
          return;
        }

        console.log('Shelter updated successfully');
      }

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['shelter', user.id] });
      queryClient.invalidateQueries({ queryKey: ['shelters'] });

      toast({ title: 'Perfil actualizado', description: 'Los cambios fueron guardados correctamente' });
      
      console.log('Profile saved successfully, form data preserved');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: 'Error al guardar', description: `Error inesperado: ${error.message}`, variant: 'destructive' });
    }
  };

  const validatePetForm = () => {
    if (!newPet.name.trim()) {
      toast({ title: 'Campo requerido', description: 'El nombre de la mascota es obligatorio' });
      return false;
    }
    if (!newPet.age || parseInt(newPet.age) < 0) {
      toast({ title: 'Dato inválido', description: 'La edad debe ser un número válido mayor o igual a 0', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleAddPet = async () => {
    if (!user?.id || !currentShelter) return;
    
    if (!validatePetForm()) return;
    
    try {
      await addPet.mutateAsync({
        name: newPet.name,
        species: newPet.species,
        breed: newPet.breed || undefined,
        age: newPet.age ? parseInt(newPet.age) : undefined,
        size: newPet.size || undefined,
        sex: newPet.gender || undefined,
        color: newPet.color || undefined,
        weight: newPet.weight ? parseFloat(newPet.weight) : undefined,
        description: newPet.description || undefined,
        image_url: newPet.image_url || undefined,
        good_with_kids: newPet.good_with_kids,
        good_with_dogs: newPet.good_with_dogs,
        good_with_cats: newPet.good_with_cats,
        house_trained: newPet.house_trained,
        spayed_neutered: newPet.spayed_neutered,
        special_needs: newPet.special_needs,
        special_needs_description: newPet.special_needs_description || undefined,
        medical_notes: newPet.medical_notes || undefined,
        adoption_fee: newPet.adoption_fee || undefined,
        location: newPet.location || undefined,
        status: 'available',
        shelter_id: currentShelter.id,
        owner_id: user.id
      });
      
      // Invalidate pets list and show toast
      queryClient.invalidateQueries({ queryKey: ['adoption-pets-by-shelter', user.id] });
      toast({ 
        title: 'Mascota agregada exitosamente', 
        description: `${newPet.name} ha sido agregada al albergue correctamente` 
      });
      setShowAddPetForm(false);
      setNewPet({
        name: '',
        species: 'Dog',
        breed: '',
        age: '',
        size: '',
        gender: '',
        color: '',
        weight: '',
        description: '',
        good_with_kids: false,
        good_with_dogs: false,
        good_with_cats: false,
        house_trained: false,
        spayed_neutered: false,
        special_needs: false,
        special_needs_description: '',
        medical_notes: '',
        adoption_fee: '',
        location: ''
      });
    } catch (error) {
      console.error('Error adding pet:', error);
      const errorMessage = error?.message || error?.details || 'Error desconocido';
      toast({ title: 'Error', description: `No se pudo agregar la mascota: ${errorMessage}`, variant: 'destructive' });
    }
  };

  const handleEditPet = (pet: Pet) => {
    // Prevent editing mock pets
    if (isUsingMockData) {
      toast({ 
        title: 'No disponible', 
        description: 'No puedes editar mascotas de ejemplo. Agrega una mascota real primero.', 
        variant: 'destructive' 
      });
      return;
    }
    
    setEditingPet(pet);
    setShowAddPetForm(true);
    setActiveTab('add-pet');
    setNewPet({
      name: pet.name,
      species: pet.species || 'Dog',
      breed: pet.breed || '',
      age: pet.age?.toString() || '',
      size: pet.size || '',
      gender: pet.sex || '',
      color: pet.color || '',
      weight: pet.weight?.toString() || '',
      description: pet.description || '',
      image_url: pet.image_url || '',
      good_with_kids: pet.good_with_kids || false,
      good_with_dogs: pet.good_with_dogs || false,
      good_with_cats: pet.good_with_cats || false,
      house_trained: pet.house_trained || false,
      spayed_neutered: pet.spayed_neutered || false,
      special_needs: pet.special_needs || false,
      special_needs_description: pet.special_needs_description || '',
      medical_notes: pet.medical_notes || '',
      adoption_fee: pet.adoption_fee || '',
      location: pet.location || ''
    });
  };

  const handleUpdatePet = async () => {
    if (!editingPet) return;
    
    if (!validatePetForm()) return;
    
    try {
      await updatePet.mutateAsync({
        petId: editingPet.id,
        petData: {
          name: newPet.name,
          species: newPet.species,
          breed: newPet.breed || undefined,
          age: newPet.age ? parseInt(newPet.age) : undefined,
          size: newPet.size || undefined,
          sex: newPet.gender || undefined,
          color: newPet.color || undefined,
          weight: newPet.weight ? parseFloat(newPet.weight) : undefined,
          description: newPet.description || undefined,
          image_url: newPet.image_url || undefined,
          good_with_kids: newPet.good_with_kids,
          good_with_dogs: newPet.good_with_dogs,
          good_with_cats: newPet.good_with_cats,
          house_trained: newPet.house_trained,
          spayed_neutered: newPet.spayed_neutered,
          special_needs: newPet.special_needs,
          special_needs_description: newPet.special_needs_description || undefined,
          medical_notes: newPet.medical_notes || undefined,
          adoption_fee: newPet.adoption_fee || undefined,
          location: newPet.location || undefined
        }
      });
      
      // Invalidate list and notify
      queryClient.invalidateQueries({ queryKey: ['adoption-pets-by-shelter', user?.id] });
      toast({ 
        title: 'Mascota actualizada exitosamente', 
        description: `La información de ${newPet.name} ha sido actualizada correctamente` 
      });
      setEditingPet(null);
      setShowAddPetForm(false);
      setNewPet({
        name: '',
        species: 'Dog',
        breed: '',
        age: '',
        size: '',
        gender: '',
        color: '',
        weight: '',
        description: '',
        good_with_kids: false,
        good_with_dogs: false,
        good_with_cats: false,
        house_trained: false,
        spayed_neutered: false,
        special_needs: false,
        special_needs_description: '',
        medical_notes: '',
        adoption_fee: '',
        location: ''
      });
    } catch (error) {
      console.error('Error updating pet:', error);
      const errorMessage = error?.message || error?.details || 'Error desconocido';
      toast({ title: 'Error', description: `No se pudo actualizar la mascota: ${errorMessage}`, variant: 'destructive' });
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (!currentShelter) return;
    
    if (confirm('¿Estás seguro de que quieres eliminar esta mascota?')) {
      try {
        await deletePet.mutateAsync({
          petId,
          shelterId: currentShelter.id
        });
        toast({ 
          title: 'Mascota eliminada exitosamente', 
          description: 'La mascota ha sido eliminada del albergue correctamente' 
        });
      } catch (error) {
        console.error('Error deleting pet:', error);
        toast({ 
          title: 'Error al eliminar mascota', 
          description: `No se pudo eliminar la mascota: ${error.message}`, 
          variant: 'destructive' 
        });
      }
    }
  };

  const handleQuoteAction = async (quoteId: string, action: 'approved' | 'rejected') => {
    if (!currentShelter) {
      console.error('No current shelter found');
      toast({ 
        title: 'Error', 
        description: 'No se encontró el albergue actual', 
        variant: 'destructive' 
      });
      return;
    }
    
    try {
      console.log('Updating application:', { quoteId, action, shelterId: currentShelter.id });
      
      // Use mutate instead of mutateAsync for better UX
      updateApplication.mutate({
        applicationId: quoteId,
        status: action,
        shelterId: currentShelter.id
      }, {
        onSuccess: () => {
          toast({ 
            title: 'Solicitud actualizada', 
            description: `La solicitud ha sido ${action === 'approved' ? 'aprobada' : 'rechazada'} exitosamente` 
          });
        },
        onError: (error) => {
          console.error('Error updating application:', error);
          toast({ 
            title: 'Error', 
            description: `No se pudo actualizar la solicitud: ${error.message || 'Error desconocido'}`, 
            variant: 'destructive' 
          });
        }
      });
    } catch (error) {
      console.error('Error updating application:', error);
      toast({ 
        title: 'Error', 
        description: `No se pudo actualizar la solicitud: ${error.message || 'Error desconocido'}`, 
        variant: 'destructive' 
      });
    }
  };

  // Handle shelter image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id || !currentShelter) {
      console.log('Missing requirements:', { file: !!file, userId: !!user?.id, shelter: !!currentShelter });
      return;
    }

    setUploadingImage(true);
    try {
      console.log('Starting image upload for shelter:', currentShelter.id);
      
      // Upload file to storage
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `shelters/${currentShelter.id}/images/${fileName}`;
      
      console.log('Uploading to storage:', filePath);
      const { error: uploadError } = await supabase.storage
        .from('shelter-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('shelter-images')
        .getPublicUrl(filePath);

      console.log('Got public URL:', publicUrl);

      // Save to database
      const insertData = {
        shelter_id: currentShelter.id,
        image_url: publicUrl,
        alt_text: file.name
      };
      
      console.log('Inserting to database:', insertData);
      
      const { error: dbError } = await supabase
        .from('shelter_images')
        .insert(insertData);

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }

      toast({ title: 'Imagen subida', description: 'La imagen se ha subido correctamente' });
      // Refresh the images list without leaving current tab
      queryClient.invalidateQueries({ queryKey: ['shelter-images', user.id] });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Error al subir imagen', description: `${error.message}`, variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle pet image upload
  const handlePetImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id || !currentShelter) {
      console.log('Missing requirements for pet image:', { file: !!file, userId: !!user?.id, shelter: !!currentShelter });
      return;
    }

    console.log('=== PET IMAGE UPLOAD START ===');
    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    console.log('User ID:', user.id);
    console.log('Shelter ID:', currentShelter.id);

    setUploadingImage(true);
    try {
      console.log('Starting pet image upload for shelter:', currentShelter.id);
      
      // Upload file to pet-images storage bucket
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${currentShelter.id}/${fileName}`;
      
      console.log('Uploading pet image to storage:', filePath);
      console.log('Using bucket: pet-images');
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pet-images')
        .upload(filePath, file);

      console.log('Upload response:', { uploadData, uploadError });

      if (uploadError) {
        console.error('Pet image storage upload error:', uploadError);
        console.error('Error details:', JSON.stringify(uploadError, null, 2));
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pet-images')
        .getPublicUrl(filePath);

      console.log('Got pet image public URL:', publicUrl);

      // Update the newPet state with the image URL
      setNewPet(prev => {
        const updated = {
          ...prev,
          image_url: publicUrl
        };
        console.log('Updated newPet state:', updated);
        return updated;
      });

      console.log('Updated newPet state with image URL:', publicUrl);
      toast({ title: 'Imagen de mascota subida', description: 'La imagen se ha subido correctamente' });
      console.log('=== PET IMAGE UPLOAD SUCCESS ===');
    } catch (error) {
      console.error('=== PET IMAGE UPLOAD ERROR ===');
      console.error('Error uploading pet image:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast({ title: 'Error al subir imagen de mascota', description: `${error.message}`, variant: 'destructive' });
    } finally {
      setUploadingImage(false);
      console.log('=== PET IMAGE UPLOAD END ===');
    }
  };

  // Handle video upload
  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id || !currentShelter) {
      console.log('Video upload missing requirements:', { file: !!file, userId: !!user?.id, shelter: !!currentShelter });
      return;
    }

    console.log('Starting video upload for shelter:', currentShelter.id);
    setUploadingVideo(true);
    try {
      // Upload file to storage
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `shelters/${currentShelter.id}/videos/${fileName}`;
      
      console.log('Uploading video to storage:', filePath);
      const { error: uploadError } = await supabase.storage
        .from('shelter-videos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Video storage upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('shelter-videos')
        .getPublicUrl(filePath);

      console.log('Got video public URL:', publicUrl);

      // Save to database
      const insertData = {
        shelter_id: currentShelter.id,
        title: file.name,
        youtube_url: publicUrl,
        description: `Video subido: ${file.name}`
      };
      
      console.log('Inserting video to database:', insertData);
      const { error: dbError } = await supabase
        .from('shelter_videos')
        .insert(insertData);

      if (dbError) {
        console.error('Video database insert error:', dbError);
        throw dbError;
      }

      toast({ title: 'Video subido', description: 'El video se ha subido correctamente' });
      // Refresh the videos list without leaving current tab
      queryClient.invalidateQueries({ queryKey: ['shelter-videos', user.id] });
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({ title: 'Error al subir video', description: 'No se pudo subir el video', variant: 'destructive' });
    } finally {
      setUploadingVideo(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso denegado</h2>
        <p className="text-gray-500">Debes iniciar sesión para acceder al dashboard del albergue.</p>
      </div>
    );
  }

  // Show loading state only for critical data
  if (isCriticalLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🐾</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">Cargando datos del albergue...</h2>
          <p className="text-gray-500 mt-2">Conectando con la base de datos...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasErrors) {
    // Check if the main issue is that the user doesn't have a shelter
    const noShelterError = shelterError && shelterError.message.includes('No rows returned');
    
    if (noShelterError && !showShelterForm) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">🏠</span>
            </div>
            <h2 className="text-xl font-semibold text-blue-700">¡Bienvenido a Druma!</h2>
            <p className="text-gray-600 mt-2">Parece que aún no tienes un albergue registrado.</p>
            <p className="text-gray-600 mt-1">Crea tu albergue para comenzar a gestionar mascotas y adopciones.</p>
            
            <Button 
              onClick={() => setShowShelterForm(true)} 
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
            >
              <Building2 className="w-5 h-5 mr-2" />
              Crear Mi Albergue
            </Button>
          </div>
        </div>
      );
    }

    if (noShelterError && showShelterForm) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">🏠</span>
              </div>
              <h2 className="text-2xl font-semibold text-blue-700">Crear Nuevo Albergue</h2>
              <p className="text-gray-600 mt-2">Completa la información de tu albergue para comenzar</p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label htmlFor="shelter-name">Nombre del Albergue *</Label>
                  <Input 
                    id="shelter-name" 
                    value={newShelter.name} 
                    onChange={(e) => setNewShelter({...newShelter, name: e.target.value})}
                    placeholder="Ej: Refugio de Mascotas Felices"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="shelter-location">Ubicación</Label>
                  <Input 
                    id="shelter-location" 
                    value={newShelter.location} 
                    onChange={(e) => setNewShelter({...newShelter, location: e.target.value})}
                    placeholder="Ciudad, Estado, País"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="shelter-phone">Teléfono</Label>
                  <Input 
                    id="shelter-phone" 
                    value={newShelter.phone} 
                    onChange={(e) => setNewShelter({...newShelter, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="shelter-description">Descripción</Label>
                  <Textarea 
                    id="shelter-description" 
                    value={newShelter.description} 
                    onChange={(e) => setNewShelter({...newShelter, description: e.target.value})}
                    placeholder="Describe tu albergue, misión, servicios, etc."
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowShelterForm(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateShelter}
                    disabled={!newShelter.name.trim() || createShelter.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {createShelter.isPending ? 'Creando...' : 'Crear Albergue'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Show other errors
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-red-700">Error de conexión</h2>
          <p className="text-gray-600 mt-2">No se pudieron cargar los datos del albergue.</p>
          <div className="mt-4 p-4 bg-red-50 rounded-lg text-left text-sm">
            <p className="font-semibold text-red-800">Detalles del error:</p>
            {shelterError && <p className="text-red-600">• Error del albergue: {shelterError.message}</p>}
            {petsError && <p className="text-red-600">• Error de mascotas: {petsError.message}</p>}
            {profileError && <p className="text-red-600">• Error del perfil: {profileError.message}</p>}
            {quotesError && <p className="text-red-600">• Error de solicitudes: {quotesError.message}</p>}
            {imagesError && <p className="text-red-600">• Error de imágenes: {imagesError.message}</p>}
            {videosError && <p className="text-red-600">• Error de videos: {videosError.message}</p>}
          </div>
          
          {/* Database Connection Test */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-left text-sm">
            <p className="font-semibold text-blue-800">🔍 Diagnóstico de Base de Datos:</p>
            <p className="text-blue-600 mt-2">
              Los errores sugieren que las tablas de la base de datos no han sido creadas aún.
            </p>
            <p className="text-blue-600 mt-1">
              Para solucionarlo, ejecuta el script de base de datos en Supabase:
            </p>
            <div className="mt-2 p-2 bg-white rounded border text-xs">
              <p className="font-mono text-gray-700">1. Ve a tu proyecto Supabase</p>
              <p className="font-mono text-gray-700">2. Abre el SQL Editor</p>
              <p className="font-mono text-gray-700">3. Ejecuta: supabase-shelter-dashboard-schema.sql</p>
              <p className="font-mono text-gray-700">4. Luego ejecuta: supabase-shelter-dashboard-sample-data.sql</p>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // For now, let's use a mock shelter for testing
  const mockShelter = {
    id: 'test-shelter-id',
    name: 'Mi Albergue',
    location: 'Ciudad',
    phone: '+1 (555) 123-4567',
    email: user?.email || 'shelter@email.com',
    mission_statement: 'Somos un albergue dedicado a rescatar y encontrar hogares para mascotas necesitadas.',
    years_experience: 3,
    total_volunteers: 8
  };

  // Use mock shelter for now, or real shelter if it exists
  const currentShelter = shelter || mockShelter;
  
  // Debug logging
  console.log('ShelterDashboard Debug:', {
    userId: user?.id,
    quotes: quotes.length,
    quotesData: quotes,
    quotesError: quotesError?.message,
    currentShelter: currentShelter?.id
  });


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard del Albergue</h1>
            <p className="text-gray-600">Gestiona tu albergue y mascotas</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              <Building2 className="w-4 h-4 mr-2" />
              {currentShelter.name}
            </Badge>
            <SettingsDropdown variant="default" />
            
            {/* Database Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${hasErrors ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span className="text-xs text-gray-600">
                {hasErrors ? 'Error de conexión' : 'Base de datos conectada'}
              </span>
              {hasErrors && (
                <div className="ml-2 text-xs text-red-600">
                  (Verificar esquema de BD)
                </div>
              )}
              {hasErrors && (
                <button 
                  onClick={async () => {
                    try {
                      // Test basic database connection and table structure
                      console.log('🔍 Testing database connection...');
                      
                      // Test 1: Basic connection to shelters table
                      const { data: shelterTest, error: shelterError } = await supabase
                        .from('shelters')
                        .select('*')
                        .limit(1);
                      
                      if (shelterError) {
                        toast({ title: 'Error de conexión', description: `Error accessing shelters table: ${shelterError.message}`, variant: 'destructive' });
                        return;
                      }
                      
                      // Test 2: Check if user can access their own data
                      const { data: userShelter, error: userError } = await supabase
                        .from('shelters')
                        .select('*')
                        .eq('owner_id', user?.id)
                        .limit(1);
                      
                      let diagnosticMessage = '✅ Conexión exitosa a la base de datos!\n\n';
                      diagnosticMessage += `📊 Tabla shelters: ${shelterTest?.length || 0} registros\n`;
                      diagnosticMessage += `👤 Tu shelter: ${userShelter?.length || 0} registros\n`;
                      
                      if (userError) {
                        diagnosticMessage += `⚠️ Error al acceder a tu shelter: ${userError.message}\n`;
                      }
                      
                      if (userShelter?.length === 0) {
                        diagnosticMessage += `\n💡 No tienes un shelter registrado. Necesitas crear uno primero.`;
                        diagnosticMessage += `\n\n🔧 Solución: Haz clic en "Crear Mi Albergue" para comenzar.`;
                      } else {
                        diagnosticMessage += `\n✅ Tienes un shelter registrado: ${userShelter[0].name}`;
                      }
                      
                      toast({ title: 'Diagnóstico', description: diagnosticMessage });
                      
                    } catch (err) {
                      toast({ title: 'Error de conexión', description: String(err), variant: 'destructive' });
                    }
                  }}
                  className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                >
                  Probar Conexión
                </button>
              )}
            </div>
            
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{displayPets.length}</div>
              <div className="text-sm text-gray-600">Mascotas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
                             <div className="text-2xl font-bold text-green-600">
                 {displayQuotes.filter(q => q.status === 'pending').length}
               </div>
               <div className="text-sm text-gray-600">Solicitudes Pendientes</div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-4 text-center">
               <div className="text-2xl font-bold text-blue-600">
                 {displayQuotes.filter(q => q.status === 'approved').length}
               </div>
               <div className="text-sm text-gray-600">Adopciones Aprobadas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
                             <div className="text-2xl font-bold text-orange-600">
                 {currentShelter.total_volunteers || 0}
               </div>
              <div className="text-sm text-gray-600">Voluntarios</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white p-1 shadow-sm">
          <TabsTrigger 
            value="profile" 
            className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
          >
            Perfil
          </TabsTrigger>
          <TabsTrigger 
            value="pets" 
            className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
          >
            Mascotas
          </TabsTrigger>
          <TabsTrigger 
            value="quotes" 
            className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
          >
            Solicitudes
          </TabsTrigger>
           <TabsTrigger 
             value="media" 
             className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
           >
             Imágenes & Videos
           </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Información del Albergue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="shelter-name">Nombre del Albergue</Label>
                    <Input 
                      id="shelter-name" 
                      value={shelterForm.name} 
                      onChange={(e) => setShelterForm({...shelterForm, name: e.target.value})}
                      className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shelter-location">Ubicación</Label>
                    <Input 
                      id="shelter-location" 
                      value={shelterForm.location} 
                      onChange={(e) => setShelterForm({...shelterForm, location: e.target.value})}
                      className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shelter-phone">Teléfono</Label>
                    <Input 
                      id="shelter-phone" 
                      value={shelterForm.phone} 
                      onChange={(e) => setShelterForm({...shelterForm, phone: e.target.value})}
                      className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shelter-email">Email</Label>
                    <Input 
                      id="shelter-email" 
                      value={shelterForm.email} 
                      onChange={(e) => setShelterForm({...shelterForm, email: e.target.value})}
                      className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                                     <div>
                     <Label htmlFor="shelter-mission">Declaración de Misión</Label>
                     <Textarea 
                       id="shelter-mission" 
                      value={shelterForm.mission_statement} 
                      onChange={(e) => setShelterForm({...shelterForm, mission_statement: e.target.value})}
                       placeholder="Describe la misión de tu albergue..."
                       rows={4}
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <Label htmlFor="shelter-years">Años de Experiencia</Label>
                       <Input 
                         id="shelter-years" 
                         type="number" 
                        value={shelterForm.years_experience} 
                        onChange={(e) => setShelterForm({...shelterForm, years_experience: parseInt(e.target.value) || 0})}
                         min="0"
                       />
                     </div>
                     <div>
                       <Label htmlFor="shelter-volunteers">Total de Voluntarios</Label>
                       <Input 
                         id="shelter-volunteers" 
                         type="number" 
                        value={shelterForm.total_volunteers} 
                        onChange={(e) => setShelterForm({...shelterForm, total_volunteers: parseInt(e.target.value) || 0})}
                         min="0"
                       />
                     </div>
                   </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} className="bg-purple-600 hover:bg-purple-700">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pets Tab */}
        <TabsContent value="pets" className="space-y-6">
          {/* Pets Header with Filters and View Toggle */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Mascotas del Albergue</h3>
                {isUsingMockData && (
                  <p className="text-sm text-amber-600 mt-1">
                    📋 Mostrando datos de ejemplo. Agrega mascotas reales para gestionarlas.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={petViewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPetViewMode('cards')}
                    className="h-8 px-3"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={petViewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPetViewMode('list')}
                    className="h-8 px-3"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                                 <Button 
                   onClick={() => {
                     setShowAddPetForm(true);
                     setActiveTab('add-pet');
                   }} 
                   className="bg-green-600 hover:bg-green-700"
                   style={{ 
                     zIndex: 9999, 
                     position: 'relative',
                     pointerEvents: 'auto',
                     cursor: 'pointer'
                   }}
                 >
                   <Plus className="w-4 h-4 mr-2" />
                   Agregar Mascota
                 </Button>
              </div>
            </div>

            {/* Enhanced Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* First Row - Basic Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="pet-search">Buscar</Label>
                      <Input
                        id="pet-search"
                        placeholder="Nombre, raza o descripción..."
                        value={petFilters.search}
                        onChange={(e) => setPetFilters({...petFilters, search: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pet-species-filter">Especie</Label>
                      <select
                        id="pet-species-filter"
                        value={petFilters.species}
                        onChange={(e) => setPetFilters({...petFilters, species: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Todas las especies</option>
                        <option value="Dog">Perro</option>
                        <option value="Cat">Gato</option>
                        <option value="Other">Otro</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="pet-size-filter">Tamaño</Label>
                      <select
                        id="pet-size-filter"
                        value={petFilters.size}
                        onChange={(e) => setPetFilters({...petFilters, size: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Todos los tamaños</option>
                        <option value="pequeño">Pequeño</option>
                        <option value="mediano">Mediano</option>
                        <option value="grande">Grande</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="pet-age-filter">Edad</Label>
                      <select
                        id="pet-age-filter"
                        value={petFilters.age}
                        onChange={(e) => setPetFilters({...petFilters, age: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Todas las edades</option>
                        <option value="1">1 año</option>
                        <option value="2">2 años</option>
                        <option value="3">3 años</option>
                        <option value="4">4 años</option>
                        <option value="5">5 años</option>
                        <option value="6">6 años</option>
                        <option value="7">7 años</option>
                        <option value="8">8 años</option>
                        <option value="9">9 años</option>
                        <option value="10">10+ años</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Second Row - Behavior & Training Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Comportamiento</Label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={petFilters.good_with_kids}
                            onChange={(e) => setPetFilters({...petFilters, good_with_kids: e.target.checked})}
                            className="rounded"
                          />
                          <span className="text-sm">👶 Con niños</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={petFilters.good_with_dogs}
                            onChange={(e) => setPetFilters({...petFilters, good_with_dogs: e.target.checked})}
                            className="rounded"
                          />
                          <span className="text-sm">🐕 Con perros</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={petFilters.good_with_cats}
                            onChange={(e) => setPetFilters({...petFilters, good_with_cats: e.target.checked})}
                            className="rounded"
                          />
                          <span className="text-sm">🐱 Con gatos</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label>Entrenamiento & Salud</Label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={petFilters.house_trained}
                            onChange={(e) => setPetFilters({...petFilters, house_trained: e.target.checked})}
                            className="rounded"
                          />
                          <span className="text-sm">🏠 Educado</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={petFilters.spayed_neutered}
                            onChange={(e) => setPetFilters({...petFilters, spayed_neutered: e.target.checked})}
                            className="rounded"
                          />
                          <span className="text-sm">✂️ Esterilizado</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={petFilters.special_needs}
                            onChange={(e) => setPetFilters({...petFilters, special_needs: e.target.checked})}
                            className="rounded"
                          />
                          <span className="text-sm">❤️ Necesidades especiales</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Clear Filters Button */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setPetFilters({
                        search: '',
                        size: '',
                        species: '',
                        age: '',
                        gender: '',
                        house_trained: false,
                        spayed_neutered: false,
                        special_needs: false,
                        good_with_kids: false,
                        good_with_dogs: false,
                        good_with_cats: false
                      })}
                      className="px-6"
                    >
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {petsLoading ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🐾</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Cargando mascotas...</h3>
                <p className="text-gray-500">Obteniendo datos de las mascotas del albergue...</p>
              </CardContent>
            </Card>
          ) : filteredPets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <PawPrint className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {displayPets.length === 0 ? 'No hay mascotas' : 'No hay mascotas que coincidan con los filtros'}
                </h3>
                <p className="text-gray-600">
                  {displayPets.length === 0 
                    ? 'Agrega tu primera mascota para comenzar a gestionar adopciones.'
                    : 'Intenta ajustar los filtros de búsqueda.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Results count */}
              <div className="text-sm text-gray-600 mb-4">
                Mostrando {filteredPets.length} de {displayPets.length} mascotas
              </div>

              {/* Cards View */}
              {petViewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPets.map((pet) => (
              <Card key={pet.id} className="overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center relative">
                  {pet.image_url ? (
                    <img 
                      src={pet.image_url} 
                      alt={pet.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PawPrint className="w-20 h-20 text-purple-400" />
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                      onClick={() => handleEditPet(pet)}
                      disabled={isUsingMockData}
                      title={isUsingMockData ? "No se puede editar mascotas de ejemplo" : "Editar mascota"}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                      onClick={() => handleDeletePet(pet.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-800">{pet.name}</h4>
                    {pet.age && <span className="text-sm text-gray-500">{pet.age} años</span>}
                  </div>
                   
                                     <div className="flex flex-wrap gap-2">
                     {pet.breed && (
                       <Badge variant="secondary" className="text-xs">
                         <PawPrint className="w-3 h-3 mr-1" />
                         {pet.breed}
                       </Badge>
                     )}
                     {pet.size && (
                       <Badge variant="outline" className="text-xs">
                         {pet.size}
                       </Badge>
                     )}
                     {pet.gender && (
                       <Badge variant="outline" className="text-xs">
                         {pet.gender === 'macho' ? '♂' : '♀'}
                       </Badge>
                     )}
                   </div>
                   
                  {pet.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{pet.description}</p>
                  )}
                   
                  <div className="flex items-center space-x-2">
                    {pet.good_with_kids && (
                      <Badge variant="outline" className="text-xs text-green-600">👶</Badge>
                    )}
                    {pet.good_with_dogs && (
                      <Badge variant="outline" className="text-xs text-blue-600">🐕</Badge>
                    )}
                    {pet.good_with_cats && (
                      <Badge variant="outline" className="text-xs text-purple-600">🐱</Badge>
                    )}
                                     </div>
                 </CardContent>
               </Card>
               ))}
                 </div>
               )}

               {/* List View */}
               {petViewMode === 'list' && (
                 <div className="space-y-3">
                   {filteredPets.map((pet) => (
                     <Card key={pet.id} className="p-4">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-4">
                           <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                             {pet.image_url ? (
                               <img 
                                 src={pet.image_url} 
                                 alt={pet.name} 
                                 className="w-full h-full object-cover rounded-lg"
                               />
                             ) : (
                               <PawPrint className="w-8 h-8 text-purple-400" />
                             )}
                           </div>
                           <div>
                             <h4 className="font-semibold text-gray-800">{pet.name}</h4>
                             <div className="flex items-center space-x-2 text-sm text-gray-600">
                               {pet.breed && <span>{pet.breed}</span>}
                               {pet.age && <span>• {pet.age} años</span>}
                               {pet.size && <span>• {pet.size}</span>}
                               {pet.gender && <span>• {pet.gender === 'macho' ? '♂' : '♀'}</span>}
                               {pet.color && <span>• {pet.color}</span>}
                             </div>
                             {pet.description && (
                               <p className="text-sm text-gray-600 mt-1 line-clamp-2">{pet.description}</p>
                             )}
                           </div>
                         </div>
                         <div className="flex items-center space-x-2">
                           <div className="flex items-center space-x-2">
                             {pet.good_with_kids && (
                               <Badge variant="outline" className="text-xs text-green-600">👶</Badge>
                             )}
                             {pet.good_with_dogs && (
                               <Badge variant="outline" className="text-xs text-blue-600">🐕</Badge>
                             )}
                             {pet.good_with_cats && (
                               <Badge variant="outline" className="text-xs text-purple-600">🐱</Badge>
                             )}
                           </div>
                           <Button
                             size="sm"
                             variant="ghost"
                             onClick={() => handleEditPet(pet)}
                             className="h-8 w-8 p-0"
                             disabled={isUsingMockData}
                             title={isUsingMockData ? "No se puede editar mascotas de ejemplo" : "Editar mascota"}
                           >
                             <Edit className="w-4 h-4" />
                           </Button>
                           <Button
                             size="sm"
                             variant="ghost"
                             onClick={() => handleDeletePet(pet.id)}
                             className="h-8 w-8 p-0 text-red-500"
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         </div>
                       </div>
                     </Card>
                   ))}
                 </div>
               )}
             </>
           )}
         </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="space-y-6">
          {/* Quotes Header with Filters and View Toggle */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Solicitudes de Adopción</h3>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={quoteViewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setQuoteViewMode('cards')}
                  className="h-8 px-3"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={quoteViewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setQuoteViewMode('list')}
                  className="h-8 px-3"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quote-search">Buscar</Label>
                    <Input
                      id="quote-search"
                      placeholder="Nombre de mascota o solicitante..."
                      value={quoteFilters.search}
                      onChange={(e) => setQuoteFilters({...quoteFilters, search: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quote-status-filter">Estado</Label>
                    <select
                      id="quote-status-filter"
                      value={quoteFilters.status}
                      onChange={(e) => setQuoteFilters({...quoteFilters, status: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Todos los estados</option>
                      <option value="pending">Pendiente</option>
                      <option value="approved">Aprobada</option>
                      <option value="rejected">Rechazada</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => setQuoteFilters({
                        search: '',
                        status: '',
                        dateRange: ''
                      })}
                      className="w-full"
                    >
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Solicitudes de Adopción
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredQuotes.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {displayQuotes.length === 0 ? 'No hay solicitudes' : 'No hay solicitudes que coincidan con los filtros'}
                  </h3>
                  <p className="text-gray-600">
                    {displayQuotes.length === 0 
                      ? 'Cuando los usuarios soliciten adoptar tus mascotas, aparecerán aquí.'
                      : 'Intenta ajustar los filtros de búsqueda.'
                    }
                  </p>
                </div>
              ) : (
                <>
                  {/* Results count */}
                  <div className="text-sm text-gray-600 mb-4">
                    Mostrando {filteredQuotes.length} de {displayQuotes.length} solicitudes
                  </div>

                  {/* Cards View */}
                  {quoteViewMode === 'cards' && (
                    <div className="space-y-4">
                      {filteredQuotes.map((quote) => (
                  <div key={quote.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          Solicitud para {quote.pet_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Por: {quote.applicant_name} • {new Date(quote.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        variant={quote.status === 'pending' ? 'secondary' : quote.status === 'approved' ? 'default' : 'destructive'}
                      >
                        {quote.status === 'pending' ? 'Pendiente' : quote.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                      </Badge>
                    </div>
                    
                    {quote.message && (
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                        {quote.message}
                      </p>
                    )}
                    
                    {quote.status === 'pending' && (
                      <div className="flex gap-2">
                                                 <Button 
                           size="sm" 
                           onClick={() => handleQuoteAction(quote.id, 'approved')}
                           className="bg-green-600 hover:bg-green-700"
                         >
                           Aprobar
                         </Button>
                         <Button 
                           size="sm" 
                           variant="outline"
                           onClick={() => handleQuoteAction(quote.id, 'rejected')}
                         >
                           Rechazar
                         </Button>
                      </div>
                    )}
                  </div>
                ))}
                  </div>
                )}

                {/* List View */}
                {quoteViewMode === 'list' && (
                  <div className="space-y-3">
                    {filteredQuotes.map((quote) => (
                      <Card key={quote.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-800">
                                Solicitud para {quote.pet_name}
                              </h4>
                              <Badge 
                                variant={quote.status === 'pending' ? 'secondary' : quote.status === 'approved' ? 'default' : 'destructive'}
                              >
                                {quote.status === 'pending' ? 'Pendiente' : quote.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Solicitante:</span> {quote.applicant_name} • 
                              <span className="font-medium ml-2">Fecha:</span> {new Date(quote.created_at).toLocaleDateString()}
                            </div>
                            {quote.message && (
                              <p className="text-gray-700 bg-gray-50 p-3 rounded-md text-sm">
                                {quote.message}
                              </p>
                            )}
                          </div>
                          <div className="ml-4">
                            {quote.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleQuoteAction(quote.id, 'approved')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Aprobar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleQuoteAction(quote.id, 'rejected')}
                                >
                                  Rechazar
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

        {/* Add Pet Tab */}
        <TabsContent value="add-pet" className="space-y-6">
          {!showAddPetForm && !editingPet ? (
            <Card>
              <CardContent className="text-center py-12">
                <PawPrint className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Gestionar Mascotas</h3>
                <p className="text-gray-600 mb-6">Agrega nuevas mascotas o edita las existentes desde la pestaña "Mascotas"</p>
                <Button 
                  onClick={() => {
                    setShowAddPetForm(true);
                    setActiveTab('add-pet');
                  }} 
                  className="bg-purple-600 hover:bg-purple-700"
                  style={{ 
                    zIndex: 9999, 
                    position: 'relative',
                    pointerEvents: 'auto',
                    cursor: 'pointer'
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Nueva Mascota
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  {editingPet ? 'Editar Mascota' : 'Agregar Nueva Mascota'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   {/* Basic Information */}
                   <div className="space-y-4">
                     <h4 className="font-semibold text-gray-800 border-b pb-2">Información Básica</h4>
                     <div>
                       <Label htmlFor="pet-name">Nombre *</Label>
                       <Input 
                         id="pet-name" 
                         value={newPet.name} 
                         onChange={(e) => setNewPet({...newPet, name: e.target.value})}
                         placeholder="Nombre de la mascota"
                       />
                     </div>
                     <div>
                       <Label htmlFor="pet-species">Especie *</Label>
                       <select
                         id="pet-species"
                         value={newPet.species}
                         onChange={(e) => setNewPet({...newPet, species: e.target.value})}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                       >
                         <option value="Dog">Perro</option>
                         <option value="Cat">Gato</option>
                         <option value="Bird">Ave</option>
                         <option value="Fish">Pez</option>
                         <option value="Rabbit">Conejo</option>
                         <option value="Hamster">Hámster</option>
                         <option value="Other">Otro</option>
                       </select>
                     </div>
                     <div>
                       <Label htmlFor="pet-breed">Raza</Label>
                       <Input 
                         id="pet-breed" 
                         value={newPet.breed} 
                         onChange={(e) => setNewPet({...newPet, breed: e.target.value})}
                         placeholder="Raza de la mascota"
                       />
                     </div>
                     <div>
                       <Label htmlFor="pet-age">Edad (años)</Label>
                       <Input 
                         id="pet-age" 
                         type="number" 
                         value={newPet.age} 
                         onChange={(e) => setNewPet({...newPet, age: e.target.value})}
                         placeholder="Edad en años"
                       />
                     </div>
                     <div>
                       <Label htmlFor="pet-gender">Género</Label>
                       <select 
                         id="pet-gender"
                         value={newPet.gender}
                         onChange={(e) => setNewPet({...newPet, gender: e.target.value})}
                         className="w-full p-2 border border-gray-300 rounded-md"
                       >
                         <option value="">Seleccionar género</option>
                         <option value="macho">Macho</option>
                         <option value="hembra">Hembra</option>
                       </select>
                     </div>
                     <div>
                       <Label htmlFor="pet-size">Tamaño</Label>
                       <select 
                         id="pet-size"
                         value={newPet.size}
                         onChange={(e) => setNewPet({...newPet, size: e.target.value})}
                         className="w-full p-2 border border-gray-300 rounded-md"
                       >
                         <option value="">Seleccionar tamaño</option>
                         <option value="pequeño">Pequeño</option>
                         <option value="mediano">Mediano</option>
                         <option value="grande">Grande</option>
                       </select>
                     </div>
                     <div>
                       <Label htmlFor="pet-color">Color</Label>
                       <Input 
                         id="pet-color" 
                         value={newPet.color} 
                         onChange={(e) => setNewPet({...newPet, color: e.target.value})}
                         placeholder="Color principal"
                       />
                     </div>
                     <div>
                       <Label htmlFor="pet-weight">Peso (kg)</Label>
                       <Input 
                         id="pet-weight" 
                         type="number" 
                         step="0.1"
                         value={newPet.weight} 
                         onChange={(e) => setNewPet({...newPet, weight: e.target.value})}
                         placeholder="Peso en kg"
                       />
                     </div>
                   </div>
                   
                   {/* Behavior & Health */}
                   <div className="space-y-4">
                     <h4 className="font-semibold text-gray-800 border-b pb-2">Comportamiento & Salud</h4>
                     <div className="space-y-3">
                       <Label>Comportamiento</Label>
                       <div className="space-y-2">
                         <label className="flex items-center space-x-2">
                           <input 
                             type="checkbox" 
                             checked={newPet.good_with_kids}
                             onChange={(e) => setNewPet({...newPet, good_with_kids: e.target.checked})}
                             className="rounded"
                           />
                           <span className="text-sm">Bueno con niños</span>
                         </label>
                         <label className="flex items-center space-x-2">
                           <input 
                             type="checkbox" 
                             checked={newPet.good_with_dogs}
                             onChange={(e) => setNewPet({...newPet, good_with_dogs: e.target.checked})}
                             className="rounded"
                           />
                           <span className="text-sm">Bueno con perros</span>
                         </label>
                         <label className="flex items-center space-x-2">
                           <input 
                             type="checkbox" 
                             checked={newPet.good_with_cats}
                             onChange={(e) => setNewPet({...newPet, good_with_cats: e.target.checked})}
                             className="rounded"
                           />
                           <span className="text-sm">Bueno con gatos</span>
                         </label>
                         <label className="flex items-center space-x-2">
                           <input 
                             type="checkbox" 
                             checked={newPet.house_trained}
                             onChange={(e) => setNewPet({...newPet, house_trained: e.target.checked})}
                             className="rounded"
                           />
                           <span className="text-sm">Entrenado en casa</span>
                         </label>
                         <label className="flex items-center space-x-2">
                           <input 
                             type="checkbox" 
                             checked={newPet.spayed_neutered}
                             onChange={(e) => setNewPet({...newPet, spayed_neutered: e.target.checked})}
                             className="rounded"
                           />
                           <span className="text-sm">Esterilizado/Castrado</span>
                         </label>
                       </div>
                     </div>
                     
                     <div>
                       <Label htmlFor="pet-medical-notes">Notas Médicas</Label>
                       <Textarea 
                         id="pet-medical-notes" 
                         value={newPet.medical_notes} 
                         onChange={(e) => setNewPet({...newPet, medical_notes: e.target.value})}
                         placeholder="Vacunas, tratamientos, etc."
                         rows={3}
                       />
                     </div>
                     
                     <div>
                       <Label htmlFor="pet-special-needs">Necesidades Especiales</Label>
                       <div className="space-y-2">
                         <label className="flex items-center space-x-2">
                           <input 
                             type="checkbox" 
                             checked={newPet.special_needs}
                             onChange={(e) => setNewPet({...newPet, special_needs: e.target.checked})}
                             className="rounded"
                           />
                           <span className="text-sm">Tiene necesidades especiales</span>
                         </label>
                         {newPet.special_needs && (
                           <Textarea 
                             value={newPet.special_needs_description} 
                             onChange={(e) => setNewPet({...newPet, special_needs_description: e.target.value})}
                             placeholder="Describe las necesidades especiales..."
                             rows={3}
                           />
                         )}
                       </div>
                     </div>
                   </div>
                   
                   {/* Additional Details */}
                   <div className="space-y-4">
                     <h4 className="font-semibold text-gray-800 border-b pb-2">Detalles Adicionales</h4>
                     <div>
                       <Label htmlFor="pet-description">Descripción</Label>
                       <Textarea 
                         id="pet-description" 
                         value={newPet.description} 
                         onChange={(e) => setNewPet({...newPet, description: e.target.value})}
                         placeholder="Describe la mascota, personalidad, etc."
                         rows={4}
                       />
                     </div>
                     
                     <div>
                       <Label htmlFor="pet-location">Ubicación</Label>
                       <Input 
                         id="pet-location" 
                         value={newPet.location} 
                         onChange={(e) => setNewPet({...newPet, location: e.target.value})}
                         placeholder="Ciudad, estado"
                       />
                     </div>
                     
                     <div>
                       <Label htmlFor="pet-adoption-fee">Cuota de Adopción</Label>
                       <Input 
                         id="pet-adoption-fee" 
                         value={newPet.adoption_fee} 
                         onChange={(e) => setNewPet({...newPet, adoption_fee: e.target.value})}
                         placeholder="$0.00 o 'Gratis'"
                       />
                     </div>
                     
                     <div>
                       <Label>Foto de la Mascota</Label>
                       <div className="mt-2">
                         <input
                           type="file"
                           accept="image/*"
                           onChange={async (e) => {
                             const file = e.target.files?.[0];
                             if (!file) return;
                             
                             console.log('=== PET IMAGE UPLOAD START ===');
                             console.log('File:', file.name, file.size, file.type);
                             
                             setUploadingImage(true);
                             try {
                               // Upload to pet-images bucket
                               const fileName = `pet-${Date.now()}-${file.name}`;
                               const filePath = `${currentShelter?.id || 'test'}/${fileName}`;
                               
                               console.log('Uploading to:', filePath);
                               
                               const { data, error } = await supabase.storage
                                 .from('pet-images')
                                 .upload(filePath, file);
                               
                               if (error) {
                                 console.error('Upload error:', error);
                                 toast({ 
                                   title: 'Error de carga', 
                                   description: `Error al subir la imagen: ${error.message}`, 
                                   variant: 'destructive' 
                                 });
                                 return;
                               }
                               
                               console.log('Upload success:', data);
                               
                               // Get public URL
                               const { data: { publicUrl } } = supabase.storage
                                 .from('pet-images')
                                 .getPublicUrl(filePath);
                               
                               console.log('Public URL:', publicUrl);
                               
                               // Update state
                               setNewPet(prev => ({ ...prev, image_url: publicUrl }));
                               
                               toast({ 
                                 title: 'Imagen subida exitosamente', 
                                 description: 'La imagen de la mascota se ha guardado correctamente' 
                               });
                               console.log('=== PET IMAGE UPLOAD SUCCESS ===');
                               
                             } catch (error) {
                               console.error('Error:', error);
                               toast({ 
                                 title: 'Error al subir imagen', 
                                 description: `No se pudo subir la imagen: ${error.message}`, 
                                 variant: 'destructive' 
                               });
                             } finally {
                               setUploadingImage(false);
                             }
                           }}
                           className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-purple-400"
                         />
                         {uploadingImage && (
                           <p className="text-sm text-purple-600 mt-2 text-center">Uploading image...</p>
                         )}
                         {newPet.image_url && (
                           <div className="mt-2">
                             <img src={newPet.image_url} alt="Pet preview" className="w-32 h-32 object-cover rounded-lg mx-auto" />
                             <p className="text-xs text-green-600 text-center mt-1">Image uploaded!</p>
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 </div>
                
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAddPetForm(false);
                      setEditingPet(null);
                      setNewPet({
                        name: '',
                        species: 'Dog',
                        breed: '',
                        age: '',
                        size: '',
                        gender: '',
                        color: '',
                        weight: '',
                        description: '',
                        good_with_kids: false,
                        good_with_dogs: false,
                        good_with_cats: false,
                        house_trained: false,
                        spayed_neutered: false,
                        special_needs: false,
                        special_needs_description: '',
                        medical_notes: '',
                        adoption_fee: '',
                        location: ''
                      });
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    onClick={editingPet ? handleUpdatePet : handleAddPet}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingPet ? 'Actualizar Mascota' : 'Agregar Mascota'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

         {/* Media Tab */}
         <TabsContent value="media" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Image className="w-5 h-5" />
                 Imágenes y Videos del Albergue
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-8">
               {/* Images Section */}
               <div>
                 <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                   <Image className="w-5 h-5" />
                   Imágenes ({shelterImages.length})
                 </h3>
                 
                 {shelterImages.length === 0 ? (
                   <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                     <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                     <h4 className="text-lg font-semibold text-gray-800 mb-2">No hay imágenes</h4>
                     <p className="text-gray-600 mb-4">Estas son las imágenes que verán los clientes en tu perfil.</p>
                     <div>
                       <input
                         type="file"
                         accept="image/*"
                         onChange={handleImageUpload}
                         className="hidden"
                         id="image-upload"
                         disabled={uploadingImage}
                       />
                       <Button 
                         className="bg-purple-600 hover:bg-purple-700"
                         onClick={() => document.getElementById('image-upload')?.click()}
                         disabled={uploadingImage}
                       >
                       <Upload className="w-4 h-4 mr-2" />
                         {uploadingImage ? 'Subiendo...' : 'Subir Imagen'}
                     </Button>
                     </div>
                   </div>
                 ) : (
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                     {shelterImages.map((image) => (
                       <div key={image.id} className="relative group">
                         <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                           <img 
                             src={image.image_url || '/placeholder.svg'} 
                             alt={`Imagen del albergue ${image.id}`}
                             className="w-full h-full object-cover"
                           />
                         </div>
                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <div className="flex gap-2">
                             <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => setPreviewImageUrl(image.image_url)}>
                               <Eye className="w-4 h-4" />
                             </Button>
                             <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={async () => {
                               const { error } = await supabase
                                 .from('shelter_images')
                                 .delete()
                                 .eq('id', image.id);
                               if (error) {
                                 toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
                               } else {
                                 toast({ title: 'Imagen eliminada', description: 'Se eliminó correctamente' });
                                 queryClient.invalidateQueries({ queryKey: ['shelter-images', user.id] });
                               }
                             }}>
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               {/* Videos Section */}
               <div>
                 <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                   <Video className="w-5 h-5" />
                   Videos ({shelterVideos.length})
                 </h3>
                 
                 {shelterVideos.length === 0 ? (
                   <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                     <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                     <h4 className="text-lg font-semibold text-gray-800 mb-2">No hay videos</h4>
                     <p className="text-gray-600 mb-4">Estos son los videos que verán los clientes en tu perfil.</p>
                     <div>
                       <input
                         type="file"
                         accept="video/*"
                         onChange={handleVideoUpload}
                         className="hidden"
                         id="video-upload-first"
                         disabled={uploadingVideo}
                       />
                       <button 
                         className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center gap-2 mx-auto"
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           const fileInput = document.getElementById('video-upload-first') as HTMLInputElement;
                           if (fileInput) {
                             fileInput.click();
                           }
                         }}
                         disabled={uploadingVideo}
                         type="button"
                         style={{ zIndex: 9999, position: 'relative' }}
                       >
                         <Upload className="w-4 h-4" />
                         {uploadingVideo ? 'Subiendo...' : 'Subir Video'}
                       </button>
                     </div>
                   </div>
                 ) : (
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                     {shelterVideos.map((video) => (
                       <div key={video.id} className="relative group">
                         <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                           <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                             <Play className="w-12 h-12 text-purple-600" />
                           </div>
                         </div>
                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <div className="flex gap-2">
                             <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => setPreviewVideoUrl(video.youtube_url)}>
                               <Play className="w-4 h-4" />
                             </Button>
                             <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={async () => {
                               const { error } = await supabase
                                 .from('shelter_videos')
                                 .delete()
                                 .eq('id', video.id);
                               if (error) {
                                 toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
                               } else {
                                 toast({ title: 'Video eliminado', description: 'Se eliminó correctamente' });
                                 queryClient.invalidateQueries({ queryKey: ['shelter-videos', user.id] });
                               }
                             }}>
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           </div>
                         </div>
                         <div className="mt-2 text-sm text-gray-600 text-center">
                           {video.title || video.youtube_url?.split('/').pop() || 'Video'}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               {/* Upload Section */}
               <div className="border-t pt-6">
                 <h3 className="text-lg font-semibold mb-4">Subir Nuevo Contenido</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <Label>Subir Imagen</Label>
                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                       <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                       <p className="text-sm text-gray-600 mb-2">Arrastra una imagen aquí o haz clic para seleccionar</p>
                       <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 50MB</p>
                       <div>
                         <input
                           type="file"
                           accept="image/*"
                           onChange={handleImageUpload}
                           className="hidden"
                           id="image-upload"
                           disabled={uploadingImage}
                         />
                         <Button 
                           className="bg-purple-600 hover:bg-purple-700"
                           onClick={() => document.getElementById('image-upload')?.click()}
                           disabled={uploadingImage}
                         >
                       <Upload className="w-4 h-4 mr-2" />
                         {uploadingImage ? 'Subiendo...' : 'Subir Imagen'}
                     </Button>
                     </div>
                   </div>
                   </div>
                   
                   <div className="space-y-4">
                     <Label>Subir Video</Label>
                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                       <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                       <p className="text-sm text-gray-600 mb-2">Arrastra un video aquí o haz clic para seleccionar</p>
                       <p className="text-xs text-gray-500">MP4, MOV hasta 50MB</p>
                       <div>
                         <input
                           type="file"
                           accept="video/*"
                           onChange={handleVideoUpload}
                           className="hidden"
                           id="video-upload"
                           disabled={uploadingVideo}
                         />
                         <button 
                           className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center gap-2 mx-auto"
                           onClick={(e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             const fileInput = document.getElementById('video-upload') as HTMLInputElement;
                             if (fileInput) {
                               fileInput.click();
                             }
                           }}
                           disabled={uploadingVideo}
                           type="button"
                           style={{ zIndex: 9999, position: 'relative' }}
                         >
                           <Upload className="w-4 h-4" />
                           {uploadingVideo ? 'Subiendo...' : 'Seleccionar Video'}
                         </button>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>

      <Dialog open={!!previewImageUrl} onOpenChange={() => setPreviewImageUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Vista previa</DialogTitle>
          </DialogHeader>
          {previewImageUrl && (
            <img src={previewImageUrl} alt="Vista previa" className="w-full h-auto rounded" />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewVideoUrl} onOpenChange={() => setPreviewVideoUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vista previa de video</DialogTitle>
          </DialogHeader>
          {previewVideoUrl && (
            <video src={previewVideoUrl} controls className="w-full h-auto rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShelterDashboard;
