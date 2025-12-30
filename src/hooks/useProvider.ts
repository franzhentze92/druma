import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ProviderProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  phone: string;
  address: string;
  description: string;
  profile_picture_url: string; // Mandatory profile picture
  logo_url?: string;
  is_verified: boolean;
  rating: number;
  total_reviews: number;
  city_id?: number;
  google_place_id?: string;
  formatted_address?: string;
  neighborhood?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  has_delivery?: boolean;
  has_pickup?: boolean;
  delivery_fee?: number;
  created_at: string;
  updated_at: string;
}

export interface ProviderService {
  id: string;
  provider_id: string;
  service_name: string;
  service_category: string; // e.g., "Veterinaria", "Grooming", "Entrenamiento"
  description: string;
  detailed_description?: string; // More detailed information for clients
  price: number; // Precio general (para retrocompatibilidad)
  // Precios por tamaño de perro (dog_size system)
  price_small?: number | null; // Precio para perros pequeños
  price_medium?: number | null; // Precio para perros medianos
  price_large?: number | null; // Precio para perros grandes
  price_extra_large?: number | null; // Precio para perros extra grandes
  currency: string; // GTQ for Quetzales
  duration_minutes: number;
  preparation_instructions?: string; // What clients need to prepare
  cancellation_policy?: string; // Cancellation terms
  max_advance_booking_days: number; // How far in advance clients can book
  min_advance_booking_hours: number; // Minimum notice required
  is_active: boolean;
  service_image_url?: string; // Image of the service
  created_at: string;
  updated_at: string;
}

export interface ProviderServiceAvailability {
  id: string;
  service_id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, etc.
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  is_available: boolean;
  created_at: string;
}

export interface ProviderServiceTimeSlot {
  id: string;
  service_id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, etc.
  slot_start_time: string; // HH:MM format
  slot_end_time: string; // HH:MM format
  is_available: boolean;
  max_bookings_per_slot: number;
  created_at: string;
}

export interface ProviderAppointment {
  id: string;
  provider_id: string;
  client_id: string;
  service_id: string;
  appointment_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
  appointment_time?: string;
  // Joined data
  provider_services?: {
    service_name: string;
    service_category?: string;
    description?: string;
    detailed_description?: string;
    price: number;
    currency: string;
    duration_minutes?: number;
    preparation_instructions?: string;
    cancellation_policy?: string;
  };
  client_email?: string;
}

