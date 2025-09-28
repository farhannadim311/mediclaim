import React, { useState } from 'react';
import { MainNavigation } from './MainNavigation';
import { PatientDashboard } from './PatientDashboard';
import { ProviderDashboard } from './ProviderDashboard';
import { InsuranceDashboard } from './InsuranceDashboard';
import { ClaimVerifier } from './ClaimVerifier';

type UserRole = 'patient' | 'provider' | 'insurance' | 'demo';

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (role: string) => {
    setCurrentRole(role as UserRole);
  };

  const handleBackToRoles = () => {
    setCurrentRole(null);
  };

  const renderDashboard = () => {
    switch (currentRole) {
      case 'patient':
        return <PatientDashboard onBack={handleBackToRoles} />;
      case 'provider':
        return <ProviderDashboard onBack={handleBackToRoles} />;
      case 'insurance':
        return <InsuranceDashboard onBack={handleBackToRoles} />;
      case 'demo':
        return <ClaimVerifier onBack={handleBackToRoles} />;
      default:
        return <MainNavigation onRoleSelect={handleRoleSelect} currentRole={currentRole} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {renderDashboard()}
    </div>
  );
};
