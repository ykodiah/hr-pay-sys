# System Architecture - SuperAdmin Portal

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  Next.js 16 (App Router) + React 19 + TypeScript                │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │   Dashboard  │   Tenants    │    Users     │   Billing    │  │
│  │   Analytics  │   Audit      │ Integrations │   Settings   │  │
│  │   Features   │  Notifications                              │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                   │
│  Next.js API Routes (TypeScript)                                │
│  ┌─────────┬──────────┬─────────┬─────────┬──────────────────┐ │
│  │ /auth   │ /tenants │ /users  │ /audit  │ /feature-flags   │ │
│  │         │          │         │         │ /notifications   │ │
│  │         │          │         │         │ /integrations    │ │
│  └─────────┴──────────┴─────────┴─────────┴──────────────────┘ │
│                                                                   │
│  Core Functions:                                                 │
│  ├─ Authentication (login, logout, verify)                      │
│  ├─ Tenant Management (CRUD)                                    │
│  ├─ User Management                                             │
│  ├─ Audit Logging                                               │
│  └─ Integration Management                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                           │
│  TypeScript Utilities & Helpers                                 │
│  ┌──────────────┬──────────────┬──────────────────────────────┐ │
│  │ Authentication│  Audit Trail │  Database Helpers           │ │
│  │   (bcrypt)   │  (Logging)   │  (Query Builders)           │ │
│  └──────────────┴──────────────┴──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATA ACCESS LAYER                              │
│  Supabase Client (PostgreSQL ORM)                               │
│  ├─ Connection pooling                                          │
│  ├─ Query execution                                             │
│  ├─ Transaction management                                      │
│  └─ Real-time subscriptions                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                                 │
│  Supabase PostgreSQL (Cloud)                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Tables:                                                 │  │
│  │  • superadmin_users          • superadmin_sessions       │  │
│  │  • superadmin_tenants        • superadmin_tenant_users   │  │
│  │  • superadmin_modules        • superadmin_tenant_modules │  │
│  │  • superadmin_audit_logs     • superadmin_invoices       │  │
│  │  • superadmin_integrations   • superadmin_backups        │  │
│  │  • superadmin_feature_flags  • superadmin_notifications  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
User Input (Email/Password)
         │
         ▼
┌──────────────────────┐
│  POST /auth/login    │
└──────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Fetch user from database         │
│ by email                         │
└──────────────────────────────────┘
         │
         ▼
    ┌────────────┐
    │ Match?     │
    └────────────┘
    │           │
   NO           YES
    │            │
    ▼            ▼
  Error    ┌──────────────────────┐
           │ bcrypt.compare()     │
           │ password_hash vs pwd │
           └──────────────────────┘
                    │
                 ┌──────────┐
                 │ Match?   │
                 └──────────┘
                 │        │
                YES       NO
                 │        │
                 ▼        ▼
           ┌──────────┐  Error
           │ Create   │
           │ Session  │
           │ Token    │
           └──────────┘
                 │
                 ▼
           ┌──────────────┐
           │ Store in DB  │
           └──────────────┘
                 │
                 ▼
           Return Token
           to Client
```

---

## Tenant Management Flow

```
Superadmin Dashboard
         │
    ┌────┴────┐
    │          │
    ▼          ▼
  View      Create
  Tenants   Tenant
    │          │
    ▼          ▼
GET /api/   POST /api/
tenants     tenants
    │          │
    ▼          ▼
Query DB   Create Record
    │          │
    ▼          ▼
Render     ├─ Create tenant
List       │
           ├─ Assign modules
           │
           ├─ Create billing
           │
           └─ Log audit entry
                 │
                 ▼
           Return to UI
                 │
                 ▼
           Display success
```

---

## Database Relationship Diagram

```
┌─────────────────────────────┐
│   superadmin_users          │
├─────────────────────────────┤
│ • id (PK)                   │
│ • email                     │
│ • password_hash             │
│ • first_name                │
│ • last_name                 │
│ • role (admin, moderator)   │
│ • status                    │
│ • created_at                │
└──────┬──────────────────────┘
       │ 1:N
       │
       ▼
