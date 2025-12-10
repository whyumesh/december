'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield } from 'lucide-react'
import Logo from '@/components/Logo'

export default function PrivacyPolicyPage() {
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
            <Shield className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Privacy Policy
            </h2>
          </div>

          <div className="prose prose-sm sm:prose-base max-w-none space-y-6 text-gray-700">
            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h3>
              <p className="mb-3">
                SKMMMS Election 2026 ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our online voting platform.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h3>
              <p className="mb-3">We collect the following types of information:</p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li><strong>Personal Information:</strong> Name, date of birth, age, gender, email address, phone number, permanent address (mulgam), city, state, and voting region</li>
                <li><strong>Voter Identification:</strong> VID Number (Voter ID), family number, and zone assignments</li>
                <li><strong>Voting Information:</strong> Your vote selections, voting timestamp, IP address, device information, and user agent</li>
                <li><strong>Authentication Data:</strong> OTP codes, session tokens, and login timestamps for secure access</li>
                <li><strong>Technical Data:</strong> Device information, browser type, operating system, screen resolution, and approximate location data (for security and fraud prevention)</li>
                <li><strong>Candidate Information:</strong> For candidates, we collect additional information including photos, Aadhaar documents, proposer details, manifestos, and professional background</li>
                <li><strong>Document Data:</strong> Uploaded documents including photos, Aadhaar cards, and other supporting documents (stored securely in encrypted format)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h3>
              <p className="mb-3">We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>To verify your identity and eligibility to vote</li>
                <li>To assign you to appropriate voting zones based on your region and age</li>
                <li>To process and record your vote securely</li>
                <li>To prevent fraud, duplicate voting, and ensure election integrity</li>
                <li>To communicate important election-related information via SMS and email</li>
                <li>To send OTP codes for authentication</li>
                <li>To generate anonymous statistical reports and voter turnout data</li>
                <li>To display candidate information and profiles to voters</li>
                <li>To manage candidate nominations and approvals</li>
                <li>To conduct security audits and investigations</li>
                <li>To comply with legal and regulatory requirements</li>
                <li>To maintain election records for historical and audit purposes</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Vote Confidentiality</h3>
              <p className="mb-3">
                Your individual vote is strictly confidential and anonymous. While we record that you have voted, your specific vote selections are encrypted and cannot be traced back to you personally. Only aggregate voting statistics are made available.
              </p>
              <p className="mb-3">
                Vote confidentiality measures:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Vote selections are stored separately from voter identity information</li>
                <li>Encryption ensures votes cannot be read without proper authorization</li>
                <li>Access to individual vote data is restricted to authorized election administrators only</li>
                <li>Individual votes are never disclosed to candidates or third parties</li>
                <li>Only aggregate statistics (totals, percentages) are published</li>
                <li>Audit logs track access but do not reveal vote contents</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h3>
              <p className="mb-3">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>End-to-end encryption for all voting data and personal information</li>
                <li>Secure authentication using OTP verification and session management</li>
                <li>HTTPS/SSL encryption for all data transmission</li>
                <li>Regular security audits, vulnerability assessments, and penetration testing</li>
                <li>Role-based access controls with least privilege principles</li>
                <li>Continuous monitoring and intrusion detection systems</li>
                <li>Secure data storage with encrypted databases</li>
                <li>Regular automated backups with encryption</li>
                <li>Secure document storage for candidate files</li>
                <li>IP address logging for security audit trails</li>
                <li>Session timeout and automatic logout features</li>
                <li>Protection against SQL injection, XSS, and other common vulnerabilities</li>
              </ul>
              <p className="mb-3">
                Despite these measures, no system is 100% secure. We continuously work to improve security but cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1. Data Breach Procedures</h3>
              <p className="mb-3">
                In the unlikely event of a data breach:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>We will immediately investigate and contain the breach</li>
                <li>Affected users will be notified within 72 hours</li>
                <li>Relevant authorities will be informed as required by law</li>
                <li>Remedial actions will be taken to prevent future breaches</li>
                <li>Security measures will be reviewed and strengthened</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6. Data Sharing and Disclosure</h3>
              <p className="mb-3">
                We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>With authorized election committee members for election administration and verification</li>
                <li>When required by law, court order, or legal process</li>
                <li>To protect the rights, property, or safety of the election process, users, or the public</li>
                <li>With service providers who assist in operating the platform (under strict confidentiality agreements):
                  <ul className="list-circle pl-6 mt-2 space-y-1">
                    <li>SMS service providers (for OTP delivery)</li>
                    <li>Cloud hosting and storage providers</li>
                    <li>Email service providers</li>
                    <li>Security and monitoring services</li>
                  </ul>
                </li>
                <li>With law enforcement agencies when legally required</li>
                <li>In case of merger, acquisition, or sale of assets (with prior notice)</li>
              </ul>
              <p className="mb-3">
                All third-party service providers are contractually obligated to maintain confidentiality and use data only for specified purposes.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h3>
              <p className="mb-3">
                We retain your personal information and voting records for as long as necessary to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Complete the election process and announce results</li>
                <li>Maintain election records as required by law (typically 7 years or as per legal requirements)</li>
                <li>Address any disputes, complaints, or audits</li>
                <li>Comply with legal and regulatory obligations</li>
                <li>Maintain historical records for future reference</li>
                <li>Conduct post-election analysis and reporting</li>
              </ul>
              <p className="mb-3">
                Retention periods:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li><strong>Voting Records:</strong> Retained for 7 years or as required by law</li>
                <li><strong>Personal Information:</strong> Retained until account deletion or as required by law</li>
                <li><strong>Candidate Documents:</strong> Retained for the duration of the election cycle and audit period</li>
                <li><strong>Audit Logs:</strong> Retained for security and compliance purposes</li>
              </ul>
              <p className="mb-3">
                After the retention period, data will be securely deleted or anonymized. Anonymized data may be retained for statistical and research purposes.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights</h3>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements and election record retention)</li>
                <li><strong>Portability:</strong> Request your data in a portable format</li>
                <li><strong>Objection:</strong> Object to certain types of data processing</li>
                <li><strong>Withdrawal:</strong> Withdraw consent for data processing (where applicable, may affect your ability to vote)</li>
                <li><strong>Complaints:</strong> Lodge complaints with the election committee or relevant data protection authority</li>
              </ul>
              <p className="mb-3">
                To exercise these rights, contact us at kmselec2026@gmail.com with your request and verification details.
              </p>
              <p className="mb-3">
                <strong>Important Notes:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Once a vote is cast, it cannot be deleted as it is part of the official election record</li>
                <li>Some data must be retained for legal compliance and election integrity</li>
                <li>Deletion requests may take up to 30 days to process</li>
                <li>We may require identity verification before processing requests</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">9. Cookies and Tracking</h3>
              <p className="mb-3">
                We use essential cookies and session tokens to maintain your login session and ensure security. We do not use tracking cookies for advertising or analytics purposes.
              </p>
              <p className="mb-3">
                Types of cookies we use:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li><strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser, used for authentication</li>
                <li><strong>Security Tokens:</strong> Used to verify your identity and prevent unauthorized access</li>
                <li><strong>Preference Cookies:</strong> Store your language preferences and display settings</li>
              </ul>
              <p className="mb-3">
                We do NOT use:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Advertising or marketing cookies</li>
                <li>Third-party tracking cookies</li>
                <li>Analytics cookies from external services</li>
                <li>Social media tracking pixels</li>
              </ul>
              <p className="mb-3">
                You can control cookies through your browser settings, but disabling essential cookies may affect platform functionality.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">10. Third-Party Services</h3>
              <p className="mb-3">
                Our platform may use third-party services for:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li><strong>SMS Services:</strong> OTP delivery via SMS providers (e.g., Twilio) - only phone numbers are shared</li>
                <li><strong>Cloud Hosting:</strong> Secure cloud infrastructure for hosting the platform and storing data</li>
                <li><strong>Storage Services:</strong> Encrypted cloud storage for documents and files</li>
                <li><strong>Email Services:</strong> For sending election-related communications</li>
                <li><strong>Security Services:</strong> For monitoring, threat detection, and security analysis</li>
              </ul>
              <p className="mb-3">
                These services are bound by their own privacy policies and strict confidentiality agreements. We only share the minimum necessary information required for service delivery.
              </p>
              <p className="mb-3">
                Third-party service providers are:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Contractually obligated to protect your data</li>
                <li>Prohibited from using your data for their own purposes</li>
                <li>Required to comply with data protection standards</li>
                <li>Subject to regular security audits</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">11. Voter Verification Process</h3>
              <p className="mb-3">
                To ensure election integrity, we verify voter identity through:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Phone number verification via OTP</li>
                <li>Matching voter information with registered database</li>
                <li>Checking eligibility criteria (age, region, membership)</li>
                <li>Zone assignment verification</li>
                <li>Preventing duplicate voting through voter ID tracking</li>
              </ul>
              <p className="mb-3">
                Verification data is used solely for authentication and eligibility checking, not for tracking voting choices.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">12. IP Address and Location Data</h3>
              <p className="mb-3">
                We collect IP addresses and approximate location data for:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Security and fraud prevention</li>
                <li>Detecting suspicious voting patterns</li>
                <li>Preventing unauthorized access</li>
                <li>Audit trail maintenance</li>
                <li>Compliance with legal requirements</li>
              </ul>
              <p className="mb-3">
                IP addresses are logged but not used to identify individual voters or their voting choices. Location data is approximate (city/region level) and not precise GPS coordinates.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">13. Children's Privacy</h3>
              <p className="mb-3">
                Our voting platform is intended for eligible voters only (18 years and above). We do not knowingly collect information from individuals under 18 years of age.
              </p>
              <p className="mb-3">
                If we discover that we have collected information from someone under 18, we will immediately delete such information and take steps to prevent future collection.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">14. Photo and Document Storage</h3>
              <p className="mb-3">
                For candidates, we store uploaded documents including:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Candidate photos (displayed publicly on the platform)</li>
                <li>Aadhaar card copies (stored securely, not publicly displayed)</li>
                <li>Proposer documents (stored securely)</li>
                <li>Other supporting documents</li>
              </ul>
              <p className="mb-3">
                Documents are stored in encrypted format and accessed only by authorized election administrators. Candidate photos are displayed to voters as part of the voting process. Other documents remain confidential.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">15. Changes to This Policy</h3>
              <p className="mb-3">
                We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date. Continued use of the platform after changes constitutes acceptance of the updated policy.
              </p>
              <p className="mb-3">
                Significant changes will be communicated through:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Email notifications to registered users</li>
                <li>SMS alerts for critical changes</li>
                <li>Prominent notices on the platform</li>
                <li>Updated revision date on this page</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">16. Contact Us</h3>
              <p className="mb-3">
                For questions, concerns, or requests regarding this Privacy Policy, please contact:
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
              <p>&copy; 2025-26 SKMMMS Election 2026. All rights reserved.</p>
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

