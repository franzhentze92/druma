import React, { useState, useEffect } from 'react';
import { Search, MapPin, Plus, Eye, Phone, Calendar, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import ReportLostPetDialog from '@/components/ReportLostPetDialog';
import LostPetDetailsModal from '@/components/LostPetDetailsModal';
import SimpleMap from '@/components/SimpleMap';

interface LostPet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  color: string;
  last_seen: string;
  last_location: string;
  latitude: number;
  longitude: number;
  description: string;
  contact_phone: string;
  contact_email: string;
  reward?: number;
  owner_id: string;
  created_at: string;
  status: string;
}

const MascotasPerdidas: React.FC = () => {
  const [lostPets, setLostPets] = useState<LostPet[]>([]);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedLostPet, setSelectedLostPet] = useState<LostPet | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const refreshLostPets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lost_pets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLostPets(data || []);
    } catch (error) {
      console.error('Error fetching lost pets:', error);
      setLostPets([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch lost pets
  useEffect(() => {
    refreshLostPets();
  }, []);

  return (
    <div className="p-6 space-y-6" style={{ paddingBottom: '100px' }}>
      {/* Header */}
      <PageHeader 
        title="Mascotas Perdidas"
        subtitle="Ayuda a encontrar mascotas perdidas o registra la tuya"
        gradient="from-orange-500 to-red-500"
      >
        <Button 
          onClick={() => setShowReportDialog(true)}
          className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Reportar
        </Button>
      </PageHeader>

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === 'list'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <Search className="w-4 h-4" />
          Lista
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === 'map'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Mapa
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando {viewMode === 'map' ? 'mapa' : 'lista'}...</p>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lostPets.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay mascotas perdidas reportadas</h3>
                  <p className="text-gray-600 mb-4">Sé el primero en reportar una mascota perdida para ayudar a otros</p>
                  <Button 
                    onClick={() => setShowReportDialog(true)}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Reportar Mascota Perdida
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            lostPets.map((pet) => (
              <Card key={pet.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{pet.name}</h4>
                      <p className="text-sm text-gray-600">{pet.species} • {pet.breed}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Perdida
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{pet.last_location}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{new Date(pet.last_seen).toLocaleDateString()}</span>
                    </div>
                    {pet.reward && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-2" />
                        <span className="font-medium text-green-600">Recompensa: Q.{pet.reward}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                    {pet.description}
                  </p>

                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedLostPet(pet)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Detalles
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(`tel:${pet.contact_phone}`)}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Map View */
        <div className="h-[600px] rounded-lg overflow-hidden border shadow-lg">
          <SimpleMap 
            lostPets={lostPets} 
            viewMode={viewMode}
            onPetClick={(pet) => setSelectedLostPet(pet as LostPet)}
          />
        </div>
      )}

      {/* Report Dialog */}
      <ReportLostPetDialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        onSuccess={() => {
          // Refresh lost pets data
          refreshLostPets();
        }}
      />

      {/* Lost Pet Details Modal */}
      <LostPetDetailsModal
        pet={selectedLostPet}
        open={!!selectedLostPet}
        onClose={() => setSelectedLostPet(null)}
      />
    </div>
  );
};

export default MascotasPerdidas;
