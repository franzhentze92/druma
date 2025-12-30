import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Lock, PawPrint, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export const Login: React.FC = () => {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // Handle email confirmation callback from URL
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (type === 'signup' && accessToken && refreshToken) {
        try {
          console.log('Login: Handling email confirmation callback...');
          // Set the session with the tokens from the URL
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }

          // Clear the URL hash
          window.history.replaceState({}, document.title, window.location.pathname);
          
          toast({
            title: "¡Email confirmado!",
            description: "Tu email ha sido confirmado exitosamente. Redirigiendo...",
          });

          // Wait a moment for the session to be set, then redirect based on role
          setTimeout(() => {
            const role = localStorage.getItem('user_role') as 'client' | 'provider' | 'shelter' | null;
            console.log('Login: Email confirmed, checking role for redirect:', role);
            
            if (role) {
              // Redirect directly to the appropriate dashboard
              switch (role) {
                case 'client':
                  navigate('/marketplace/products');
                  break;
                case 'provider':
                  navigate('/provider');
                  break;
                case 'shelter':
                  navigate('/shelter-dashboard');
                  break;
                default:
                  navigate('/app');
              }
            } else {
              // No role found, go to role selection
              navigate('/role');
            }
          }, 1000);
        } catch (error: any) {
          console.error('Error confirming email:', error);
          toast({
            title: "Error al confirmar email",
            description: error.message || "El enlace de confirmación no es válido o ha expirado",
            variant: "destructive",
          });
        }
      }
    };

    handleEmailConfirmation();
  }, [navigate, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await signIn(formData.email, formData.password);
      
      // Check if email is confirmed
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser && !currentUser.email_confirmed_at) {
        toast({
          title: "Email no confirmado",
          description: "Por favor confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.",
          variant: "destructive",
        });
        // Sign out the user since email is not confirmed
        await supabase.auth.signOut();
        return;
      }
      
      // Check if user has a role from registration (don't clear it if it exists)
      let role = localStorage.getItem('user_role') as 'client' | 'provider' | 'shelter' | null;
      
      // If no role in localStorage, try to get it from the database
      if (!role && currentUser) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', currentUser.id)
          .single();
        
        if (profile?.role) {
          role = profile.role;
          localStorage.setItem('user_role', role);
        }
      }
      
      // Only clear role if user explicitly wants to change it (not on normal login)
      // For now, we keep the role from registration
      
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión exitosamente",
      });
      
      // Redirect based on role
      if (role) {
        switch (role) {
          case 'client':
            navigate('/marketplace/products');
            break;
          case 'provider':
            navigate('/provider');
            break;
          case 'shelter':
            navigate('/shelter-dashboard');
            break;
          default:
            navigate('/app');
        }
      } else {
        // No role found, go to role selection
        navigate('/role');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Check for specific error messages
      let errorMessage = error.message || "Error al iniciar sesión";
      
      if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
        errorMessage = "Por favor confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
            ¡Bienvenido de vuelta!
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Inicia sesión para acceder a tu cuenta de PetHub
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Correo Electrónico
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
                  className="pl-10 md:pl-12 h-12 md:h-14 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Contraseña
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
                  className="pl-10 md:pl-12 pr-10 md:pr-12 h-12 md:h-14 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="Tu contraseña"
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
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
                  }
                />
                <Label htmlFor="rememberMe" className="text-xs md:text-sm text-gray-600">
                  Recordarme
                </Label>
              </div>
              <Link 
                to="/forgot-password" 
                className="text-xs md:text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-12 md:h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm md:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Iniciar Sesión
            </Button>
          </form>

        </div>

        {/* Sign Up Link */}
        <div className="text-center mt-6 md:mt-8">
          <p className="text-sm md:text-base text-gray-600">
            ¿No tienes una cuenta?{' '}
            <Link 
              to="/register" 
              className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
