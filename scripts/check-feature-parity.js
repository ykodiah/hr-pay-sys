const fs = require("fs")
const path = require("path")

// Import feature registry
const { FEATURE_REGISTRY, FeatureParityChecker } = require("../shared/config/featureRegistry.ts")

async function checkFeatureParity() {
  console.log("🔍 Checking feature parity between web and mobile platforms...")

  const parityReport = FeatureParityChecker.generateParityReport()
  const criticalGaps = FeatureParityChecker.getCriticalGaps()

  console.log(`📊 Parity Score: ${parityReport.parityScore}%`)
  console.log(`📈 Total Features: ${parityReport.totalFeatures}`)
  console.log(`⚠️  Feature Gaps: ${parityReport.gaps}`)
  console.log(`🚨 Critical Gaps: ${parityReport.criticalGaps}`)

  if (criticalGaps.length > 0) {
    console.log("\n🚨 Critical features missing on one or both platforms:")
    criticalGaps.forEach((feature) => {
      const webStatus = feature.platforms.web.implemented ? "✅" : "❌"
      const mobileStatus = feature.platforms.mobile.implemented ? "✅" : "❌"
      console.log(`   ${feature.name}: Web ${webStatus} | Mobile ${mobileStatus}`)
    })

    // Fail the build if critical features are missing
    if (process.env.CI === "true") {
      console.log("\n❌ Build failed due to critical feature gaps.")
      process.exit(1)
    }
  }

  // Check for version mismatches
  const versionMismatches = FEATURE_REGISTRY.filter((feature) => {
    const webVersion = feature.platforms.web.version
    const mobileVersion = feature.platforms.mobile.version
    return feature.platforms.web.implemented && feature.platforms.mobile.implemented && webVersion !== mobileVersion
  })

  if (versionMismatches.length > 0) {
    console.log("\n⚠️  Version mismatches detected:")
    versionMismatches.forEach((feature) => {
      console.log(
        `   ${feature.name}: Web v${feature.platforms.web.version} | Mobile v${feature.platforms.mobile.version}`,
      )
    })
  }

  console.log("\n✅ Feature parity check completed.")
  return parityReport
}

if (require.main === module) {
  checkFeatureParity().catch((error) => {
    console.error("❌ Feature parity check failed:", error)
    process.exit(1)
  })
}

module.exports = { checkFeatureParity }
