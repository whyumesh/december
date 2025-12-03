"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { FileUploadStorj } from "@/components/ui/file-upload-storj";
import {
    Users,
    User,
    AlertCircle,
    ArrowLeft,
    Save,
    CheckCircle,
    Upload,
    XCircle,
    FileText,
    File as FileIcon,
    Image,
    Eye,
} from "lucide-react";
import { useCSRF } from "@/hooks/useCSRF";

interface NominationData {
    // Candidate Details
    candidateName: string;
    candidateFatherSpouse: string;
    candidateSurname: string;
    aliasNickname: string;
    permanentAddress: string;
    gender: string;
    birthDate: string;
    mobileNumber: string;
    emailId: string;
    zone: string;

    // Proposer Details
    proposerName: string;
    proposerFatherSpouse: string;
    proposerSurname: string;
    proposerAddress: string;
    proposerBirthDate: string;
    proposerMobile: string;
    proposerEmail: string;
    proposerZone: string;

    // Attachments
    candidateAadhaar: File | null;
    candidatePhoto: File | null;
    proposerAadhaar: File | null;
    
    // File URLs (after upload to Storj)
    candidateAadhaarUrl?: string;
    candidatePhotoUrl?: string;
    proposerAadhaarUrl?: string;
}

export default function NominationPage() {
    const [formData, setFormData] = useState<NominationData>({
        candidateName: "",
        candidateFatherSpouse: "",
        candidateSurname: "",
        aliasNickname: "",
        permanentAddress: "",
        gender: "",
        birthDate: "",
        mobileNumber: "",
        emailId: "",
        zone: "",
        proposerName: "",
        proposerFatherSpouse: "",
        proposerSurname: "",
        proposerAddress: "",
        proposerBirthDate: "",
        proposerMobile: "",
        proposerEmail: "",
        proposerZone: "",
        candidateAadhaar: null,
        candidatePhoto: null,
        proposerAadhaar: null,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [zones, setZones] = useState<any[]>([]);
    const [rulesAccepted, setRulesAccepted] = useState(false);
    const [declarationAccepted, setDeclarationAccepted] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'gujarati'>('english');
    const [isDataRestored, setIsDataRestored] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isRejectedCandidate, setIsRejectedCandidate] = useState(false);
    const [lockedFields, setLockedFields] = useState({ mobileNumber: false, emailId: false });
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // --- MODIFICATION: Added state for real-time form errors ---
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    // Document preview modal state
    const [showDocumentPreview, setShowDocumentPreview] = useState(false);
    const [previewDocument, setPreviewDocument] = useState<{
        type: 'aadhaar' | 'photo' | 'proposer_aadhaar';
        file: File;
        title: string;
    } | null>(null);

    // Function to validate proposer age (must be between 18-39 years old as of August 31, 2025)
    const validateProposerAge = (birthDate: string): { isValid: boolean; errorMessage?: string } => {
        if (!birthDate) {
            return { isValid: false, errorMessage: "Proposer date of birth is required" };
        }

        const proposerBirthDate = new Date(birthDate);
        const cutoffDate = new Date('2025-08-31'); // August 31, 2025
        
        // Calculate age as of August 31, 2025
        let age = cutoffDate.getFullYear() - proposerBirthDate.getFullYear();
        const monthDiff = cutoffDate.getMonth() - proposerBirthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && cutoffDate.getDate() < proposerBirthDate.getDate())) {
            age--;
        }

        if (age < 18) {
            return { 
                isValid: false, 
                errorMessage: `Proposer must be at least 18 years old as of August 31, 2025. Current age would be ${age} years.` 
            };
        }

        if (age > 39) {
            return { 
                isValid: false, 
                errorMessage: `Proposer must be 39 years old or younger as of August 31, 2025. Current age would be ${age} years.` 
            };
        }

        return { isValid: true };
    };

    // Function to format date from YYYY-MM-DD to DD/MM/YYYY
    const formatDateForDisplay = (dateString: string): string => {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    };

    const router = useRouter();
    const {
        fetch: csrfFetch,
        isLoading: csrfLoading,
        error: csrfError,
        getHeaders,
        refreshToken,
    } = useCSRF();

    // Language-specific content
    const content = {
        english: {
            rulesTitle: "Rules and Regulations",
            declarationTitle: "Declaration",
            candidateDetails: "Candidate Details",
            proposerDetails: "Proposer Details",
            documentAttachments: "Document Attachments",
            preview: "Preview & Submit",
            acceptAndContinue: "Accept & Continue",
            next: "Next",
            previewAndSubmit: "Preview and Submit",
            previous: "Previous",
            submit: "Submit Nomination",
            submitting: "Submitting...",
            // Form field labels
            labels: {
                candidateName: "Candidate Name",
                candidateSurname: "Surname",
                fatherName: "Father / Husband Name",
                motherName: "Mother's Name",
                dateOfBirth: "Date of Birth",
                gender: "Gender",
                maritalStatus: "Marital Status",
                bloodGroup: "Blood Group",
                aadhaarNumber: "Aadhaar Number",
                mobileNumber: "Mobile Number",
                email: "Email Address",
                address: "Address",
                city: "City",
                state: "State",
                pincode: "Pincode",
                occupation: "Occupation",
                companyName: "Company Name",
                designation: "Designation",
                workAddress: "Work Address",
                proposerName: "Proposer Name",
                proposerFatherSpouse: "Father/Husband Name",
                proposerSurname: "Proposer Surname",
                proposerMobile: "Proposer Mobile",
                proposerAadhaar: "Proposer Aadhaar",
                proposerAddress: "Proposer Address",
                zone: "Zone",
                aadhaarCard: "Aadhaar Card",
                candidatePhoto: "Candidate Photo",
                selectFile: "Select File",
                noFileSelected: "No file selected"
            },
            placeholders: {
                enterName: "Enter candidate name",
                enterSurname: "Enter surname",
                enterFatherName: "Enter father / husband name",
                enterMotherName: "Enter mother's name",
                selectDate: "Select date of birth",
                selectGender: "Select gender",
                selectMaritalStatus: "Select marital status",
                selectBloodGroup: "Select blood group",
                enterAadhaar: "Enter 12-digit Aadhaar number",
                enterMobile: "Enter 10-digit mobile number",
                enterEmail: "Enter email address",
                enterAddress: "Enter address",
                enterCity: "Enter city",
                enterState: "Enter state",
                enterPincode: "Enter pincode",
                enterOccupation: "Enter occupation",
                enterCompanyName: "Enter company name",
                enterDesignation: "Enter designation",
                enterWorkAddress: "Enter work address",
                enterProposerName: "Enter proposer name",
                enterProposerFatherSpouse: "Enter father/husband name",
                enterProposerSurname: "Enter proposer surname",
                enterProposerMobile: "Enter proposer mobile",
                enterProposerAadhaar: "Enter proposer Aadhaar",
                enterProposerAddress: "Enter proposer address",
                enterProposerEmail: "Enter proposer email address",
                selectZone: "Select zone"
            },
            rules: [
                "Length of the Term for this election of Yuva Pankh Samiti shall be from April 2026 - March 2029.",
                "All the process for Yuva Pankh Samiti shall be online and hence no forms shall be accepted via offline format.",
                "Candidate shall be required to upload Scanned PDF / PNG / JPEG of his / her Aadhaar Card (Self-Attested) along with the application of nomination.",
                "Candidate shall be required to upload his or her picture in JPEG/PNG format. This photo shall reflect in Candidate List as well as Voting Page.",
                "Last date of filing nomination form shall be 15th October 2025.",
                "Last date for withdrawal of nomination shall be 25th October 2025.",
                "In case of incomplete application, Election Commissioner shall intimate Candidate for specific requirement. Application shall be processed once the application is complete in required format.",
                "Candidate shall require to Sign-Up for processing candidate application.",
                "Candidate are advised to not share their personal Candidate Log-In ID and Password to anyone.",
                "Candidates are requested to fill nomination from the zones that shall correspond to the city / village mentioned in their Aadhaar Card. List of zones shall be mentioned in Sign-Up Page.",
                "Age eligibility criteria for applicants: Minimum 18 years (born on/before 31st August, 2007) Maximum 40 years (born on/before 1st September, 1985).",
                "Candidate shall be eligible for application from either Karobari Samiti or Yuva Pankh Samiti. If any candidate is found to have nominated in both Samiti's after the last date of withdrawal, in such case both nominations of the said candidates shall be cancelled without any prior notice.",
                "Any member who wishes to nominate themselves as candidates, shall not be allowed to be proposer for any other candidate.",
                "One member shall be proposer to only one candidate.",
                "Election Commissioner shall have final ruling on all the nominations and election related matters."
            ],
            declaration: "I, {name} hereby nominate myself for the candidature from {zone} zone for Yuva Pankh Samiti of Shri Kutchi Maheshwari Madhyastha Mahajan Samiti for the term 2026 – 2029. I hereby declare that all of the above information presented by me is completely true and genuine to the best of my knowledge. I pledge to bear true faith and abide by the Constitution of Shri Kutchi Maheshwari Madhyastha Mahajan Samiti and Constitution of Yuva Pankh as by law established and that I will uphold the Unity and Integrity of the Community.",
            agreementText: "I have read and understood all the rules and regulations for the Yuva Pankh Samiti elections (2026-2029). I agree to comply with all the terms and conditions mentioned above and confirm that I meet all the eligibility criteria.",
            declarationAgreementText: "I agree to the above declaration and confirm that all information provided is accurate and complete."
        },
        gujarati: {
            rulesTitle: "નિયમો અને નિયમાવલી",
            declarationTitle: "ઘોષણા",
            candidateDetails: "ઉમેદવારની વિગતો",
            proposerDetails: "ટેકેદારની વિગતો",
            documentAttachments: "દસ્તાવેજ જોડાણો",
            preview: "પૂર્વાવલોકન અને સબમિટ",
            acceptAndContinue: "સ્વીકારો અને આગળ વધો",
            next: "આગળ",
            previewAndSubmit: "પૂર્વાવલોકન અને સબમિટ",
            previous: "પાછળ",
            submit: "નામાંકન સબમિટ કરો",
            submitting: "સબમિટ કરી રહ્યા છીએ...",
            // Form field labels
            labels: {
                candidateName: "ઉમેદવારનું નામ",
                candidateSurname: "અટક",
                fatherName: "પિતા / પતિનું નામ",
                motherName: "માતાનું નામ",
                dateOfBirth: "જન્મ તારીખ",
                gender: "લિંગ",
                maritalStatus: "વૈવાહિક સ્થિતિ",
                bloodGroup: "રક્ત જૂથ",
                aadhaarNumber: "આધાર નંબર",
                mobileNumber: "મોબાઇલ નંબર",
                email: "ઇમેઇલ સરનામું",
                address: "સરનામું",
                city: "શહેર",
                state: "રાજ્ય",
                pincode: "પિનકોડ",
                occupation: "વ્યવસાય",
                companyName: "કંપનીનું નામ",
                designation: "પદ",
                workAddress: "કામનું સરનામું",
                proposerName: "ટેકેદારનું નામ",
                proposerFatherSpouse: "પિતા/પતિ",
                proposerSurname: "ટેકેદારની અટક",
                proposerMobile: "ટેકેદારનો મોબાઇલ",
                proposerAadhaar: "ટેકેદારનો આધાર",
                proposerAddress: "ટેકેદારનું સરનામું",
                zone: "વિભાગ",
                aadhaarCard: "આધાર કાર્ડ",
                candidatePhoto: "ઉમેદવારનો ફોટો",
                selectFile: "ફાઇલ પસંદ કરો",
                noFileSelected: "કોઈ ફાઇલ પસંદ નથી"
            },
            placeholders: {
                enterName: "ઉમેદવારનું નામ લખો",
                enterSurname: "અટક લખો",
                enterFatherName: "પિતાનું નામ લખો",
                enterMotherName: "માતાનું નામ લખો",
                selectDate: "જન્મ તારીખ પસંદ કરો",
                selectGender: "લિંગ પસંદ કરો",
                selectMaritalStatus: "વૈવાહિક સ્થિતિ પસંદ કરો",
                selectBloodGroup: "રક્ત જૂથ પસંદ કરો",
                enterAadhaar: "12-અંકનો આધાર નંબર લખો",
                enterMobile: "10-અંકનો મોબાઇલ નંબર લખો",
                enterEmail: "ઇમેઇલ સરનામું લખો",
                enterAddress: "સરનામું લખો",
                enterCity: "શહેર લખો",
                enterState: "રાજ્ય લખો",
                enterPincode: "પિનકોડ લખો",
                enterOccupation: "વ્યવસાય લખો",
                enterCompanyName: "કંપનીનું નામ લખો",
                enterDesignation: "પદ લખો",
                enterWorkAddress: "કામનું સરનામું લખો",
                enterProposerName: "ટેકેદારનું નામ લખો",
                enterProposerFatherSpouse: "પિતા/પતિનું નામ લખો",
                enterProposerSurname: "ટેકેદારની અટક લખો",
                enterProposerMobile: "ટેકેદારનો મોબાઇલ લખો",
                enterProposerAadhaar: "ટેકેદારનો આધાર લખો",
                enterProposerAddress: "ટેકેદારનું સરનામું લખો",
                enterProposerEmail: "ટેકેદારનું ઇમેઇલ લખો",
                selectZone: "વિભાગ પસંદ કરો"
            },
            rules: [
                "નવનિર્વચિત યુવા પાંખ સમિતિ નો કાર્યકાળ એપ્રિલ ૨૦૨૬ થી માર્ચ ૨૦૨૯ રહેશે.",
                "આ વખત યુવા પાંખ સમિતિ ની ચૂંટણી પ્રક્રિયા સંપૂર્ણ રીતે ઓનલાઇન રહેવા થી બીજા કોઈ પણ માધ્યમ થી નોંધણી પત્રક સ્વીકારવામાં આવશે નહીં.",
                "ઉમેદવારે નામાંકન અરજી સાથે પોતાના આધાર કાર્ડ (સ્વ - પ્રમાણિત) ની સ્કેન કરેલ PDF / JPEG / PNG ફાઇલ અપલોડ કરવાનું રહેશે.",
                "ઉમેદવારે નામાંકન અરજી સાથે પોતાનો ફોટો JPEG / PNG ફાઇલ અપલોડ કરવાનું રહેશે જે ઉમેદવાર યાદી અને ચૂંટણી પત્રક માં પ્રદર્શિત થશે.",
                "ઉમેદવારી ફોર્મ ભરવાની છેલ્લી તારીખ ૧૫ ઓક્ટોબર ૨૦૨૫ રહેશે.",
                "ઉમેદવારી પાછું ખેંચવાની છેલ્લી તારીખ ૨૫ ઓક્ટોબર ૨૦૨૫ રહેશે.",
                "નામાંકન પત્ર માં કોઈ પ્રકાર ની ત્રુટિ રહેશે તો તે ઉમેદવાર ને ચૂંટણી નિયામક દ્વારા તેની જાણ કરવા માં આવશે. ઉમેદવાર દ્વારા તે સુધારા કર્યા બાદજ નામાંકન પત્રક સ્વીકારવા માં આવશે.",
                "ઉમેદવારે અરજી પ્રક્રિયા માટે સાઇન-અપ કરવું ફરજિયાત રહેશે.",
                "ઉમેદવારે વ્યક્તિગત લોગ ઇન આઈ ડી અને પાસવર્ડ અન્ય કોઈને આપવું નહીં.",
                "ઉમેદવારો તેમના આધાર કાર્ડમાં નોંધાયેલા શહેર/ગામ પરથી અનુરૂપ વિભાગ માંથીજ ઉમેદવારી ફોર્મ ભરવાનું રહેશે.",
                "ઉમેદવાર ની ઉમર પાત્રતા: ઓછા માં ઓછી ૧૮ વર્ષ (૩૧ ઑગસ્ટ ૨૦૦૭ પહેલા જન્મ) અને વધુ માં વધુ ૪૦ વર્ષ (૦૧ સપ્ટેમ્બર ૧૯૮૫ પછી જન્મ).",
                "ચૂંટણી નિયામકનો નિર્ણય નામાંકન અને ચૂંટણી સંબંધિત બાબતોમાં અંતિમ ગણાશે.",
                "ઉમેદવાર કારોબારી સમિતિ અથવા યુવા પાંખ સમિતિ માંથી માત્ર ૧ માં ઉમેદવારી દાખલ કરી શકશે. જો કોઈ ઉમેદવારનો ઉમેદવારી પાછી ખેંચવાની અંતિમ તારીખ પછી બંને સમિતિઓ માં નામાંકન કરાવ્યું હોય તો આવા પરિસ્થિતિ માં ઉપરોક્ત ઉમેદવારના બંન્ને નામાંકન કોઈ પણ પૂર્વ સૂચના વિના રદ્દ કરવાં માં આવશે.",
                "જે સભ્ય પોતાને નામાંકિત કરે છે તે બીજા કોઈ પણ ઉમેદવાર માટે ટેકેદાર બની શકશે નહીં.",
                "એક સભ્ય માત્ર એકજ ઉમેદવાર માટે પ્રપોઝર ટેકેદાર બની શકશે."
            ],
            declaration: "હું, {name} શ્રી કચ્છી માહેશ્વરી મધ્યસ્થ મહાજન સમિતિના યુવા પાંખ સમિતિ માટે ૨૦૨૬-૨૦૨૯ ના કાર્યકાળ માટે {zone} વિભાગમાંથી પોતાની ઉમેદવારી માટે નામાંકન કરું છું. હું ઘોષણા કરું છું કે મારા દ્વારા રજૂ કરવામાં આવેલી બધી માહિતી મારા જ્ઞાન મુજબ સંપૂર્ણ સાચી અને વાસ્તવિક છે. હું શ્રી કચ્છી માહેશ્વરી મધ્યસ્થ મહાજન સમિતિ અને યુવા પાંખના બંધારણમાં વિશ્વાસ રાખવાનું અને તેનું પાલન કરવાનું વચન આપું છું અને હું સમુદાયની એકતા અને અખંડતાને જાળવીશ.",
            agreementText: "મેં યુવા પાંખ સમિતિ ચૂંટણી (૨૦૨૬-૨૦૨૯) માટેના બધા નિયમો અને નિયમાવલી વાંચી અને સમજી છે. હું ઉપર ઉલ્લેખિત બધા નિયમો અને શરતોનું પાલન કરવા માટે સહમત છું અને ખાતરી કરું છું કે હું બધી યોગ્યતા માપદંડ પૂરા કરું છું.",
            declarationAgreementText: "હું ઉપરની ઘોષણા સાથે સહમત છું અને ખાતરી કરું છું કે આપવામાં આવેલી બધી માહિતી સચોટ અને સંપૂર્ણ છે."
        }
    };

    useEffect(() => {
        checkAuthentication();
        fetchZones();
        restoreFormData();
    }, []);

    // Fetch candidate data after authentication
    useEffect(() => {
        if (isAuthenticated) {
            fetchCandidateData();
        }
    }, [isAuthenticated]);

    // Save form data when rules, declaration, language, or step changes
    useEffect(() => {
        if (isAuthenticated) {
            saveFormData(formData);
        }
    }, [rulesAccepted, declarationAccepted, selectedLanguage, currentStep]);

    // Note: Removed auto-set functionality - proposer zone must be manually selected

    // Clear form data after successful submission
    useEffect(() => {
        if (success) {
            clearFormData();
        }
    }, [success]);

    // Local storage key for nomination form data - include user ID for security
    const [storageKey, setStorageKey] = useState<string>('');

    // CRITICAL: Clear ALL localStorage data on component mount to prevent data leakage
    useEffect(() => {
        // Clear the old global storage key
        localStorage.removeItem('nomination-form-data');
        
        // Clear ALL nomination form data for ALL users to prevent cross-user data leakage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('nomination-form-data')) {
                localStorage.removeItem(key);
                console.log('Cleared localStorage key:', key);
            }
        });
        
        // Reset all form states to ensure clean start
        setFormData({
            candidateName: "",
            candidateFatherSpouse: "",
            candidateSurname: "",
            aliasNickname: "",
            permanentAddress: "",
            gender: "",
            birthDate: "",
            mobileNumber: "",
            emailId: "",
            zone: "",
            proposerName: "",
            proposerFatherSpouse: "",
            proposerSurname: "",
            proposerAddress: "",
            proposerBirthDate: "",
            proposerMobile: "",
            proposerEmail: "",
            proposerZone: "",
            candidateAadhaar: null,
            candidatePhoto: null,
            proposerAadhaar: null,
        });
        
        setRulesAccepted(false);
        setDeclarationAccepted(false);
        setSelectedLanguage('english');
        setCurrentStep(0);
        setIsDataRestored(false);
        setLastSaved(null);
        setLockedFields({ mobileNumber: false, emailId: false });
        
        console.log('COMPLETE FORM RESET - All localStorage cleared and form reset');
    }, []);

    // Periodic user session validation and CSRF token refresh to prevent data leakage and token expiration
    useEffect(() => {
        const interval = setInterval(async () => {
            if (isAuthenticated && currentUserId) {
                // Validate user session
                const user = await validateUserSession();
                if (user && user.id !== currentUserId) {
                    console.log('User session changed during form usage!');
                    // Force page reload to ensure clean state
                    window.location.reload();
                } else {
                    // Refresh CSRF token to prevent expiration
                    try {
                        await refreshToken();
                        console.log('CSRF token refreshed automatically');
                    } catch (error) {
                        console.error('Failed to refresh CSRF token automatically:', error);
                    }
                }
            }
        }, 30 * 60 * 1000); // Check every 30 minutes and refresh token

        return () => clearInterval(interval);
    }, [isAuthenticated, currentUserId]);

    // Save form data to local storage
    const saveFormData = (data: Partial<NominationData>) => {
        try {
            // Only save if we have a user-specific storage key
            if (!storageKey) {
                console.log('No storage key available, skipping save');
                return;
            }
            
            // Create a copy of data excluding File objects (can't be serialized)
            const dataToSave = {
                ...data,
                candidateAadhaar: null,
                candidatePhoto: null,
                proposerAadhaar: null,
                // Keep the URLs for files
                candidateAadhaarUrl: data.candidateAadhaarUrl,
                candidatePhotoUrl: data.candidatePhotoUrl,
                proposerAadhaarUrl: data.proposerAadhaarUrl,
            };
            
            const saveData = {
                formData: dataToSave,
                rulesAccepted,
                declarationAccepted,
                selectedLanguage,
                currentStep,
                timestamp: new Date().toISOString(),
            };
            
            localStorage.setItem(storageKey, JSON.stringify(saveData));
            setLastSaved(new Date());
        } catch (error) {
            console.error('Error saving form data to local storage:', error);
        }
    };

    // Restore form data from local storage
    const restoreFormData = () => {
        try {
            // Only restore if we have a user-specific storage key
            if (!storageKey) {
                console.log('No storage key available, skipping restore');
                return;
            }
            
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                
                // Check if data is not too old (30 days)
                const savedDate = new Date(parsed.timestamp);
                const now = new Date();
                const daysDiff = (now.getTime() - savedDate.getTime()) / (1000 * 3600 * 24);
                
                if (daysDiff <= 30) {
                    setFormData(prev => ({
                        ...prev,
                        ...parsed.formData,
                    }));
                    setRulesAccepted(parsed.rulesAccepted || false);
                    setDeclarationAccepted(parsed.declarationAccepted || false);
                    setSelectedLanguage(parsed.selectedLanguage || 'english');
                    setCurrentStep(parsed.currentStep || 0);
                    setLastSaved(savedDate);
                    setIsDataRestored(true);
                } else {
                    // Clear old data
                    localStorage.removeItem(storageKey);
                }
            }
        } catch (error) {
            console.error('Error restoring form data from local storage:', error);
        }
    };

    // Clear form data from local storage
    const clearFormData = () => {
        try {
            if (storageKey) {
                localStorage.removeItem(storageKey);
            }
            setLastSaved(null);
            setIsDataRestored(false);
        } catch (error) {
            console.error('Error clearing form data from local storage:', error);
        }
    };

    const fetchZones = async () => {
        try {
            const response = await fetch("/api/zones?electionType=YUVA_PANK");
            const data = await response.json();
            if (response.ok) {
                setZones(data.zones);
                // Clear frozen zones if they're currently selected
                setFormData(prev => {
                    const updated = { ...prev };
                    const selectedZone = data.zones.find((z: any) => z.id === prev.zone);
                    const selectedProposerZone = data.zones.find((z: any) => z.id === prev.proposerZone);
                    
                    if (selectedZone && selectedZone.isFrozen) {
                        updated.zone = "";
                    }
                    if (selectedProposerZone && selectedProposerZone.isFrozen) {
                        updated.proposerZone = "";
                    }
                    return updated;
                });
            }
        } catch (error) {
            console.error("Error fetching zones:", error);
        }
    };

    const checkAuthentication = async () => {
        try {
            const response = await fetch("/api/candidate/test-auth", {
                credentials: "include",
            });

            if (response.ok) {
                setIsAuthenticated(true);
            } else {
                // Check if this is a fresh signup
                const isFreshSignup = localStorage.getItem(
                    "candidate-signup-success",
                );
                if (isFreshSignup) {
                    setIsAuthenticated(true);
                    localStorage.removeItem("candidate-signup-success");
                } else {
                    router.push("/candidate/login");
                }
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            router.push("/candidate/login");
        } finally {
            setAuthLoading(false);
        }
    };

    // Validate user session to prevent data leakage
    const validateUserSession = async () => {
        try {
            const response = await fetch("/api/candidate/me", {
                credentials: "include",
            });
            
            if (response.ok) {
                const data = await response.json();
                const { user } = data;
                
                // If we have a current user ID, check if it matches
                if (currentUserId && currentUserId !== user.id) {
                    console.log('User changed! Clearing all data and resetting form');
                    // User has changed, clear everything
                    Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('nomination-form-data')) {
                            localStorage.removeItem(key);
                        }
                    });
                    
                    // Reset form completely
                    setFormData({
                        candidateName: "",
                        candidateFatherSpouse: "",
                        candidateSurname: "",
                        aliasNickname: "",
                        permanentAddress: "",
                        gender: "",
                        birthDate: "",
                        mobileNumber: "",
                        emailId: "",
                        zone: "",
                        proposerName: "",
                        proposerFatherSpouse: "",
                        proposerSurname: "",
                        proposerAddress: "",
                        proposerBirthDate: "",
                        proposerMobile: "",
                        proposerEmail: "",
                        proposerZone: "",
                        candidateAadhaar: null,
                        candidatePhoto: null,
                        proposerAadhaar: null,
                    });
                    
                    setCurrentUserId(user.id);
                    setStorageKey(`nomination-form-data-${user.id}`);
                }
                
                return user;
            }
            return null;
        } catch (error) {
            console.error('Error validating user session:', error);
            return null;
        }
    };

    const fetchCandidateData = async () => {
        try {
            console.log("Fetching candidate data for autofill...");
            
            // CRITICAL: First get current user data to validate session
            const userResponse = await fetch("/api/candidate/me", {
                credentials: "include",
            });

            if (!userResponse.ok) {
                console.log("Failed to fetch current user data:", userResponse.status);
                return;
            }

            const userData = await userResponse.json();
            const { user } = userData;
            console.log("Current user:", user);

            // Set user-specific storage key and clear all data FIRST
            const userId = user.id;
            setCurrentUserId(userId);
            const userStorageKey = `nomination-form-data-${userId}`;
            setStorageKey(userStorageKey);
            
            // CRITICAL: Clear ALL localStorage data to prevent any data leakage
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('nomination-form-data')) {
                    localStorage.removeItem(key);
                    console.log('Cleared localStorage key:', key);
                }
            });
            
            // Reset form data to ensure completely clean state
            setFormData({
                candidateName: "",
                candidateFatherSpouse: "",
                candidateSurname: "",
                aliasNickname: "",
                permanentAddress: "",
                gender: "",
                birthDate: "",
                mobileNumber: user.phone || "",
                emailId: user.email || "",
                zone: "",
                proposerName: "",
                proposerFatherSpouse: "",
                proposerSurname: "",
                proposerAddress: "",
                proposerBirthDate: "",
                proposerMobile: "",
                proposerEmail: "",
                proposerZone: "",
                candidateAadhaar: null,
                candidatePhoto: null,
                proposerAadhaar: null,
            });

            // Lock the fields if they were autofilled from user data
            setLockedFields({
                mobileNumber: !!user.phone,
                emailId: !!user.email
            });
            
            // Reset all other states
            setRulesAccepted(false);
            setDeclarationAccepted(false);
            setSelectedLanguage('english');
            setCurrentStep(0);
            setIsDataRestored(false);
            setLastSaved(null);
            setIsRejectedCandidate(false);
            
            console.log("Form completely reset for user:", userId);
            
            // NOW check for rejection - but only if we have a clean form
            const rejectedResponse = await fetch("/api/candidate/check-rejected", {
                credentials: "include",
            });

            if (rejectedResponse.ok) {
                const rejectedData = await rejectedResponse.json();
                
                if (rejectedData.isRejected) {
                    console.log("Candidate has been rejected, loading rejection data");
                    console.log("Rejection reason:", rejectedData.rejectionReason);
                    
                    // Validate that the rejection data is for the current user
                    if (rejectedData.candidateDetails && 
                        rejectedData.candidateDetails.emailId === user.email && 
                        rejectedData.candidateDetails.mobileNumber === user.phone) {
                        
                        // Set rejected candidate state
                        setIsRejectedCandidate(true);
                        
                        // Load rejection data
                        setFormData(prevData => ({
                            ...prevData,
                            candidateName: rejectedData.candidateDetails.candidateName || "",
                            candidateSurname: rejectedData.candidateDetails.candidateSurname || "",
                            candidateFatherSpouse: rejectedData.candidateDetails.candidateFatherSpouse || "",
                            aliasNickname: rejectedData.candidateDetails.aliasNickname || "",
                            permanentAddress: rejectedData.candidateDetails.permanentAddress || "",
                            gender: rejectedData.candidateDetails.gender || "",
                            birthDate: rejectedData.candidateDetails.birthDate || "",
                            mobileNumber: rejectedData.candidateDetails.mobileNumber || "",
                            emailId: rejectedData.candidateDetails.emailId || "",
                            zone: rejectedData.candidateDetails.zone || "",
                            proposerName: rejectedData.proposerDetails.proposerName || "",
                            proposerSurname: rejectedData.proposerDetails.proposerSurname || "",
                            proposerFatherSpouse: rejectedData.proposerDetails.proposerFatherSpouse || "",
                            proposerAddress: rejectedData.proposerDetails.proposerAddress || "",
                            proposerBirthDate: rejectedData.proposerDetails.proposerBirthDate || "",
                            proposerMobile: rejectedData.proposerDetails.proposerMobile || "",
                            proposerEmail: rejectedData.proposerDetails.proposerEmail || "",
                            proposerZone: rejectedData.proposerDetails.proposerZone || "",
                        }));
                        
                        // Show rejection reason
                        setError(`Your previous nomination was rejected. Reason: ${rejectedData.rejectionReason}. Please review and resubmit your nomination.`);
                        
                        console.log("Loaded rejection data for user:", userId);
                    } else {
                        console.log("Rejection data doesn't match current user, ignoring");
                        setError(""); // Clear any error
                    }
                } else {
                    console.log("No rejection found for user:", userId);
                }
            } else {
                console.log("Failed to check rejection status:", rejectedResponse.status);
            }
            
        } catch (error) {
            console.error("Error fetching candidate data:", error);
        }
    };

    // --- MODIFICATION: Updated handleInputChange function with validation ---
    const handleInputChange = (
        field: keyof NominationData,
        value: string | File | null,
    ) => {
        // --- NAME VALIDATION ---
        // Restrict input to only letters for candidateName
        if (field === "candidateName" || field === "proposerName" || field === "candidateSurname" || field === "proposerSurname" || field === "candidateFatherSpouse" || field === "proposerFatherSpouse") {
            if (typeof value === "string") {
                const nameRegex = /^[A-Za-z]*$/; // Allows only letters and empty string
                if (nameRegex.test(value)) {
                    const newFormData = { ...formData, [field]: value };
                    setFormData(newFormData);
                    saveFormData(newFormData);
                }
            }
            return; // Exit the function after handling
        }

        // --- EMAIL VALIDATION ---
        // Real-time validation for email fields
        if (field === "emailId" || field === "proposerEmail") {
            if (typeof value === 'string') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                // Show error only if the field is not empty and the format is invalid
                if (value && !emailRegex.test(value)) {
                    setFormErrors(prev => ({ ...prev, [field]: "Invalid email format" }));
                } else {
                    // Clear the error if format is valid or field is empty
                    setFormErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[field];
                        return newErrors;
                    });
                }
            }
        }

        // --- ADDRESS VALIDATION ---
        // Real-time validation for address fields
        if (field === "permanentAddress" || field === "proposerAddress") {
            if (typeof value === 'string') {
                // Show error only if the field is not empty and has less than 10 characters
                if (value && value.length < 10) {
                    const errorMessage = field === "permanentAddress" 
                        ? "Address must be at least 10 characters" 
                        : "Proposer address must be at least 10 characters";
                    setFormErrors(prev => ({ ...prev, [field]: errorMessage }));
                } else {
                    // Clear the error if length is valid or field is empty
                    setFormErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[field];
                        return newErrors;
                    });
                }
            }
        }

        // --- PROPOSER AGE VALIDATION ---
        // Real-time validation for proposer birth date
        if (field === "proposerBirthDate") {
            if (typeof value === 'string') {
                const validation = validateProposerAge(value);
                if (!validation.isValid) {
                    setFormErrors(prev => ({ ...prev, [field]: validation.errorMessage || "Invalid proposer age" }));
                } else {
                    // Clear the error if validation passes
                    setFormErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[field];
                        return newErrors;
                    });
                }
            }
        }

        // --- MOBILE VALIDATION (existing logic) ---
        // Special handling for mobile numbers
        if (field === "mobileNumber" || field === "proposerMobile") {
            if (typeof value === "string") {
                const digitsOnly = value.replace(/\D/g, ""); // Remove non-digit characters
                const limitedDigits = digitsOnly.slice(0, 10); // Limit to 10 digits
                const newFormData = { ...formData, [field]: limitedDigits };
                setFormData(newFormData);
                saveFormData(newFormData);
            } else {
                const newFormData = { ...formData, [field]: value };
                setFormData(newFormData);
                saveFormData(newFormData);
            }
        } else {
            // --- Default handler for other fields ---
            const newFormData = { ...formData, [field]: value };
            setFormData(newFormData);
            saveFormData(newFormData);
        }
    };

    const handleFileSelected = (
        field: "candidateAadhaar" | "candidatePhoto" | "proposerAadhaar",
        file: File,
    ) => {
        const newFormData = {
            ...formData,
            [field]: file,
        };
        setFormData(newFormData);
        // Save to local storage
        saveFormData(newFormData);
    };

    const handleFileRemoved = (
        field: "candidateAadhaar" | "candidatePhoto" | "proposerAadhaar",
    ) => {
        const newFormData = {
            ...formData,
            [field]: null,
        };
        setFormData(newFormData);
        // Save to local storage
        saveFormData(newFormData);
    };

    const handleDocumentPreview = (
        type: 'aadhaar' | 'photo' | 'proposer_aadhaar',
        file: File,
        title: string
    ) => {
        setPreviewDocument({ type, file, title });
        setShowDocumentPreview(true);
    };

    const validateDateOfBirth = (dateString: string): boolean => {
        if (!dateString) return false;
        
        const date = new Date(dateString);
        const minDate = new Date('1985-09-01');
        const maxDate = new Date('2007-08-31');
        
        return date >= minDate && date <= maxDate;
    };

    const validateStep = (step: number): boolean => {
        const isValid = (() => {
            switch (step) {
                case 0:
                    return rulesAccepted;
                case 1:
                    return !!(
                        formData.candidateName &&
                        formData.candidateFatherSpouse &&
                        formData.candidateSurname &&
                        formData.permanentAddress &&
                        formData.permanentAddress.length >= 10 && // Address length validation
                        !formErrors.permanentAddress && // Check for address validation errors
                        formData.gender &&
                        formData.birthDate &&
                        validateDateOfBirth(formData.birthDate) &&
                        formData.mobileNumber &&
                        formData.mobileNumber.length === 10 &&
                        formData.emailId && !formErrors.emailId && // Check for validation errors
                        formData.zone
                    );
                case 2:
                    return !!(
                        formData.proposerName &&
                        formData.proposerFatherSpouse &&
                        formData.proposerSurname &&
                        formData.proposerAddress &&
                        formData.proposerAddress.length >= 10 && // Proposer address length validation
                        !formErrors.proposerAddress && // Check for proposer address validation errors
                        formData.proposerBirthDate &&
                        !formErrors.proposerBirthDate && // Check for proposer age validation errors
                        formData.proposerMobile &&
                        formData.proposerMobile.length === 10 &&
                        formData.proposerEmail && !formErrors.proposerEmail && // Check for validation errors
                        formData.proposerZone &&
                        formData.proposerZone === formData.zone
                    );
                case 3:
                    return !!(
                        formData.candidateAadhaar &&
                        formData.candidatePhoto &&
                        formData.proposerAadhaar &&
                        declarationAccepted
                    );
                case 4:
                    return true; // Preview step is always valid
                default:
                    return false;
            }
        })();
        
        // Debug logging
        if (step === 3) {
            console.log('Step 3 validation:', {
                candidateAadhaar: !!formData.candidateAadhaar,
                candidatePhoto: !!formData.candidatePhoto,
                proposerAadhaar: !!formData.proposerAadhaar,
                declarationAccepted,
                isValid
            });
        }
        
        return isValid;
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError("");

        try {
            // CRITICAL: Validate user session before submission
            const currentUser = await validateUserSession();
            if (!currentUser) {
                throw new Error('User session expired. Please login again.');
            }
            
            if (currentUserId && currentUserId !== currentUser.id) {
                throw new Error('User session changed. Please refresh the page and try again.');
            }

            // CRITICAL: Refresh CSRF token before submission to prevent expiration
            try {
                await refreshToken();
                console.log('CSRF token refreshed before submission');
            } catch (refreshError) {
                console.error('Failed to refresh CSRF token:', refreshError);
                // Continue anyway, the token might still be valid
            }
            // First, validate the form completely before uploading any files
            const validationResult = validateForm();
            if (!validationResult.isValid) {
                setError(validationResult.errorMessage);
                setIsLoading(false);
                return;
            }

            // Validate that all required files are present
            if (!formData.candidateAadhaar || !formData.candidatePhoto || !formData.proposerAadhaar) {
                setError("All required documents must be uploaded before submission");
                setIsLoading(false);
                return;
            }

            // Now upload all files to Storj
            const fileUploadPromises = [];
            const fileData: { [key: string]: { fileKey: string; downloadUrl: string } } = {};

            // Generate unique folder name using timestamp and random string
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 8);
            const uniqueFolderName = `nomination_${timestamp}_${randomString}`;

            if (formData.candidateAadhaar) {
                fileUploadPromises.push(
                    uploadFileToStorj(formData.candidateAadhaar, 'aadhaar', uniqueFolderName)
                        .then(result => { 
                            fileData.candidateAadhaar = { fileKey: result.fileKey, downloadUrl: result.downloadUrl };
                        })
                        .catch(error => {
                            throw new Error(`Failed to upload Aadhaar card: ${error.message}`);
                        })
                );
            }

            if (formData.candidatePhoto) {
                fileUploadPromises.push(
                    uploadFileToStorj(formData.candidatePhoto, 'photo', uniqueFolderName)
                        .then(result => { 
                            fileData.candidatePhoto = { fileKey: result.fileKey, downloadUrl: result.downloadUrl };
                        })
                        .catch(error => {
                            throw new Error(`Failed to upload photo: ${error.message}`);
                        })
                );
            }

            if (formData.proposerAadhaar) {
                fileUploadPromises.push(
                    uploadFileToStorj(formData.proposerAadhaar, 'proposer_aadhaar', uniqueFolderName)
                        .then(result => { 
                            fileData.proposerAadhaar = { fileKey: result.fileKey, downloadUrl: result.downloadUrl };
                        })
                        .catch(error => {
                            throw new Error(`Failed to upload proposer Aadhaar: ${error.message}`);
                        })
                );
            }

            // Wait for all file uploads to complete with proper error handling
            try {
                await Promise.all(fileUploadPromises);
            } catch (uploadError: any) {
                console.error('File upload failed:', uploadError);
                setError(uploadError.message || "Failed to upload documents. Please ensure Storj is configured and try again.");
                setIsLoading(false);
                return;
            }

            // Ensure all required documents are uploaded successfully
            if (!fileData.candidateAadhaar || !fileData.candidatePhoto || !fileData.proposerAadhaar) {
                setError("All required documents must be uploaded successfully. Please upload all three documents.");
                setIsLoading(false);
                return;
            }

            // Now submit the form with file URLs
            const formDataToSend = new FormData();

            // Add all form fields except files and skip URL placeholders to avoid empty-first duplicates
            const urlKeys = new Set(['candidateAadhaarUrl','candidatePhotoUrl','proposerAadhaarUrl']);
            Object.entries(formData).forEach(([key, value]) => {
                if (urlKeys.has(key)) {
                    return; // real URLs appended below after uploads
                }
                if (!(value instanceof File)) {
                    formDataToSend.append(key, value || '');
                }
            });

            // Final client-side guard: required text fields present
            const requiredKeys = [
                'candidateName','candidateSurname','candidateFatherSpouse','permanentAddress','gender','birthDate','mobileNumber','emailId','zone',
                'proposerName','proposerSurname','proposerFatherSpouse','proposerAddress','proposerBirthDate','proposerMobile','proposerEmail','proposerZone'
            ] as const;
            for (const k of requiredKeys) {
                const v = formDataToSend.get(k as string);
                if (!v || String(v).trim() === '') {
                    setError(`Please complete all required fields before submitting. Missing: ${k}`);
                    setIsLoading(false);
                    return;
                }
            }

            // Add file keys (store fileKey, not signed URL, so we can generate fresh URLs later)
            // Store fileKey in the format that the backend expects
            formDataToSend.append('candidateAadhaarUrl', fileData.candidateAadhaar.fileKey);
            formDataToSend.append('candidatePhotoUrl', fileData.candidatePhoto.fileKey);
            formDataToSend.append('proposerAadhaarUrl', fileData.proposerAadhaar.fileKey);

            console.log("Submitting nomination form...");

            // Get CSRF token with proper error handling
            let csrfToken: string | null = null;
            try {
                const csrfHeaders = await getHeaders();
                csrfToken = csrfHeaders['x-csrf-token'];
                
                if (!csrfToken) {
                    console.log('CSRF token not available, refreshing...');
                    await refreshToken();
                    const newHeaders = await getHeaders();
                    csrfToken = newHeaders['x-csrf-token'];
                }
                
                if (!csrfToken) {
                    throw new Error('Unable to obtain security token. Please refresh the page and try again.');
                }
                
                formDataToSend.append('csrfToken', csrfToken);
            } catch (csrfError) {
                console.error('Failed to get CSRF token:', csrfError);
                throw new Error('Security token error. Please refresh the page and try again.');
            }

            // Use regular fetch with FormData and automatic retry on CSRF errors
            let response: Response | undefined;
            let responseData: any = null;
            let submissionAttempts = 0;
            const maxSubmissionRetries = 3;

            while (submissionAttempts < maxSubmissionRetries) {
                try {
                    response = await fetch("/api/candidate/nomination", {
                        method: "POST",
                        body: formDataToSend,
                        credentials: "include", // Important: include cookies
                    });

                    console.log("Response status:", response.status);
                    
                    // Handle different response statuses
                    if (response.status === 403) {
                        const responseText = await response.text();
                        
                        if (responseText.includes('CSRF') || responseText.includes('Security token')) {
                            // Refresh token
                            await refreshToken();
                            
                            // Get new token and update FormData
                            const newCsrfHeaders = await getHeaders();
                            const newCsrfToken = newCsrfHeaders['x-csrf-token'];
                            if (newCsrfToken) {
                                formDataToSend.set('csrfToken', newCsrfToken);
                            }
                            
                            submissionAttempts++;
                            continue; // Retry with new token
                        } else {
                            // Non-CSRF 403 error, parse as JSON
                            try {
                                responseData = JSON.parse(responseText);
                            } catch (parseError) {
                                responseData = { error: responseText };
                            }
                            break; // Don't retry non-CSRF 403 errors
                        }
                    } else {
                        // Parse response as JSON for non-403 responses
                        try {
                            responseData = await response.json();
                        } catch (parseError) {
                            responseData = { error: "Failed to parse response" };
                        }
                        break; // Don't retry for other status codes
                    }
                    
                    // If we get here, either success or non-CSRF error
                    break;
                    
                } catch (fetchError) {
                    console.error(`Submission attempt ${submissionAttempts + 1} failed:`, fetchError);
                    submissionAttempts++;
                    
                    if (submissionAttempts < maxSubmissionRetries) {
                        // Wait before retry
                        await new Promise(resolve => setTimeout(resolve, 2000 * submissionAttempts));
                    } else {
                        throw fetchError;
                    }
                }
            }
            
            if (!response) {
                throw new Error('Failed to get response after all retry attempts');
            }
            
            console.log("Response data:", responseData);

            if (response.ok) {
                setSuccess(true);
                setError(""); // Clear any previous errors
            } else {
                // Better error handling with specific messages
                if (response.status === 403 && (responseData?.error?.includes('CSRF') || responseData?.error?.includes('Security token'))) {
                    setError("Security token expired. Please refresh the page and try again.");
                } else if (response.status === 400) {
                    setError(responseData?.error || "Please check your form data and try again.");
                } else if (response.status === 401) {
                    setError("Session expired. Please login again.");
                } else if (response.status === 500) {
                    setError("Server error. Please try again later.");
                } else {
                    setError(responseData?.error || "Nomination submission failed. Please try again.");
                }
            }
        } catch (error) {
            console.error("Error submitting nomination:", error);
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Comprehensive form validation function
    const validateForm = (): { isValid: boolean; errorMessage: string } => {
        // Check all required fields
        const requiredFields = [
            { key: 'candidateName', label: 'Candidate Name' },
            { key: 'candidateSurname', label: 'Candidate Surname' },
            { key: 'candidateFatherSpouse', label: 'Candidate Father/Husband Name' },
            { key: 'permanentAddress', label: 'Permanent Address' },
            { key: 'gender', label: 'Gender' },
            { key: 'birthDate', label: 'Date of Birth' },
            { key: 'mobileNumber', label: 'Mobile Number' },
            { key: 'emailId', label: 'Email Address' },
            { key: 'zone', label: 'Zone' },
            { key: 'proposerName', label: 'Proposer Name' },
            { key: 'proposerFatherSpouse', label: 'Proposer Father/Husband Name' },
            { key: 'proposerSurname', label: 'Proposer Surname' },
            { key: 'proposerAddress', label: 'Proposer Address' },
            { key: 'proposerBirthDate', label: 'Proposer Date of Birth' },
            { key: 'proposerMobile', label: 'Proposer Mobile' },
            { key: 'proposerEmail', label: 'Proposer Email' },
            { key: 'proposerZone', label: 'Proposer Zone' }
        ];

        for (const field of requiredFields) {
            if (!formData[field.key as keyof NominationData]) {
                return { isValid: false, errorMessage: `${field.label} is required` };
            }
        }

        // Validate specific field formats
        if (formData.mobileNumber.length !== 10) {
            return { isValid: false, errorMessage: 'Mobile number must be exactly 10 digits' };
        }

        if (formData.proposerMobile.length !== 10) {
            return { isValid: false, errorMessage: 'Proposer mobile number must be exactly 10 digits' };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.emailId)) {
            return { isValid: false, errorMessage: 'Invalid email format' };
        }

        if (!emailRegex.test(formData.proposerEmail)) {
            return { isValid: false, errorMessage: 'Invalid proposer email format' };
        }

        // Validate address length
        if (formData.permanentAddress.length < 10) {
            return { isValid: false, errorMessage: 'Address must be at least 10 characters' };
        }

        if (formData.proposerAddress.length < 10) {
            return { isValid: false, errorMessage: 'Proposer address must be at least 10 characters' };
        }

        // Validate proposer age (must be at least 18 years old as of August 31, 2025)
        const proposerAgeValidation = validateProposerAge(formData.proposerBirthDate);
        if (!proposerAgeValidation.isValid) {
            return { isValid: false, errorMessage: proposerAgeValidation.errorMessage || 'Invalid proposer age' };
        }

        // Validate date of birth
        if (!validateDateOfBirth(formData.birthDate)) {
            return { isValid: false, errorMessage: 'Date of birth must be between September 1, 1985 and August 31, 2007 (inclusive)' };
        }

        // Validate zones match
        if (formData.zone !== formData.proposerZone) {
            return { isValid: false, errorMessage: 'Proposer zone must match candidate zone' };
        }

        // Validate zones are not frozen
        const selectedZone = zones.find(z => z.id === formData.zone);
        if (selectedZone && selectedZone.isFrozen) {
            return { isValid: false, errorMessage: 'Elections in this zone are frozen. Please select an active zone.' };
        }

        const selectedProposerZone = zones.find(z => z.id === formData.proposerZone);
        if (selectedProposerZone && selectedProposerZone.isFrozen) {
            return { isValid: false, errorMessage: 'Elections in the proposer zone are frozen. Please select an active zone.' };
        }

        // Validate files are selected
        if (!formData.candidateAadhaar || !formData.candidatePhoto || !formData.proposerAadhaar) {
            return { isValid: false, errorMessage: 'All required documents must be uploaded' };
        }

        // Validate declarations
        if (!rulesAccepted || !declarationAccepted) {
            return { isValid: false, errorMessage: 'Please accept all terms and declarations' };
        }

        return { isValid: true, errorMessage: '' };
    };

    // Helper function to upload file to Storj with timeout and retry (Storj only, no fallbacks)
    const uploadFileToStorj = async (file: File, fileType: string, candidateId: string, retryCount: number = 0): Promise<{ fileKey: string; downloadUrl: string }> => {
        const maxRetries = 3;
        const timeoutMs = 60000; // 60 seconds timeout per request
        
        try {
            // Get pre-signed URL from Storj (with timeout)
            const controller1 = new AbortController();
            const timeout1 = setTimeout(() => controller1.abort(), timeoutMs);
            
                const response = await fetch('/api/upload/presigned-url', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                signal: controller1.signal,
                    body: JSON.stringify({
                        candidateId,
                        fileType,
                        fileName: file.name,
                        fileSize: file.size,
                        contentType: file.type
                    }),
                });
            clearTimeout(timeout1);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to get upload URL. Please ensure Storj is configured.');
                }

                const { uploadUrl, fileKey } = await response.json();

            // Upload file to Storj with timeout (large files may need more time, but 60s should be enough for 5MB)
            const controller2 = new AbortController();
            const timeout2 = setTimeout(() => controller2.abort(), timeoutMs * 2); // 2 minutes for actual upload
            
                const uploadResponse = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type,
                    },
                signal: controller2.signal,
                });
            clearTimeout(timeout2);

                if (!uploadResponse.ok) {
                // Retry on 408 (timeout), 429 (rate limit), or 5xx errors
                if (retryCount < maxRetries && (uploadResponse.status === 408 || uploadResponse.status === 429 || uploadResponse.status >= 500)) {
                    console.log(`Upload failed with status ${uploadResponse.status}, retrying... (${retryCount + 1}/${maxRetries})`);
                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                    return uploadFileToStorj(file, fileType, candidateId, retryCount + 1);
                }
                throw new Error(`Failed to upload file to Storj (Status: ${uploadResponse.status}). Please try again.`);
            }

            // Complete upload and save metadata to database (with timeout)
            const controller3 = new AbortController();
            const timeout3 = setTimeout(() => controller3.abort(), timeoutMs);
            
                const completeResponse = await fetch('/api/upload/complete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                signal: controller3.signal,
                    body: JSON.stringify({
                        fileKey,
                        fileType,
                    candidateId,
                    fileName: file.name,
                    fileSize: file.size,
                    contentType: file.type
                    }),
                });
            clearTimeout(timeout3);

                if (!completeResponse.ok) {
                    const errorData = await completeResponse.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to complete upload and save file metadata.');
                }

                const { downloadUrl } = await completeResponse.json();
                return { fileKey, downloadUrl };
        } catch (error: any) {
            // Handle timeout errors
            if (error.name === 'AbortError') {
                if (retryCount < maxRetries) {
                    console.log(`Request timed out, retrying... (${retryCount + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                    return uploadFileToStorj(file, fileType, candidateId, retryCount + 1);
                }
                throw new Error('Upload timed out. Please check your internet connection and try again.');
            }
            
            // Handle network errors with retry
            if (error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
                if (retryCount < maxRetries) {
                    console.log(`Network error, retrying... (${retryCount + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                    return uploadFileToStorj(file, fileType, candidateId, retryCount + 1);
                }
                throw new Error('Network error during upload. Please check your internet connection and try again.');
            }
            
            throw error;
        }
    };

    if (authLoading || csrfLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-white rounded-lg shadow-lg">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                {authLoading
                                    ? "Checking Authentication..."
                                    : "Loading Security Token..."}
                            </h2>
                            <p className="text-gray-600">
                                {authLoading
                                    ? "Please wait while we verify your login status."
                                    : "Please wait while we prepare the secure form."}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-white rounded-lg shadow-lg">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                Authentication Required
                            </h2>
                            <p className="text-gray-600 mb-4">
                                Please login to access the nomination form.
                            </p>
                            <Link href="/candidate/login">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                    Go to Login
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-white rounded-lg shadow-lg">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Nomination Submitted Successfully!
                            </h2>
                            <p className="text-gray-600 mb-4">
                                Your nomination has been submitted for review.
                                You will be notified once it's approved by the
                                admin.
                            </p>
                            <Link href="/candidate/dashboard">
                                <Button className="bg-green-600 hover:bg-green-700 text-white">
                                    Go to Dashboard
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 space-y-4 sm:space-y-0">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <Link href="/candidate/login">
                                <Button variant="outline" className="text-sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Previous
                                </Button>
                            </Link>
                            {/* Clear saved data button */}
                            {lastSaved && (
<Button
    variant="outline"
    className="text-sm text-red-600 hover:text-red-700 hover:border-red-300"
    onClick={() => {
        clearFormData(); // This clears localStorage
        // Reset the form state BUT keep the candidate's email and mobile
        setFormData(prevData => ({
            candidateName: "",
            candidateFatherSpouse: "",
            candidateSurname: "",
            aliasNickname: "",
            permanentAddress: "",
            gender: "",
            birthDate: "",
            mobileNumber: prevData.mobileNumber, // Keep the existing mobile number
            emailId: prevData.emailId,           // Keep the existing email
            zone: "",
            proposerName: "",
            proposerFatherSpouse: "",
            proposerSurname: "",
            proposerAddress: "",
            proposerBirthDate: "",
            proposerMobile: "",
            proposerEmail: "",
            proposerZone: "",
            candidateAadhaar: null,
            candidatePhoto: null,
            proposerAadhaar: null,
        }));
        // Reset steps and acceptances
        setRulesAccepted(false);
        setDeclarationAccepted(false);
        setCurrentStep(0);
        setIsDataRestored(false);
    }}
>
    <XCircle className="h-4 w-4 mr-2" />
    Clear Saved Data
</Button>
                            )}
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    Nomination Form
                                </h1>
                                <p className="text-gray-600 text-xs sm:text-sm">
                                    Yuva Pankh Elections (2026 – 2029)
                                </p>
                                {/* Data restoration indicator */}
                                {isDataRestored && (
                                    <div className="mt-2 flex items-center space-x-2 text-sm text-green-600">
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Previous form data restored</span>
                                    </div>
                                )}
                                {/* Last saved indicator */}
                                {lastSaved && !isDataRestored && (
                                    <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600">
                                        <Save className="h-4 w-4" />
                                        <span>Last saved: {lastSaved.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Language Selector */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium text-gray-700">
                                    {selectedLanguage === 'english' ? 'Language' : 'ભાષા'}:
                                </span>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setSelectedLanguage('english')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                            selectedLanguage === 'english'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        English
                                    </button>
                                    <button
                                        onClick={() => setSelectedLanguage('gujarati')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                            selectedLanguage === 'gujarati'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        ગુજરાતી
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex justify-center mb-8 sm:mb-12">
                        <div className="flex space-x-2 sm:space-x-4">
                            {[0, 1, 2, 3].map((step) => (
                                <div key={step} className="flex items-center">
                                    <div
                                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                                            currentStep >= step
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-200 text-gray-600"
                                        }`}
                                    >
                                        {step === 0 ? "R" : step}
                                    </div>
                                    {step < 3 && (
                                        <div
                                            className={`w-4 sm:w-8 h-0.5 ml-2 sm:ml-4 ${
                                                currentStep > step
                                                    ? "bg-blue-600"
                                                    : "bg-gray-200"
                                            }`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Card className="bg-white rounded-lg shadow-lg">
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className={`text-gray-900 text-center ${selectedLanguage === 'gujarati' ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>
                                {currentStep === 0 && content[selectedLanguage].rulesTitle}
                                {currentStep === 1 && content[selectedLanguage].candidateDetails}
                                {currentStep === 2 && content[selectedLanguage].proposerDetails}
                                {currentStep === 3 && content[selectedLanguage].documentAttachments}
                                {currentStep === 4 && content[selectedLanguage].preview}
                            </CardTitle>
                            <CardDescription className={`text-gray-600 text-center ${selectedLanguage === 'gujarati' ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'}`}>
                                {currentStep === 0 &&
                                    (selectedLanguage === 'english' 
                                        ? "Please read and accept the rules and regulations before proceeding"
                                        : "આગળ વધતા પહેલા કૃપા કરીને નિયમો અને નિયમાવલી વાંચો અને સ્વીકારો")}
                                {currentStep === 1 &&
                                    (selectedLanguage === 'english'
                                        ? "Fill in your personal information"
                                        : "આધાર કાર્ડ મુજબ તમારી વ્યક્તિગત માહિતી ભરો")}
                                {currentStep === 2 &&
                                    (selectedLanguage === 'english'
                                        ? "Provide proposer details for your nomination"
                                        : "તમારા નામાંકન માટે ટેકેદારની વિગતો પ્રદાન કરો")}
                                {currentStep === 3 &&
                                    (selectedLanguage === 'english'
                                        ? "Upload required documents in specified formats"
                                        : "નિર્દિષ્ટ ફોર્મેટમાં જરૂરી દસ્તાવેજો અપલોડ કરો")}
                                {currentStep === 4 &&
                                    (selectedLanguage === 'english'
                                        ? "Review all your information before submitting the nomination"
                                        : "નામાંકન સબમિટ કરતા પહેલા તમારી બધી માહિતીની સમીક્ષા કરો")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            {isRejectedCandidate && (
                                <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 p-3 rounded-md mb-4 sm:mb-6">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm">
                                        <strong>Resubmission Notice:</strong> Your previous nomination was rejected. 
                                        All your previous information has been auto-filled. Please review and make necessary changes. 
                                        Note: Mobile number and email address are locked and cannot be changed.
                                    </span>
                                </div>
                            )}
                            {(error || csrfError) && (
                                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md mb-4 sm:mb-6">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm">
                                        {error || csrfError}
                                    </span>
                                </div>
                            )}

                            {/* Step 0: Rules and Regulations */}
                            {currentStep === 0 && (
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        {content[selectedLanguage].rules.map((rule, index) => (
                                            <div key={index}>
                                                <p className={`text-gray-900 ${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'}`}>
                                                    <strong>{selectedLanguage === 'gujarati' ? ['૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯', '૧૦', '૧૧', '૧૨', '૧૩', '૧૪', '૧૫'][index] : (index + 1)}. </strong>{rule}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                                        <div className="flex items-start space-x-3">
                                            <input
                                                type="checkbox"
                                                id="rules-acceptance"
                                                checked={rulesAccepted}
                                                onChange={(e) => setRulesAccepted(e.target.checked)}
                                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="rules-acceptance" className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                                {content[selectedLanguage].agreementText}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 1: Candidate Details */}
                            {currentStep === 1 && (
                                <div className="space-y-4 sm:space-y-6">
                                    <div>
                                        <h3 className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-base sm:text-lg'} font-semibold text-gray-900 mb-3 sm:mb-4`}>
                                            1. {selectedLanguage === 'english' ? 'Name of the Candidate (with Original Community Surname)' : 'ઉમેદવાર નું નામ (મૂળ અટક સાથે)'}
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                            <div>
                                                <Label className="text-gray-700">
                                                    {content[selectedLanguage].labels.candidateName} <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    value={
                                                        formData.candidateName
                                                    }
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            "candidateName",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                                    placeholder={content[selectedLanguage].placeholders.enterName}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-gray-700">
                                                    {content[selectedLanguage].labels.fatherName} <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    value={
                                                        formData.candidateFatherSpouse
                                                    }
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            "candidateFatherSpouse",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                                    placeholder={content[selectedLanguage].placeholders.enterFatherName}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-gray-700">
                                                    {content[selectedLanguage].labels.candidateSurname} <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    value={
                                                        formData.candidateSurname
                                                    }
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            "candidateSurname",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                                    placeholder={content[selectedLanguage].placeholders.enterSurname}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : ''} text-gray-700`}>
                                            2. {selectedLanguage === 'english' ? 'Alias / Nick Name of the Candidate' : 'ઉમેદવાર નું અન્ય કોઈ નામ (હલામણું નામ) હોય તો'}
                                        </Label>
                                        <Input
                                            value={formData.aliasNickname}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "aliasNickname",
                                                    e.target.value,
                                                )
                                            }
                                            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                            placeholder={selectedLanguage === 'english' ? "Enter alias or NA" : "અન્ય નામ લખો અથવા NA"}
                                        />
                                    </div>

                                    <div>
                                        <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : ''} text-gray-700`}>
                                            3. {selectedLanguage === 'english' ? 'Permanent Residential Address (As mentioned in Aadhaar Card)' : 'કાયમી નિવાસસ્થાન સરનામું (આધાર કાર્ડ મુજબ)'} <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            value={formData.permanentAddress}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "permanentAddress",
                                                    e.target.value,
                                                )
                                            }
                                            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                            placeholder={content[selectedLanguage].placeholders.enterAddress}
                                            rows={3}
                                        />
                                        {/* Address validation error display */}
                                        {formErrors.permanentAddress && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {formErrors.permanentAddress}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                                4. {content[selectedLanguage].labels.gender} <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={formData.gender}
                                                onValueChange={(value) =>
                                                    handleInputChange(
                                                        "gender",
                                                        value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                                                    <SelectValue placeholder={content[selectedLanguage].placeholders.selectGender} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Male">
                                                        {selectedLanguage === 'english' ? 'Male' : 'પુરુષ'}
                                                    </SelectItem>
                                                    <SelectItem value="Female">
                                                        {selectedLanguage === 'english' ? 'Female' : 'સ્ત્રી'}
                                                    </SelectItem>
                                                    <SelectItem value="Other">
                                                        {selectedLanguage === 'english' ? 'Other' : 'અન્ય'}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                                5. {content[selectedLanguage].labels.dateOfBirth} <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                type="date"
                                                value={formData.birthDate}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "birthDate",
                                                        e.target.value,
                                                    )
                                                }
                                                className={`bg-white text-gray-900 placeholder:text-gray-500 ${
                                                    formData.birthDate && !validateDateOfBirth(formData.birthDate)
                                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                                        : "border-gray-300"
                                                }`}
                                            />
                                            {formData.birthDate && !validateDateOfBirth(formData.birthDate) && (
                                                <p className="text-sm text-red-600 mt-1">
                                                    {selectedLanguage === 'english' 
                                                        ? 'Date of birth must be between September 1, 1985 and August 31, 2007 (inclusive)'
                                                        : 'જન્મ તારીખ 1 સપ્ટેમ્બર 1985 અને 31 ઑગસ્ટ 2007 (બંને સહિત) વચ્ચે હોવી જોઈએ'
                                                    }
                                                </p>
                                            )}
                                            {formData.birthDate && validateDateOfBirth(formData.birthDate) && (
                                                <p className="text-sm text-green-600 mt-1">
                                                    {selectedLanguage === 'english' ? '✓ Valid date of birth' : '✓ માન્ય જન્મ તારીખ'}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                                6. {selectedLanguage === 'english' ? 'Mobile Number (10 digits only)' : 'મોબાઇલ નંબર (10 અંકો માત્ર)'} <span className="text-red-500">*</span>
                                                {lockedFields.mobileNumber && <span className="text-green-600 text-xs ml-2">(Locked from account)</span>}
                                            </Label>
                                            <Input
                                                type="tel"
                                                value={formData.mobileNumber}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "mobileNumber",
                                                        e.target.value,
                                                    )
                                                }
                                                className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 ${
                                                    isRejectedCandidate ? 'bg-gray-100 cursor-not-allowed' : ''
                                                } ${lockedFields.mobileNumber ? 'bg-green-50 border-green-300 cursor-not-allowed' : ''}`}
                                                placeholder={content[selectedLanguage].placeholders.enterMobile}
                                                maxLength={10}
                                                pattern="[0-9]{10}"
                                                disabled={isRejectedCandidate || lockedFields.mobileNumber}
                                            />
                                            {isRejectedCandidate && (
                                                <p className="text-sm text-blue-600 mt-1">
                                                    Mobile number is locked and cannot be changed
                                                </p>
                                            )}
                                            {lockedFields.mobileNumber && !isRejectedCandidate && (
                                                <p className="text-sm text-green-600 mt-1">
                                                    Mobile number is locked from your account and cannot be changed
                                                </p>
                                            )}
                                            {formData.mobileNumber &&
                                                formData.mobileNumber.length !==
                                                    10 && !isRejectedCandidate && (
                                                    <p className="text-sm text-amber-600 mt-1">
                                                        Mobile number must be
                                                        exactly 10 digits
                                                    </p>
                                                )}
                                        </div>

                                        <div>
                                            <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                                7. {selectedLanguage === 'english' ? 'E-Mail ID' : 'ઇમેઇલ આઈ ડી'} <span className="text-red-500">*</span>
                                                {lockedFields.emailId && <span className="text-green-600 text-xs ml-2">(Locked from account)</span>}
                                            </Label>
                                            <Input
                                                type="email"
                                                value={formData.emailId}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "emailId",
                                                        e.target.value,
                                                    )
                                                }
                                                className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 ${
                                                    isRejectedCandidate ? 'bg-gray-100 cursor-not-allowed' : ''
                                                } ${lockedFields.emailId ? 'bg-green-50 border-green-300 cursor-not-allowed' : ''}`}
                                                placeholder={content[selectedLanguage].placeholders.enterEmail}
                                                disabled={isRejectedCandidate || lockedFields.emailId}
                                            />
                                            {isRejectedCandidate && (
                                                <p className="text-sm text-blue-600 mt-1">
                                                    Email address is locked and cannot be changed
                                                </p>
                                            )}
                                            {lockedFields.emailId && !isRejectedCandidate && (
                                                <p className="text-sm text-green-600 mt-1">
                                                    Email address is locked from your account and cannot be changed
                                                </p>
                                            )}
                                            {/* --- MODIFICATION: Real-time error display --- */}
                                            {formErrors.emailId && !isRejectedCandidate && (
                                                <p className="text-sm text-red-600 mt-1">
                                                    {formErrors.emailId}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Frozen Zones Notification */}
                                    {zones.some(zone => zone.isFrozen) && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                                            <div className="flex items-start">
                                                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                                                <div>
                                                    <p className={`${selectedLanguage === 'gujarati' ? 'text-base' : 'text-sm'} font-semibold text-amber-800 mb-1`}>
                                                        {selectedLanguage === 'english' 
                                                            ? 'Zone Election Status' 
                                                            : 'વિભાગ ચૂંટણી સ્થિતિ'}
                                                    </p>
                                                    <p className={`${selectedLanguage === 'gujarati' ? 'text-base' : 'text-sm'} text-amber-700`}>
                                                        {selectedLanguage === 'english'
                                                            ? 'Elections in some zones are currently frozen. Only Karnataka & Goa and Raigad zones are accepting nominations at this time.'
                                                            : 'કેટલાક વિભાગોમાં ચૂંટણી હાલમાં ફ્રીઝ કરવામાં આવી છે. આ સમયે માત્ર કર્ણાટક અને ગોવા અને રાયગઢ વિભાગો જ નામાંકન સ્વીકારી રહ્યા છે.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                            8. {selectedLanguage === 'english' ? 'Name of zone for candidature nomination' : 'ઉમેદવારી નોંધાવવા માટે વિભાગ નું ચયન કરો'} <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={formData.zone}
                                            onValueChange={(value) => {
                                                const selectedZone = zones.find(z => z.id === value);
                                                if (selectedZone && !selectedZone.isFrozen) {
                                                    handleInputChange("zone", value);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                                                <SelectValue placeholder={content[selectedLanguage].placeholders.selectZone} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {zones.map((zone) => (
                                                    <SelectItem
                                                        key={zone.id}
                                                        value={zone.id}
                                                        disabled={zone.isFrozen}
                                                        className={zone.isFrozen ? "opacity-50 cursor-not-allowed" : ""}
                                                    >
                                                        {zone.nameGujarati} (
                                                        {zone.name}) -{" "}
                                                        {zone.seats}{" "}
                                                        {zone.seats === 1
                                                            ? "Seat"
                                                            : "Seats"}
                                                        {zone.isFrozen && (
                                                            <span className="ml-2 text-amber-600">
                                                                {selectedLanguage === 'english' ? '(Frozen)' : '(ફ્રીઝ)'}
                                                            </span>
                                                        )}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {formData.zone && zones.find(z => z.id === formData.zone)?.isFrozen && (
                                            <p className="text-sm text-amber-600 mt-1">
                                                {selectedLanguage === 'english'
                                                    ? '⚠️ Elections in this zone are frozen. Please select an active zone.'
                                                    : '⚠️ આ વિભાગમાં ચૂંટણી ફ્રીઝ કરવામાં આવી છે. કૃપા કરીને સક્રિય વિભાગ પસંદ કરો.'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Proposer Details */}
                            {currentStep === 2 && (
                                <div className="space-y-4 sm:space-y-6">
                                    <div>
                                        <h3 className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-base sm:text-lg'} font-semibold text-gray-900 mb-3 sm:mb-4`}>
                                            9. {selectedLanguage === 'english' ? 'Name of the Proposer for above Candidate (with Original Community Surname)' : 'ટેકેદાર વિગત - ટેકેદાર નું નામ (મૂળ અટક સાથે)'}
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                            <div>
                                                <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                                    {content[selectedLanguage].labels.proposerName} <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    value={formData.proposerName}
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            "proposerName",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                                    placeholder={content[selectedLanguage].placeholders.enterProposerName}
                                                />
                                            </div>
                                            <div>
                                                <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                                    {content[selectedLanguage].labels.proposerFatherSpouse} <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    value={
                                                        formData.proposerFatherSpouse
                                                    }
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            "proposerFatherSpouse",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                                    placeholder={content[selectedLanguage].placeholders.enterProposerFatherSpouse}
                                                />
                                            </div>
                                            <div>
                                                <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                                    {content[selectedLanguage].labels.proposerSurname} <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    value={
                                                        formData.proposerSurname
                                                    }
                                                    onChange={(e) =>
                                                        handleInputChange(
                                                            "proposerSurname",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                                    placeholder={content[selectedLanguage].placeholders.enterProposerSurname}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                            10. {selectedLanguage === 'english' ? 'Permanent Residential Address (As mentioned in Aadhaar Card)' : 'ટેકેદાર ના કાયમી નિવાસસ્થાન નું સરનામું (આધાર કાર્ડ મુજબ)'} <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            value={formData.proposerAddress}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "proposerAddress",
                                                    e.target.value,
                                                )
                                            }
                                            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                            placeholder={content[selectedLanguage].placeholders.enterProposerAddress}
                                            rows={3}
                                        />
                                        {/* Proposer address validation error display */}
                                        {formErrors.proposerAddress && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {formErrors.proposerAddress}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                                11. {content[selectedLanguage].labels.dateOfBirth} <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                type="date"
                                                value={
                                                    formData.proposerBirthDate
                                                }
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "proposerBirthDate",
                                                        e.target.value,
                                                    )
                                                }
                                                className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 ${
                                                    formErrors.proposerBirthDate ? 'border-red-500' : ''
                                                }`}
                                            />
                                            {formErrors.proposerBirthDate && (
                                                <p className="text-red-500 text-sm mt-1">
                                                    {formErrors.proposerBirthDate}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                        <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                            12. {selectedLanguage === 'english' ? 'Mobile Number (10 digits only)' : 'મોબાઇલ નંબર (10 અંકો માત્ર)'} <span className="text-red-500">*</span>
                                        </Label>
                                            <Input
                                                type="tel"
                                                value={formData.proposerMobile}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        "proposerMobile",
                                                        e.target.value,
                                                    )
                                                }
                                                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                                placeholder={content[selectedLanguage].placeholders.enterMobile}
                                                maxLength={10}
                                                pattern="[0-9]{10}"
                                            />
                                            {formData.proposerMobile &&
                                                formData.proposerMobile
                                                    .length !== 10 && (
                                                    <p className="text-sm text-amber-600 mt-1">
                                                        Mobile number must be
                                                        exactly 10 digits
                                                    </p>
                                                )}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                            13. {selectedLanguage === 'english' ? 'E-Mail ID' : 'ઇમેઇલ આઈ ડી'} <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            type="email"
                                            value={formData.proposerEmail}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "proposerEmail",
                                                    e.target.value,
                                                )
                                            }
                                            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                                            placeholder={content[selectedLanguage].placeholders.enterProposerEmail}
                                        />
                                        {/* --- MODIFICATION: Real-time error display --- */}
                                        {formErrors.proposerEmail && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {formErrors.proposerEmail}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                            14. {selectedLanguage === 'english' ? 'Proposer Zone (Must match candidate zone)' : 'ટેકેદાર વિભાગ (ઉમેદવાર વિભાગ જેવો જ હોવો જોઈએ)'} <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={formData.proposerZone}
                                            onValueChange={(value) => {
                                                const selectedZone = zones.find(z => z.id === value);
                                                if (selectedZone && !selectedZone.isFrozen) {
                                                    handleInputChange("proposerZone", value);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className={`bg-white border-gray-300 text-gray-900 ${
                                                formData.proposerZone && formData.zone && formData.proposerZone !== formData.zone
                                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                                    : ""
                                            }`}>
                                                <SelectValue placeholder={content[selectedLanguage].placeholders.selectZone} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {zones.map((zone) => (
                                                    <SelectItem
                                                        key={zone.id}
                                                        value={zone.id}
                                                        disabled={zone.isFrozen}
                                                        className={zone.isFrozen ? "opacity-50 cursor-not-allowed" : ""}
                                                    >
                                                        {zone.nameGujarati} (
                                                        {zone.name}) -{" "}
                                                        {zone.seats}{" "}
                                                        {zone.seats === 1
                                                            ? "Seat"
                                                            : "Seats"}
                                                        {zone.isFrozen && (
                                                            <span className="ml-2 text-amber-600">
                                                                {selectedLanguage === 'english' ? '(Frozen)' : '(ફ્રીઝ)'}
                                                            </span>
                                                        )}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {formData.zone && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                {selectedLanguage === 'english' 
                                                    ? `Candidate zone: ${zones.find(z => z.id === formData.zone)?.name || formData.zone}`
                                                    : `ઉમેદવાર વિભાગ: ${zones.find(z => z.id === formData.zone)?.nameGujarati || formData.zone}`
                                                }
                                            </p>
                                        )}
                                        {formData.proposerZone && formData.zone && formData.proposerZone === formData.zone && (
                                            <p className="text-sm text-green-600 mt-1">
                                                {selectedLanguage === 'english' ? '✓ Zones match' : '✓ વિભાગો મેળ ખાય છે'}
                                            </p>
                                        )}
                                        {formData.proposerZone && formData.zone && formData.proposerZone !== formData.zone && (
                                            <p className="text-sm text-red-600 mt-1">
                                                {selectedLanguage === 'english' 
                                                    ? 'Proposer zone must match candidate zone'
                                                    : 'ટેકેદાર વિભાગ ઉમેદવાર વિભાગ જેવો જ હોવો જોઈએ'
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Document Attachments */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className={`${selectedLanguage === 'gujarati' ? 'text-xl sm:text-2xl' : 'text-lg'} font-semibold text-gray-900 mb-4`}>
                                            {selectedLanguage === 'english' ? 'List of Attachments with Form' : 'ફોર્મ સાથે જોડાણોની યાદી'}
                                        </h3>
                                        <p className={`text-gray-600 ${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} mb-6`}>
                                            {selectedLanguage === 'english' ? '(Attachment link shall be available in the form, in Web Application)' : '(ફોર્મમાં, વેબ એપ્લિકેશનમાં જોડાણ લિંક ઉપલબ્ધ હશે)'}
                                        </p>

                                        <div className="space-y-4">
                                            <div>
                                                <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                                    1. {content[selectedLanguage].labels.aadhaarCard} -
                                                    {selectedLanguage === 'english' ? 'PDF/JPEG/PNG Format' : 'PDF/JPEG/PNG ફોર્મેટ'} <span className="text-red-500">*</span>
                                                </Label>
                                                <FileUploadStorj
                                                    onFileSelected={(file) =>
                                                        handleFileSelected(
                                                            "candidateAadhaar",
                                                            file,
                                                        )
                                                    }
                                                    onFileRemoved={() =>
                                                        handleFileRemoved(
                                                            "candidateAadhaar",
                                                        )
                                                    }
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    className="mt-2"
                                                    fileType="aadhaar"
                                                    candidateId="temp"
                                                    maxSizeMB={5}
                                                    selectedFile={formData.candidateAadhaar}
                                                />
                                            </div>

                                            <div>
                                                <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                                    2. {content[selectedLanguage].labels.candidatePhoto} -
                                                    {selectedLanguage === 'english' ? 'JPEG/PNG Format' : 'JPEG/PNG ફોર્મેટ'} <span className="text-red-500">*</span>
                                                </Label>
                                                <FileUploadStorj
                                                    onFileSelected={(file) =>
                                                        handleFileSelected(
                                                            "candidatePhoto",
                                                            file,
                                                        )
                                                    }
                                                    onFileRemoved={() =>
                                                        handleFileRemoved(
                                                            "candidatePhoto",
                                                        )
                                                    }
                                                    accept=".jpg,.jpeg,.png"
                                                    className="mt-2"
                                                    fileType="photo"
                                                    candidateId="temp"
                                                    maxSizeMB={5}
                                                    selectedFile={formData.candidatePhoto}
                                                />
                                            </div>

                                            <div>
                                                <Label className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                                    3. {content[selectedLanguage].labels.proposerAadhaar} -
                                                    {selectedLanguage === 'english' ? 'PDF/JPEG/PNG Format' : 'PDF/JPEG/PNG ફોર્મેટ'} <span className="text-red-500">*</span>
                                                </Label>
                                                <FileUploadStorj
                                                    onFileSelected={(file) =>
                                                        handleFileSelected(
                                                            "proposerAadhaar",
                                                            file,
                                                        )
                                                    }
                                                    onFileRemoved={() =>
                                                        handleFileRemoved(
                                                            "proposerAadhaar",
                                                        )
                                                    }
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    className="mt-2"
                                                    fileType="proposer_aadhaar"
                                                    candidateId="temp"
                                                    maxSizeMB={5}
                                                    selectedFile={formData.proposerAadhaar}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Declaration Section */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-6">
                                        <h3 className={`${selectedLanguage === 'gujarati' ? 'text-xl sm:text-2xl' : 'text-lg'} font-semibold text-gray-900 mb-4`}>
                                            {content[selectedLanguage].declarationTitle}
                                        </h3>
                                        <div className={`space-y-4 ${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                            <p 
                                                dangerouslySetInnerHTML={{
                                                    __html: content[selectedLanguage].declaration
                                                        .replace('{name}', formData.candidateName ? `<span class="bg-yellow-200 underline font-semibold">${formData.candidateName} ${formData.candidateSurname}</span>` : "____________________________")
                                                        .replace('{zone}', formData.zone ? `<span class="bg-yellow-200 underline font-semibold">${zones.find(z => z.id === formData.zone)?.name || formData.zone}</span>` : "________________________")
                                                }}
                                            />
                                        </div>
                                        
                                        <div className="mt-4">
                                            <label className="flex items-start space-x-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    id="declaration-acceptance"
                                                    checked={declarationAccepted}
                                                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                                                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <span className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-sm'} text-gray-700`}>
                                                    {content[selectedLanguage].declarationAgreementText}
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Preview & Submit */}
                            {currentStep === 4 && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                        <div className="flex items-center space-x-2">
                                            <CheckCircle className="h-5 w-5 text-blue-600" />
                                            <h3 className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-base'} font-semibold text-blue-900`}>
                                                {selectedLanguage === 'english' ? 'Ready to Submit!' : 'સબમિટ કરવા માટે તૈયાર!'}
                                            </h3>
                                        </div>
                                        <p className={`${selectedLanguage === 'gujarati' ? 'text-base' : 'text-sm'} text-blue-700 mt-2`}>
                                            {selectedLanguage === 'english' 
                                                ? 'Please review all your information below. Once you submit, you will not be able to make changes.'
                                                : 'કૃપા કરીને નીચે તમારી બધી માહિતીની સમીક્ષા કરો. એકવાર તમે સબમિટ કરશો, તો તમે ફેરફાર કરી શકશો નહીં.'}
                                        </p>
                                    </div>

                                    {/* Candidate Information Preview */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <h4 className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-base'} font-semibold text-gray-900 mb-4 flex items-center`}>
                                            <User className="h-5 w-5 mr-2 text-blue-600" />
                                            {selectedLanguage === 'english' ? 'Candidate Information' : 'ઉમેદવારની માહિતી'}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600">{selectedLanguage === 'english' ? 'Full Name' : 'પૂરું નામ'}</p>
                                                <p className="font-medium text-gray-900">{formData.candidateName} {formData.candidateSurname}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{selectedLanguage === 'english' ? 'Father/Husband Name' : 'પિતા/પતિનું નામ'}</p>
                                                <p className="font-medium text-gray-900">{formData.candidateFatherSpouse}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{selectedLanguage === 'english' ? 'Gender' : 'લિંગ'}</p>
                                                <p className="font-medium text-gray-900">{formData.gender}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{selectedLanguage === 'english' ? 'Date of Birth' : 'જન્મ તારીખ'}</p>
                                                <p className="font-medium text-gray-900">{formatDateForDisplay(formData.birthDate)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{selectedLanguage === 'english' ? 'Mobile Number' : 'મોબાઇલ નંબર'}</p>
                                                <p className="font-medium text-gray-900">{formData.mobileNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{selectedLanguage === 'english' ? 'Email' : 'ઇમેઇલ'}</p>
                                                <p className="font-medium text-gray-900">{formData.emailId}</p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <p className="text-sm text-gray-600">{selectedLanguage === 'english' ? 'Address' : 'સરનામું'}</p>
                                                <p className="font-medium text-gray-900">{formData.permanentAddress}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{selectedLanguage === 'english' ? 'Zone' : 'વિભાગ'}</p>
                                                <p className="font-medium text-gray-900">{zones.find(z => z.id === formData.zone)?.name || formData.zone}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Proposer Information Preview */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <h4 className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-base'} font-semibold text-gray-900 mb-4 flex items-center`}>
                                            <Users className="h-5 w-5 mr-2 text-green-600" />
                                            {selectedLanguage === 'english' ? 'Proposer Information' : 'ટેકેદારની માહિતી'}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600">{selectedLanguage === 'english' ? 'Full Name' : 'પૂરું નામ'}</p>
                                                <p className="font-medium text-gray-900">{formData.proposerName} {formData.proposerSurname}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{selectedLanguage === 'english' ? 'Father/Husband Name' : 'પિતા/પતિનું નામ'}</p>
                                                <p className="font-medium text-gray-900">{formData.proposerFatherSpouse}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{selectedLanguage === 'english' ? 'Date of Birth' : 'જન્મ તારીખ'}</p>
                                                <p className="font-medium text-gray-900">{formatDateForDisplay(formData.proposerBirthDate)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{selectedLanguage === 'english' ? 'Mobile Number' : 'મોબાઇલ નંબર'}</p>
                                                <p className="font-medium text-gray-900">{formData.proposerMobile}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{selectedLanguage === 'english' ? 'Email' : 'ઇમેઇલ'}</p>
                                                <p className="font-medium text-gray-900">{formData.proposerEmail}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">{selectedLanguage === 'english' ? 'Zone' : 'વિભાગ'}</p>
                                                <p className="font-medium text-gray-900">{zones.find(z => z.id === formData.proposerZone)?.name || formData.proposerZone}</p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <p className="text-sm text-gray-600">{selectedLanguage === 'english' ? 'Address' : 'સરનામું'}</p>
                                                <p className="font-medium text-gray-900">{formData.proposerAddress}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Documents Preview */}
                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <h4 className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-base'} font-semibold text-gray-900 mb-4 flex items-center`}>
                                            <FileText className="h-5 w-5 mr-2 text-purple-600" />
                                            {selectedLanguage === 'english' ? 'Uploaded Documents' : 'અપલોડ કરેલા દસ્તાવેજો'}
                                        </h4>
                                        <div className="space-y-3">
                                            {/* Candidate Aadhaar Card */}
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                                <div className="flex items-center space-x-3">
                                                    <FileIcon className="h-5 w-5 text-blue-500" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {selectedLanguage === 'english' ? 'Candidate Aadhaar Card' : 'ઉમેદવારનું આધાર કાર્ડ'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formData.candidateAadhaar?.name || (selectedLanguage === 'english' ? 'Not uploaded' : 'અપલોડ નથી થયું')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {formData.candidateAadhaar && (
                                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                                    )}
                                                    {formData.candidateAadhaar && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDocumentPreview('aadhaar', formData.candidateAadhaar!, selectedLanguage === 'english' ? 'Candidate Aadhaar Card' : 'ઉમેદવારનું આધાર કાર્ડ')}
                                                            className="text-blue-600 hover:text-blue-700"
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            {selectedLanguage === 'english' ? 'Preview' : 'પૂર્વાવલોકન'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Candidate Photo */}
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                                <div className="flex items-center space-x-3">
                                                    <Image className="h-5 w-5 text-green-500" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {selectedLanguage === 'english' ? 'Candidate Photo' : 'ઉમેદવારનું ફોટો'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formData.candidatePhoto?.name || (selectedLanguage === 'english' ? 'Not uploaded' : 'અપલોડ નથી થયું')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {formData.candidatePhoto && (
                                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                                    )}
                                                    {formData.candidatePhoto && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDocumentPreview('photo', formData.candidatePhoto!, selectedLanguage === 'english' ? 'Candidate Photo' : 'ઉમેદવારનું ફોટો')}
                                                            className="text-blue-600 hover:text-blue-700"
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            {selectedLanguage === 'english' ? 'Preview' : 'પૂર્વાવલોકન'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Proposer Aadhaar Card */}
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                                <div className="flex items-center space-x-3">
                                                    <FileIcon className="h-5 w-5 text-blue-500" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {selectedLanguage === 'english' ? 'Proposer Aadhaar Card' : 'ટેકેદારનું આધાર કાર્ડ'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formData.proposerAadhaar?.name || (selectedLanguage === 'english' ? 'Not uploaded' : 'અપલોડ નથી થયું')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {formData.proposerAadhaar && (
                                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                                    )}
                                                    {formData.proposerAadhaar && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDocumentPreview('proposer_aadhaar', formData.proposerAadhaar!, selectedLanguage === 'english' ? 'Proposer Aadhaar Card' : 'ટેકેદારનું આધાર કાર્ડ')}
                                                            className="text-blue-600 hover:text-blue-700"
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            {selectedLanguage === 'english' ? 'Preview' : 'પૂર્વાવલોકન'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Final Declaration Preview */}
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                                        <h4 className={`${selectedLanguage === 'gujarati' ? 'text-lg' : 'text-base'} font-semibold text-yellow-900 mb-4 flex items-center`}>
                                            <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                                            {selectedLanguage === 'english' ? 'Declaration' : 'ઘોષણા'}
                                        </h4>
                                        <div className={`${selectedLanguage === 'gujarati' ? 'text-base' : 'text-sm'} text-yellow-800`}>
                                            <p 
                                                dangerouslySetInnerHTML={{
                                                    __html: content[selectedLanguage].declaration
                                                        .replace('{name}', `<span class="bg-yellow-200 underline font-semibold">${formData.candidateName} ${formData.candidateSurname}</span>`)
                                                        .replace('{zone}', `<span class="bg-yellow-200 underline font-semibold">${zones.find(z => z.id === formData.zone)?.name || formData.zone}</span>`)
                                                }}
                                            />
                                        </div>
                                        <div className="mt-4 flex items-center space-x-2">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <span className={`${selectedLanguage === 'gujarati' ? 'text-base' : 'text-sm'} text-green-800 font-medium`}>
                                                {selectedLanguage === 'english' ? 'Declaration accepted' : 'ઘોષણા સ્વીકારી'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex flex-col sm:flex-row justify-between mt-6 sm:mt-8 space-y-3 sm:space-y-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setCurrentStep(
                                            Math.max(0, currentStep - 1),
                                        );
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={currentStep === 0}
                                    className="w-full sm:w-auto"
                                >
                                    {content[selectedLanguage].previous}
                                </Button>

                                {currentStep < 3 ? (
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setCurrentStep(currentStep + 1);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        disabled={!validateStep(currentStep)}
                                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {currentStep === 0 ? content[selectedLanguage].acceptAndContinue : content[selectedLanguage].next}
                                    </Button>
                                ) : currentStep === 3 ? (
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setCurrentStep(currentStep + 1);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        disabled={!validateStep(currentStep)}
                                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {content[selectedLanguage].previewAndSubmit}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={
                                            !validateStep(currentStep) ||
                                            isLoading
                                        }
                                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {isLoading
                                            ? content[selectedLanguage].submitting
                                            : content[selectedLanguage].submit}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Help Section */}
                    <div className="mt-6 p-4 sm:p-6 bg-white rounded-lg shadow-lg">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">
                            Need Help?
                        </h3>
                        <p className="text-xs text-gray-600 mb-3">
                            Contact our support team for any assistance with
                            nomination submission:
                        </p>
                        <div className="space-y-1 text-xs text-gray-700">
                            <div className="flex justify-between">
                                <span className="font-medium">
                                    Jay Deepak Bhutada:
                                </span>
                                <a 
                                    href="tel:+919820216044" 
                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                >
                                    9820216044
                                </a>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">
                                    Aditya Nirmal Mall:
                                </span>
                                <a 
                                    href="tel:+918097758892" 
                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                >
                                    8097758892
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Document Preview Modal */}
            {showDocumentPreview && previewDocument && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {previewDocument.title}
                            </h3>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDocumentPreview(false);
                                    setPreviewDocument(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </Button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                            {previewDocument.type === 'photo' ? (
                                <div className="flex justify-center">
                                    <img
                                        src={URL.createObjectURL(previewDocument.file)}
                                        alt={previewDocument.title}
                                        className="max-w-full max-h-[70vh] object-contain border border-gray-300 rounded"
                                    />
                                </div>
                            ) : (
                                <iframe
                                    src={URL.createObjectURL(previewDocument.file)}
                                    className="w-full h-[70vh] border border-gray-300 rounded"
                                    title={previewDocument.title}
                                />
                            )}
                        </div>
                        <div className="flex justify-end p-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDocumentPreview(false);
                                    setPreviewDocument(null);
                                }}
                            >
                                {selectedLanguage === 'english' ? 'Close' : 'બંધ કરો'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
