import React, { useState, useEffect, useRef } from 'react';
import { Settings, User, LogOut, Users, Building2, Home, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface SettingsDropdownProps {
  className?: string;
  variant?: 'gradient' | 'default';
}

const SettingsDropdown: React.FC<SettingsDropdownProps> = ({ className = "", variant = 'gradient' }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showRoleSubmenu, setShowRoleSubmenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem('user_role');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowRoleSubmenu(false);
        if (submenuTimeoutRef.current) {
          clearTimeout(submenuTimeoutRef.current);
          submenuTimeoutRef.current = null;
        }
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submenuTimeoutRef.current) {
        clearTimeout(submenuTimeoutRef.current);
      }
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.removeItem('user_role');
      localStorage.removeItem('is_new_user');
      toast.success('Sesión cerrada correctamente');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const handleRoleChange = async (role: 'client' | 'provider' | 'shelter') => {
    setShowDropdown(false);
    
    // Save to localStorage first (for immediate access)
    localStorage.setItem('user_role', role);
    
    // Update database if user is authenticated
    if (user) {
      try {
        // Check if user profile exists
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existingProfile) {
          // Update existing profile
          await supabase
            .from('user_profiles')
            .update({ 
              role: role,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
        } else {
          // Create new profile with role
          await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              role: role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
      } catch (error) {
        console.error('Error updating role in database:', error);
        // Still allow navigation even if database update fails
      }
    }
    
    // Navigate to appropriate dashboard
    switch (role) {
      case 'client':
        navigate('/dashboard');
        toast.success('Cambiado a dashboard de cliente');
        break;
      case 'provider':
        navigate('/provider');
        toast.success('Cambiado a dashboard de proveedor');
        break;
      case 'shelter':
        navigate('/shelter-dashboard');
        toast.success('Cambiado a dashboard de albergue');
        break;
    }
    
    // Reload page to ensure all components update with new role
    window.location.reload();
  };

  const roleOptions = [
    {
      icon: Home,
      label: 'Cliente',
      role: 'client' as const,
      onClick: () => handleRoleChange('client')
    },
    {
      icon: Users,
      label: 'Proveedor',
      role: 'provider' as const,
      onClick: () => handleRoleChange('provider')
    },
    {
      icon: Building2,
      label: 'Albergue',
      role: 'shelter' as const,
      onClick: () => handleRoleChange('shelter')
    }
  ];

  const handleProfileClick = () => {
    setShowDropdown(false);
    
    // Navigate based on current role
    switch (userRole) {
      case 'client':
        navigate('/ajustes');
        break;
      case 'provider':
        // Store the active tab in localStorage for ProviderDashboard to pick up
        try {
          localStorage.setItem('providerDashboardActiveTab', 'profile');
        } catch {
          // ignore storage errors
        }
        // Navigate to provider dashboard (only if not already there)
        if (location.pathname !== '/provider') {
          navigate('/provider');
        } else {
          // If already on provider dashboard, dispatch event to change tab
          window.dispatchEvent(new CustomEvent('providerDashboardTabChange', { detail: 'profile' }));
          // Also reload as fallback
          setTimeout(() => window.location.reload(), 100);
        }
        break;
      case 'shelter':
        // Store the active tab in localStorage for ShelterDashboard to pick up
        try {
          localStorage.setItem('shelterDashboardActiveTab', 'profile');
        } catch {
          // ignore storage errors
        }
        // Navigate to shelter dashboard (only if not already there)
        if (location.pathname !== '/shelter-dashboard') {
          navigate('/shelter-dashboard');
        } else {
          // If already on shelter dashboard, dispatch event to change tab
          window.dispatchEvent(new CustomEvent('shelterDashboardTabChange', { detail: 'profile' }));
          // Also reload as fallback
          setTimeout(() => window.location.reload(), 100);
        }
        break;
      default:
        navigate('/ajustes');
    }
  };

  const menuItems = [
    {
      icon: User,
      label: 'Mi Perfil',
      onClick: handleProfileClick
    },
    {
      icon: Settings,
      label: 'Cambiar de Rol',
      hasSubmenu: true,
      onClick: () => setShowRoleSubmenu(!showRoleSubmenu)
    },
    {
      icon: LogOut,
      label: 'Cerrar Sesión',
      onClick: handleSignOut,
      className: 'text-red-600 hover:text-red-700'
    }
  ];

  const buttonClassName = variant === 'gradient' 
    ? "bg-white/20 text-white border-white/40 hover:bg-white/30 hover:text-white backdrop-blur-sm p-2"
    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 p-2";

  return (
    <div className={`relative settings-dropdown ${className}`} ref={dropdownRef}>
      <Button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        variant="outline"
        size="sm"
        className={buttonClassName}
      >
        <Settings className="w-4 h-4" />
      </Button>
      
      {/* Settings Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="py-2">
            {menuItems.map((item, index) => {
              const handleMouseEnterSubmenu = () => {
                if (submenuTimeoutRef.current) {
                  clearTimeout(submenuTimeoutRef.current);
                  submenuTimeoutRef.current = null;
                }
                if (item.hasSubmenu) {
                  setShowRoleSubmenu(true);
                }
              };

              const handleMouseLeaveSubmenu = () => {
                if (item.hasSubmenu) {
                  submenuTimeoutRef.current = setTimeout(() => {
                    setShowRoleSubmenu(false);
                  }, 200); // Delay de 200ms antes de cerrar
                }
              };

              return (
                <div 
                  key={index} 
                  className="relative"
                  onMouseEnter={handleMouseEnterSubmenu}
                  onMouseLeave={handleMouseLeaveSubmenu}
                >
                  <button
                    onClick={item.hasSubmenu ? () => {
                      setShowRoleSubmenu(!showRoleSubmenu);
                      if (submenuTimeoutRef.current) {
                        clearTimeout(submenuTimeoutRef.current);
                        submenuTimeoutRef.current = null;
                      }
                    } : item.onClick}
                    className={`
                      w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors
                      ${item.className || ''}
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.hasSubmenu && (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  {/* Role Submenu */}
                  {item.hasSubmenu && showRoleSubmenu && (
                    <div 
                      className="absolute right-full top-0 mr-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-[60]"
                      onMouseEnter={handleMouseEnterSubmenu}
                      onMouseLeave={handleMouseLeaveSubmenu}
                    >
                    <div className="py-2">
                      {roleOptions.map((roleOption, roleIndex) => (
                        <button
                          key={roleIndex}
                          onClick={roleOption.onClick}
                          className={`
                            w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors
                            ${userRole === roleOption.role ? 'bg-blue-50 text-blue-700' : ''}
                          `}
                        >
                          <div className="flex items-center space-x-3">
                            <roleOption.icon className="w-4 h-4" />
                            <span>{roleOption.label}</span>
                          </div>
                          {userRole === roleOption.role && (
                            <span className="text-xs text-blue-600 font-medium">Actual</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsDropdown;
