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
                  SKMMMS Election 2026
                </h1>
                <p className="text-xs text-gray-600 mt-0.5 font-bold">Election Commission : Shree Panvel Kutchi Maheshwari Mahajan</p>
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
            <h2 className="text-2xl sm:text-3xl text-gray-900">
              Terms and Conditions
            </h2>
          </div>

          <div className="prose prose-sm sm:prose-base max-w-none space-y-6 text-gray-700">
            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Election Participation</h3>
              <p className="mb-3">
                By participating in the SKMMMS Election 2026, you agree to abide by all terms and conditions set forth by the election committee. All voters must be registered members of the community and meet the eligibility criteria as specified for each election category.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Voting Eligibility</h3>
              <p className="mb-3">
                Voters must meet the age and membership requirements for each specific election:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li><strong>Yuva Pankh Samiti:</strong> Voters who are 39 years old or younger as of August 31, 2025</li>
                <li><strong>Trust Mandal:</strong> Voters aged 18 years and above, with trustees requiring age 45+ as of August 31, 2025</li>
                <li><strong>Karobari Samiti:</strong> As per specified eligibility criteria</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Voting Process</h3>
              <p className="mb-3">
                All votes must be cast through the official online voting platform. Each eligible voter may cast only one vote per election category. Votes are final once submitted and cannot be changed or withdrawn.
              </p>
              <p className="mb-3">
                The voting process includes:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Login using your registered phone number and OTP verification</li>
                <li>Review candidate information and manifestos before voting</li>
                <li>Select your preferred candidate(s) based on your zone allocation</li>
                <li>Option to select NOTA (None of the Above) if you do not wish to vote for any candidate</li>
                <li>Confirm your selections before final submission</li>
                <li>Receive confirmation of your vote submission</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1. Zone-Based Voting</h3>
              <p className="mb-3">
                Voters are assigned to specific zones based on their region and eligibility criteria. You can only vote for candidates in your assigned zone(s). Zone assignments are determined by:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Your registered voting region</li>
                <li>Age requirements for each election category</li>
                <li>Election committee's zone allocation rules</li>
              </ul>
              <p className="mb-3">
                Zone assignments are final and cannot be changed after the election period begins. If you believe your zone assignment is incorrect, you must contact the election committee before the voting period starts.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2. NOTA Option</h3>
              <p className="mb-3">
                The NOTA (None of the Above) option is available in all elections. Selecting NOTA indicates that you do not wish to vote for any of the available candidates. NOTA votes are counted as valid votes and contribute to the overall voter turnout statistics.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Security and Privacy</h3>
              <p className="mb-3">
                The voting system employs secure authentication methods including OTP verification. All voting data is encrypted and stored securely. Individual votes remain confidential and anonymous.
              </p>
              <p className="mb-3">
                Security measures include:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Multi-factor authentication using phone number and OTP</li>
                <li>Encrypted data transmission (HTTPS/SSL)</li>
                <li>Secure database storage with access controls</li>
                <li>IP address logging for security audit purposes</li>
                <li>Session timeout after inactivity</li>
                <li>Protection against common web vulnerabilities</li>
              </ul>
              <p className="mb-3">
                Your personal information is protected in accordance with our Privacy Policy. We do not share individual voting choices with any third parties.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1. Account Security</h3>
              <p className="mb-3">
                You are responsible for maintaining the security of your account:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Do not share your OTP codes with anyone</li>
                <li>Do not allow others to vote using your account</li>
                <li>Log out after completing your vote</li>
                <li>Report any suspicious activity immediately to the election committee</li>
                <li>Keep your registered phone number secure</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Candidate Registration and Nomination</h3>
              <p className="mb-3">
                Candidates must register through the official nomination process:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Submit nomination forms within the specified deadline</li>
                <li>Provide accurate personal and professional information</li>
                <li>Upload required documents (photo, Aadhaar, etc.)</li>
                <li>Obtain required proposer/seconder signatures</li>
                <li>Comply with eligibility criteria for the specific election category</li>
                <li>Await approval from the election committee</li>
              </ul>
              <p className="mb-3">
                False information or fraudulent documents will result in immediate disqualification and may lead to legal action. Candidates are responsible for ensuring all submitted information is accurate and up-to-date.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6. Prohibited Activities</h3>
              <p className="mb-3">
                The following activities are strictly prohibited:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Attempting to vote multiple times or using multiple accounts</li>
                <li>Sharing OTP codes with unauthorized persons</li>
                <li>Attempting to manipulate or interfere with the voting system</li>
                <li>Taking screenshots or recording the voting process</li>
                <li>Any form of vote buying, coercion, or electoral malpractice</li>
                <li>Creating fake accounts or impersonating other voters</li>
                <li>Attempting to hack, breach, or compromise system security</li>
                <li>Spreading false information about candidates or the election process</li>
                <li>Using automated tools or scripts to interact with the platform</li>
              </ul>
              <p className="mb-3">
                Violations may result in immediate disqualification, vote invalidation, and legal action as per applicable laws.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">7. Election Timeline and Deadlines</h3>
              <p className="mb-3">
                Important dates and deadlines will be communicated through official channels:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Nomination period start and end dates</li>
                <li>Candidate withdrawal deadlines</li>
                <li>Voting period start and end dates</li>
                <li>Result announcement dates</li>
              </ul>
              <p className="mb-3">
                Late submissions or votes cast outside the designated periods will not be accepted. The election committee reserves the right to extend or modify deadlines with prior notice.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">8. Election Results</h3>
              <p className="mb-3">
                Election results will be announced by the election committee after the voting period concludes. All results are final and binding. The election committee reserves the right to verify and audit votes if necessary.
              </p>
              <p className="mb-3">
                Results will include:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Total votes cast per candidate</li>
                <li>Voter turnout statistics by zone</li>
                <li>NOTA vote counts</li>
                <li>Winning candidates for each seat</li>
                <li>Overall election statistics</li>
              </ul>
              <p className="mb-3">
                Results are published on the official platform and may be announced through other official channels. Individual vote choices remain confidential and are never disclosed.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">9. Dispute Resolution</h3>
              <p className="mb-3">
                Any disputes or concerns regarding the election process should be submitted in writing to the election committee at kmselec2026@gmail.com within 48 hours of the result announcement. The election committee's decision on all matters is final.
              </p>
              <p className="mb-3">
                Dispute resolution process:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Submit written complaint with supporting evidence</li>
                <li>Election committee will review within 7 days</li>
                <li>May request additional information or clarification</li>
                <li>Decision will be communicated in writing</li>
                <li>All decisions are final and binding</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">10. System Availability</h3>
              <p className="mb-3">
                While every effort is made to ensure the voting system is available 24/7 during the election period, the election committee is not liable for any technical issues, system downtime, or connectivity problems that may affect voting.
              </p>
              <p className="mb-3">
                In case of technical difficulties:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Contact technical support immediately</li>
                <li>Document the issue with screenshots if possible</li>
                <li>The election committee may extend voting hours if significant technical issues occur</li>
                <li>Alternative voting arrangements may be made if necessary</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">11. Liability and Indemnification</h3>
              <p className="mb-3">
                By using this platform, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Use the platform at your own risk</li>
                <li>Indemnify the election committee against any claims arising from your use of the platform</li>
                <li>Accept that the election committee is not liable for any indirect, incidental, or consequential damages</li>
                <li>Understand that technical issues may occur despite best efforts</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">12. Amendments</h3>
              <p className="mb-3">
                The election committee reserves the right to modify these terms and conditions at any time. All participants will be notified of any significant changes through official channels.
              </p>
              <p className="mb-3">
                Continued use of the platform after changes constitutes acceptance of the updated terms. It is your responsibility to review these terms periodically.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">13. Governing Law</h3>
              <p className="mb-3">
                These terms and conditions are governed by the laws of India. Any legal disputes will be subject to the exclusive jurisdiction of courts in Maharashtra, India.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">14. Contact Information</h3>
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
            <p className="text-xs text-gray-500 mb-2">
              Election 2026: Shree Panvel Kutchi Maheshwari Mahajan
            </p>
            <p>
              &copy; 2025-26 SKMMMS Election 2026. All rights reserved.
            </p>
            <p className="mt-2">
              Designed and Developed with ❤️ in 🇮🇳 by
            </p>
            <p className="mt-1 flex items-center justify-center gap-2 flex-wrap">
              <Link 
                href="https://www.teamfullstack.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline transition-colors font-semibold"
              >
                Parth Chetna Piyush Gagdani, (Thane)
              </Link>
              <span className="text-gray-600">|</span>
              <Link 
                href="https://www.teamfullstack.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                પાર્થ ચેતના પિયુષ ગગડાની, (થાણા)
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