┌─────────────────────────────┐
│   superadmin_sessions       │
├─────────────────────────────┤
│ • id (PK)                   │
│ • superadmin_user_id (FK)   │
│ • token                     │
│ • expires_at                │
└─────────────────────────────┘


┌──────────────────────────────────────────┐
│   superadmin_audit_logs                  │
├──────────────────────────────────────────┤
│ • id (PK)                                │
│ • superadmin_user_id (FK) ──┐            │
│ • action                    │            │
│ • resource_type             │            │
│ • resource_id               │            │
│ • changes (JSON)            │            │
│ • ip_address                │            │
│ • user_agent                │            │
│ • created_at                │            │
└──────────────────────────────────────────┘
                              │
                    References superadmin_users


┌────────────────────────────────┐
│   superadmin_tenants           │
├────────────────────────────────┤
│ • id (PK)                      │
│ • name                         │
│ • slug                         │
│ • status                       │
│ • plan                         │
│ • subscription_status          │
│ • created_at                   │
└──────┬─────────────────────────┘
       │ 1:N                    
       │                       
       ├──────────────────┬────────────────────┐
       │                  │                    │
       ▼                  ▼                    ▼
  ┌────────────┐    ┌──────────────────┐    ┌────────────────┐
  │ Tenant     │    │ Tenant           │    │ Tenant         │
  │ Users      │    │ Modules          │    │ Invoices       │
  ├────────────┤    ├──────────────────┤    ├────────────────┤
  │ • id       │    │ • id             │    │ • id           │
  │ • email    │    │ • module_id (FK) │    │ • invoice_no   │
  │ • role     │    │ • status         │    │ • total_amount │
  │ • status   │    │ • enabled_at     │    │ • payment_status
  └────────────┘    └────────┬─────────┘    └────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ superadmin_      │
                    │ modules          │
                    ├──────────────────┤
                    │ • id             │
                    │ • name           │
                    │ • monthly_cost   │
                    └──────────────────┘
```

---

## Data Flow for Tenant Creation

```
┌──────────────────────┐
│  Create Tenant Form  │
│  (Frontend)          │
└──────────┬───────────┘
           │ User submits form
           │
           ▼
┌──────────────────────┐
│  Form Validation     │
│  (Client-side)       │
└──────────┬───────────┘
           │ Valid
           │
           ▼
┌──────────────────────┐
│ POST /api/           │
│ superadmin/tenants   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Verify Auth Token    │
└──────────┬───────────┘
           │ Valid
           │
           ▼
┌──────────────────────┐
│ Extract Form Data    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Insert Tenant Record │
│ (superadmin_tenants) │
└──────────┬───────────┘
           │ New tenant ID
           │
           ├─────────────────────────────────┐
           │ Parallel Operations             │
           │                                 │
           ├─ Assign default modules        │
           │                                │
           ├─ Create billing period         │
           │                                │
           └─ Log audit entry              │
                │
                ▼
         ┌────────────────┐
         │ Return success │
         │ with tenant ID │
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │ Update UI      │
         │ (Show success) │
         └────────────────┘
```

---

## API Request/Response Cycle

```
CLIENT                          SERVER
┌──────────────────────┐       ┌──────────────────────┐
│ Next.js Component    │       │ Next.js API Route    │
└──────────┬───────────┘       └──────────┬───────────┘
           │                              │
           │ fetch('/api/...')            │
           ├─────────────────────────────→
           │                              │
           │                    ┌─────────▼──────────┐
           │                    │ Middleware         │
           │                    │ - Auth verification│
           │                    │ - Logging          │
           │                    └─────────┬──────────┘
           │                              │
           │                    ┌─────────▼──────────┐
           │                    │ Request handler    │
           │                    │ - Parse body       │
           │                    │ - Validate input   │
           │                    └─────────┬──────────┘
           │                              │
           │                    ┌─────────▼──────────┐
           │                    │ Business Logic     │
           │                    │ - Execute operation│
           │                    │ - Error handling   │
           │                    └─────────┬──────────┘
           │                              │
           │                    ┌─────────▼──────────┐
           │                    │ Supabase Query     │
           │                    │ - Database access  │
           │                    └─────────┬──────────┘
           │                              │
           │                    ┌─────────▼──────────┐
           │                    │ Log Audit Trail    │
           │                    │ (if applicable)    │
           │                    └─────────┬──────────┘
           │                              │
           │                    ┌─────────▼──────────┐
           │                    │ Build response     │
           │                    │ - Serialize data   │
           │                    │ - Set headers      │
           │                    └─────────┬──────────┘
           │                              │
           │←─────────────────────────────┤
           │ JSON response                │
           │
     ┌─────▼──────────┐
     │ Parse response │
     │ - Check status │
     │ - Update state │
     │ - Re-render    │
     └────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────┐
