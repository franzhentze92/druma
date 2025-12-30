import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Calendar, Users, ChevronLeft, ChevronRight, X, Filter, Star, PawPrint, Building2, Search, Phone, Plus, AlertTriangle, CheckCircle, Eye, MessageCircle } from 'lucide-react';
import PageHeader from './PageHeader';
import AdoptionFilters from './AdoptionFilters';
import { useAdoptionPets, useMyFavorites, useToggleFavorite, useApplyToPet, useMyApplications } from '@/hooks/useAdoption';
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


const Adopcion: React.FC = () => {
  const [activeTab, setActiveTab] = useState('catalogo');
  const [currentDog, setCurrentDog] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{ species?: string; size?: string }>({});
  const [detailsPet, setDetailsPet] = useState<any | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const navigate = useNavigate();

  const { user } = useAuth()
  const { data: pets = [], isLoading: petsLoading } = useAdoptionPets(filters)
  const { data: favoriteIds = [] } = useMyFavorites(user?.id)
  const { data: myApplications = [], isLoading: applicationsLoading } = useMyApplications(user?.id)
  const toggleFavorite = useToggleFavorite()
  const applyToPet = useApplyToPet()
  
  // Add state for application feedback
  const [applicationFeedback, setApplicationFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const isFavorite = useMemo(() => new Set(favoriteIds), [favoriteIds])

  const handleShelterClick = (shelterId: string) => {
    navigate(`/shelter/${shelterId}`);
  };

  const handleAdoptionApplication = async (petId: string) => {
    console.log('handleAdoptionApplication called with petId:', petId);
    
    if (!user?.id) {
      console.log('No user ID available');
      setApplicationFeedback({ 
        type: 'error', 
        message: 'Debes iniciar sesión para solicitar una adopción' 
      });
      
      // Clear feedback after 5 seconds
      setTimeout(() => {
        setApplicationFeedback(null);
      }, 5000);
      return;
    }

    try {
      console.log('Submitting adoption application for pet:', petId, 'by user:', user.id);
      
      const { error } = await supabase
        .from('adoption_applications')
        .insert({
          pet_id: petId,
          applicant_id: user.id,
          status: 'pending',
          message: 'Solicitud de adopción enviada'
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Adoption application submitted successfully');
      setApplicationFeedback({ 
        type: 'success', 
        message: '¡Solicitud de adopción enviada exitosamente! Te contactaremos pronto.' 
      });
      
      // Clear feedback after 5 seconds
      setTimeout(() => {
        setApplicationFeedback(null);
      }, 5000);
    } catch (error) {
      console.error('Error submitting adoption application:', error);
      setApplicationFeedback({ 
        type: 'error', 
        message: `Error al enviar la solicitud: ${error.message || 'Por favor intenta de nuevo.'}` 
      });
      
      // Clear feedback after 5 seconds
      setTimeout(() => {
        setApplicationFeedback(null);
      }, 5000);
    }
  };

  const tabs = [
    { id: 'catalogo', label: 'Catálogo', icon: Heart, color: 'from-red-500 to-pink-500' },
    { id: 'tinder', label: 'Pet Tinder', icon: Heart, color: 'from-pink-500 to-rose-500' },
    { id: 'albergues', label: 'Albergues', icon: Users, color: 'from-blue-500 to-cyan-500' },
    { id: 'mis-favoritos', label: 'Mis Favoritos', icon: Star, color: 'from-yellow-500 to-orange-500' },
    { id: 'mis-solicitudes', label: 'Mis Solicitudes', icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
  ];


  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingBottom: '100px' }}>
      {/* Header */}
      <div className="p-6">
        <PageHeader 
          title="Adopción"
          subtitle="Encuentra tu compañero perfecto y dale una segunda oportunidad"
          gradient="from-purple-600 to-pink-600"
        >
          <Heart className="w-8 h-8" />
        </PageHeader>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => {
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
          <div className="space-y-6" style={{ paddingBottom: '100px' }}>
            {/* Filters */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
                {showFilters && <AdoptionFilters onFiltersChange={setFilters} />}
              </div>
              <div className="text-sm text-gray-600">
                {pets.length} mascota{pets.length !== 1 ? 's' : ''} disponible{pets.length !== 1 ? 's' : ''}
                </div>
                  </div>

            {/* Pets Grid */}
            {petsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="h-48 bg-gray-200 animate-pulse" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pets.length === 0 ? (
              <div className="text-center py-12">
                <PawPrint className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay mascotas disponibles</h3>
                <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pets.map((pet) => (
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
                          toggleFavorite.mutate({ petId: pet.id, userId: user.id, isFavorite: isFavorite.has(pet.id) });
                        }}
                        className="absolute top-2 left-2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                      >
                        <Star className={`w-4 h-4 ${isFavorite.has(pet.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
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
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            onClick={() => handleAdoptionApplication(pet.id)}
                          >
                            Solicitar Adopción
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

      {activeTab === 'tinder' && (
          <div className="space-y-6" style={{ paddingBottom: '100px' }}>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Pet Tinder</h3>
              <p className="text-gray-600">Desliza para encontrar tu mascota perfecta</p>
            </div>

            {petsLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            ) : pets.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay mascotas disponibles</h3>
                <p className="text-gray-500">Vuelve más tarde para ver nuevas mascotas</p>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className="h-96 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center relative">
                    {pets[currentDog] && (
                      <>
                        <img 
                          src={pets[currentDog].image_url || 'https://placehold.co/400x400?text=Mascota'} 
                          alt={pets[currentDog].name} 
                          className="w-full h-full object-cover" 
                        />
                        <button
                          onClick={() => setDetailsPet(pets[currentDog])}
                          className="absolute top-4 right-4 bg-white/90 rounded-full p-2 hover:bg-white transition-colors"
                        >
                          <Eye className="w-5 h-5 text-gray-600" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  <div className="p-6">
                    {pets[currentDog] && (
                      <>
                        <div className="mb-4">
                          <h3 className="text-2xl font-bold text-gray-800">{pets[currentDog].name}</h3>
                          <p className="text-gray-600">{pets[currentDog].breed} • {pets[currentDog].age} años</p>
                          <p className="text-sm text-gray-500 mt-1">{pets[currentDog].location}</p>
                        </div>
                        
                        <div className="flex justify-center space-x-8">
                          <button
                            onClick={() => setCurrentDog((prev) => (prev + 1) % pets.length)}
                            className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                          >
                            <X className="w-8 h-8 text-red-500" />
                          </button>
                          <button
                            onClick={() => {
                              if (!user?.id) return;
                              toggleFavorite.mutate({ 
                                petId: pets[currentDog].id, 
                                userId: user.id, 
                                isFavorite: isFavorite.has(pets[currentDog].id) 
                              });
                              setCurrentDog((prev) => (prev + 1) % pets.length);
                            }}
                            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors"
                          >
                            <Heart className="w-8 h-8 text-green-500" />
                          </button>
            </div>
                      </>
                    )}
            </div>
          </div>
                
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">
                    {currentDog + 1} de {pets.length} mascotas
                  </p>
          </div>
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
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            onClick={() => handleAdoptionApplication(pet.id)}
                          >
                            Solicitar Adopción
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
          <div className="space-y-6" style={{ paddingBottom: '100px' }}>
            {/* Header */}
            <div>
              <h3 className="text-xl font-bold text-gray-800">Mis Solicitudes</h3>
              <p className="text-gray-600">Estado de tus solicitudes de adopción</p>
          </div>

            {/* Applications List */}
            {applicationsLoading ? (
                <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </Card>
                ))}
                    </div>
            ) : myApplications.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No tienes solicitudes</h3>
                <p className="text-gray-500">Solicita la adopción de una mascota para ver el estado aquí</p>
                      </div>
            ) : (
              <div className="space-y-4">
                {myApplications.map((application: any) => (
                  <Card key={application.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {application.adoption_pets?.image_url ? (
                          <img 
                            src={application.adoption_pets.image_url} 
                            alt={application.adoption_pets.name || 'Mascota'} 
                            className="w-16 h-16 object-cover rounded-lg" 
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500 text-2xl">🐾</span>
                        </div>
                      )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">
                              {application.adoption_pets?.name || 'Mascota'}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 text-xs"
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setShowChatModal(true);
                                }}
                              >
                                <MessageCircle className="w-3 h-3" />
                                Chat
                              </Button>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                application.status === 'approved' ? 'bg-green-100 text-green-800' :
                                application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {application.status === 'pending' ? '⏳ Pendiente' :
                                 application.status === 'approved' ? '✅ Aprobada' :
                                 application.status === 'rejected' ? '❌ Rechazada' :
                                 '🚫 Cancelada'}
                              </span>
                            </div>
                            
                  </div>
                  
                          {/* Pet Details */}
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{application.adoption_pets?.species || 'Mascota'}</span>
                              {application.adoption_pets?.breed && <span>• {application.adoption_pets.breed}</span>}
                              {application.adoption_pets?.age && <span>• {application.adoption_pets.age} años</span>}
                  </div>

                            {application.message && (
                              <p className="text-xs text-gray-500 mt-2">
                                <strong>Mensaje:</strong> {application.message}
                              </p>
                            )}
                            
                            <p className="text-xs text-gray-500">
                              <strong>Fecha de solicitud:</strong> {new Date(application.created_at).toLocaleDateString('es-ES')}
                            </p>
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
          onClose={() => setDetailsPet(null)} 
          pet={detailsPet}
          isFavorite={detailsPet ? isFavorite.has(detailsPet.id) : false}
          onToggleFavorite={() => {
            if (!user?.id || !detailsPet?.id) return
            toggleFavorite.mutate({ petId: detailsPet.id, userId: user.id, isFavorite: isFavorite.has(detailsPet.id) })
          }}
          onApply={() => handleAdoptionApplication(detailsPet?.id || '')}
        />

        {/* Adoption Chat Modal */}
        <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                Chat con el Albergue
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
                <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto min-h-[300px]">
                  <div className="space-y-3">
                    {/* Placeholder messages */}
                    <div className="flex justify-start">
                      <div className="bg-white rounded-lg p-3 max-w-[70%] shadow-sm">
                        <p className="text-sm text-gray-700">
                          ¡Hola! Gracias por tu interés en adoptar a {selectedApplication.adoption_pets?.name || 'nuestra mascota'}. 
                          ¿Te gustaría programar una cita para conocerla?
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Albergue • {new Date().toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                    
                    {selectedApplication.message && (
                      <div className="flex justify-end">
                        <div className="bg-blue-500 text-white rounded-lg p-3 max-w-[70%] shadow-sm">
                          <p className="text-sm">
                            {selectedApplication.message}
                          </p>
                          <p className="text-xs text-blue-100 mt-1">Tú • {new Date(selectedApplication.created_at).toLocaleDateString('es-ES')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input 
                    placeholder="Escribe tu mensaje..." 
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        // TODO: Send message functionality
                        console.log('Send message');
                      }
                    }}
                  />
                  <Button type="button" className="bg-blue-500 hover:bg-blue-600">
                    <MessageCircle className="w-4 h-4" />
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
