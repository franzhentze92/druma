import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Stethoscope,
  Scissors,
  Shield,
  Heart,
  TrendingUp,
  CalendarDays
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import { useNavigation } from '@/contexts/NavigationContext';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, parseISO, isSameDay, startOfDay, isAfter, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  image_url?: string;
}

interface Reminder {
  id: string;
  type: 'vaccination' | 'follow_up' | 'service_appointment';
  title: string;
  description: string;
  date: string;
  time?: string;
  pet_id: string;
  pet_name: string;
  status: 'pending' | 'upcoming' | 'overdue' | 'completed';
  source_id: string; // ID from the source table
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const Recordatorios: React.FC = () => {
  const { user } = useAuth();
  const { isMobileMenuOpen, toggleMobileMenu } = useNavigation();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filterPet, setFilterPet] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all'); // 'all', 'today', 'week', 'month', 'overdue'
  const [completedReminders, setCompletedReminders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      // Load completed reminders from localStorage
      const saved = localStorage.getItem(`completed_reminders_${user.id}`);
      if (saved) {
        setCompletedReminders(new Set(JSON.parse(saved)));
      }
      loadData();
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [filterPet, filterDate]);

  // Save completed reminders to localStorage whenever it changes
  useEffect(() => {
    if (user && completedReminders.size > 0) {
      localStorage.setItem(`completed_reminders_${user.id}`, JSON.stringify(Array.from(completedReminders)));
    }
  }, [completedReminders, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load pets
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user?.id);

      if (petsError) throw petsError;
      setPets(petsData || []);

      const allReminders: Reminder[] = [];

      // Load veterinary sessions with follow-up dates
      const { data: vetSessions, error: vetError } = await supabase
        .from('veterinary_sessions')
        .select(`
          *,
          pets (
            id,
            name,
            species,
            breed,
            image_url
          )
        `)
        .eq('owner_id', user?.id)
        .not('follow_up_date', 'is', null);

      if (!vetError && vetSessions) {
        vetSessions.forEach(session => {
          const pet = session.pets as Pet;
          const followUpDate = parseISO(session.follow_up_date);
          const today = startOfDay(new Date());
          const isVaccination = session.appointment_type?.toLowerCase().includes('vacuna') || 
                               session.appointment_type?.toLowerCase().includes('vaccination');
          
          let status: 'pending' | 'upcoming' | 'overdue' | 'completed' = 'pending';
          let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
          
          if (isBefore(followUpDate, today)) {
            status = 'overdue';
            priority = 'urgent';
          } else if (isAfter(followUpDate, addDays(today, 7))) {
            status = 'upcoming';
            priority = 'low';
        } else {
            status = 'pending';
            priority = 'high';
          }

          if (isVaccination) {
            allReminders.push({
              id: `vaccination-${session.id}`,
              type: 'vaccination',
              title: `Vacuna: ${session.appointment_type}`,
              description: session.diagnosis || 'Cita de vacunación',
              date: session.follow_up_date,
              pet_id: session.pet_id,
              pet_name: pet?.name || 'Mascota desconocida',
              status,
              source_id: session.id,
              priority
            });
      } else {
            allReminders.push({
              id: `followup-${session.id}`,
              type: 'follow_up',
              title: `Cita de Seguimiento: ${session.appointment_type}`,
              description: session.diagnosis || 'Cita de seguimiento veterinario',
              date: session.follow_up_date,
              pet_id: session.pet_id,
              pet_name: pet?.name || 'Mascota desconocida',
              status,
              source_id: session.id,
              priority
            });
          }
        });
      }

      // Load service appointments (include all pending/confirmed, not just future ones)
      const { data: serviceAppointments, error: serviceError } = await supabase
        .from('service_appointments')
        .select(`
          *,
          provider_services (
            service_name,
            service_category
          ),
          provider_service_time_slots (
            slot_start_time,
            slot_end_time
          )
        `)
        .eq('client_id', user?.id)
        .in('status', ['pending', 'confirmed']);

      if (!serviceError && serviceAppointments) {
        serviceAppointments.forEach(appointment => {
          const timeSlot = appointment.provider_service_time_slots;
          const service = appointment.provider_services;
          const appointmentDate = parseISO(appointment.appointment_date);
          const today = startOfDay(new Date());
          
          let status: 'pending' | 'upcoming' | 'overdue' | 'completed' = 'pending';
          let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
          
          if (isBefore(appointmentDate, today)) {
            status = 'overdue';
            priority = 'urgent';
          } else if (isAfter(appointmentDate, addDays(today, 7))) {
            status = 'upcoming';
            priority = 'low';
          } else {
            status = 'pending';
            priority = 'high';
          }

          allReminders.push({
            id: `service-${appointment.id}`,
            type: 'service_appointment',
            title: service?.service_name || 'Servicio',
            description: service?.service_category || 'Cita de servicio',
            date: appointment.appointment_date,
            time: timeSlot?.slot_start_time ? timeSlot.slot_start_time.substring(0, 5) : undefined,
            pet_id: '', // Service appointments might not have a specific pet
            pet_name: 'Todas las mascotas', // Service appointments are for all pets
            status,
            source_id: appointment.id,
            priority
          });
        });
      }

      // Mark reminders as completed if they're in the completed set
      allReminders.forEach(reminder => {
        if (completedReminders.has(reminder.id)) {
          reminder.status = 'completed';
        }
      });

      // Sort reminders by date
      allReminders.sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateA.getTime() - dateB.getTime();
      });

      setReminders(allReminders);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los recordatorios');
    } finally {
      setLoading(false);
    }
  };

  const filteredReminders = reminders.filter(reminder => {
    // Exclude completed reminders from main view (unless specifically filtering for them)
    if (reminder.status === 'completed' && filterDate !== 'completed') {
      return false;
    }

    // Filter by pet
    if (filterPet !== 'all' && reminder.pet_id !== filterPet) {
      return false;
    }

    // Filter by date
    const reminderDate = parseISO(reminder.date);
    const today = startOfDay(new Date());
    const weekFromNow = addDays(today, 7);
    const monthFromNow = addDays(today, 30);

    if (filterDate === 'today') {
      return isSameDay(reminderDate, today);
    } else if (filterDate === 'week') {
      return isAfter(reminderDate, today) && isBefore(reminderDate, weekFromNow);
    } else if (filterDate === 'month') {
      return isAfter(reminderDate, today) && isBefore(reminderDate, monthFromNow);
    } else if (filterDate === 'overdue') {
      return reminder.status === 'overdue';
    } else if (filterDate === 'completed') {
      return reminder.status === 'completed';
    }

    return true;
  });

  const remindersForSelectedDate = selectedDate 
    ? filteredReminders.filter(reminder => isSameDay(parseISO(reminder.date), selectedDate))
    : [];

  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => r.status === 'pending').length,
    upcoming: reminders.filter(r => r.status === 'upcoming').length,
    overdue: reminders.filter(r => r.status === 'overdue').length,
    vaccinations: reminders.filter(r => r.type === 'vaccination').length,
    followUps: reminders.filter(r => r.type === 'follow_up').length,
    serviceAppointments: reminders.filter(r => r.type === 'service_appointment').length
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'vaccination':
        return Shield;
      case 'follow_up':
        return Stethoscope;
      case 'service_appointment':
        return Scissors;
      default:
        return Bell;
    }
  };

  const getReminderColor = (type: string) => {
    switch (type) {
      case 'vaccination':
        return 'text-blue-500';
      case 'follow_up':
        return 'text-red-500';
      case 'service_appointment':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Vencido</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">Pendiente</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Próximo</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      default:
        return null;
    }
  };

  const handleMarkAsCompleted = async (reminder: Reminder) => {
    try {
      // For service appointments, update the status in the database
      if (reminder.type === 'service_appointment') {
        const { error } = await supabase
          .from('service_appointments')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', reminder.source_id);

        if (error) {
          console.error('Error updating service appointment:', error);
          toast.error('Error al marcar la cita como completada');
          return;
        }
      }

      // For vaccinations and follow-ups, we can clear the follow_up_date or just mark as completed locally
      if (reminder.type === 'vaccination' || reminder.type === 'follow_up') {
        // Optionally update the follow_up_date to null to remove it from reminders
        // For now, we'll just mark it as completed locally
        const { error } = await supabase
          .from('veterinary_sessions')
          .update({ 
            follow_up_date: null // Remove follow-up date to stop showing as reminder
          })
          .eq('id', reminder.source_id);

        if (error) {
          console.error('Error updating veterinary session:', error);
          // Continue anyway - we'll mark it as completed locally
        }
      }

      // Mark as completed in local state
      setCompletedReminders(prev => new Set([...prev, reminder.id]));
      
      // Update reminder status
      setReminders(prev => prev.map(r => 
        r.id === reminder.id ? { ...r, status: 'completed' as const } : r
      ));

      toast.success('Recordatorio marcado como completado');
    } catch (error) {
      console.error('Error marking reminder as completed:', error);
      toast.error('Error al marcar el recordatorio como completado');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <PageHeader 
        title="Recordatorios"
        subtitle="Vacunas, citas de seguimiento y servicios programados"
        gradient="from-purple-600 to-indigo-600"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Bell className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-xl md:text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Próximos</p>
                <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.upcoming}</p>
              </div>
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Vencidos</p>
                <p className="text-xl md:text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="filter_pet">Mascota</Label>
              <Select value={filterPet} onValueChange={setFilterPet}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las mascotas</SelectItem>
                  {pets.map(pet => (
                    <SelectItem key={pet.id} value={pet.id}>{pet.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="filter_date">Fecha</Label>
              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fechas</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="overdue">Vencidos</SelectItem>
                  <SelectItem value="completed">Completados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Reminders - Always Visible */}
      {stats.overdue > 0 && (
        <Card className="border-2 border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-base md:text-lg text-red-800">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Recordatorios Vencidos ({stats.overdue})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {filteredReminders
                .filter(r => r.status === 'overdue')
                .map((reminder) => {
                  const IconComponent = getReminderIcon(reminder.type);
                  
                  return (
                    <div 
                      key={reminder.id} 
                      className="p-4 rounded-lg border-2 border-red-200 bg-white"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <IconComponent className={`h-5 w-5 flex-shrink-0 ${getReminderColor(reminder.type)}`} />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm md:text-base truncate text-red-900">{reminder.title}</h3>
                            <p className="text-xs md:text-sm text-gray-600 truncate">{reminder.description}</p>
                          </div>
                        </div>
                        <Badge className="bg-red-100 text-red-800">Vencido</Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs md:text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(parseISO(reminder.date), "d 'de' MMMM, yyyy", { locale: es })}</span>
                        </div>
                        {reminder.time && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{reminder.time}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{reminder.pet_name}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsCompleted(reminder)}
                          className="w-full bg-green-500 hover:bg-green-600 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar como Completado
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Reminders - Always Visible */}
      {stats.pending > 0 && (
        <Card className="border-2 border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-base md:text-lg text-orange-800">
              <Clock className="w-5 h-5 mr-2 text-orange-600" />
              Recordatorios Pendientes ({stats.pending})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {filteredReminders
                .filter(r => r.status === 'pending')
                .map((reminder) => {
                  const IconComponent = getReminderIcon(reminder.type);
                  
                  return (
                    <div 
                      key={reminder.id} 
                      className="p-4 rounded-lg border-2 border-orange-200 bg-white"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <IconComponent className={`h-5 w-5 flex-shrink-0 ${getReminderColor(reminder.type)}`} />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm md:text-base truncate text-orange-900">{reminder.title}</h3>
                            <p className="text-xs md:text-sm text-gray-600 truncate">{reminder.description}</p>
                          </div>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800">Pendiente</Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs md:text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(parseISO(reminder.date), "d 'de' MMMM, yyyy", { locale: es })}</span>
                        </div>
                        {reminder.time && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{reminder.time}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{reminder.pet_name}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-orange-200">
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsCompleted(reminder)}
                          className="w-full bg-green-500 hover:bg-green-600 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar como Completado
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar and Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base md:text-lg">
                <CalendarDays className="w-5 h-5 mr-2" />
                Calendario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  hasReminders: filteredReminders.map(r => startOfDay(parseISO(r.date))),
                  hasOverdue: filteredReminders
                    .filter(r => r.status === 'overdue')
                    .map(r => startOfDay(parseISO(r.date)))
                }}
                modifiersClassNames={{
                  hasReminders: "bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-800 font-semibold border border-purple-200",
                  hasOverdue: "bg-red-200 text-red-900 font-bold border-2 border-red-400"
                }}
              />
              {selectedDate && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-900">
                    {remindersForSelectedDate.length} recordatorio{remindersForSelectedDate.length !== 1 ? 's' : ''} el {format(selectedDate, "d 'de' MMMM", { locale: es })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reminders List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">
                {selectedDate 
                  ? `Recordatorios del ${format(selectedDate, "d 'de' MMMM", { locale: es })}`
                  : filterDate === 'overdue'
                  ? 'Recordatorios Vencidos'
                  : 'Todos los Recordatorios'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {(selectedDate ? remindersForSelectedDate : filteredReminders)
                  .filter(r => {
                    // When a specific date is selected, show ALL reminders for that date
                    // When showing all reminders, exclude overdue and pending if already shown in dedicated sections above
                    if (selectedDate) {
                      return true; // Show all reminders for selected date
                    }
                    // Exclude overdue and pending if already shown in dedicated sections above
                    if (filterDate === 'all' || filterDate === 'today' || filterDate === 'week' || filterDate === 'month') {
                      return r.status !== 'overdue' && r.status !== 'pending';
                    }
                    return true;
                  })
                  .map((reminder) => {
                    const IconComponent = getReminderIcon(reminder.type);
                    const isOverdue = reminder.status === 'overdue';
                    
                    return (
                      <div 
                        key={reminder.id} 
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isOverdue 
                            ? 'border-red-200 bg-red-50' 
                            : reminder.status === 'pending'
                            ? 'border-orange-200 bg-orange-50'
                            : 'border-gray-200 bg-white hover:border-purple-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <IconComponent className={`h-5 w-5 flex-shrink-0 ${getReminderColor(reminder.type)}`} />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-sm md:text-base truncate">{reminder.title}</h3>
                              <p className="text-xs md:text-sm text-gray-600 truncate">{reminder.description}</p>
                            </div>
                          </div>
                          {getStatusBadge(reminder.status)}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs md:text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(parseISO(reminder.date), "d 'de' MMMM, yyyy", { locale: es })}</span>
                          </div>
                          {reminder.time && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{reminder.time}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Heart className="h-4 w-4" />
                            <span>{reminder.pet_name}</span>
                          </div>
                        </div>
                        
                        {reminder.status !== 'completed' && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <Button
                              size="sm"
                              onClick={() => handleMarkAsCompleted(reminder)}
                              className="w-full bg-green-500 hover:bg-green-600 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marcar como Completado
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {(selectedDate ? remindersForSelectedDate : filteredReminders)
                .filter(r => {
                  // When a specific date is selected, show ALL reminders for that date
                  if (selectedDate) {
                    return true; // Show all reminders for selected date
                  }
                  // Exclude overdue and pending if already shown in dedicated sections above
                  if (filterDate === 'all' || filterDate === 'today' || filterDate === 'week' || filterDate === 'month') {
                    return r.status !== 'overdue' && r.status !== 'pending';
                  }
                  return true;
                }).length === 0 && (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay recordatorios
                  </h3>
                  <p className="text-gray-600">
                    {selectedDate 
                      ? `No hay recordatorios para el ${format(selectedDate, "d 'de' MMMM", { locale: es })}`
                      : 'No se encontraron recordatorios con los filtros aplicados.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Recordatorios;
