import React, { useState } from 'react';
import { User, Dog, Bell, Shield, HelpCircle, LogOut, Edit, Plus, Trash2, Heart, HeartOff, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useUserProfile, usePets } from '@/hooks/useSettings';
import EditProfileModal from './EditProfileModal';
import PetModal from './PetModal';
import DeletePetDialog from './DeletePetDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from './PageHeader';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const Ajustes: React.FC = () => {
  const [activeTab, setActiveTab] = useState('perfil');
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<any>(null);
  const [deletePetDialog, setDeletePetDialog] = useState<{ open: boolean; pet: any }>({ open: false, pet: null });

  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Fetch user profile and pets
  const { data: userProfile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: pets, isLoading: petsLoading } = usePets(user?.id);

  const tabs = [
    { id: 'perfil', label: 'Mi Perfil', icon: User, color: 'from-blue-500 to-cyan-500' },
    { id: 'perros', label: 'Mis Perros', icon: Dog, color: 'from-green-500 to-emerald-500' },
  ];

  const settings = [
    { icon: Bell, label: 'Notificaciones', description: 'Gestionar alertas y recordatorios' },
    { icon: Shield, label: 'Privacidad', description: 'Configurar privacidad de datos' },
    { icon: HelpCircle, label: 'Ayuda', description: 'Centro de ayuda y soporte' },
    { icon: LogOut, label: 'Cerrar Sesión', description: 'Salir de la aplicación' },
  ];

  const handleEditProfile = () => {
    console.log('Edit profile clicked!')
    console.log('User profile:', userProfile)
    console.log('User:', user)
    if (userProfile) {
      console.log('Opening edit profile modal...')
      setEditProfileOpen(true);
    } else {
      console.log('No user profile found, cannot edit')
    }
  };

  const handleAddPet = () => {
    setEditingPet(null);
    setPetModalOpen(true);
  };

  const handleEditPet = (pet: any) => {
    setEditingPet(pet);
    setPetModalOpen(true);
  };

  const handleDeletePet = (pet: any) => {
    setDeletePetDialog({ open: true, pet });
  };

  const getPetEmoji = (species: string) => {
    switch (species.toLowerCase()) {
      case 'dog': return '🐕';
      case 'cat': return '🐱';
      case 'bird': return '🐦';
      case 'fish': return '🐠';
      default: return '🐾';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="p-6 space-y-6" style={{ paddingBottom: '100px' }}>
      <PageHeader 
        title="Ajustes"
        subtitle="Gestiona tu perfil y configuraciones"
        gradient="from-purple-600 to-pink-600"
      />

      {/* Tabs */}
      <div className="flex space-x-2 bg-gray-100 p-2 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg transition-all duration-200
              ${activeTab === tab.id 
                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg` 
                : 'text-gray-600 hover:bg-white'
              }
            `}
          >
            <tab.icon size={18} />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'perfil' && (
        <div className="space-y-6">
          {/* User Profile */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Información Personal</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditProfile}
                disabled={profileLoading}
                className="text-purple-600 hover:text-purple-700"
              >
                <Edit size={20} />
              </Button>
            </div>
            
            {profileLoading ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-20 h-20 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full md:col-span-2" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-4 mb-6">
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {(userProfile?.full_name || user?.email || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">
                      {userProfile?.full_name || 'Usuario'}
                    </h4>
                    <p className="text-gray-600">
                      Miembro desde {userProfile?.created_at ? formatDate(userProfile.created_at) : 'Enero 2024'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium text-gray-800">{user?.email || 'usuario@email.com'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Teléfono</label>
                    <p className="font-medium text-gray-800">{userProfile?.phone || 'No especificado'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-500">Dirección</label>
                    <p className="font-medium text-gray-800">{userProfile?.address || 'No especificada'}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Settings */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Configuraciones</h3>
            <div className="space-y-3">
              {settings.map((setting, index) => (
                <button
                  key={index}
                  onClick={async () => {
                    if (setting.label === 'Cerrar Sesión') {
                      try {
                        await signOut();
                        navigate('/login');
                      } catch (error) {
                        console.error('Error signing out:', error);
                      }
                    }
                  }}
                  className="w-full flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <setting.icon size={20} className="text-gray-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-800">{setting.label}</div>
                    <div className="text-sm text-gray-500">{setting.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'perros' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">Mis Mascotas</h3>
            <Button
              onClick={handleAddPet}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-green-600 hover:to-emerald-600"
            >
              <Plus size={16} />
              <span>Agregar Mascota</span>
            </Button>
          </div>

          {petsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : pets && pets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pets.map((pet) => (
                <div key={pet.id} className="bg-white rounded-2xl p-6 shadow-lg">
                                     <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center space-x-4">
                       {pet.image_url ? (
                         <img
                           src={pet.image_url}
                           alt={pet.name}
                           className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                         />
                       ) : (
                         <div className="text-4xl">{getPetEmoji(pet.species)}</div>
                       )}
                       <div>
                         <h4 className="text-xl font-bold text-gray-800">{pet.name}</h4>
                         <p className="text-gray-600">{pet.breed || pet.species}</p>
                       </div>
                     </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/pet-journey/${pet.id}`)}
                        className="text-blue-600 hover:text-blue-700"
                        title="Ver historial completo"
                      >
                        <Calendar size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPet(pet)}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePet(pet)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Edad:</span>
                      <p className="font-medium text-gray-800">
                        {pet.age ? `${pet.age} años` : 'No especificada'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Peso:</span>
                      <p className="font-medium text-gray-800">
                        {pet.weight ? `${pet.weight} kg` : 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Microchip:</span>
                      <p className="font-medium text-gray-800">
                        {pet.microchip || 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Reproducción:</span>
                      <p className={`font-medium ${pet.available_for_breeding ? 'text-green-600' : 'text-gray-600'}`}>
                        {pet.available_for_breeding ? 'Disponible' : 'No disponible'}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => navigate(`/pet-journey/${pet.id}`)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 mt-4"
                  >
                    <Calendar size={16} className="mr-2" />
                    Ver Historial Completo (My Pet Journey)
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
              <div className="text-6xl mb-4">🐾</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No tienes mascotas registradas</h3>
              <p className="text-gray-600 mb-6">Comienza agregando tu primera mascota para gestionar su información</p>
              <Button
                onClick={handleAddPet}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto hover:from-green-600 hover:to-emerald-600"
              >
                <Plus size={20} />
                <span>Agregar Primera Mascota</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {userProfile && (
        <EditProfileModal
          isOpen={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
          profile={userProfile}
        />
      )}

      <PetModal
        isOpen={petModalOpen}
        onClose={() => {
          setPetModalOpen(false);
          setEditingPet(null);
        }}
        pet={editingPet}
        ownerId={user?.id || ''}
      />

      <DeletePetDialog
        isOpen={deletePetDialog.open}
        onClose={() => setDeletePetDialog({ open: false, pet: null })}
        petName={deletePetDialog.pet?.name || ''}
        petId={deletePetDialog.pet?.id || ''}
      />
    </div>
  );
};

export default Ajustes;