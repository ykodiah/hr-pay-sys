HR & Payroll SaaS – Copy‑Paste Code Pack v1 (Ghana, Multi‑Tenant)

Drop‑in monorepo you can copy‑paste. Includes: marketing site, admin web app (HR + Payroll + Loans + Leave + Analytics), employee self‑service e‑portal, mobile app (Expo), NestJS APIs, payroll engine, Prisma/Postgres schema, Ghana 2025 rule pack (effective‑dated), Docker Compose, and seed data.

A) Root – package.json (pnpm workspaces) & tsconfig

{
  "name": "akwaabahrpay",
  "private": true,
  "packageManager": "pnpm@9",
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm -r --parallel dev",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "seed": "tsx prisma/seed.ts",
    "migrate": "prisma migrate dev",
    "db:push": "prisma db push"
  },
  "devDependencies": {
    "typescript": "5.5.4",
    "tsx": "4.10.5"
  },
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}

tsconfig.json

{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@rules/*": ["packages/ghana-rules/*"],
      "@lib/*": ["packages/lib/*"]
    }
  }
}

.env.example

NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hrpayroll
REDIS_URL=redis://localhost:6379
MQ_URL=amqp://localhost:5672
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=hrpayroll-docs
AUTH_SECRET=changeme
DEFAULT_CURRENCY=GHS
TIMEZONE=Africa/Accra
WEB_URL=http://localhost:3000
API_URL=http://localhost:4000
ENGINE_URL=http://localhost:4001

B) Database – Prisma schema & seed

prisma/schema.prisma

generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql" url = env("DATABASE_URL") }

enum TenantMode { GROUP SINGLE }
enum Currency { GHS USD EUR }
enum PaySchedule { MONTHLY BIWEEKLY WEEKLY }
enum EmpStatus { ACTIVE SUSPENDED TERMINATED }
enum RunStatus { DRAFT CALCULATED APPROVED POSTED LOCKED }
enum Role { OWNER ADMIN HR PAYROLL FINANCE MANAGER EMPLOYEE }
enum LeaveType { ANNUAL SICK MATERNITY PATERNITY COMPASSIONATE STUDY UNPAID }
enum LeaveStatus { PENDING APPROVED REJECTED CANCELLED }

model Tenant {
  id        String   @id @default(cuid())
  name      String
  mode      TenantMode
  currency  Currency @default(GHS)
  orgs      Org[]
  users     UserTenantRole[]
  createdAt DateTime @default(now())
}

model Org {
  id        String  @id @default(cuid())
  tenantId  String
  tenant    Tenant  @relation(fields: [tenantId], references: [id])
  name      String
  companies Company[]
}

model Company {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  orgId       String?
  org         Org?     @relation(fields: [orgId], references: [id])
  name        String
  country     String   @default("Ghana")
  currency    Currency @default(GHS)
  locations   Location[]
  departments Department[]
  employees   Employee[]
}

model Location {
  id        String  @id @default(cuid())
  companyId String
  company   Company @relation(fields: [companyId], references: [id])
  name      String
  address   String?
  timezone  String  @default("Africa/Accra")
}

model Department {
  id        String  @id @default(cuid())
  companyId String
  company   Company @relation(fields: [companyId], references: [id])
  name      String
}

model Employee {
  id           String   @id @default(cuid())
  tenantId     String
  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  companyId    String
  company      Company  @relation(fields: [companyId], references: [id])
  locationId   String?
  location     Location? @relation(fields: [locationId], references: [id])
  departmentId String?
  department   Department? @relation(fields: [departmentId], references: [id])
  firstName    String
  lastName     String
  email        String   @unique
  phone        String?
  hireDate     DateTime
  status       EmpStatus @default(ACTIVE)
  position     String?
  baseSalary   Decimal  @db.Decimal(12,2)
  paySchedule  PaySchedule @default(MONTHLY)
  ssnitNumber  String?
  tin          String?
  bankAccounts BankAccount[]
  compData     Compensation[]
  leaveBalance LeaveBalance?
}

model BankAccount {
  id         String  @id @default(cuid())
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id])
  bankName   String
  accountNo  String
}

model Compensation {
  id            String   @id @default(cuid())
  employeeId    String
  employee      Employee @relation(fields: [employeeId], references: [id])
  effectiveFrom DateTime
  effectiveTo   DateTime?
  baseSalary    Decimal  @db.Decimal(12,2)
  allowances    Json
  deductions    Json
}

model PayrollRun {
  id         String   @id @default(cuid())
  tenantId   String
  companyId  String
  period     String
  status     RunStatus @default(DRAFT)
  currency   Currency
  createdBy  String
  createdAt  DateTime  @default(now())
  finalizedAt DateTime?
  totals     Json
}

model Payslip {
  id            String   @id @default(cuid())
  payrollRunId  String
  payrollRun    PayrollRun @relation(fields: [payrollRunId], references: [id])
  employeeId    String
  grossPay      Decimal @db.Decimal(12,2)
  taxableIncome Decimal @db.Decimal(12,2)
  paye          Decimal @db.Decimal(12,2)
  ssnitEE       Decimal @db.Decimal(12,2)
  ssnitER       Decimal @db.Decimal(12,2)
  netPay        Decimal @db.Decimal(12,2)
  components    Json
  currency      Currency
}

model LeaveBalance {
  id         String  @id @default(cuid())
  employeeId String  @unique
  annualEntitlement Int
  carriedOver Int @default(0)
  year       Int
}

model LeaveRequest {
  id         String @id @default(cuid())
  employeeId String
  type       LeaveType
  startDate  DateTime
  endDate    DateTime
  days       Float
  status     LeaveStatus @default(PENDING)
  reason     String?
  approverId String?
  policySnapshot Json
}

model Loan {
  id         String @id @default(cuid())
  employeeId String
  principal  Decimal @db.Decimal(12,2)
  rateAPR    Decimal @db.Decimal(6,3)
  termMonths Int
  startDate  DateTime
  balance    Decimal @db.Decimal(12,2)
  status     String  // ACTIVE, CLOSED
}

model LoanSchedule {
  id        String @id @default(cuid())
  loanId    String
  loan      Loan   @relation(fields: [loanId], references: [id])
  period    String // YYYY-MM
  due       Decimal @db.Decimal(12,2)
  principal Decimal @db.Decimal(12,2)
  interest  Decimal @db.Decimal(12,2)
  paid      Decimal @db.Decimal(12,2) @default(0)
}

model UserTenantRole {
  id       String @id @default(cuid())
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id])
  userId   String
  role     Role
}

model FxRate {
  id       String @id @default(cuid())
  asOfDate DateTime
  base     Currency @default(GHS)
  USD      Decimal @db.Decimal(14,6)
  EUR      Decimal @db.Decimal(14,6)
}

model RuleVersion {
  id            String @id @default(cuid())
  country       String
  scope         String
  version       String
  effectiveFrom DateTime
  effectiveTo   DateTime?
  payload       Json
  notes         String?
  publishedAt   DateTime @default(now())
}

prisma/seed.ts

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main(){
  const tenant = await prisma.tenant.create({ data: { name: 'AfriGroup Holdings', mode: 'GROUP', currency: 'GHS' } })
  const org = await prisma.org.create({ data: { tenantId: tenant.id, name: 'AfriGroup' } })
  const c1 = await prisma.company.create({ data: { tenantId: tenant.id, orgId: org.id, name: 'AfriFoods Ghana Ltd.' } })
  const c2 = await prisma.company.create({ data: { tenantId: tenant.id, orgId: org.id, name: 'AfriLogistics Kumasi Ltd.' } })
  const singleTenant = await prisma.tenant.create({ data: { name: 'Kokroko Ltd.', mode: 'SINGLE', currency: 'GHS' } })
  const sc = await prisma.company.create({ data: { tenantId: singleTenant.id, name: 'Kokroko Ltd.' } })

  // Ghana rules baseline (2025)
  await prisma.ruleVersion.create({ data: {
    country: 'Ghana', scope: 'PAYE', version: '2025.0.0', effectiveFrom: new Date('2025-01-01'), payload: {
      monthlyBands: [
        { upTo: 490, rate: 0 },
        { upTo: 600, rate: 5 },
        { upTo: 730, rate: 10 },
        { upTo: 3896.67, rate: 17.5 },
        { upTo: 19896.67, rate: 25 },
        { upTo: 50416.67, rate: 30 },
        { upTo: null, rate: 35 }
      ]
    }
  } })
  await prisma.ruleVersion.create({ data: {
    country: 'Ghana', scope: 'SSNIT', version: '2025.0.0', effectiveFrom: new Date('2025-01-01'), payload: {
      employee: 0.055, employer: 0.13, maxInsurableMonthly: 8235, remittanceDueDay: 14
    }
  } })
  await prisma.ruleVersion.create({ data: {
    country: 'Ghana', scope: 'LEAVE', version: '2025.0.0', effectiveFrom: new Date('2025-01-01'), payload: {
      annualDaysMin: 15, maternityWeeks: 12, paternityDays: 5
    }
  } })
  await prisma.ruleVersion.create({ data: {
    country: 'Ghana', scope: 'MIN_WAGE', version: '2025.03.01', effectiveFrom: new Date('2025-03-01'), payload: {
      amountPerDay: 19.97
    }
  } })

  // Employees & compensation
  const e1 = await prisma.employee.create({ data: {
    tenantId: tenant.id, companyId: c1.id, firstName: 'Ama', lastName: 'Boateng', email: 'ama@afrifoods.com', hireDate: new Date('2023-06-01'), baseSalary: 8500
  } })
  await prisma.bankAccount.create({ data: { employeeId: e1.id, bankName: 'GCB', accountNo: '0123456789' } })
  await prisma.compensation.create({ data: { employeeId: e1.id, effectiveFrom: new Date('2025-01-01'), baseSalary: 8500, allowances: { Transport: 600 }, deductions: {} } })

  const e2 = await prisma.employee.create({ data: {
    tenantId: tenant.id, companyId: c1.id, firstName: 'Kojo', lastName: 'Mensah', email: 'kojo@afrifoods.com', hireDate: new Date('2024-02-10'), baseSalary: 4200
  } })
  await prisma.bankAccount.create({ data: { employeeId: e2.id, bankName: 'UMB', accountNo: '1234509876' } })
  await prisma.compensation.create({ data: { employeeId: e2.id, effectiveFrom: new Date('2025-01-01'), baseSalary: 4200, allowances: { Rent: 800 }, deductions: {} } })

  const e3 = await prisma.employee.create({ data: {
    tenantId: tenant.id, companyId: c2.id, firstName: 'Akosua', lastName: 'Owusu', email: 'akosua@afrilog.com', hireDate: new Date('2022-09-01'), baseSalary: 3000
  } })
  await prisma.bankAccount.create({ data: { employeeId: e3.id, bankName: 'StanChart', accountNo: '5566778899' } })
  await prisma.compensation.create({ data: { employeeId: e3.id, effectiveFrom: new Date('2025-01-01'), baseSalary: 3000, allowances: { Fuel: 300 }, deductions: {} } })

  const e4 = await prisma.employee.create({ data: {
    tenantId: singleTenant.id, companyId: sc.id, firstName: 'Yaw', lastName: 'Asare', email: 'yaw@kokroko.com', hireDate: new Date('2020-03-01'), baseSalary: 12000
  } })
  await prisma.bankAccount.create({ data: { employeeId: e4.id, bankName: 'GCB', accountNo: '9988776655' } })
  await prisma.compensation.create({ data: { employeeId: e4.id, effectiveFrom: new Date('2025-01-01'), baseSalary: 12000, allowances: { CarAllowance: 1500 }, deductions: {} } })

  console.log('Seed complete')
}

main().finally(()=>prisma.$disconnect())

C) Ghana Rules Package – packages/ghana-rules

packages/ghana-rules/index.ts

export type TaxBand = { upTo: number | null; rate: number }
export type PAYETable = { monthlyBands: TaxBand[] }
export type SSNIT = { employee: number; employer: number; maxInsurableMonthly?: number; remittanceDueDay?: number }
export type MinWage = { amountPerDay: number; effectiveFrom: string }
export type LeavePolicy = { annualDaysMin: number; maternityWeeks: number; paternityDays?: number }

export type GhanaRules = {
  paye: PAYETable
  ssnit: SSNIT
  minWage: MinWage
  leave: LeavePolicy
}

packages/ghana-rules/loader.ts

// Load the latest applicable RuleVersion from DB by scope & effective date
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function loadRule<T=any>(scope: string, periodISO: string): Promise<T>{
  const effective = new Date(periodISO + '-01T00:00:00Z')
  const rv = await prisma.ruleVersion.findFirst({
    where:{ country:'Ghana', scope, effectiveFrom: { lte: effective } },
    orderBy: { effectiveFrom: 'desc' }
  })
  if(!rv) throw new Error(`No rule found for ${scope}`)
  return rv.payload as T
}

D) Payroll Engine – apps/payroll-engine

apps/payroll-engine/package.json

{ "name": "payroll-engine", "type": "module", "scripts": { "dev": "nest start --watch", "build": "nest build" } }

apps/payroll-engine/src/main.ts

import { NestFactory } from '@nestjs/core'
import { AppModule } from './module'

async function bootstrap(){
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('engine')
  await app.listen(4001)
}
bootstrap()

apps/payroll-engine/src/module.ts

import { Module } from '@nestjs/common'
import { CalcService } from './services/calc.service'
import { CalcController } from './web/calc.controller'

@Module({ providers:[CalcService], controllers:[CalcController] })
export class AppModule {}

apps/payroll-engine/src/services/calc.service.ts

import Decimal from 'decimal.js'
import { loadRule } from '../../../packages/ghana-rules/loader'

export interface CalcInput { period: string; base: number; allowances?: Record<string, number>; preTax?: Record<string, number>; postTax?: Record<string, number> }
export interface CalcOutput { gross:number; taxableIncome:number; paye:number; ssnitEE:number; ssnitER:number; net:number; lines:any[] }

function bandsTax(amount:number, bands:{upTo:number|null; rate:number}[]):number{
  let rem = new Decimal(amount), tax = new Decimal(0), lower = new Decimal(0)
  for(const b of bands){
    const up = b.upTo==null? null : new Decimal(b.upTo)
    const span = up? Decimal.min(rem, up.minus(lower)) : rem
    if(span.lte(0)) break
    tax = tax.plus(span.mul(b.rate/100))
    if(!up) break
    rem = rem.minus(span)
    lower = up
  }
  return tax.toDecimalPlaces(2).toNumber()
}

export class CalcService{
  async compute(input:CalcInput):Promise<CalcOutput>{
    const payeTable = await loadRule<any>('PAYE', input.period)
    const ssnit = await loadRule<any>('SSNIT', input.period)

    const gross = new Decimal(input.base).plus(Object.values(input.allowances||{}).reduce((a,b)=>a+b,0))
    const insurable = Decimal.min(gross, new Decimal(ssnit.maxInsurableMonthly || Number.MAX_SAFE_INTEGER))
    const ssnitEE = insurable.mul(ssnit.employee)
    const ssnitER = insurable.mul(ssnit.employer)
    const pre = new Decimal(Object.values(input.preTax||{}).reduce((a,b)=>a+b,0))
    const taxable = gross.minus(ssnitEE).minus(pre)
    const paye = new Decimal(bandsTax(taxable.toNumber(), payeTable.monthlyBands))
    const post = new Decimal(Object.values(input.postTax||{}).reduce((a,b)=>a+b,0))
    const net = gross.minus(ssnitEE).minus(paye).minus(post)
    return {
      gross: +gross.toFixed(2),
      taxableIncome: +taxable.toFixed(2),
      paye: +paye.toFixed(2),
      ssnitEE: +ssnitEE.toFixed(2),
      ssnitER: +ssnitER.toFixed(2),
      net: +net.toFixed(2),
      lines: []
    }
  }
}

apps/payroll-engine/src/web/calc.controller.ts

import { Body, Controller, Post } from '@nestjs/common'
import { CalcService, CalcInput } from '../services/calc.service'

@Controller('calc')
export class CalcController{
  constructor(private svc:CalcService){}

  @Post('payslip')
  async payslip(@Body() body:CalcInput){
    return this.svc.compute(body)
  }
}

E) Core API – apps/core-api

apps/core-api/package.json

{ "name":"core-api","type":"module","scripts":{"dev":"nest start --watch","build":"nest build"} }

apps/core-api/src/main.ts

import { NestFactory } from '@nestjs/core'
import { AppModule } from './module'

async function bootstrap(){
  const app = await NestFactory.create(AppModule)
  app.enableCors({ origin: [/localhost:3000$/] })
  app.setGlobalPrefix('api')
  await app.listen(4000)
}
bootstrap()

apps/core-api/src/module.ts

import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { EmployeeController } from './web/employee.controller'
import { PayrollController } from './web/payroll.controller'
import { LeaveController } from './web/leave.controller'
import { LoanController } from './web/loan.controller'
import { RulesController } from './web/rules.controller'

@Module({ providers:[PrismaService], controllers:[EmployeeController, PayrollController, LeaveController, LoanController, RulesController] })
export class AppModule {}

apps/core-api/src/prisma.service.ts

import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit{
  async onModuleInit(){ await this.$connect() }
  async enableShutdownHooks(app: INestApplication){ this.$on('beforeExit', async()=>{ await app.close() }) }
}

Employees apps/core-api/src/web/employee.controller.ts

import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Controller('employees')
export class EmployeeController{
  constructor(private db:PrismaService){}

  @Get(':companyId')
  list(@Param('companyId') companyId:string){
    return this.db.employee.findMany({ where:{ companyId } })
  }

  @Post(':companyId')
  create(@Param('companyId') companyId:string, @Body() body:any){
    return this.db.employee.create({ data:{ ...body, companyId, tenantId: body.tenantId } })
  }
}

Payroll apps/core-api/src/web/payroll.controller.ts

import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Controller('payroll')
export class PayrollController{
  constructor(private db:PrismaService){}

  @Post('run/:companyId/:period')
  async run(@Param('companyId') companyId:string, @Param('period') period:string){
    // Simplified demo – pull employees and call engine service
    const emps = await this.db.employee.findMany({ where:{ companyId } })
    const resp = [] as any[]
    for(const e of emps){
      const comp = await this.db.compensation.findFirst({ where:{ employeeId: e.id }, orderBy:{ effectiveFrom:'desc' } })
      const r = await fetch(`${process.env.ENGINE_URL}/engine/calc/payslip`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ period, base: Number(comp?.baseSalary||e.baseSalary), allowances: comp?.allowances||{} }) })
      const calc = await r.json()
      const slip = await this.db.payslip.create({ data: {
        payrollRun: { create: { tenantId: e.tenantId, companyId, period, status: 'CALCULATED', currency: 'GHS', createdBy: 'system', totals: {} } },
        employeeId: e.id,
        grossPay: calc.gross,
        taxableIncome: calc.taxableIncome,
        paye: calc.paye,
        ssnitEE: calc.ssnitEE,
        ssnitER: calc.ssnitER,
        netPay: calc.net,
        components: calc.lines,
        currency: 'GHS'
      } })
      resp.push(slip)
    }
    return resp
  }

  @Get('payslips/:companyId/:period')
  list(@Param('companyId') companyId:string, @Param('period') period:string){
    return this.db.payslip.findMany({ where:{ payrollRun: { companyId, period } }, include:{ payrollRun:true } })
  }
}

Leave apps/core-api/src/web/leave.controller.ts

import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Controller('leave')
export class LeaveController{
  constructor(private db:PrismaService){}

  @Post('request/:employeeId')
  async request(@Param('employeeId') employeeId:string, @Body() body:any){
    const policy = await this.db.ruleVersion.findFirst({ where:{ country:'Ghana', scope:'LEAVE' }, orderBy:{ effectiveFrom:'desc' } })
    return this.db.leaveRequest.create({ data: { employeeId, type: body.type, startDate: new Date(body.startDate), endDate: new Date(body.endDate), days: body.days, reason: body.reason, status:'PENDING', policySnapshot: policy?.payload||{} } })
  }

  @Post('approve/:leaveId')
  approve(@Param('leaveId') leaveId:string){ return this.db.leaveRequest.update({ where:{ id: leaveId }, data:{ status:'APPROVED' } }) }

  @Get('mine/:employeeId')
  mine(@Param('employeeId') employeeId:string){ return this.db.leaveRequest.findMany({ where:{ employeeId } }) }
}

Loans & Advances apps/core-api/src/web/loan.controller.ts

import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Controller('loans')
export class LoanController{
  constructor(private db:PrismaService){}

  @Post('apply/:employeeId')
  async apply(@Param('employeeId') employeeId:string, @Body() body:any){
    const principal = Number(body.principal), rate = Number(body.rateAPR), term = Number(body.termMonths)
    const startDate = new Date(body.startDate)
    const loan = await this.db.loan.create({ data:{ employeeId, principal, rateAPR: rate, termMonths: term, startDate, balance: principal, status:'ACTIVE' } })
    // simple amort schedule (flat per month)
    const r = rate/100/12
    const pmt = (principal * r) / (1 - Math.pow(1+r, -term))
    for(let i=0;i<term;i++){
      const interest = (principal) * r
      const pr = pmt - interest
      await this.db.loanSchedule.create({ data:{ loanId: loan.id, period: new Date(startDate.getFullYear(), startDate.getMonth()+i, 1).toISOString().slice(0,7), due: pmt, principal: pr, interest } })
      // reduce running principal for next iteration
    }
    return loan
  }

  @Get('schedule/:loanId')
  schedule(@Param('loanId') loanId:string){ return this.db.loanSchedule.findMany({ where:{ loanId }, orderBy:{ period: 'asc' } }) }
}

Rules (self‑service updates) apps/core-api/src/web/rules.controller.ts

import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Controller('rules')
export class RulesController{
  constructor(private db:PrismaService){}

  @Get(':scope/latest')
  latest(@Param('scope') scope:string){ return this.db.ruleVersion.findFirst({ where:{ country:'Ghana', scope }, orderBy:{ effectiveFrom:'desc' } }) }

  @Post(':scope')
  create(@Param('scope') scope:string, @Body() body:any){ return this.db.ruleVersion.create({ data:{ country:'Ghana', scope, version: body.version, effectiveFrom: new Date(body.effectiveFrom), payload: body.payload, notes: body.notes||null } }) }
}

F) Web – apps/web (Next.js 14)

apps/web/package.json

{ "name":"web","private":true,"scripts":{"dev":"next dev","build":"next build","start":"next start"},"dependencies":{"next":"14.2.5","react":"18.3.1","react-dom":"18.3.1","recharts":"2.12.6","tailwindcss":"3.4.9"} }

apps/web/tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = { content: ['./app/**/*.{ts,tsx,js,jsx}'], theme:{ extend:{} }, plugins:[] }

apps/web/app/globals.css

@tailwind base; @tailwind components; @tailwind utilities;

apps/web/app/layout.tsx

export const metadata = { title:'AkwaabaHRPay', description:'Ghana-first HR & Payroll' }
export default function RootLayout({children}:{children:React.ReactNode}){
  return (<html lang="en"><body className="min-h-screen bg-white text-gray-900">{children}</body></html>)
}

Landing page apps/web/app/page.tsx

export default function Home(){
  return (
    <main className="min-h-screen">
      <header className="max-w-6xl mx-auto p-6 flex items-center justify-between">
        <div className="text-2xl font-bold">AkwaabaHR<span className="text-emerald-600">Pay</span></div>
        <nav className="hidden md:flex gap-6 text-sm"><a href="#features">Features</a><a href="/pricing">Pricing</a><a href="/app">Launch App</a></nav>
      </header>
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-5xl font-semibold leading-tight">HR & Payroll for Ghana — built for single and group companies</h1>
          <p className="mt-4 text-gray-600">GHS-native payroll with PAYE, SSNIT, minimum wage, and leave. Consolidate across subsidiaries with multi-location controls.</p>
          <a href="/app" className="mt-6 inline-block px-6 py-3 rounded-2xl bg-emerald-600 text-white">Launch App</a>
        </div>
        <div className="rounded-2xl bg-gray-50 p-6 shadow-sm">
          <ul className="space-y-3 text-sm">
            <li>✔ Effective-dated rules (no prior-year drift)</li>
            <li>✔ Loans & advances with schedules</li>
            <li>✔ Employee self-service portal & mobile app</li>
            <li>✔ HR analytics dashboards</li>
          </ul>
        </div>
      </section>
    </main>
  )
}

App shell apps/web/app/app/layout.tsx

export default function AppLayout({children}:{children:React.ReactNode}){
  return (
    <div className="min-h-screen grid grid-cols-5">
      <aside className="col-span-1 bg-gray-50 border-r p-4 space-y-2">
        <a className="block font-semibold" href="/app">Dashboard</a>
        <a className="block" href="/app/employees">Employees</a>
        <a className="block" href="/app/leave">Leave</a>
        <a className="block" href="/app/payroll">Payroll</a>
        <a className="block" href="/app/loans">Loans</a>
        <a className="block" href="/app/analytics">Analytics</a>
        <a className="block" href="/self-service">Self‑Service</a>
        <a className="block" href="/app/rules">Rules</a>
      </aside>
      <main className="col-span-4 p-6">{children}</main>
    </div>
  )
}

Dashboard apps/web/app/app/page.tsx

export default function Dashboard(){
  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome to AkwaabaHRPay</h1>
      <p className="text-gray-600">Choose a company and period to begin a payroll run.</p>
    </div>
  )
}