export interface ProviderProduct {
  id: string;
  provider_id: string;
  product_name: string;
  product_category: string;
  description: string;
  detailed_description?: string;
  price: number; // Precio general (para retrocompatibilidad)
  // Precios por tamaño de perro (dog_size system)
  price_small?: number | null; // Precio para perros pequeños
  price_medium?: number | null; // Precio para perros medianos
  price_large?: number | null; // Precio para perros grandes
  price_extra_large?: number | null; // Precio para perros extra grandes
  // Precios por talla de ropa (clothing_size system)
  price_xs?: number | null; // Precio para talla XS
  price_s?: number | null; // Precio para talla S
  price_m?: number | null; // Precio para talla M
  price_l?: number | null; // Precio para talla L
  price_xl?: number | null; // Precio para talla XL
  price_xxl?: number | null; // Precio para talla XXL
  currency: string;
  stock_quantity: number;
  min_stock_alert: number;
  is_active: boolean;
  product_image_url?: string; // Imagen principal
  secondary_images?: string[]; // Array de hasta 5 imágenes secundarias
  brand?: string;
  weight_kg?: number;
  dimensions_cm?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export const useProvider = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [products, setProducts] = useState<ProviderProduct[]>([]);
  const [appointments, setAppointments] = useState<ProviderAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch provider profile
  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, this is normal for new users
          setProfile(null);
        } else {
          throw error;
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching provider profile:', err);
      setError(err instanceof Error ? err.message : 'Error fetching profile');
    } finally {
      setLoading(false);
    }
  };

  // Create or update provider profile
  const saveProfile = async (profileData: Partial<ProviderProfile>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      let result;

      if (profile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('providers')
          .update({
            ...profileData,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('providers')
          .insert({
            ...profileData,
            user_id: user.id
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      setProfile(result);
      return result;
    } catch (err) {
      console.error('Error saving provider profile:', err);
      setError(err instanceof Error ? err.message : 'Error saving profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Upload profile picture
  const uploadProfilePicture = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `provider-profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('provider-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('provider-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      throw new Error('Failed to upload profile picture');
    }
  };

  // Fetch provider services
  const fetchServices = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('provider_services')
        .select('*')
        .eq('provider_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err instanceof Error ? err.message : 'Error fetching services');
    }
  };

  // Add new service
  const addService = async (serviceData: Omit<ProviderService, 'id' | 'provider_id' | 'created_at' | 'updated_at'>) => {
    if (!profile) throw new Error('Provider profile not found');

    try {
      const { data, error } = await supabase
        .from('provider_services')
        .insert({
          ...serviceData,
          provider_id: profile.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setServices(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding service:', err);
      setError(err instanceof Error ? err.message : 'Error adding service');
      throw err;
    }
  };

  // Update service
  const updateService = async (serviceId: string, updates: Partial<ProviderService>) => {
    try {
      const { data, error } = await supabase
        .from('provider_services')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;
      setServices(prev => prev.map(service => 
        service.id === serviceId ? data : service
      ));
      return data;
    } catch (err) {
      console.error('Error updating service:', err);
      setError(err instanceof Error ? err.message : 'Error updating service');
      throw err;
    }
  };

  // Delete service
  const deleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('provider_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      setServices(prev => prev.filter(service => service.id !== serviceId));
    } catch (err) {
      console.error('Error deleting service:', err);
      setError(err instanceof Error ? err.message : 'Error deleting service');
      throw err;
    }
  };

  // Fetch service availability
  const fetchServiceAvailability = async (serviceId: string) => {
    try {
      console.log('Fetching availability for service:', serviceId);
      const { data, error } = await supabase
        .from('provider_service_availability')
        .select('*')
        .eq('service_id', serviceId)
        .order('day_of_week', { ascending: true });

      if (error) {
        // If table doesn't exist, return empty array instead of throwing
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('Availability table not found, returning empty array');
          return [];
        }
        throw error;
      }
      
      console.log('Fetched availability data:', data);
      if (data) {
        console.log('Availability by day:');
        data.forEach(avail => {
          console.log(`  Day ${avail.day_of_week}: ${avail.start_time} - ${avail.end_time}`);
        });
      }
      
      return data || [];
    } catch (err) {
      console.error('Error fetching service availability:', err);
      // Return empty array on error to prevent crashes
      return [];
    }
  };

  // Fetch service time slots
  const fetchServiceTimeSlots = async (serviceId: string) => {
    try {
      const { data, error } = await supabase
        .from('provider_service_time_slots')
        .select('*')
        .eq('service_id', serviceId)
        .order('day_of_week', { ascending: true });

      if (error) {
        // If table doesn't exist, return empty array instead of throwing
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('Time slots table not found, returning empty array');
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error('Error fetching service time slots:', err);
      // Return empty array on error to prevent crashes
      return [];
    }
  };

  // Save service availability
  const saveServiceAvailability = async (serviceId: string, availability: Omit<ProviderServiceAvailability, 'id' | 'service_id' | 'created_at'>[]) => {
    console.log('=== saveServiceAvailability CALLED ===');
    console.log('Service ID:', serviceId);
    console.log('Availability array:', availability);
    console.log('Availability length:', availability.length);
    
    try {
      // Check if table exists first
      const { error: checkError } = await supabase
        .from('provider_service_availability')
        .select('id')
        .limit(1);

      if (checkError) {
        if (checkError.code === 'PGRST116' || checkError.message.includes('relation') || checkError.message.includes('does not exist')) {
          console.error('❌ Availability table not found!', checkError);
          throw new Error('La tabla de disponibilidad no existe en la base de datos');
        }
        throw checkError;
      }

      console.log('✅ Table exists, proceeding with save');

      // Delete existing availability for this service
      console.log('Deleting existing availability for service:', serviceId);
      const { error: deleteError } = await supabase
        .from('provider_service_availability')
        .delete()
        .eq('service_id', serviceId);
      
      if (deleteError) {
        console.warn('Warning deleting existing availability:', deleteError);
        // Don't throw, continue with insert
      } else {
        console.log('✅ Existing availability deleted');
      }

      // Insert new availability
      if (availability.length > 0) {
        const availabilityData = availability.map(item => ({
          ...item,
          service_id: serviceId,
          // Ensure day_of_week is a number
          day_of_week: typeof item.day_of_week === 'string' ? parseInt(item.day_of_week, 10) : item.day_of_week,
          // Ensure times are in HH:MM format (remove seconds if present)
          start_time: item.start_time ? item.start_time.substring(0, 5) : '09:00',
          end_time: item.end_time ? item.end_time.substring(0, 5) : '17:00'
        }));

        console.log('📤 Inserting availability data:', JSON.stringify(availabilityData, null, 2));

        const { data: insertedData, error } = await supabase
          .from('provider_service_availability')
          .insert(availabilityData)
          .select();

        if (error) {
          console.error('❌ Error inserting availability:', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        
        console.log('✅ Successfully inserted availability:', insertedData);
        console.log('Inserted records count:', insertedData?.length || 0);
      } else {
        console.warn('⚠️ No availability data to save (empty array)');
      }
      
      console.log('=== saveServiceAvailability COMPLETE ===');
    } catch (err) {
      console.error('❌ Error saving service availability:', err);
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      // NOW THROW THE ERROR so it can be caught and displayed to the user
      throw err;
    }
  };

  // Save service time slots
  const saveServiceTimeSlots = async (serviceId: string, timeSlots: Omit<ProviderServiceTimeSlot, 'id' | 'service_id' | 'created_at'>[]) => {
    try {
      // Check if table exists first
      const { error: checkError } = await supabase
        .from('provider_service_time_slots')
        .select('id')
        .limit(1);

      if (checkError) {
        if (checkError.code === 'PGRST116' || checkError.message.includes('relation') || checkError.message.includes('does not exist')) {
          console.warn('Time slots table not found, skipping save');
          return;
        }
        throw checkError;
      }

      // Delete existing time slots for this service
      await supabase
        .from('provider_service_time_slots')
        .delete()
        .eq('service_id', serviceId);

      // Insert new time slots
      if (timeSlots.length > 0) {
        const timeSlotsData = timeSlots.map(item => ({
          ...item,
          service_id: serviceId,
          // Ensure day_of_week is a number
          day_of_week: typeof item.day_of_week === 'string' ? parseInt(item.day_of_week, 10) : item.day_of_week,
          // Ensure times are in HH:MM format (remove seconds if present)
          slot_start_time: item.slot_start_time ? item.slot_start_time.substring(0, 5) : '09:00',
          slot_end_time: item.slot_end_time ? item.slot_end_time.substring(0, 5) : '10:00'
        }));

        console.log('Inserting time slots data:', timeSlotsData);

        const { data: insertedData, error } = await supabase
          .from('provider_service_time_slots')
          .insert(timeSlotsData)
          .select();

        if (error) {
          console.error('Error inserting time slots:', error);
          throw error;
        }
        
        console.log('Successfully inserted time slots:', insertedData);
      } else {
        console.log('No time slots data to save (empty array)');
      }
    } catch (err) {
      console.error('Error saving service time slots:', err);
      // Don't throw error to prevent service save from failing
      // Just log it for debugging
    }
  };

  // Fetch appointments with proper joins from service_appointments
  const fetchAppointments = async () => {
    if (!profile || !user) return;

    try {
      console.log('Fetching appointments for provider:', profile.id, 'user:', user.id);
      
      // Fetch service appointments where provider_id matches the user_id
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('service_appointments')
        .select(`
          *,
          provider_services:provider_services!service_appointments_service_id_fkey (
            service_name,
            service_category,
            description,
            detailed_description,
            price,
            currency,
            duration_minutes,
            preparation_instructions,
            cancellation_policy,
            providers:providers!provider_services_provider_id_fkey (
              business_name,
              user_id
            )
          ),
          provider_service_time_slots:provider_service_time_slots!service_appointments_time_slot_id_fkey (
            slot_start_time,
            slot_end_time
          )
        `)
        .eq('provider_id', user.id)
        .order('appointment_date', { ascending: true });

      console.log('Service appointments query result:', { 
        count: appointmentsData?.length || 0, 
        appointmentsError 
      });

      if (appointmentsError) {
        console.error('Error fetching service appointments:', appointmentsError);
        throw appointmentsError;
      }

      // Enrich appointments with client information
      const enrichedAppointments = await Promise.all(
        (appointmentsData || []).map(async (appointment) => {
          // Get client email from orders table using client_id
          let clientEmail = appointment.client_email || 'N/A';
          
          // If no client_email in appointment, try to get it from orders
          if (!appointment.client_email && appointment.order_id) {
            const { data: orderData } = await supabase
              .from('orders')
              .select('client_email')
              .eq('id', appointment.order_id)
              .single();
            
            if (orderData) {
              clientEmail = orderData.client_email || 'N/A';
            }
          }

          // Get time slot information
          const timeSlot = appointment.provider_service_time_slots;
          let appointmentTime = '';
          if (timeSlot?.slot_start_time && timeSlot?.slot_end_time) {
            appointmentTime = `${timeSlot.slot_start_time.substring(0, 5)} - ${timeSlot.slot_end_time.substring(0, 5)}`;
          } else if (appointment.appointment_date) {
            // Fallback to appointment_date if time slot not available
            const date = new Date(appointment.appointment_date);
            appointmentTime = date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
          }

          return {
            id: appointment.id,
            provider_id: appointment.provider_id,
            client_id: appointment.client_id,
            service_id: appointment.service_id,
            appointment_date: appointment.appointment_date,
            status: appointment.status || 'pending',
            notes: appointment.notes,
            created_at: appointment.created_at,
            updated_at: appointment.updated_at,
            provider_services: appointment.provider_services ? {
              service_name: appointment.provider_services.service_name,
              service_category: appointment.provider_services.service_category,
              description: appointment.provider_services.description,
              detailed_description: appointment.provider_services.detailed_description,
              price: appointment.provider_services.price,
              currency: appointment.provider_services.currency,
              duration_minutes: appointment.provider_services.duration_minutes,
              preparation_instructions: appointment.provider_services.preparation_instructions,
              cancellation_policy: appointment.provider_services.cancellation_policy
            } : null,
            client_email: clientEmail,
            appointment_time: appointmentTime
          };
        })
      );

      console.log('Enriched appointments:', enrichedAppointments.length);
      setAppointments(enrichedAppointments);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err instanceof Error ? err.message : 'Error fetching appointments');
    }
  };

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId: string, status: ProviderAppointment['status']) => {
    try {
      console.log('Updating appointment status:', { appointmentId, status });
      
      const { data, error } = await supabase
        .from('service_appointments')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select()
        .single();

      console.log('Update appointment result:', { data, error });

      if (error) {
        console.error('Error updating appointment:', error);
        throw error;
      }

      setAppointments(prev => prev.map(appointment => 
        appointment.id === appointmentId 
          ? { ...appointment, status, updated_at: new Date().toISOString() }
          : appointment
      ));
      return data;
    } catch (err) {
      console.error('Error updating appointment status:', err);
      setError(err instanceof Error ? err.message : 'Error updating appointment status');
      throw err;
    }
  };

  // Load initial data
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Load services and appointments when profile is available
  useEffect(() => {
    if (profile) {
      fetchServices();
      fetchAppointments();
      fetchProducts();
    }
  }, [profile]);

  // Fetch products
  const fetchProducts = async () => {
    if (!profile) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('provider_products')
        .select('*')
        .eq('provider_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Error fetching products');
    }
  };

  // Add product
  const addProduct = async (productData: Omit<ProviderProduct, 'id' | 'provider_id' | 'created_at' | 'updated_at'>) => {
    if (!profile) throw new Error('No provider profile found');

    try {
      const { data, error } = await supabase
        .from('provider_products')
        .insert({
          ...productData,
          provider_id: profile.id
        })
        .select()
        .single();

      if (error) throw error;
      setProducts(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err instanceof Error ? err.message : 'Error adding product');
      throw err;
    }
  };

  // Update product
  const updateProduct = async (productId: string, productData: Partial<ProviderProduct>) => {
    try {
      const { data, error } = await supabase
        .from('provider_products')
        .update({
          ...productData,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      setProducts(prev => prev.map(product => 
        product.id === productId ? data : product
      ));
      return data;
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err instanceof Error ? err.message : 'Error updating product');
      throw err;
    }
  };

  // Delete product
  const deleteProduct = async (productId: string) => {
    try {
      // Get the product first to access its image URL
      const productToDelete = products.find(p => p.id === productId);
      
      // Delete the product from database
      const { error } = await supabase
        .from('provider_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      // If the product had an image, delete it from storage
      if (productToDelete?.product_image_url) {
        try {
          // Extract the file path from the URL
          const url = new URL(productToDelete.product_image_url);
          const pathParts = url.pathname.split('/');
          const filePath = pathParts.slice(-2).join('/'); // Get last two parts: bucket/file
          
          // Delete from storage
          await supabase.storage
            .from('product-images')
            .remove([filePath]);
        } catch (storageError) {
          // Log storage deletion error but don't fail the product deletion
          console.warn('Failed to delete product image from storage:', storageError);
        }
      }

      setProducts(prev => prev.filter(product => product.id !== productId));
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err instanceof Error ? err.message : 'Error deleting product');
      throw err;
    }
  };

  return {
    profile,
    services,
    products,
    appointments,
    loading,
    error,
    saveProfile,
    uploadProfilePicture,
    addService,
    updateService,
    deleteService,
    addProduct,
    updateProduct,
    deleteProduct,
    updateAppointmentStatus,
    fetchServiceAvailability,
    fetchServiceTimeSlots,
    saveServiceAvailability,
    saveServiceTimeSlots
  };
};
