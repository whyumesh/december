"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Building,
  ArrowLeft,
  Users,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  Eye,
  Image,
} from "lucide-react";
import Logo from "@/components/Logo";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  rejectionReason?: string;
  region: string;
  position: string;
  zone: string;
  createdAt: string;
  candidateDetails?: {
    fatherSpouseName: string;
    surname: string;
    aliasNickname: string;
    gender: string;
    dateOfBirth: string;
  };
  supporter?: {
    name: string;
    address: string;
    mobile: string;
  };
  officeUse?: {
    formNumber?: string;
    formTakenDate?: string;
    formAcceptedDate?: string;
    feeReceiptNumber?: string;
  };
  photoFileKey?: string;
}

export default function KarobariCandidatesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "KAROBARI_ADMIN") {
      router.push("/karobari-admin/login");
      return;
    }
    fetchCandidates();
  }, [session, status, router]);

  // Generate photo URLs for candidates with photos
  useEffect(() => {
    const generatePhotoUrls = async () => {
      const urls: Record<string, string> = {};
      
      for (const candidate of candidates) {
        if (candidate.photoFileKey) {
          try {
            const response = await fetch("/api/admin/view-document", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ fileKey: candidate.photoFileKey }),
            });

            if (response.ok) {
              const data = await response.json();
              urls[candidate.id] = data.downloadUrl || data.url;
            }
          } catch (error) {
            console.error(`Error generating URL for candidate ${candidate.id}:`, error);
          }
        }
      }

      setPhotoUrls(urls);
    };

    if (candidates.length > 0) {
      generatePhotoUrls();
    }
  }, [candidates]);

  const fetchCandidates = async () => {
    try {
      const response = await fetch("/api/karobari-admin/candidates", {
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCandidates(data.candidates || []);
      } else {
        setError("Failed to load candidates");
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
      setError("An error occurred while loading candidates");
    } finally {
      setIsLoading(false);
    }
  };

  const updateCandidateStatus = async (
    candidateId: string,
    newStatus: string,
    reason?: string
  ) => {
    setIsUpdating(true);
    setError("");
    setSuccess("");

    try {
      if (newStatus === "REJECTED" && !reason?.trim()) {
        setError("Rejection reason is required when rejecting a candidate");
        setIsUpdating(false);
        return;
      }

      const response = await fetch(`/api/karobari-admin/candidates/${candidateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          rejectionReason: reason,
        }),
      });

      if (response.ok) {
        setSuccess(
          newStatus === "APPROVED"
            ? "✅ Candidate approved successfully!"
            : "✅ Candidate rejected successfully!"
        );

        // Refresh candidates list
        await fetchCandidates();

        // Update selected candidate if it's the one being updated
        if (selectedCandidate?.id === candidateId) {
          const updatedCandidates = await fetch(
            "/api/karobari-admin/candidates"
          ).then((res) => res.json());
          const updated = updatedCandidates.candidates.find(
            (c: Candidate) => c.id === candidateId
          );
          if (updated) {
            setSelectedCandidate(updated);
            setRejectionReason("");
          }
        }

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update candidate status");
      }
    } catch (error) {
      console.error("Error updating candidate status:", error);
      setError("An error occurred while updating candidate status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewPhoto = async (fileKey: string) => {
    try {
      const response = await fetch("/api/admin/view-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileKey }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewPhotoUrl(data.url);
      } else {
        setError("Failed to load photo");
      }
    } catch (error) {
      console.error("Error viewing photo:", error);
      setError("Failed to load photo");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-800">Approved</Badge>
        );
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "SUBMITTED":
        return (
          <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
        );
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
                  Karobari Candidates
                </h1>
                <p className="text-gray-600">
                  Manage and review Karobari candidate nominations
                </p>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-md">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center space-x-2 text-green-600 bg-green-50 p-4 rounded-md">
            <CheckCircle className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidates List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-6 w-6 text-blue-600" />
                    <CardTitle>All Candidates</CardTitle>
                  </div>
                  <Link href="/karobari-admin/nominate">
                    <Button size="sm">Add New</Button>
                  </Link>
                </div>
                <CardDescription>
                  {candidates.length} candidate(s) found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading candidates...</p>
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No candidates found.</p>
                    <Link href="/karobari-admin/nominate">
                      <Button className="mt-4">Add First Candidate</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {candidates.map((candidate) => (
                      <Card
                        key={candidate.id}
                        className={`cursor-pointer transition-all ${
                          selectedCandidate?.id === candidate.id
                            ? "border-blue-500 bg-blue-50"
                            : "hover:border-gray-300"
                        }`}
                        onClick={async () => {
                          setSelectedCandidate(candidate);
                          setRejectionReason(candidate.rejectionReason || "");
                          setError("");
                          setSuccess("");
                          
                          // Generate photo URL if not already cached
                          if (candidate.photoFileKey && !photoUrls[candidate.id]) {
                            try {
                              const response = await fetch("/api/admin/view-document", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ fileKey: candidate.photoFileKey }),
                              });

                              if (response.ok) {
                                const data = await response.json();
                                setPhotoUrls((prev) => ({
                                  ...prev,
                                  [candidate.id]: data.downloadUrl || data.url,
                                }));
                              }
                            } catch (error) {
                              console.error("Error generating photo URL:", error);
                            }
                          }
                        }}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between gap-2">
                            {candidate.photoFileKey && photoUrls[candidate.id] ? (
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                <img
                                  src={photoUrls[candidate.id]}
                                  alt={candidate.name}
                                  className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                                  onClick={() => handleViewPhoto(candidate.photoFileKey!)}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : candidate.photoFileKey ? (
                              <div className="w-12 h-12 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center">
                                <Image className="h-6 w-6 text-blue-400 animate-pulse" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
                                <Users className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate">
                                {candidate.name}
                              </h3>
                              <p className="text-xs text-gray-600 truncate">
                                {candidate.email}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Zone: {candidate.zone}
                              </p>
                            </div>
                            <div className="ml-2">
                              {getStatusBadge(candidate.status)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Candidate Details */}
          <div className="lg:col-span-2">
            {selectedCandidate ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Candidate Details</CardTitle>
                    {getStatusBadge(selectedCandidate.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Candidate Photo */}
                  {selectedCandidate.photoFileKey && (
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        {photoUrls[selectedCandidate.id] ? (
                          <>
                            <img
                              src={photoUrls[selectedCandidate.id]}
                              alt={selectedCandidate.name}
                              className="w-48 h-48 object-cover rounded-lg border-4 border-blue-100 shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => handleViewPhoto(selectedCandidate.photoFileKey!)}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute bottom-2 right-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewPhoto(selectedCandidate.photoFileKey!)}
                                className="bg-white/90 hover:bg-white"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Full Size
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="w-48 h-48 rounded-lg border-4 border-blue-100 bg-blue-50 flex items-center justify-center">
                            <div className="text-center">
                              <Image className="h-12 w-12 text-blue-400 mx-auto mb-2 animate-pulse" />
                              <p className="text-sm text-blue-600">Loading photo...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Basic Information */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4 text-gray-900">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <p className="text-gray-900">{selectedCandidate.name}</p>
                      </div>
                      {selectedCandidate.candidateDetails?.fatherSpouseName && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Father/Husband Name
                          </label>
                          <p className="text-gray-900">
                            {selectedCandidate.candidateDetails.fatherSpouseName}
                          </p>
                        </div>
                      )}
                      {selectedCandidate.candidateDetails?.surname && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Surname
                          </label>
                          <p className="text-gray-900">
                            {selectedCandidate.candidateDetails.surname}
                          </p>
                        </div>
                      )}
                      {selectedCandidate.candidateDetails?.aliasNickname &&
                        selectedCandidate.candidateDetails.aliasNickname !==
                          "N.A." && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">
                              Alias/Nickname
                            </label>
                            <p className="text-gray-900">
                              {
                                selectedCandidate.candidateDetails.aliasNickname
                              }
                            </p>
                          </div>
                        )}
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <p className="text-gray-900">
                          {selectedCandidate.email || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Mobile
                        </label>
                        <p className="text-gray-900">
                          {selectedCandidate.phone || "N/A"}
                        </p>
                      </div>
                      {selectedCandidate.candidateDetails?.gender && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Gender
                          </label>
                          <p className="text-gray-900">
                            {selectedCandidate.candidateDetails.gender === "MALE"
                              ? "Male"
                              : "Female"}
                          </p>
                        </div>
                      )}
                      {selectedCandidate.candidateDetails?.dateOfBirth && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Date of Birth
                          </label>
                          <p className="text-gray-900">
                            {selectedCandidate.candidateDetails.dateOfBirth}
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Zone
                        </label>
                        <p className="text-gray-900">{selectedCandidate.zone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Region
                        </label>
                        <p className="text-gray-900">
                          {selectedCandidate.region}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Supporter Information */}
                  {selectedCandidate.supporter && (
                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-lg mb-4 text-gray-900">
                        Supporter/Proposer Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Name
                          </label>
                          <p className="text-gray-900">
                            {selectedCandidate.supporter.name}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Mobile
                          </label>
                          <p className="text-gray-900">
                            {selectedCandidate.supporter.mobile}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-700">
                            Address
                          </label>
                          <p className="text-gray-900">
                            {selectedCandidate.supporter.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Office Use Information */}
                  {selectedCandidate.officeUse && (
                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-lg mb-4 text-gray-900">
                        Office Use
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedCandidate.officeUse.formNumber && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">
                              Form Number
                            </label>
                            <p className="text-gray-900">
                              {selectedCandidate.officeUse.formNumber}
                            </p>
                          </div>
                        )}
                        {selectedCandidate.officeUse.feeReceiptNumber && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">
                              Fee Receipt Number
                            </label>
                            <p className="text-gray-900">
                              {selectedCandidate.officeUse.feeReceiptNumber}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason (if rejected) */}
                  {selectedCandidate.status === "REJECTED" &&
                    selectedCandidate.rejectionReason && (
                      <div className="border-t pt-6">
                        <h3 className="font-semibold text-lg mb-2 text-red-600">
                          Rejection Reason
                        </h3>
                        <p className="text-gray-700 bg-red-50 p-3 rounded">
                          {selectedCandidate.rejectionReason}
                        </p>
                      </div>
                    )}

                  {/* Action Buttons - Show for PENDING and SUBMITTED statuses */}
                  {(selectedCandidate.status === "PENDING" ||
                    selectedCandidate.status === "SUBMITTED") && (
                    <div className="border-t pt-6 mt-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">
                        Review Actions
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            Rejection Reason{" "}
                            <span className="text-gray-400">
                              (required if rejecting)
                            </span>
                          </label>
                          <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter reason for rejection (required for rejection)..."
                            rows={3}
                            className="w-full"
                          />
                        </div>
                        <div className="flex space-x-4">
                          <Button
                            onClick={() =>
                              updateCandidateStatus(
                                selectedCandidate.id,
                                "APPROVED"
                              )
                            }
                            disabled={isUpdating}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                            size="lg"
                          >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Approve Candidate
                          </Button>
                          <Button
                            onClick={() =>
                              updateCandidateStatus(
                                selectedCandidate.id,
                                "REJECTED",
                                rejectionReason
                              )
                            }
                            disabled={isUpdating || !rejectionReason.trim()}
                            variant="destructive"
                            className="px-6 py-2"
                            size="lg"
                          >
                            <XCircle className="h-5 w-5 mr-2" />
                            Reject Candidate
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show current status if already approved or rejected */}
                  {selectedCandidate.status === "APPROVED" && (
                    <div className="border-t pt-6 mt-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-green-800">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-semibold">
                            This candidate has been approved.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCandidate.status === "REJECTED" &&
                    !selectedCandidate.rejectionReason && (
                      <div className="border-t pt-6 mt-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 text-red-800">
                            <XCircle className="h-5 w-5" />
                            <span className="font-semibold">
                              This candidate has been rejected.
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Select a candidate from the list to view details
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Photo Preview Modal */}
        {previewPhotoUrl && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewPhotoUrl(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img
                src={previewPhotoUrl}
                alt="Candidate Photo"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewPhotoUrl(null)}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
