import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const zoneId = searchParams.get('zoneId');
        
        // Get candidates from all candidate tables
        const [yuvaPankhCandidates, karobariCandidates, trusteeCandidates] = await Promise.all([
            prisma.yuvaPankhCandidate.findMany({
                where: {
                    ...(zoneId ? { zoneId } : {}),
                    position: { not: 'NOTA' } // Exclude NOTA candidates
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                    zone: {
                        select: {
                            name: true,
                            nameGujarati: true,
                            seats: true,
                            code: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.karobariCandidate.findMany({
                where: {
                    ...(zoneId ? { zoneId } : {}),
                    position: { not: 'NOTA' } // Exclude NOTA candidates
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                    zone: {
                        select: {
                            name: true,
                            nameGujarati: true,
                            seats: true,
                            code: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.trusteeCandidate.findMany({
                where: {
                    ...(zoneId ? { zoneId } : {}),
                    position: { not: { startsWith: 'NOTA' } } // Exclude NOTA candidates
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                    zone: {
                        select: {
                            name: true,
                            nameGujarati: true,
                            seats: true,
                            code: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
            })
        ]);

        // Combine all candidates and add candidate type
        const candidates = [
            ...yuvaPankhCandidates.map(c => ({ ...c, candidateType: 'YUVA_PANKH' })),
            ...karobariCandidates.map(c => ({ ...c, candidateType: 'KAROBARI' })),
            ...trusteeCandidates.map(c => ({ ...c, candidateType: 'TRUSTEE' }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const formattedCandidates = candidates.map((candidate) => {
            // Parse JSON data from experience and education fields
            let experienceData = null;
            let educationData = null;

            try {
                experienceData = candidate.experience
                    ? JSON.parse(candidate.experience)
                    : null;
            } catch (error) {
                // If parsing fails, keep as string
                experienceData = candidate.experience;
            }

            try {
                educationData = candidate.education
                    ? JSON.parse(candidate.education)
                    : null;
            } catch (error) {
                // If parsing fails, keep as string
                educationData = candidate.education;
            }

            return {
                id: candidate.id,
                name: candidate.user?.name || candidate.name || "Unknown",
                email: candidate.user?.email || candidate.email || "",
                phone: candidate.user?.phone || candidate.phone || "",
                party: candidate.party || "Independent",
                position: candidate.position,
                region: candidate.region,
                status: candidate.status,
                experience: experienceData,
                education: educationData,
                manifesto: candidate.manifesto || "",
                rejectionReason: candidate.rejectionReason, // Only actual rejection reasons
                submittedAt: candidate.createdAt.toISOString(),
                candidateType: candidate.candidateType,
                zone: candidate.zone ? {
                    name: candidate.zone.name,
                    nameGujarati: candidate.zone.nameGujarati,
                    seats: candidate.zone.seats,
                    code: candidate.zone.code
                } : null,
            };
        });

        const jsonResponse = NextResponse.json({
            candidates: formattedCandidates,
            timestamp: new Date().toISOString(),
            count: formattedCandidates.length
        });
        
        // Force no caching at all levels
        jsonResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        jsonResponse.headers.set('Pragma', 'no-cache');
        jsonResponse.headers.set('Expires', '0');
        jsonResponse.headers.set('Surrogate-Control', 'no-store');
        jsonResponse.headers.set('CDN-Cache-Control', 'no-store');
        
        return jsonResponse;
    } catch (error) {
        console.error("Error fetching candidates:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
