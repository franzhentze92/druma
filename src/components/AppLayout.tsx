import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import Navigation from './Navigation';
import Dashboard from './Dashboard';
import Trazabilidad from './Trazabilidad';
import Veterinaria from './Veterinaria';
import Comunicacion from './Comunicacion';
import Marketplace from './Marketplace';
import Adopcion from './Adopcion';
import Ajustes from './Ajustes';
import ClientOrders from './ClientOrders';
import ProviderOrders from './ProviderOrders';
import ProviderDashboard from './ProviderDashboard';
import ShelterDashboard from './ShelterDashboard';
import FeedingSchedulesPage from '../pages/FeedingSchedulesPage';
import Recordatorios from '../pages/Recordatorios';
import Parejas from '../pages/Parejas';
import MascotasPerdidas from '../pages/MascotasPerdidas';
import PetRoom from './PetRoom';
import SocialHub from './SocialHub';
import PetShop from './PetShop';
import MealJournal from './MealJournal';
import AdventureLog from './AdventureLog';
import HealthJournal from './HealthJournal';
import PetReminders from './PetReminders';
import Deliveries from './Deliveries';
import PetJourney from '../pages/PetJourney';

const AppLayout: React.FC = () => {
  const { activeSection } = useAppContext();
  const location = useLocation();
  
  // Get user role to determine which dashboard and components to show
  const userRole = localStorage.getItem('user_role');
  console.log('AppLayout: userRole from localStorage:', userRole);

  const renderContent = () => {
    // If user is a provider, show ProviderDashboard
    if (userRole === 'provider') {
      return <ProviderDashboard />;
    }
    
    // If user is a shelter, show ShelterDashboard
    if (userRole === 'shelter') {
      return <ShelterDashboard />;
    }
    
    // For client users, check if we're on a new gamified route
    if (userRole === 'client') {
      const pathname = location.pathname;
      
      // Handle new gamified routes - removed pet-room as default
      if (pathname === '/pet-room') {
        return <PetRoom />;
      }
      if (pathname === '/social-hub') {
        return <SocialHub />;
      }
      if (pathname === '/pet-shop') {
        return <PetShop />;
      }
      if (pathname === '/marketplace') {
        return <Marketplace />;
      }
      if (pathname === '/adopcion') {
        return <Adopcion />;
      }
      if (pathname === '/parejas') {
        return <Parejas />;
      }
      if (pathname === '/mascotas-perdidas') {
        return <MascotasPerdidas />;
      }
      if (pathname === '/trazabilidad') {
        return <Trazabilidad />;
      }
      if (pathname === '/feeding-schedules') {
        return <FeedingSchedulesPage />;
      }
      if (pathname === '/veterinaria') {
        return <Veterinaria />;
      }
      if (pathname === '/recordatorios') {
        return <Recordatorios />;
      }
      if (pathname === '/meal-journal') {
        return <MealJournal />;
      }
      if (pathname === '/adventure-log') {
        return <AdventureLog />;
      }
      if (pathname === '/health-journal') {
        return <HealthJournal />;
      }
      if (pathname === '/pet-reminders') {
        return <PetReminders />;
      }
      if (pathname === '/deliveries') {
        return <Deliveries />;
      }
      if (pathname === '/ajustes') {
        return <Ajustes />;
      }
      if (pathname === '/client-orders') {
        return <ClientOrders />;
      }
      if (pathname === '/marketplace/services') {
        return <Marketplace />;
      }
      if (pathname === '/marketplace/products') {
        return <Marketplace />;
      }
      if (pathname === '/dashboard') {
        return <Dashboard />;
      }
      if (pathname.startsWith('/pet-journey/')) {
        return <PetJourney />;
      }
      
      // Handle old routes for backward compatibility
      switch (activeSection) {
        case 'dashboard':
          return <Dashboard />;
        case 'trazabilidad':
          return <Trazabilidad />;
        case 'feeding-schedules':
          return <FeedingSchedulesPage />;
        case 'veterinaria':
          return <Veterinaria />;
        case 'recordatorios':
          return <Recordatorios />;
        case 'parejas':
          return <Parejas />;
        case 'comunicacion':
          return <Comunicacion />;
        case 'marketplace':
          return <Marketplace />;
        case 'orders':
          return <ClientOrders />;
        case 'adopcion':
          return <Adopcion />;
        case 'mascotas-perdidas':
          return <MascotasPerdidas />;
        case 'ajustes':
          return <Ajustes />;
        default:
          return <Marketplace />; // Default to Marketplace products page
      }
    }
    
    return <Dashboard />;
  };

  return (
    <NavigationProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        {/* Main Content with bottom padding for fixed navigation menu */}
        <main className="pb-24 md:pb-0">
          {renderContent()}
        </main>
        
        {/* Navigation - only show for client users */}
        {userRole === 'client' && <Navigation />}
        
      </div>
    </NavigationProvider>
  );
};

export default AppLayout;