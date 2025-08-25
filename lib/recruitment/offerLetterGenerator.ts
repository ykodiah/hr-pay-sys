export interface OfferLetterData {
  candidateName: string
  candidateAddress: string
  jobTitle: string
  department: string
  salary: number
  startDate: string
  benefits: string[]
  workingHours: string
  probationPeriod: number
  noticePeriod: number
  companyName: string
  companyAddress: string
  signatoryName: string
  signatoryTitle: string
}

export class OfferLetterGenerator {
  static generateOfferLetter(data: OfferLetterData): string {
    const currentDate = new Date().toLocaleDateString("en-GB")

    return `
${data.companyName}
${data.companyAddress}

${currentDate}

${data.candidateName}
${data.candidateAddress}

Dear ${data.candidateName},

OFFER OF EMPLOYMENT - ${data.jobTitle.toUpperCase()}

We are pleased to offer you the position of ${data.jobTitle} in our ${data.department} department, subject to the terms and conditions outlined below and in accordance with the Ghana Labour Act, 2003 (Act 651).

TERMS AND CONDITIONS OF EMPLOYMENT:

1. POSITION AND DUTIES
You will be employed as ${data.jobTitle} and will be expected to perform duties as assigned by your immediate supervisor and management.

2. COMMENCEMENT DATE
Your employment will commence on ${data.startDate}, subject to satisfactory completion of pre-employment requirements.

3. REMUNERATION
Your gross monthly salary will be GHS ${data.salary.toLocaleString()}, payable monthly in arrears. This salary is subject to statutory deductions including Pay As You Earn (PAYE), Social Security and National Insurance Trust (SSNIT) contributions, and any other deductions required by law.

4. WORKING HOURS
Your normal working hours will be ${data.workingHours} from Monday to Friday, with a one-hour lunch break. You may be required to work additional hours as business needs dictate, for which overtime compensation will be provided in accordance with the Labour Act.

5. PROBATIONARY PERIOD
Your employment will be subject to a probationary period of ${data.probationPeriod} months as provided under Section 20 of the Labour Act, 2003 (Act 651). During this period, either party may terminate the employment with one week's notice.

6. NOTICE PERIOD
After successful completion of the probationary period, either party may terminate this employment by giving ${data.noticePeriod} months' written notice or payment in lieu thereof, as provided under Section 22 of the Labour Act.

7. BENEFITS
You will be entitled to the following benefits:
${data.benefits.map((benefit) => `• ${benefit}`).join("\n")}
• Annual leave of 15 working days (increasing to 21 days after 5 years of service) as per Section 31 of the Labour Act
• Sick leave as provided under Section 32 of the Labour Act
• Maternity/Paternity leave as provided under Sections 33-34 of the Labour Act

8. STATUTORY COMPLIANCE
This employment is governed by the Ghana Labour Act, 2003 (Act 651), and all applicable labor laws and regulations of Ghana. The company will ensure compliance with all statutory requirements including SSNIT registration, income tax obligations, and workplace safety standards.

9. CONFIDENTIALITY AND NON-DISCLOSURE
You will be required to maintain strict confidentiality regarding company information, trade secrets, and client data both during and after your employment.

10. ACCEPTANCE
This offer is valid until ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB")}. Please confirm your acceptance by signing and returning one copy of this letter.

We look forward to welcoming you to our team and to a mutually beneficial working relationship.

Yours sincerely,


${data.signatoryName}
${data.signatoryTitle}
${data.companyName}

---

ACCEPTANCE

I, ${data.candidateName}, hereby accept the offer of employment as ${data.jobTitle} under the terms and conditions stated above.

Signature: _________________________ Date: _____________

${data.candidateName}
    `.trim()
  }

