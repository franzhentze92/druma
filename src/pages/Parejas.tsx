import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Heart, 
  PawPrint, 
  MapPin, 
  Calendar,
  Filter,
  Search,
  Star,
  MessageCircle,
  User,
  Eye,
  X,
  Check,
  Clock,
  Users,
  Send,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import BreedingChatModal from '@/components/BreedingChatModal';
import PageHeader from '@/components/PageHeader';
import { useNavigation } from '@/contexts/NavigationContext';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  gender: string;
  color: string;
  image_url?: string;
  owner_id: string;
  available_for_breeding?: boolean;
  owner?: {
    id: string;
    full_name: string;
    phone: string;
  };
}

interface BreedingMatch {
  id: string;
  pet_id: string;
  potential_partner_id: string;
  owner_id: string;
  partner_owner_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'matched';
  created_at: string;
  updated_at: string;
  pet?: Pet;
  potential_partner?: Pet;
  partner_owner?: {
    id: string;
    full_name: string;
    phone: string;
  };
}

const Parejas: React.FC = () => {
  const { user } = useAuth();
  const { isMobileMenuOpen, toggleMobileMenu } = useNavigation();
  const [myPets, setMyPets] = useState<Pet[]>([]);
  const [availablePets, setAvailablePets] = useState<Pet[]>([]);
  const [myMatches, setMyMatches] = useState<BreedingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState<string>('all');
  const [filterBreed, setFilterBreed] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterAge, setFilterAge] = useState<string>('all');
  const [selectedPetDetails, setSelectedPetDetails] = useState<Pet | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isViewingFromRequest, setIsViewingFromRequest] = useState(false);
  const [receivedRequests, setReceivedRequests] = useState<BreedingMatch[]>([]);
  const [sentRequests, setSentRequests] = useState<BreedingMatch[]>([]);
  const [showPetSelectionModal, setShowPetSelectionModal] = useState(false);
  const [selectedPetForRequest, setSelectedPetForRequest] = useState<Pet | null>(null);
  const [targetPetForRequest, setTargetPetForRequest] = useState<Pet | null>(null);
  const [activeTab, setActiveTab] = useState('pet-tinder');
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedMatchForChat, setSelectedMatchForChat] = useState<BreedingMatch | null>(null);
  const [sentRequestsSearch, setSentRequestsSearch] = useState('all');
  const [sentRequestsFilter, setSentRequestsFilter] = useState<string>('all');
  const [receivedRequestsSearch, setReceivedRequestsSearch] = useState('all');
  const [receivedRequestsFilter, setReceivedRequestsFilter] = useState<string>('all');
  const [matchesSearch, setMatchesSearch] = useState('all');
  const [matchesFilter, setMatchesFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Subscribe to real-time updates for breeding_matches
  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime subscription for breeding_matches');
    
    // Create two subscriptions - one for owner_id and one for partner_owner_id
    // (Supabase Realtime doesn't support OR in filters)
    const channel1 = supabase
      .channel('breeding_matches_owner')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'breeding_matches',
          filter: `owner_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Breeding match changed (owner):', payload);
          loadData();
        }
      )
      .subscribe();

    const channel2 = supabase
      .channel('breeding_matches_partner')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'breeding_matches',
          filter: `partner_owner_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Breeding match changed (partner):', payload);
          loadData();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    };
  }, [user]);

  // Also poll for updates every 30 seconds as a fallback
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      console.log('Polling for breeding matches updates...');
      loadData();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId);
  }, [user]);

  // Refresh data when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('Page became visible, refreshing data...');
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load my pets
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user?.id);

      if (petsError) throw petsError;
      setMyPets(petsData || []);

      // Load available pets for breeding - SIMPLIFIED: Show all pets from other users marked for breeding
      try {
        console.log('Loading available pets for breeding...');
        console.log('Current user ID:', user?.id);
        
        if (!user?.id) {
          console.log('No user ID, cannot load available pets');
          setAvailablePets([]);
        } else {
          // First, let's check ALL pets to see what we have (this might be blocked by RLS)
          const { data: allPetsCheck, error: allPetsError } = await supabase
            .from('pets')
            .select('id, name, owner_id, available_for_breeding');
          
          console.log('=== DEBUG: All pets in database (may be filtered by RLS) ===');
          console.log('Total pets visible:', allPetsCheck?.length || 0);
          console.log('All pets data:', allPetsCheck);
          console.log('All pets error:', allPetsError);
          
          // Check pets with available_for_breeding = true (all users - may be filtered by RLS)
          const { data: allBreedingPets, error: allBreedingError } = await supabase
            .from('pets')
            .select('id, name, owner_id, available_for_breeding')
            .eq('available_for_breeding', true);
          
          console.log('=== DEBUG: Pets with available_for_breeding = true ===');
          console.log('Count:', allBreedingPets?.length || 0);
          console.log('Data:', allBreedingPets);
          console.log('Error:', allBreedingError);
          
          // Check pets from other users (regardless of breeding status) - This is the key test
          const { data: otherUsersPets, error: otherUsersError } = await supabase
            .from('pets')
            .select('id, name, owner_id, available_for_breeding')
            .neq('owner_id', user.id);
          
          console.log('=== DEBUG: Pets from other users (CRITICAL TEST) ===');
          console.log('Count:', otherUsersPets?.length || 0);
          console.log('Data:', otherUsersPets);
          console.log('Error:', otherUsersError);
          
          if (otherUsersError) {
            console.error('❌ ERROR: Cannot query pets from other users. This is likely an RLS (Row Level Security) issue.');
            console.error('RLS Error details:', otherUsersError);
          }
          
          if ((otherUsersPets?.length || 0) === 0 && !otherUsersError) {
            console.warn('⚠️ WARNING: Query succeeded but returned 0 pets from other users.');
            console.warn('This could mean:');
            console.warn('1. RLS is blocking access to other users pets');
            console.warn('2. There are truly no pets from other users in the database');
            console.warn('3. All pets in the database belong to the current user');
          }
          
          // Now the actual query: Get all pets where available_for_breeding is true AND owner_id is NOT the current user
          let availableData = null;
          let availableError = null;
          
          // Try the standard query first
          const result1 = await supabase
            .from('pets')
            .select('*')
            .eq('available_for_breeding', true)
            .neq('owner_id', user.id);
          
          availableData = result1.data;
          availableError = result1.error;
          
          // If no results and no error, it might be RLS blocking
          if ((availableData?.length || 0) === 0 && !availableError) {
            console.log('⚠️ No pets found. Possible RLS issue. Trying alternative query...');
            
            // Try querying all pets first, then filter in JavaScript
            const allPetsResult = await supabase
              .from('pets')
              .select('*');
            
            console.log('All pets query result:', allPetsResult.data);
            console.log('All pets query error:', allPetsResult.error);
            
            if (allPetsResult.data) {
              // Filter in JavaScript
              const filtered = allPetsResult.data.filter(pet => 
                pet.available_for_breeding === true && 
                pet.owner_id !== user.id
              );
              console.log('Filtered in JavaScript:', filtered);
              availableData = filtered;
            }
          }

          console.log('=== Query result - Available pets ===');
          console.log('Available pets:', availableData);
          console.log('Count:', availableData?.length || 0);
          console.log('Error:', availableError);

          if (availableError) {
            // Check if it's the column doesn't exist error
            if (availableError.code === '42703') {
              console.log('available_for_breeding column does not exist yet.');
              toast.error('La columna de disponibilidad para reproducción no existe.');
              setAvailablePets([]);
            } else {
              console.error('Error loading available pets:', availableError);
              toast.error(`Error al cargar mascotas: ${availableError.message}`);
              setAvailablePets([]);
            }
          } else {
            console.log('Successfully loaded available pets:', availableData);
            // Filter out any pets that might have owner_id matching current user (double check)
            const filteredData = (availableData || []).filter(pet => pet.owner_id !== user.id);
            console.log('After filtering own pets:', filteredData);
            console.log('Final count:', filteredData.length);
            setAvailablePets(filteredData);
          }
        }
      } catch (error: any) {
        console.error('Error loading available pets:', error);
        toast.error(`Error al cargar mascotas disponibles: ${error.message}`);
        setAvailablePets([]);
      }

      // Load my breeding matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('breeding_matches')
        .select(`
          *,
          pet:pets!breeding_matches_pet_id_fkey(*),
          potential_partner:pets!breeding_matches_potential_partner_id_fkey(*)
        `)
        .or(`owner_id.eq.${user?.id},partner_owner_id.eq.${user?.id}`);

      if (matchesError) {
        console.log('Matches error (table may not exist yet):', matchesError);
        setMyMatches([]);
        setReceivedRequests([]);
        setSentRequests([]);
      } else {
        const allMatches = matchesData || [];
        
        // Get user profiles for partner owners
        const partnerOwnerIds = [...new Set(allMatches.map(match => match.partner_owner_id))];
        let partnerProfiles = {};
        
        if (partnerOwnerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('user_profiles')
            .select('user_id, full_name, phone')
            .in('user_id', partnerOwnerIds);
          
          if (profilesData) {
            partnerProfiles = profilesData.reduce((acc, profile) => {
              acc[profile.user_id] = profile;
              return acc;
            }, {});
          }
        }
        
        // Add partner profiles to matches
        const enrichedMatches = allMatches.map(match => ({
          ...match,
          partner_owner: partnerProfiles[match.partner_owner_id]
        }));
        
        setMyMatches(enrichedMatches);
        
        // Separate received and sent requests
        const received = enrichedMatches.filter(match => match.partner_owner_id === user?.id);
        const sent = enrichedMatches.filter(match => match.owner_id === user?.id);
        
        setReceivedRequests(received);
        setSentRequests(sent);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (petId: string) => {
    if (!user) {
      toast.error('Debes estar autenticado para enviar solicitudes');
      return;
    }

    const potentialPartner = availablePets.find(p => p.id === petId);
    if (!potentialPartner) {
      toast.error('No se pudo encontrar la mascota');
      return;
    }

    // Check if user has pets available for breeding
    const myBreedingPets = myPets.filter(pet => pet.available_for_breeding);
    if (myBreedingPets.length === 0) {
      toast.error('No tienes mascotas marcadas como disponibles para reproducción');
      return;
    }

    // If only one pet available, use it directly
    if (myBreedingPets.length === 1) {
      await sendLoveRequest(myBreedingPets[0], potentialPartner);
    } else {
      // Show pet selection modal
      setTargetPetForRequest(potentialPartner);
      setShowPetSelectionModal(true);
    }
  };

  const sendLoveRequest = async (myPet: Pet, targetPet: Pet) => {
    try {
      console.log('Sending love request:', { myPet: myPet.name, targetPet: targetPet.name });
      
      const { data, error } = await supabase
        .from('breeding_matches')
        .insert({
          pet_id: myPet.id,
          potential_partner_id: targetPet.id,
          owner_id: user?.id,
          partner_owner_id: targetPet.owner_id,
          status: 'pending'
        })
        .select();

      console.log('Love request insert result:', { data, error });

      if (error) {
        console.error('Error inserting love request:', error);
        if (error.code === '42P01') {
          toast.error('La tabla de parejas no existe. Por favor, ejecuta el esquema de base de datos primero.');
        } else if (error.code === '23505') {
          // Duplicate key error - request already exists
          toast.info('💕 Ya has enviado una solicitud de amor a esta mascota', {
            description: 'Espera la respuesta del dueño.',
            duration: 4000,
          });
        } else {
          throw error;
        }
      } else {
        console.log('Love request sent successfully!');
        toast.success(`💕 Solicitud de amor enviada exitosamente!`, {
          description: `${myPet.name} ha enviado una solicitud de amor a ${targetPet.name}. Espera la respuesta del dueño.`,
          duration: 5000,
        });
        // Remove from available pets to avoid duplicate requests
        setAvailablePets(prev => prev.filter(p => p.id !== targetPet.id));
        // Reload data to update requests
        await loadData();
      }
    } catch (error: any) {
      console.error('Error sending love request:', error);
      toast.error('❌ Error al enviar la solicitud de amor', {
        description: error.message || 'No se pudo enviar la solicitud. Intenta nuevamente o verifica tu conexión.',
        duration: 4000,
      });
    }
  };

  const handleReject = (petId: string) => {
    setAvailablePets(prev => prev.filter(p => p.id !== petId));
    toast.info('Mascota rechazada');
  };

  const handleViewDetails = (pet: Pet) => {
    setSelectedPetDetails(pet);
    setIsViewingFromRequest(false);
    setShowDetailsModal(true);
  };

  const handleViewRequestDetails = (request: BreedingMatch) => {
    // Prepare the pet with owner information from the request
    if (request.potential_partner) {
      const petWithOwner: Pet = {
        ...request.potential_partner,
        owner: request.partner_owner ? {
          id: request.partner_owner.id,
          full_name: request.partner_owner.full_name,
          phone: request.partner_owner.phone
        } : request.potential_partner.owner
      };
      setSelectedPetDetails(petWithOwner);
      setIsViewingFromRequest(true);
      setShowDetailsModal(true);
    }
  };


  const handleAcceptMatch = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('breeding_matches')
        .update({ status: 'accepted' })
        .eq('id', matchId);

      if (error) throw error;

      toast.success('💕 Solicitud de amor aceptada!', {
        description: '¡Felicidades! La solicitud de amor ha sido aceptada. Puedes contactar al dueño para coordinar.',
        duration: 5000,
      });
      loadData();
    } catch (error) {
      console.error('Error accepting match:', error);
      toast.error('❌ Error al aceptar la solicitud', {
        description: 'No se pudo aceptar la solicitud. Intenta nuevamente.',
        duration: 4000,
      });
    }
  };

  const handleRejectMatch = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('breeding_matches')
        .update({ status: 'rejected' })
        .eq('id', matchId);

      if (error) throw error;

      toast.info('❌ Solicitud de amor rechazada', {
        description: 'La solicitud de amor ha sido rechazada. No te preocupes, hay muchas otras mascotas disponibles.',
        duration: 4000,
      });
      loadData();
    } catch (error) {
      console.error('Error rejecting match:', error);
      toast.error('Error al rechazar la solicitud');
    }
  };

  const handleOpenChat = (match: BreedingMatch) => {
    setSelectedMatchForChat(match);
    setShowChatModal(true);
  };

  // Show all available pets without filters for now (as requested)
  const filteredPets = availablePets.filter(pet => {
    // Always exclude user's own pets (double check)
    if (pet.owner_id === user?.id) {
      console.log('Filtering out own pet:', pet.name, pet.owner_id);
      return false;
    }
    
    // Apply filters only if they are not 'all'
    const matchesSearch = !searchTerm || 
                         pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pet.breed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = filterSpecies === 'all' || pet.species === filterSpecies;
    const matchesBreed = filterBreed === 'all' || pet.breed === filterBreed;
    const matchesGender = filterGender === 'all' || pet.gender === filterGender;
    const matchesAge = filterAge === 'all' || 
                      (filterAge === 'young' && pet.age <= 2) ||
                      (filterAge === 'adult' && pet.age > 2 && pet.age <= 6) ||
                      (filterAge === 'senior' && pet.age > 6);

    return matchesSearch && matchesSpecies && matchesBreed && matchesGender && matchesAge;
  });
  
  console.log('Filtered pets count:', filteredPets.length);
  console.log('Available pets count:', availablePets.length);

  const pendingMatches = myMatches.filter(match => match.status === 'pending');
  const acceptedMatches = myMatches.filter(match => match.status === 'accepted');
  const rejectedMatches = myMatches.filter(match => match.status === 'rejected');

  // Filter and sort sent requests
  const filteredAndSortedSentRequests = sentRequests
    .filter(request => {
      const matchesSearch = sentRequestsSearch === 'all' || 
        request.pet?.name === sentRequestsSearch ||
        request.potential_partner?.name === sentRequestsSearch;
      
      const matchesStatus = sentRequestsFilter === 'all' || request.status === sentRequestsFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Filter and sort received requests
  const filteredAndSortedReceivedRequests = receivedRequests
    .filter(request => {
      const matchesSearch = receivedRequestsSearch === 'all' || 
        request.pet?.name === receivedRequestsSearch ||
        request.potential_partner?.name === receivedRequestsSearch;
      
      const matchesStatus = receivedRequestsFilter === 'all' || request.status === receivedRequestsFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Filter and sort matches
  const filteredAndSortedMatches = myMatches
    .filter(match => {
      const matchesSearchFilter = matchesSearch === 'all' || 
        match.pet?.name === matchesSearch ||
        match.potential_partner?.name === matchesSearch;
      
      const matchesStatus = matchesFilter === 'all' || match.status === matchesFilter;
      
      return matchesSearchFilter && matchesStatus;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'accepted': return 'Aceptado';
      case 'rejected': return 'Rechazado';
      default: return 'Desconocido';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-40 md:pb-6">
      {/* Header */}
      <PageHeader 
        title="Parejas"
        subtitle="Encuentra la pareja perfecta para tu mascota"
        gradient="from-pink-500 to-purple-600"
        showHamburgerMenu={true}
        onToggleHamburger={toggleMobileMenu}
        isHamburgerOpen={isMobileMenuOpen}
      />


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'pet-tinder', label: 'Catálogo', icon: Heart, color: 'from-pink-500 to-rose-500' },
            { id: 'solicitudes-enviadas', label: 'Enviadas', icon: Send, color: 'from-blue-500 to-cyan-500' },
            { id: 'solicitudes-recibidas', label: 'Recibidas', icon: MessageCircle, color: 'from-green-500 to-emerald-500' },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg` 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'pet-tinder' && (
          <div className="space-y-6" style={{ paddingBottom: '100px' }}>
          {/* Filters */}
          <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Filter className="w-5 h-5 mr-2" />
                    Filtros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor="search">Buscar</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="search"
                          placeholder="Buscar mascotas..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="species">Especie</Label>
                      <Select value={filterSpecies} onValueChange={setFilterSpecies}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="Perro">Perro</SelectItem>
                          <SelectItem value="Gato">Gato</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="breed">Raza</Label>
                      <Select value={filterBreed} onValueChange={setFilterBreed}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {Array.from(new Set(availablePets.map(p => p.breed))).map(breed => (
                            <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="gender">Género</Label>
                      <Select value={filterGender} onValueChange={setFilterGender}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="macho">Macho</SelectItem>
                          <SelectItem value="hembra">Hembra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="age">Edad</Label>
                      <Select value={filterAge} onValueChange={setFilterAge}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="young">Joven (≤2 años)</SelectItem>
                          <SelectItem value="adult">Adulto (3-6 años)</SelectItem>
                            <SelectItem value="senior">Senior (&gt;6 años)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pet Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredPets.map((pet) => (
                  <Card key={pet.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-[4/3] bg-gray-200 relative">
                      {pet.image_url ? (
                        <img
                          src={pet.image_url}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PawPrint className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-white text-gray-800 text-xs px-2 py-1 shadow-sm">
                          {pet.age} años
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{pet.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {pet.gender === 'macho' ? 'Macho' : 'Hembra'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-gray-600 text-sm font-medium">{pet.breed}</p>
                        <p className="text-gray-500 text-sm">{pet.color}</p>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>Ubicación disponible</span>
                      </div>
                      
                      <div className="flex flex-col space-y-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleViewDetails(pet)}
                          className="w-full text-sm py-2"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleLike(pet.id)}
                          className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white text-sm py-2"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          Solicitar Amor
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredPets.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {availablePets.length === 0 
                        ? 'No hay mascotas disponibles para reproducción' 
                        : 'No se encontraron mascotas compatibles con los filtros aplicados'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {availablePets.length === 0
                        ? 'Actualmente no hay mascotas de otros usuarios marcadas como disponibles para reproducción en la base de datos. Solo se muestran mascotas de otros usuarios, no las tuyas.'
                        : 'Intenta ajustar los filtros de búsqueda para ver más resultados.'}
                    </p>
                    {availablePets.length === 0 && (
                      <div className="text-sm text-gray-500 space-y-2">
                        <p>💡 <strong>Nota:</strong> Esta sección solo muestra mascotas de otros usuarios.</p>
                        <p>Para ver mascotas aquí, otros usuarios deben:</p>
                        <ul className="list-disc list-inside text-left max-w-md mx-auto mt-2 space-y-1">
                          <li>Crear una cuenta en PetHub</li>
                          <li>Registrar sus mascotas</li>
                          <li>Marcarlas como disponibles para reproducción</li>
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
          </div>
        )}

        {/* Solicitudes Recibidas Tab */}
        {activeTab === 'solicitudes-recibidas' && (
          <div className="space-y-6" style={{ paddingBottom: '100px' }}>
          {/* Refresh Button */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                toast.info('Actualizando solicitudes...');
                loadData();
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Solicitudes</p>
                    <p className="text-2xl font-bold text-gray-900">{receivedRequests.length}</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {receivedRequests.filter(r => r.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Aceptadas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {receivedRequests.filter(r => r.status === 'accepted').length}
                    </p>
                  </div>
                  <Check className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Buscar y Filtrar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="received-pet-filter">Filtrar por mascota</Label>
                  <Select value={receivedRequestsSearch} onValueChange={setReceivedRequestsSearch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar mascota..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las mascotas</SelectItem>
                      {Array.from(new Set([
                        ...receivedRequests.map(r => r.pet?.name).filter(Boolean),
                        ...receivedRequests.map(r => r.potential_partner?.name).filter(Boolean)
                      ])).map(petName => (
                        <SelectItem key={petName} value={petName}>{petName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="received-status-filter">Filtrar por estado</Label>
                  <Select value={receivedRequestsFilter} onValueChange={setReceivedRequestsFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="pending">Pendientes</SelectItem>
                      <SelectItem value="accepted">Aceptadas</SelectItem>
                      <SelectItem value="rejected">Rechazadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requests List */}
          <div className="space-y-4">
            {receivedRequests.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes recibidas</h3>
                  <p className="text-gray-600">
                    Las solicitudes de amor que otros usuarios envíen para tus mascotas aparecerán aquí.
                  </p>
                </CardContent>
              </Card>
            ) : filteredAndSortedReceivedRequests.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
                  <p className="text-gray-600">
                    No hay solicitudes que coincidan con los filtros aplicados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAndSortedReceivedRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Pet Image - Show the pet that sent the request (other user's pet) */}
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {request.pet?.image_url ? (
                          <img
                            src={request.pet.image_url}
                            alt={request.pet.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PawPrint className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Request Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Solicitud para {request.potential_partner?.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              De {request.pet?.name} ({request.pet?.breed})
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Enviado el {new Date(request.created_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          
                          <Badge className={getStatusColor(request.status)}>
                            {request.status === 'pending' && 'Pendiente'}
                            {request.status === 'accepted' && 'Aceptada'}
                            {request.status === 'rejected' && 'Rechazada'}
                          </Badge>
                        </div>

                        {/* Owner Info */}
                        {request.partner_owner && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">
                              Dueño: {request.partner_owner.full_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Teléfono: {request.partner_owner.phone}
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {request.status === 'pending' && (
                          <div className="flex flex-col sm:flex-row gap-3 mt-4">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewRequestDetails(request)}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalles
                            </Button>
                            <div className="flex space-x-3">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleAcceptMatch(request.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Aceptar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectMatch(request.id)}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        )}

                        {request.status === 'accepted' && (
                          <div className="mt-4">
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleOpenChat(request)}
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Contactar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          </div>
        )}

        {/* Solicitudes Enviadas Tab */}
        {activeTab === 'solicitudes-enviadas' && (
          <div className="space-y-6" style={{ paddingBottom: '100px' }}>
          {/* Refresh Button */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                toast.info('Actualizando solicitudes...');
                loadData();
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Enviadas</p>
                    <p className="text-2xl font-bold text-gray-900">{sentRequests.length}</p>
                  </div>
                  <Send className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {sentRequests.filter(r => r.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Aceptadas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {sentRequests.filter(r => r.status === 'accepted').length}
                    </p>
                  </div>
                  <Check className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Buscar y Filtrar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sent-pet-filter">Filtrar por mascota</Label>
                  <Select value={sentRequestsSearch} onValueChange={setSentRequestsSearch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar mascota..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las mascotas</SelectItem>
                      {Array.from(new Set([
                        ...sentRequests.map(r => r.pet?.name).filter(Boolean),
                        ...sentRequests.map(r => r.potential_partner?.name).filter(Boolean)
                      ])).map(petName => (
                        <SelectItem key={petName} value={petName}>{petName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="sent-status-filter">Filtrar por estado</Label>
                  <Select value={sentRequestsFilter} onValueChange={setSentRequestsFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="pending">Pendientes</SelectItem>
                      <SelectItem value="accepted">Aceptadas</SelectItem>
                      <SelectItem value="rejected">Rechazadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requests List */}
          <div className="space-y-4">
            {sentRequests.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No has enviado solicitudes</h3>
                  <p className="text-gray-600">
                    Las solicitudes de amor que envíes a otros usuarios aparecerán aquí.
                  </p>
                </CardContent>
              </Card>
            ) : filteredAndSortedSentRequests.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
                  <p className="text-gray-600">
                    No hay solicitudes que coincidan con los filtros aplicados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAndSortedSentRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Target Pet Image (the pet we sent the request to) */}
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {request.potential_partner?.image_url ? (
                          <img
                            src={request.potential_partner.image_url}
                            alt={request.potential_partner.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PawPrint className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Request Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Solicitud de {request.pet?.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Para {request.potential_partner?.name} ({request.potential_partner?.breed})
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Enviado el {new Date(request.created_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          
                          <Badge className={getStatusColor(request.status)}>
                            {request.status === 'pending' && 'Pendiente'}
                            {request.status === 'accepted' && 'Aceptada'}
                            {request.status === 'rejected' && 'Rechazada'}
                          </Badge>
                        </div>

                        {/* Partner Owner Info */}
                        {request.partner_owner && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">
                              Dueño: {request.partner_owner.full_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Teléfono: {request.partner_owner.phone}
                            </p>
                          </div>
                        )}

                        {/* Status Message */}
                        {request.status === 'pending' && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              <Clock className="w-4 h-4 inline mr-1" />
                              Esperando respuesta del dueño...
                            </p>
                          </div>
                        )}

                        {request.status === 'accepted' && (
                          <>
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-sm text-green-800">
                                <Check className="w-4 h-4 inline mr-1" />
                                ¡Tu solicitud fue aceptada! Puedes contactar al dueño.
                              </p>
                            </div>
                            <div className="mt-4">
                              <Button 
                                type="button" 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleOpenChat(request)}
                              >
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Contactar
                              </Button>
                            </div>
                          </>
                        )}

                        {request.status === 'rejected' && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">
                              <X className="w-4 h-4 inline mr-1" />
                              Tu solicitud fue rechazada.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          </div>
        )}

      </div>

      {/* Pet Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Heart className="w-5 h-5 mr-2 text-pink-500" />
              Detalles de {selectedPetDetails?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPetDetails && (
            <div className="space-y-6">
              {/* Pet Image */}
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-gray-200 rounded-lg overflow-hidden">
                  {selectedPetDetails.image_url ? (
                    <img
                      src={selectedPetDetails.image_url}
                      alt={selectedPetDetails.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PawPrint className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Pet Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nombre</Label>
                    <p className="text-lg font-semibold">{selectedPetDetails.name}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Especie</Label>
                    <p className="text-sm">{selectedPetDetails.species}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Raza</Label>
                    <p className="text-sm">{selectedPetDetails.breed}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Género</Label>
                    <Badge variant="outline">
                      {selectedPetDetails.gender === 'macho' ? 'Macho' : 'Hembra'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Edad</Label>
                    <p className="text-sm">{selectedPetDetails.age} años</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Peso</Label>
                    <p className="text-sm">{selectedPetDetails.weight} kg</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Color</Label>
                    <p className="text-sm">{selectedPetDetails.color}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Disponible para reproducción</Label>
                    <Badge className={selectedPetDetails.available_for_breeding ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {selectedPetDetails.available_for_breeding ? 'Sí' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Owner Information */}
              {selectedPetDetails.owner && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Información del Dueño</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Nombre</Label>
                      <p className="text-sm">{selectedPetDetails.owner.full_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Teléfono</Label>
                      <p className="text-sm">{selectedPetDetails.owner.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                {!isViewingFromRequest && (
                  <Button
                    type="button"
                    onClick={() => handleLike(selectedPetDetails.id)}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Solicitar Amor
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setIsViewingFromRequest(false);
                  }}
                  className={isViewingFromRequest ? "flex-1" : "flex-1"}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pet Selection Modal */}
      <Dialog open={showPetSelectionModal} onOpenChange={setShowPetSelectionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Heart className="w-5 h-5 mr-2 text-pink-500" />
              Seleccionar tu mascota
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Selecciona cuál de tus mascotas enviará la solicitud de amor a {targetPetForRequest?.name}:
            </p>
            
            <div className="space-y-3">
              {myPets.filter(pet => pet.available_for_breeding).map((pet) => (
                <div
                  key={pet.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPetForRequest?.id === pet.id
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPetForRequest(pet)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {pet.image_url ? (
                        <img
                          src={pet.image_url}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PawPrint className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{pet.name}</h4>
                      <p className="text-sm text-gray-600">{pet.breed} • {pet.age} años</p>
                    </div>
                    {selectedPetForRequest?.id === pet.id && (
                      <Check className="w-5 h-5 text-pink-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                onClick={async () => {
                  if (selectedPetForRequest && targetPetForRequest) {
                    await sendLoveRequest(selectedPetForRequest, targetPetForRequest);
                    setShowPetSelectionModal(false);
                    setSelectedPetForRequest(null);
                    setTargetPetForRequest(null);
                  }
                }}
                disabled={!selectedPetForRequest}
                className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
              >
                <Heart className="w-4 h-4 mr-2" />
                Enviar Solicitud
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPetSelectionModal(false);
                  setSelectedPetForRequest(null);
                  setTargetPetForRequest(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Breeding Chat Modal */}
      <BreedingChatModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false);
          setSelectedMatchForChat(null);
        }}
        breedingMatch={selectedMatchForChat}
      />
    </div>
  );
};

export default Parejas;
