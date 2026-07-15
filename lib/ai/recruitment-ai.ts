export interface JobAnalysis {
  title: string;
  department: string;
  location: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  estimatedSalary: {
    min: number;
    max: number;
    currency: string;
  };
  keyResponsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  qualifications: string[];
  benefits: string[];
  workArrangement: 'remote' | 'hybrid' | 'onsite';
  urgency: 'low' | 'medium' | 'high';
  marketDemand: 'low' | 'medium' | 'high';
  estimatedTimeToFill: number; // in days
}

export interface CandidateMatch {
  candidateId: string;
  matchScore: number;
  strengths: string[];
  concerns: string[];
  recommendedQuestions: string[];
  salaryExpectation: {
    min: number;
    max: number;
  };
  availability: string;
  culturalFit: number;
  technicalFit: number;
}

export interface InterviewQuestions {
  technical: string[];
  behavioral: string[];
  situational: string[];
  roleSpecific: string[];
  cultural: string[];
}

export interface SalaryBenchmark {
  position: string;
  location: string;
  experience: string;
  minSalary: number;
  maxSalary: number;
  medianSalary: number;
  marketRate: 'below' | 'at' | 'above';
  recommendations: string[];
}

export class RecruitmentAI {
  private static readonly GHANA_SALARY_MULTIPLIERS = {
    'Accra': 1.0,
    'Kumasi': 0.85,
    'Tamale': 0.75,
    'Cape Coast': 0.80,
    'Takoradi': 0.82,
    'Koforidua': 0.78,
    'Sunyani': 0.75,
    'Ho': 0.70,
    'Techiman': 0.72,
    'Bolgatanga': 0.70
  };

  private static readonly EXPERIENCE_MULTIPLIERS = {
    'entry': 0.6,
    'mid': 1.0,
    'senior': 1.5,
    'executive': 2.2
  };

  private static readonly DEPARTMENT_MULTIPLIERS = {
    'Engineering': 1.2,
    'Finance': 1.0,
    'Marketing': 0.9,
    'Sales': 0.95,
    'Human Resources': 0.85,
    'Operations': 0.9,
    'Legal': 1.1,
    'Healthcare': 1.05,
    'Education': 0.8,
    'Government': 0.75
  };

  static async analyzeJobPosting(
    title: string,
    department: string,
    location: string,
    description: string,
    requirements: string[]
  ): Promise<JobAnalysis> {
    // Enhanced AI analysis with Ghana-specific insights
    const experienceLevel = this.determineExperienceLevel(title, requirements);
    const baseSalary = this.calculateGhanaSalary(title, experienceLevel, location);
    const locationMultiplier = this.GHANA_SALARY_MULTIPLIERS[location as keyof typeof this.GHANA_SALARY_MULTIPLIERS] || 0.8;
    
    const estimatedSalary = {
      min: Math.round(baseSalary * 0.8),
      max: Math.round(baseSalary * 1.3),
      currency: 'GHS'
    };

    return {
      title,
      department,
      location,
      experienceLevel,
      estimatedSalary,
      keyResponsibilities: this.generateResponsibilities(title, department),
      requiredSkills: this.extractRequiredSkills(description, requirements),
      preferredSkills: this.generatePreferredSkills(title, department),
      qualifications: this.generateQualifications(title, experienceLevel),
      benefits: this.generateBenefits(department, experienceLevel),
      workArrangement: this.determineWorkArrangement(title, department),
      urgency: this.assessUrgency(title, department),
      marketDemand: this.assessGhanaMarketDemand(title, location),
      estimatedTimeToFill: this.calculateGhanaTimeToFill(title, location, experienceLevel)
    };
  }

