import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleError } from "@/lib/error-handler";
import { excludeTestVoters } from "@/lib/voter-utils";

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0


// Helper function to calculate age from DOB
function calculateAge(dob: string): number {
    const [day, month, year] = dob.split('/').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

export async function GET(request: NextRequest) {
    try {
        // Get all voters from Voter table (exclude test voters)
        const voters = await prisma.voter.findMany({
            where: excludeTestVoters(),
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                zone: {
                    select: {
                        name: true,
                        nameGujarati: true,
                        code: true
                    }
                },
                yuvaPankZone: {
                    select: {
                        name: true,
                        nameGujarati: true,
                        code: true
                    }
                },
                karobariZone: {
                    select: {
                        name: true,
                        nameGujarati: true,
                        code: true
                    }
                },
                trusteeZone: {
                    select: {
                        name: true,
                        nameGujarati: true,
                        code: true
                    }
                }
            }
        });

        // Get voter statistics (exclude test voters)
        const totalVoters = await prisma.voter.count({ where: excludeTestVoters() });
        const activeVoters = await prisma.voter.count({
            where: excludeTestVoters({ isActive: true }),
        });
        const inactiveVoters = await prisma.voter.count({
            where: excludeTestVoters({ isActive: false }),
        });

        // Get voted voters count (exclude test voters)
        const votedVoters = await prisma.voter.count({
            where: excludeTestVoters({ hasVoted: true }),
        });

        const stats = {
            totalVoters,
            activeVoters,
            votedVoters,
            inactiveVoters,
        };

        // Format voters data
        const formattedVoters = voters.map((voter) => ({
            id: voter.id,
            voterId: voter.voterId,
            name: voter.name,
            gender: voter.gender,
            dob: voter.dob,
            age: voter.age,
            email: voter.email || voter.user?.email,
            mulgam: voter.mulgam,
            phone: voter.phone || voter.user?.phone,
            region: voter.region,
            isActive: voter.isActive,
            hasVoted: voter.hasVoted,
            lastLoginAt: voter.lastLoginAt?.toISOString(),
            zone: voter.zone ? {
                name: voter.zone.name,
                nameGujarati: voter.zone.nameGujarati,
                code: voter.zone.code
            } : null,
            yuvaPankZone: voter.yuvaPankZone ? {
                name: voter.yuvaPankZone.name,
                nameGujarati: voter.yuvaPankZone.nameGujarati,
                code: voter.yuvaPankZone.code
            } : null,
            karobariZone: voter.karobariZone ? {
                name: voter.karobariZone.name,
                nameGujarati: voter.karobariZone.nameGujarati,
                code: voter.karobariZone.code
            } : null,
            trusteeZone: voter.trusteeZone ? {
                name: voter.trusteeZone.name,
                nameGujarati: voter.trusteeZone.nameGujarati,
                code: voter.trusteeZone.code
            } : null,
            createdAt: voter.createdAt.toISOString(),
        }));

        return NextResponse.json({
            voters: formattedVoters,
            stats,
        });
    } catch (error) {
        return handleError(error, {
            endpoint: request.nextUrl.pathname,
            method: request.method,
        });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { voters } = body;

        if (!voters || !Array.isArray(voters)) {
            return NextResponse.json(
                { error: "Voters array is required" },
                { status: 400 }
            );
        }

        // Validate each voter
        for (const voter of voters) {
            if (!voter.name || !voter.phone || !voter.region) {
                return NextResponse.json(
                    { error: "Name, phone, and region are required for each voter" },
                    { status: 400 }
                );
            }

            // If DOB is provided, validate age
            if (voter.dob) {
                const age = calculateAge(voter.dob);
                if (age < 18) {
                    return NextResponse.json(
                        { error: `Voter ${voter.name} must be at least 18 years old. Current age: ${age}` },
                        { status: 400 }
                    );
                }
            }
        }

        // Check for duplicate phone numbers and voter IDs
        const existingPhones = await prisma.voter.findMany({
            where: {
                phone: { in: voters.map((v: any) => v.phone) },
            },
            select: { phone: true },
        });

        const existingVoterIds = await prisma.voter.findMany({
            where: {
                voterId: { in: voters.map((v: any) => v.voterId) },
            },
            select: { voterId: true },
        });

        if (existingPhones.length > 0) {
            return NextResponse.json(
                {
                    error: `Duplicate phone numbers found: ${existingPhones
                        .map((v) => v.phone)
                        .join(", ")}`,
                },
                { status: 400 }
            );
        }

        if (existingVoterIds.length > 0) {
            return NextResponse.json(
                {
                    error: `Duplicate voter IDs found: ${existingVoterIds
                        .map((v) => v.voterId)
                        .join(", ")}`,
                },
                { status: 400 }
            );
        }

        // Create voters with automatic age calculation
        const createdVoters = await prisma.voter.createMany({
            data: voters.map((voter: any) => {
                let calculatedAge = null;
                if (voter.dob) {
                    calculatedAge = calculateAge(voter.dob);
                }

                return {
                    voterId: voter.voterId || `V${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: voter.name,
                    gender: voter.gender || null,
                    dob: voter.dob || null,
                    age: calculatedAge,
                    email: voter.email || null,
                    mulgam: voter.mulgam || null,
                    phone: voter.phone,
                    region: voter.region,
                    isActive: true,
                    hasVoted: false,
                };
            }),
        });

        return NextResponse.json({
            message: `${createdVoters.count} voters created successfully`,
            count: createdVoters.count,
        });
    } catch (error) {
        return handleError(error, {
            endpoint: request.nextUrl.pathname,
            method: request.method,
        });
    }
}
