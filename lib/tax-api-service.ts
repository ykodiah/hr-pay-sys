// Tax Rate API Service for Government Integration
// Handles automatic tax rate updates from official government sources

interface TaxBand {
  band: number
  rate: number
  from: number
  to: number | null
  description: string
}

interface GovernmentTaxData {
  country: string
  currency: string
  taxYear: number
  effectiveDate: string
  taxBands: TaxBand[]
  ssnitRates: {
    employee: number
    employer: number
    total: number
  }
  source: string
  lastModified: string
}

interface TaxRateUpdate {
  country: string
  currency: string
  taxYear: number
  status: "available" | "pending" | "applied"
  effectiveDate: string
  changes: string[]
  source: "government_api" | "manual" | "tax_service"
  confidence: number
  validationStatus: "verified" | "pending" | "failed"
}

class TaxAPIService {
  private baseUrls = {
    ghana: "https://api.gra.gov.gh/v1/tax-rates",
    nigeria: "https://api.firs.gov.ng/v1/tax-rates",
    // Add more countries as needed
  }

  private apiKeys = {
    ghana: process.env.GHANA_TAX_API_KEY,
    nigeria: process.env.NIGERIA_TAX_API_KEY,
  }

  /**
   * Check for tax rate updates from government APIs
   */
  async checkForUpdates(countries: string[] = ["ghana", "nigeria"]): Promise<TaxRateUpdate[]> {
    console.log("[v0] Checking for tax rate updates from government APIs...")

    const updates: TaxRateUpdate[] = []

    for (const country of countries) {
      try {
        const countryUpdates = await this.checkCountryUpdates(country)
        updates.push(...countryUpdates)
      } catch (error) {
        console.error(`[v0] Failed to check updates for ${country}:`, error)
      }
    }

    return updates
  }

  /**
   * Check updates for a specific country
   */
  private async checkCountryUpdates(country: string): Promise<TaxRateUpdate[]> {
    const baseUrl = this.baseUrls[country as keyof typeof this.baseUrls]
    const apiKey = this.apiKeys[country as keyof typeof this.apiKeys]

    if (!baseUrl) {
      throw new Error(`No API endpoint configured for ${country}`)
    }

    // For demo purposes, simulate API calls with realistic data
    // In production, these would be actual HTTP requests to government APIs
    return this.simulateGovernmentAPI(country)
  }

  /**
   * Simulate government API responses (replace with actual API calls in production)
   */
  private async simulateGovernmentAPI(country: string): Promise<TaxRateUpdate[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    const currentYear = new Date().getFullYear()
    const nextYear = currentYear + 1

    if (country === "ghana") {
      return [
        {
          country: "Ghana",
          currency: "GHS",
          taxYear: nextYear,
          status: "available",
          effectiveDate: `${nextYear}-01-01`,
          changes: [
            "Updated band 4 rate from 17.5% to 18%",
            "Increased threshold for band 6 from GH₵ 50,416.67 to GH₵ 52,000",
            "New tax relief for low-income earners under GH₵ 500",
            "Adjusted SSNIT employer rate from 13% to 13.5%",
          ],
          source: "government_api",
          confidence: 0.95,
          validationStatus: "verified",
        },
      ]
    }

    if (country === "nigeria") {
      return [
        {
          country: "Nigeria",
          currency: "NGN",
          taxYear: nextYear,
          status: "pending",
          effectiveDate: `${nextYear}-04-01`,
          changes: [
            "Reduced band 1 rate from 7% to 5%",
            "Increased threshold for band 3 from ₦1,100,000 to ₦1,200,000",
            "New consolidated relief allowance of ₦200,000 + 20% of gross income",
          ],
          source: "government_api",
          confidence: 0.88,
          validationStatus: "pending",
        },
      ]
    }

    return []
  }

  /**
   * Fetch complete tax configuration from government API
   */
  async fetchTaxConfiguration(country: string, taxYear: number): Promise<GovernmentTaxData | null> {
    console.log(`[v0] Fetching tax configuration for ${country} ${taxYear}...`)

    try {
      // Simulate fetching from government API
      const data = await this.simulateFullTaxData(country, taxYear)

      // Validate the data
      if (this.validateTaxData(data)) {
        return data
      } else {
        throw new Error("Invalid tax data received from API")
      }
    } catch (error) {
      console.error(`[v0] Failed to fetch tax configuration:`, error)
      return null
    }
  }

