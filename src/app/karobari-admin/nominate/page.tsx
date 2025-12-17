"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { Building, ArrowLeft, Save, CheckCircle, AlertCircle, Calendar, Image, Upload } from "lucide-react";
import Logo from "@/components/Logo";
import { FileUploadStorj } from "@/components/ui/file-upload-storj";
import Footer from "@/components/Footer";

interface NominationFormData {
  // Office Use Fields (Admin fills)
  formNumber: string;
  formTakenDate: string;
  formAcceptedDate: string;
  outwardNumber: string;
  inwardNumber: string;
  feeReceiptNumber: string;

  // Candidate Details
  candidateName: string;
  candidateFatherSpouse: string;
  candidateSurname: string;
  aliasNickname: string;
  currentAddress: string;
  gender: string;
  dateOfBirth: string;
  mobileNumber: string;
  email: string;
  zoneId: string;

  // Supporter/Proposer Details
  supporterName: string;
  supporterFatherSpouse: string;
  supporterSurname: string;
  supporterAddress: string;
  supporterMobile: string;

  // Photo Upload
  candidatePhoto: File | null;
  candidatePhotoFileKey: string;
}

export default function KarobariNominatePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [zones, setZones] = useState<any[]>([]);
  const [formData, setFormData] = useState<NominationFormData>({
    formNumber: "",
    formTakenDate: "",
    formAcceptedDate: "",
    outwardNumber: "",
    inwardNumber: "",
    feeReceiptNumber: "",
    candidateName: "",
    candidateFatherSpouse: "",
    candidateSurname: "",
    aliasNickname: "",
    currentAddress: "",
    gender: "",
    dateOfBirth: "",
    mobileNumber: "",
    email: "",
    zoneId: "",
    supporterName: "",
    supporterFatherSpouse: "",
    supporterSurname: "",
    supporterAddress: "",
    supporterMobile: "",
    candidatePhoto: null,
    candidatePhotoFileKey: "",
  });

  useEffect(() => {
    if (status === "loading") return; // Do nothing while loading
    if (!session || session.user.role !== "KAROBARI_ADMIN") {
      router.push("/karobari-admin/login"); // Redirect if not authenticated or not Karobari Admin
    } else {
      fetchZones();
    }
  }, [session, status, router]);

  const fetchZones = async () => {
    try {
      const response = await fetch("/api/zones?electionType=KAROBARI_MEMBERS");
      if (response.ok) {
        const data = await response.json();
        setZones(data.zones || []);
      }
    } catch (error) {
      console.error("Error fetching zones:", error);
    }
  };

  const handleInputChange = (
    field: keyof NominationFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handlePhotoSelect = (file: File) => {
    setFormData((prev) => ({ ...prev, candidatePhoto: file, candidatePhotoFileKey: "" }));
    if (error) setError("");
  };

  const handlePhotoRemove = () => {
    setFormData((prev) => ({ ...prev, candidatePhoto: null, candidatePhotoFileKey: "" }));
  };

  // Helper function to upload file to Storj
  const uploadFileToStorj = async (
    file: File,
    fileType: string,
    candidateId: string
  ): Promise<{ fileKey: string }> => {
    try {
      // Get pre-signed URL from Storj
      const response = await fetch("/api/upload/presigned-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          candidateId,
          fileType,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to get upload URL. Please ensure Storj is configured."
        );
      }

      const { uploadUrl, fileKey } = await response.json();

      // Upload file to Storj
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to Storj");
      }

      // Notify backend that upload is complete
      const completeResponse = await fetch("/api/upload/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fileKey,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
          fileType,
        }),
      });

      if (!completeResponse.ok) {
        throw new Error("Failed to complete upload");
      }

      return { fileKey };
    } catch (error: any) {
      console.error("Upload error:", error);
      throw new Error(error.message || "Failed to upload file");
    }
  };

  const validateForm = (): boolean => {
    // Required fields validation
    const requiredFields: Array<keyof NominationFormData> = [
      "candidateName",
      "candidateFatherSpouse",
      "candidateSurname",
      "currentAddress",
      "gender",
      "dateOfBirth",
      "mobileNumber",
      "email",
      "zoneId",
      "supporterName",
      "supporterFatherSpouse",
      "supporterSurname",
      "supporterAddress",
      "supporterMobile",
    ];

    for (const field of requiredFields) {
      const value = formData[field];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        setError(`Please fill in all required fields. Missing: ${field}`);
        return false;
      }
    }

    // Validate photo upload (mandatory)
    if (!formData.candidatePhoto) {
      setError("Candidate photo is required. Please upload a photograph.");
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    // Mobile validation (10 digits)
    if (formData.mobileNumber.length !== 10 || !/^\d{10}$/.test(formData.mobileNumber)) {
      setError("Mobile number must be 10 digits");
      return false;
    }

    if (formData.supporterMobile.length !== 10 || !/^\d{10}$/.test(formData.supporterMobile)) {
      setError("Supporter mobile number must be 10 digits");
      return false;
    }

    // Date validation (DD-MM-YYYY)
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dateRegex.test(formData.dateOfBirth)) {
      setError("Date of birth must be in DD-MM-YYYY format");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      let photoFileKey = "";

      // Upload photo (mandatory)
      if (!formData.candidatePhoto) {
        setError("Candidate photo is required. Please upload a photograph.");
        setIsLoading(false);
        return;
      }

      try {
        setIsUploadingPhoto(true);
        const tempCandidateId = session?.user?.id || "temp";
        const uploadResult = await uploadFileToStorj(
          formData.candidatePhoto,
          "photo",
          tempCandidateId
        );
        photoFileKey = uploadResult.fileKey;
        setFormData((prev) => ({
          ...prev,
          candidatePhotoFileKey: photoFileKey,
        }));
      } catch (uploadError: any) {
        setError(
          `Failed to upload candidate photo: ${uploadError.message}`
        );
        setIsLoading(false);
        setIsUploadingPhoto(false);
        return;
      } finally {
        setIsUploadingPhoto(false);
      }

      const formDataToSend = new FormData();

      // Add all form fields (excluding File objects)
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "candidatePhoto") {
          // Skip File object, use fileKey instead
          return;
        }
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, String(value));
        }
      });

      // Add photo fileKey if uploaded
      if (photoFileKey) {
        formDataToSend.append("candidatePhotoFileKey", photoFileKey);
      }

      const response = await fetch("/api/karobari-admin/nominate", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Reset form after successful submission
        setFormData({
          formNumber: "",
          formTakenDate: "",
          formAcceptedDate: "",
          outwardNumber: "",
          inwardNumber: "",
          feeReceiptNumber: "",
          candidateName: "",
          candidateFatherSpouse: "",
          candidateSurname: "",
          aliasNickname: "",
          currentAddress: "",
          gender: "",
          dateOfBirth: "",
          mobileNumber: "",
          email: "",
          zoneId: "",
          supporterName: "",
          supporterFatherSpouse: "",
          supporterSurname: "",
          supporterAddress: "",
          supporterMobile: "",
          candidatePhoto: null,
          candidatePhotoFileKey: "",
        });
        
        // Redirect to candidates list after 2 seconds
        setTimeout(() => {
          router.push("/karobari-admin/candidates");
        }, 2000);
      } else {
        setError(data.error || "Failed to submit nomination");
      }
    } catch (error) {
      console.error("Error submitting nomination:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setIsUploadingPhoto(false);
    }
  };

  if (status === "loading" || !session || session.user.role !== "KAROBARI_ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Logo size="md" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Karobari Candidate Nomination
                </h1>
              </div>
            </div>
            <Link href="/karobari-admin/dashboard">
              <Button variant="outline" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Building className="h-6 w-6 text-blue-600" />
              <CardTitle>કારોબારી સમિતિ ચુંટણી (૨૦૨૬-૨૦૨૯)</CardTitle>
            </div>
            <CardDescription>
              Enter candidate details from the hard copy nomination form
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-md">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 flex items-center space-x-2 text-green-600 bg-green-50 p-4 rounded-md">
                <CheckCircle className="h-5 w-5" />
                <span>Nomination submitted successfully! Redirecting...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Office Use Section */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Office Use (Admin Only)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="formNumber">Form Number (ફોર્મ નંબર)</Label>
                    <Input
                      id="formNumber"
                      value={formData.formNumber}
                      onChange={(e) => handleInputChange("formNumber", e.target.value)}
                      placeholder="Enter form number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="formTakenDate">Date of Taking Form (ઉમેદવારી પત્રક લીધાની તા.)</Label>
                    <Input
                      id="formTakenDate"
                      type="date"
                      value={formData.formTakenDate}
                      onChange={(e) => handleInputChange("formTakenDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="formAcceptedDate">Date of Accepting Form (ઉમેદવારી પત્રક સ્વીકારવાની તા.)</Label>
                    <Input
                      id="formAcceptedDate"
                      type="date"
                      value={formData.formAcceptedDate}
                      onChange={(e) => handleInputChange("formAcceptedDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="outwardNumber">Outward Number (જાવક નંબર)</Label>
                    <Input
                      id="outwardNumber"
                      value={formData.outwardNumber}
                      onChange={(e) => handleInputChange("outwardNumber", e.target.value)}
                      placeholder="Enter outward number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="inwardNumber">Inward Number (આવક નંબર)</Label>
                    <Input
                      id="inwardNumber"
                      value={formData.inwardNumber}
                      onChange={(e) => handleInputChange("inwardNumber", e.target.value)}
                      placeholder="Enter inward number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="feeReceiptNumber">Election Fee Receipt No. (ચુંટણી ફી ૩,૦૦૦/- ભર્યા ની રસીદ નંબર)</Label>
                    <Input
                      id="feeReceiptNumber"
                      value={formData.feeReceiptNumber}
                      onChange={(e) => handleInputChange("feeReceiptNumber", e.target.value)}
                      placeholder="Enter receipt number"
                    />
                  </div>
                </div>
              </div>

              {/* Candidate Details Section */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Candidate Details (ઉમેદવારની વિગતો)
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label>
                      (1) Candidate's Full Name (with original surname) 
                      <span className="text-red-500">*</span>
                      <br />
                      <span className="text-sm text-gray-600">(ઉમેદવાર નું પૂર્ણ નામ - મુળ અટક સાથે)</span>
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div>
                        <Input
                          placeholder="Name (નામ)"
                          value={formData.candidateName}
                          onChange={(e) => handleInputChange("candidateName", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Father/Husband Name (પિતાશ્રી/પતિ)"
                          value={formData.candidateFatherSpouse}
                          onChange={(e) => handleInputChange("candidateFatherSpouse", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Surname (મુળ અટક)"
                          value={formData.candidateSurname}
                          onChange={(e) => handleInputChange("candidateSurname", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="aliasNickname">
                      (2) Other Name/Nickname (if any) - Write N.A. if not applicable
                      <br />
                      <span className="text-sm text-gray-600">(ઉમેદવાર નું અન્ય કોઈ નામ - N.A. જો લાગુ ન પડતો હોય)</span>
                    </Label>
                    <Input
                      id="aliasNickname"
                      value={formData.aliasNickname}
                      onChange={(e) => handleInputChange("aliasNickname", e.target.value)}
                      placeholder="Enter nickname or N.A."
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentAddress">
                      (3) Current Residential Address (as per Aadhar Card)
                      <span className="text-red-500">*</span>
                      <br />
                      <span className="text-sm text-gray-600">(વર્તમાન નિવાસસ્થાન સરનામું - આધાર કાર્ડ મુજબ)</span>
                    </Label>
                    <Textarea
                      id="currentAddress"
                      value={formData.currentAddress}
                      onChange={(e) => handleInputChange("currentAddress", e.target.value)}
                      placeholder="Enter full address"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gender">
                        (4) Gender (લિંગ) <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => handleInputChange("gender", value)}
                        required
                      >
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male (પુરુષ)</SelectItem>
                          <SelectItem value="FEMALE">Female (સ્ત્રી)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="dateOfBirth">
                        (5) Date of Birth (જન્મ તારીખ) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                        placeholder="DD-MM-YYYY"
                        pattern="\d{2}-\d{2}-\d{4}"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mobileNumber">
                        (6) Mobile Number (મોબાઈલ નંબર) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="mobileNumber"
                        type="tel"
                        value={formData.mobileNumber}
                        onChange={(e) => handleInputChange("mobileNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10 digit mobile number"
                        maxLength={10}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">
                        (7) E-mail (ઇ-મેલ) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>
                      Candidate Photo (ઉમેદવાર નો ફોટો) <span className="text-red-500">*</span>
                      <br />
                      <span className="text-sm text-gray-600">
                        Upload a recent passport size photograph (JPG, PNG, Max 5MB) - Required
                      </span>
                    </Label>
                    <div className="mt-2">
                      <FileUploadStorj
                        onFileSelected={handlePhotoSelect}
                        onFileRemoved={handlePhotoRemove}
                        fileType="photo"
                        candidateId={session?.user?.id || "temp"}
                        accept="image/jpeg,image/png,image/jpg"
                        maxSizeMB={5}
                        selectedFile={formData.candidatePhoto}
                      />
                    </div>
                    {formData.candidatePhoto && (
                      <p className="mt-2 text-sm text-green-600 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Photo selected: {formData.candidatePhoto.name}
                      </p>
                    )}
                    {isUploadingPhoto && (
                      <p className="mt-2 text-sm text-blue-600 flex items-center">
                        <Upload className="h-4 w-4 mr-1 animate-spin" />
                        Uploading photo...
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="zoneId">
                      (8) Zone Number and Name (A+B) <span className="text-red-500">*</span>
                      <br />
                      <span className="text-sm text-gray-600">(ઇચ્છુક ઉમેદવારી નોંધાવવા માટે ઝોન ક્રમાંક અને નામ)</span>
                    </Label>
                    <Select
                      value={formData.zoneId}
                      onValueChange={(value) => handleInputChange("zoneId", value)}
                      required
                    >
                      <SelectTrigger id="zoneId">
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name} ({zone.nameGujarati}) - {zone.seats} Seats
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Supporter Details Section */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Supporter/Proposer Details (ટેકેદારની વિગતો)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  I support the candidacy of the above candidate. Full name of the local supporter (including original surname), full address, and mobile number.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <Label>
                      (9) Supporter's Full Name (with original surname)
                      <span className="text-red-500">*</span>
                      <br />
                      <span className="text-sm text-gray-600">(ટેકેદાર નું પૂર્ણ નામ - મુળ અટક સહિત)</span>
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div>
                        <Input
                          placeholder="Name (નામ)"
                          value={formData.supporterName}
                          onChange={(e) => handleInputChange("supporterName", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Father/Husband Name (પિતાશ્રી/પતિ)"
                          value={formData.supporterFatherSpouse}
                          onChange={(e) => handleInputChange("supporterFatherSpouse", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Surname (મુળ અટક)"
                          value={formData.supporterSurname}
                          onChange={(e) => handleInputChange("supporterSurname", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="supporterAddress">
                      Supporter's Full Address <span className="text-red-500">*</span>
                      <br />
                      <span className="text-sm text-gray-600">(ટેકેદારનું પૂર્ણ સરનામું)</span>
                    </Label>
                    <Textarea
                      id="supporterAddress"
                      value={formData.supporterAddress}
                      onChange={(e) => handleInputChange("supporterAddress", e.target.value)}
                      placeholder="Enter full address"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="supporterMobile">
                      (10) Supporter's Mobile Number <span className="text-red-500">*</span>
                      <br />
                      <span className="text-sm text-gray-600">(ટેકેદારનો મોબાઈલ નંબર)</span>
                    </Label>
                    <Input
                      id="supporterMobile"
                      type="tel"
                      value={formData.supporterMobile}
                      onChange={(e) => handleInputChange("supporterMobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10 digit mobile number"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Declaration Section */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Declaration (ઘોષણા)
                </h3>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  આ સાથે શ્રી કચ્છી માહેશ્વરી મધ્યસ્થ મહાજન સમિતિ ની કારોબારી સમિતિ માં સભ્ય ની ચુંટણી વર્ષ ૨૦૨૬-૨૦૨૯ માટે ઉમેદવારી નોંધાવું છું. તથા આપણા જ્ઞાતિના બંધારણ માં સુચવેલ સર્વે નિયમો અને ચુંટણી નિયામક દ્વારા નિર્ધારિત સર્વે નિયમો મને બંધનકર્તા રહેશે, અને હું તે સર્વે નું પાલન કરીશ તેવી બાયંધરી આપું છું.
                </p>
                <p className="text-sm text-gray-600 italic">
                  (With this, I am submitting my candidacy for the election of a member in the Executive Committee of Shri Kutchhi Maheshwari Madhyasth Mahajan Samiti for the year 2026-2029. And I assure that all the rules suggested in our community's constitution and all the rules determined by the election officer will be binding on me, and I will abide by all of them.)
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6">
                <Link href="/karobari-admin/dashboard">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isLoading || isUploadingPhoto || !formData.candidatePhoto}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isUploadingPhoto
                    ? "Uploading Photo..."
                    : isLoading
                    ? "Submitting..."
                    : !formData.candidatePhoto
                    ? "Please Upload Photo First"
                    : "Submit Nomination"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
