import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  Stethoscope,
  Plus,
  Calendar,
  FileText,
  Upload,
  Activity,
  Clock,
  Filter,
  TrendingUp,
  BarChart3,
  FileImage,
  Download,
  Eye,
  Edit,
  Trash2,
  Receipt
} from 'lucide-react';
import PageHeader from './PageHeader';
import { useNavigation } from '@/contexts/NavigationContext';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  weight?: number;
}

interface VeterinarySession {
  id: string;
  pet_id: string;
  pet_name: string;
  appointment_type: string;
  date: string;
  veterinarian_name: string;
  veterinary_clinic?: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  prescription: string;
  follow_up_date: string;
  cost: number;
  pdf_url?: string;
  invoice_url?: string;
  created_at: string;
}

const Veterinaria: React.FC = () => {
  const { user } = useAuth();
  const { isMobileMenuOpen, toggleMobileMenu } = useNavigation();

  // States
  const [pets, setPets] = useState<Pet[]>([]);
  const [veterinarySessions, setVeterinarySessions] = useState<VeterinarySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPetForAnalytics, setSelectedPetForAnalytics] = useState('all');
  const [activeTab, setActiveTab] = useState('register');
  
  // Form states
  const [selectedPet, setSelectedPet] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [veterinarianName, setVeterinarianName] = useState('');
  const [veterinaryClinic, setVeterinaryClinic] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [cost, setCost] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [editingSession, setEditingSession] = useState<VeterinarySession | null>(null);

  // Load data
  useEffect(() => {
    if (user) {
      loadPets();
      loadVeterinarySessions();
    }
  }, [user]);

  const loadPets = async () => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user?.id);
      
      if (error) throw error;
      setPets(data || []);
    } catch (error) {
      console.error('Error loading pets:', error);
    }
  };

  const loadVeterinarySessions = async () => {
    try {
      const { data, error } = await supabase
        .from('veterinary_sessions')
        .select(`
          *,
          pets(name)
        `)
        .eq('owner_id', user?.id)
        .order('date', { ascending: false });
      
      if (error) {
        // Check if it's a "table doesn't exist" error
        if (error.code === 'PGRST204' || error.message?.includes('does not exist')) {
          console.log('Veterinary sessions table not created yet. Please run the SQL script.');
          setVeterinarySessions([]);
          return;
        }
        console.error('Error loading veterinary sessions:', error);
        setVeterinarySessions([]);
        return;
      }

      const formattedSessions = data?.map(session => ({
        ...session,
        pet_name: session.pets?.name || 'Unknown Pet'
      })) || [];
      
      setVeterinarySessions(formattedSessions);
    } catch (error) {
      console.error('Error loading veterinary sessions:', error);
      setVeterinarySessions([]);
    }
  };

  const resetForm = () => {
    setSelectedPet('');
    setAppointmentType('');
    setAppointmentDate(new Date().toISOString().split('T')[0]);
    setVeterinarianName('');
    setVeterinaryClinic('');
    setDiagnosis('');
    setTreatment('');
    setNotes('');
    setPrescription('');
    setFollowUpDate('');
    setCost('');
    setPdfFile(null);
    setInvoiceFile(null);
    setEditingSession(null);
  };

  const loadSessionForEdit = (session: VeterinarySession) => {
    setEditingSession(session);
    setSelectedPet(session.pet_id);
    setAppointmentType(session.appointment_type);
    setAppointmentDate(session.date);
    setVeterinarianName(session.veterinarian_name);
    setVeterinaryClinic(session.veterinary_clinic || '');
    setDiagnosis(session.diagnosis);
    setTreatment(session.treatment || '');
    setNotes(session.notes || '');
    setPrescription(session.prescription || '');
    setFollowUpDate(session.follow_up_date || '');
    setCost(session.cost?.toString() || '');
    setPdfFile(null);
    setInvoiceFile(null);
    // Switch to register tab
    setActiveTab('register');
    // Scroll to top of form
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleFileUpload = async (file: File, folder: string = 'veterinary-documents') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(folder)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(folder)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const saveVeterinarySession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPet || !appointmentType || !veterinarianName || !diagnosis) {
      toast.error("Por favor, completa todos los campos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      let pdfUrl = editingSession?.pdf_url || '';
      if (pdfFile) {
        pdfUrl = await handleFileUpload(pdfFile);
      }

      let invoiceUrl = editingSession?.invoice_url || '';
      if (invoiceFile) {
        invoiceUrl = await handleFileUpload(invoiceFile);
      }

      const veterinaryData = {
        pet_id: selectedPet,
        appointment_type: appointmentType,
        date: appointmentDate,
        veterinarian_name: veterinarianName,
        veterinary_clinic: veterinaryClinic || null,
        diagnosis: diagnosis,
        treatment: treatment || null,
        notes: notes || null,
        prescription: prescription || null,
        follow_up_date: followUpDate || null,
        cost: cost ? parseFloat(cost) : null,
        pdf_url: pdfUrl || null,
        invoice_url: invoiceUrl || null,
        owner_id: user?.id
      };

      if (editingSession) {
        // Update existing session
        const { error } = await supabase
          .from('veterinary_sessions')
          .update(veterinaryData)
          .eq('id', editingSession.id);

        if (error) throw error;

        toast.success("¡Visita veterinaria actualizada correctamente!");
      } else {
        // Create new session
        const { error } = await supabase
          .from('veterinary_sessions')
          .insert([veterinaryData]);

        if (error) throw error;

        toast.success("¡Visita veterinaria registrada correctamente!");
      }

      resetForm();
      loadVeterinarySessions();
      // Switch back to history tab after saving
      if (editingSession) {
        setActiveTab('history');
      }
    } catch (error) {
      console.error('Error saving veterinary session:', error);
      toast.error(
        editingSession 
          ? "No se pudo actualizar la visita veterinaria." 
          : "No se pudo registrar la visita veterinaria."
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteVeterinarySession = async (sessionId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta visita veterinaria?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('veterinary_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast.success("¡Visita veterinaria eliminada correctamente!");

      loadVeterinarySessions();
    } catch (error) {
      console.error('Error deleting veterinary session:', error);
      toast.error("No se pudo eliminar la visita veterinaria.");
    } finally {
      setLoading(false);
    }
  };

  const appointmentTypes = [
    { value: 'consulta_general', label: 'Consulta General' },
    { value: 'vacunacion', label: 'Vacunación' },
    { value: 'revision_medica', label: 'Revisión Médica' },
    { value: 'emergencia', label: 'Emergencia' },
    { value: 'cirugia', label: 'Cirugía' },
    { value: 'cuidado_dental', label: 'Cuidado Dental' },
    { value: 'aseo', label: 'Aseo' },
    { value: 'otro', label: 'Otro' }
  ];

  // Analytics functions
  const getFilteredVeterinarySessions = () => {
    if (selectedPetForAnalytics === 'all') {
      return veterinarySessions;
    }
    return veterinarySessions.filter(session => session.pet_id === selectedPetForAnalytics);
  };

  const getVeterinaryStats = () => {
    const filteredSessions = getFilteredVeterinarySessions();
    
    if (filteredSessions.length === 0) {
      return {
        total_sessions: 0,
        total_cost: 0,
        average_cost: 0,
        most_common_type: 'N/A',
        most_visited_pet: 'N/A'
      };
    }

    const totalSessions = filteredSessions.length;
    const totalCost = filteredSessions.reduce((sum, session) => sum + (session.cost || 0), 0);
    const averageCost = Math.round(totalCost / totalSessions);

    // Find most common appointment type
    const typeCounts = filteredSessions.reduce((acc, session) => {
      acc[session.appointment_type] = (acc[session.appointment_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostCommonType = Object.keys(typeCounts).reduce((a, b) => 
      typeCounts[a] > typeCounts[b] ? a : b
    );

    // Find most visited pet
    const petCounts = filteredSessions.reduce((acc, session) => {
      acc[session.pet_name] = (acc[session.pet_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostVisitedPet = Object.keys(petCounts).reduce((a, b) => 
      petCounts[a] > petCounts[b] ? a : b
    );

    return {
      total_sessions: totalSessions,
      total_cost: totalCost,
      average_cost: averageCost,
      most_common_type: appointmentTypes.find(t => t.value === mostCommonType)?.label || mostCommonType,
      most_visited_pet: mostVisitedPet
    };
  };


  // Prepare chart data for time series
  const getChartData = () => {
    const filteredSessions = getFilteredVeterinarySessions();
    
    // Group sessions by date
    const sessionsByDate = filteredSessions.reduce((acc, session) => {
      const date = session.date;
      if (!acc[date]) {
        acc[date] = {
          date: new Date(date).toLocaleDateString('es-GT'),
          sessions: 0,
          cost: 0
        };
      }
      acc[date].sessions += 1;
      acc[date].cost += session.cost || 0;
      return acc;
    }, {} as Record<string, any>);

    // Convert to array and sort by date
    return Object.values(sessionsByDate).sort((a: any, b: any) => 
      new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime()
    );
  };

  const veterinaryStats = getVeterinaryStats();
  const chartData = getChartData();

  return (
    <div className="p-6 space-y-6" style={{ paddingBottom: '100px' }}>
      <PageHeader 
        title="Veterinaria"
        subtitle="Registra y gestiona las visitas veterinarias de tus mascotas"
        gradient="from-red-500 to-pink-500"
        showHamburgerMenu={true}
        onToggleHamburger={toggleMobileMenu}
        isHamburgerOpen={isMobileMenuOpen}
      >
        <Stethoscope className="w-8 h-8" />
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="register">
            {editingSession ? 'Editar Visita' : 'Registrar Visita'}
          </TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-red-600" />
                {editingSession ? 'Editar Visita Veterinaria' : 'Nueva Visita Veterinaria'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveVeterinarySession} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pet">Mascota *</Label>
                    <Select value={selectedPet} onValueChange={setSelectedPet}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar mascota" />
                      </SelectTrigger>
                      <SelectContent>
                        {pets.map((pet) => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {pet.name} ({pet.breed})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="appointmentType">Tipo de Visita *</Label>
                    <Select value={appointmentType} onValueChange={setAppointmentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {appointmentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="appointmentDate">Fecha de la Visita *</Label>
                    <Input
                      id="appointmentDate"
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="veterinarianName">Veterinario *</Label>
                    <Input
                      id="veterinarianName"
                      value={veterinarianName}
                      onChange={(e) => setVeterinarianName(e.target.value)}
                      placeholder="Nombre del veterinario"
                    />
                  </div>

                  <div>
                    <Label htmlFor="veterinaryClinic">Veterinaria/Clínica</Label>
                    <Input
                      id="veterinaryClinic"
                      value={veterinaryClinic}
                      onChange={(e) => setVeterinaryClinic(e.target.value)}
                      placeholder="Nombre de la veterinaria o clínica"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cost">Costo (Q)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="followUpDate">Fecha de Seguimiento</Label>
                    <Input
                      id="followUpDate"
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="diagnosis">Diagnóstico *</Label>
                  <Textarea
                    id="diagnosis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Diagnóstico médico..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="treatment">Tratamiento</Label>
                  <Textarea
                    id="treatment"
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                    placeholder="Tratamiento recomendado..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="prescription">Receta Médica</Label>
                  <Textarea
                    id="prescription"
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    placeholder="Medicamentos recetados..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observaciones adicionales..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="pdfFile">Subir Documento PDF (Resultados)</Label>
                  <Input
                    id="pdfFile"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  />
                  {editingSession?.pdf_url && !pdfFile && (
                    <p className="text-xs text-gray-500 mt-1">
                      Documento actual: <a href={editingSession.pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Ver documento</a>
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="invoiceFile">Subir Factura (PDF o Imagen)</Label>
                  <Input
                    id="invoiceFile"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  {editingSession?.invoice_url && !invoiceFile && (
                    <p className="text-xs text-gray-500 mt-1">
                      Factura actual: <a href={editingSession.invoice_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Ver factura</a>
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                  >
                    <Stethoscope className="w-4 h-4 mr-2" />
                    {loading 
                      ? (editingSession ? 'Actualizando...' : 'Registrando...') 
                      : (editingSession ? 'Actualizar Visita' : 'Registrar Visita Veterinaria')
                    }
                  </Button>
                  {editingSession && (
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Setup Message */}
          {veterinarySessions.length === 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-800">Configuración Requerida</h3>
                    <p className="text-sm text-orange-700">
                      Para usar la sección Veterinaria, primero ejecuta el script SQL en Supabase Dashboard.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pet Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-red-600" />
                Filtrar por Mascota
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedPetForAnalytics} onValueChange={setSelectedPetForAnalytics}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una mascota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las mascotas</SelectItem>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          {veterinaryStats.total_sessions > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Visitas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{veterinaryStats.total_sessions}</div>
                  <p className="text-xs text-gray-500">Visitas registradas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Costo Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Q{veterinaryStats.total_cost}</div>
                  <p className="text-xs text-gray-500">Total gastado</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Costo Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">Q{veterinaryStats.average_cost}</div>
                  <p className="text-xs text-gray-500">Por visita</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Tipo Más Común</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-purple-600">{veterinaryStats.most_common_type}</div>
                  <p className="text-xs text-gray-500">Visita más frecuente</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Mascota Más Visitada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-indigo-600">{veterinaryStats.most_visited_pet}</div>
                  <p className="text-xs text-gray-500">Más visitas</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No hay datos veterinarios</p>
                <p className="text-sm text-gray-500">Registra algunas visitas veterinarias para ver estadísticas</p>
              </CardContent>
            </Card>
          )}

          {/* Time Series Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-600" />
                  Progreso de Visitas Veterinarias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'cost') return [`Q${value}`, 'Costo'];
                          if (name === 'sessions') return [`${value}`, 'Visitas'];
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Fecha: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sessions" 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                        name="Visitas"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cost" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        name="Costo"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Visitas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Costo (Q)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Setup Message */}
          {veterinarySessions.length === 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-800">Configuración Requerida</h3>
                    <p className="text-sm text-orange-700">
                      Para usar la sección Veterinaria, primero ejecuta el script SQL en Supabase Dashboard.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pet Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-red-600" />
                Filtrar por Mascota
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedPetForAnalytics} onValueChange={setSelectedPetForAnalytics}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una mascota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las mascotas</SelectItem>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-600" />
                Historial Veterinario
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getFilteredVeterinarySessions().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No hay visitas veterinarias registradas</p>
                  <p className="text-sm">Comienza registrando tu primera visita veterinaria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredVeterinarySessions().map((session) => (
                    <div key={session.id} className="border-l-4 border-red-500 pl-4 py-4 bg-red-50 rounded-r-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Stethoscope className="w-5 h-5 text-red-600" />
                            <span className="font-semibold text-gray-800">
                              {appointmentTypes.find(t => t.value === session.appointment_type)?.label || session.appointment_type}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {session.pet_name}
                            </Badge>
                            <Badge className="bg-red-100 text-red-800">
                              {session.veterinarian_name}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {new Date(session.date).toLocaleDateString('es-GT', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadSessionForEdit(session)}
                            className="text-xs"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteVeterinarySession(session.id)}
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-100"
                            disabled={loading}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                        {session.veterinary_clinic && (
                          <div>
                            <span className="font-medium text-gray-700">Veterinaria/Clínica:</span>
                            <p className="mt-1 text-gray-600">{session.veterinary_clinic}</p>
                          </div>
                        )}
                        {session.cost && (
                          <div>
                            <span className="font-medium text-gray-700">Costo:</span>
                            <p className="mt-1 text-gray-600">Q{session.cost.toFixed(2)}</p>
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-700">Diagnóstico:</span>
                          <p className="mt-1 text-gray-600">{session.diagnosis}</p>
                        </div>
                        {session.treatment && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-700">Tratamiento:</span>
                            <p className="mt-1 text-gray-600">{session.treatment}</p>
                          </div>
                        )}
                        {session.prescription && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-700">Receta Médica:</span>
                            <p className="mt-1 text-gray-600">{session.prescription}</p>
                          </div>
                        )}
                        {session.follow_up_date && (
                          <div>
                            <span className="font-medium text-gray-700">Fecha de Seguimiento:</span>
                            <p className="mt-1 text-gray-600">
                              {new Date(session.follow_up_date).toLocaleDateString('es-GT')}
                            </p>
                          </div>
                        )}
                        {session.notes && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-700">Notas:</span>
                            <p className="mt-1 text-gray-600 italic">"{session.notes}"</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {session.pdf_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(session.pdf_url, '_blank')}
                            className="text-xs"
                          >
                            <FileImage className="w-3 h-3 mr-1" />
                            Ver Documento PDF
                          </Button>
                        )}
                        {session.invoice_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(session.invoice_url, '_blank')}
                            className="text-xs"
                          >
                            <Receipt className="w-3 h-3 mr-1" />
                            Ver Factura
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Veterinaria;
