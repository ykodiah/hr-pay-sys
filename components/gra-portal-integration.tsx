"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Download,
  Info,
  Shield,
  Globe,
  Database,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GRATaxRelief, GRASyncStatus } from '@/lib/gra-api';

interface GRAPortalIntegrationProps {
  onReliefsUpdate?: (reliefs: GRATaxRelief[]) => void;
  companyId?: string;
  autoSyncOnMount?: boolean;
}

export default function GRAPortalIntegration({
  onReliefsUpdate,
  autoSyncOnMount = true,
}: GRAPortalIntegrationProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<GRASyncStatus | null>(null);
  const [reliefs, setReliefs] = useState<GRATaxRelief[]>([]);

  const handleSyncReliefs = async (silent = false) => {
    setIsSyncing(true);
    
    try {
      const response = await fetch('/api/gra/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_sync' }),
      });

      const result = await response.json();
      
      if (result.success) {
        setReliefs(result.data.taxReliefs || []);
        setIsConnected(true);
        setSyncStatus({
          isConnected: true,
          lastSync: result.lastSync,
          nextSync: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          syncInProgress: false,
          errorCount: 0,
          successCount: 1,
        });
        
        if (onReliefsUpdate) {
          onReliefsUpdate(result.data.taxReliefs || []);
        }
        
        if (!silent) {
          toast({
            title: "GRA catalog synced",
            description: `Loaded ${result.totalReliefs} official personal tax reliefs from the GRA catalog.`,
          });
        }
      } else if (!silent) {
        toast({
          title: "Sync Failed",
          description: result.error || "Failed to sync tax reliefs.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      if (!silent) {
        toast({
          title: "Sync Error",
          description: "An error occurred while syncing tax reliefs.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (autoSyncOnMount) {
      void handleSyncReliefs(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSyncOnMount]);

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>GRA Portal Integration</span>
          </CardTitle>
          <CardDescription>
            Auto-synced from the official GRA personal tax relief catalog. No API key required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Akwaaba keeps the 7 active GRA personal tax reliefs in sync from{' '}
                <a
                  href="https://gra.gov.gh/domestic-tax/personal-tax-relief/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  gra.gov.gh/domestic-tax/personal-tax-relief
                </a>
                . Click Sync to refresh, then Save All on the Tax Reliefs card to persist for your company.
              </AlertDescription>
            </Alert>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Official GRA catalog ready' : 'Catalog unavailable'}
                </span>
              </div>
              {syncStatus?.lastSync && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Last sync: {new Date(syncStatus.lastSync).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => handleSyncReliefs(false)}
                disabled={isSyncing}
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
                <Button variant="outline" onClick={handleExportReliefs}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {reliefs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Synced Tax Reliefs</span>
            </CardTitle>
            <CardDescription>
              {reliefs.length} tax reliefs loaded from the official GRA catalog
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
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-slate-600" />
                      <span className="font-medium">Categories</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-700">
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
                    <div key={relief.id || relief.graCode} className="border rounded-lg p-4">
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
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Catalog matches the published GRA personal tax relief schedule. Save All on the Tax Reliefs card to store them for this company.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