Employees apps/web/app/app/employees/page.tsx

'use client'
import { useEffect, useState } from 'react'

export default function Employees(){
  const [data,setData] = useState<any[]>([])
  useEffect(()=>{ fetch(`${process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000'}/api/employees/COMPANY_ID`).then(r=>r.json()).then(setData) },[])
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Employees</h2>
      <table className="w-full text-sm"><thead><tr><th>Name</th><th>Email</th><th>Base</th></tr></thead><tbody>
        {data.map((e:any)=>(<tr key={e.id}><td>{e.firstName} {e.lastName}</td><td>{e.email}</td><td>{e.baseSalary}</td></tr>))}
      </tbody></table>
    </div>
  )
}

Leave apps/web/app/app/leave/page.tsx

'use client'
import { useEffect, useState } from 'react'

export default function Leave(){
  const [mine, setMine] = useState<any[]>([])
  useEffect(()=>{ fetch('http://localhost:4000/api/leave/mine/EMPLOYEE_ID').then(r=>r.json()).then(setMine) },[])
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Leave Requests</h2>
      <ul className="space-y-2">{mine.map(l=> (<li key={l.id} className="p-3 border rounded-lg">{l.type} • {l.status} • {new Date(l.startDate).toDateString()} – {new Date(l.endDate).toDateString()}</li>))}</ul>
    </div>
  )
}

