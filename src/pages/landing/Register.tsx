import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Lock, User, PawPrint, ArrowLeft, Home, Phone, Building2, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export const Register: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '' as 'client' | 'provider' | 'shelter' | '',
    acceptTerms: false,
    acceptMarketing: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) {
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (!formData.acceptTerms) {
      toast({
        title: "Error",
        description: "Debes aceptar los términos y condiciones",
        variant: "destructive",
      });
      return;
    }

    if (!formData.role) {
      toast({
        title: "Error",
        description: "Debes seleccionar un tipo de cuenta",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Clear any existing role from localStorage to ensure fresh start
      localStorage.removeItem('user_role');
      
      // Create user account with Supabase Auth
      const signUpData = await signUp(formData.email, formData.password);
      console.log('Register: Sign up data received:', signUpData);
      
      // Get the user from signUp result (more reliable than getUser when email confirmation is required)
      const user = signUpData?.user;
      console.log('Register: User from signUp:', user);
      
      // Store registration data temporarily to create profile after email confirmation
      const registrationData = {
        full_name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone || null,
        role: formData.role
      };
      
      // Save registration data to localStorage (will be used after email confirmation)
      localStorage.setItem('pending_profile_data', JSON.stringify(registrationData));
      
      // Save the selected role to localStorage
      localStorage.setItem('user_role', formData.role);
      
      // Set a flag to indicate this is a new user
      localStorage.setItem('is_new_user', 'true');
      
      // Note: Profile will be created when user logs in after email confirmation
      // This avoids RLS issues when there's no active session
      
      toast({
        title: "¡Cuenta creada exitosamente!",
        description: "Tu cuenta ha sido creada. Revisa tu email para confirmar tu cuenta antes de iniciar sesión.",
      });
      
      // Redirect to login page
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      let errorMessage = "Error al crear la cuenta";
      
      if (error.status === 429 || error.message?.includes('Too Many Requests')) {
        errorMessage = "Has intentado registrarte demasiadas veces. Por favor espera unos momentos antes de intentar de nuevo.";
      } else if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
        errorMessage = "Este email ya está registrado. Por favor inicia sesión o usa otro email.";
      } else if (error.message?.includes('rate limit') || error.message?.includes('security purposes')) {
        const waitTime = error.message.match(/\d+/)?.[0] || 'algunos';
        errorMessage = `Por seguridad, debes esperar ${waitTime} segundos antes de intentar registrarte de nuevo.`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error de Registro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center p-4">
      {/* BACK TO HOME BUTTON */}
      <div className="absolute top-6 left-6 z-50">
        <Link 
          to="/" 
          className="group flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-purple-200 rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white"
        >
          <Home className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
          <span className="text-gray-700 font-medium group-hover:text-purple-600 transition-colors">
            Volver al Inicio
          </span>
        </Link>
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl mb-4 md:mb-6 shadow-lg">
            <PawPrint className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            ¡Únete a PetHub!
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Crea tu cuenta y comienza a cuidar a tus mascotas
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
                  Nombre *
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                  </div>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="pl-10 md:pl-12 h-11 md:h-12 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
                  Apellido *
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                  </div>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="pl-10 md:pl-12 h-11 md:h-12 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    placeholder="Tu apellido"
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Correo Electrónico *
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 md:pl-12 h-11 md:h-12 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                Teléfono
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                </div>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="pl-10 md:pl-12 h-11 md:h-12 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">
                Tipo de Cuenta *
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'client' }))}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.role === 'client'
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300 bg-white'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      formData.role === 'client'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'bg-gray-100'
                    }`}>
                      <User className={`w-6 h-6 ${formData.role === 'client' ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      formData.role === 'client' ? 'text-purple-700' : 'text-gray-600'
                    }`}>
                      Cliente
                    </span>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'provider' }))}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.role === 'provider'
                      ? 'border-emerald-500 bg-emerald-50 shadow-md'
                      : 'border-gray-200 hover:border-emerald-300 bg-white'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      formData.role === 'provider'
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                        : 'bg-gray-100'
                    }`}>
                      <Building2 className={`w-6 h-6 ${formData.role === 'provider' ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      formData.role === 'provider' ? 'text-emerald-700' : 'text-gray-600'
                    }`}>
                      Proveedor
                    </span>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'shelter' }))}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.role === 'shelter'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      formData.role === 'shelter'
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-600'
                        : 'bg-gray-100'
                    }`}>
                      <Heart className={`w-6 h-6 ${formData.role === 'shelter' ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      formData.role === 'shelter' ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      Albergue
                    </span>
                  </div>
                </button>
              </div>
              {!formData.role && (
                <p className="text-xs text-red-500">Debes seleccionar un tipo de cuenta</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Contraseña *
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 md:pl-12 pr-10 md:pr-12 h-11 md:h-12 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="Crea una contraseña segura"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 md:h-5 md:w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 md:h-5 md:w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Mínimo 8 caracteres, incluyendo mayúsculas, minúsculas y números
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                Confirmar Contraseña *
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-12 pr-12 h-12 text-base border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="Confirma tu contraseña"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, acceptTerms: checked as boolean }))
                  }
                  className="mt-1"
                />
                <Label htmlFor="acceptTerms" className="text-sm text-gray-600 leading-relaxed">
                  Acepto los{' '}
                  <Link to="/terms" className="text-purple-600 hover:text-purple-700 font-medium">
                    Términos y Condiciones
                  </Link>
                  {' '}y la{' '}
                  <Link to="/privacy" className="text-purple-600 hover:text-purple-700 font-medium">
                    Política de Privacidad
                  </Link>
                  {' '}*
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acceptMarketing"
                  name="acceptMarketing"
                  checked={formData.acceptMarketing}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, acceptMarketing: checked as boolean }))
                  }
                  className="mt-1"
                />
                <Label htmlFor="acceptMarketing" className="text-sm text-gray-600 leading-relaxed">
                  Me gustaría recibir noticias y actualizaciones sobre PetHub (opcional)
                </Label>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit"
              disabled={isSubmitting || !formData.acceptTerms || !formData.role || !formData.password || !formData.confirmPassword || formData.password !== formData.confirmPassword}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </form>
        </div>

        {/* Sign In Link */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link 
              to="/login" 
              className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};