'use client'

import Link from "next/link";
import { useVoterLanguage } from '@/hooks/useVoterLanguage'

interface FooterProps {
    language?: 'english' | 'gujarati'
}

export default function Footer({ language }: FooterProps) {
    const { selectedLanguage } = useVoterLanguage()
    const currentLanguage = language || selectedLanguage

    const content = {
        english: {
            title: 'SKMMMS Election 2026',
            description: 'A secure, transparent, and accessible digital democracy platform for our community.',
            elections: 'Elections',
            trustees: 'Trustees',
            quickLinks: 'Quick Links',
            voterLogin: 'Voter Login',
            candidateRegistration: 'Candidate Registration',
            contact: 'Contact',
            election2026: 'Election 2026: Shree Panvel Kutchi Maheshwari Mahajan',
            copyright: '© 2025 SKMMMS Election 2026. All rights reserved.',
            designedBy: 'Designed & Developed by'
        },
        gujarati: {
            title: 'SKMMMS ચૂંટણી ૨૦૨૬',
            description: 'અમારા સમુદાય માટે એક સુરક્ષિત, પારદર્શક અને સુલભ ડિજિટલ લોકશાહી પ્લેટફોર્મ.',
            elections: 'ચૂંટણીઓ',
            trustees: 'ટ્રસ્ટીઓ',
            quickLinks: 'ઝડપી લિંક્સ',
            voterLogin: 'મતદાતા લોગિન',
            candidateRegistration: 'ઉમેદવાર નોંધણી',
            contact: 'સંપર્ક',
            election2026: 'ચૂંટણી ૨૦૨૬: શ્રી પનવેલ કચ્છી મહેશ્વરી મહાજન',
            copyright: '© ૨૦૨૫ SKMMMS ચૂંટણી ૨૦૨૬. બધા અધિકારો સુરક્ષિત.',
            designedBy: 'ડિઝાઇન અને વિકસિત'
        }
    }

    const t = content[currentLanguage]

    return (
        <footer className="bg-gray-900 text-white py-8 sm:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">
                            {t.title}
                        </h3>
                        <p className="text-gray-400 text-sm">
                            {t.description}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">{t.elections}</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <Link
                                    href="/elections/trustees"
                                    className="hover:text-white"
                                >
                                    {t.trustees}
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">{t.quickLinks}</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <Link
                                    href="/voter/login"
                                    className="hover:text-white"
                                >
                                    {t.voterLogin}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/candidate/signup"
                                    className="hover:text-white"
                                >
                                    {t.candidateRegistration}
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">{t.contact}</h4>
                        <div className="space-y-2 text-sm text-gray-400">
                            <p>
                                <a href="tel:+917666778349" className="hover:text-white">+91 7666778349</a>
                                <span className="block text-xs mt-1">Dipen Ketan Somani</span>
                            </p>
                            <p>
                                <a href="tel:+919820216044" className="hover:text-white">+91 9820216044</a>
                                <span className="block text-xs mt-1">Jay Deepak Bhutada</span>
                            </p>
                            <p>kmselec2026@gmail.com</p>
                            <p>B-2 Nityanand Krupa CHS, Deodhar Wada, Opp. Janakalyan Bank, Panvel (MH) - 410206</p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                    <p className="text-xs text-gray-500 mb-2">
                        {t.election2026}
                    </p>
                    <p>
                        {t.copyright}
                    </p>
                    <p className="mt-2">
                        {t.designedBy}{" "}
                        <Link 
                            href="https://www.teamfullstack.in" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 hover:underline transition-colors font-semibold"
                        >
                            Parth Chetna Piyush Gagdani, Team FullStack (Thane)
                        </Link>
                    </p>
                </div>
            </div>
        </footer>
    );
}
