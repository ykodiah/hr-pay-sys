"use client"

import { Suspense } from "react"
import TransferEmployeePage from "./transfer-client"

export default function TransferPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          Loading transfer workspace…
        </div>
      }
    >
      <TransferEmployeePage />
    </Suspense>
  )
}
