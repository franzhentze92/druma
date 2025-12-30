import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, PawPrint, Heart, MessageCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const LandingNavbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Inicio', href: '/', icon: PawPrint },
    { name: 'Nosotros', href: '/about', icon: Heart },
    { name: 'Características', href: '/features', icon: Zap },
    { name: 'FAQ', href: '/faqs', icon: MessageCircle },
    { name: 'Contacto', href: '/contact', icon: MessageCircle },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-purple-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">PetHub</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive(item.href)
                      ? 'text-purple-600 bg-purple-50 shadow-sm'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50 hover:shadow-sm'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link to="/login">
              <Button variant="outline" className="text-purple-600 hover:text-white border-purple-600 hover:bg-purple-600 transition-all duration-300 font-medium">
                Iniciar Sesión
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-medium">
                Registrarse
                <Badge className="ml-2 bg-white/20 text-white text-xs px-2 py-0.5">Gratis</Badge>
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 backdrop-blur-sm border-t border-purple-100">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 ${
                  isActive(item.href)
                    ? 'text-purple-600 bg-purple-50 shadow-sm'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50 hover:shadow-sm'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
            <div className="pt-4 space-y-3">
              <Link to="/login">
                <Button variant="outline" className="w-full text-purple-600 hover:text-white border-purple-600 hover:bg-purple-600 transition-all duration-300 font-medium">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link to="/register">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium">
                  Registrarse
                  <Badge className="ml-2 bg-white/20 text-white text-xs px-2 py-0.5">Gratis</Badge>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
