import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { 
  Mail, 
  MessageSquare, 
  Bell, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock,
  Send,
  Phone,
  AtSign
} from 'lucide-react';

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms';
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
}

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailAddress: string;
  phoneNumber: string;
  notificationTypes: {
    claimSubmitted: boolean;
    claimApproved: boolean;
    claimRejected: boolean;
    claimUnderReview: boolean;
    paymentProcessed: boolean;
  };
}

const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'claim-submitted',
    name: 'Claim Submitted',
    type: 'email',
    subject: 'Your insurance claim has been submitted',
    body: 'Dear {{patientName}},\n\nYour {{claimType}} claim for ${{amount}} has been successfully submitted and is now under review.\n\nClaim ID: {{claimId}}\nService Date: {{serviceDate}}\n\nYou will receive updates as your claim progresses through the review process.\n\nBest regards,\nHealthClaim Portal Team',
    variables: ['patientName', 'claimType', 'amount', 'claimId', 'serviceDate'],
    isActive: true
  },
  {
    id: 'claim-approved',
    name: 'Claim Approved',
    type: 'email',
    subject: 'Your insurance claim has been approved',
    body: 'Dear {{patientName}},\n\nGreat news! Your {{claimType}} claim for ${{amount}} has been approved.\n\nClaim ID: {{claimId}}\nApproved Amount: ${{amount}}\n\nPayment will be processed within 3-5 business days and will be sent to your registered payment method.\n\nThank you for using HealthClaim Portal.\n\nBest regards,\nHealthClaim Portal Team',
    variables: ['patientName', 'claimType', 'amount', 'claimId'],
    isActive: true
  },
  {
    id: 'claim-rejected',
    name: 'Claim Rejected',
    type: 'email',
    subject: 'Your insurance claim requires attention',
    body: 'Dear {{patientName}},\n\nUnfortunately, your {{claimType}} claim for ${{amount}} could not be approved at this time.\n\nClaim ID: {{claimId}}\nReason: {{rejectionReason}}\n\nPlease review the reason provided and contact us if you have any questions or would like to resubmit your claim with additional documentation.\n\nBest regards,\nHealthClaim Portal Team',
    variables: ['patientName', 'claimType', 'amount', 'claimId', 'rejectionReason'],
    isActive: true
  },
  {
    id: 'claim-under-review',
    name: 'Claim Under Review',
    type: 'email',
    subject: 'Your insurance claim is under review',
    body: 'Dear {{patientName}},\n\nYour {{claimType}} claim for ${{amount}} is currently being reviewed by {{reviewerType}}.\n\nClaim ID: {{claimId}}\nCurrent Status: {{status}}\n\nWe will notify you once the review is complete.\n\nBest regards,\nHealthClaim Portal Team',
    variables: ['patientName', 'claimType', 'amount', 'claimId', 'reviewerType', 'status'],
    isActive: true
  },
  {
    id: 'payment-processed',
    name: 'Payment Processed',
    type: 'email',
    subject: 'Payment for your approved claim has been processed',
    body: 'Dear {{patientName}},\n\nPayment for your approved {{claimType}} claim has been successfully processed.\n\nClaim ID: {{claimId}}\nPayment Amount: ${{amount}}\nTransaction ID: {{transactionId}}\n\nThe payment should appear in your account within 1-2 business days.\n\nThank you for using HealthClaim Portal.\n\nBest regards,\nHealthClaim Portal Team',
    variables: ['patientName', 'claimType', 'amount', 'claimId', 'transactionId'],
    isActive: true
  },
  {
    id: 'claim-submitted-sms',
    name: 'Claim Submitted (SMS)',
    type: 'sms',
    subject: '',
    body: 'Hi {{patientName}}, your {{claimType}} claim for ${{amount}} has been submitted. Claim ID: {{claimId}}. You\'ll receive updates as it progresses.',
    variables: ['patientName', 'claimType', 'amount', 'claimId'],
    isActive: true
  },
  {
    id: 'claim-approved-sms',
    name: 'Claim Approved (SMS)',
    type: 'sms',
    subject: '',
    body: 'Great news! Your {{claimType}} claim for ${{amount}} has been approved. Payment will be processed within 3-5 business days.',
    variables: ['patientName', 'claimType', 'amount'],
    isActive: true
  }
];

