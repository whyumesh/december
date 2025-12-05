import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken, JWTError } from "@/lib/jwt";
import { isEligibleToBeCandidate, calculateAge, calculateAgeAsOf } from "@/lib/age-validation";
import { sanitizeFilename } from "@/lib/file-upload";
import { candidateNominationSchema, sanitizeInput } from "@/lib/validation";
import { createRateLimitedRoute, rateLimitConfigs } from "@/lib/rate-limit";
import { withCSRFProtection } from "@/lib/csrf";

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0


async function handler(request: NextRequest) {
    try {
        const token = request.cookies.get("candidate-token")?.value;

        console.log("Nomination API - Token received:", !!token);
        console.log("Nomination API - All cookies:", request.cookies.getAll());

        if (!token) {
            console.log("No candidate token found");
            return NextResponse.json(
                { error: "Unauthorized - Please login first" },
                { status: 401 },
            );
        }

        let decoded;
        try {
            decoded = verifyToken(token);
            console.log("Token decoded successfully:", decoded);
        } catch (jwtError) {
            console.error("JWT verification failed:", jwtError);
            return NextResponse.json(
                { error: "Invalid token - Please login again" },
                { status: 401 },
            );
        }

        // Get form data
        const formData = await request.formData();

        // Extract and sanitize candidate details
        const candidateName = sanitizeInput(
            (formData.get("candidateName") as string) || "",
        );
        const candidateFatherSpouse = sanitizeInput(
            (formData.get("candidateFatherSpouse") as string) || "",
        );
        const candidateSurname = sanitizeInput(
            (formData.get("candidateSurname") as string) || "",
        );
        const aliasNickname = sanitizeInput(
            (formData.get("aliasNickname") as string) || "",
        );
        const permanentAddress = sanitizeInput(
            (formData.get("permanentAddress") as string) || "",
        );
        const gender = formData.get("gender") as string;
        const birthDate = formData.get("birthDate") as string;
        const mobileNumber = formData.get("mobileNumber") as string;
        const emailId = formData.get("emailId") as string;
        const zone = formData.get("zone") as string;

        // Extract and sanitize proposer details
        const proposerName = sanitizeInput(
            (formData.get("proposerName") as string) || "",
        );
        const proposerFatherSpouse = sanitizeInput(
            (formData.get("proposerFatherSpouse") as string) || "",
        );
        const proposerSurname = sanitizeInput(
            (formData.get("proposerSurname") as string) || "",
        );
        const proposerAddress = sanitizeInput(
            (formData.get("proposerAddress") as string) || "",
        );
        const proposerBirthDate = formData.get("proposerBirthDate") as string;
        const proposerMobile = formData.get("proposerMobile") as string;
        const proposerEmail = formData.get("proposerEmail") as string;

        // Handle file keys (from Storj uploads) - these are fileKeys, not URLs
        const candidateAadhaarFileKey = formData.get("candidateAadhaarUrl") as string; // Form sends fileKey here
        const candidatePhotoFileKey = formData.get("candidatePhotoUrl") as string; // Form sends fileKey here
        const proposerAadhaarFileKey = formData.get("proposerAadhaarUrl") as string; // Form sends fileKey here

        // Validate form data using schema
        const validationData = {
            candidateName,
            candidateSurname,
            candidateFatherSpouse,
            aliasNickname,
            permanentAddress,
            gender,
            birthDate,
            mobileNumber,
            emailId,
            zone,
            proposerName,
            proposerSurname,
            proposerFatherSpouse,
            proposerAddress,
            proposerBirthDate,
            proposerMobile,
            proposerEmail,
        };

        const validation = candidateNominationSchema.safeParse(validationData);
        if (!validation.success) {
            return NextResponse.json(
                {
                    error:
                        "Validation failed: " +
                        validation.error.errors
                            .map((e) => e.message)
                            .join(", "),
                },
                { status: 400 },
            );
        }

        // Validate file keys - these should be fileKeys from Storj, not URLs
        if (!candidateAadhaarFileKey || !candidatePhotoFileKey || !proposerAadhaarFileKey) {
            return NextResponse.json(
                {
                    error: "All required documents must be uploaded successfully",
                },
                { status: 400 },
            );
        }

        // Files are already uploaded to Storj, we just need to store the fileKeys
        const candidateId = decoded.userId;

        // Verify files exist in UploadedFile table
        const uploadedFiles = await prisma.uploadedFile.findMany({
            where: {
                userId: candidateId,
                OR: [
                    { filePath: candidateAadhaarFileKey },
                    { filePath: candidatePhotoFileKey },
                    { filePath: proposerAadhaarFileKey }
                ]
            }
        });

        if (uploadedFiles.length < 3) {
            return NextResponse.json(
                {
                    error: "One or more uploaded files not found. Please re-upload your documents.",
                },
                { status: 400 },
            );
        }

        // Get Yuva Pankh election for age validation
        const election = await prisma.election.findFirst({
            where: { type: "YUVA_PANK" },
        });

        if (!election) {
            return NextResponse.json(
                { error: "Yuva Pankh election not found" },
                { status: 404 },
            );
        }

        // Get user data for age validation
        const user = await prisma.user.findUnique({
            where: { id: candidateId },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        // Calculate age from the form's birthDate
        const birthDateObj = new Date(birthDate);
        
        // For Yuva Pankh, age eligibility is based on age as of August 31, 2025
        const yuvaPankhCutoffDate = new Date('2025-08-31T23:59:59');
        const calculatedAgeAsOfCutoff = calculateAgeAsOf(birthDateObj, yuvaPankhCutoffDate);
        const calculatedAgeToday = calculateAge(birthDateObj);

        console.log("Age validation debug:", {
            birthDateFromForm: birthDate,
            birthDateObj: birthDateObj.toISOString(),
            calculatedAgeToday,
            calculatedAgeAsOfCutoff,
            cutoffDate: yuvaPankhCutoffDate.toISOString(),
            electionCandidateMinAge: election.candidateMinAge,
            electionCandidateMaxAge: election.candidateMaxAge,
        });

        // Check age eligibility for candidacy using age as of August 31, 2025
        const eligibility = isEligibleToBeCandidate(
            {
                age: calculatedAgeAsOfCutoff, // Use age as of cutoff date
                dateOfBirth: birthDateObj,
                jurisdiction: user.jurisdiction,
            },
            {
                voterMinAge: election.voterMinAge,
                voterMaxAge: election.voterMaxAge,
                voterJurisdiction: election.voterJurisdiction,
                candidateMinAge: election.candidateMinAge,
                candidateMaxAge: election.candidateMaxAge,
                candidateJurisdiction: election.candidateJurisdiction,
            },
            yuvaPankhCutoffDate, // Pass reference date for accurate error messages
        );

        if (!eligibility.eligible) {
            return NextResponse.json(
                {
                    error:
                        eligibility.reason ||
                        "You are not eligible to be a candidate in this election",
                },
                { status: 403 },
            );
        }

        // Get zone information
        const zoneInfo = await prisma.zone.findFirst({
            where: { 
                OR: [
                    { id: zone },
                    { code: zone },
                    { name: zone }
                ]
            }
        });

        if (!zoneInfo) {
            return NextResponse.json(
                { error: "Invalid zone selected" },
                { status: 400 }
            );
        }

        // Check if candidate already has a submitted nomination
        const existingSubmittedNomination = await prisma.yuvaPankhCandidate.findFirst({
            where: {
                userId: candidateId,
                status: 'SUBMITTED'
            }
        });

        if (existingSubmittedNomination) {
            return NextResponse.json(
                { error: "You have already submitted a nomination. Only one nomination per candidate is allowed." },
                { status: 400 }
            );
        }

        // Check if candidate already has a rejected nomination
        const existingRejectedNomination = await prisma.yuvaPankhCandidate.findFirst({
            where: {
                userId: candidateId,
                status: 'REJECTED'
            }
        });

        let nomination;
        
        if (existingRejectedNomination) {
            // Update the existing rejected nomination
            nomination = await prisma.yuvaPankhCandidate.update({
                where: { id: existingRejectedNomination.id },
                data: {
                    name: `${candidateName} ${candidateSurname}`,
                    email: emailId,
                    phone: mobileNumber,
                    party: "Independent", // Default for Yuva Pankh
                    position: "YOUTH_PRESIDENT", // Default position, can be updated
                    region: zoneInfo.name, // Use zone name
                    zoneId: zoneInfo.id, // Store zone ID for proper relation
                    experience: JSON.stringify({
                        fatherSpouse: candidateFatherSpouse,
                        alias: aliasNickname,
                        address: permanentAddress,
                        fileKeys: {
                            candidateAadhaar: candidateAadhaarFileKey,
                            candidatePhoto: candidatePhotoFileKey,
                            proposerAadhaar: proposerAadhaarFileKey,
                        },
                        // Keep filePaths for backward compatibility
                        filePaths: {
                            candidateAadhaar: candidateAadhaarFileKey,
                            candidatePhoto: candidatePhotoFileKey,
                            proposerAadhaar: proposerAadhaarFileKey,
                        },
                    }),
                    education: JSON.stringify({
                        gender: gender,
                        birthDate: birthDate,
                        proposerDetails: {
                            name: `${proposerName} ${proposerSurname}`,
                            fatherSpouse: proposerFatherSpouse,
                            address: proposerAddress,
                            birthDate: proposerBirthDate,
                            mobile: proposerMobile,
                            email: proposerEmail,
                        },
                    }),
                    manifesto: `Nomination resubmitted on ${new Date().toLocaleDateString()}`,
                    status: "SUBMITTED",
                    isOnlineRegistration: true,
                    // Clear rejection reason and reset status
                    rejectionReason: null,
                    updatedAt: new Date(),
                },
            });
        } else {
            // Create new Yuva Pankh candidate nomination record
            nomination = await prisma.yuvaPankhCandidate.create({
                data: {
                    userId: candidateId,
                    name: `${candidateName} ${candidateSurname}`,
                    email: emailId,
                    phone: mobileNumber,
                    party: "Independent", // Default for Yuva Pankh
                    position: "YOUTH_PRESIDENT", // Default position, can be updated
                    region: zoneInfo.name, // Use zone name
                    zoneId: zoneInfo.id, // Store zone ID for proper relation
                    experience: JSON.stringify({
                        fatherSpouse: candidateFatherSpouse,
                        alias: aliasNickname,
                        address: permanentAddress,
                        fileKeys: {
                            candidateAadhaar: candidateAadhaarFileKey,
                            candidatePhoto: candidatePhotoFileKey,
                            proposerAadhaar: proposerAadhaarFileKey,
                        },
                        // Keep filePaths for backward compatibility
                        filePaths: {
                            candidateAadhaar: candidateAadhaarFileKey,
                            candidatePhoto: candidatePhotoFileKey,
                            proposerAadhaar: proposerAadhaarFileKey,
                        },
                    }),
                    education: JSON.stringify({
                        gender: gender,
                        birthDate: birthDate,
                        proposerDetails: {
                            name: `${proposerName} ${proposerSurname}`,
                            fatherSpouse: proposerFatherSpouse,
                            address: proposerAddress,
                            birthDate: proposerBirthDate,
                            mobile: proposerMobile,
                            email: proposerEmail,
                        },
                    }),
                    manifesto: `Nomination submitted on ${new Date().toLocaleDateString()}`,
                    status: "SUBMITTED",
                    isOnlineRegistration: true,
                    // Leave rejectionReason null until admin actually rejects
                    rejectionReason: null,
                },
            });
        }

        return NextResponse.json({
            message: "Nomination submitted successfully",
            nominationId: nomination.id,
        });
    } catch (error) {
        console.error("Error submitting nomination:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export const POST = createRateLimitedRoute(
    withCSRFProtection(handler),
    rateLimitConfigs.upload,
);
