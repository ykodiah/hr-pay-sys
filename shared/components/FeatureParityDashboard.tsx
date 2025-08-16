"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, CheckCircle, XCircle, Smartphone, Monitor } from "lucide-react"
import { FEATURE_REGISTRY, FeatureParityChecker } from "../config/featureRegistry"

export function FeatureParityDashboard() {
  const [parityReport, setParityReport] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  useEffect(() => {
    const report = FeatureParityChecker.generateParityReport()
    setParityReport(report)
  }, [])

  if (!parityReport) {
    return <div>Loading parity report...</div>
  }

  const filteredFeatures = FEATURE_REGISTRY.filter((feature) =>
    selectedCategory === "all" ? true : feature.category === selectedCategory,
  )

  const categories = Array.from(new Set(FEATURE_REGISTRY.map((f) => f.category)))

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive"
      case "high":
        return "secondary"
      case "medium":
        return "outline"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (webImplemented: boolean, mobileImplemented: boolean) => {
    if (webImplemented && mobileImplemented) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else if (!webImplemented && !mobileImplemented) {
      return <XCircle className="h-4 w-4 text-red-500" />
    } else {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feature Parity Dashboard</h2>
          <p className="text-muted-foreground">Monitor feature consistency between web and mobile platforms</p>
        </div>
        <Button
          onClick={() => {
            const report = FeatureParityChecker.generateParityReport()
            setParityReport(report)
          }}
        >
          Refresh Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parity Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parityReport.parityScore}%</div>
            <Progress value={parityReport.parityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Features</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parityReport.totalFeatures}</div>
            <p className="text-xs text-muted-foreground">Across both platforms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feature Gaps</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parityReport.gaps}</div>
            <p className="text-xs text-muted-foreground">Features missing on one platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Gaps</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{parityReport.criticalGaps}</div>
            <p className="text-xs text-muted-foreground">High priority missing features</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gaps">Feature Gaps</TabsTrigger>
          <TabsTrigger value="details">All Features</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Comparison</CardTitle>
              <CardDescription>Feature implementation status by platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Monitor className="h-5 w-5" />
                    <h3 className="font-semibold">Web Platform</h3>
                  </div>
                  <div className="space-y-2">
                    {categories.map((category) => {
                      const categoryFeatures = FEATURE_REGISTRY.filter((f) => f.category === category)
                      const implemented = categoryFeatures.filter((f) => f.platforms.web.implemented).length
                      return (
                        <div key={category} className="flex justify-between items-center">
                          <span className="capitalize text-sm">{category}</span>
                          <span className="text-sm text-muted-foreground">
                            {implemented}/{categoryFeatures.length}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Smartphone className="h-5 w-5" />
                    <h3 className="font-semibold">Mobile Platform</h3>
                  </div>
                  <div className="space-y-2">
                    {categories.map((category) => {
                      const categoryFeatures = FEATURE_REGISTRY.filter((f) => f.category === category)
                      const implemented = categoryFeatures.filter((f) => f.platforms.mobile.implemented).length
                      return (
                        <div key={category} className="flex justify-between items-center">
                          <span className="capitalize text-sm">{category}</span>
                          <span className="text-sm text-muted-foreground">
                            {implemented}/{categoryFeatures.length}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Gaps</CardTitle>
              <CardDescription>Features that need implementation on one or both platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {parityReport.gapDetails.map((gap: any) => (
                  <div key={gap.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(gap.webImplemented, gap.mobileImplemented)}
                      <div>
                        <h4 className="font-medium">{gap.name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">{gap.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(gap.priority)}>{gap.priority}</Badge>
                      <div className="flex gap-1">
                        <Badge variant={gap.webImplemented ? "default" : "outline"}>
                          <Monitor className="h-3 w-3 mr-1" />
                          Web
                        </Badge>
                        <Badge variant={gap.mobileImplemented ? "default" : "outline"}>
                          <Smartphone className="h-3 w-3 mr-1" />
                          Mobile
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="grid gap-4">
            {filteredFeatures.map((feature) => (
              <Card key={feature.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(feature.platforms.web.implemented, feature.platforms.mobile.implemented)}
                      <div>
                        <CardTitle className="text-lg">{feature.name}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={getPriorityColor(feature.priority)}>{feature.priority}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <span className="font-medium">Web Platform</span>
                        {feature.platforms.web.implemented ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      {feature.platforms.web.implemented && (
                        <div className="text-sm text-muted-foreground ml-6">
                          <p>Version: {feature.platforms.web.version}</p>
                          <p>Path: {feature.platforms.web.path}</p>
                          <p>Updated: {feature.platforms.web.lastUpdated}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <span className="font-medium">Mobile Platform</span>
                        {feature.platforms.mobile.implemented ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      {feature.platforms.mobile.implemented && (
                        <div className="text-sm text-muted-foreground ml-6">
                          <p>Version: {feature.platforms.mobile.version}</p>
                          <p>Screen: {feature.platforms.mobile.screen}</p>
                          <p>Updated: {feature.platforms.mobile.lastUpdated}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