│         SECURITY LAYERS                 │
└─────────────────────────────────────────┘

Layer 1: TRANSPORT SECURITY
├─ HTTPS/SSL encryption
├─ Secure cookies (HttpOnly, Secure flags)
└─ CORS configuration

Layer 2: AUTHENTICATION
├─ bcrypt password hashing (12 rounds)
├─ Session token generation
├─ Token validation on each request
└─ Secure password comparison

Layer 3: AUTHORIZATION
├─ Role-based access control (RBAC)
├─ Route protection middleware
├─ Admin-only endpoint verification
└─ Resource-level access checks

Layer 4: INPUT VALIDATION
├─ Form validation (client-side)
├─ Parameter validation (server-side)
├─ Type checking (TypeScript)
└─ Sanitization of user input

Layer 5: DATABASE SECURITY
├─ Parameterized queries (Supabase)
├─ Connection pooling
├─ Row-level security (RLS)
└─ Encrypted sensitive data

Layer 6: AUDIT & LOGGING
├─ All actions logged with timestamps
├─ IP address tracking
├─ User identification
├─ Change history tracking
└─ Compliance audit trail

Layer 7: MONITORING & ALERTS
├─ Error logging
├─ Performance monitoring
├─ Security event detection
└─ Automated alerts
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│        PRODUCTION DEPLOYMENT            │
└─────────────────────────────────────────┘

┌─────────────────┐
│   Vercel Edge   │
│ (Global CDN)    │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ Regions  │
    └────┬─────┘
         │
    ┌────▼────────────────┐
    │  Vercel Functions   │
    │  (Serverless)       │
    ├─ API Routes         │
    ├─ Middleware         │
    └─ Next.js App Router │
         │
    ┌────▼──────────────┐
    │  Environment Vars │
    ├─ API Keys         │
    ├─ Secrets          │
    └─ Configuration    │
         │
    ┌────▼──────────────────┐
    │  Supabase Cloud       │
    │  (PostgreSQL + Auth)  │
    ├─ Database instance   │
    ├─ Connection pooling  │
    ├─ Backups             │
    └─ Real-time updates   │
```

---

## Scaling Considerations

```
CURRENT ARCHITECTURE SUPPORTS:

✅ Vertical Scaling
  • Increase Supabase instance size
  • Increase database compute resources
  • Increase CDN cache TTL

✅ Horizontal Scaling
  • Multiple Vercel edge functions
  • Database read replicas
  • Caching layer (Redis)

✅ Database Optimization
  • Query optimization
  • Index optimization
  • Connection pooling
  • Caching strategies

✅ Frontend Optimization
  • Code splitting
  • Image optimization
  • CSS-in-JS optimization
  • Asset compression

FUTURE ENHANCEMENTS:
• Elasticsearch for advanced search
• Redis for caching
• Message queue (Bull/RabbitMQ)
• Worker processes for async jobs
```

---

## System Health Monitoring

```
MONITORING ENDPOINTS:

Health Checks:
├─ API Response Time
├─ Database Connection
├─ Authentication Success Rate
├─ Error Rate by Endpoint
└─ Request Rate Limits

Metrics Tracked:
├─ Active Users
├─ Avg Response Time
├─ 95th Percentile Latency
├─ Error Count
├─ Failed Auth Attempts
└─ Database Query Performance

Alerting:
├─ High error rate (>5%)
├─ High latency (>2s)
├─ Failed authentications (>10)
├─ Database connection failures
└─ Disk space warnings
```

---

**Last Updated**: July 16, 2026
**Status**: Production Ready ✅