  static generateOnboardingTasks(candidateName: string, jobTitle: string, department: string): any[] {
    const baseTasks = [
      {
        taskType: "document",
        title: "Employment Contract Signing",
        description: "Review and sign employment contract, job description, and company policies",
        assignedTo: "HR Legal Team",
        department: "HR",
        priority: "high",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      {
        taskType: "document",
        title: "Bank Details Collection",
        description: "Collect bank account details for salary payments and complete direct deposit forms",
        assignedTo: "HR Payroll Team",
        department: "HR",
        priority: "high",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      {
        taskType: "document",
        title: "Tax Forms Completion",
        description: "Complete tax declaration forms and provide TIN certificate",
        assignedTo: "HR Payroll Team",
        department: "HR",
        priority: "high",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      {
        taskType: "document",
        title: "Emergency Contact Information",
        description: "Provide emergency contact details and next of kin information",
        assignedTo: "HR Team",
        department: "HR",
        priority: "medium",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      {
        taskType: "system",
        title: "IT Equipment Provisioning",
        description: "Setup laptop, mobile phone, email account, and system access credentials",
        assignedTo: "IT Support Team",
        department: "IT",
        priority: "high",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      {
        taskType: "system",
        title: "System Access Setup",
        description: "Create user accounts for HRIS, project management tools, and department-specific systems",
        assignedTo: "IT Security Team",
        department: "IT",
        priority: "high",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      {
        taskType: "facility",
        title: "Workspace Assignment",
        description: "Assign desk, chair, storage space, and office supplies",
        assignedTo: "Facilities Management",
        department: "Facilities",
        priority: "medium",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      {
        taskType: "facility",
        title: "Access Cards and Keys",
        description: "Issue building access cards, parking permits, and office keys",
        assignedTo: "Security Team",
        department: "Security",
        priority: "medium",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      {
        taskType: "training",
        title: "Company Orientation",
        description: "General company orientation covering history, values, structure, and policies",
        assignedTo: "HR Training Team",
        department: "HR",
        priority: "high",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      {
        taskType: "training",
        title: "Department Introduction",
        description: "Introduction to department team, processes, and specific responsibilities",
        assignedTo: `${department} Manager`,
        department: department,
        priority: "high",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      {
        taskType: "training",
        title: "Health and Safety Training",
        description: "Workplace safety procedures, emergency protocols, and health guidelines",
        assignedTo: "Health & Safety Officer",
        department: "HR",
        priority: "high",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      {
        taskType: "policy",
        title: "Policy Acknowledgment",
        description: "Review and acknowledge company policies, code of conduct, and employee handbook",
        assignedTo: "HR Compliance Team",
        department: "HR",
        priority: "high",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
    ]

    // Add role-specific tasks based on department
    const departmentSpecificTasks = this.getDepartmentSpecificTasks(department)

    return [...baseTasks, ...departmentSpecificTasks].map((task, index) => ({
      ...task,
      id: `task_${Date.now()}_${index}`,
      candidateId: candidateName.toLowerCase().replace(/\s+/g, "_"),
      candidateName,
      status: "pending",
    }))
  }

  private static getDepartmentSpecificTasks(department: string): any[] {
    const departmentTasks: { [key: string]: any[] } = {
      Engineering: [
        {
          taskType: "system",
          title: "Development Environment Setup",
          description: "Setup development tools, code repositories, and testing environments",
          assignedTo: "Senior Developer",
          department: "Engineering",
          priority: "high",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        },
        {
          taskType: "training",
          title: "Technical Architecture Overview",
          description: "Overview of system architecture, coding standards, and development processes",
          assignedTo: "Technical Lead",
          department: "Engineering",
          priority: "high",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        },
      ],
      "Human Resources": [
        {
          taskType: "system",
          title: "HRIS System Training",
          description: "Training on HR Information System, payroll software, and recruitment tools",
          assignedTo: "HR Systems Administrator",
          department: "HR",
          priority: "high",
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        },
        {
          taskType: "training",
          title: "Ghana Labour Law Training",
          description: "Comprehensive training on Ghana Labour Act and employment regulations",
          assignedTo: "HR Legal Advisor",
          department: "HR",
          priority: "high",
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        },
      ],
      Finance: [
        {
          taskType: "system",
          title: "Financial Systems Access",
          description: "Setup access to accounting software, ERP systems, and financial reporting tools",
          assignedTo: "Finance Systems Admin",
          department: "Finance",
          priority: "high",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        },
        {
          taskType: "training",
          title: "Financial Compliance Training",
          description: "Training on financial regulations, audit procedures, and compliance requirements",
          assignedTo: "Finance Manager",
          department: "Finance",
          priority: "high",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        },
      ],
    }

    return departmentTasks[department] || []
  }
}