  static async matchCandidates(
    jobAnalysis: JobAnalysis,
    candidates: any[]
  ): Promise<CandidateMatch[]> {
    return candidates.map(candidate => {
      const technicalFit = this.calculateTechnicalFit(candidate.skills || [], jobAnalysis.requiredSkills);
      const culturalFit = this.calculateCulturalFit(candidate, jobAnalysis);
      const experienceFit = this.calculateExperienceFit(candidate.experience, jobAnalysis.experienceLevel);
      
      const matchScore = Math.round((technicalFit * 0.4 + culturalFit * 0.3 + experienceFit * 0.3) * 100);
      
      return {
        candidateId: candidate.id,
        matchScore,
        strengths: this.identifyStrengths(candidate, jobAnalysis),
        concerns: this.identifyConcerns(candidate, jobAnalysis),
        recommendedQuestions: this.generateInterviewQuestionsForCandidate(candidate, jobAnalysis),
        salaryExpectation: this.estimateSalaryExpectation(candidate, jobAnalysis),
        availability: this.assessAvailability(candidate),
        culturalFit,
        technicalFit
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  static async generateInterviewQuestions(
    jobTitle: string,
    department: string,
    experienceLevel: string
  ): Promise<InterviewQuestions> {
    return {
      technical: this.generateTechnicalQuestions(jobTitle, department),
      behavioral: this.generateBehavioralQuestions(experienceLevel),
      situational: this.generateSituationalQuestions(jobTitle, department),
      roleSpecific: this.generateRoleSpecificQuestions(jobTitle, department),
      cultural: this.generateCulturalQuestions(department)
    };
  }

  static async getSalaryBenchmark(
    position: string,
    location: string,
    experience: string
  ): Promise<SalaryBenchmark> {
    const baseSalary = this.calculateBaseSalary(position, 'General', experience as any);
    const locationMultiplier = this.GHANA_SALARY_MULTIPLIERS[location as keyof typeof this.GHANA_SALARY_MULTIPLIERS] || 0.8;
    
    const minSalary = Math.round(baseSalary * locationMultiplier * 0.7);
    const maxSalary = Math.round(baseSalary * locationMultiplier * 1.3);
    const medianSalary = Math.round((minSalary + maxSalary) / 2);

    return {
      position,
      location,
      experience,
      minSalary,
      maxSalary,
      medianSalary,
      marketRate: 'at',
      recommendations: this.generateSalaryRecommendations(minSalary, maxSalary, medianSalary)
    };
  }

  static async generateJobDescription(
    title: string,
    department: string,
    requirements: string[]
  ): Promise<{ description: string; responsibilities: string[]; qualifications: string[] }> {
    const responsibilities = this.generateResponsibilities(title, department);
    const qualifications = this.generateQualifications(title, 'mid');
    
    const description = `We are seeking a talented ${title} to join our ${department} team. 
    This role offers an exciting opportunity to contribute to our company's growth and success in Ghana's dynamic business environment.
    
    The ideal candidate will be passionate about ${this.getDepartmentFocus(department)} and have a strong track record of delivering results.
    You will work closely with cross-functional teams and have the opportunity to make a meaningful impact on our organization.
    
    This position is perfect for someone who thrives in a collaborative environment and is looking to advance their career in ${department}.`;

    return {
      description: description.trim(),
      responsibilities,
      qualifications
    };
  }

  private static determineExperienceLevel(title: string, requirements: string[]): 'entry' | 'mid' | 'senior' | 'executive' {
    const titleLower = title.toLowerCase();
    const requirementsText = requirements.join(' ').toLowerCase();
    
    if (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('principal')) {
      return 'senior';
    }
    if (titleLower.includes('manager') || titleLower.includes('director') || titleLower.includes('head')) {
      return 'executive';
    }
    if (titleLower.includes('junior') || titleLower.includes('entry') || titleLower.includes('associate')) {
      return 'entry';
    }
    
    const yearsMatch = requirementsText.match(/(\d+)\+?\s*years?/);
    if (yearsMatch) {
      const years = parseInt(yearsMatch[1]);
      if (years >= 7) return 'senior';
      if (years >= 3) return 'mid';
      return 'entry';
    }
    
    return 'mid';
  }

  private static calculateBaseSalary(title: string, department: string, experienceLevel: string): number {
    const baseSalaries: { [key: string]: number } = {
      'Software Engineer': 4500,
      'Senior Software Engineer': 6500,
      'Data Scientist': 5500,
      'Product Manager': 6000,
      'Marketing Manager': 5000,
      'HR Manager': 4500,
      'Finance Manager': 5500,
      'Sales Manager': 5200,
      'Operations Manager': 4800,
      'Business Analyst': 4000,
      'Project Manager': 5000,
      'UX Designer': 4200,
      'DevOps Engineer': 5800,
      'System Administrator': 4000,
      'Accountant': 3500,
      'Customer Success Manager': 4500,
      'Content Manager': 3500,
      'Digital Marketing Specialist': 3000,
      'Recruiter': 3200,
      'Executive Assistant': 2500
    };

    let baseSalary = 3000; // Default base salary
    
    // Find matching title
    for (const [key, value] of Object.entries(baseSalaries)) {
      if (title.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(title.toLowerCase())) {
        baseSalary = value;
        break;
      }
    }

    // Apply experience multiplier
    const experienceMultiplier = this.EXPERIENCE_MULTIPLIERS[experienceLevel as keyof typeof this.EXPERIENCE_MULTIPLIERS] || 1.0;
    
    // Apply department multiplier
    const departmentMultiplier = this.DEPARTMENT_MULTIPLIERS[department as keyof typeof this.DEPARTMENT_MULTIPLIERS] || 1.0;

    return Math.round(baseSalary * experienceMultiplier * departmentMultiplier);
  }

  private static generateResponsibilities(title: string, department: string): string[] {
    const responsibilities: { [key: string]: string[] } = {
      'Engineering': [
        'Develop and maintain scalable software solutions for Ghanaian and international markets',
        'Collaborate with cross-functional teams to define and implement new features',
        'Write clean, maintainable, and efficient code following industry best practices',
        'Participate in code reviews and technical discussions',
        'Troubleshoot and debug applications with focus on performance optimization',
        'Stay updated with latest technologies and implement innovative solutions',
        'Work with local and international development teams',
        'Ensure applications meet Ghanaian data protection and privacy requirements'
      ],
      'Human Resources': [
        'Manage end-to-end recruitment and selection processes',
        'Develop and implement HR policies compliant with Ghana Labour Act 2003',
        'Handle employee relations and conflict resolution effectively',
        'Coordinate performance management and appraisal systems',
        'Ensure compliance with Ghana Labour Act, SSNIT, and other local regulations',
        'Manage employee benefits including SSNIT contributions and health insurance',
        'Develop training programs for local talent development',
        'Maintain employee records in compliance with Ghanaian labor laws'
      ],
      'Finance': [
        'Prepare financial reports compliant with Ghana Accounting Standards',
        'Manage budgeting and forecasting processes for local operations',
        'Ensure compliance with GRA tax regulations and filing requirements',
        'Analyze financial data and provide strategic insights',
        'Coordinate with external auditors and Ghana Revenue Authority',
        'Manage cash flow and working capital for Ghana operations',
        'Handle foreign exchange transactions and currency risk management',
        'Prepare reports for Bank of Ghana regulatory requirements'
      ],
      'Marketing': [
        'Develop and execute marketing campaigns for Ghanaian market',
        'Analyze local market trends and competitor activities',
        'Manage digital marketing channels including mobile-first strategies',
        'Coordinate with sales teams to generate leads and drive revenue',
        'Measure and report on marketing performance and ROI',
        'Develop brand positioning for Ghanaian and West African markets',
        'Create culturally relevant content for local audiences',
        'Manage partnerships with local media and advertising agencies'
      ],
      'Sales': [
        'Develop and maintain relationships with Ghanaian clients',
        'Achieve sales targets and revenue objectives',
        'Identify new business opportunities in local market',
        'Prepare sales proposals and presentations',
        'Negotiate contracts and pricing with clients',
        'Maintain CRM system with accurate client information',
        'Collaborate with marketing team on lead generation',
        'Provide customer support and maintain client satisfaction'
      ],
      'Operations': [
        'Oversee daily operations and ensure efficiency',
        'Manage supply chain and logistics for Ghana operations',
        'Implement process improvements and best practices',
        'Coordinate with local suppliers and vendors',
        'Ensure compliance with local business regulations',
        'Manage inventory and resource allocation',
        'Develop and maintain operational procedures',
        'Monitor key performance indicators and metrics'
      ]
    };

    return responsibilities[department] || [
      'Execute assigned tasks and projects effectively',
      'Collaborate with team members to achieve departmental goals',
      'Maintain high standards of work quality and professionalism',
      'Contribute to process improvements and innovation',
      'Ensure compliance with company policies and local regulations',
      'Support organizational objectives and strategic initiatives'
    ];
  }

  private static extractRequiredSkills(description: string, requirements: string[]): string[] {
    const commonSkills = [
      // Core Skills
      'Communication', 'Problem Solving', 'Teamwork', 'Leadership', 'Time Management',
      'Critical Thinking', 'Adaptability', 'Cultural Sensitivity', 'Multilingual',
      
      // Technical Skills
      'Microsoft Office', 'Project Management', 'Data Analysis', 'Customer Service',
      'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS', 'Git', 'Docker',
      'Mobile Development', 'API Development', 'Database Management',
      
      // Ghana-Specific Skills
      'Ghana Labour Act', 'SSNIT Compliance', 'GRA Tax Regulations', 'Bank of Ghana Regulations',
      'Local Market Knowledge', 'West African Business Practices', 'Cultural Awareness',
      
      // Financial Skills
      'Financial Analysis', 'Budgeting', 'Auditing', 'Tax Compliance', 'Forex Management',
      'Ghana Accounting Standards', 'IFRS', 'ACCA', 'CPA',
      
      // Marketing Skills
      'Digital Marketing', 'SEO', 'Social Media', 'Content Creation', 'Mobile Marketing',
      'Local Market Research', 'Brand Management', 'Customer Acquisition',
      
      // HR Skills
      'Recruitment', 'Employee Relations', 'Performance Management', 'Training',
      'Labor Law Compliance', 'HRIS Systems', 'Talent Development',
      
      // Language Skills
      'English', 'Twi', 'Hausa', 'French', 'Local Languages'
    ];

    const extractedSkills: string[] = [];
    const text = (description + ' ' + requirements.join(' ')).toLowerCase();

    commonSkills.forEach(skill => {
      if (text.includes(skill.toLowerCase())) {
        extractedSkills.push(skill);
      }
    });

    // Add Ghana-specific skills based on department
    if (description.toLowerCase().includes('hr') || description.toLowerCase().includes('human resources')) {
      extractedSkills.push('Ghana Labour Act', 'SSNIT Compliance');
    }
    if (description.toLowerCase().includes('finance') || description.toLowerCase().includes('accounting')) {
      extractedSkills.push('GRA Tax Regulations', 'Ghana Accounting Standards');
    }
    if (description.toLowerCase().includes('marketing') || description.toLowerCase().includes('sales')) {
      extractedSkills.push('Local Market Knowledge', 'Mobile Marketing');
    }

    return extractedSkills.length > 0 ? extractedSkills : ['Communication', 'Problem Solving', 'Teamwork', 'Cultural Awareness'];
  }

  private static generatePreferredSkills(title: string, department: string): string[] {
    const preferredSkills: { [key: string]: string[] } = {
      'Engineering': [
        'Agile/Scrum', 'CI/CD', 'Docker', 'Kubernetes', 'Microservices',
        'Mobile App Development', 'Cloud Computing', 'DevOps', 'API Design',
        'Ghana Tech Ecosystem Knowledge', 'Fintech Experience', 'E-commerce Platforms'
      ],
      'Human Resources': [
        'CIPD Certification', 'HRIS Systems', 'Labor Law', 'Training & Development',
        'Ghana Labour Act Expertise', 'SSNIT Administration', 'Talent Acquisition',
        'Employee Engagement', 'Performance Management', 'Cultural Competency'
      ],
      'Finance': [
        'CPA/ACCA', 'ERP Systems', 'Financial Modeling', 'Risk Management',
        'Ghana Accounting Standards', 'GRA Tax Compliance', 'Forex Management',
        'Banking Regulations', 'IFRS', 'Audit Experience', 'Treasury Management'
      ],
      'Marketing': [
        'Google Analytics', 'HubSpot', 'Adobe Creative Suite', 'Email Marketing',
        'Social Media Marketing', 'Mobile Marketing', 'Local Market Research',
        'Brand Management', 'Content Strategy', 'Digital Advertising',
        'Ghanaian Market Knowledge', 'West African Consumer Behavior'
      ],
      'Sales': [
        'CRM Systems', 'Lead Generation', 'Client Relationship Management',
        'Negotiation Skills', 'Presentation Skills', 'Market Analysis',
        'Ghanaian Business Culture', 'B2B Sales', 'Account Management'
      ],
      'Operations': [
        'Process Improvement', 'Supply Chain Management', 'Quality Control',
        'Project Management', 'Vendor Management', 'Inventory Management',
        'Local Supplier Networks', 'Logistics Management', 'Cost Optimization'
      ]
    };

    return preferredSkills[department] || [
      'Advanced Excel', 'Presentation Skills', 'Strategic Thinking',
      'Cultural Awareness', 'Local Market Knowledge', 'Multilingual'
    ];
  }

  private static generateQualifications(title: string, experienceLevel: string): string[] {
    const baseQualifications = [
      'Bachelor\'s degree in relevant field or equivalent experience',
      'Strong communication and interpersonal skills in English',
      'Proven ability to work independently and as part of a team',
      'Excellent problem-solving and analytical skills',
      'Cultural sensitivity and ability to work in diverse environments',
      'Proficiency in Microsoft Office Suite'
    ];

    // Add Ghana-specific qualifications
    if (title.toLowerCase().includes('hr') || title.toLowerCase().includes('human resources')) {
      baseQualifications.push('Knowledge of Ghana Labour Act 2003');
      baseQualifications.push('Understanding of SSNIT and local labor regulations');
    }
    
    if (title.toLowerCase().includes('finance') || title.toLowerCase().includes('accounting')) {
      baseQualifications.push('Knowledge of Ghana Accounting Standards');
      baseQualifications.push('Understanding of GRA tax regulations');
    }
    
    if (title.toLowerCase().includes('marketing') || title.toLowerCase().includes('sales')) {
      baseQualifications.push('Understanding of Ghanaian consumer behavior');
      baseQualifications.push('Experience with mobile-first marketing strategies');
    }

    if (experienceLevel === 'senior' || experienceLevel === 'executive') {
      baseQualifications.push('5+ years of relevant experience in Ghana or West Africa');
      baseQualifications.push('Leadership and team management experience');
      baseQualifications.push('Proven track record of delivering results');
      baseQualifications.push('Experience working with international teams');
    }

    return baseQualifications;
  }

  private static generateBenefits(department: string, experienceLevel: string): string[] {
    const baseBenefits = [
      'Competitive salary package in Ghana Cedis (GHS)',
      'Comprehensive health insurance coverage',
      'Annual leave entitlement (21+ days)',
      'Professional development and training opportunities',
      'Flexible working arrangements (hybrid/remote options)',
      'SSNIT pension scheme contribution',
      'Transportation allowance',
      'Lunch allowance',
      '13th month salary bonus'
    ];

    if (experienceLevel === 'senior' || experienceLevel === 'executive') {
      baseBenefits.push('Performance-based bonus');
      baseBenefits.push('Car allowance or company vehicle');
      baseBenefits.push('Stock options or profit sharing');
      baseBenefits.push('International travel opportunities');
      baseBenefits.push('Executive health checkup');
    }

    // Add department-specific benefits
    if (department === 'Engineering') {
      baseBenefits.push('Tech equipment and tools allowance');
      baseBenefits.push('Conference and training budget');
    }
    
    if (department === 'Sales') {
      baseBenefits.push('Commission structure');
      baseBenefits.push('Client entertainment allowance');
    }

    return baseBenefits;
  }

  private static determineWorkArrangement(title: string, department: string): 'remote' | 'hybrid' | 'onsite' {
    const remoteFriendly = ['Software Engineer', 'Data Scientist', 'Marketing', 'Content'];
    const hybridFriendly = ['Manager', 'Analyst', 'Consultant'];
    
    if (remoteFriendly.some(role => title.includes(role))) return 'remote';
    if (hybridFriendly.some(role => title.includes(role))) return 'hybrid';
    return 'onsite';
  }

  private static assessUrgency(title: string, department: string): 'low' | 'medium' | 'high' {
    const highUrgency = ['Senior', 'Manager', 'Lead', 'Director'];
    return highUrgency.some(role => title.includes(role)) ? 'high' : 'medium';
  }

  private static assessMarketDemand(title: string, department: string): 'low' | 'medium' | 'high' {
    const highDemand = ['Software Engineer', 'Data Scientist', 'Digital Marketing', 'Finance'];
    return highDemand.some(role => title.includes(role) || department.includes(role)) ? 'high' : 'medium';
  }

  private static estimateTimeToFill(title: string, department: string, location: string): number {
    let baseDays = 30;
    
    if (title.includes('Senior') || title.includes('Manager')) baseDays += 15;
    if (location === 'Accra') baseDays -= 5;
    if (department === 'Engineering') baseDays += 10;
    
    return baseDays;
  }

  private static calculateTechnicalFit(candidateSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 0.5;
    
    const matchingSkills = candidateSkills.filter(skill => 
      requiredSkills.some(required => 
        skill.toLowerCase().includes(required.toLowerCase()) || 
        required.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    return matchingSkills.length / requiredSkills.length;
  }

  private static calculateCulturalFit(candidate: any, jobAnalysis: JobAnalysis): number {
    // Simplified cultural fit calculation
    return 0.7 + Math.random() * 0.3;
  }

  private static calculateExperienceFit(candidateExperience: string, requiredLevel: string): number {
    const experienceYears = parseInt(candidateExperience) || 0;
    
    switch (requiredLevel) {
      case 'entry': return experienceYears <= 2 ? 1.0 : 0.8;
      case 'mid': return experienceYears >= 2 && experienceYears <= 5 ? 1.0 : 0.7;
      case 'senior': return experienceYears >= 5 ? 1.0 : 0.6;
      case 'executive': return experienceYears >= 7 ? 1.0 : 0.5;
      default: return 0.5;
    }
  }

  private static identifyStrengths(candidate: any, jobAnalysis: JobAnalysis): string[] {
    const strengths = [];
    
    if (candidate.score && candidate.score > 80) strengths.push('High overall score');
    if (candidate.skills && candidate.skills.length > 5) strengths.push('Diverse skill set');
    if (candidate.experience && parseInt(candidate.experience) > 3) strengths.push('Relevant experience');
    if (candidate.education) strengths.push('Strong educational background');
    
    return strengths.length > 0 ? strengths : ['Good communication skills'];
  }

  private static identifyConcerns(candidate: any, jobAnalysis: JobAnalysis): string[] {
    const concerns = [];
    
    if (candidate.score && candidate.score < 60) concerns.push('Below average score');
    if (candidate.skills && candidate.skills.length < 3) concerns.push('Limited skill set');
    if (candidate.experience && parseInt(candidate.experience) < 1) concerns.push('Limited experience');
    
    return concerns.length > 0 ? concerns : ['Requires further assessment'];
  }

  private static generateInterviewQuestionsForCandidate(candidate: any, jobAnalysis: JobAnalysis): string[] {
    return [
      'Tell me about your experience with ' + (candidate.skills?.[0] || 'relevant technologies'),
      'How do you handle challenging projects?',
      'What motivates you in your career?',
      'Describe a time you worked in a team environment'
    ];
  }

  private static estimateSalaryExpectation(candidate: any, jobAnalysis: JobAnalysis): { min: number; max: number } {
    const baseSalary = jobAnalysis.estimatedSalary.min;
    const experienceMultiplier = candidate.experience ? Math.min(parseInt(candidate.experience) / 5, 1.5) : 1;
    
    return {
      min: Math.round(baseSalary * experienceMultiplier * 0.9),
      max: Math.round(baseSalary * experienceMultiplier * 1.1)
    };
  }

  private static assessAvailability(candidate: any): string {
    const availabilityOptions = ['Immediately', '2 weeks notice', '1 month notice', 'Negotiable'];
    return availabilityOptions[Math.floor(Math.random() * availabilityOptions.length)];
  }

  private static generateTechnicalQuestions(title: string, department: string): string[] {
    const questions: { [key: string]: string[] } = {
      'Engineering': [
        'Explain your approach to debugging complex issues',
        'How do you ensure code quality and maintainability?',
        'Describe your experience with version control and CI/CD',
        'What programming languages and frameworks are you most comfortable with?'
      ],
      'Finance': [
        'How do you approach financial forecasting and budgeting?',
        'Describe your experience with financial reporting standards',
        'How do you ensure compliance with tax regulations?',
        'What financial analysis tools are you familiar with?'
      ],
      'Human Resources': [
        'How do you handle employee relations and conflict resolution?',
        'Describe your experience with recruitment and selection processes',
        'How do you ensure compliance with labor laws?',
        'What HRIS systems have you worked with?'
      ]
    };

    return questions[department] || [
      'What relevant experience do you have in this field?',
      'How do you approach problem-solving?',
      'What tools and technologies are you familiar with?'
    ];
  }

  private static generateBehavioralQuestions(experienceLevel: string): string[] {
    const questions = [
      'Tell me about a time you had to work under pressure',
      'Describe a situation where you had to learn something new quickly',
      'Give an example of how you handled a difficult team member',
      'Tell me about a project you\'re particularly proud of'
    ];

    if (experienceLevel === 'senior' || experienceLevel === 'executive') {
      questions.push('Describe a time you had to make a difficult decision');
      questions.push('Tell me about a time you led a team through a challenging project');
    }

    return questions;
  }

  private static generateSituationalQuestions(title: string, department: string): string[] {
    return [
      'How would you handle a situation where a project deadline is at risk?',
      'What would you do if you disagreed with your manager\'s approach?',
      'How would you prioritize multiple competing tasks?',
      'Describe how you would onboard a new team member'
    ];
  }

  private static generateRoleSpecificQuestions(title: string, department: string): string[] {
    return [
      'What do you think are the key challenges in this role?',
      'How do you stay updated with industry trends?',
      'What would you bring to this position that others might not?',
      'Where do you see yourself in 5 years?'
    ];
  }

  private static generateCulturalQuestions(department: string): string[] {
    return [
      'What type of work environment do you thrive in?',
      'How do you prefer to receive feedback?',
      'What motivates you to do your best work?',
      'How do you handle work-life balance?'
    ];
  }

  private static generateSalaryRecommendations(min: number, max: number, median: number): string[] {
    return [
      `Market range: GHS ${min.toLocaleString()} - GHS ${max.toLocaleString()}`,
      `Median salary: GHS ${median.toLocaleString()}`,
      'Consider performance-based bonuses',
      'Include comprehensive benefits package',
      'Review annually based on market conditions'
    ];
  }

  private static getDepartmentFocus(department: string): string {
    const focuses: { [key: string]: string } = {
      'Engineering': 'innovation and technical excellence',
      'Human Resources': 'people development and organizational growth',
      'Finance': 'financial management and strategic planning',
      'Marketing': 'brand building and customer engagement',
      'Sales': 'revenue generation and client relationships',
      'Operations': 'process optimization and efficiency'
    };

    return focuses[department] || 'excellence and continuous improvement';
  }

  // New methods for enhanced Ghana-specific analysis
  private static generateGhanaMarketInsights(title: string, location: string): string[] {
    const insights = [
      `High demand for ${title} roles in Ghana's growing economy`,
      'Mobile-first approach essential for Ghanaian market penetration',
      'Cultural sensitivity and local language skills are competitive advantages',
      'Growing fintech and e-commerce sectors creating new opportunities',
      'Government digitalization initiatives driving tech job growth'
    ];

    if (location === 'Accra') {
      insights.push('Accra offers highest salary potential but highest cost of living');
      insights.push('Strong talent pool with international exposure');
    } else {
      insights.push(`${location} offers lower cost of living with competitive salaries`);
      insights.push('Growing regional business hub with expanding opportunities');
    }

    return insights;
  }

  private static generateGhanaCulturalConsiderations(location: string): string[] {
    return [
      'Understanding of Ghanaian business culture and hierarchy',
      'Respect for traditional values while embracing innovation',
      'Ability to work with diverse ethnic groups and languages',
      'Familiarity with local holidays and cultural events',
      'Understanding of family-oriented work culture',
      'Experience with community engagement and social responsibility'
    ];
  }

  private static calculateGhanaTimeToFill(title: string, location: string, experienceLevel: string): number {
    let baseDays = 25; // Faster than international average
    
    // Adjust based on role complexity
    if (title.toLowerCase().includes('senior') || title.toLowerCase().includes('manager')) {
      baseDays += 10;
    }
    if (title.toLowerCase().includes('director') || title.toLowerCase().includes('head')) {
      baseDays += 15;
    }
    
    // Adjust based on location
    if (location === 'Accra') {
      baseDays -= 5; // Larger talent pool
    } else {
      baseDays += 5; // Smaller talent pool
    }
    
    // Adjust based on experience level
    if (experienceLevel === 'entry') {
      baseDays -= 5;
    } else if (experienceLevel === 'executive') {
      baseDays += 10;
    }
    
    return Math.max(15, baseDays); // Minimum 15 days
  }

  private static assessGhanaMarketDemand(title: string, location: string): 'low' | 'medium' | 'high' {
    const highDemandRoles = [
      'Software Engineer', 'Data Scientist', 'Digital Marketing', 'Finance',
      'Fintech', 'E-commerce', 'Mobile Development', 'Cybersecurity',
      'Project Manager', 'Business Analyst', 'Sales Manager'
    ];
    
    const isHighDemand = highDemandRoles.some(role => 
      title.toLowerCase().includes(role.toLowerCase())
    );
    
    if (isHighDemand) return 'high';
    
    // Location-based demand
    if (location === 'Accra') return 'medium';
    return 'low';
  }

  private static calculateGhanaSalary(title: string, experienceLevel: string, location: string): number {
    // Enhanced salary calculation for Ghana market
    const baseSalaries: { [key: string]: number } = {
      'Software Engineer': 3500,
      'Senior Software Engineer': 5500,
      'Data Scientist': 4500,
      'Product Manager': 5000,
      'Marketing Manager': 4000,
      'HR Manager': 3500,
      'Finance Manager': 4500,
      'Sales Manager': 4200,
      'Operations Manager': 3800,
      'Business Analyst': 3200,
      'Project Manager': 4000,
      'UX Designer': 3500,
      'DevOps Engineer': 4800,
      'System Administrator': 3200,
      'Accountant': 2800,
      'Customer Success Manager': 3500,
      'Content Manager': 2500,
      'Digital Marketing Specialist': 2200,
      'Recruiter': 2000,
      'Executive Assistant': 1800
    };

    let baseSalary = 2500; // Default base salary in GHS
    
    // Find matching title
    for (const [key, value] of Object.entries(baseSalaries)) {
      if (title.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(title.toLowerCase())) {
        baseSalary = value;
        break;
      }
    }

    // Apply experience multiplier
    const experienceMultiplier = this.EXPERIENCE_MULTIPLIERS[experienceLevel as keyof typeof this.EXPERIENCE_MULTIPLIERS] || 1.0;
    
    // Apply location multiplier
    const locationMultiplier = this.GHANA_SALARY_MULTIPLIERS[location as keyof typeof this.GHANA_SALARY_MULTIPLIERS] || 0.8;

    return Math.round(baseSalary * experienceMultiplier * locationMultiplier);
  }
}
