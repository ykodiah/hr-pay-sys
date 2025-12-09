"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { User, Calendar, Building, CreditCard, FileText, Edit, Save, Camera, Shield } from "lucide-react"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    personalInfo: {
      firstName: "Kwame",
      lastName: "Asante",
      email: "kwame.asante@company.com",
      phone: "+233 24 123 4567",
      dateOfBirth: "1990-05-15",
      address: "123 Liberation Road, Accra",
      emergencyContact: "Ama Asante - +233 20 987 6543",
      ghanaCardNumber: "GHA-123456789-0",
    },
    employmentInfo: {
      employeeId: "EMP001",
      position: "Senior Software Engineer",
      department: "Technology",
      manager: "John Doe",
      hireDate: "2022-01-15",
      employmentType: "Full-time",
      workLocation: "Accra Office",
    },
    bankingInfo: {
      bankName: "GT Bank",
      accountNumber: "20610953414",
      ssnitNumber: "GHA-001689781-4",
    },
    benefits: {
      healthInsurance: "Active",
      lifeInsurance: "Active",
      tier3Contribution: "5%",
      annualLeave: "21 days",
    },
  })

  const handleSave = () => {
    setIsEditing(false)
    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully updated.",
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data if needed
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your personal and employment information</p>
        </div>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src="/placeholder.svg?height=96&width=96" />
                <AvatarFallback className="text-2xl">
                  {profileData.personalInfo.firstName[0]}
                  {profileData.personalInfo.lastName[0]}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-transparent"
                  variant="outline"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {profileData.personalInfo.firstName} {profileData.personalInfo.lastName}
              </h2>
              <p className="text-lg text-gray-600 mb-2">{profileData.employmentInfo.position}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Building className="w-4 h-4" />
                  <span>{profileData.employmentInfo.department}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge variant="outline">{profileData.employmentInfo.employeeId}</Badge>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(profileData.employmentInfo.hireDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="banking">Banking & Benefits</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.personalInfo.firstName}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        personalInfo: { ...profileData.personalInfo, firstName: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.personalInfo.lastName}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        personalInfo: { ...profileData.personalInfo, lastName: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.personalInfo.email}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        personalInfo: { ...profileData.personalInfo, email: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.personalInfo.phone}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        personalInfo: { ...profileData.personalInfo, phone: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={profileData.personalInfo.dateOfBirth}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        personalInfo: { ...profileData.personalInfo, dateOfBirth: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="ghanaCard">Ghana Card Number</Label>
                  <Input
                    id="ghanaCard"
                    value={profileData.personalInfo.ghanaCardNumber}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        personalInfo: { ...profileData.personalInfo, ghanaCardNumber: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={profileData.personalInfo.address}
                  disabled={!isEditing}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      personalInfo: { ...profileData.personalInfo, address: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  value={profileData.personalInfo.emergencyContact}
                  disabled={!isEditing}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      personalInfo: { ...profileData.personalInfo, emergencyContact: e.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5" />
                <span>Employment Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Employee ID</Label>
                  <Input value={profileData.employmentInfo.employeeId} disabled />
                </div>
                <div>
                  <Label>Position</Label>
                  <Input value={profileData.employmentInfo.position} disabled />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input value={profileData.employmentInfo.department} disabled />
                </div>
                <div>
                  <Label>Manager</Label>
                  <Input value={profileData.employmentInfo.manager} disabled />
                </div>
                <div>
                  <Label>Hire Date</Label>
                  <Input value={profileData.employmentInfo.hireDate} disabled />
                </div>
                <div>
                  <Label>Employment Type</Label>
                  <Input value={profileData.employmentInfo.employmentType} disabled />
                </div>
              </div>
              <div>
                <Label>Work Location</Label>
                <Input value={profileData.employmentInfo.workLocation} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banking">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Banking Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={profileData.bankingInfo.bankName}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          bankingInfo: { ...profileData.bankingInfo, bankName: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={profileData.bankingInfo.accountNumber}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          bankingInfo: { ...profileData.bankingInfo, accountNumber: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="ssnitNumber">SSNIT Number</Label>
                    <Input
                      id="ssnitNumber"
                      value={profileData.bankingInfo.ssnitNumber}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          bankingInfo: { ...profileData.bankingInfo, ssnitNumber: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Benefits & Contributions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                      <span className="font-medium">Health Insurance</span>
                      <Badge className="bg-emerald-100 text-emerald-800">{profileData.benefits.healthInsurance}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">Life Insurance</span>
                      <Badge className="bg-blue-100 text-blue-800">{profileData.benefits.lifeInsurance}</Badge>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium">Tier 3 Contribution</span>
                      <Badge className="bg-purple-100 text-purple-800">{profileData.benefits.tier3Contribution}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium">Annual Leave</span>
                      <Badge className="bg-orange-100 text-orange-800">{profileData.benefits.annualLeave}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Documents & Certificates</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium">Employment Contract</p>
                      <p className="text-sm text-gray-500">Uploaded on Jan 15, 2022</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-medium">Ghana Card Copy</p>
                      <p className="text-sm text-gray-500">Uploaded on Jan 10, 2022</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="font-medium">Educational Certificates</p>
                      <p className="text-sm text-gray-500">Uploaded on Jan 8, 2022</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
                {isEditing && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Upload additional documents</p>
                    <Button variant="outline">Choose Files</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
