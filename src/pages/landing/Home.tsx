import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  PawPrint, Heart, Users, Shield, Zap, Globe, ArrowRight, 
  Star, CheckCircle, TrendingUp, Award, Clock, MapPin, 
  Smartphone, Database, Lock, Bell, Calendar, FileText,
  ShoppingCart, CreditCard, Headphones, MessageCircle, ShoppingBag,
  Monitor, Tablet, Smartphone as Mobile, Play
} from 'lucide-react';

export const Home: React.FC = () => {
  const heroFeatures = [
    { icon: Users, text: '10,000+ Mascotas Rescatadas' },
    { icon: Heart, text: '5,000+ Familias Felices' },
    { icon: Shield, text: '100% Seguro y Confiable' },
    { icon: Globe, text: 'Cobertura Nacional' }
  ];

  const mainFeatures = [
    {
      icon: PawPrint,
      title: 'Trazabilidad Completa',
      description: 'Seguimiento detallado de la salud, nutrición y actividad física de tus mascotas con tecnología avanzada.',
      benefits: ['Historial médico completo', 'Recordatorios de vacunas', 'Seguimiento de peso', 'Actividad física'],
      color: 'from-blue-500 to-cyan-500',
      highlight: true
    },
    {
      icon: Heart,
      title: 'Adopción Responsable',
      description: 'Conectamos mascotas necesitadas con familias amorosas y comprometidas con el bienestar animal.',
      benefits: ['Proceso de adopción seguro', 'Evaluación de compatibilidad', 'Seguimiento post-adopción', 'Soporte continuo'],
      color: 'from-pink-500 to-rose-500',
      highlight: true
    },
    {
      icon: Users,
      title: 'Comunidad Pet-Friendly',
      description: 'Red de veterinarios, proveedores y dueños comprometidos con el bienestar animal.',
      benefits: ['Red de expertos', 'Eventos comunitarios', 'Foros de discusión', 'Compartir experiencias'],
      color: 'from-green-500 to-emerald-500',
      highlight: true
    },
    {
      icon: ShoppingBag,
      title: 'Marketplace Integrado',
      description: 'Acceso directo a productos y servicios veterinarios de calidad con entrega garantizada.',
      benefits: ['Productos verificados', 'Entrega rápida', 'Precios competitivos', 'Reseñas auténticas'],
      color: 'from-orange-500 to-red-500',
      highlight: true
    },
    {
      icon: Shield,
      title: 'Seguridad Garantizada',
      description: 'Protección de datos y transacciones seguras para tu tranquilidad total.',
      benefits: ['Encriptación de datos', 'Transacciones seguras', 'Privacidad protegida', 'Cumplimiento GDPR'],
      color: 'from-purple-500 to-indigo-500',
      highlight: false
    },
    {
      icon: Zap,
      title: 'Servicios Rápidos',
      description: 'Acceso instantáneo a servicios veterinarios y productos para mascotas.',
      benefits: ['Citas en línea', 'Entrega rápida', 'Soporte 24/7', 'Respuesta inmediata'],
      color: 'from-orange-500 to-red-500',
      highlight: false
    },
    {
      icon: Globe,
      title: 'Cobertura Nacional',
      description: 'Disponible en toda Guatemala con servicios locales y de calidad garantizada.',
      benefits: ['Servicios locales', 'Cobertura completa', 'Calidad garantizada', 'Soporte regional'],
      color: 'from-teal-500 to-cyan-500',
      highlight: false
    }
  ];


  const stats = [
    { number: '50,000+', label: 'Mascotas Registradas', icon: PawPrint },
    { number: '15,000+', label: 'Familias Activas', icon: Heart },
    { number: '500+', label: 'Veterinarios', icon: Users },
    { number: '99.9%', label: 'Uptime', icon: Shield }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 py-24 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-purple-100 text-purple-800 border-purple-200">
              🎉 Más de 50,000 mascotas ya confían en PetHub
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 md:mb-8 leading-tight px-4">
              La Plataforma Integral para
              <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 bg-clip-text text-transparent">
                el Cuidado de Mascotas
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 md:mb-10 max-w-4xl mx-auto leading-relaxed px-4">
              PetHub revoluciona el cuidado animal conectando dueños, veterinarios y proveedores 
              en una comunidad comprometida con el bienestar. Desde trazabilidad de salud hasta 
              adopción responsable, todo en un solo lugar con 6 módulos especializados.
            </p>
            
            {/* Hero Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10 max-w-4xl mx-auto px-4">
              {heroFeatures.map((feature, index) => (
                <div key={index} className="flex flex-col items-center text-center p-2">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-2 shadow-lg">
                    <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-gray-700 leading-tight">{feature.text}</span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-base md:text-lg px-6 md:px-8 py-3 md:py-4 h-auto shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 font-semibold">
                  Comenzar Gratis
                  <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </Link>
              <Link to="/features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-3 md:py-4 h-auto border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white transition-all duration-300 font-semibold">
                  Ver Características
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-2">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg">
                  <stat.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 md:mb-2">{stat.number}</div>
                <div className="text-sm md:text-base text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-20">
            <Badge variant="secondary" className="mb-4 md:mb-6 px-3 md:px-4 py-2 text-xs md:text-sm font-medium bg-purple-100 text-purple-800 border-purple-200">
              <Zap className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              Funcionalidades de la Plataforma
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 px-4">
              Todo lo que necesitas para el cuidado de mascotas
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              Una plataforma completa con herramientas especializadas para dueños, proveedores y refugios
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Pet Care Features */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 md:p-8 border border-green-100">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 md:mb-6">
                <Heart className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Cuidado Integral</h3>
              <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-500 mr-2 md:mr-3 flex-shrink-0" />
                  Seguimiento de salud y vacunas
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-500 mr-2 md:mr-3 flex-shrink-0" />
                  Recordatorios de medicamentos
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-500 mr-2 md:mr-3 flex-shrink-0" />
                  Historial médico completo
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-500 mr-2 md:mr-3 flex-shrink-0" />
                  Citas veterinarias programadas
                </li>
              </ul>
            </div>

            {/* Exercise & Activity */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 md:p-8 border border-blue-100">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 md:mb-6">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Ejercicio y Actividad</h3>
              <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-blue-500 mr-2 md:mr-3 flex-shrink-0" />
                  Registro de sesiones de ejercicio
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-blue-500 mr-2 md:mr-3 flex-shrink-0" />
                  Seguimiento de calorías quemadas
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-blue-500 mr-2 md:mr-3 flex-shrink-0" />
                  Análisis de actividad física
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-blue-500 mr-2 md:mr-3 flex-shrink-0" />
                  Metas y objetivos personalizados
                </li>
              </ul>
            </div>

            {/* Nutrition Management */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 md:p-8 border border-orange-100">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4 md:mb-6">
                <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Nutrición Inteligente</h3>
              <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-orange-500 mr-2 md:mr-3 flex-shrink-0" />
                  Horarios de alimentación automática
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-orange-500 mr-2 md:mr-3 flex-shrink-0" />
                  Control de porciones precisas
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-orange-500 mr-2 md:mr-3 flex-shrink-0" />
                  Seguimiento nutricional completo
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-orange-500 mr-2 md:mr-3 flex-shrink-0" />
                  Recomendaciones dietéticas
                </li>
              </ul>
            </div>

            {/* Pet Tinder */}
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 md:p-8 border border-pink-100">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 md:mb-6">
                <Heart className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Pet Tinder</h3>
              <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-pink-500 mr-2 md:mr-3 flex-shrink-0" />
                  Búsqueda de parejas compatibles
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-pink-500 mr-2 md:mr-3 flex-shrink-0" />
                  Perfiles detallados de mascotas
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-pink-500 mr-2 md:mr-3 flex-shrink-0" />
                  Chat con otros dueños
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-pink-500 mr-2 md:mr-3 flex-shrink-0" />
                  Eventos de apareamiento
                </li>
              </ul>
            </div>

            {/* Marketplace */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 md:p-8 border border-indigo-100">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 md:mb-6">
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Marketplace</h3>
              <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-indigo-500 mr-2 md:mr-3 flex-shrink-0" />
                  Productos para mascotas
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-indigo-500 mr-2 md:mr-3 flex-shrink-0" />
                  Servicios veterinarios
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-indigo-500 mr-2 md:mr-3 flex-shrink-0" />
                  Alimentos y accesorios
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-indigo-500 mr-2 md:mr-3 flex-shrink-0" />
                  Entregas a domicilio
                </li>
              </ul>
            </div>

            {/* Adoption System */}
            <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl p-6 md:p-8 border border-teal-100">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-teal-500 to-green-600 rounded-xl flex items-center justify-center mb-4 md:mb-6">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Sistema de Adopción</h3>
              <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-teal-500 mr-2 md:mr-3 flex-shrink-0" />
                  Mascotas disponibles para adopción
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-teal-500 mr-2 md:mr-3 flex-shrink-0" />
                  Proceso de adopción guiado
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-teal-500 mr-2 md:mr-3 flex-shrink-0" />
                  Evaluación de adoptantes
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-teal-500 mr-2 md:mr-3 flex-shrink-0" />
                  Seguimiento post-adopción
                </li>
              </ul>
            </div>

            {/* Business Management */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 md:p-8 border border-amber-100">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center mb-4 md:mb-6">
                <Award className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Gestión de Negocios</h3>
              <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-amber-500 mr-2 md:mr-3 flex-shrink-0" />
                  Analytics y reportes financieros
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-amber-500 mr-2 md:mr-3 flex-shrink-0" />
                  Gestión de inventario
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-amber-500 mr-2 md:mr-3 flex-shrink-0" />
                  Sistema de citas y reservas
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-amber-500 mr-2 md:mr-3 flex-shrink-0" />
                  Reseñas y calificaciones
                </li>
              </ul>
            </div>

            {/* Communication */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 md:p-8 border border-violet-100">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 md:mb-6">
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Comunicación</h3>
              <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-violet-500 mr-2 md:mr-3 flex-shrink-0" />
                  Chat en tiempo real
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-violet-500 mr-2 md:mr-3 flex-shrink-0" />
                  Notificaciones push
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-violet-500 mr-2 md:mr-3 flex-shrink-0" />
                  Recordatorios automáticos
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-violet-500 mr-2 md:mr-3 flex-shrink-0" />
                  Soporte 24/7
                </li>
              </ul>
            </div>

            {/* Security & Privacy */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 md:p-8 border border-gray-100">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-gray-500 to-slate-600 rounded-xl flex items-center justify-center mb-4 md:mb-6">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Seguridad y Privacidad</h3>
              <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-gray-500 mr-2 md:mr-3 flex-shrink-0" />
                  Encriptación de datos
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-gray-500 mr-2 md:mr-3 flex-shrink-0" />
                  Cumplimiento GDPR
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-gray-500 mr-2 md:mr-3 flex-shrink-0" />
                  Verificación de usuarios
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-gray-500 mr-2 md:mr-3 flex-shrink-0" />
                  Backup automático
                </li>
              </ul>
            </div>
          </div>

          {/* CTA for Features */}
          <div className="text-center mt-12 md:mt-16 px-4">
            <Link to="/caracteristicas">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-base md:text-lg px-6 md:px-8 py-3 md:py-4 h-auto shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 font-semibold">
                <Zap className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Ver Todas las Características
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-20">
            <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs md:text-sm font-medium bg-green-100 text-green-800 border-green-200">
              ✨ Características Destacadas
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 px-4">
              ¿Por qué elegir PetHub?
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Ofrecemos las herramientas más avanzadas y la comunidad más comprometida 
              para el cuidado de tus mascotas.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {mainFeatures.filter(f => f.highlight).map((feature, index) => (
              <Card key={index} className={`border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${feature.highlight ? 'ring-2 ring-blue-200' : ''}`}>
                <CardHeader className="text-center pb-4 md:pb-6">
                  <div className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-lg`}>
                    <feature.icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
                    {feature.title}
                  </CardTitle>
                  <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 md:space-y-3">
                    {feature.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center space-x-2 md:space-x-3">
                        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm md:text-base text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* Enhanced CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-purple-600 to-pink-600 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-white opacity-10 rounded-full -translate-y-16 md:-translate-y-32 translate-x-16 md:translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 md:w-64 md:h-64 bg-white opacity-10 rounded-full translate-y-16 md:translate-y-32 -translate-x-16 md:-translate-x-32"></div>
          </div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 md:px-4 py-2 mb-4 md:mb-6">
            <Heart className="w-4 h-4 md:w-5 md:h-5 text-white" />
            <span className="text-white font-medium text-sm md:text-base">Únete a nuestra comunidad</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 md:mb-8 px-4">
            ¿Listo para Comenzar?
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-purple-100 mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed px-4">
            Únete a miles de familias que ya confían en PetHub para el cuidado de sus mascotas.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto bg-white text-purple-600 hover:bg-gray-100 text-base md:text-lg px-6 md:px-8 py-3 md:py-4 h-auto shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 font-semibold">
                Crear Cuenta Gratis
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </Link>
            <Link to="/features">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-purple-600 text-base md:text-lg px-6 md:px-8 py-3 md:py-4 h-auto transition-all duration-300 font-semibold bg-white/10 backdrop-blur-sm hover:bg-white/20">
                Ver Características
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-6 md:mt-8 px-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-white">6</div>
              <div className="text-purple-200 text-xs md:text-sm">Módulos principales</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-white">10,000+</div>
              <div className="text-purple-200 text-xs md:text-sm">Familias activas</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-white">100%</div>
              <div className="text-purple-200 text-xs md:text-sm">Gratuito para empezar</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
