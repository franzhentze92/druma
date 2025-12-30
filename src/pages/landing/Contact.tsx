import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle, 
  Heart, 
  PawPrint, 
  Users, 
  Shield,
  Zap,
  Star,
  MessageCircle,
  Building2,
  Package,
  Coins,
  Eye,
  Target,
  Award,
  Activity,
  Utensils,
  Stethoscope,
  ShoppingBag,
  Bell,
  BarChart3,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    company: '',
    inquiryType: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        company: '',
        inquiryType: ''
      });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      details: ['info@pethub.gt', 'soporte@pethub.gt'],
      color: 'from-blue-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-purple-100'
    },
    {
      icon: Phone,
      title: 'Teléfono',
      details: ['+502 1234-5678', '+502 9876-5432'],
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-100'
    },
    {
      icon: MapPin,
      title: 'Oficina',
      details: ['Zona 10, Ciudad de Guatemala', 'Guatemala, C.A.'],
      color: 'from-green-500 to-teal-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-teal-100'
    },
    {
      icon: Clock,
      title: 'Horarios',
      details: ['Lun - Vie: 8:00 AM - 6:00 PM', 'Sáb: 9:00 AM - 2:00 PM'],
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-red-100'
    }
  ];

  const inquiryTypes = [
    { value: 'general', label: 'Consulta General' },
    { value: 'technical', label: 'Soporte Técnico' },
    { value: 'provider', label: 'Registro como Proveedor' },
    { value: 'shelter', label: 'Registro como Refugio' },
    { value: 'adoption', label: 'Proceso de Adopción' },
    { value: 'veterinary', label: 'Servicios Veterinarios' },
    { value: 'marketplace', label: 'Marketplace y Productos' },
    { value: 'feedback', label: 'Comentarios y Sugerencias' },
    { value: 'other', label: 'Otro' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <MessageCircle className="w-5 h-5 text-white" />
            <span className="text-white font-medium">Centro de Contacto</span>
          </div>
          <div className="flex items-center justify-center mb-6">
            <PawPrint className="w-12 h-12 text-white mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Contáctanos
            </h1>
          </div>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
            Estamos aquí para ayudarte con el cuidado de tus mascotas. Envíanos tu mensaje 
            y te responderemos en menos de 24 horas.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Badge className="bg-white/20 text-white border-white/40 px-4 py-2">
              <MessageCircle className="w-4 h-4 mr-2" />
              Respuesta en 24h
            </Badge>
            <Badge className="bg-white/20 text-white border-white/40 px-4 py-2">
              <Clock className="w-4 h-4 mr-2" />
              Soporte 24/7
            </Badge>
            <Badge className="bg-white/20 text-white border-white/40 px-4 py-2">
              <Heart className="w-4 h-4 mr-2" />
              Atención Personalizada
            </Badge>
          </div>
        </div>
      </section>

      {/* Contact Information Cards */}
      <section className="py-16 bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full mb-6">
              <Target className="w-4 h-4" />
              <span className="font-medium">Información de Contacto</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Múltiples formas de contactarnos
            </h2>
            <p className="text-xl text-gray-600">
              Elige la forma más conveniente para ti.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <Card key={index} className={`text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group ${info.bgColor}`}>
                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${info.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <info.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {info.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-gray-600 text-sm mb-1">
                      {detail}
                    </p>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form and Map Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-6">
              <Star className="w-4 h-4" />
              <span className="font-medium">Formulario de Contacto</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Envíanos un mensaje
            </h2>
            <p className="text-xl text-gray-600">
              Completa el formulario y nos pondremos en contacto contigo pronto.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Formulario de Contacto
                  </CardTitle>
                  <p className="text-gray-600">
                    Completa el formulario y nos pondremos en contacto contigo pronto.
                  </p>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        ¡Mensaje Enviado!
                      </h3>
                      <p className="text-gray-600">
                        Gracias por contactarnos. Te responderemos en menos de 24 horas.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Nombre Completo *</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            placeholder="Tu nombre completo"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            placeholder="tu@email.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Teléfono</Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+502 1234-5678"
                          />
                        </div>
                        <div>
                          <Label htmlFor="company">Empresa</Label>
                          <Input
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleInputChange}
                            placeholder="Nombre de tu empresa"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="inquiryType">Tipo de Consulta *</Label>
                        <Select 
                          value={formData.inquiryType} 
                          onValueChange={(value) => handleSelectChange('inquiryType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo de consulta" />
                          </SelectTrigger>
                          <SelectContent>
                            {inquiryTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="subject">Asunto *</Label>
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          placeholder="Resumen de tu consulta"
                        />
                      </div>

                      <div>
                        <Label htmlFor="message">Mensaje *</Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows={5}
                          placeholder="Describe tu consulta en detalle..."
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-4 h-auto shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 font-semibold"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar Mensaje
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

              {/* Map and Additional Info */}
              <div className="space-y-6">
                {/* Real Google Map */}
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Nuestra Ubicación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg overflow-hidden">
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.5!2d-90.5154!3d14.6349!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8589a3c4c4c4c4c4%3A0x4c4c4c4c4c4c4c4c!2sZona%2010%2C%20Ciudad%20de%20Guatemala%2C%20Guatemala!5e0!3m2!1sen!2sgt!4v1234567890123!5m2!1sen!2sgt"
                        width="100%"
                        height="300"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="PetHub Office Location - Zona 10, Guatemala City"
                      />
                    </div>
                    <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-teal-100 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-green-600 mt-1" />
                        <div>
                          <h4 className="font-semibold text-green-800">Oficina Principal</h4>
                          <p className="text-green-700 text-sm">
                            Zona 10, Ciudad de Guatemala<br />
                            Guatemala, Centroamérica
                          </p>
                          <p className="text-green-600 text-xs mt-2">
                            📍 Fácil acceso en transporte público y vehículo particular
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              {/* Office Hours */}
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Horarios de Atención
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Lunes - Viernes</span>
                      <span className="font-medium">8:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Sábado</span>
                      <span className="font-medium">9:00 AM - 2:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Domingo</span>
                      <span className="font-medium text-red-500">Cerrado</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </section>

      {/* PetHub Features Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full mb-6">
              <Heart className="w-4 h-4" />
              <span className="font-medium">¿Por qué elegir PetHub?</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              La plataforma integral para el cuidado de mascotas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Conectamos dueños, veterinarios y proveedores en una sola plataforma con 6 módulos especializados
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Adopción Responsable
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Conectamos familias amorosas con más de 2,000 mascotas que necesitan un hogar. 
                  Proceso seguro y verificado con seguimiento post-adopción.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Stethoscope className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Red de Veterinarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Más de 500 veterinarios verificados, groomers, entrenadores y especialistas. 
                  Todos con excelentes calificaciones y seguros de responsabilidad.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Seguridad Garantizada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Encriptación de nivel bancario, cumplimiento GDPR y autenticación de dos factores. 
                  Tus datos y los de tus mascotas están protegidos.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Trazabilidad Completa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Ejercicio, nutrición y salud. Dashboards con analytics avanzados, 
                  gráficos de tendencias y recordatorios inteligentes.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Marketplace Integral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Más de 500 proveedores verificados. Alimentos, juguetes, medicamentos 
                  y accesorios con entrega a domicilio y seguimiento de pedidos.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Recordatorios Inteligentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Más de 15,000 recordatorios activos. Vacunas, citas, medicamentos, 
                  ejercicio y alimentación. El sistema aprende de tus patrones.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Preview Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-6">
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium">Preguntas Frecuentes</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            ¿Tienes preguntas?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Consulta nuestra sección de FAQ para respuestas rápidas a las preguntas más comunes.
          </p>
          <Link to="/faqs">
            <Button variant="outline" className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white text-lg px-8 py-4 h-auto transition-all duration-300 font-semibold bg-white/10 backdrop-blur-sm hover:bg-white/20">
              Ver FAQ Completo
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
