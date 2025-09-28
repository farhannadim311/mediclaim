import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  User, 
  Building2, 
  Shield, 
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Bell,
  Settings
} from 'lucide-react';

interface UserRole {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  stats: {
    totalClaims: number;
    pendingClaims: number;
    approvedClaims: number;
    totalAmount: number;
  };
}

const USER_ROLES: UserRole[] = [
  {
    id: 'patient',
    name: 'Patient',
    description: 'Submit and track your insurance claims',
    icon: <User className="h-8 w-8" />,
    color: 'blue',
    stats: {
      totalClaims: 3,
      pendingClaims: 2,
      approvedClaims: 1,
      totalAmount: 1325.50
    }
  },
  {
    id: 'provider',
    name: 'Healthcare Provider',
    description: 'Review and approve patient claims',
    icon: <Building2 className="h-8 w-8" />,
    color: 'green',
    stats: {
      totalClaims: 12,
      pendingClaims: 3,
      approvedClaims: 8,
      totalAmount: 8750.00
    }
  },
  {
    id: 'insurance',
    name: 'Insurance Company',
    description: 'Final review and payment processing',
    icon: <Shield className="h-8 w-8" />,
    color: 'purple',
    stats: {
      totalClaims: 45,
      pendingClaims: 5,
      approvedClaims: 38,
      totalAmount: 45620.75
    }
  },
  {
    id: 'demo',
    name: 'ZK Demo',
    description: 'Interactive zero-knowledge proof demonstration',
    icon: <Shield className="h-8 w-8" />,
    color: 'orange',
    stats: {
      totalClaims: 0,
      pendingClaims: 0,
      approvedClaims: 0,
      totalAmount: 0
    }
  }
];

interface MainNavigationProps {
  onRoleSelect: (role: string) => void;
  currentRole?: string;
}

export const MainNavigation: React.FC<MainNavigationProps> = ({ onRoleSelect, currentRole }) => {
  const [notifications] = useState([
    {
      id: '1',
      title: 'New claim submitted',
      message: 'John Doe submitted a medical invoice claim',
      timestamp: '2 minutes ago',
      isRead: false
    },
    {
      id: '2',
      title: 'Claim approved',
      message: 'Prescription drug claim has been approved',
      timestamp: '1 hour ago',
      isRead: true
    },
    {
      id: '3',
      title: 'System maintenance',
      message: 'Scheduled maintenance completed successfully',
      timestamp: '3 hours ago',
      isRead: true
    }
  ]);

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  const getRoleColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-400 bg-blue-500';
      case 'green': return 'text-green-400 bg-green-500';
      case 'purple': return 'text-purple-400 bg-purple-500';
      default: return 'text-gray-400 bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Shield className="h-10 w-10 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold">HealthClaim Portal</h1>
                <p className="text-gray-400">Privacy-preserving insurance claim verification</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="relative">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Choose Your Role</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Select your role to access the appropriate dashboard for managing insurance claims
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {USER_ROLES.map((role) => (
            <Card 
              key={role.id} 
              className={`bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer ${
                currentRole === role.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onRoleSelect(role.id)}
            >
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 rounded-full ${getRoleColor(role.color)} flex items-center justify-center mx-auto mb-4`}>
                    {role.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{role.name}</h3>
                  <p className="text-gray-400">{role.description}</p>
                </div>

                {/* Stats */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Claims:</span>
                    <span className="text-white font-semibold">{role.stats.totalClaims}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Pending:</span>
                    <span className="text-yellow-400 font-semibold">{role.stats.pendingClaims}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Approved:</span>
                    <span className="text-green-400 font-semibold">{role.stats.approvedClaims}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Amount:</span>
                    <span className="text-white font-semibold">{formatCurrency(role.stats.totalAmount)}</span>
                  </div>
                </div>

                <Button 
                  className={`w-full ${
                    role.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                    role.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                    role.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                    'bg-orange-600 hover:bg-orange-700'
                  } text-white`}
                >
                  Access Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="bg-gray-800 rounded-lg p-8 mb-12">
          <h3 className="text-2xl font-bold text-center mb-8">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Zero-Knowledge Proofs</h4>
              <p className="text-gray-400">
                Verify claims without revealing sensitive patient data using advanced cryptographic techniques
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Automated Verification</h4>
              <p className="text-gray-400">
                Business rules are automatically enforced through smart contracts and ZK circuits
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Real-time Tracking</h4>
              <p className="text-gray-400">
                Track claim status in real-time with instant notifications and updates
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`flex items-center justify-between p-4 rounded-lg ${
                  notification.isRead ? 'bg-gray-700' : 'bg-blue-900/20 border border-blue-500/20'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${notification.isRead ? 'bg-gray-500' : 'bg-blue-400'}`} />
                  <div>
                    <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                    <p className="text-xs text-gray-400">{notification.message}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{notification.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 HealthClaim Portal. Built with privacy-first principles using zero-knowledge proofs.</p>
            <p className="mt-2 text-sm">
              Powered by Midnight Network • Secure • Transparent • Private
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
