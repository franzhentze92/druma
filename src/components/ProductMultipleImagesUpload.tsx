import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Image as ImageIcon, Upload, X, Eye, EyeOff, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface ProductMultipleImagesUploadProps {
  mainImageUrl?: string;
  secondaryImages?: string[];
  onMainImageUpload: (url: string | null) => void;
  onSecondaryImagesChange: (urls: string[]) => void;
  disabled?: boolean;
}

export const ProductMultipleImagesUpload: React.FC<ProductMultipleImagesUploadProps> = ({
  mainImageUrl,
  secondaryImages = [],
  onMainImageUpload,
  onSecondaryImagesChange,
  disabled = false
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  const MAX_SECONDARY_IMAGES = 5;

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    if (!user) throw new Error('Usuario no autenticado');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Por favor selecciona solo archivos de imagen.');
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('El archivo es demasiado grande. El tamaño máximo es 50MB.');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `product-images/${fileName}`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  }, [user]);

  const onDropMain = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !user) return;

    try {
      setUploading(true);
      const publicUrl = await uploadImage(acceptedFiles[0]);
      onMainImageUpload(publicUrl);
      toast.success('Imagen principal subida correctamente');
    } catch (error: any) {
      console.error('Error uploading main image:', error);
      toast.error(error.message || 'Error al subir la imagen principal');
    } finally {
      setUploading(false);
    }
  }, [user, uploadImage, onMainImageUpload]);

  const onDropSecondary = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !user) return;

    const remainingSlots = MAX_SECONDARY_IMAGES - secondaryImages.length;
    if (remainingSlots <= 0) {
      toast.error(`Ya has alcanzado el máximo de ${MAX_SECONDARY_IMAGES} imágenes secundarias`);
      return;
    }

    const filesToUpload = acceptedFiles.slice(0, remainingSlots);
    const newUrls: string[] = [];

    try {
      setUploading(true);
      
      for (let i = 0; i < filesToUpload.length; i++) {
        setUploadingIndex(i);
        const publicUrl = await uploadImage(filesToUpload[i]);
        newUrls.push(publicUrl);
      }

      onSecondaryImagesChange([...secondaryImages, ...newUrls]);
      toast.success(`${newUrls.length} imagen(es) secundaria(s) subida(s) correctamente`);
    } catch (error: any) {
      console.error('Error uploading secondary images:', error);
      toast.error(error.message || 'Error al subir las imágenes secundarias');
    } finally {
      setUploading(false);
      setUploadingIndex(null);
    }
  }, [user, uploadImage, secondaryImages, onSecondaryImagesChange]);

  const { getRootProps: getMainRootProps, getInputProps: getMainInputProps, isDragActive: isMainDragActive } = useDropzone({
    onDrop: onDropMain,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: disabled || uploading
  });

  const { getRootProps: getSecondaryRootProps, getInputProps: getSecondaryInputProps, isDragActive: isSecondaryDragActive } = useDropzone({
    onDrop: onDropSecondary,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: MAX_SECONDARY_IMAGES,
    disabled: disabled || uploading || secondaryImages.length >= MAX_SECONDARY_IMAGES
  });

  const handleRemoveMainImage = () => {
    onMainImageUpload(null);
    toast.success('Imagen principal eliminada');
  };

  const handleRemoveSecondaryImage = (index: number) => {
    const newImages = secondaryImages.filter((_, i) => i !== index);
    onSecondaryImagesChange(newImages);
    toast.success('Imagen secundaria eliminada');
  };

  const handleSetAsMain = (url: string) => {
    // Move secondary image to main
    const newSecondary = secondaryImages.filter(img => img !== url);
    onMainImageUpload(url);
    onSecondaryImagesChange(newSecondary);
    toast.success('Imagen establecida como principal');
  };

  return (
    <div className="space-y-6">
      {/* Main Image Section */}
      <div>
        <Label className="text-base font-semibold mb-3 block">
          <Star className="w-4 h-4 inline mr-2" />
          Imagen Principal
        </Label>
        
        {mainImageUrl && (
          <div className="mb-4 space-y-2">
            <div className="relative group">
              <img
                src={mainImageUrl}
                alt="Imagen principal del producto"
                className="w-full h-48 object-cover rounded-lg border-2 border-emerald-500"
              />
              <div className="absolute top-2 right-2 flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(showPreview === mainImageUrl ? null : mainImageUrl)}
                  disabled={disabled}
                  className="bg-white/90 hover:bg-white"
                >
                  {showPreview === mainImageUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveMainImage}
                  disabled={disabled}
                  className="bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="absolute bottom-2 left-2">
                <Badge className="bg-emerald-500 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Principal
                </Badge>
              </div>
            </div>
          </div>
        )}

        <Card className={`border-2 border-dashed transition-colors ${
          isMainDragActive 
            ? 'border-emerald-400 bg-emerald-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}>
          <CardContent className="p-4">
            <div {...getMainRootProps()} className="text-center cursor-pointer">
              <input {...getMainInputProps()} />
              
              <div className="flex flex-col items-center space-y-2">
                <div className={`p-2 rounded-full ${
                  isMainDragActive ? 'bg-emerald-100' : 'bg-gray-100'
                }`}>
                  {uploading && uploadingIndex === null ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600" />
                  ) : (
                    <Upload className={`h-6 w-6 ${
                      isMainDragActive ? 'text-emerald-600' : 'text-gray-600'
                    }`} />
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {uploading && uploadingIndex === null ? 'Subiendo imagen...' : 'Subir imagen principal'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {isMainDragActive 
                      ? 'Suelta la imagen aquí' 
                      : 'Arrastra y suelta o haz clic para seleccionar'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Images Section */}
      <div>
        <Label className="text-base font-semibold mb-3 block">
          Imágenes Secundarias ({secondaryImages.length}/{MAX_SECONDARY_IMAGES})
        </Label>

        {secondaryImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {secondaryImages.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Imagen secundaria ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetAsMain(url)}
                      disabled={disabled}
                      className="bg-white/90 hover:bg-white"
                      title="Establecer como principal"
                    >
                      <Star className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveSecondaryImage(index)}
                      disabled={disabled}
                      className="bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {secondaryImages.length < MAX_SECONDARY_IMAGES && (
          <Card className={`border-2 border-dashed transition-colors ${
            isSecondaryDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}>
            <CardContent className="p-4">
              <div {...getSecondaryRootProps()} className="text-center cursor-pointer">
                <input {...getSecondaryInputProps()} />
                
                <div className="flex flex-col items-center space-y-2">
                  <div className={`p-2 rounded-full ${
                    isSecondaryDragActive ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {uploading && uploadingIndex !== null ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    ) : (
                      <ImageIcon className={`h-6 w-6 ${
                        isSecondaryDragActive ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {uploading && uploadingIndex !== null 
                        ? `Subiendo imagen ${uploadingIndex + 1}...` 
                        : `Subir imágenes secundarias (${MAX_SECONDARY_IMAGES - secondaryImages.length} restantes)`
                      }
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isSecondaryDragActive 
                        ? 'Suelta las imágenes aquí' 
                        : 'Arrastra y suelta o haz clic para seleccionar'
                      }
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Puedes subir hasta {MAX_SECONDARY_IMAGES - secondaryImages.length} imagen(es) más
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {secondaryImages.length >= MAX_SECONDARY_IMAGES && (
          <p className="text-sm text-gray-500 text-center py-2">
            Has alcanzado el máximo de {MAX_SECONDARY_IMAGES} imágenes secundarias
          </p>
        )}
      </div>
    </div>
  );
};

