import { getUsers, toggleUserStatus } from "@/lib/actions/users"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { Plus, Mail, Phone, MapPin } from "lucide-react"

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all system users</p>
        </div>
        <Link href="/users/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {user.first_name?.[0]}
                      {user.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {user.first_name} {user.last_name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Mail className="mr-1 h-4 w-4" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center">
                          <Phone className="mr-1 h-4 w-4" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                    {user.address && (
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPin className="mr-1 h-4 w-4" />
                        {user.address}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-end space-y-2">
                    {user.user_roles?.map((role: any) => (
                      <Badge key={role.role} variant="secondary">
                        {role.role}
                      </Badge>
                    ))}
                    {user.staff && <Badge variant="outline">Staff - {user.staff.employee_id}</Badge>}
                    {user.guardians && <Badge variant="outline">Guardian</Badge>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{user.is_active ? "Active" : "Inactive"}</span>
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={(checked) => toggleUserStatus(user.id, checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first user</p>
            <Link href="/users/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