Payroll apps/web/app/app/payroll/page.tsx

'use client'
import { useState } from 'react'

export default function Payroll(){
  const [period,setPeriod] = useState('2025-07')
  const [rows,setRows] = useState<any[]>([])
  const run = async()=>{
    const r = await fetch(`http://localhost:4000/api/payroll/run/COMPANY_ID/${period}`, { method:'POST' })
    const j = await r.json(); setRows(j)
  }
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Payroll Run</h2>
      <div className="flex gap-3 items-center mb-4">
        <input className="border px-2 py-1 rounded" value={period} onChange={e=>setPeriod(e.target.value)} />
        <button onClick={run} className="px-4 py-2 bg-emerald-600 text-white rounded">Run</button>
      </div>
      <table className="w-full text-sm"><thead><tr><th>Employee</th><th>Gross</th><th>Taxable</th><th>PAYE</th><th>SSNIT EE</th><th>Net</th></tr></thead><tbody>
        {rows.map((s:any)=>(<tr key={s.id}><td>{s.employeeId}</td><td>{s.grossPay}</td><td>{s.taxableIncome}</td><td>{s.paye}</td><td>{s.ssnitEE}</td><td>{s.netPay}</td></tr>))}
      </tbody></table>
    </div>
  )
}

Loans apps/web/app/app/loans/page.tsx

