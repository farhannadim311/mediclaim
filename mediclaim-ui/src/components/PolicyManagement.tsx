import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { POLICY_TIERS, CLAIM_TYPES } from './constants';
import { Shield, DollarSign, CheckCircle } from 'lucide-react';

export const PolicyManagement: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Policy Management</h1>
        <p className="text-gray-400">
          Manage claim verification policies and tier limits
        </p>
      </div>

      {/* Policy Tiers */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Policy Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(POLICY_TIERS).map((tier) => (
            <Card key={tier.id} className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Shield className="mr-2 h-5 w-5" style={{ color: tier.color }} />
                    {tier.name}
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    className="border-gray-600 text-gray-300"
                    style={{ borderColor: tier.color }}
                  >
                    Tier {tier.id}
                  </Badge>
                </div>
                <CardDescription className="text-gray-400">
                  Maximum claim amount verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Limit:</span>
                    <div className="flex items-center text-white">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {tier.limit.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status:</span>
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Active
                    </div>
                  </div>
                  <div className="pt-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        background: `linear-gradient(90deg, ${tier.color} 0%, ${tier.color}40 100%)` 
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Claim Types */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Supported Claim Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(CLAIM_TYPES).map((type) => (
            <Card key={type.id} className="bg-gray-900 border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: type.color }}
                  />
                  <div>
                    <h3 className="text-white font-medium">{type.name}</h3>
                    <p className="text-gray-400 text-sm">Type ID: {type.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Policy Information */}
      <Card className="bg-blue-900/20 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-blue-400">How Policy Verification Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-semibold mb-2">AI-Powered Classification</h4>
              <p className="text-gray-300 text-sm">
                Email domains are analyzed using AI to automatically assign appropriate policy tiers 
                based on organization type and role.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Cryptographic Attestations</h4>
              <p className="text-gray-300 text-sm">
                Policy grants are signed using EdDSA signatures over Poseidon hashes, ensuring 
                tamper-proof verification of claim limits.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Zero-Knowledge Proofs</h4>
              <p className="text-gray-300 text-sm">
                Claims are verified without revealing sensitive data, only proving that the claim 
                amount is within the authorized policy limit.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Domain-Based Authorization</h4>
              <p className="text-gray-300 text-sm">
                Policy grants are tied to email domains, allowing organizations to control which 
                users can verify claims up to specific amounts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PolicyManagement;
