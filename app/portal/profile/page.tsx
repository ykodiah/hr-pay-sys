"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Calendar, Building, Edit, Save, X } from "lucide-react"

// Mock employee data
const employeeData = {
  id: "emp_001",
  firstName: "Akosua",
  lastName: "Mensah",
  email: "akosua.mensah@akwaabatech.com",
  phone: "+233244123456",
  position: "HR Manager",
  department: "Human Resources",
  location: "Head Office",
  hireDate: "2023-01-15",
  employeeId: "EMP001",
  ssnitNumber: "C123456789012",
  tin: "P0012345678",
  baseSalary: 4500,
  status: "ACTIVE",
  address: "East Legon, Accra",
  emergencyContact: {
    name: "Kwame Mensah",
    relationship: "Spouse",
    phone: "+233244987654",
  },
  bankAccount: {
    bankName: "GCB Bank",
    accountNumber: "1234567890123456",
    branch: "East Legon Branch",
  },
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(employeeData)

  const handleSave = () => {
    // Handle save logic
    console.log("Profile updated:", formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData(employeeData)
    setIsEditing(false)
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-3xl text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">View and update your personal information</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-cyan-600 hover:bg-cyan-700">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
            <Button onClick={handleCancel} variant="outline" className="bg-transparent">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Profile Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-2xl">
              {formData.firstName[0]}
              {formData.lastName[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="font-serif font-bold text-2xl">
                  {formData.firstName} {formData.lastName}
                </h2>
                <Badge className="bg-green-100 text-green-800">{formData.status}</Badge>
              </div>
              <p className="text-lg text-gray-700 mb-1">{formData.position}</p>
              <p className="text-gray-600 mb-3">
                {formData.department} • {formData.location}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{formData.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{formData.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Hired {new Date(formData.hireDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span>Employee ID: {formData.employeeId}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              {isEditing ? (
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              ) : (
                <p className="py-2 px-3 bg-gray-50 rounded-lg">{formData.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              {isEditing ? (
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              ) : (
                <p className="py-2 px-3 bg-gray-50 rounded-lg">{formData.lastName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <p className="py-2 px-3 bg-gray-50 rounded-lg text-gray-600">{formData.email}</p>
              <p className="text-xs text-gray-500 mt-1">Contact HR to change email address</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              {isEditing ? (
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              ) : (
                <p className="py-2 px-3 bg-gray-50 rounded-lg">{formData.phone}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Address</label>
              {isEditing ? (
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              ) : (
                <p className="py-2 px-3 bg-gray-50 rounded-lg">{formData.address}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Employment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Employee ID</label>
              <p className="py-2 px-3 bg-gray-50 rounded-lg">{formData.employeeId}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Position</label>
              <p className="py-2 px-3 bg-gray-50 rounded-lg">{formData.position}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Department</label>
              <p className="py-2 px-3 bg-gray-50 rounded-lg">{formData.department}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <p className="py-2 px-3 bg-gray-50 rounded-lg">{formData.location}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Hire Date</label>
              <p className="py-2 px-3 bg-gray-50 rounded-lg">{new Date(formData.hireDate).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Employment Status</label>
              <Badge className="bg-green-100 text-green-800">{formData.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Information */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Tax Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">SSNIT Number</label>
              <p className="py-2 px-3 bg-gray-50 rounded-lg">{formData.ssnitNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">TIN Number</label>
              <p className="py-2 px-3 bg-gray-50 rounded-lg">{formData.tin}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Contact Name</label>
              {isEditing ? (
                <Input
                  value={formData.emergencyContact.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, name: e.target.value },
                    })
                  }
                />
              ) : (
                <p className="py-2 px-3 bg-gray-50 rounded-lg">{formData.emergencyContact.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Relationship</label>
              {isEditing ? (
                <Input
                  value={formData.emergencyContact.relationship}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, relationship: e.target.value },
                    })
                  }
                />
              ) : (
                <p className="py-2 px-3 bg-gray-50 rounded-lg">{formData.emergencyContact.relationship}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              {isEditing ? (
                <Input
                  value={formData.emergencyContact.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, phone: e.target.value },
                    })
                  }
                />
              ) : (
                <p className="py-2 px-3 bg-gray-50 rounded-lg">{formData.emergencyContact.phone}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Information */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Bank Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Bank Name</label>
              <p className="py-2 px-3 bg-gray-50 rounded-lg">{formData.bankAccount.bankName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Account Number</label>
              <p className="py-2 px-3 bg-gray-50 rounded-lg">{formData.bankAccount.accountNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Branch</label>
              <p className="py-2 px-3 bg-gray-50 rounded-lg">{formData.bankAccount.branch}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Contact HR to update bank information</p>
        </CardContent>
      </Card>
    </div>
  )
}