export const NotificationService: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    smsEnabled: true,
    emailAddress: 'user@example.com',
    phoneNumber: '+1 (555) 123-4567',
    notificationTypes: {
      claimSubmitted: true,
      claimApproved: true,
      claimRejected: true,
      claimUnderReview: true,
      paymentProcessed: true
    }
  });

  const [templates, setTemplates] = useState<NotificationTemplate[]>(NOTIFICATION_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [testData, setTestData] = useState({
    patientName: 'John Doe',
    claimType: 'Medical Invoice',
    amount: '750.00',
    claimId: 'CLM-001',
    serviceDate: '2024-01-15',
    rejectionReason: 'Insufficient documentation',
    reviewerType: 'Insurance Provider',
    status: 'Under Review',
    transactionId: 'TXN-123456789'
  });

  const handleSettingsChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNotificationTypeChange = (type: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      notificationTypes: {
        ...prev.notificationTypes,
        [type]: enabled
      }
    }));
  };

  const handleTemplateEdit = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(true);
  };

  const handleTemplateSave = (updatedTemplate: NotificationTemplate) => {
    setTemplates(prev => prev.map(t => 
      t.id === updatedTemplate.id ? updatedTemplate : t
    ));
    setIsEditing(false);
    setSelectedTemplate(null);
  };

  const sendTestNotification = async (template: NotificationTemplate) => {
    // Simulate sending notification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Replace variables in template
    let processedBody = template.body;
    let processedSubject = template.subject;
    
    template.variables.forEach(variable => {
      const value = testData[variable as keyof typeof testData] || `{{${variable}}}`;
      processedBody = processedBody.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      processedSubject = processedSubject.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    });

    alert(`${template.type.toUpperCase()} notification sent!\n\nSubject: ${processedSubject}\n\nBody: ${processedBody}`);
  };

  const getNotificationStats = () => {
    const totalTemplates = templates.length;
    const activeTemplates = templates.filter(t => t.isActive).length;
    const emailTemplates = templates.filter(t => t.type === 'email').length;
    const smsTemplates = templates.filter(t => t.type === 'sms').length;
    
    return { totalTemplates, activeTemplates, emailTemplates, smsTemplates };
  };

  const stats = getNotificationStats();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notification Service</h1>
          <p className="text-gray-400">Manage email and SMS notifications for all stakeholders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Templates</p>
                  <p className="text-2xl font-bold text-white">{stats.totalTemplates}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active Templates</p>
                  <p className="text-2xl font-bold text-green-400">{stats.activeTemplates}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Email Templates</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.emailTemplates}</p>
                </div>
                <Mail className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">SMS Templates</p>
                  <p className="text-2xl font-bold text-green-400">{stats.smsTemplates}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure notification preferences and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-blue-400" />
                    <span className="text-white">Email Notifications</span>
                  </div>
                  <Switch
                    checked={settings.emailEnabled}
                    onCheckedChange={(checked) => handleSettingsChange('emailEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-green-400" />
                    <span className="text-white">SMS Notifications</span>
                  </div>
                  <Switch
                    checked={settings.smsEnabled}
                    onCheckedChange={(checked) => handleSettingsChange('smsEnabled', checked)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-white">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.emailAddress}
                    onChange={(e) => handleSettingsChange('emailAddress', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    disabled={!settings.emailEnabled}
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-white">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={settings.phoneNumber}
                    onChange={(e) => handleSettingsChange('phoneNumber', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    disabled={!settings.smsEnabled}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Notification Types</h4>
                {Object.entries(settings.notificationTypes).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-gray-300 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => handleNotificationTypeChange(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Templates Panel */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Notification Templates</CardTitle>
              <CardDescription className="text-gray-400">
                Manage email and SMS templates for different notification types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {template.type === 'email' ? (
                          <Mail className="h-4 w-4 text-blue-400" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-green-400" />
                        )}
                        <h4 className="text-white font-medium">{template.name}</h4>
                        <Badge className={template.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendTestNotification(template)}
                          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Test
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTemplateEdit(template)}
                          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      Subject: {template.subject || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {template.body}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Data Panel */}
        <Card className="bg-gray-800 border-gray-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Test Data</CardTitle>
            <CardDescription className="text-gray-400">
              Configure test data for notification previews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(testData).map(([key, value]) => (
                <div key={key}>
                  <Label className="text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </Label>
                  <Input
                    value={value}
                    onChange={(e) => setTestData(prev => ({ ...prev, [key]: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Editor Modal */}
      {isEditing && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="bg-gray-800 border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white">Edit Template</CardTitle>
              <CardDescription className="text-gray-400">
                Modify the notification template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Template Name</Label>
                <Input
                  value={selectedTemplate.name}
                  onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              {selectedTemplate.type === 'email' && (
                <div>
                  <Label className="text-white">Subject</Label>
                  <Input
                    value={selectedTemplate.subject}
                    onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, subject: e.target.value } : null)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              )}

              <div>
                <Label className="text-white">Body</Label>
                <textarea
                  value={selectedTemplate.body}
                  onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, body: e.target.value } : null)}
                  className="w-full h-32 bg-gray-700 border border-gray-600 text-white rounded-md p-3"
                  placeholder="Enter template body..."
                />
              </div>

              <div>
                <Label className="text-white">Available Variables</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTemplate.variables.map((variable) => (
                    <Badge key={variable} className="bg-blue-500">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedTemplate.isActive}
                  onCheckedChange={(checked) => setSelectedTemplate(prev => prev ? { ...prev, isActive: checked } : null)}
                />
                <Label className="text-white">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => selectedTemplate && handleTemplateSave(selectedTemplate)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
