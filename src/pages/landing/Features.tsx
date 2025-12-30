import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  PawPrint, Heart, Users, Shield, Zap, Globe, ArrowRight, Activity, Utensils, 
  Calendar, MapPin, ShoppingCart, Star, CheckCircle, Stethoscope, Bell, 
  BarChart3, TrendingUp, Building2, Package, Coins, Eye, MessageCircle,
  ShoppingBag, Target, Award, Clock, Phone, Mail
} from 'lucide-react';

export const Features: React.FC = () => {
  const mainFeatures = [
    {
      icon: Activity,
      title: 'Ejercicio y Trazabilidad',
      description: 'Registra y analiza el ejercicio de tus mascotas con métricas detalladas y seguimiento completo.',
      color: 'from-green-500 to-teal-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-teal-100',
      details: ['Seguimiento de ejercicio diario', 'Cálculo de calorías quemadas', 'Historial de actividades', 'Metas personalizadas', 'Análisis de rendimiento'],
      badge: '🏃‍♂️ Actividad',
      stats: '10,000+ sesiones registradas'
    },
    {
      icon: Utensils,
      title: 'Nutrición Inteligente',
      description: 'Gestiona horarios de alimentación automática y seguimiento nutricional avanzado.',
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-100',
      details: ['Horarios de alimentación', 'Cálculo nutricional', 'Recordatorios automáticos', 'Historial alimenticio', 'Control de porciones'],
      badge: '🍽️ Nutrición',
      stats: '5,000+ horarios activos'
    },
    {
      icon: Stethoscope,
      title: 'Veterinaria Digital',
      description: 'Registra citas, análisis veterinarios y mantén un historial médico completo.',
      color: 'from-red-500 to-pink-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-pink-100',
      details: ['Historial médico completo', 'Recordatorios de vacunas', 'Registro de tratamientos', 'Citas veterinarias', 'Análisis de salud'],
      badge: '🏥 Salud',
      stats: '500+ veterinarios conectados'
    },
    {
      icon: Heart,
      title: 'Adopción Responsable',
      description: 'Conecta refugios con familias adoptivas para encontrar el hogar perfecto.',
      color: 'from-pink-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-pink-50 to-purple-100',
      details: ['Catálogo de mascotas', 'Sistema de matching', 'Seguimiento post-adopción', 'Comunidad de apoyo', 'Proceso de verificación'],
      badge: '❤️ Adopción',
      stats: '2,000+ adopciones exitosas'
    },
    {
      icon: ShoppingBag,
      title: 'Marketplace Integral',
      description: 'Accede a productos y servicios especializados para mascotas con entrega a domicilio.',
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-red-100',
      details: ['Productos veterinarios', 'Servicios profesionales', 'Entrega a domicilio', 'Reseñas verificadas', 'Gestión de pedidos'],
      badge: '🛒 Marketplace',
      stats: '1,000+ productos disponibles'
    },
    {
      icon: Bell,
      title: 'Recordatorios Inteligentes',
      description: 'Sistema de notificaciones avanzado para el cuidado preventivo de mascotas.',
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-indigo-100',
      details: ['Recordatorios personalizados', 'Notificaciones push', 'Alertas de salud', 'Recordatorios de citas', 'Seguimiento de medicamentos'],
      badge: '🔔 Recordatorios',
      stats: '15,000+ recordatorios activos'
    }
  ];

  const additionalFeatures = [
    {
      icon: Shield,
      title: 'Seguridad Avanzada',
      description: 'Protección de datos y transacciones seguras para tu tranquilidad.',
      badge: '🔒 Seguridad',
      color: 'from-blue-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-purple-100'
    },
    {
      icon: BarChart3,
      title: 'Analytics Avanzados',
      description: 'Dashboards con métricas detalladas y análisis de tendencias.',
      badge: '📊 Analytics',
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-100'
    },
    {
      icon: Globe,
      title: 'Acceso Multiplataforma',
      description: 'Usa PetHub desde cualquier dispositivo, web o móvil.',
      badge: '📱 Multiplataforma',
      color: 'from-green-500 to-teal-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-teal-100'
    },
    {
      icon: Star,
      title: 'Sistema de Reseñas',
      description: 'Evalúa y comparte experiencias con veterinarios y servicios.',
      badge: '⭐ Reseñas',
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-red-100'
    },
    {
      icon: Building2,
      title: 'Gestión de Proveedores',
      description: 'Herramientas completas para veterinarios y proveedores de servicios.',
      badge: '🏢 Proveedores',
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-100'
    },
    {
      icon: MessageCircle,
      title: 'Comunidad Activa',
      description: 'Conecta con otros dueños de mascotas y comparte experiencias.',
      badge: '💬 Comunidad',
      color: 'from-pink-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-pink-50 to-purple-100'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-24 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full translate-y-32 -translate-x-32"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <PawPrint className="w-5 h-5 text-white" />
            <span className="text-white font-medium">PetHub</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Características de <span className="text-yellow-300">PetHub</span>
          </h1>
          <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
            Descubre todas las herramientas y funcionalidades que hacen de PetHub 
            la plataforma más completa para el cuidado de mascotas.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Badge className="bg-white/20 text-white border-white/40 px-4 py-2">
              <Activity className="w-4 h-4 mr-2" />
              6 Módulos Principales
            </Badge>
            <Badge className="bg-white/20 text-white border-white/40 px-4 py-2">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics Avanzados
            </Badge>
            <Badge className="bg-white/20 text-white border-white/40 px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              100% Seguro
            </Badge>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full mb-6">
              <Target className="w-4 h-4" />
              <span className="font-medium">Funcionalidades Principales</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Todo lo que necesitas para tus mascotas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cada característica está diseñada para mejorar la vida de tus mascotas 
              y simplificar tu experiencia como dueño responsable.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {mainFeatures.map((feature, index) => (
              <Card key={index} className={`border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${feature.bgColor}`}>
                <CardHeader className="pb-6">
                  <div className="flex items-start space-x-4">
                    <div className={`w-20 h-20 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Badge variant="outline" className="text-xs font-medium bg-white/50">
                          {feature.badge}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <TrendingUp className="w-3 h-3" />
                          <span>{feature.stats}</span>
                        </div>
                      </div>
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-3">
                        {feature.title}
                      </CardTitle>
                      <p className="text-gray-600 leading-relaxed text-lg">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-6">
              <Star className="w-4 h-4" />
              <span className="font-medium">Características Adicionales</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Funcionalidades que complementan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Funcionalidades que complementan la experiencia principal y hacen 
              de PetHub una plataforma excepcional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => (
              <Card key={index} className={`text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group ${feature.bgColor}`}>
                <CardHeader className="pb-6">
                  <div className={`w-20 h-20 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>
                  <Badge variant="outline" className="mb-3 text-xs font-medium bg-white/50">
                    {feature.badge}
                  </Badge>
                  <CardTitle className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-6">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">¿Cómo Funciona?</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Tres pasos simples para comenzar
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comienza a usar PetHub y mejora el cuidado de tus mascotas 
              en menos de 5 minutos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center relative">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-8 text-white text-3xl font-bold shadow-lg">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Regístrate</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Crea tu cuenta gratuita en menos de 2 minutos y accede 
                a todas las funcionalidades de PetHub.
              </p>
            </div>

            <div className="text-center relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 text-white text-3xl font-bold shadow-lg">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Configura tu Perfil</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Agrega información sobre tus mascotas y personaliza 
                la experiencia según tus necesidades específicas.
              </p>
            </div>

            <div className="text-center relative">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-8 text-white text-3xl font-bold shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Disfruta PetHub</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Comienza a usar todas las herramientas para el cuidado, 
                seguimiento y bienestar de tus mascotas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-24 bg-gradient-to-r from-purple-600 to-pink-600 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full translate-y-32 -translate-x-32"></div>
          </div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Heart className="w-5 h-5 text-white" />
            <span className="text-white font-medium">Únete a nuestra comunidad</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            ¿Listo para Comenzar?
          </h2>
          <p className="text-xl md:text-2xl text-purple-100 mb-10 max-w-3xl mx-auto leading-relaxed">
            Únete a miles de familias que ya confían en PetHub para 
            el cuidado de sus mascotas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 font-semibold">
                Crear Cuenta Gratis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-purple-600 text-lg px-8 py-4 h-auto transition-all duration-300 font-semibold bg-white/10 backdrop-blur-sm hover:bg-white/20">
                Ver Precios
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">6</div>
              <div className="text-purple-200 text-sm">Módulos principales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">10,000+</div>
              <div className="text-purple-200 text-sm">Familias activas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-purple-200 text-sm">Gratuito para empezar</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
