export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          public_id: string
          email: string
          phone: string | null
          password_hash: string
          is_active: boolean
          school_id: number
          last_login_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          public_id?: string
          email: string
          phone?: string | null
          password_hash: string
          is_active?: boolean
          school_id: number
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          public_id?: string
          email?: string
          phone?: string | null
          password_hash?: string
          is_active?: boolean
          school_id?: number
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      schools: {
        Row: {
          id: number
          name: string
          short_code: string
          address: string | null
          city: string | null
          region: string | null
          country: string | null
          timezone: string | null
          phone: string | null
          email: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
      }
      roles: {
        Row: {
          id: number
          code: string
          label: string
        }
      }
      user_roles: {
        Row: {
          id: number
          user_id: number
          role_id: number
          scope: any
        }
      }
      staff: {
        Row: {
          id: number
          school_id: number
          user_id: number
          public_id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          role_title: string | null
          is_teaching: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
      }
      students: {
        Row: {
          id: number
          school_id: number
          public_id: string
          student_no: string
          first_name: string
          last_name: string
          gender: string | null
          dob: string | null
          admission_dt: string | null
          status: string
          medical_flags: any
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
      }
    }
  }
}
