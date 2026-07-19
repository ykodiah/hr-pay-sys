"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { User, Building, CreditCard, Edit, Save, Loader2 } from "lucide-react"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    personalInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      address: "",
      emergencyContact: "",
      ghanaCardNumber: "",
    },
    employmentInfo: {
      employeeId: "",
      position: "",
      department: "",
      hireDate: "",
      employmentType: "",
      workLocation: "",
    },
    bankingInfo: {
      bankName: "",
      accountNumber: "",
      ssnitNumber: "",
    },
  })

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/self-service/me", { credentials: "include", cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load")
      const e = data.employee || {}
      const f = data.financial || {}
      setProfileData({
        personalInfo: {
          firstName: e.first_name || "",
          lastName: e.last_name || "",
          email: e.corporate_email || e.personal_email || "",
          phone: e.phone || "",
          dateOfBirth: e.date_of_birth || "",
          address: e.address || "",
          emergencyContact: [e.emergency_contact_name, e.emergency_contact_tel].filter(Boolean).join(" - "),
          ghanaCardNumber: e.ghana_card_number || "",
        },
        employmentInfo: {
          employeeId: e.employee_id || "",
          position: e.position || "",
          department: e.department || "",
          hireDate: e.date_of_joining || "",
          employmentType: e.contract_type || "",
          workLocation: e.location || "",
        },
        bankingInfo: {
          bankName: f.bank_name || "",
          accountNumber: f.bank_account_number || "",
          ssnitNumber: f.ssnit_number || "",
        },
      })
    } catch (err) {
      toast({
        title: "Could not load profile",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      const emergency = profileData.personalInfo.emergencyContact || ""
      const [emergencyName, ...rest] = emergency.split(" - ")
      const res = await fetch("/api/self-service/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: profileData.personalInfo.phone,
          personal_email: profileData.personalInfo.email,
          address: profileData.personalInfo.address,
          emergency_contact_name: emergencyName || null,
          emergency_contact_tel: rest.join(" - ") || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      setIsEditing(false)
      toast({
        title: "Profile Updated",
        description: "Your personal details were saved to the database.",
      })
      await load()
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 gap-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading profile…
      </div>
    )
  }

  const initials =
    `${profileData.personalInfo.firstName?.[0] || ""}${profileData.personalInfo.lastName?.[0] || ""}`.toUpperCase() ||
    "ME"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your personal and employment information</p>
        </div>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">
              {profileData.personalInfo.firstName} {profileData.personalInfo.lastName}
            </h2>
            <p className="text-slate-600">{profileData.employmentInfo.position}</p>
            <Badge variant="outline" className="mt-1">
              {profileData.employmentInfo.employeeId || "—"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First name</Label>
                <Input value={profileData.personalInfo.firstName} disabled />
              </div>
              <div>
                <Label>Last name</Label>
                <Input value={profileData.personalInfo.lastName} disabled />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={profileData.personalInfo.email}
                disabled={!isEditing}
                onChange={(e) =>
                  setProfileData((p) => ({
                    ...p,
                    personalInfo: { ...p.personalInfo, email: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={profileData.personalInfo.phone}
                disabled={!isEditing}
                onChange={(e) =>
                  setProfileData((p) => ({
                    ...p,
                    personalInfo: { ...p.personalInfo, phone: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={profileData.personalInfo.address}
                disabled={!isEditing}
                onChange={(e) =>
                  setProfileData((p) => ({
                    ...p,
                    personalInfo: { ...p.personalInfo, address: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label>Emergency contact</Label>
              <Input
                value={profileData.personalInfo.emergencyContact}
                disabled={!isEditing}
                onChange={(e) =>
                  setProfileData((p) => ({
                    ...p,
                    personalInfo: { ...p.personalInfo, emergencyContact: e.target.value },
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="w-4 h-4" /> Employment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Department</Label>
              <Input value={profileData.employmentInfo.department} disabled />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={profileData.employmentInfo.workLocation} disabled />
            </div>
            <div>
              <Label>Hire date</Label>
              <Input value={profileData.employmentInfo.hireDate} disabled />
            </div>
            <div>
              <Label>Contract</Label>
              <Input value={profileData.employmentInfo.employmentType} disabled />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Banking (read-only)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Bank</Label>
              <Input value={profileData.bankingInfo.bankName} disabled />
            </div>
            <div>
              <Label>Account</Label>
              <Input value={profileData.bankingInfo.accountNumber} disabled />
            </div>
            <div>
              <Label>SSNIT</Label>
              <Input value={profileData.bankingInfo.ssnitNumber} disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
