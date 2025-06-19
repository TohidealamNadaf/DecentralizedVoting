import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { CheckCircle, Download, User, Users, Shield, BarChart3, Plus, FileText, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PollForm from "@/components/poll-form";
import ActivePolls from "@/components/active-polls";
import SecurityStatus from "@/components/security-status";
import AuditLog from "@/components/audit-log";
import RealTimeMonitoring from "@/components/real-time-monitoring";
import BackupRecovery from "@/components/backup-recovery";
import Layout from "@/components/layout";

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Election Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage polls and monitor election integrity</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Polls</p>
                    <p className="text-2xl font-semibold text-gray-900">{(stats as any)?.activePolls || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Voters</p>
                    <p className="text-2xl font-semibold text-gray-900">{(stats as any)?.totalVoters || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Shield className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Verified Votes</p>
                    <p className="text-2xl font-semibold text-gray-900">{(stats as any)?.verifiedVotes || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Poll
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PollForm />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <ActivePolls />
              <SecurityStatus />
              <RealTimeMonitoring />
            </div>
          </div>

          {/* Additional Management Tools */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AuditLog />
            <BackupRecovery />
          </div>
        </div>
      </div>
    </Layout>
  );
}