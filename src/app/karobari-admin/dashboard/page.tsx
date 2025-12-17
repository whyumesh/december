"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, LogOut, FileText, Users, CheckCircle, Clock, XCircle } from "lucide-react";
import Logo from "@/components/Logo";

interface KarobariAdmin {
  id: string;
  name: string;
  email: string;
  adminId: string;
}

export default function KarobariAdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [admin, setAdmin] = useState<KarobariAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    if (status === "loading") return; // Do nothing while loading
    if (!session || session.user.role !== "KAROBARI_ADMIN") {
      router.push("/karobari-admin/login"); // Redirect if not authenticated or not Karobari Admin
      return;
    }

    // Set admin info from session
    setAdmin({
      id: session.user.id || "",
      name: session.user.name || "",
      email: session.user.email || "",
      adminId: "KAROBARI001", // You can fetch this from API if needed
    });

    // Fetch stats
    fetchStats();
    setIsLoading(false);
  }, [session, status, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/karobari-admin/dashboard");

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/karobari-admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Logo size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
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
                <h1 className="text-2xl text-gray-900">
                  Karobari Admin Dashboard
                </h1>
                <p className="text-gray-600">
                  Overview of Karobari election statistics
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {admin?.name}
                </p>
                <p className="text-xs text-gray-500">{admin?.email}</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl text-gray-900 mb-2">
            Welcome, {admin?.name}!
          </h2>
          <p className="text-gray-600">
            Manage Karobari Members candidates and nominations
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All candidates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-yellow-600">
                {stats.pending}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-green-600">
                {stats.approved}
              </div>
              <p className="text-xs text-muted-foreground">Accepted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-red-600">
                {stats.rejected}
              </div>
              <p className="text-xs text-muted-foreground">Declined</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/karobari-admin/nominate">
                <Button className="w-full" size="lg">
                  <FileText className="h-5 w-5 mr-2" />
                  Add New Candidate
                </Button>
              </Link>
              <Link href="/karobari-admin/candidates">
                <Button className="w-full" size="lg" variant="outline">
                  <Users className="h-5 w-5 mr-2" />
                  View All Candidates
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

