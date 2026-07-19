"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Receipt, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Upload,
  Settings,
  Info,
  ExternalLink,
  Filter,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { graApiService, GRATaxRelief, GRASyncResult, GRASyncStatus } from '@/lib/gra-api';
import GRAPortalIntegration from './gra-portal-integration';

interface TaxReliefManagerProps {
  onReliefsChange?: (reliefs: GRATaxRelief[]) => void;
  initialReliefs?: GRATaxRelief[];
  companyId?: string | null;
  onSaveReliefs?: (reliefs: GRATaxRelief[]) => Promise<void> | void;
}

export default function TaxReliefManager({
  onReliefsChange,
  initialReliefs = [],
  companyId,
  onSaveReliefs,
}: TaxReliefManagerProps) {
  const { toast } = useToast();
  const [reliefs, setReliefs] = useState<GRATaxRelief[]>(initialReliefs);
  const [editingRelief, setEditingRelief] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<GRASyncStatus>(graApiService.getSyncStatus());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const categories = [
    'Personal', 'Family', 'Age', 'Disability', 'Education', 
    'Medical', 'Housing', 'Investment', 'Other'
  ];

  // Sync from parent when DB load replaces reliefs (by id signature)
  const initialSignature = (initialReliefs || []).map((r) => r.id || r.name).join("|")
  useEffect(() => {
    setReliefs(initialReliefs || [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSignature])

  useEffect(() => {
    if (onReliefsChange) {
      onReliefsChange(reliefs);
    }
  }, [reliefs, onReliefsChange]);

  const filteredReliefs = (reliefs || []).filter((relief) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      String(relief?.name ?? "").toLowerCase().includes(term) ||
      String(relief?.description ?? "").toLowerCase().includes(term) ||
      String(relief?.graCode ?? "").toLowerCase().includes(term)
    const matchesCategory = filterCategory === "all" || relief?.category === filterCategory
    return matchesSearch && matchesCategory
  });

  const handleSyncFromGRA = async () => {
    setIsSyncing(true);
    
    try {
      // Test connection first
      if (apiKey) {
        graApiService.setApiKey(apiKey);
        const connected = await graApiService.testConnection();
        setIsConnected(connected);
        
        if (!connected) {
          toast({
            title: "Connection Failed",
            description: "Unable to connect to GRA API. Using comprehensive local data instead.",
            variant: "destructive",
          });
        }
      }

      // Get comprehensive tax reliefs (simulated GRA data)
      const comprehensiveReliefs = await graApiService.getComprehensiveTaxReliefs();
      // Strip non-UUID ids so DB save always inserts clean catalog rows
      const normalized = (comprehensiveReliefs || []).map((r: any, index: number) => ({
        ...r,
        id: undefined,
        name: r.name || `GRA Relief ${index + 1}`,
        description: r.description || "",
        amount: Number(r.amount || 0),
        currency: r.currency || "GHS",
        category: r.category || "Personal",
        graCode: r.graCode || r.code || "",
        isActive: r.isActive !== false,
        effectiveDate: r.effectiveDate || new Date().toISOString().slice(0, 10),
      }))

      setReliefs(normalized as any);
      setSyncStatus(graApiService.getSyncStatus());

      if (onSaveReliefs) {
        await onSaveReliefs(normalized);
        toast({
          title: "Tax Reliefs Synced & Saved",
          description: `Synced ${normalized.length} GRA reliefs and saved them to your company catalog.`,
        });
      } else {
        toast({
          title: "Tax Reliefs Synced",
          description: `Synced ${normalized.length} reliefs. Click Save All to persist them.`,
        });
      }
    } catch (error) {
      console.error('Error syncing tax reliefs:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync tax reliefs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReliefFieldChange = (index: number, field: string, value: any) => {
    const updatedReliefs = [...reliefs];
    updatedReliefs[index] = { ...updatedReliefs[index], [field]: value };
    setReliefs(updatedReliefs);
  };

  const handleAddRelief = () => {
    const newRelief: GRATaxRelief = {
      id: Math.max(...reliefs.map(r => parseInt(r.id) || 0)) + 1 + '',
      name: '',
      description: '',
      amount: 0,
      currency: 'GHS',
      category: 'Personal',
      isActive: true,
      effectiveDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString(),
      graCode: '',
      conditions: [],
      requiredDocuments: [],
      eligibilityCriteria: '',
    };
    setReliefs([...reliefs, newRelief]);
    setEditingRelief(reliefs.length);
  };

  const handleEditRelief = (index: number) => {
    setEditingRelief(editingRelief === index ? null : index);
  };

  const handleDeleteRelief = (index: number) => {
    const updatedReliefs = reliefs.filter((_, i) => i !== index);
    setReliefs(updatedReliefs);
    if (editingRelief === index) {
      setEditingRelief(null);
    } else if (editingRelief && editingRelief > index) {
      setEditingRelief(editingRelief - 1);
    }
    toast({
      title: "Tax Relief Deleted",
      description: "The tax relief has been removed successfully.",
    });
  };

  const handleSaveReliefs = async () => {
    try {
      if (onSaveReliefs) {
        await onSaveReliefs(reliefs);
        return;
      }

      if (!companyId || String(companyId).startsWith("demo-")) {
        throw new Error("No company identifier available");
      }

      const res = await fetch("/api/settings/payroll/items", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_tax_reliefs",
          company_id: companyId,
          taxReliefs: reliefs,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save tax reliefs");

      toast({
        title: "Tax Reliefs Saved",
        description: "Tax reliefs have been saved to the database.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save tax reliefs. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportReliefs = () => {
    const csvContent = [
      ['Name', 'Description', 'Amount', 'Currency', 'Category', 'GRA Code', 'Status', 'Effective Date'],
      ...reliefs.map(relief => [
        relief.name,
        relief.description,
        relief.amount.toString(),
        relief.currency,
        relief.category,
        relief.graCode,
        relief.isActive ? 'Active' : 'Inactive',
        relief.effectiveDate
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tax_reliefs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* GRA Portal Integration */}
      <GRAPortalIntegration onReliefsUpdate={setReliefs} />
      
      {/* Header with Sync Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="w-5 h-5" />
                <span>Tax Relief Management</span>
              </CardTitle>
              <CardDescription>
                Manage tax reliefs and sync with Ghana Revenue Authority (GRA) portal
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSyncFromGRA}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sync from GRA
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                {reliefs.length} Relief{reliefs.length !== 1 ? 's' : ''} Configured
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Last Sync: {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">
                {reliefs.filter(r => r.isActive).length} Active
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>GRA API Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">GRA API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your GRA API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from the GRA developer portal
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Advanced Settings
              </Button>
              <Button
                size="sm"
                onClick={() => graApiService.setApiKey(apiKey)}
                disabled={!apiKey}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Test Connection
              </Button>
            </div>
            {showAdvanced && (
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Sync Frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="manual">Manual Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Auto-sync</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch id="autoSync" />
                      <Label htmlFor="autoSync">Enable automatic syncing</Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search reliefs by name, description, or GRA code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportReliefs}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Reliefs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tax Reliefs</CardTitle>
              <CardDescription>
                Manage and configure tax reliefs for your organization
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleAddRelief}>
                <Plus className="w-4 h-4 mr-2" />
                Add Relief
              </Button>
              <Button size="sm" variant="outline" onClick={handleSaveReliefs}>
                <Check className="w-4 h-4 mr-2" />
                Save All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReliefs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No tax reliefs found</p>
              <p className="text-sm">
                {searchTerm || filterCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Add your first tax relief or sync from GRA to get started.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReliefs.map((relief, index) => (
                <Card key={relief.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Basic Info */}
                      <div className="lg:col-span-4">
                        <div className="space-y-2">
                          {editingRelief === index ? (
                            <Input
                              value={relief.name ?? ""}
                              onChange={(e) => handleReliefFieldChange(index, 'name', e.target.value)}
                              placeholder="Relief name"
                              className="font-medium"
                            />
                          ) : (
                            <h3 className="font-medium text-lg">{relief.name || "Untitled relief"}</h3>
                          )}
                          {editingRelief === index ? (
                            <Textarea
                              value={relief.description ?? ""}
                              onChange={(e) => handleReliefFieldChange(index, 'description', e.target.value)}
                              placeholder="Description"
                              rows={2}
                            />
                          ) : (
                            <p className="text-sm text-gray-600">{relief.description || ""}</p>
                          )}
                        </div>
                      </div>

                      {/* Amount and Category */}
                      <div className="lg:col-span-3">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{relief.currency}</span>
                            {editingRelief === index ? (
                              <Input
                                type="number"
                                value={relief.amount}
                                onChange={(e) => handleReliefFieldChange(index, 'amount', Number(e.target.value))}
                                className="w-24"
                                step="0.01"
                              />
                            ) : (
                              <span className="font-medium text-lg">{relief.amount}</span>
                            )}
                          </div>
                          {editingRelief === index ? (
                            <Select
                              value={categories.includes(relief.category) ? relief.category : "Personal"}
                              onValueChange={(value) => handleReliefFieldChange(index, 'category', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map(category => (
                                  <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline">{relief.category}</Badge>
                          )}
                        </div>
                      </div>

                      {/* GRA Code and Status */}
                      <div className="lg:col-span-3">
                        <div className="space-y-2">
                          {editingRelief === index ? (
                            <Input
                              value={relief.graCode ?? ""}
                              onChange={(e) => handleReliefFieldChange(index, 'graCode', e.target.value)}
                              placeholder="GRA Code"
                            />
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">GRA Code:</span>
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded">{relief.graCode || "—"}</code>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            {editingRelief === index ? (
                              <Switch
                                checked={relief.isActive}
                                onCheckedChange={(checked) => handleReliefFieldChange(index, 'isActive', checked)}
                              />
                            ) : (
                              <Badge variant={relief.isActive ? "default" : "secondary"}>
                                {relief.isActive ? "Active" : "Inactive"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="lg:col-span-2">
                        <div className="flex items-center space-x-1">
                          {editingRelief === index ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => setEditingRelief(null)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteRelief(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditRelief(index)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteRelief(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    {relief.conditions && relief.conditions.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Conditions:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {relief.conditions.map((condition, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <span className="text-gray-400">•</span>
                                <span>{condition}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {relief.requiredDocuments && relief.requiredDocuments.length > 0 && (
                      <div className="mt-2">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Required Documents:</h4>
                          <div className="flex flex-wrap gap-2">
                            {relief.requiredDocuments.map((doc, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
