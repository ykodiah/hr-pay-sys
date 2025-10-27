/**
 * GRA (Ghana Revenue Authority) API Integration Service
 * Handles all interactions with GRA portal for tax reliefs and tax rates
 */

export interface GRATaxRelief {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  category: 'Personal' | 'Family' | 'Age' | 'Disability' | 'Education' | 'Medical' | 'Housing' | 'Investment' | 'Other';
  isActive: boolean;
  effectiveDate: string;
  expiryDate?: string;
  lastUpdated: string;
  graCode: string;
  maxAmount?: number;
  conditions?: string[];
  requiredDocuments?: string[];
  eligibilityCriteria?: string;
}

export interface GRATaxRate {
  id: string;
  name: string;
  rate: number;
  type: 'percentage' | 'fixed';
  currency: string;
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
  graCode: string;
  description: string;
}

export interface GRASyncResult {
  success: boolean;
  data?: {
    taxReliefs: GRATaxRelief[];
    taxRates: GRATaxRate[];
  };
  error?: string;
  lastSync: string;
  totalReliefs: number;
  totalRates: number;
}

export interface GRASyncStatus {
  isConnected: boolean;
  lastSync: string | null;
  nextSync: string | null;
  syncInProgress: boolean;
  errorCount: number;
  successCount: number;
}

class GRAApiService {
  private baseUrl = 'https://api.gra.gov.gh/v1';
  private apiKey: string | null = null;
  private syncStatus: GRASyncStatus = {
    isConnected: false,
    lastSync: null,
    nextSync: null,
    syncInProgress: false,
    errorCount: 0,
    successCount: 0,
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
  }

