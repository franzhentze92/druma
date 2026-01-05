import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MapPin, Calendar, PawPrint, Users, Heart, ShieldCheck, PawPrintIcon, Weight, Home, Stethoscope, DollarSign, AlertCircle, CheckCircle, XCircle, Phone } from 'lucide-react'

interface AdoptionPetDetailsProps {
  open: boolean
  onClose: () => void
  pet: any | null
  isFavorite?: boolean
  onToggleFavorite?: () => void
  onApply?: () => void
  applicationFeedback?: { type: 'success' | 'error', message: string } | null
  hasApplied?: boolean
}

const Badge = ({ children, color = 'gray' }: { children: React.ReactNode; color?: 'purple' | 'blue' | 'gray' | 'green' | 'red' | 'orange' | 'yellow' }) => {
  const map: Record<string, string> = {
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    green: 'bg-green-50 text-green-700 border-green-100',
    red: 'bg-rose-50 text-rose-700 border-rose-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs rounded-full border ${map[color]}`}>{children}</span>
  )
}

const Row = ({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="flex items-center text-sm">
    {icon && <span className="text-gray-500 mr-2">{icon}</span>}
    <span className="text-gray-500 mr-2">{label}:</span>
    <span className="text-gray-800 font-medium">{value}</span>
  </div>
)

const AdoptionPetDetails: React.FC<AdoptionPetDetailsProps> = ({ open, onClose, pet, isFavorite, onToggleFavorite, onApply, applicationFeedback, hasApplied }) => {
  if (!pet) return null

  const ageText = pet.age ? `${pet.age} ${pet.age === 1 ? 'año' : 'años'}` : '—'
  const weightText = pet.weight ? `${pet.weight} kg` : '—'
  const adoptionFeeText = pet.adoption_fee || 'Gratis'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Image Header */}
        <div className="relative h-64 w-full">
          <img
            src={pet.image_url || pet.image || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3'}
            alt={pet.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <button
            className={`absolute top-3 left-3 rounded-full p-2 shadow ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-red-500 hover:bg-white'}`}
            onClick={onToggleFavorite}
          >
            <Heart className="w-5 h-5" />
          </button>
          {pet.status && pet.status !== 'available' && (
            <div className="absolute top-3 right-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              {pet.status === 'adopted' ? 'Adoptado' : pet.status === 'hold' ? 'Reservado' : pet.status}
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Pet Name and Basic Info */}
          <DialogHeader className="p-0">
            <DialogTitle className="text-2xl font-bold text-gray-800">{pet.name}</DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              {pet.species && (
                <Badge color="purple">
                  <PawPrint className="w-3 h-3 mr-1" />
                  {pet.species === 'Dog' ? 'Perro' : pet.species === 'Cat' ? 'Gato' : pet.species}
                </Badge>
              )}
              {pet.breed && <Badge color="blue">{pet.breed}</Badge>}
              {pet.color && <Badge color="orange">{pet.color}</Badge>}
            </div>
          </DialogHeader>

          {/* Description */}
          {pet.description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Descripción</h4>
              <p className="text-sm text-gray-700">{pet.description}</p>
            </div>
          )}

          {/* Basic Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Row label="Edad" value={ageText} icon={<Calendar className="w-4 h-4" />} />
            {pet.sex && <Row label="Sexo" value={pet.sex === 'M' ? 'Macho' : 'Hembra'} icon={<ShieldCheck className="w-4 h-4" />} />}
            {pet.weight && <Row label="Peso" value={weightText} icon={<Weight className="w-4 h-4" />} />}
            {pet.size && <Row label="Tamaño" value={pet.size} icon={<PawPrint className="w-4 h-4" />} />}
            {pet.energy_level && <Row label="Nivel de Energía" value={pet.energy_level} icon={<PawPrint className="w-4 h-4" />} />}
            <Row label="Costo de Adopción" value={adoptionFeeText} icon={<DollarSign className="w-4 h-4" />} />
          </div>

          {/* Behavioral Traits */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Comportamiento</h4>
            <div className="flex flex-wrap gap-2">
              {typeof pet.good_with_kids === 'boolean' && (
                <Badge color={pet.good_with_kids ? 'green' : 'red'}>
                  {pet.good_with_kids ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  {pet.good_with_kids ? 'Apto con niños' : 'Mejor sin niños'}
                </Badge>
              )}
              {typeof pet.good_with_dogs === 'boolean' && (
                <Badge color={pet.good_with_dogs ? 'green' : 'red'}>
                  {pet.good_with_dogs ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  {pet.good_with_dogs ? 'Sociable con perros' : 'No sociable con perros'}
                </Badge>
              )}
              {typeof pet.good_with_cats === 'boolean' && (
                <Badge color={pet.good_with_cats ? 'green' : 'red'}>
                  {pet.good_with_cats ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  {pet.good_with_cats ? 'Sociable con gatos' : 'No sociable con gatos'}
                </Badge>
              )}
            </div>
          </div>

          {/* Health and Care Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Salud y Cuidados</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {typeof pet.house_trained === 'boolean' && (
                <Row 
                  label="Entrenado en casa" 
                  value={pet.house_trained ? 'Sí' : 'No'} 
                  icon={pet.house_trained ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />} 
                />
              )}
              {typeof pet.spayed_neutered === 'boolean' && (
                <Row 
                  label="Esterilizado/Castrado" 
                  value={pet.spayed_neutered ? 'Sí' : 'No'} 
                  icon={pet.spayed_neutered ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />} 
                />
              )}
            </div>
          </div>

          {/* Special Needs */}
          {pet.special_needs && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Necesidades Especiales
              </h4>
              <p className="text-sm text-yellow-700">
                {pet.special_needs_description || 'Esta mascota requiere cuidados especiales.'}
              </p>
            </div>
          )}

          {/* Medical Notes */}
          {pet.medical_notes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                <Stethoscope className="w-4 h-4 mr-2" />
                Notas Médicas
              </h4>
              <p className="text-sm text-blue-700">{pet.medical_notes}</p>
            </div>
          )}

          {/* Shelter Information */}
          {pet.shelters?.name && (
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Información del Albergue
              </h4>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-gray-800">{pet.shelters.name}</div>
                  {pet.shelters.location && (
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {pet.shelters.location}
                    </div>
                  )}
                  {pet.shelters.phone && (
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Phone className="w-4 h-4 mr-1" />
                      {pet.shelters.phone}
                    </div>
                  )}
                  {pet.shelters.description && (
                    <p className="text-sm text-gray-600 mt-2">{pet.shelters.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pet Location */}
          {pet.location && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Ubicación
              </h4>
              <p className="text-sm text-gray-700">{pet.location}</p>
            </div>
          )}

          {/* Application Feedback - Shown at bottom before buttons */}
          {applicationFeedback && (
            <div className={`p-4 rounded-lg ${
              applicationFeedback.type === 'success' 
                ? 'bg-green-100 border border-green-300 text-green-800' 
                : 'bg-red-100 border border-red-300 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {applicationFeedback.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-medium">{applicationFeedback.message}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                hasApplied
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600'
              }`}
              onClick={onApply}
              disabled={hasApplied}
            >
              {hasApplied ? 'Solicitud ya enviada' : 'Solicitar Adopción'}
            </button>
            <button 
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all" 
              onClick={onToggleFavorite}
            >
              {isFavorite ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AdoptionPetDetails
