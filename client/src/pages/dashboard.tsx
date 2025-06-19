import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { CheckCircle, Download, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PollForm from "@/components/poll-form";
import ActivePolls from "@/components/active-polls";
import SecurityStatus from "@/components/security-status";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const navigation = [
    { name: "Dashboard", href: "/dashboard", current: true },
    { name: "Vote", href: "/vote", current: false },
    { name: "Verify", href: "/verify", current: false },
    { name: "Results", href: "/results", current: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="ml-3 text-xl font-semibold text-gray-900">VoteSecure</span>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium ${
                    item.current
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
          <p className="mt-2 text-gray-600">Create and manage transparent, verifiable elections and polls</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Polls</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats?.activePolls || 0}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-secondary" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Voters</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats?.totalVoters || 0}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-accent" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Verified Votes</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats?.verifiedVotes || 0}</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Security Score</dt>
                    <dd className="text-lg font-semibold text-gray-900">98.5%</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create New Poll Section */}
          <div className="lg:col-span-2">
            <PollForm />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ActivePolls />
            <SecurityStatus />
          </div>
        </div>
      </main>
    </div>
  );
}
