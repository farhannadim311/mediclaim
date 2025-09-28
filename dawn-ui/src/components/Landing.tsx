import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Shield, Lock, Eye, CheckCircle, ArrowRight } from 'lucide-react';



export const Landing: React.FC<Readonly<{}>> = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "Zero-Knowledge Verification",
      description: "Verify insurance claims without revealing sensitive patient data or claim amounts"
    },
    {
      icon: Lock,
      title: "Cryptographic Attestations",
      description: "Secure policy grants using EdDSA signatures and Poseidon hashing"
    },
    {
      icon: Eye,
      title: "Privacy-First Design",
      description: "Only verification status and minimal metadata are disclosed to verifiers"
    },
    {
      icon: CheckCircle,
      title: "Policy-Based Validation",
      description: "AI-powered policy classification with tiered claim limits (Basic, Plus, Premium)"
    }
  ];

  return (
    <div className="w-full min-h-screen text-white flex flex-col items-center">
      {/* Dawn sun background */}
      <div aria-hidden className="pointer-events-none fixed blur-xl inset-0 overflow-hidden">
        {/* base radial sun */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-[34vh] w-[140vh] h-[140vh] rounded-full blur-[24px] opacity-80"
          style={{
            background:
              'radial-gradient(closest-side, rgba(253,186,116,0.16), rgba(253,186,116,0.10) 35%, rgba(255,255,255,0) 65%)',
          }}
        />
        {/* warm horizon glow */}
        <div className="absolute left-0 right-0 bottom-0 h-[28vh] blur-[28px] opacity-60"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,166,0,0.08) 0%, rgba(255,140,0,0.10) 40%, rgba(0,0,0,0) 100%)',
          }}
        />
        {/* subtle rays */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-[30vh] w-[120vh] h-[120vh] opacity-20"
          style={{
            background:
              'conic-gradient(from 180deg, rgba(255,200,120,0.18), rgba(255,200,120,0.00) 20%, rgba(255,200,120,0.18) 40%, rgba(255,200,120,0.00) 60%, rgba(255,200,120,0.18) 80%, rgba(255,200,120,0.00) 100%)',
            maskImage: 'radial-gradient(closest-side, black 60%, transparent 85%)',
          }}
        />
      </div>

      {/* Hero Section */}
      <div className="w-full max-w-6xl px-4 pt-16 pb-8 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-300 bg-clip-text text-transparent">
          ZK Claim Verifier
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Verify insurance claims using zero-knowledge proofs. Protect patient privacy while ensuring 
          claim authenticity through cryptographic attestations.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-3 text-lg"
            onClick={() => navigate('/claims')}
          >
            Verify Claims
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-white/20 text-white hover:bg-white/10 px-8 py-3 text-lg"
            onClick={() => navigate('/attestation')}
          >
            Get Attestation
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full max-w-6xl px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-r from-orange-500/20 to-yellow-500/20 w-fit">
                  <feature.icon className="h-8 w-8 text-orange-400" />
                </div>
                <CardTitle className="text-white text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300 text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Process Flow */}
      <div className="w-full max-w-6xl px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
          Verification Process
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Email Verification</h3>
            <p className="text-gray-300">Receive OTP code to verify domain ownership and get policy attestation</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Submit Claim</h3>
            <p className="text-gray-300">Submit claim details with provider signature for ZK verification</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center text-white text-2xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">ZK Verification</h3>
            <p className="text-gray-300">Cryptographic proof validates claim without revealing sensitive data</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full max-w-4xl px-4 py-16">
        <Card className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-500/20">
          <CardContent className="pt-8 pb-8 text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Verify Claims?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Start using zero-knowledge proofs to verify insurance claims while protecting patient privacy. 
              Get your policy attestation and begin verifying claims today.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-3 text-lg"
              onClick={() => navigate('/claims')}
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Landing;


