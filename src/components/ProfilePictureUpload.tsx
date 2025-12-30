import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  onImageChange: (file: File) => void;
  onImageRemove?: () => void;
  disabled?: boolean;
  className?: string;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImageUrl,
  onImageChange,
  onImageRemove,
  disabled = false,
  className
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      onImageChange(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageRemove) {
      onImageRemove();
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Label htmlFor="profile-picture" className="text-sm font-medium">
        Foto de Perfil *
      </Label>
      
      <div className="flex items-center space-x-4">
        {/* Profile Picture Display */}
        <div className="relative">
          <Avatar className="w-24 h-24 border-2 border-gray-200">
            <AvatarImage 
              src={previewUrl || currentImageUrl} 
              alt="Profile picture"
              className="object-cover"
            />
            <AvatarFallback className="text-lg">
              <Camera className="w-8 h-8" />
            </AvatarFallback>
          </Avatar>
          
          {/* Remove button */}
          {previewUrl && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
              onClick={handleRemoveImage}
              disabled={disabled}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Upload Area */}
        <div className="flex-1">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              isDragging
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-300 hover:border-gray-400",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={disabled}
            />
            
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">
                  <button
                    type="button"
                    onClick={openFileDialog}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                    disabled={disabled}
                  >
                    Haz clic para subir
                  </button>
                  {" "}o arrastra y suelta
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG hasta 50MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help text */}
      <p className="text-xs text-gray-500">
        La foto de perfil es obligatoria y debe ser una imagen clara de tu negocio o logo.
      </p>
    </div>
  );
};

export default ProfilePictureUpload;
