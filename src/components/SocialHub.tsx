import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '../hooks/use-toast';
import { 
  Heart, 
  Users, 
  MessageCircle, 
  MapPin, 
  Calendar, 
  Star, 
  Plus, 
  Search,
  Filter,
  PawPrint,
  Camera,
  Phone,
  Mail,
  Shield,
  Trophy,
  Zap
} from 'lucide-react';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  image_url?: string;
  owner_id: string;
}

interface AdoptionPet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  image_url?: string;
  shelter_name: string;
  location: string;
  description: string;
  adoption_fee: number;
  status: 'available' | 'pending' | 'adopted';
}

interface Message {
  id: string;
  sender_name: string;
  sender_pet_name: string;
  content: string;
  timestamp: string;
  type: 'playdate' | 'breeding' | 'general';
  unread: boolean;
}

const SocialHub: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [adoptionPets, setAdoptionPets] = useState<AdoptionPet[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('adoption');

  useEffect(() => {
    if (user) {
      loadPets();
      loadAdoptionPets();
      loadMessages();
    }
  }, [user]);

  useEffect(() => {
    if (pets && pets.length > 0) {
      setSelectedPet(pets[0]);
    }
  }, [pets]);

  const loadPets = async () => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user?.id);
      
      if (error) throw error;
      setPets(data || []);
    } catch (error) {
      console.error('Error loading pets:', error);
    }
  };

  const loadAdoptionPets = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockAdoptionPets: AdoptionPet[] = [
        {
          id: '1',
          name: 'Luna',
          species: 'Cat',
          breed: 'Persa',
          age: 2,
          image_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Luna',
          shelter_name: 'Refugio San Miguel',
          location: 'Madrid, España',
          description: 'Luna es una gata muy cariñosa y tranquila. Le encanta jugar con pelotas y dormir en el sofá.',
          adoption_fee: 50,
          status: 'available'
        },
        {
          id: '2',
          name: 'Max',
          species: 'Dog',
          breed: 'Golden Retriever',
          age: 4,
          image_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Max',
          shelter_name: 'Protectora Animal',
          location: 'Barcelona, España',
          description: 'Max es un perro muy energético y leal. Perfecto para familias activas.',
          adoption_fee: 80,
          status: 'available'
        }
      ];
      setAdoptionPets(mockAdoptionPets);
    } catch (error) {
      console.error('Error loading adoption pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      // Mock data for demonstration
      const mockMessages: Message[] = [
        {
          id: '1',
          sender_name: 'María González',
          sender_pet_name: 'Bella',
          content: '¡Hola! ¿Te gustaría que nuestras mascotas se conozcan? Bella está buscando nuevos amigos.',
          timestamp: 'Hace 2 horas',
          type: 'playdate',
          unread: true
        },
        {
          id: '2',
          sender_name: 'Carlos Ruiz',
          sender_pet_name: 'Rex',
          content: 'Mi perro Rex es de raza pura y estoy interesado en criar. ¿Tu mascota está disponible?',
          timestamp: 'Ayer',
          type: 'breeding',
          unread: false
        }
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleAdoptPet = (pet: AdoptionPet) => {
    toast({
      title: "¡Solicitud enviada! 🎉",
      description: `Has solicitado adoptar a ${pet.name}. El refugio se pondrá en contacto contigo.`,
    });
  };

  const handleMessageReply = (messageId: string) => {
    toast({
      title: "Mensaje enviado 💬",
      description: "Tu respuesta ha sido enviada",
    });
  };

  const getSpeciesEmoji = (species: string) => {
    switch (species.toLowerCase()) {
      case 'dog': return '🐕';
      case 'cat': return '🐱';
      case 'bird': return '🐦';
      case 'fish': return '🐠';
      default: return '🐾';
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'playdate': return '🎾';
      case 'breeding': return '💕';
      case 'general': return '💬';
      default: return '💬';
    }
  };

  if (!selectedPet) {
    return (
      <div className="p-6 text-center pb-20">
        <div className="text-6xl mb-4">👥</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          ¡No tienes mascotas aún!
        </h2>
        <p className="text-gray-600 mb-6">
          Crea tu primera mascota para conectar con la comunidad
        </p>
        <Button 
          onClick={() => window.location.href = '/pet-creation'}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          Crear Mi Primera Mascota
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-20">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                {selectedPet.image_url ? (
                  <img
                    src={selectedPet.image_url}
                    alt={selectedPet.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl border-4 border-white shadow-lg">
                    {getSpeciesEmoji(selectedPet.species)}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Comunidad de {selectedPet.name}</h2>
                <p className="text-gray-600">Conecta con otros dueños de mascotas</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{messages.filter(m => m.unread).length}</div>
                <div className="text-xs text-gray-600">Mensajes</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white p-1 shadow-lg rounded-xl">
          <TabsTrigger value="adoption" className="flex items-center space-x-2">
            <Heart className="w-4 h-4" />
            <span>Adopción</span>
          </TabsTrigger>
          <TabsTrigger value="playdates" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Citas</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center space-x-2 relative">
            <MessageCircle className="w-4 h-4" />
            <span>Mensajes</span>
            {messages.filter(m => m.unread).length > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Adoption Tab */}
        <TabsContent value="adoption" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Heart className="w-6 h-6 text-red-600" />
                🐾 Mascotas en Adopción
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando mascotas...</p>
                </div>
              ) : adoptionPets.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🐾</div>
                  <p className="text-gray-600">No hay mascotas disponibles para adopción</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adoptionPets.map((pet) => (
                    <Card key={pet.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <img
                            src={pet.image_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${pet.name}`}
                            alt={pet.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-bold text-gray-900">{pet.name}</h3>
                              <span className="text-lg">{getSpeciesEmoji(pet.species)}</span>
                              <Badge className={
                                pet.status === 'available' ? 'bg-green-100 text-green-800' :
                                pet.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {pet.status === 'available' ? 'Disponible' :
                                 pet.status === 'pending' ? 'Pendiente' : 'Adoptado'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{pet.breed} • {pet.age} años</p>
                            <p className="text-sm text-gray-500 mb-3">{pet.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{pet.location}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">€{pet.adoption_fee}</div>
                                {pet.status === 'available' && (
                                  <Button 
                                    size="sm"
                                    onClick={() => handleAdoptPet(pet)}
                                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                                  >
                                    Adoptar
                                  </Button>
                                )}
                              </div>
                            </div>
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

        {/* Playdates Tab */}
        <TabsContent value="playdates" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Users className="w-6 h-6 text-green-600" />
                🎾 Citas de Juego
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎾</div>
                <p className="text-gray-600 mb-4">Organiza citas de juego para {selectedPet.name}</p>
                <Button 
                  onClick={() => toast({
                    title: "Próximamente",
                    description: "La función de citas de juego estará disponible pronto",
                  })}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Cita de Juego
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <MessageCircle className="w-6 h-6 text-purple-600" />
                💬 Mensajes de la Comunidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">💬</div>
                  <p className="text-gray-600">No tienes mensajes aún</p>
                  <p className="text-sm text-gray-500 mt-2">¡Conecta con otros dueños de mascotas!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className={`p-4 rounded-lg border-2 ${
                      message.unread ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">{getMessageIcon(message.type)}</div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900">{message.sender_name}</span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">{message.sender_pet_name}</span>
                              {message.unread && (
                                <Badge className="bg-blue-100 text-blue-800">Nuevo</Badge>
                              )}
                            </div>
                            <p className="text-gray-700 mb-2">{message.content}</p>
                            <div className="text-sm text-gray-500">{message.timestamp}</div>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleMessageReply(message.id)}
                          className="ml-4"
                        >
                          Responder
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

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Zap className="w-6 h-6 text-yellow-600" />
            ⚡ Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => window.location.href = '/mascotas-perdidas'}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-16"
            >
              <MapPin className="w-5 h-5 mr-2" />
              Mascotas Perdidas
            </Button>
            <Button 
              onClick={() => window.location.href = '/parejas'}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white h-16"
            >
              <Heart className="w-5 h-5 mr-2" />
              Buscar Pareja
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Community Stats */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="text-2xl">🌟</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">¡Únete a la comunidad PetHub!</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Conecta con otros dueños de mascotas en tu área</li>
                <li>• Organiza citas de juego para tu mascota</li>
                <li>• Ayuda a mascotas perdidas a encontrar su hogar</li>
                <li>• ¡Haz nuevos amigos que comparten tu amor por las mascotas!</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialHub;
