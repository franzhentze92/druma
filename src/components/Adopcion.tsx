import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Calendar, Users, ChevronLeft, ChevronRight, X, Filter, Star, PawPrint, Building2, Search, Phone, Plus, AlertTriangle, CheckCircle, Eye, MessageCircle, Send, Loader2 } from 'lucide-react';
import PageHeader from './PageHeader';
import AdoptionFilters from './AdoptionFilters';
import { useAdoptionPets, useMyFavorites, useToggleFavorite, useApplyToPet, useMyApplications, useHasAppliedToPet, type AdoptionFilters as AdoptionFiltersType } from '@/hooks/useAdoption';
import { useAuth } from '@/contexts/AuthContext';
import AdoptionPetDetails from './AdoptionPetDetails';
import ShelterDashboard from './ShelterDashboard';
import Shelters from './Shelters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';


const Adopcion: React.FC = () => {
  const [activeTab, setActiveTab] = useState('catalogo');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AdoptionFiltersType>({});
  const [detailsPet, setDetailsPet] = useState<any | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [chatRoom, setChatRoom] = useState<any | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSubscriptionRef = useRef<any>(null);
  const navigate = useNavigate();

  const { user } = useAuth()
  const { data: pets = [], isLoading: petsLoading } = useAdoptionPets(filters)
  const { data: favoriteIds = [] } = useMyFavorites(user?.id)
  const { data: myApplications = [], isLoading: applicationsLoading } = useMyApplications(user?.id)
  const toggleFavorite = useToggleFavorite()
  const applyToPet = useApplyToPet()
  
  // Add state for application feedback
  const [applicationFeedback, setApplicationFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  
  // Check if user has already applied to the currently viewed pet
  const { data: hasApplied = false } = useHasAppliedToPet(detailsPet?.id, user?.id)

  const isFavorite = useMemo(() => new Set(favoriteIds), [favoriteIds])
  
  // Create a set of pet IDs that the user has already applied to
  const appliedPetIds = useMemo(() => {
    return new Set(myApplications.map((app: any) => app.pet_id || app.adoption_pets?.id))
  }, [myApplications])

  // Load or create chat room for adoption application
  useEffect(() => {
    if (showChatModal && selectedApplication) {
      loadOrCreateChatRoom();
    } else {
      // Cleanup when modal closes
      if (chatSubscriptionRef.current) {
        chatSubscriptionRef.current.unsubscribe();
        chatSubscriptionRef.current = null;
      }
      setChatRoom(null);
      setChatMessages([]);
      setNewMessage('');
    }
  }, [showChatModal, selectedApplication]);

  // Load messages when chat room is available
  useEffect(() => {
    if (chatRoom) {
      loadMessages();
      subscribeToMessages();
    }
    
    return () => {
      if (chatSubscriptionRef.current) {
        chatSubscriptionRef.current.unsubscribe();
        chatSubscriptionRef.current = null;
      }
    };
  }, [chatRoom]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadOrCreateChatRoom = async () => {
    if (!selectedApplication || !user) return;

    try {
      setLoadingChat(true);

      // Get pet owner information
      const { data: petData, error: petError } = await supabase
        .from('adoption_pets')
        .select('shelter_id, owner_id')
        .eq('id', selectedApplication.pet_id)
        .maybeSingle();

      if (petError && petError.code !== 'PGRST116') {
        console.error('Error fetching pet data:', petError);
      }

      const shelterOwnerId = petData?.owner_id;
      const applicantId = selectedApplication.applicant_id;

      // Ensure we have both parties
      if (!shelterOwnerId || !applicantId) {
        toast.error('No se pudo identificar a los participantes del chat');
        return;
      }

      // First, try to find existing chat room
      const { data: existingRoom, error: fetchError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('adoption_application_id', selectedApplication.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching chat room:', fetchError);
      }

      if (existingRoom) {
        setChatRoom(existingRoom);
        return;
      }

      // If no existing room, create a new one
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({
          adoption_application_id: selectedApplication.id,
          owner1_id: applicantId,
          owner2_id: shelterOwnerId
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating chat room:', createError);
        toast.error('Error al crear el chat. Asegúrate de que la tabla chat_rooms tenga el campo adoption_application_id.');
        return;
      }

      setChatRoom(newRoom);

      // Send initial welcome message from shelter if application is approved
      if (selectedApplication.status === 'approved' && user.id === shelterOwnerId) {
        await supabase
          .from('chat_messages')
          .insert({
            chat_room_id: newRoom.id,
            sender_id: user.id,
            message: `¡Hola! Gracias por tu interés en adoptar a ${selectedApplication.adoption_pets?.name || 'nuestra mascota'}. ¿Te gustaría programar una cita para conocerla?`,
            message_type: 'system'
          });
      } else if (selectedApplication.status === 'approved' && user.id === applicantId) {
        // Also allow applicant to send first message
        await supabase
          .from('chat_messages')
          .insert({
            chat_room_id: newRoom.id,
            sender_id: user.id,
            message: `¡Hola! Me interesa adoptar a ${selectedApplication.adoption_pets?.name || 'su mascota'}. ¿Podemos coordinar una cita?`,
            message_type: 'text'
          });
      }

    } catch (error) {
      console.error('Error loading/creating chat room:', error);
      toast.error('Error al cargar el chat');
    } finally {
      setLoadingChat(false);
    }
  };

  const loadMessages = async () => {
    if (!chatRoom) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_room_id', chatRoom.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setChatMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!chatRoom) return;

    // Unsubscribe from previous subscription if it exists
    if (chatSubscriptionRef.current) {
      chatSubscriptionRef.current.unsubscribe();
    }

    const subscription = supabase
      .channel(`adoption_chat_${chatRoom.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_room_id=eq.${chatRoom.id}`
      }, (payload) => {
        setChatMessages(prev => {
          // Check if message already exists to avoid duplicates
          const messageExists = prev.some(msg => msg.id === payload.new.id);
          if (messageExists) {
            return prev;
          }
          return [...prev, payload.new as any];
        });
        // Scroll to bottom when new message arrives
        setTimeout(() => scrollToBottom(), 100);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to chat messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to chat messages');
        }
      });

    chatSubscriptionRef.current = subscription;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatRoom || !user || sending) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Create optimistic message
    const optimisticMessage = {
      id: tempId,
      chat_room_id: chatRoom.id,
      sender_id: user.id,
      message: messageText,
      message_type: 'text',
      created_at: new Date().toISOString(),
      read_at: null
    };

    // Add message optimistically to UI
    setChatMessages(prev => [...prev, optimisticMessage as any]);
    setNewMessage('');
    scrollToBottom();

    try {
      setSending(true);

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_room_id: chatRoom.id,
          sender_id: user.id,
          message: messageText,
          message_type: 'text'
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Error al enviar el mensaje');
        // Remove optimistic message on error
        setChatMessages(prev => prev.filter(msg => msg.id !== tempId));
        setNewMessage(messageText); // Restore message text
        return;
      }

      // Replace optimistic message with real one
      if (data) {
        setChatMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== tempId);
          // Check if message already exists (from subscription)
          const exists = filtered.some(msg => msg.id === data.id);
          if (exists) {
            return filtered;
          }
          return [...filtered, data];
        });
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
      // Remove optimistic message on error
      setChatMessages(prev => prev.filter(msg => msg.id !== tempId));
      setNewMessage(messageText); // Restore message text
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const handleShelterClick = (shelterId: string) => {
    navigate(`/shelter/${shelterId}`);
  };

  const handleAdoptionApplication = async (petId: string) => {
    if (!user?.id) {
      const errorMessage = 'Debes iniciar sesión para solicitar una adopción';
      setApplicationFeedback({ 
        type: 'error', 
        message: errorMessage
      });
      
      toast.error(errorMessage);
      
      setTimeout(() => {
        setApplicationFeedback(null);
      }, 5000);
      return;
    }

    // Check if user has already applied to this pet
    const { data: existingApp } = await supabase
      .from('adoption_applications')
      .select('id')
      .eq('pet_id', petId)
      .eq('applicant_id', user.id)
      .maybeSingle()

    if (existingApp) {
      const errorMessage = 'Ya has enviado una solicitud de adopción para esta mascota';
      setApplicationFeedback({ 
        type: 'error', 
        message: errorMessage
      });
      
      toast.error(errorMessage);
      
      setTimeout(() => {
        setApplicationFeedback(null);
      }, 5000);
      return;
    }

    try {
      await applyToPet.mutateAsync({
        pet_id: petId,
        applicant_id: user.id,
        status: 'pending',
        message: 'Solicitud de adopción enviada'
      });

      const successMessage = '¡Solicitud de adopción enviada exitosamente! Te contactaremos pronto.';
      setApplicationFeedback({ 
        type: 'success', 
        message: successMessage
      });
      
      toast.success(successMessage);
      
      setTimeout(() => {
        setApplicationFeedback(null);
      }, 5000);
    } catch (error: any) {
      console.error('Error submitting adoption application:', error);
      const errorMessage = error?.message?.includes('Ya has enviado') 
        ? error.message 
        : `Error al enviar la solicitud: ${error?.message || 'Por favor intenta de nuevo.'}`;
      setApplicationFeedback({ 
        type: 'error', 
        message: errorMessage
      });
      
      toast.error(errorMessage);
      
      setTimeout(() => {
        setApplicationFeedback(null);
      }, 5000);
    }
  };

  const tabs = [
    { id: 'catalogo', label: 'Catálogo', icon: Heart, color: 'from-red-500 to-pink-500' },
    { id: 'albergues', label: 'Albergues', icon: Users, color: 'from-blue-500 to-cyan-500' },
    { id: 'mis-favoritos', label: 'Mis Favoritos', icon: Star, color: 'from-yellow-500 to-orange-500' },
    { id: 'mis-solicitudes', label: 'Mis Solicitudes', icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
  ];


  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header - Mobile Optimized */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-3">
          <PageHeader 
            title="Adopción"
            subtitle="Encuentra tu compañero perfecto"
            gradient="from-purple-600 to-pink-600"
          >
            <Heart className="w-6 h-6 sm:w-8 sm:h-8" />
          </PageHeader>
        </div>

        {/* Tabs - Wrap to multiple lines */}
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg` 
                      : 'text-gray-600 bg-gray-100 active:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm sm:text-base">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">

        {/* Application Feedback */}
        {applicationFeedback && (
          <div className={`mb-4 p-4 rounded-lg ${
            applicationFeedback.type === 'success' 
              ? 'bg-green-100 border border-green-300 text-green-800' 
              : 'bg-red-100 border border-red-300 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {applicationFeedback.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <span className="font-medium">{applicationFeedback.message}</span>
              </div>
            </div>
          )}

        {/* Tab Content */}
        {activeTab === 'catalogo' && (
          <div className="space-y-4">
            {/* Filters - Mobile Optimized */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 flex-1 sm:flex-initial"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm sm:text-base">Filtros</span>
                {showFilters && <span className="ml-1 text-xs">●</span>}
              </Button>
              <div className="text-sm text-gray-600 whitespace-nowrap">
                {pets.length} disponible{pets.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            {/* Filters Panel - Full width on mobile */}
            {showFilters && (
              <div className="mb-4">
                <AdoptionFilters onFiltersChange={setFilters} />
              </div>
            )}

            {/* Pets List - Mobile First Design */}
            {petsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="h-64 bg-gray-200 animate-pulse" />
                    <CardContent className="p-4">
                      <div className="h-5 bg-gray-200 rounded animate-pulse mb-2 w-3/4" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pets.length === 0 ? (
              <div className="text-center py-16">
                <PawPrint className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay mascotas disponibles</h3>
                <p className="text-gray-500 text-sm">Intenta ajustar los filtros de búsqueda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pets.map((pet) => (
                  <Card 
                    key={pet.id} 
                    className="overflow-hidden shadow-md active:shadow-lg transition-all"
                    onClick={() => setDetailsPet(pet)}
                  >
                    <div className="relative">
                      <img 
                        src={pet.image_url || 'https://placehold.co/400x300?text=Mascota'} 
                        alt={pet.name} 
                        className="w-full h-64 sm:h-72 object-cover" 
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user?.id) return;
                          toggleFavorite.mutate({ petId: pet.id, userId: user.id, isFavorite: isFavorite.has(pet.id) });
                        }}
                        className="absolute top-3 right-3 p-2.5 bg-white/95 rounded-full shadow-md active:scale-95 transition-transform"
                      >
                        <Star className={`w-5 h-5 ${isFavorite.has(pet.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                      </button>
                    </div>
                    <CardContent className="p-5">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 mb-1">{pet.name}</h3>
                          <p className="text-base text-gray-600">{pet.breed || 'Mestizo'} • {pet.age || 'N/A'} {pet.age === 1 ? 'año' : 'años'}</p>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{pet.location || 'Ubicación no especificada'}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button 
                            className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:scale-95 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailsPet(pet);
                            }}
                          >
                            Ver Detalles
                          </Button>
                          <Button 
                            className={`flex-1 h-12 text-base font-semibold active:scale-95 transition-transform ${
                              appliedPetIds.has(pet.id)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdoptionApplication(pet.id);
                            }}
                            disabled={appliedPetIds.has(pet.id)}
                          >
                            {appliedPetIds.has(pet.id) ? '✓ Enviada' : 'Solicitar'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}


      {activeTab === 'albergues' && <Shelters />}


        {activeTab === 'mis-favoritos' && (
          <div className="space-y-6" style={{ paddingBottom: '100px' }}>
            {/* Header */}
                    <div>
              <h3 className="text-xl font-bold text-gray-800">Mis Favoritos</h3>
              <p className="text-gray-600">Mascotas que has marcado como favoritas</p>
                  </div>

            {/* Favorites Grid */}
            {petsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="h-48 bg-gray-200 animate-pulse" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                    </CardContent>
                  </Card>
                ))}
                    </div>
            ) : pets.filter(pet => isFavorite.has(pet.id)).length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No tienes favoritos</h3>
                <p className="text-gray-500">Marca mascotas como favoritas para verlas aquí</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pets.filter(pet => isFavorite.has(pet.id)).map((pet) => (
                  <Card key={pet.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="relative">
                    <img 
                        src={pet.image_url || 'https://placehold.co/400x300?text=Mascota'} 
                      alt={pet.name} 
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user?.id) return;
                          toggleFavorite.mutate({ petId: pet.id, userId: user.id, isFavorite: true });
                        }}
                        className="absolute top-2 left-2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                      >
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </button>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{pet.name}</h3>
                        <p className="text-sm text-gray-600">{pet.breed} • {pet.age} años</p>
                      </div>
                      
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{pet.location}</span>
                        </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Disponible desde {new Date(pet.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <Button 
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            onClick={() => setDetailsPet(pet)}
                          >
                            Ver Detalles
                          </Button>
                          <Button 
                            className={`flex-1 ${
                              appliedPetIds.has(pet.id)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                            }`}
                            onClick={() => handleAdoptionApplication(pet.id)}
                            disabled={appliedPetIds.has(pet.id)}
                          >
                            {appliedPetIds.has(pet.id) ? 'Solicitud enviada' : 'Solicitar Adopción'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
                        </div>
                      )}
                    </div>
        )}

        {activeTab === 'mis-solicitudes' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-1">Mis Solicitudes</h3>
              <p className="text-sm text-gray-600">Estado de tus solicitudes de adopción</p>
            </div>

            {/* Applications List - Mobile Optimized */}
            {applicationsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="animate-pulse">
                      <div className="h-5 bg-gray-200 rounded mb-2 w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : myApplications.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No tienes solicitudes</h3>
                <p className="text-gray-500 text-sm">Solicita la adopción de una mascota para ver el estado aquí</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myApplications.map((application: any) => (
                  <Card key={application.id} className="overflow-hidden shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {application.adoption_pets?.image_url ? (
                          <img 
                            src={application.adoption_pets.image_url} 
                            alt={application.adoption_pets.name || 'Mascota'} 
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0" 
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-500 text-3xl">🐾</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-800 truncate">
                              {application.adoption_pets?.name || 'Mascota'}
                            </h3>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                              application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              application.status === 'approved' ? 'bg-green-100 text-green-800' :
                              application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {application.status === 'pending' ? '⏳' :
                               application.status === 'approved' ? '✅' :
                               application.status === 'rejected' ? '❌' :
                               '🚫'}
                            </span>
                          </div>
                          
                          {/* Pet Details */}
                          <div className="space-y-1 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{application.adoption_pets?.species || 'Mascota'}</span>
                              {application.adoption_pets?.breed && <span>• {application.adoption_pets.breed}</span>}
                              {application.adoption_pets?.age && <span>• {application.adoption_pets.age} años</span>}
                            </div>
                            
                            <p className="text-xs text-gray-500">
                              {new Date(application.created_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="flex-1 h-10 text-sm"
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowChatModal(true);
                              }}
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Chat
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Global Pet Details Modal - Available from all tabs */}
        <AdoptionPetDetails 
          open={!!detailsPet} 
          onClose={() => {
            setDetailsPet(null)
            setApplicationFeedback(null) // Clear feedback when closing modal
          }} 
          pet={detailsPet}
          isFavorite={detailsPet ? isFavorite.has(detailsPet.id) : false}
          onToggleFavorite={() => {
            if (!user?.id || !detailsPet?.id) return
            toggleFavorite.mutate({ petId: detailsPet.id, userId: user.id, isFavorite: isFavorite.has(detailsPet.id) })
          }}
          onApply={() => handleAdoptionApplication(detailsPet?.id || '')}
          applicationFeedback={applicationFeedback}
          hasApplied={hasApplied}
        />

        {/* Adoption Chat Modal */}
        <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                {selectedApplication && user?.id === selectedApplication.applicant_id 
                  ? 'Chat con el Albergue' 
                  : 'Chat con el Cliente'}
              </DialogTitle>
            </DialogHeader>
            
            {selectedApplication && (
              <div className="flex-1 flex flex-col">
                {/* Application Info */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    {selectedApplication.adoption_pets?.image_url ? (
                      <img 
                        src={selectedApplication.adoption_pets.image_url} 
                        alt={selectedApplication.adoption_pets.name || 'Mascota'} 
                        className="w-12 h-12 object-cover rounded-lg" 
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 text-xl">🐾</span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {selectedApplication.adoption_pets?.name || 'Mascota'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Solicitud de adopción • {new Date(selectedApplication.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto min-h-[300px] max-h-[400px]">
                  {loadingChat ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                      <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-sm">No hay mensajes aún</p>
                      <p className="text-xs mt-1">Comienza la conversación</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((message) => {
                        const isOwnMessage = message.sender_id === user?.id;
                        const isSystemMessage = message.message_type === 'system';
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`rounded-lg p-3 max-w-[70%] shadow-sm ${
                                isSystemMessage
                                  ? 'bg-yellow-50 border border-yellow-200 mx-auto'
                                  : isOwnMessage
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white text-gray-700'
                              }`}
                            >
                              <p className={`text-sm ${isOwnMessage ? 'text-white' : 'text-gray-700'}`}>
                                {message.message}
                              </p>
                              <p className={`text-xs mt-1 ${
                                isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {isSystemMessage 
                                  ? 'Sistema' 
                                  : isOwnMessage 
                                  ? 'Tú' 
                                  : selectedApplication.applicant_id === message.sender_id 
                                  ? 'Cliente' 
                                  : 'Albergue'} • {formatTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input 
                    placeholder="Escribe tu mensaje..." 
                    className="flex-1"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={sending || loadingChat || !chatRoom}
                  />
                  <Button 
                    type="button" 
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={sendMessage}
                    disabled={sending || loadingChat || !chatRoom || !newMessage.trim()}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Adopcion;
