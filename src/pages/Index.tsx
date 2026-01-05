
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { AppProvider } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const Index: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileCreated, setProfileCreated] = useState(false);

  // Create user profile if it doesn't exist (after email confirmation)
  useEffect(() => {
    if (loading || !user || profileCreated) return;

    const createProfileIfNeeded = async () => {
      try {
        // Check if profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('id, role')
          .eq('user_id', user.id)
          .single();

        // If profile doesn't exist, create it
        if (fetchError && fetchError.code === 'PGRST116') {
          console.log('Index: No profile found, creating profile...');
          
          // Get pending registration data from localStorage
          const pendingDataStr = localStorage.getItem('pending_profile_data');
          const pendingData = pendingDataStr ? JSON.parse(pendingDataStr) : null;
          
          // Create profile with pending data or default values
          const { error: createError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              full_name: pendingData?.full_name || null,
              phone: pendingData?.phone || null,
              role: pendingData?.role || localStorage.getItem('user_role') || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (createError) {
            console.error('Index: Error creating profile:', createError);
          } else {
            console.log('Index: Profile created successfully');
            // Clear pending data
            localStorage.removeItem('pending_profile_data');
            setProfileCreated(true);
          }
        } else if (existingProfile) {
          // Profile exists, update with pending data if available or if profile has NULL fields
          const pendingDataStr = localStorage.getItem('pending_profile_data');
          const needsUpdate = pendingDataStr || 
            !existingProfile.full_name || 
            !existingProfile.role ||
            (existingProfile.role === null && localStorage.getItem('user_role'));

          if (needsUpdate) {
            const pendingData = pendingDataStr ? JSON.parse(pendingDataStr) : null;
            const roleToUse = pendingData?.role || localStorage.getItem('user_role') || existingProfile.role;
            
            const updateData: any = {
              updated_at: new Date().toISOString()
            };

            // Update fields that are NULL or if we have pending data
            if (pendingData) {
              if (pendingData.full_name && !existingProfile.full_name) {
                updateData.full_name = pendingData.full_name;
              }
              if (pendingData.phone && !existingProfile.phone) {
                updateData.phone = pendingData.phone;
              }
              if (pendingData.role) {
                updateData.role = pendingData.role;
              }
            } else {
              // If no pending data but profile has NULL fields, try to get from localStorage
              const storedRole = localStorage.getItem('user_role');
              if (storedRole && !existingProfile.role) {
                updateData.role = storedRole;
              }
            }

            // Only update if we have something to update
            if (Object.keys(updateData).length > 1 || updateData.role) {
              if (roleToUse && !updateData.role) {
                updateData.role = roleToUse;
              }

              const { error: updateError } = await supabase
                .from('user_profiles')
                .update(updateData)
                .eq('user_id', user.id);
              
              if (updateError) {
                console.error('Index: Error updating profile:', updateError);
              } else {
                console.log('Index: Profile updated with registration data');
                if (roleToUse) {
                  localStorage.setItem('user_role', roleToUse);
                }
              }
            }

            if (pendingDataStr) {
              localStorage.removeItem('pending_profile_data');
            }
          }
          setProfileCreated(true);
        }
      } catch (error) {
        console.error('Index: Error in createProfileIfNeeded:', error);
      }
    };

    createProfileIfNeeded();
  }, [user, loading, profileCreated]);

  useEffect(() => {
    if (loading) return
    
    // Check if user is authenticated first
    if (!user) {
      console.log('No authenticated user, redirecting to auth')
      navigate('/login')
      return
    }
    
    console.log('Index: Checking role-based routing...')
    console.log('Current pathname:', location.pathname)
    
    // For testing purposes, you can uncomment this line to clear the role and test role selection
    // localStorage.removeItem('user_role');
    
    const role = localStorage.getItem('user_role') as 'client' | 'provider' | 'shelter' | null
    console.log('Stored role:', role)
    
    if (!role) {
      console.log('No role found, redirecting to role selection')
      navigate('/role')
      return
    }
    
    // Only redirect if we're not already on the correct route
    if (role === 'provider' && location.pathname !== '/provider') {
      console.log('Provider role detected, redirecting to provider dashboard')
      navigate('/provider')
      return
    }
    if (role === 'shelter' && location.pathname !== '/shelter-dashboard') {
      console.log('Shelter role detected, redirecting to shelter dashboard')
      navigate('/shelter-dashboard')
      return
    }
    if (role === 'client' && location.pathname !== '/marketplace/products' && location.pathname !== '/' && 
        location.pathname !== '/dashboard' &&
        !location.pathname.startsWith('/ajustes') && !location.pathname.startsWith('/care-hub') && 
        !location.pathname.startsWith('/social-hub') && !location.pathname.startsWith('/pet-shop') &&
        !location.pathname.startsWith('/marketplace') && !location.pathname.startsWith('/adopcion') && 
        !location.pathname.startsWith('/parejas') && !location.pathname.startsWith('/mascotas-perdidas') &&
        !location.pathname.startsWith('/trazabilidad') &&
        !location.pathname.startsWith('/feeding-schedules') && !location.pathname.startsWith('/veterinaria') &&
        !location.pathname.startsWith('/recordatorios') &&
        !location.pathname.startsWith('/meal-journal') && !location.pathname.startsWith('/adventure-log') && 
        !location.pathname.startsWith('/health-journal') && !location.pathname.startsWith('/pet-reminders') && 
        !location.pathname.startsWith('/deliveries') && !location.pathname.startsWith('/client-orders') &&
        !location.pathname.startsWith('/pet-journey') &&
        !location.pathname.startsWith('/marketplace/services') && !location.pathname.startsWith('/marketplace/products')) {
      console.log('Client role detected, redirecting to products page')
      navigate('/marketplace/products')
      return
    }
    
    console.log('No redirect needed, staying on current route')
  }, [user, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🐾</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">Cargando PetHub...</h2>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
};

export default Index;
