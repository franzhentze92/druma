import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Activity, 
  ShoppingBag, 
  Heart, 
  Settings,
  Package,
  Clock,
  Stethoscope,
  Bell,
  X,
  Menu,
  Plus,
  PawPrint,
  Search,
  Users,
  HeartHandshake,
  Utensils,
  Dumbbell,
  Wrench,
  ShoppingCart,
  MessageCircle,
  Scissors
} from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { useNavigation } from '@/contexts/NavigationContext';

const Navigation: React.FC = () => {
  const { activeSection, setActiveSection } = useAppContext();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useNavigation();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedButton, setExpandedButton] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  console.log('Navigation: Component rendered, location.pathname:', location.pathname);

  // Close expanded menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setExpandedButton(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = [
    { id: 'pet-room', label: 'Mi Mascota', icon: Heart, color: 'from-pink-500 to-purple-600' },
    { id: 'dashboard', label: 'Inicio', icon: Home, color: 'from-blue-500 to-purple-600' },
    { id: 'trazabilidad', label: 'Ejercicio', icon: Activity, color: 'from-green-500 to-teal-600' },
    { id: 'feeding-schedules', label: 'Nutrición', icon: Clock, color: 'from-emerald-500 to-green-600' },
    { id: 'veterinaria', label: 'Veterinaria', icon: Stethoscope, color: 'from-red-500 to-pink-600' },
    { id: 'recordatorios', label: 'Recordatorios', icon: Bell, color: 'from-purple-500 to-indigo-600' },
    { id: 'parejas', label: 'Parejas', icon: Heart, color: 'from-pink-500 to-purple-600' },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, color: 'from-orange-500 to-red-600' },
    { id: 'orders', label: 'Órdenes', icon: Package, color: 'from-indigo-500 to-blue-600' },
    { id: 'adopcion', label: 'Adopción', icon: Heart, color: 'from-purple-500 to-pink-600' },
    { id: 'mascotas-perdidas', label: 'Mascotas Perdidas', icon: Search, color: 'from-orange-500 to-red-600' },
    { id: 'ajustes', label: 'Ajustes', icon: Settings, color: 'from-gray-500 to-slate-600' },
  ];

  // Care sub-options
  const careOptions = [
    { id: 'nutrition', label: 'Nutrición', icon: Utensils, color: 'from-orange-500 to-red-500', path: '/feeding-schedules' },
    { id: 'exercise', label: 'Ejercicio', icon: Activity, color: 'from-green-500 to-blue-500', path: '/trazabilidad' },
    { id: 'veterinary', label: 'Veterinaria', icon: Stethoscope, color: 'from-blue-500 to-purple-500', path: '/veterinaria' },
    { id: 'recordatorios', label: 'Recordatorios', icon: Bell, color: 'from-purple-500 to-indigo-500', path: '/recordatorios' },
  ];

  // Shop sub-options
  const shopOptions = [
    { id: 'products', label: 'Productos', icon: Package, color: 'from-green-500 to-emerald-500', path: '/marketplace/products' },
    { id: 'services', label: 'Servicios', icon: Scissors, color: 'from-blue-500 to-cyan-500', path: '/marketplace/services' },
    { id: 'orders', label: 'Mis Órdenes', icon: ShoppingCart, color: 'from-purple-500 to-indigo-500', path: '/client-orders' },
  ];

  // Social sub-options
  const socialOptions = [
    { id: 'adopcion', label: 'Adopción', icon: Heart, color: 'from-green-500 to-emerald-500', path: '/adopcion' },
    { id: 'parejas', label: 'Parejas', icon: HeartHandshake, color: 'from-rose-500 to-pink-500', path: '/parejas' },
    { id: 'mascotas-perdidas', label: 'Mascotas Perdidas', icon: Search, color: 'from-orange-500 to-red-500', path: '/mascotas-perdidas' },
  ];

  // Simplified navigation items for bottom menu (mobile-first game-like navigation)
  const bottomNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'from-blue-500 to-purple-600', path: '/dashboard' },
    { id: 'shop', label: 'Tienda', icon: ShoppingBag, color: 'from-orange-500 to-red-600', expandable: true },
    { id: 'care', label: 'Cuidado', icon: Heart, color: 'from-pink-500 to-purple-600', expandable: true },
    { id: 'social', label: 'Social', icon: PawPrint, color: 'from-blue-500 to-cyan-600', expandable: true },
    { id: 'profile', label: 'Ajustes', icon: Settings, color: 'from-gray-500 to-slate-600', path: '/ajustes' },
  ];


  return (
    <>

      {/* Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Navigation Menu - Slide from Left (Visible on all screens for testing) */}
      {isMobileMenuOpen && (
        <div className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl">
                  <PawPrint size={20} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">PetHub</h2>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto p-4 pb-20">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'pet-room') {
                        window.location.href = '/pet-room';
                      } else {
                        setActiveSection(item.id);
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className={`
                      w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 text-left
                      ${activeSection === item.id 
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg` 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <item.icon size={24} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation - Simplified Layout - Always Fixed */}
      <div 
        ref={navRef} 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl md:block"
        style={{ height: '80px', boxSizing: 'border-box' }}
      >
        <div className="flex justify-around items-center h-full py-2 px-1">
          {/* Navigation items */}
          {bottomNavItems.map((item) => (
            <div key={item.id} className="relative flex-1">
              <button
                onClick={() => {
                  if (item.expandable) {
                    setExpandedButton(expandedButton === item.id ? null : item.id);
                  } else if (item.path) {
                    navigate(item.path);
                  } else {
                    setActiveSection(item.id);
                  }
                }}
                className={`
                  w-full flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-0
                  ${(location.pathname === item.path || 
                      (item.id === 'shop' && location.pathname.startsWith('/marketplace')) || 
                      (item.id === 'dashboard' && location.pathname === '/dashboard') ||
                      (item.id === 'social' && (location.pathname === '/adopcion' || location.pathname === '/parejas' || location.pathname === '/mascotas-perdidas')))
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg transform scale-105` 
                    : 'text-gray-500 hover:text-gray-700'
                  }
                  ${expandedButton === item.id ? `bg-gradient-to-r ${item.color} text-white shadow-lg` : ''}
                `}
              >
                <item.icon size={18} className="mb-1" />
                <span className="text-xs font-medium truncate leading-tight">{item.label}</span>
              </button>
              
              {/* Expanded Options */}
              {item.expandable && expandedButton === item.id && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[200px]">
                  {(item.id === 'care' ? careOptions : 
                    item.id === 'social' ? socialOptions : 
                    shopOptions).map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        navigate(option.path);
                        setExpandedButton(null);
                      }}
                      className={`
                        w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 text-left
                        ${location.pathname === option.path 
                          ? `bg-gradient-to-r ${option.color} text-white shadow-md` 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <option.icon size={16} />
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </>
  );
};

export default Navigation;