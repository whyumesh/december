'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText } from 'lucide-react'
import Logo from '@/components/Logo'

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Logo size="sm" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                  KMS ELECTION 2026
                </h1>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Terms and Conditions
            </h2>
          </div>

          <div className="prose prose-sm sm:prose-base max-w-none space-y-6 text-gray-700">
            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Election Participation</h3>
              <p className="mb-3">
                By participating in the KMS Election 2026, you agree to abide by all terms and conditions set forth by the election committee. All voters must be registered members of the community and meet the eligibility criteria as specified for each election category.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Voting Eligibility</h3>
              <p className="mb-3">
                Voters must meet the age and membership requirements for each specific election:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li><strong>Yuva Pankh Samiti:</strong> Voters aged 18-40 years as of the election date</li>
                <li><strong>Trust Mandal:</strong> Voters aged 18 years and above, with trustees requiring age 45+ as of August 31, 2025</li>
                <li><strong>Karobari Samiti:</strong> As per specified eligibility criteria</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Voting Process</h3>
              <p className="mb-3">
                All votes must be cast through the official online voting platform. Each eligible voter may cast only one vote per election category. Votes are final once submitted and cannot be changed or withdrawn.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Security and Privacy</h3>
              <p className="mb-3">
                The voting system employs secure authentication methods including OTP verification. All voting data is encrypted and stored securely. Individual votes remain confidential and anonymous.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Prohibited Activities</h3>
              <p className="mb-3">
                The following activities are strictly prohibited:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Attempting to vote multiple times or using multiple accounts</li>
                <li>Sharing OTP codes with unauthorized persons</li>
                <li>Attempting to manipulate or interfere with the voting system</li>
                <li>Taking screenshots or recording the voting process</li>
                <li>Any form of vote buying, coercion, or electoral malpractice</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6. Election Results</h3>
              <p className="mb-3">
                Election results will be announced by the election committee after the voting period concludes. All results are final and binding. The election committee reserves the right to verify and audit votes if necessary.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">7. Dispute Resolution</h3>
              <p className="mb-3">
                Any disputes or concerns regarding the election process should be submitted in writing to the election committee at kmselec2026@gmail.com within 48 hours of the result announcement. The election committee's decision on all matters is final.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">8. System Availability</h3>
              <p className="mb-3">
                While every effort is made to ensure the voting system is available 24/7 during the election period, the election committee is not liable for any technical issues, system downtime, or connectivity problems that may affect voting.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">9. Amendments</h3>
              <p className="mb-3">
                The election committee reserves the right to modify these terms and conditions at any time. All participants will be notified of any significant changes through official channels.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">10. Contact Information</h3>
              <p className="mb-3">
                For any queries or concerns regarding these terms and conditions, please contact:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="mb-2"><strong>Election Committee</strong></p>
                <p className="mb-1">Email: kmselec2026@gmail.com</p>
                <p className="mb-1">Phone: +91 93215 78416</p>
                <p>+91 98194 74238</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 sm:py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-400">
            <p>
              <p className="text-xs text-gray-500 mb-2">
                Election 2026: Shree Panvel Kutchi Maheshwari Mahajan
              </p>
              <p>&copy; 2025 KMS Election 2026. All rights reserved.</p>
            </p>
            <p className="mt-2">
              Designed & Developed by{" "}
              <span className="text-blue-400 font-semibold">
                Parth Gagdani
              </span>
              , Team FullStack (Thane)
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

