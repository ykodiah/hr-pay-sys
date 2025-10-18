export default function TestPreview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">✅ Right Panel Preview Test</h1>
          <p className="text-base sm:text-lg text-gray-600 mb-6">
            If you can see this page, the right panel preview is working correctly!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-emerald-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-emerald-800 mb-3">✅ Next.js Configuration</h2>
              <ul className="text-emerald-700 space-y-2">
                <li>• App Router structure</li>
                <li>• TypeScript support</li>
                <li>• Tailwind CSS styling</li>
                <li>• No Expo dependencies</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-800 mb-3">✅ Project Status</h2>
              <ul className="text-blue-700 space-y-2">
                <li>• Mobile directory removed</li>
                <li>• React Native configs removed</li>
                <li>• Pure Next.js web app</li>
                <li>• Ready for preview</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Test URL:</strong> /test-preview
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Project Type:</strong> Next.js 15.2.4 Web Application
            </p>
          </div>

          {/* Mobile Responsiveness Test */}
          <div className="mt-6 sm:mt-8 p-4 bg-green-50 rounded-lg">
            <h2 className="text-lg sm:text-xl font-semibold text-green-800 mb-3">📱 Mobile Responsiveness Test</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <div className="font-medium text-green-700">Desktop</div>
                <div className="text-gray-600">≥ 1024px</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="font-medium text-green-700">Tablet</div>
                <div className="text-gray-600">768px - 1023px</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="font-medium text-green-700">Mobile</div>
                <div className="text-gray-600">≤ 767px</div>
              </div>
            </div>
            <p className="text-sm text-green-700 mt-3">
              ✅ Viewport meta tag configured for proper mobile rendering
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
