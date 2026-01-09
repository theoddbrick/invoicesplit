import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Invoice Split
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Privacy & Data Handling
          </h1>

          <div className="prose dark:prose-invert max-w-none">
            {/* Quick Summary */}
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mt-0 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                We DO NOT Save Your Files
              </h2>
              <p className="text-green-800 dark:text-green-200 text-lg mb-0">
                Your invoice files are processed in real-time and <strong>immediately discarded</strong>. 
                We have zero file storage, zero database, and zero data retention.
              </p>
            </div>

            {/* Detailed Explanation */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
              What Happens to Your Files
            </h2>

            <div className="space-y-4 mb-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Upload</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    File is sent to our server via secure HTTPS connection
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Processing (In-Memory Only)</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    File is read into temporary memory (RAM) - never written to disk
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Text Extraction</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    PDF content is converted to text in memory
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">AI Analysis</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Text (not the PDF) is sent to Alibaba Cloud Model Studio for processing
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                  5
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Results Returned</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Extracted data sent back to your browser as JSON
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 font-bold">
                  6
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Automatic Cleanup</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    All data is immediately discarded from memory - permanently gone
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
              Technical Details
            </h2>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Serverless Architecture</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                This application runs on Vercel&apos;s serverless infrastructure. Each request creates a temporary, 
                isolated container that processes your file and is destroyed immediately after responding.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>No persistent file system</li>
                <li>No database connections</li>
                <li>No long-term storage</li>
                <li>Each request is completely isolated</li>
                <li>Memory automatically freed after processing</li>
              </ul>
            </div>

            {/* What IS and ISN'T Stored */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
              What Data Exists Where
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                  NOT Stored
                </h3>
                <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
                  <li>❌ Your PDF files</li>
                  <li>❌ Extracted text</li>
                  <li>❌ Processing results</li>
                  <li>❌ File metadata</li>
                  <li>❌ User information</li>
                  <li>❌ Cookies or tracking</li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  What IS Logged
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li>✓ Standard HTTP access logs (no content)</li>
                  <li>✓ Error logs (for debugging)</li>
                  <li>✓ Performance metrics</li>
                  <li className="text-xs italic">All logs are standard Vercel infrastructure logs</li>
                </ul>
              </div>
            </div>

            {/* Verification */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
              How to Verify
            </h2>

            <div className="space-y-4 mb-8">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Browser DevTools</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>Open DevTools (F12)</li>
                  <li>Check Application tab → Storage sections</li>
                  <li>Result: All empty ✅</li>
                </ol>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Code Audit</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Our application code contains zero file write operations, zero database connections, 
                  and zero storage calls. All processing is done in ephemeral serverless functions that 
                  automatically destroy all data upon completion.
                </p>
              </div>
            </div>

            {/* Third Party Services */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
              Third-Party Services
            </h2>

            <div className="space-y-4">
              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Alibaba Cloud Model Studio</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  <strong>What&apos;s sent:</strong> Extracted text content only (NOT the PDF file)<br/>
                  <strong>Purpose:</strong> AI processing to extract invoice fields<br/>
                  <strong>Your control:</strong> You provide your own API key
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Vercel Hosting</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  <strong>Architecture:</strong> Serverless (stateless, ephemeral)<br/>
                  <strong>Duration:</strong> Functions run for &lt;60 seconds then terminate<br/>
                  <strong>Storage:</strong> Zero persistent storage
                </p>
              </div>
            </div>

            {/* Compliance */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
              Compliance
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">GDPR Compliant</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">No personal data stored</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Zero Retention</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Stateless serverless architecture</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Client-Side Control</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">You control the results</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Open Source</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Fully auditable code</p>
                </div>
              </div>
            </div>

            {/* Guarantee */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6 mt-8">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                Our Privacy Guarantee
              </h3>
              <p className="text-sm text-indigo-800 dark:text-indigo-200">
                We guarantee that your invoice files are processed exclusively in temporary memory and 
                are permanently deleted within seconds of processing. This is enforced by our serverless 
                architecture which physically cannot retain data between requests.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Invoice Split
          </Link>
        </div>
      </div>
    </main>
  );
}