  /**
   * Simulate full tax data from government API
   */
  private async simulateFullTaxData(country: string, taxYear: number): Promise<GovernmentTaxData> {
    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (country === "ghana") {
      return {
        country: "Ghana",
        currency: "GHS",
        taxYear,
        effectiveDate: `${taxYear}-01-01`,
        taxBands: [
          { band: 1, rate: 0, from: 0, to: 490, description: "0% on first GH₵ 490" },
          { band: 2, rate: 5, from: 490, to: 600, description: "5% on next GH₵ 110" },
          { band: 3, rate: 10, from: 600, to: 730, description: "10% on next GH₵ 130" },
          {
            band: 4,
            rate: taxYear >= 2026 ? 18 : 17.5,
            from: 730,
            to: 3896.67,
            description: `${taxYear >= 2026 ? 18 : 17.5}% on next GH₵ 3,166.67`,
          },
          { band: 5, rate: 25, from: 3896.67, to: 19896.67, description: "25% on next GH₵ 16,000" },
          {
            band: 6,
            rate: 30,
            from: 19896.67,
            to: taxYear >= 2026 ? 52000 : 50416.67,
            description: `30% on next GH₵ ${taxYear >= 2026 ? "32,103.33" : "30,520"}`,
          },
          {
            band: 7,
            rate: 35,
            from: taxYear >= 2026 ? 52000 : 50416.67,
            to: null,
            description: `35% on amounts exceeding GH₵ ${taxYear >= 2026 ? "52,000" : "50,416.67"}`,
          },
        ],
        ssnitRates: {
          employee: 5.5,
          employer: taxYear >= 2026 ? 13.5 : 13.0,
          total: taxYear >= 2026 ? 19.0 : 18.5,
        },
        source: "Ghana Revenue Authority API",
        lastModified: new Date().toISOString(),
      }
    }

    // Default fallback
    throw new Error(`No tax data available for ${country}`)
  }

  /**
   * Validate tax data structure and values
   */
  private validateTaxData(data: GovernmentTaxData): boolean {
    if (!data.country || !data.currency || !data.taxYear) {
      return false
    }

    if (!Array.isArray(data.taxBands) || data.taxBands.length === 0) {
      return false
    }

    // Validate tax bands are in order and rates are reasonable
    for (let i = 0; i < data.taxBands.length; i++) {
      const band = data.taxBands[i]
      if (band.rate < 0 || band.rate > 50) {
        // Reasonable rate limits
        return false
      }
      if (i > 0 && band.from <= data.taxBands[i - 1].from) {
        return false // Bands should be in ascending order
      }
    }

    return true
  }

  /**
   * Apply tax rate updates to the system
   */
  async applyTaxUpdate(update: TaxRateUpdate): Promise<boolean> {
    console.log(`[v0] Applying tax update for ${update.country} ${update.taxYear}...`)

    try {
      // Fetch the complete tax configuration
      const taxData = await this.fetchTaxConfiguration(update.country.toLowerCase(), update.taxYear)

      if (!taxData) {
        throw new Error("Failed to fetch complete tax configuration")
      }

      // In a real application, this would update the database
      // For now, we'll simulate the process
      await this.updateDatabase(taxData)

      console.log(`[v0] Successfully applied tax update for ${update.country}`)
      return true
    } catch (error) {
      console.error(`[v0] Failed to apply tax update:`, error)
      return false
    }
  }

  /**
   * Update database with new tax configuration
   */
  private async updateDatabase(taxData: GovernmentTaxData): Promise<void> {
    // Simulate database update
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log(`[v0] Updated database with tax configuration for ${taxData.country} ${taxData.taxYear}`)

    // In production, this would:
    // 1. Create a new tax_rate_configuration record
    // 2. Insert new paye_tax_bands
    // 3. Update ssnit_rates
    // 4. Create audit trail entry
    // 5. Notify relevant users
  }

  /**
   * Get supported countries
   */
  getSupportedCountries(): string[] {
    return Object.keys(this.baseUrls)
  }

  /**
   * Test API connectivity
   */
  async testConnectivity(country: string): Promise<boolean> {
    try {
      console.log(`[v0] Testing API connectivity for ${country}...`)

      // Simulate connectivity test
      await new Promise((resolve) => setTimeout(resolve, 500))

      // In production, this would make a simple API call to test the endpoint
      return Math.random() > 0.1 // 90% success rate for demo
    } catch (error) {
      console.error(`[v0] Connectivity test failed for ${country}:`, error)
      return false
    }
  }
}

// Export singleton instance
export const taxAPIService = new TaxAPIService()

// Export types for use in components
export type { TaxRateUpdate, GovernmentTaxData, TaxBand }
