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
            <Shield className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Privacy Policy
            </h2>
          </div>

          <div className="prose prose-sm sm:prose-base max-w-none space-y-6 text-gray-700">
            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h3>
              <p className="mb-3">
                KMS Election 2026 ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our online voting platform.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h3>
              <p className="mb-3">We collect the following types of information:</p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li><strong>Personal Information:</strong> Name, date of birth, age, gender, email address, phone number, and address</li>
                <li><strong>Voting Information:</strong> Your vote selections, voting timestamp, and IP address</li>
                <li><strong>Authentication Data:</strong> OTP codes and session tokens for secure login</li>
                <li><strong>Technical Data:</strong> Device information, browser type, and location data (for security purposes)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h3>
              <p className="mb-3">We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>To verify your identity and eligibility to vote</li>
                <li>To process and record your vote securely</li>
                <li>To prevent fraud and ensure election integrity</li>
                <li>To communicate important election-related information</li>
                <li>To generate anonymous statistical reports</li>
                <li>To comply with legal and regulatory requirements</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Vote Confidentiality</h3>
              <p className="mb-3">
                Your individual vote is strictly confidential and anonymous. While we record that you have voted, your specific vote selections are encrypted and cannot be traced back to you personally. Only aggregate voting statistics are made available.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h3>
              <p className="mb-3">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>End-to-end encryption for all voting data</li>
                <li>Secure authentication using OTP verification</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and monitoring</li>
                <li>Secure data storage and backup systems</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6. Data Sharing and Disclosure</h3>
              <p className="mb-3">
                We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>With authorized election committee members for election administration</li>
                <li>When required by law or legal process</li>
                <li>To protect the rights, property, or safety of the election process</li>
                <li>With service providers who assist in operating the platform (under strict confidentiality agreements)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h3>
              <p className="mb-3">
                We retain your personal information and voting records for as long as necessary to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Complete the election process and announce results</li>
                <li>Maintain election records as required by law</li>
                <li>Address any disputes or audits</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p className="mb-3">
                After the retention period, data will be securely deleted or anonymized.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights</h3>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>Access your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Withdraw consent for data processing (where applicable)</li>
                <li>Lodge complaints with the election committee</li>
              </ul>
              <p className="mb-3">
                Note: Once a vote is cast, it cannot be deleted as it is part of the official election record.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">9. Cookies and Tracking</h3>
              <p className="mb-3">
                We use essential cookies and session tokens to maintain your login session and ensure security. We do not use tracking cookies for advertising or analytics purposes.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">10. Third-Party Services</h3>
              <p className="mb-3">
                Our platform may use third-party services for:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>OTP delivery via SMS (Twilio)</li>
                <li>Cloud hosting and storage</li>
                <li>Email services</li>
              </ul>
              <p className="mb-3">
                These services are bound by their own privacy policies and confidentiality agreements.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">11. Children's Privacy</h3>
              <p className="mb-3">
                Our voting platform is intended for eligible voters only (18 years and above). We do not knowingly collect information from individuals under 18 years of age.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to This Policy</h3>
              <p className="mb-3">
                We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date. Continued use of the platform after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">13. Contact Us</h3>
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

