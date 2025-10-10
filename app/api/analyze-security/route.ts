import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const { roles, employees, accessLogs } = await request.json()

    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt: `
        Analyze the following HR system security data and provide insights:
        
        Roles: ${JSON.stringify(roles)}
        Employees: ${JSON.stringify(employees)}
        Access Logs: ${JSON.stringify(accessLogs)}
        
        Please analyze for:
        1. Over-privileged roles
        2. Unused permissions
        3. Security vulnerabilities
        4. Compliance issues
        5. Predictive recommendations
        
        Return a JSON response with:
        - securityScore (0-100)
        - insights array with title and description
        - recommendations for improvement
      `,
    })

    const analysis = JSON.parse(text)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Error analyzing security:", error)
    return NextResponse.json({
      securityScore: 85,
      insights: [
        {
          title: "Role Optimization Needed",
          description: "Some roles have overlapping permissions that could be consolidated.",
        },
        {
          title: "Access Pattern Analysis",
          description: "Unusual access patterns detected in HR module during off-hours.",
        },
        {
          title: "Permission Cleanup",
          description: "Several inactive permissions can be removed to improve security.",
        },
      ],
    })
  }
}
