const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

// Feature synchronization templates
const FEATURE_TEMPLATES = {
  web: {
    page: `
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "{{FEATURE_NAME}} - AkwaabaHRPay",
  description: "{{FEATURE_DESCRIPTION}}",
}

export default function {{FEATURE_NAME}}Page() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">{{FEATURE_NAME}}</h1>
      <p className="text-muted-foreground">{{FEATURE_DESCRIPTION}}</p>
      {/* TODO: Implement {{FEATURE_NAME}} functionality */}
    </div>
  )
}
`,
    component: `
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface {{FEATURE_NAME}}Props {
  // Define props here
}

export function {{FEATURE_NAME}}(props: {{FEATURE_NAME}}Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{{FEATURE_NAME}}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* TODO: Implement {{FEATURE_NAME}} component */}
      </CardContent>
    </Card>
  )
}
`,
  },
  mobile: {
    screen: `
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';

export function {{FEATURE_NAME}}Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{{FEATURE_NAME}}</Text>
      <Text style={styles.description}>{{FEATURE_DESCRIPTION}}</Text>
      {/* TODO: Implement {{FEATURE_NAME}} functionality */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
});
`,
    component: `
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';

interface {{FEATURE_NAME}}Props {
  // Define props here
}

export function {{FEATURE_NAME}}(props: {{FEATURE_NAME}}Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{{FEATURE_NAME}}</Text>
      {/* TODO: Implement {{FEATURE_NAME}} component */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
});
`,
  },
}

async function syncFeatures() {
  console.log("🔄 Starting feature synchronization...")

  const { FEATURE_REGISTRY, FeatureParityChecker } = require("../shared/config/featureRegistry.ts")
  const gaps = FeatureParityChecker.getFeatureGaps()

  if (gaps.length === 0) {
    console.log("✅ No feature gaps detected. All features are in sync.")
    return
  }

  console.log(`🔧 Found ${gaps.length} feature gaps. Generating missing implementations...`)

  for (const feature of gaps) {
    const webImplemented = feature.platforms.web.implemented
    const mobileImplemented = feature.platforms.mobile.implemented

    if (webImplemented && !mobileImplemented) {
      console.log(`📱 Generating mobile implementation for: ${feature.name}`)
      await generateMobileFeature(feature)
    } else if (!webImplemented && mobileImplemented) {
      console.log(`🌐 Generating web implementation for: ${feature.name}`)
      await generateWebFeature(feature)
    }
  }

  // Update feature registry
  await updateFeatureRegistry(gaps)

  console.log("✅ Feature synchronization completed.")
}

async function generateWebFeature(feature) {
  const featureName = toPascalCase(feature.name)
  const featureSlug = toKebabCase(feature.name)

  // Generate page
  const pagePath = `app/${featureSlug}/page.tsx`
  const pageContent = FEATURE_TEMPLATES.web.page
    .replace(/{{FEATURE_NAME}}/g, featureName)
    .replace(/{{FEATURE_DESCRIPTION}}/g, feature.description)

  ensureDirectoryExists(path.dirname(pagePath))
  fs.writeFileSync(pagePath, pageContent)

  // Generate component
  const componentPath = `components/${featureSlug}.tsx`
  const componentContent = FEATURE_TEMPLATES.web.component.replace(/{{FEATURE_NAME}}/g, featureName)

  ensureDirectoryExists(path.dirname(componentPath))
  fs.writeFileSync(componentPath, componentContent)

  console.log(`   ✅ Generated web files: ${pagePath}, ${componentPath}`)
}

async function generateMobileFeature(feature) {
  const featureName = toPascalCase(feature.name)

  // Generate screen
  const screenPath = `mobile/src/screens/${featureName}Screen.tsx`
  const screenContent = FEATURE_TEMPLATES.mobile.screen
    .replace(/{{FEATURE_NAME}}/g, featureName)
    .replace(/{{FEATURE_DESCRIPTION}}/g, feature.description)

  ensureDirectoryExists(path.dirname(screenPath))
  fs.writeFileSync(screenPath, screenContent)

  // Generate component
  const componentPath = `mobile/src/components/${featureName}.tsx`
  const componentContent = FEATURE_TEMPLATES.mobile.component.replace(/{{FEATURE_NAME}}/g, featureName)

  ensureDirectoryExists(path.dirname(componentPath))
  fs.writeFileSync(componentPath, componentContent)

  console.log(`   ✅ Generated mobile files: ${screenPath}, ${componentPath}`)
}

async function updateFeatureRegistry(syncedFeatures) {
  // Mark features as implemented on both platforms
  const registryPath = "shared/config/featureRegistry.ts"
  let registryContent = fs.readFileSync(registryPath, "utf8")

  for (const feature of syncedFeatures) {
    const webImplemented = feature.platforms.web.implemented
    const mobileImplemented = feature.platforms.mobile.implemented

    if (webImplemented && !mobileImplemented) {
      // Update mobile implementation status
      registryContent = registryContent.replace(
        new RegExp(`(${feature.id}[\\s\\S]*?mobile:\\s*{[\\s\\S]*?implemented:\\s*)false`, "g"),
        "$1true",
      )
    } else if (!webImplemented && mobileImplemented) {
      // Update web implementation status
      registryContent = registryContent.replace(
        new RegExp(`(${feature.id}[\\s\\S]*?web:\\s*{[\\s\\S]*?implemented:\\s*)false`, "g"),
        "$1true",
      )
    }
  }

  fs.writeFileSync(registryPath, registryContent)
  console.log("📝 Updated feature registry with sync status.")
}

function toPascalCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return word.toUpperCase()
    })
    .replace(/\s+/g, "")
}

function toKebabCase(str) {
  return str.replace(/\s+/g, "-").toLowerCase()
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

if (require.main === module) {
  syncFeatures().catch((error) => {
    console.error("❌ Feature synchronization failed:", error)
    process.exit(1)
  })
}

module.exports = { syncFeatures }
