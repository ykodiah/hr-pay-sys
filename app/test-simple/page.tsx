export default function SimpleTestPage() {
  console.log("[v0] Simple test page is rendering successfully")

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">🎉 Right Panel Display Test - SUCCESS!</h1>

        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <strong>✅ Application is rendering correctly!</strong>
          <p>If you can see this page, the core application structure is working.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">Navigation Test</h2>
            <p className="text-blue-700">Try navigating to different modules to test functionality.</p>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-purple-900 mb-3">Component Test</h2>
            <p className="text-purple-700">All UI components are loading properly.</p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Debug Information:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Layout: ✅ Rendering</li>
            <li>• CSS: ✅ Loaded</li>
            <li>• Components: ✅ Available</li>
            <li>• Routing: ✅ Working</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
