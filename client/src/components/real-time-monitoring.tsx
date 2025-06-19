import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, Users, Shield, TrendingUp, Clock } from "lucide-react";

interface MonitoringProps {
  pollId?: number;
}

export default function RealTimeMonitoring({ pollId }: MonitoringProps) {
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { data: liveStats, refetch } = useQuery({
    queryKey: pollId ? [`/api/polls/${pollId}/live-stats`] : ["/api/live-stats"],
    refetchInterval: isLive ? 5000 : false, // Refresh every 5 seconds when live
  });

  useEffect(() => {
    if (liveStats) {
      setLastUpdate(new Date());
    }
  }, [liveStats]);

  const stats = liveStats || {
    activeVoters: 0,
    totalVotes: 0,
    participationRate: 0,
    systemHealth: 'healthy',
    lastVoteTime: null,
    verificationStatus: 'verified'
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified': return <Badge className="bg-blue-100 text-blue-800">Verified</Badge>;
      case 'pending': return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Live Monitoring
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-600">
                {isLive ? 'Live' : 'Paused'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Active Voters</span>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-lg font-semibold">{stats.activeVoters}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Total Votes</span>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-lg font-semibold">{stats.totalVotes}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Participation Rate</span>
                  <span className="text-sm font-semibold">{stats.participationRate}%</span>
                </div>
                <Progress value={stats.participationRate} className="h-2" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">System Health</span>
                {getHealthBadge(stats.systemHealth)}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Verification Status</span>
                {getVerificationBadge(stats.verificationStatus)}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Last Vote</span>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-600">
                    {stats.lastVoteTime 
                      ? new Date(stats.lastVoteTime).toLocaleTimeString()
                      : 'No votes yet'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
              <button 
                onClick={() => setIsLive(!isLive)}
                className="text-blue-600 hover:text-blue-800"
              >
                {isLive ? 'Pause' : 'Resume'} monitoring
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats.systemHealth !== 'healthy' && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            System health check detected issues. Please review the audit log for details.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}