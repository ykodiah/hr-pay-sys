"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface FeatureModalProps {
  isOpen: boolean
  onClose: () => void
  feature: {
    title: string
    description: string
    image: string
    features: string[]
    badge: string
  }
}

export function FeatureModal({ isOpen, onClose, feature }: FeatureModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">{feature.title}</DialogTitle>
              <Badge className="mt-2 bg-blue-100 text-blue-800">{feature.badge}</Badge>
            </div>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="mt-6">
          <div className="mb-6">
            <img
              src={feature.image || "/placeholder.svg"}
              alt={`${feature.title} Screenshot`}
              className="w-full rounded-lg shadow-lg border"
            />
          </div>

          <div className="space-y-4">
            <p className="text-gray-600 text-lg">{feature.description}</p>

            <div>
              <h4 className="font-semibold text-lg mb-3">Key Features:</h4>
              <ul className="grid md:grid-cols-2 gap-2">
                {feature.features.map((item, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
