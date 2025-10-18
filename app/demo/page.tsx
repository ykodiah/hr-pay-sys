import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Users, Calculator, FileText, BarChart3, Star, Download } from "lucide-react"
import Link from "next/link"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AkwaabaHRPay</span>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/#features" className="text-gray-600 hover:text-emerald-600 transition-colors">
                Features
              </Link>
              <Link href="/#pricing" className="text-gray-600 hover:text-emerald-600 transition-colors">
                Pricing
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-emerald-600 transition-colors">
                About
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600">
                  Sign In
                </Button>
              </Link>
              <Link href="/setup">
                <Button className="bg-emerald-600 hover:bg-emerald-700">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Play className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">Product Demo</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              See AkwaabaHRPay in action. Watch our comprehensive demo showcasing all key features for Ghana's HR and
              payroll management.
            </p>
          </div>

          {/* Main Demo Video */}
          <div className="max-w-4xl mx-auto mb-16">
            <Card className="overflow-hidden">
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-10 h-10 text-white ml-1" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">Complete Product Demo</h3>
                  <p className="text-gray-300 mb-4">1-minute overview of all key features</p>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      // Simulate video play functionality
                      alert("Demo video would start playing here. This is a placeholder for the actual video player.");
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Demo
                  </Button>
                </div>
                <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded">1:00</div>
              </div>
            </Card>
          </div>

          {/* Demo Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Employee Management</h3>
                <p className="text-sm text-gray-600">Complete employee lifecycle management</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calculator className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Ghana Payroll</h3>
                <p className="text-sm text-gray-600">PAYE, SSNIT, and compliance automation</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Self-Service Portal</h3>
                <p className="text-sm text-gray-600">Employee access to payslips and leave</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                <p className="text-sm text-gray-600">Insights and workforce analytics</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Demos */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Feature Demonstrations</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Detailed walkthroughs of specific features and workflows
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="overflow-hidden">
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                <Play className="w-12 h-12 text-white" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">2:15</div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Dashboard Overview</h3>
                <p className="text-sm text-gray-600 mb-3">Navigate the main dashboard and understand key metrics.</p>
                <div className="flex items-center space-x-2 mb-3">
                  <Badge className="bg-emerald-100 text-emerald-800 text-xs">Getting Started</Badge>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Star className="w-3 h-3" />
                    <span>4.9</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    alert("Dashboard Overview demo would start playing here.");
                  }}
                >
                  Watch Demo
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                <Play className="w-12 h-12 text-white" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">3:30</div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Adding Employees</h3>
                <p className="text-sm text-gray-600 mb-3">Step-by-step employee onboarding and profile setup.</p>
                <div className="flex items-center space-x-2 mb-3">
                  <Badge className="bg-blue-100 text-blue-800 text-xs">HR Management</Badge>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Star className="w-3 h-3" />
                    <span>4.8</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    alert("Adding Employees demo would start playing here.");
                  }}
                >
                  Watch Demo
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                <Play className="w-12 h-12 text-white" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">4:45</div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Payroll Processing</h3>
                <p className="text-sm text-gray-600 mb-3">Complete payroll run with Ghana tax calculations.</p>
                <div className="flex items-center space-x-2 mb-3">
                  <Badge className="bg-purple-100 text-purple-800 text-xs">Payroll</Badge>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Star className="w-3 h-3" />
                    <span>4.9</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    alert("Payroll Processing demo would start playing here.");
                  }}
                >
                  Watch Demo
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                <Play className="w-12 h-12 text-white" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">2:20</div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Leave Management</h3>
                <p className="text-sm text-gray-600 mb-3">Configure leave policies and manage employee requests.</p>
                <div className="flex items-center space-x-2 mb-3">
                  <Badge className="bg-blue-100 text-blue-800 text-xs">HR Management</Badge>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Star className="w-3 h-3" />
                    <span>4.7</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    alert("Leave Management demo would start playing here.");
                  }}
                >
                  Watch Demo
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                <Play className="w-12 h-12 text-white" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">3:10</div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Generating Reports</h3>
                <p className="text-sm text-gray-600 mb-3">Create compliance reports for GRA and SSNIT submissions.</p>
                <div className="flex items-center space-x-2 mb-3">
                  <Badge className="bg-orange-100 text-orange-800 text-xs">Reports</Badge>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Star className="w-3 h-3" />
                    <span>4.8</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    alert("Generating Reports demo would start playing here.");
                  }}
                >
                  Watch Demo
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                <Play className="w-12 h-12 text-white" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">2:55</div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Mobile App Tour</h3>
                <p className="text-sm text-gray-600 mb-3">Employee self-service features on mobile devices.</p>
                <div className="flex items-center space-x-2 mb-3">
                  <Badge className="bg-green-100 text-green-800 text-xs">Mobile</Badge>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Star className="w-3 h-3" />
                    <span>4.6</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    alert("Mobile App Tour demo would start playing here.");
                  }}
                >
                  Watch Demo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="py-20 bg-emerald-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Play className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Try Interactive Demo</h2>
          <p className="text-xl text-gray-600 mb-8">
            Experience AkwaabaHRPay firsthand with our interactive demo environment loaded with sample data
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/launch">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Launch Interactive Demo</Button>
            </Link>
            <Button 
              variant="outline" 
              className="bg-transparent"
              onClick={() => {
                // Create a demo guide download
                const link = document.createElement('a');
                link.href = '#';
                link.download = 'AkwaabaHRPay_Demo_Guide.pdf';
                link.click();
                alert('Demo guide download started! (This is a placeholder for the actual PDF)');
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Demo Guide
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="text-xl font-bold">AkwaabaHRPay</span>
              </div>
              <p className="text-gray-400">Ghana's leading HR & Payroll SaaS platform, built for local businesses.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/#features" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/#pricing" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="hover:text-white transition-colors">
                    Demo
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/training" className="hover:text-white transition-colors">
                    Training
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 AkwaabaHRPay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