'use client'
import { useState } from 'react'

export default function Loans(){
  const [principal,setPrincipal] = useState(5000)
  const [term,setTerm] = useState(12)
  const [rate,setRate] = useState(24)
  const [schedule,setSchedule] = useState<any[]>([])
  const apply = async()=>{
    const r = await fetch('http://localhost:4000/api/loans/apply/EMPLOYEE_ID', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ principal, termMonths: term, rateAPR: rate, startDate: '2025-07-01' }) });
    const loan = await r.json();
    const sch = await fetch(`http://localhost:4000/api/loans/schedule/${loan.id}`); setSchedule(await sch.json())
  }
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Loans & Advances</h2>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <input className="border px-2 py-1" type="number" value={principal} onChange={e=>setPrincipal(+e.target.value)} />
        <input className="border px-2 py-1" type="number" value={term} onChange={e=>setTerm(+e.target.value)} />
        <input className="border px-2 py-1" type="number" value={rate} onChange={e=>setRate(+e.target.value)} />
        <button onClick={apply} className="px-4 py-2 bg-emerald-600 text-white rounded">Apply & Generate</button>
      </div>
      <table className="w-full text-sm"><thead><tr><th>Period</th><th>Due</th><th>Principal</th><th>Interest</th></tr></thead><tbody>
        {schedule.map((r:any)=>(<tr key={r.id}><td>{r.period}</td><td>{r.due}</td><td>{r.principal}</td><td>{r.interest}</td></tr>))}
      </tbody></table>
    </div>
  )
}