  /**
   * Set API key for GRA authentication
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Test connection to GRA API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      this.syncStatus.isConnected = response.ok;
      return response.ok;
    } catch (error) {
      console.error('GRA API connection test failed:', error);
      this.syncStatus.isConnected = false;
      return false;
    }
  }

  /**
   * Sync all tax reliefs from GRA portal
   */
  async syncTaxReliefs(): Promise<GRASyncResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API key not configured',
        lastSync: new Date().toISOString(),
        totalReliefs: 0,
        totalRates: 0,
      };
    }

    this.syncStatus.syncInProgress = true;

    try {
      const response = await fetch(`${this.baseUrl}/tax-reliefs`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`GRA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Process and validate the data
      const taxReliefs = this.processTaxReliefs(data.taxReliefs || []);
      const taxRates = this.processTaxRates(data.taxRates || []);

      this.syncStatus.lastSync = new Date().toISOString();
      this.syncStatus.nextSync = this.calculateNextSync();
      this.syncStatus.successCount++;
      this.syncStatus.syncInProgress = false;

      return {
        success: true,
        data: {
          taxReliefs,
          taxRates,
        },
        lastSync: this.syncStatus.lastSync,
        totalReliefs: taxReliefs.length,
        totalRates: taxRates.length,
      };
    } catch (error) {
      this.syncStatus.errorCount++;
      this.syncStatus.syncInProgress = false;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        lastSync: new Date().toISOString(),
        totalReliefs: 0,
        totalRates: 0,
      };
    }
  }

  /**
   * Get specific tax relief by GRA code
   */
  async getTaxReliefByCode(graCode: string): Promise<GRATaxRelief | null> {
    try {
      const response = await fetch(`${this.baseUrl}/tax-reliefs/${graCode}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return this.processTaxRelief(data);
    } catch (error) {
      console.error('Error fetching tax relief:', error);
      return null;
    }
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): GRASyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Get comprehensive tax reliefs (simulated data for demo)
   */
  async getComprehensiveTaxReliefs(): Promise<GRATaxRelief[]> {
    // This is simulated data representing comprehensive GRA tax reliefs
    // In production, this would come from the actual GRA API
    return [
      {
        id: '1',
        name: 'Personal Relief',
        description: 'Basic personal tax relief for all taxpayers',
        amount: 402,
        currency: 'GHS',
        category: 'Personal',
        isActive: true,
        effectiveDate: '2024-01-01',
        lastUpdated: '2024-01-01T00:00:00Z',
        graCode: 'PR001',
        maxAmount: 402,
        conditions: ['Must be a resident taxpayer'],
        eligibilityCriteria: 'All resident taxpayers',
      },
      {
        id: '2',
        name: 'Child Relief',
        description: 'Tax relief for dependent children under 18',
        amount: 150,
        currency: 'GHS',
        category: 'Family',
        isActive: true,
        effectiveDate: '2024-01-01',
        lastUpdated: '2024-01-01T00:00:00Z',
        graCode: 'CR001',
        maxAmount: 150,
        conditions: ['Child must be under 18', 'Must be dependent'],
        eligibilityCriteria: 'Parents with dependent children under 18',
        requiredDocuments: ['Birth certificate', 'Proof of dependency'],
      },
      {
        id: '3',
        name: 'Old Age Relief',
        description: 'Tax relief for elderly citizens aged 60 and above',
        amount: 200,
        currency: 'GHS',
        category: 'Age',
        isActive: true,
        effectiveDate: '2024-01-01',
        lastUpdated: '2024-01-01T00:00:00Z',
        graCode: 'OAR001',
        maxAmount: 200,
        conditions: ['Must be 60 years or older'],
        eligibilityCriteria: 'Taxpayers aged 60 and above',
        requiredDocuments: ['National ID', 'Age verification'],
      },
      {
        id: '4',
        name: 'Disability Relief',
        description: 'Tax relief for persons with disabilities',
        amount: 100,
        currency: 'GHS',
        category: 'Disability',
        isActive: true,
        effectiveDate: '2024-01-01',
        lastUpdated: '2024-01-01T00:00:00Z',
        graCode: 'DR001',
        maxAmount: 100,
        conditions: ['Must have valid disability certificate'],
        eligibilityCriteria: 'Persons with certified disabilities',
        requiredDocuments: ['Disability certificate', 'Medical assessment'],
      },
      {
        id: '5',
        name: 'Education Relief',
        description: 'Tax relief for education expenses',
        amount: 300,
        currency: 'GHS',
        category: 'Education',
        isActive: true,
        effectiveDate: '2024-01-01',
        lastUpdated: '2024-01-01T00:00:00Z',
        graCode: 'ER001',
        maxAmount: 300,
        conditions: ['Must be for formal education', 'Receipts required'],
        eligibilityCriteria: 'Taxpayers with education expenses',
        requiredDocuments: ['School receipts', 'Enrollment confirmation'],
      },
      {
        id: '6',
        name: 'Medical Relief',
        description: 'Tax relief for medical expenses',
        amount: 250,
        currency: 'GHS',
        category: 'Medical',
        isActive: true,
        effectiveDate: '2024-01-01',
        lastUpdated: '2024-01-01T00:00:00Z',
        graCode: 'MR001',
        maxAmount: 250,
        conditions: ['Must be medical expenses', 'Receipts required'],
        eligibilityCriteria: 'Taxpayers with medical expenses',
        requiredDocuments: ['Medical receipts', 'Prescription documents'],
      },
      {
        id: '7',
        name: 'Housing Relief',
        description: 'Tax relief for housing expenses',
        amount: 500,
        currency: 'GHS',
        category: 'Housing',
        isActive: true,
        effectiveDate: '2024-01-01',
        lastUpdated: '2024-01-01T00:00:00Z',
        graCode: 'HR001',
        maxAmount: 500,
        conditions: ['Must be primary residence', 'Mortgage or rent receipts required'],
        eligibilityCriteria: 'Homeowners or renters',
        requiredDocuments: ['Mortgage statement', 'Rent receipts', 'Property documents'],
      },
      {
        id: '8',
        name: 'Investment Relief',
        description: 'Tax relief for approved investments',
        amount: 1000,
        currency: 'GHS',
        category: 'Investment',
        isActive: true,
        effectiveDate: '2024-01-01',
        lastUpdated: '2024-01-01T00:00:00Z',
        graCode: 'IR001',
        maxAmount: 1000,
        conditions: ['Must be approved investment', 'Investment certificate required'],
        eligibilityCriteria: 'Taxpayers with approved investments',
        requiredDocuments: ['Investment certificate', 'Bank statements'],
      },
      {
        id: '9',
        name: 'Pension Relief',
        description: 'Tax relief for pension contributions',
        amount: 200,
        currency: 'GHS',
        category: 'Personal',
        isActive: true,
        effectiveDate: '2024-01-01',
        lastUpdated: '2024-01-01T00:00:00Z',
        graCode: 'PR002',
        maxAmount: 200,
        conditions: ['Must be registered pension scheme', 'Contribution receipts required'],
        eligibilityCriteria: 'Taxpayers contributing to pension schemes',
        requiredDocuments: ['Pension contribution receipts', 'Scheme registration'],
      },
      {
        id: '10',
        name: 'Life Insurance Relief',
        description: 'Tax relief for life insurance premiums',
        amount: 150,
        currency: 'GHS',
        category: 'Personal',
        isActive: true,
        effectiveDate: '2024-01-01',
        lastUpdated: '2024-01-01T00:00:00Z',
        graCode: 'LIR001',
        maxAmount: 150,
        conditions: ['Must be life insurance policy', 'Premium receipts required'],
        eligibilityCriteria: 'Taxpayers with life insurance policies',
        requiredDocuments: ['Insurance policy', 'Premium receipts'],
      },
    ];
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  private processTaxReliefs(reliefs: any[]): GRATaxRelief[] {
    return reliefs.map(relief => this.processTaxRelief(relief));
  }

  private processTaxRelief(relief: any): GRATaxRelief {
    return {
      id: relief.id || relief.graCode || Math.random().toString(),
      name: relief.name || 'Unknown Relief',
      description: relief.description || '',
      amount: Number(relief.amount) || 0,
      currency: relief.currency || 'GHS',
      category: relief.category || 'Other',
      isActive: Boolean(relief.isActive),
      effectiveDate: relief.effectiveDate || new Date().toISOString().split('T')[0],
      expiryDate: relief.expiryDate,
      lastUpdated: relief.lastUpdated || new Date().toISOString(),
      graCode: relief.graCode || '',
      maxAmount: relief.maxAmount,
      conditions: relief.conditions || [],
      requiredDocuments: relief.requiredDocuments || [],
      eligibilityCriteria: relief.eligibilityCriteria || '',
    };
  }

  private processTaxRates(rates: any[]): GRATaxRate[] {
    return rates.map(rate => ({
      id: rate.id || Math.random().toString(),
      name: rate.name || 'Unknown Rate',
      rate: Number(rate.rate) || 0,
      type: rate.type || 'percentage',
      currency: rate.currency || 'GHS',
      effectiveDate: rate.effectiveDate || new Date().toISOString().split('T')[0],
      expiryDate: rate.expiryDate,
      isActive: Boolean(rate.isActive),
      graCode: rate.graCode || '',
      description: rate.description || '',
    }));
  }

  private calculateNextSync(): string {
    const nextSync = new Date();
    nextSync.setHours(nextSync.getHours() + 24); // Next sync in 24 hours
    return nextSync.toISOString();
  }
}

// Export singleton instance
export const graApiService = new GRAApiService();

// Export types and service
export default GRAApiService;