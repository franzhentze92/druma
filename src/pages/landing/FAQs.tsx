import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  HelpCircle, 
  PawPrint, 
  User, 
  Settings, 
  Shield, 
  MessageCircle,
  Heart,
  Users,
  Star,
  Zap,
  Activity,
  Utensils,
  Stethoscope,
  ShoppingBag,
  Bell,
  BarChart3,
  TrendingUp,
  Building2,
  Package,
  Coins,
  Eye,
  Target,
  Award,
  Calendar,
  Phone,
  Mail,
  CheckCircle,
  Clock
} from 'lucide-react';

export const FAQs: React.FC = () => {
  const [openFaqs, setOpenFaqs] = useState<number[]>([]);

  const toggleFaq = (index: number) => {
    setOpenFaqs(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqs = [
    {
      question: '¿Qué es PetHub y cómo funciona?',
      answer: 'PetHub es una plataforma integral para el cuidado de mascotas que conecta dueños, veterinarios y proveedores de servicios. Ofrece 6 módulos principales: Ejercicio y Trazabilidad, Nutrición Inteligente, Veterinaria Digital, Adopción Responsable, Marketplace Integral y Recordatorios Inteligentes. Cada módulo incluye dashboards con analytics avanzados y seguimiento completo.',
      category: 'General',
      icon: PawPrint
    },
    {
      question: '¿Es PetHub completamente gratuito?',
      answer: 'PetHub ofrece un plan gratuito con funcionalidades básicas de todos los módulos. Los planes premium incluyen analytics avanzados, recordatorios personalizados, soporte prioritario y acceso a más de 1,000 productos en el marketplace. Puedes ver todos nuestros planes en la sección de precios.',
      category: 'Cuenta',
      icon: Coins
    },
    {
      question: '¿Cómo registro a mis mascotas en la plataforma?',
      answer: 'Después de crear tu cuenta, ve a tu Dashboard y selecciona "Agregar Mascota". Completa la información básica como nombre, especie, raza, edad y peso. También puedes subir fotos, configurar horarios de alimentación automática y establecer metas de ejercicio personalizadas.',
      category: 'Cuenta',
      icon: User
    },
    {
      question: '¿Es seguro compartir información médica de mis mascotas?',
      answer: 'Absolutamente. PetHub utiliza encriptación de nivel bancario, cumple con GDPR y los más altos estándares de seguridad. Tu información y la de tus mascotas están protegidas con autenticación de dos factores. Solo tú y los veterinarios que autorices pueden acceder a los datos médicos.',
      category: 'Seguridad',
      icon: Shield
    },
    {
      question: '¿Puedo usar PetHub desde mi teléfono móvil?',
      answer: 'Sí, PetHub es completamente responsivo y optimizado para dispositivos móviles. Puedes acceder desde cualquier navegador web en tu smartphone o tablet. La interfaz se adapta perfectamente a pantallas pequeñas y todas las funcionalidades están disponibles en móvil.',
      category: 'Técnico',
      icon: Phone
    },
    {
      question: '¿Cómo funciona el sistema de adopción?',
      answer: 'El sistema de adopción conecta refugios con familias adoptivas. Puedes ver el catálogo de más de 2,000 mascotas disponibles, leer sus historias completas, ver fotos y videos, y contactar directamente a los refugios. El sistema incluye proceso de verificación y seguimiento post-adopción para asegurar una transición exitosa.',
      category: 'Adopción',
      icon: Heart
    },
    {
      question: '¿Qué tipos de trazabilidad ofrece PetHub?',
      answer: 'PetHub ofrece trazabilidad completa en 3 áreas: Física (ejercicio con métricas de calorías quemadas), Nutricional (horarios automáticos y cálculo de nutrientes), y Veterinaria (historial médico completo). Cada área incluye dashboards con analytics, gráficos de tendencias y recordatorios inteligentes.',
      category: 'Funcionalidades',
      icon: BarChart3
    },
    {
      question: '¿Puedo conectar con veterinarios a través de la plataforma?',
      answer: 'Sí, PetHub tiene más de 500 veterinarios verificados en la plataforma. Puedes ver sus perfiles, especialidades, reseñas de otros usuarios, disponibilidad y contactarlos directamente. También puedes compartir el historial médico completo de tus mascotas y programar citas online.',
      category: 'Veterinaria',
      icon: Stethoscope
    },
    {
      question: '¿Cómo funciona el marketplace de productos?',
      answer: 'El marketplace conecta dueños de mascotas con más de 500 proveedores verificados. Puedes buscar por categoría (alimentos, juguetes, medicamentos), leer reseñas verificadas, comparar precios y realizar pedidos con entrega a domicilio. Incluye sistema de seguimiento de pedidos y gestión completa de órdenes.',
      category: 'Marketplace',
      icon: ShoppingBag
    },
    {
      question: '¿Cómo funcionan los recordatorios inteligentes?',
      answer: 'Los recordatorios inteligentes cubren vacunas, citas veterinarias, medicamentos, ejercicio y alimentación. El sistema aprende de tus patrones y envía notificaciones personalizadas. Más de 15,000 recordatorios están activos actualmente, ayudando a mantener el cuidado preventivo de las mascotas.',
      category: 'Funcionalidades',
      icon: Bell
    },
    {
      question: '¿Qué análisis y reportes puedo ver?',
      answer: 'PetHub ofrece dashboards completos con métricas de ejercicio (calorías quemadas, tiempo activo), nutrición (horarios cumplidos, análisis nutricional), salud (historial médico, próximas citas) y gastos (marketplace, veterinaria). Los reportes se pueden exportar y compartir con veterinarios.',
      category: 'Análisis',
      icon: TrendingUp
    },
    {
      question: '¿Qué hago si encuentro un error o necesito ayuda?',
      answer: 'Si encuentras algún error o necesitas ayuda, puedes contactarnos a través de la sección "Contacto" en nuestra página web. Ofrecemos soporte por email en soporte@pethub.gt, chat en vivo en la plataforma, y teléfono en +502 1234-5678 durante horarios laborales. Tiempo de respuesta promedio: menos de 24 horas.',
      category: 'Soporte',
      icon: MessageCircle
    }
  ];

  const categories = [
    {
      title: 'Cuenta y Registro',
      icon: User,
      count: 3,
      color: 'from-blue-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-purple-100'
    },
    {
      title: 'Funcionalidades',
      icon: Settings,
      count: 4,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-100'
    },
    {
      title: 'Seguridad y Privacidad',
      icon: Shield,
      count: 2,
      color: 'from-green-500 to-teal-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-teal-100'
    },
    {
      title: 'Soporte y Ayuda',
      icon: MessageCircle,
      count: 1,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-red-100'
    },
    {
      title: 'Veterinaria',
      icon: Stethoscope,
      count: 1,
      color: 'from-red-500 to-pink-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-pink-100'
    },
    {
      title: 'Marketplace',
      icon: ShoppingBag,
      count: 1,
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <HelpCircle className="w-5 h-5 text-white" />
            <span className="text-white font-medium">Centro de Ayuda</span>
          </div>
          <div className="flex items-center justify-center mb-6">
            <PawPrint className="w-12 h-12 text-white mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Preguntas <span className="text-yellow-300">Frecuentes</span>
            </h1>
          </div>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
            Encuentra respuestas rápidas a las preguntas más comunes sobre PetHub. 
            Si no encuentras lo que buscas, no dudes en contactarnos.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Badge className="bg-white/20 text-white border-white/40 px-4 py-2">
              <MessageCircle className="w-4 h-4 mr-2" />
              12 Preguntas Comunes
            </Badge>
            <Badge className="bg-white/20 text-white border-white/40 px-4 py-2">
              <Clock className="w-4 h-4 mr-2" />
              Respuesta Rápida
            </Badge>
            <Badge className="bg-white/20 text-white border-white/40 px-4 py-2">
              <Heart className="w-4 h-4 mr-2" />
              Soporte 24/7
            </Badge>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full mb-6">
              <Target className="w-4 h-4" />
              <span className="font-medium">Categorías de Preguntas</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Organizamos las preguntas por temas
            </h2>
            <p className="text-xl text-gray-600">
              Encuentra rápidamente lo que necesitas con nuestras categorías organizadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Card key={index} className={`text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 group ${category.bgColor}`}>
                <CardContent className="p-6">
                  <div className={`w-16 h-16 bg-gradient-to-r ${category.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <category.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {category.count} pregunta{category.count !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-6">
              <Star className="w-4 h-4" />
              <span className="font-medium">Preguntas Frecuentes</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Respuestas a tus preguntas
            </h2>
            <p className="text-xl text-gray-600">
              Haz clic en cualquier pregunta para ver la respuesta completa.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader 
                  className="cursor-pointer pb-4 hover:bg-gray-50/50 transition-colors duration-200"
                  onClick={() => toggleFaq(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <faq.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            {faq.question}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            {faq.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      {openFaqs.includes(index) ? (
                        <ChevronUp className="w-5 h-5 text-purple-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                {openFaqs.includes(index) && (
                  <CardContent className="pt-0">
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <Heart className="w-5 h-5 text-white" />
                <span className="text-white font-medium">Soporte Personalizado</span>
              </div>
              <HelpCircle className="w-16 h-16 text-white mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">
                ¿Aún tienes preguntas?
              </h2>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                Nuestro equipo de soporte está aquí para ayudarte. 
                Contáctanos y te responderemos en menos de 24 horas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 font-semibold">
                    Contactar Soporte
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/features">
                  <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-purple-600 text-lg px-8 py-4 h-auto transition-all duration-300 font-semibold bg-white/10 backdrop-blur-sm hover:bg-white/20">
                    Ver Características
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap justify-center gap-6 mt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">24h</div>
                  <div className="text-purple-200 text-sm">Tiempo de respuesta</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">500+</div>
                  <div className="text-purple-200 text-sm">Veterinarios verificados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">99%</div>
                  <div className="text-purple-200 text-sm">Satisfacción del cliente</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
