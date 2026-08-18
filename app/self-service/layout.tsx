import type React from "react"
import { PortalShell } from "@/components/self-service/portal-shell"

export const metadata = {
  title: "Employee Portal | AkwaabaHRPay",
  description: "View payslips, request leave, track loans and manage your employment details.",
}

export default function SelfServiceLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>
}
