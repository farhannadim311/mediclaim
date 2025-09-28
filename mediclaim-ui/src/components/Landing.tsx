import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Shield, Lock, Eye, CheckCircle, ArrowRight, Zap, Users, Globe } from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: 'Zero-Knowledge Proofs',
      description: 'Verify claims without revealing sensitive patient data or financial information',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Lock,
      title: 'Cryptographic Security',
      description: 'Military-grade encryption with EdDSA signatures and secure attestations',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Eye,
      title: 'Privacy-First',
      description: 'Only verification status is disclosed - all sensitive data remains private',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Zap,
      title: 'Instant Verification',
      description: 'Real-time claim processing with immediate verification results',
      color: 'from-yellow-500 to-orange-500',
    },
  ];

  const stats = [
    { label: 'Claims Verified', value: '10,000+', icon: CheckCircle },
    { label: 'Privacy Protected', value: '100%', icon: Shield },
    { label: 'Processing Time', value: '<5s', icon: Zap },
    { label: 'Global Reach', value: '50+ Countries', icon: Globe },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-4 py-24 sm:py-32">
        <div className="max-w-6xl mx-auto text-center">
          {/* Hero Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full px-4 py-2 mb-8">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-300">Now Live on Midnight Network</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Verify Claims
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Protect Privacy
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Revolutionary insurance claim verification using{' '}
            <span className="text-blue-400 font-semibold">zero-knowledge proofs</span>. Verify authenticity while
            keeping patient data completely private.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/25"
              onClick={() => navigate('/verify')}
            >
              Start Verifying
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 backdrop-blur-sm"
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Learn How It Works
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center"
              >
                <stat.icon className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="px-4 py-24 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">How It Works</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our cutting-edge technology ensures claim verification without compromising privacy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 group hover:scale-105"
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-r ${feature.color} w-fit group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-white text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300 text-center leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Flow */}
      <section className="px-4 py-24 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">Simple 3-Step Process</h2>
            <p className="text-xl text-gray-300">Get verified in minutes with our streamlined process</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Connect Wallet',
                description: 'Connect your Midnight Network wallet to get started with secure claim verification',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                step: '02',
                title: 'Submit Claim',
                description: 'Provide claim details with cryptographic proofs - your data stays private',
                color: 'from-purple-500 to-pink-500',
              },
              {
                step: '03',
                title: 'Get Verification',
                description: 'Receive instant verification results with zero-knowledge proof confirmation',
                color: 'from-green-500 to-emerald-500',
              },
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div
                  className={`mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-r ${item.color} flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  {item.step}
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">{item.title}</h3>
                <p className="text-gray-300 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/20 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-50"></div>
            <CardContent className="relative pt-12 pb-12 text-center">
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to Verify Claims Privately?</h3>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Join thousands of healthcare providers using zero-knowledge proofs to verify claims while protecting
                patient privacy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/25"
                  onClick={() => navigate('/verify')}
                >
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 backdrop-blur-sm"
                  onClick={() => navigate('/dashboard')}
                >
                  View Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Landing;
