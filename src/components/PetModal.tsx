import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useCreatePet, useUpdatePet } from '@/hooks/useSettings'
import { supabase } from '@/lib/supabase'
import { Loader2, Upload, X } from 'lucide-react'

interface PetModalProps {
  isOpen: boolean
  onClose: () => void
  pet?: {
    id: string
    name: string
    species: string
    breed: string | null
    age: number | null
    weight: number | null
    microchip: string | null
    available_for_breeding: boolean
    image_url: string | null
  }
  ownerId: string
}

const PetModal: React.FC<PetModalProps> = ({ isOpen, onClose, pet, ownerId }) => {
  const [formData, setFormData] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    age: '',
    weight: '',
    microchip: '',
    available_for_breeding: false,
  })
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createPet = useCreatePet()
  const updatePet = useUpdatePet()

  const isEditing = !!pet

  // Lista completa de razas de perros
  const dogBreeds = [
    'Mestizo',
    'Afgano',
    'Airedale Terrier',
    'Akita',
    'Akita Americano',
    'Alaskan Malamute',
    'American Bulldog',
    'American Pit Bull Terrier',
    'American Staffordshire Terrier',
    'American Water Spaniel',
    'Australian Cattle Dog',
    'Australian Kelpie',
    'Australian Shepherd',
    'Australian Terrier',
    'Azawakh',
    'Basenji',
    'Basset Hound',
    'Beagle',
    'Bearded Collie',
    'Bedlington Terrier',
    'Belgian Malinois',
    'Belgian Shepherd',
    'Belgian Tervuren',
    'Bergamasco',
    'Bernese Mountain Dog',
    'Bichon Frisé',
    'Bichon Maltés',
    'Black and Tan Coonhound',
    'Bloodhound',
    'Border Collie',
    'Border Terrier',
    'Borzoi',
    'Boston Terrier',
    'Bouvier des Flandres',
    'Boxer',
    'Boykin Spaniel',
    'Bracco Italiano',
    'Briard',
    'Brittany',
    'Brussels Griffon',
    'Bull Terrier',
    'Bulldog',
    'Bulldog Francés',
    'Bullmastiff',
    'Cairn Terrier',
    'Cane Corso',
    'Cardigan Welsh Corgi',
    'Cavalier King Charles Spaniel',
    'Chesapeake Bay Retriever',
    'Chihuahua',
    'Chinese Crested',
    'Chin',
    'Chow Chow',
    'Clumber Spaniel',
    'Cocker Spaniel',
    'Cocker Spaniel Americano',
    'Collie',
    'Coonhound',
    'Curly-Coated Retriever',
    'Dachshund',
    'Dalmatian',
    'Dandie Dinmont Terrier',
    'Doberman Pinscher',
    'Dogo Argentino',
    'Dogo de Burdeos',
    'English Cocker Spaniel',
    'English Foxhound',
    'English Setter',
    'English Springer Spaniel',
    'English Toy Spaniel',
    'Field Spaniel',
    'Finnish Spitz',
    'Flat-Coated Retriever',
    'Fox Terrier',
    'Foxhound',
    'French Bulldog',
    'German Pinscher',
    'German Shepherd',
    'German Shorthaired Pointer',
    'German Wirehaired Pointer',
    'Giant Schnauzer',
    'Glen of Imaal Terrier',
    'Golden Retriever',
    'Gordon Setter',
    'Great Dane',
    'Great Pyrenees',
    'Greater Swiss Mountain Dog',
    'Greyhound',
    'Harrier',
    'Havanese',
    'Ibizan Hound',
    'Irish Red and White Setter',
    'Irish Setter',
    'Irish Terrier',
    'Irish Water Spaniel',
    'Irish Wolfhound',
    'Italian Greyhound',
    'Jack Russell Terrier',
    'Japanese Chin',
    'Keeshond',
    'Kerry Blue Terrier',
    'Komondor',
    'Kuvasz',
    'Labrador Retriever',
    'Lagotto Romagnolo',
    'Lakeland Terrier',
    'Leonberger',
    'Lhasa Apso',
    'Lowchen',
    'Maltese',
    'Manchester Terrier',
    'Mastiff',
    'Miniature Bull Terrier',
    'Miniature Pinscher',
    'Miniature Schnauzer',
    'Neapolitan Mastiff',
    'Newfoundland',
    'Norfolk Terrier',
    'Norwegian Buhund',
    'Norwegian Elkhound',
    'Norwich Terrier',
    'Nova Scotia Duck Tolling Retriever',
    'Old English Sheepdog',
    'Otterhound',
    'Papillon',
    'Parson Russell Terrier',
    'Pekingese',
    'Pembroke Welsh Corgi',
    'Petit Basset Griffon Vendéen',
    'Pharaoh Hound',
    'Plott',
    'Pointer',
    'Polish Lowland Sheepdog',
    'Pomeranian',
    'Poodle',
    'Poodle Estándar',
    'Poodle Miniatura',
    'Poodle Toy',
    'Portuguese Water Dog',
    'Pug',
    'Puli',
    'Pumi',
    'Rat Terrier',
    'Redbone Coonhound',
    'Rhodesian Ridgeback',
    'Rottweiler',
    'Saint Bernard',
    'Saluki',
    'Samoyed',
    'Schipperke',
    'Schnauzer',
    'Schnauzer Estándar',
    'Scottish Deerhound',
    'Scottish Terrier',
    'Sealyham Terrier',
    'Shar Pei',
    'Shetland Sheepdog',
    'Shiba Inu',
    'Shih Tzu',
    'Siberian Husky',
    'Silky Terrier',
    'Skye Terrier',
    'Smooth Fox Terrier',
    'Soft Coated Wheaten Terrier',
    'Spinone Italiano',
    'Staffordshire Bull Terrier',
    'Standard Schnauzer',
    'Sussex Spaniel',
    'Swedish Vallhund',
    'Tibetan Mastiff',
    'Tibetan Spaniel',
    'Tibetan Terrier',
    'Toy Fox Terrier',
    'Treeing Walker Coonhound',
    'Vizsla',
    'Weimaraner',
    'Welsh Springer Spaniel',
    'Welsh Terrier',
    'West Highland White Terrier',
    'Whippet',
    'Wire Fox Terrier',
    'Wirehaired Pointing Griffon',
    'Xoloitzcuintli',
    'Yorkshire Terrier',
    'Otra'
  ].sort((a, b) => {
    // Mantener "Mestizo" y "Otra" al final
    if (a === 'Mestizo') return -1;
    if (b === 'Mestizo') return 1;
    if (a === 'Otra') return 1;
    if (b === 'Otra') return -1;
    return a.localeCompare(b);
  })

  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name,
        species: pet.species,
        breed: pet.breed || '',
        age: pet.age?.toString() || '',
        weight: pet.weight?.toString() || '',
        microchip: pet.microchip || '',
        available_for_breeding: pet.available_for_breeding,
      })
      setImageUrl(pet.image_url)
    } else {
      setFormData({
        name: '',
        species: 'Dog',
        breed: '',
        age: '',
        weight: '',
        microchip: '',
        available_for_breeding: false,
      })
      setImageUrl(null)
      setPreviewUrl(null)
    }
  }, [pet])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 50MB.')
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Delete old image if exists
      if (imageUrl) {
        try {
          const urlParts = imageUrl.split('/')
          const fileName = urlParts[urlParts.length - 1]
          const oldFilePath = `${ownerId}/pets/${fileName}`
          await supabase.storage
            .from('avatars')
            .remove([oldFilePath])
        } catch (error) {
          console.log('Could not delete old pet image:', error)
        }
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${ownerId}/pets/${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setImageUrl(publicUrl)
      console.log('Pet image uploaded successfully:', publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error al subir la imagen. Inténtalo de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setImageUrl(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getPetEmoji = (species: string) => {
    switch (species.toLowerCase()) {
      case 'dog': return '🐕'
      case 'cat': return '🐱'
      case 'bird': return '🐦'
      case 'fish': return '🐠'
      default: return '🐾'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (isEditing && pet) {
        await updatePet.mutateAsync({
          id: pet.id,
          name: formData.name,
          species: formData.species,
          breed: formData.breed || null,
          age: formData.age ? parseInt(formData.age) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          microchip: formData.microchip || null,
          available_for_breeding: formData.available_for_breeding,
          image_url: imageUrl,
        })
      } else {
        await createPet.mutateAsync({
          name: formData.name,
          species: formData.species,
          breed: formData.breed || null,
          age: formData.age ? parseInt(formData.age) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          microchip: formData.microchip || null,
          available_for_breeding: formData.available_for_breeding,
          image_url: imageUrl,
          owner_id: ownerId,
        })
      }
      onClose()
    } catch (error) {
      console.error('Error saving pet:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Mascota' : 'Agregar Mascota'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pet Image Section */}
          <div className="space-y-4">
            <Label>Foto de la Mascota</Label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                {imageUrl || previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl || imageUrl || ''}
                      alt="Pet"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-2xl border-2 border-gray-200">
                    {getPetEmoji(formData.species)}
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="pet-image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {imageUrl || previewUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500">
                  JPG, PNG o GIF. Máximo 50MB.
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre de la mascota"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="species">Especie</Label>
              <Select value={formData.species} onValueChange={(value) => setFormData(prev => ({ ...prev, species: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dog">Perro</SelectItem>
                  <SelectItem value="Cat">Gato</SelectItem>
                  <SelectItem value="Bird">Ave</SelectItem>
                  <SelectItem value="Fish">Pez</SelectItem>
                  <SelectItem value="Other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="breed">Raza</Label>
              {formData.species === 'Dog' ? (
                <Select 
                  value={formData.breed} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, breed: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una raza" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {dogBreeds.map((breed) => (
                      <SelectItem key={breed} value={breed}>
                        {breed}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="breed"
                  value={formData.breed}
                  onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                  placeholder="Raza de la mascota"
                />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Edad (años)</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="0.0"
                  min="0"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="microchip">Microchip</Label>
              <Input
                id="microchip"
                value={formData.microchip}
                onChange={(e) => setFormData(prev => ({ ...prev, microchip: e.target.value }))}
                placeholder="Número de microchip"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="available_for_breeding"
                checked={formData.available_for_breeding}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available_for_breeding: checked as boolean }))}
              />
              <Label htmlFor="available_for_breeding">Disponible para reproducción</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createPet.isPending || updatePet.isPending || uploading}>
              {(createPet.isPending || updatePet.isPending || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default PetModal