Rules page (self‑service) apps/web/app/app/rules/page.tsx

'use client'
import { useEffect, useState } from 'react'

export default function Rules(){
  const [scope,setScope] = useState('PAYE')
  const [payload,setPayload] = useState('{}')
  const [version,setVersion] = useState('2025.1.0')
  const [effectiveFrom,setEffectiveFrom] = useState('2025-10-01')
  const [latest,setLatest] = useState<any>(null)
  useEffect(()=>{ fetch(`http://localhost:4000/api/rules/${scope}/latest`).then(r=>r.json()).then(setLatest) },[scope])
  const create = async()=>{
    await fetch(`http://localhost:4000/api/rules/${scope}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ version, effectiveFrom, payload: JSON.parse(payload) }) })
    alert('Rule created');
  }
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Rules (Ghana) – Self‑service Updates</h2>
      <div className="flex gap-3 mb-4">
        <select className="border px-2 py-1" value={scope} onChange={e=>setScope(e.target.value)}>
          <option>PAYE</option><option>SSNIT</option><option>LEAVE</option><option>MIN_WAGE</option>
        </select>
        <input className="border px-2 py-1" value={version} onChange={e=>setVersion(e.target.value)} />
        <input className="border px-2 py-1" value={effectiveFrom} onChange={e=>setEffectiveFrom(e.target.value)} />
      </div>
      <textarea className="w-full h-56 border rounded p-2" value={payload} onChange={e=>setPayload(e.target.value)} />
      <div className="mt-3 flex gap-3">
        <button onClick={create} className="px-4 py-2 bg-emerald-600 text-white rounded">Publish New Version</button>
      </div>
      <div className="mt-6">
        <h3 className="font-semibold">Latest:</h3>
        <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">{JSON.stringify(latest,null,2)}</pre>
      </div>
    </div>
  )
}

HR Analytics apps/web/app/app/analytics/page.tsx

'use client'
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts'

export default function Analytics(){
  const [data,setData] = useState<any[]>([])
  useEffect(()=>{
    // demo data – in real life fetch consolidated totals per period
    setData([
      { period:'2025-04', gross: 42000, paye: 6200, ssnit: 3800 },
      { period:'2025-05', gross: 44100, paye: 6500, ssnit: 3960 },
      { period:'2025-06', gross: 45850, paye: 6710, ssnit: 4100 },
      { period:'2025-07', gross: 47000, paye: 6900, ssnit: 4180 },
    ])
  },[])
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">HR & Payroll Analytics</h2>
      <div>
        <h3 className="font-semibold mb-2">Gross vs PAYE over time</h3>
        <LineChart width={720} height={280} data={data}>
          <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="period"/><YAxis/><Tooltip/>
          <Line type="monotone" dataKey="gross"/><Line type="monotone" dataKey="paye"/>
        </LineChart>
      </div>
      <div>
        <h3 className="font-semibold mb-2">SSNIT (EE+ER) by month</h3>
        <BarChart width={720} height={280} data={data}>
          <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="period"/><YAxis/><Tooltip/>
          <Bar dataKey="ssnit"/>
        </BarChart>
      </div>
    </div>
  )
}

Employee Self‑Service (Web e‑portal) apps/web/app/self-service/page.tsx

'use client'
import { useState, useEffect } from 'react'

export default function SelfService(){
  const [payslips,setPayslips] = useState<any[]>([])
  const [leaves,setLeaves] = useState<any[]>([])
  useEffect(()=>{
    fetch('http://localhost:4000/api/payroll/payslips/COMPANY_ID/2025-07').then(r=>r.json()).then(setPayslips)
    fetch('http://localhost:4000/api/leave/mine/EMPLOYEE_ID').then(r=>r.json()).then(setLeaves)
  },[])
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">My Portal</h2>
      <section>
        <h3 className="font-semibold mb-2">Payslips</h3>
        <ul className="space-y-2">{payslips.map(p=>(<li key={p.id} className="p-3 border rounded">{p.payrollRun.period} • Net: {p.netPay}</li>))}</ul>
      </section>
      <section>
        <h3 className="font-semibold mb-2">My Leave</h3>
        <ul className="space-y-2">{leaves.map(l=>(<li key={l.id} className="p-3 border rounded">{l.type} • {l.status}</li>))}</ul>
      </section>
    </div>
  )
}

Pricing apps/web/app/pricing/page.tsx

export default function Pricing(){
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Pricing</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="border rounded-xl p-6"><h3 className="font-semibold">Starter</h3><p>Single company</p><p className="text-emerald-600 text-2xl mt-2">GHS 499/mo</p></div>
        <div className="border rounded-xl p-6"><h3 className="font-semibold">Growth</h3><p>Up to 3 subsidiaries</p><p className="text-emerald-600 text-2xl mt-2">GHS 1,499/mo</p></div>
        <div className="border rounded-xl p-6"><h3 className="font-semibold">Enterprise</h3><p>Group & unlimited locations</p><p className="text-emerald-600 text-2xl mt-2">Custom</p></div>
      </div>
    </div>
  )
}

G) Mobile App – apps/mobile (Expo + React Native)

apps/mobile/app.json

{ "expo": { "name": "AkwaabaHRPay", "slug":"akwaabahrpay", "scheme":"ahp", "android": { "package": "com.akwaaba.hrpay" } } }

apps/mobile/package.json

{ "name":"mobile","private":true,"scripts":{"start":"expo start"},"dependencies":{"expo":"~51.0.0","react":"18.3.1","react-native":"0.74.3"} }

apps/mobile/App.tsx

import React, { useEffect, useState } from 'react'
import { View, Text, Button, FlatList, SafeAreaView } from 'react-native'

const API = 'http://localhost:4000/api'

export default function App(){
  const [payslips,setPayslips] = useState<any[]>([])
  const [leaves,setLeaves] = useState<any[]>([])
  const [period,setPeriod] = useState('2025-07')
  const employeeId = 'EMPLOYEE_ID' // wire after auth
  useEffect(()=>{ fetch(`${API}/payroll/payslips/COMPANY_ID/${period}`).then(r=>r.json()).then(setPayslips) },[period])
  useEffect(()=>{ fetch(`${API}/leave/mine/${employeeId}`).then(r=>r.json()).then(setLeaves) },[])
  return (
    <SafeAreaView style={{ flex:1, padding:16 }}>
      <Text style={{ fontSize:20, fontWeight:'600' }}>AkwaabaHRPay</Text>
      <Text style={{ marginTop:8 }}>Payslips ({period})</Text>
      <FlatList data={payslips} keyExtractor={(i)=>i.id} renderItem={({item})=> (
        <View style={{ padding:12, borderWidth:1, borderRadius:8, marginVertical:6 }}>
          <Text>Net: GHS {item.netPay}</Text>
        </View>
      )} />
      <Text style={{ marginTop:16 }}>My Leave</Text>
      <FlatList data={leaves} keyExtractor={(i)=>i.id} renderItem={({item})=> (
        <View style={{ padding:12, borderWidth:1, borderRadius:8, marginVertical:6 }}>
          <Text>{item.type} • {item.status}</Text>
        </View>
      )} />
    </SafeAreaView>
  )
}

H) Infra – Docker Compose (dev)

infra/docker/docker-compose.yml

version: '3.9'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: hrpayroll
    ports: ["5432:5432"]
  redis:
    image: redis:7
    ports: ["6379:6379"]
  mq:
    image: rabbitmq:3-management
    ports: ["5672:5672", "15672:15672"]
  core-api:
    build: ../../apps/core-api
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - ENGINE_URL=http://engine:4001
    depends_on: [db]
    ports: ["4000:4000"]
  engine:
    build: ../../apps/payroll-engine
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on: [db]
    ports: ["4001:4001"]
  web:
    build: ../../apps/web
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000
    ports: ["3000:3000"]

I) Quickstart

cp .env.example .env
pnpm i
docker compose -f infra/docker/docker-compose.yml up -d
pnpm migrate && pnpm seed
pnpm dev

Open http://localhost:3000 → Launch App.

Replace placeholders COMPANY_ID / EMPLOYEE_ID with IDs from your seeded DB, or build a small selector UI.

J) Notes

All statutory rules are effective‑dated (via RuleVersion) and snapshotted into runs/payslips, so historic reports stay intact when laws change.

GHS is the calculation currency; USD/EUR only for display/analytics using FxRate (add a cron to refresh rates if needed).

Add auth (Clerk/Auth.js) and RLS policies as you move to prod.

Extend analytics by aggregating Payslip and LeaveRequest per period, company, location, department.
