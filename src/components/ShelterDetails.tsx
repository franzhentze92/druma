import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Mail, Users, PawPrint, Calendar, Star, Building2, Image as ImageIcon, Video, ExternalLink, X } from 'lucide-react';
import { useShelterById, useAdoptionPetsByShelter, useShelterImages, useShelterVideos } from '@/hooks/useAdoption';
import { useMyFavorites, useToggleFavorite, useApplyToPet } from '@/hooks/useAdoption';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { storage } from '@/lib/storage';
import AdoptionPetDetails from './AdoptionPetDetails';

const ShelterDetails: React.FC = () => {
  const { shelterId } = useParams<{ shelterId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [detailsPet, setDetailsPet] = useState<any | null>(null);
  
  const { data: shelter, isLoading: shelterLoading } = useShelterById(shelterId);
  const { data: pets = [], isLoading: petsLoading } = useAdoptionPetsByShelter(shelter?.owner_id);
  const { data: shelterImages = [], isLoading: imagesLoading } = useShelterImages(shelter?.owner_id);
  const { data: shelterVideos = [], isLoading: videosLoading } = useShelterVideos(shelter?.owner_id);

  // Debug logging
  console.log('ShelterDetails Debug:', {
    shelterId,
    shelter: shelter?.name,
    shelterOwnerId: shelter?.owner_id,
    shelterImages: shelterImages.length,
    shelterVideos: shelterVideos.length,
    imagesLoading,
    videosLoading
  });
  const { data: favoriteIds = [] } = useMyFavorites(user?.id);
  const toggleFavorite = useToggleFavorite();
  const applyToPet = useApplyToPet();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Set initial tab based on URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'pets', 'gallery', 'videos'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const isFavorite = (petId: string) => favoriteIds.includes(petId);

  const handleContactShelter = (method: 'phone' | 'email') => {
    if (method === 'phone' && shelter?.phone) {
      window.open(`tel:${shelter.phone}`, '_blank');
    } else if (method === 'email') {
      // You can implement email functionality here
      console.log('Contact shelter via email:', shelter?.name);
    }
  };

  const handleFavoritePet = (petId: string) => {
    if (!user?.id) return;
    toggleFavorite.mutate({ 
      petId, 
      userId: user.id, 
      isFavorite: isFavorite(petId) 
    });
  };

  const handleApplyToPet = (petId: string) => {
    if (!user?.id) return;
    applyToPet.mutate({ 
      pet_id: petId, 
      applicant_id: user.id, 
      message: null, 
      status: 'pending' 
    });
  };

  if (shelterLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-2xl mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!shelter) {
    return (
      <div className="p-6 text-center">
        <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Albergue no encontrado</h2>
        <p className="text-gray-500 mb-4">El albergue que buscas no existe o ha sido removido.</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  // Use real data from database only
  const images = shelterImages.map(img => {
    // Check if it's already a full URL (external) or a storage path
    if (img.image_url.startsWith('http')) {
      return img.image_url;
    }
    return storage.getShelterImageUrl(img.image_url);
  });
  
  // Add shelter main image if it exists and is not already in the images array
  if (shelter?.image_url && !images.includes(shelter.image_url)) {
    images.unshift(shelter.image_url);
  }

  const videos = shelterVideos.map(video => ({
    id: video.id,
    title: video.title,
    url: video.youtube_url,
    thumbnail: video.thumbnail_url 
      ? (video.thumbnail_url.startsWith('http') 
          ? video.thumbnail_url 
          : storage.getShelterImageUrl(video.thumbnail_url))
      : 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&auto=format&fit=crop&ixlib=rb-4.0.3'
  }));

  // Use real statistics from database or fallback to mock data
  const shelterStats = [
    { 
      label: 'Mascotas Rescatadas', 
      value: `${shelter.total_rescued_pets || 150}+`, 
      icon: PawPrint, 
      color: 'text-purple-600' 
    },
    { 
      label: 'Adopciones Exitosas', 
      value: `${shelter.total_successful_adoptions || 120}+`, 
      icon: Star, 
      color: 'text-green-600' 
    },
    { 
      label: 'Voluntarios', 
      value: `${shelter.total_volunteers || 25}+`, 
      icon: Users, 
      color: 'text-blue-600' 
    },
    { 
      label: 'Años de Experiencia', 
      value: `${shelter.years_experience || 8}+`, 
      icon: Calendar, 
      color: 'text-orange-600' 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              onClick={() => navigate(-1)} 
              variant="ghost" 
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{shelter.name}</h1>
              {shelter.location && (
                <div className="flex items-center text-purple-100 mt-2">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="text-lg">{shelter.location}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {shelter.phone && (
              <Button 
                onClick={() => handleContactShelter('phone')}
                className="bg-white text-purple-600 hover:bg-gray-100 shadow-lg font-medium"
              >
                <Phone className="w-4 h-4 mr-2" />
                Llamar
              </Button>
            )}
            <Button 
              onClick={() => handleContactShelter('email')}
              className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white hover:text-purple-600 shadow-lg font-medium"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contactar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Hero Image */}
        <div className="relative h-96 rounded-2xl overflow-hidden">
          <img 
            src={images[0]} 
            alt={shelter.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6 text-white">
            <h2 className="text-2xl font-bold mb-2">{shelter.name}</h2>
            <p className="text-white/90 max-w-2xl">
              {shelter.mission_statement || shelter.description || 'Este albergue se dedica a rescatar y cuidar mascotas abandonadas, proporcionándoles un hogar temporal mientras encuentran una familia permanente.'}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {shelterStats.map((stat, index) => (
            <Card key={index} className="text-center p-4">
              <div className={`${stat.color} mb-2`}>
                <stat.icon className="w-8 h-8 mx-auto" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
            >
              Resumen
            </TabsTrigger>
            <TabsTrigger 
              value="pets" 
              className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
            >
              Mascotas ({pets.length})
            </TabsTrigger>
            <TabsTrigger 
              value="gallery" 
              className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
            >
              Galería
            </TabsTrigger>
            <TabsTrigger 
              value="videos" 
              className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
            >
              Videos
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sobre {shelter.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Descripción</h4>
                    <p className="text-gray-600 leading-relaxed">
                      {shelter.mission_statement || shelter.description || 'Este albergue se dedica a rescatar y cuidar mascotas abandonadas, proporcionándoles un hogar temporal mientras encuentran una familia permanente. Nuestro equipo de voluntarios trabaja incansablemente para asegurar que cada mascota reciba el amor y cuidado que merece.'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Información de Contacto</h4>
                    <div className="space-y-2">
                      {shelter.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          <span>{shelter.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>{shelter.email || `contacto@${shelter.name.toLowerCase().replace(/\s+/g, '')}.com`}</span>
                      </div>
                      {shelter.location && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{shelter.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pets Tab */}
          <TabsContent value="pets" className="space-y-6">
            {petsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pets.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <PawPrint className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mascotas disponibles</h3>
                  <p className="text-gray-500">Este albergue no tiene mascotas en adopción en este momento.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pets.map((pet) => (
                  <Card key={pet.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                      <button
                        className={`absolute top-2 right-2 rounded-full p-1.5 shadow ${
                          isFavorite(pet.id) ? 'bg-red-500 text-white' : 'bg-white/90 hover:bg-white text-red-500'
                        }`}
                        onClick={() => handleFavoritePet(pet.id)}
                      >
                        <Star size={16} />
                      </button>
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
                      </div>
                       
                      {pet.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{pet.description}</p>
                      )}
                       
                      <div className="flex items-center justify-between pt-2">
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
                          onClick={() => setDetailsPet(pet)}
                          size="sm"
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transition-all duration-200"
                        >
                          Ver detalles
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Galería de Imágenes</CardTitle>
              </CardHeader>
              <CardContent>
                {imagesLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div 
                        key={index} 
                        className="relative group cursor-pointer"
                        onClick={() => setSelectedImage(image)}
                      >
                        <img 
                          src={image} 
                          alt={`${shelter.name} - Imagen ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Videos del Albergue</CardTitle>
              </CardHeader>
              <CardContent>
                {videosLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="space-y-3">
                        <div className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {videos.map((video) => (
                      <div key={video.id} className="space-y-3">
                        <div className="relative">
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Video className="w-12 h-12 text-white" />
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">{video.title}</h4>
                          <Button 
                            onClick={() => window.open(video.url, '_blank')}
                            variant="outline"
                            className="w-full"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Ver en YouTube
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={selectedImage} 
              alt="Vista ampliada"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Pet Details Modal */}
      <AdoptionPetDetails 
        open={!!detailsPet} 
        onClose={() => setDetailsPet(null)} 
        pet={detailsPet}
        isFavorite={detailsPet ? favoriteIds.includes(detailsPet.id) : false}
        onToggleFavorite={() => {
          if (!user?.id || !detailsPet) return;
          toggleFavorite.mutate({ 
            petId: detailsPet.id, 
            userId: user.id, 
            isFavorite: favoriteIds.includes(detailsPet.id) 
          });
        }}
        onApply={() => {
          if (!user?.id || !detailsPet) return;
          applyToPet.mutate({ 
            pet_id: detailsPet.id, 
            applicant_id: user.id, 
            message: null, 
            status: 'pending' 
          });
        }}
      />
    </div>
  );
};

export default ShelterDetails;
