import React from 'react';
import NotificationBell from './NotificationBell';
import SettingsDropdown from './SettingsDropdown';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  gradient?: string;
  children?: React.ReactNode;
  showNotifications?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  gradient = "from-purple-600 to-pink-600",
  children,
  showNotifications = false
}) => {
  return (
    <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p className="text-purple-100">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {showNotifications && <NotificationBell />}
          {children && children}
          <SettingsDropdown variant="gradient" />
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
