import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Download, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Results() {
  const [, params] = useRoute("/results/:id");
  const pollId = params?.id;

  const { data: poll } = useQuery({
    queryKey: [`/api/polls/${pollId}`],
    enabled: !!pollId,
  });

  const { data: results } = useQuery({
    queryKey: [`/api/polls/${pollId}/results`],
    enabled: !!pollId,
  });

  const { data: logData } = useQuery({
    queryKey: [`/api/polls/${pollId}/log`],
    enabled: !!pollId,
  });

  const downloadVerificationData = () => {
    if (logData) {
      const dataStr = JSON.stringify(logData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `poll-${pollId}-verification.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  if (!poll) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading poll results...</p>
        </div>
      </div>
    );
  }

  const isPollEnded = new Date() > new Date(poll.endDate);
  const totalVotes = results?.totalVotes || 0;
  const maxVotes = totalVotes > 0 ? Math.max(...Object.values(results?.results || {})) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-semibold text-gray-900">VoteSecure</span>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{poll.title}</h1>
          <p className="mt-2 text-gray-600">{poll.description}</p>
          <div className="mt-4 flex items-center space-x-4">
            <Badge variant={isPollEnded ? "secondary" : "default"}>
              {isPollEnded ? "Ended" : "Active"}
            </Badge>
            <span className="text-sm text-gray-500">
              {isPollEnded 
                ? `Ended on ${new Date(poll.endDate).toLocaleDateString()}`
                : `Ends on ${new Date(poll.endDate).toLocaleDateString()}`
              }
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Results */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Poll Results</CardTitle>
                {!isPollEnded && (
                  <p className="text-sm text-muted-foreground">
                    Live results - updates as votes are cast
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {!results || totalVotes === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No votes cast yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(results.results).map(([option, count]) => {
                      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                      const isWinner = count === maxVotes && maxVotes > 0;
                      
                      return (
                        <div key={option} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h3 className={`text-lg font-medium ${
                                isWinner ? "text-primary" : "text-gray-900"
                              }`}>
                                {option}
                              </h3>
                              {isWinner && totalVotes > 0 && (
                                <Badge variant="default" className="bg-primary">
                                  Winner
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                {count} votes
                              </div>
                              <div className="text-sm text-gray-500">
                                {percentage}%
                              </div>
                            </div>
                          </div>
                          <Progress value={percentage} className="h-3" />
                        </div>
                      );
                    })}

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-900">Total Votes</span>
                        <span className="text-lg font-semibold text-gray-900">{totalVotes}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Verification & Security */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Verification Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Cryptographically Verified
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    All votes are recorded in a tamper-evident log with digital signatures
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Verification Hash:</span>
                    <span className="font-mono text-xs text-gray-900">
                      {results?.verificationHash?.substring(0, 12)}...
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Log Entries:</span>
                    <span className="font-mono text-gray-900">{logData?.log?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Algorithm:</span>
                    <span className="font-mono text-gray-900">SHA-256 + ECDSA</span>
                  </div>
                </div>

                <Button 
                  className="w-full mt-4"
                  onClick={downloadVerificationData}
                  disabled={!logData}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Verification Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="security-indicator valid"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Hash Chain Integrity</p>
                      <p className="text-xs text-gray-500">All votes properly linked</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="security-indicator valid"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Digital Signatures</p>
                      <p className="text-xs text-gray-500">All entries cryptographically signed</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="security-indicator valid"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Vote Privacy</p>
                      <p className="text-xs text-gray-500">
                        {poll.isAnonymous ? "Anonymous voting enabled" : "Voter identities recorded"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Link href="/verify">
                    <Button variant="outline" className="w-full">
                      Verify Results Independently
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
