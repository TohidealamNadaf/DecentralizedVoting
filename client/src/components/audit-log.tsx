import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Search, CheckCircle, AlertTriangle } from "lucide-react";

interface AuditLogProps {
  pollId?: number;
}

export default function AuditLog({ pollId }: AuditLogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: auditLog = [] } = useQuery({
    queryKey: pollId ? [`/api/polls/${pollId}/audit`] : ["/api/audit"],
    enabled: true,
  });

  const filteredLog = auditLog.filter((entry: any) => 
    entry.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadAuditLog = () => {
    const logData = JSON.stringify(auditLog, null, 2);
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${pollId || 'all'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionBadge = (action: string) => {
    const type = action.toLowerCase();
    if (type.includes('create')) return <Badge variant="default">Create</Badge>;
    if (type.includes('vote')) return <Badge variant="secondary">Vote</Badge>;
    if (type.includes('verify')) return <Badge className="bg-green-100 text-green-800">Verify</Badge>;
    if (type.includes('error')) return <Badge variant="destructive">Error</Badge>;
    return <Badge variant="outline">{action}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Audit Trail
          </CardTitle>
          <Button onClick={downloadAuditLog} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Log
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search audit log..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {auditLog.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No audit log entries found. Activity will appear here as users interact with the system.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredLog.map((entry: any, index: number) => (
                <div key={index} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getActionBadge(entry.action)}
                      <span className="text-sm text-gray-600">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Hash: {entry.hash?.substring(0, 8)}...
                    </span>
                  </div>
                  <p className="text-sm text-gray-900">{entry.details}</p>
                  {entry.metadata && (
                    <div className="mt-2 text-xs text-gray-600">
                      <code className="bg-gray-200 px-1 rounded">
                        {JSON.stringify(entry.metadata)}
                      </code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}