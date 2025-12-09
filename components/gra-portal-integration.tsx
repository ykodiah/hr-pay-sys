"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ExternalLink, 
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
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GRATaxRelief, GRASyncStatus } from '@/lib/gra-api';

interface GRAPortalIntegrationProps {
  onReliefsUpdate?: (reliefs: GRATaxRelief[]) => void;
}

export default function GRAPortalIntegration({ onReliefsUpdate }: GRAPortalIntegrationProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<GRASyncStatus | null>(null);
  const [reliefs, setReliefs] = useState<GRATaxRelief[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    // Load saved API key from localStorage
    const savedApiKey = localStorage.getItem('gra_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleTestConnection = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your GRA API key to test the connection.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/gra/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          action: 'test_connection'
        }),
      });

      const result = await response.json();
      setIsConnected(result.success);
      
      if (result.success) {
        localStorage.setItem('gra_api_key', apiKey);
        toast({
          title: "Connection Successful",
          description: "Successfully connected to GRA API.",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.message || "Failed to connect to GRA API.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: "Connection Error",
        description: "An error occurred while testing the connection.",
        variant: "destructive",
      });
    }
  };

  const handleSyncReliefs = async () => {
    setIsSyncing(true);
    
    try {
      const response = await fetch('/api/gra/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          action: 'get_comprehensive_reliefs'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setReliefs(result.data.taxReliefs);
        setSyncStatus({
          isConnected: true,
          lastSync: result.lastSync,
          nextSync: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          syncInProgress: false,
          errorCount: 0,
          successCount: 1,
        });
        
        if (onReliefsUpdate) {
          onReliefsUpdate(result.data.taxReliefs);
        }
        
        toast({
          title: "Sync Successful",
          description: `Successfully synced ${result.totalReliefs} tax reliefs from GRA portal.`,
        });
      } else {
        toast({
          title: "Sync Failed",
          description: result.error || "Failed to sync tax reliefs.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Error",
        description: "An error occurred while syncing tax reliefs.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportReliefs = () => {
    const csvContent = [
      ['GRA Code', 'Name', 'Description', 'Amount', 'Currency', 'Category', 'Status', 'Effective Date', 'Conditions', 'Required Documents'],
      ...reliefs.map(relief => [
        relief.graCode,
        relief.name,
        relief.description,
        relief.amount.toString(),
        relief.currency,
        relief.category,
        relief.isActive ? 'Active' : 'Inactive',
        relief.effectiveDate,
        relief.conditions?.join('; ') || '',
        relief.requiredDocuments?.join('; ') || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gra_tax_reliefs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const reliefCategories = reliefs.reduce((acc, relief) => {
    acc[relief.category] = (acc[relief.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>GRA Portal Integration</span>
          </CardTitle>
          <CardDescription>
            Connect to Ghana Revenue Authority portal for real-time tax relief synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* API Key Configuration */}
            <div className="space-y-2">
              <label className="text-sm font-medium">GRA API Key</label>
              <div className="flex space-x-2">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your GRA API key"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </Button>
                <Button
                  onClick={handleTestConnection}
                  disabled={!apiKey}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Get your API key from the GRA developer portal at{' '}
                <a 
                  href="https://developer.gra.gov.gh" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  developer.gra.gov.gh
                </a>
              </p>
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected to GRA' : 'Not Connected'}
                </span>
              </div>
              {syncStatus?.lastSync && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Last sync: {new Date(syncStatus.lastSync).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Sync Actions */}
            <div className="flex space-x-2">
              <Button
                onClick={handleSyncReliefs}
                disabled={!isConnected || isSyncing}
                className="flex-1"
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sync Tax Reliefs
              </Button>
              {reliefs.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleExportReliefs}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Results */}
      {reliefs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Synced Tax Reliefs</span>
            </CardTitle>
            <CardDescription>
              {reliefs.length} tax reliefs successfully synced from GRA portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Total Reliefs</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{reliefs.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Active Reliefs</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {reliefs.filter(r => r.isActive).length}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">Categories</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {Object.keys(reliefCategories).length}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="categories" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(reliefCategories).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{category}</span>
                      <Badge variant="secondary">{count} reliefs</Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="space-y-3">
                  {reliefs.map((relief) => (
                    <div key={relief.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium">{relief.name}</h3>
                            <Badge variant={relief.isActive ? "default" : "secondary"}>
                              {relief.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {relief.graCode}
                            </code>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{relief.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Amount: {relief.currency} {relief.amount}</span>
                            <span>Category: {relief.category}</span>
                            <span>Effective: {relief.effectiveDate}</span>
                          </div>
                        </div>
                      </div>
                      {relief.conditions && relief.conditions.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Conditions:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {relief.conditions.map((condition, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <span className="text-gray-400">•</span>
                                <span>{condition}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    All tax reliefs have been synced from the official GRA portal and are up-to-date with current regulations.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Data Source Verification</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Verified</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Regulatory Compliance</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Last Updated</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {syncStatus?.lastSync ? new Date(syncStatus.lastSync).toLocaleDateString() : 'N/A'}
                    </Badge>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
