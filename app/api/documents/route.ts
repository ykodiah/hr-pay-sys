import { NextRequest, NextResponse } from "next/server"

// Mock document storage - in production, this would connect to your database
let documents: any[] = []

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const document = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      uploadDate: new Date().toISOString(),
      isArchived: false,
      tags: data.tags || [],
    }
    
    documents.push(document)
    
    return NextResponse.json({ 
      success: true, 
      document,
      message: "Document saved to vault successfully" 
    })
  } catch (error) {
    console.error("Error saving document:", error)
    return NextResponse.json(
      { error: "Failed to save document" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const search = searchParams.get("search")
    
    let filteredDocuments = documents
    
    if (employeeId) {
      filteredDocuments = documents.filter(doc => doc.employeeId === employeeId)
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.fileName.toLowerCase().includes(searchLower) ||
        doc.employeeName?.toLowerCase().includes(searchLower) ||
        doc.documentType.toLowerCase().includes(searchLower) ||
        doc.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      documents: filteredDocuments,
      total: filteredDocuments.length
    })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}