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
   * Official GRA personal tax reliefs
   * Source: https://gra.gov.gh/domestic-tax/personal-tax-relief/
   */
  async getComprehensiveTaxReliefs(): Promise<GRATaxRelief[]> {
    const now = new Date().toISOString()
    const effectiveDate = '2024-01-01'

    return [
      {
        id: 'gra-marriage-responsibility',
        name: 'Marriage / Responsibility Relief',
        description:
          'Granted to a resident individual who takes care of a spouse or at least two children. GH¢1,200 per year.',
        amount: 1200,
        currency: 'GHS',
        category: 'Family',
        isActive: true,
        effectiveDate,
        lastUpdated: now,
        graCode: 'GRA-MRR',
        maxAmount: 1200,
        conditions: [
          'Resident individual',
          'Takes care of spouse, or takes care of at least two children',
        ],
        eligibilityCriteria: 'Resident individual with spouse or at least two children',
        requiredDocuments: ['Marriage certificate or birth certificates', 'GRA relief application form'],
      },
      {
        id: 'gra-child-education',
        name: 'Child Education Relief',
        description:
          'Granted for school fees of a child at a recognized registered educational institution in Ghana. GH¢600 per child per year (maximum three children). Both parents cannot claim for the same child.',
        amount: 600,
        currency: 'GHS',
        category: 'Education',
        isActive: true,
        effectiveDate,
        lastUpdated: now,
        graCode: 'GRA-CER',
        maxAmount: 1800,
        conditions: [
          'Maximum of three children',
          'Child attending a recognized registered educational institution in Ghana',
          'Includes adopted child or ward',
          'Both parents cannot claim for the same child',
        ],
        eligibilityCriteria: 'Resident individual paying school fees for eligible children',
        requiredDocuments: ['School fee receipts', 'Birth certificate / adoption papers', 'GRA relief application form'],
      },
      {
        id: 'gra-disability',
        name: 'Disability Relief',
        description:
          'Granted to persons who prove to the Commissioner-General that they are disabled and receive income from business or employment. Relief is 25% of that income (amount stored as 25 for percentage application).',
        amount: 25,
        currency: 'GHS',
        category: 'Disability',
        isActive: true,
        effectiveDate,
        lastUpdated: now,
        graCode: 'GRA-DIS',
        maxAmount: 25,
        conditions: [
          'Must satisfy the Commissioner-General that the person is disabled',
          'Applies only to income from business or employment',
          'Amount is 25% of assessable income from business/employment',
        ],
        eligibilityCriteria: 'Disabled persons with business or employment income',
        requiredDocuments: ['Disability proof accepted by GRA', 'GRA relief application form'],
      },
      {
        id: 'gra-old-age',
        name: 'Old Age Relief',
        description: 'Granted to persons who are 60 years of age and above. GH¢1,500 per year.',
        amount: 1500,
        currency: 'GHS',
        category: 'Age',
        isActive: true,
        effectiveDate,
        lastUpdated: now,
        graCode: 'GRA-OAR',
        maxAmount: 1500,
        conditions: ['Must be 60 years of age or older'],
        eligibilityCriteria: 'Resident individuals aged 60 and above',
        requiredDocuments: ['National ID or age verification', 'GRA relief application form'],
      },
      {
        id: 'gra-aged-dependant',
        name: 'Aged Dependent Relative Relief',
        description:
          'Granted to a resident individual who takes care of a relative aged 60 or above. GH¢1,000 per year per relative (maximum two). Does not apply to a dependent’s spouse or child; two persons cannot claim for the same relative.',
        amount: 1000,
        currency: 'GHS',
        category: 'Family',
        isActive: true,
        effectiveDate,
        lastUpdated: now,
        graCode: 'GRA-ADR',
        maxAmount: 2000,
        conditions: [
          'Relative must be 60 years or older',
          'Maximum of two relatives',
          'Does not apply to a dependent’s spouse or child',
          'Two persons cannot claim for the same relative',
        ],
        eligibilityCriteria: 'Resident individual caring for aged dependent relatives',
        requiredDocuments: ['Proof of dependency and age', 'GRA relief application form'],
      },
      {
        id: 'gra-training-development',
        name: 'Educational / Training Relief',
        description:
          'Granted when a resident individual undergoes training to update professional, technical or vocational skills or knowledge. Up to GH¢2,000 per year.',
        amount: 2000,
        currency: 'GHS',
        category: 'Education',
        isActive: true,
        effectiveDate,
        lastUpdated: now,
        graCode: 'GRA-ETR',
        maxAmount: 2000,
        conditions: [
          'Training must update professional, technical or vocational skills or knowledge',
          'Maximum GH¢2,000 per year',
        ],
        eligibilityCriteria: 'Resident individual with qualifying training expenses',
        requiredDocuments: ['Training receipts / enrollment proof', 'GRA relief application form'],
      },
      {
        id: 'gra-mortgage-interest',
        name: 'Mortgage Interest Relief',
        description:
          'Relief based on qualifying mortgage interest paid in a tax year for a principal private residence. Enjoyed for only one building. Amount varies with interest paid (catalog amount is 0 — enter actual qualifying interest when assigning).',
        amount: 0,
        currency: 'GHS',
        category: 'Housing',
        isActive: true,
        effectiveDate,
        lastUpdated: now,
        graCode: 'GRA-MIR',
        conditions: [
          'Qualifying mortgage interest on principal private residence',
          'Can be enjoyed for only one building',
        ],
        eligibilityCriteria: 'Resident individual paying qualifying mortgage interest',
        requiredDocuments: ['Mortgage interest statement', 'Proof of principal residence', 'GRA relief application form'],
      },
    ]
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
