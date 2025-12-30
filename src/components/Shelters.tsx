import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Phone, Mail, Users, Search, Filter } from 'lucide-react';
import { useShelters } from '@/hooks/useAdoption';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Shelters: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const navigate = useNavigate();
  const { data: shelters = [], isLoading: sheltersLoading } = useShelters();

  // Debug logging
  console.log('Shelters Debug:', {
    sheltersCount: shelters.length,
    shelters: shelters.map(s => ({ id: s.id, name: s.name, image_url: s.image_url }))
  });

  // Filter shelters based on search and location
  const filteredShelters = shelters.filter(shelter => {
    const matchesSearch = shelter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (shelter.description && shelter.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLocation = !locationFilter || 
                           (shelter.location && shelter.location.toLowerCase().includes(locationFilter.toLowerCase()));
    return matchesSearch && matchesLocation;
  });

  const handleContactShelter = (shelter: any, method: 'phone' | 'email') => {
    if (method === 'phone' && shelter.phone) {
      window.open(`tel:${shelter.phone}`, '_blank');
    } else if (method === 'email') {
      // You can implement email functionality here
      console.log('Contact shelter via email:', shelter.name);
    }
  };

  const handleViewShelter = (shelterId: string) => {
    navigate(`/shelter/${shelterId}`);
  };

  const handleViewPets = (shelterId: string) => {
    navigate(`/shelter/${shelterId}?tab=pets`);
  };

  return (
    <div className="p-6 space-y-6" style={{ paddingBottom: '100px' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Albergues</h2>
        <p className="text-purple-100">Encuentra albergues y refugios de mascotas cerca de ti</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Albergues
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por nombre o descripción</label>
              <Input
                placeholder="Buscar albergues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por ubicación</label>
              <Input
                placeholder="Ciudad, estado..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="w-5 h-5" />
          <span>{filteredShelters.length} albergue{filteredShelters.length !== 1 ? 's' : ''} encontrado{filteredShelters.length !== 1 ? 's' : ''}</span>
        </div>
        {searchTerm || locationFilter ? (
          <Button 
            variant="outline" 
            onClick={() => { setSearchTerm(''); setLocationFilter(''); }}
            className="text-sm"
          >
            Limpiar filtros
          </Button>
        ) : null}
      </div>

      {/* Shelters Grid */}
      {sheltersLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredShelters.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || locationFilter ? 'No se encontraron albergues' : 'No hay albergues disponibles'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || locationFilter 
                ? 'Intenta ajustar tus filtros de búsqueda.' 
                : 'Aún no se han registrado albergues en la plataforma.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShelters.map((shelter) => (
            <Card key={shelter.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center relative overflow-hidden">
                {(shelter.primary_image_url || shelter.image_url) ? (
                  <img 
                    src={shelter.primary_image_url || shelter.image_url} 
                    alt={shelter.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Shelter image failed to load:', shelter.primary_image_url || shelter.image_url);
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                    onLoad={() => {
                      console.log('Shelter image loaded successfully:', shelter.primary_image_url || shelter.image_url);
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${(shelter.primary_image_url || shelter.image_url) ? 'hidden' : ''}`}>
                  <Building2 className="w-20 h-20 text-purple-400" />
                  <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded text-xs text-gray-600">
                    Sin imagen
                  </div>
                </div>
              </div>
              
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{shelter.name}</h3>
                  {shelter.location && (
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{shelter.location}</span>
                    </div>
                  )}
                </div>
                
                {shelter.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">{shelter.description}</p>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    {shelter.phone && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleContactShelter(shelter, 'phone')}
                        className="text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleContactShelter(shelter, 'email')}
                      className="text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={() => handleViewShelter(shelter.id)}
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transition-all duration-200"
                    >
                      Ver detalles
                    </Button>
                    <Button 
                      onClick={() => handleViewPets(shelter.id)}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      Ver mascotas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shelters;
