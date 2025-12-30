import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Users, Heart, Target, Award, Globe, Zap, ArrowRight, Shield, 
  Activity, Utensils, Stethoscope, ShoppingBag, PawPrint, 
  BarChart3, TrendingUp, CheckCircle, Star, Calendar, MessageCircle,
  Building2, Package, Coins, Eye, Bell, MapPin, Phone, Mail
} from 'lucide-react';

export const AboutUs: React.FC = () => {
  const values = [
    {
      icon: Heart,
      title: 'Amor por los Animales',
      description: 'Cada decisión que tomamos está guiada por nuestro profundo amor y respeto por todas las mascotas.',
      color: 'from-pink-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-pink-50 to-purple-100'
    },
    {
      icon: Users,
      title: 'Comunidad',
      description: 'Creemos en el poder de la comunidad para crear un mundo mejor para las mascotas y sus dueños.',
      color: 'from-blue-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-purple-100'
    },
    {
      icon: Target,
      title: 'Innovación',
      description: 'Buscamos constantemente nuevas formas de mejorar el cuidado y bienestar de las mascotas.',
      color: 'from-green-500 to-teal-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-teal-100'
    },
    {
      icon: Shield,
      title: 'Responsabilidad',
      description: 'Nos comprometemos a mantener los más altos estándares de calidad y seguridad.',
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-100'
    }
  ];

  // Platform features based on dashboard analysis
  const platformFeatures = [
    {
      icon: Activity,
      title: 'Ejercicio y Trazabilidad',
      description: 'Registra y analiza el ejercicio de tus mascotas con métricas detalladas',
      color: 'from-green-500 to-teal-600',
      stats: '10,000+ sesiones registradas'
    },
    {
      icon: Utensils,
      title: 'Nutrición Inteligente',
      description: 'Gestiona horarios de alimentación automática y seguimiento nutricional',
      color: 'from-emerald-500 to-green-600',
      stats: '5,000+ horarios activos'
    },
    {
      icon: Stethoscope,
      title: 'Veterinaria Digital',
      description: 'Registra citas, análisis veterinarios y mantén un historial médico completo',
      color: 'from-red-500 to-pink-600',
      stats: '500+ veterinarios conectados'
    },
    {
      icon: ShoppingBag,
      title: 'Marketplace Integral',
      description: 'Accede a productos y servicios especializados para mascotas',
      color: 'from-orange-500 to-red-600',
      stats: '1,000+ productos disponibles'
    },
    {
      icon: Heart,
      title: 'Adopción Responsable',
      description: 'Conecta refugios con familias adoptivas para encontrar el hogar perfecto',
      color: 'from-pink-500 to-purple-600',
      stats: '2,000+ adopciones exitosas'
    },
    {
      icon: Bell,
      title: 'Recordatorios Inteligentes',
      description: 'Sistema de notificaciones para el cuidado preventivo de mascotas',
      color: 'from-purple-500 to-indigo-600',
      stats: '15,000+ recordatorios activos'
    }
  ];

  const team = [
    {
      name: 'Dr. Carlos Méndez',
      role: 'CEO & Fundador',
      description: 'Veterinario con más de 15 años de experiencia en el cuidado animal.',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face'
    },
    {
      name: 'Dra. Ana García',
      role: 'Directora Médica',
      description: 'Especialista en medicina interna veterinaria y bienestar animal.',
      image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop&crop=face'
    },
    {
      name: 'Ing. Roberto López',
      role: 'CTO',
      description: 'Experto en desarrollo de software y soluciones tecnológicas para el sector veterinario.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <PawPrint className="w-5 h-5 text-white" />
            <span className="text-white font-medium">PetHub</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Sobre <span className="text-yellow-300">PetHub</span>
          </h1>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
            Nuestra misión es revolucionar el cuidado de mascotas a través de la tecnología 
            y la comunidad, creando un mundo donde cada mascota reciba el amor y cuidado que merece.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Badge className="bg-white/20 text-white border-white/40 px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              10,000+ Familias
            </Badge>
            <Badge className="bg-white/20 text-white border-white/40 px-4 py-2">
              <Building2 className="w-4 h-4 mr-2" />
              500+ Proveedores
            </Badge>
            <Badge className="bg-white/20 text-white border-white/40 px-4 py-2">
              <Heart className="w-4 h-4 mr-2" />
              2,000+ Adopciones
            </Badge>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Nuestra Misión
                </h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Conectar a dueños de mascotas, veterinarios y proveedores de servicios 
                en una plataforma integral que facilite el cuidado, la adopción responsable 
                y el seguimiento de la salud de las mascotas.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Creemos que cada mascota merece una vida feliz y saludable, y trabajamos 
                incansablemente para hacer esa visión una realidad.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <Badge className="bg-purple-100 text-purple-800 px-3 py-1">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Innovación
                </Badge>
                <Badge className="bg-pink-100 text-pink-800 px-3 py-1">
                  <Heart className="w-4 h-4 mr-1" />
                  Compromiso
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                  <Users className="w-4 h-4 mr-1" />
                  Comunidad
                </Badge>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Nuestra Visión</h3>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                Ser la plataforma líder en Latinoamérica para el cuidado integral de mascotas, 
                reconocida por nuestra innovación, compromiso con la comunidad y contribución 
                al bienestar animal.
              </p>
              <div className="bg-white/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <span>Expansión a toda Latinoamérica</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full mb-6">
              <Star className="w-4 h-4" />
              <span className="font-medium">Nuestros Valores</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Los principios que nos guían
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Los valores fundamentales que guían cada decisión y acción en PetHub.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${value.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <value.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {value.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-6">
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium">Nuestra Plataforma</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tecnología al servicio de las mascotas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Una plataforma integral que conecta todos los aspectos del cuidado de mascotas 
              con tecnología avanzada y una interfaz intuitiva.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFeatures.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {feature.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <TrendingUp className="w-4 h-4" />
                    <span>{feature.stats}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-6">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Nuestra Historia</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Un viaje de innovación y crecimiento
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Desde nuestros humildes comienzos hasta convertirnos en la plataforma líder 
              en cuidado de mascotas en Guatemala.
            </p>
          </div>
          
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-green-50 to-teal-50 p-8 rounded-2xl border border-green-100 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Los Inicios (2022)</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    PetHub nació de la visión de un grupo de veterinarios y desarrolladores 
                    que identificaron la necesidad de una plataforma integral para el cuidado de mascotas 
                    en Guatemala. Comenzamos como un pequeño proyecto local con grandes sueños.
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold">2022</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="text-center lg:order-1">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold">2024</span>
                </div>
              </div>
              <div className="lg:col-span-2 lg:order-2">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl border border-blue-100 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">El Crecimiento</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    En solo dos años, hemos conectado a más de 10,000 familias con sus mascotas, 
                    facilitado cientos de adopciones responsables y creado una red de más de 500 
                    veterinarios y proveedores de servicios comprometidos con el bienestar animal.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">El Futuro</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Continuamos innovando y expandiendo nuestros servicios para incluir nuevas 
                    tecnologías como IA para diagnóstico temprano, telemedicina veterinaria y 
                    herramientas avanzadas de trazabilidad para el cuidado preventivo.
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold">∞</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full mb-6">
              <Users className="w-4 h-4" />
              <span className="font-medium">Nuestro Equipo</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Conoce a nuestro equipo
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Las personas apasionadas y expertas que hacen posible PetHub día a día.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
                <CardHeader className="pb-4">
                  <div className="relative">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full p-2">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {member.name}
                  </CardTitle>
                  <div className="flex items-center justify-center gap-2">
                    <Badge className="bg-purple-100 text-purple-800 px-3 py-1">
                      {member.role}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    {member.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Heart className="w-5 h-5 text-white" />
            <span className="text-white font-medium">Únete a nuestra comunidad</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Únete a Nuestra Misión
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Juntos podemos crear un mundo mejor para las mascotas. 
            ¿Te unes a nosotros en esta increíble aventura?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                Comenzar Ahora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600 text-lg px-8 py-3 font-semibold bg-white/10 backdrop-blur-sm hover:bg-white/20">
                Contactar
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">10,000+</div>
              <div className="text-purple-200 text-sm">Familias activas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-purple-200 text-sm">Proveedores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">2,000+</div>
              <div className="text-purple-200 text-sm">Adopciones</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
