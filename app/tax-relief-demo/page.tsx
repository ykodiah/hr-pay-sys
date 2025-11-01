"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Receipt, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Download,
  Upload,
  Settings,
  Info,
  Shield,
  Globe,
  Database,
  Activity,
  Calculator,
  FileText,
  Users,
  Building
} from 'lucide-react';
import TaxReliefManager from '@/components/tax-relief-manager';
import GRAPortalIntegration from '@/components/gra-portal-integration';
import { GRATaxRelief } from '@/lib/gra-api';

export default function TaxReliefDemoPage() {
  const [reliefs, setReliefs] = useState<GRATaxRelief[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const handleReliefsChange = (newReliefs: GRATaxRelief[]) => {
    setReliefs(newReliefs);
  };

  const totalReliefs = reliefs.length;
  const activeReliefs = reliefs.filter(r => r.isActive).length;
  const totalAmount = reliefs.reduce((sum, relief) => sum + relief.amount, 0);
  const categories = [...new Set(reliefs.map(r => r.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tax Relief Management</h1>
                <p className="text-sm text-gray-500">Ghana Revenue Authority Integration Demo</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Live Demo
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="gra-integration">GRA Integration</TabsTrigger>
            <TabsTrigger value="relief-manager">Relief Manager</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Receipt className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Reliefs</p>
                      <p className="text-2xl font-bold text-gray-900">{totalReliefs}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Active Reliefs</p>
                      <p className="text-2xl font-bold text-gray-900">{activeReliefs}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900">₵{totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-8 h-8 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Categories</p>
                      <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Features Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <span>GRA Portal Integration</span>
                  </CardTitle>
                  <CardDescription>
                    Real-time synchronization with Ghana Revenue Authority
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Real-time API connectivity</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Automatic relief updates</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Compliance verification</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Historical data tracking</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Management Features</span>
                  </CardTitle>
                  <CardDescription>
                    Comprehensive tax relief management capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Custom relief creation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Bulk import/export</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Advanced filtering</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Audit trail tracking</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Get started with tax relief management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setActiveTab('gra-integration')}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Globe className="w-6 h-6" />
                    <span>Connect to GRA</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('relief-manager')}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Settings className="w-6 h-6" />
                    <span>Manage Reliefs</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('analytics')}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Database className="w-6 h-6" />
                    <span>View Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gra-integration">
            <GRAPortalIntegration onReliefsUpdate={handleReliefsChange} />
          </TabsContent>

          <TabsContent value="relief-manager">
            <TaxReliefManager 
              onReliefsChange={handleReliefsChange}
              initialReliefs={reliefs}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Relief Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Relief Distribution by Category</CardTitle>
                  <CardDescription>
                    Breakdown of tax reliefs by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories.map(category => {
                      const categoryReliefs = reliefs.filter(r => r.category === category);
                      const percentage = totalReliefs > 0 ? (categoryReliefs.length / totalReliefs) * 100 : 0;
                      const totalAmount = categoryReliefs.reduce((sum, r) => sum + r.amount, 0);
                      
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{category}</span>
                            <span className="text-sm text-gray-500">
                              {categoryReliefs.length} reliefs (₵{totalAmount.toLocaleString()})
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Overview</CardTitle>
                  <CardDescription>
                    Active vs inactive reliefs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Active Reliefs</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {activeReliefs}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-gray-600" />
                        <span className="font-medium">Inactive Reliefs</span>
                      </div>
                      <Badge className="bg-gray-100 text-gray-800">
                        {totalReliefs - activeReliefs}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest changes to tax reliefs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reliefs.slice(0, 5).map((relief, index) => (
                    <div key={relief.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{relief.name}</p>
                        <p className="text-xs text-gray-500">
                          {relief.category} • ₵{relief.amount} • {relief.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {relief.graCode}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
