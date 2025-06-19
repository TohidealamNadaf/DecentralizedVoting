import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, Upload, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import VerificationTools from "@/components/verification-tools";
import Layout from "@/components/layout";

interface VerificationResult {
  chainIntegrityValid: boolean;
  signaturesValid: boolean;
  tally: Record<string, number>;
  totalVotes: number;
  verificationTimestamp: string;
}

export default function Verify() {
  const [verificationData, setVerificationData] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const { toast } = useToast();

  const verifyMutation = useMutation({
    mutationFn: async (data: { log: any[]; publicKey: string }) => {
      const response = await apiRequest("POST", "/api/verify", data);
      return response.json();
    },
    onSuccess: (result: VerificationResult) => {
      setVerificationResult(result);
      toast({
        title: "Verification Complete",
        description: "Vote log has been verified",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Verification failed",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          setVerificationData(data);
          toast({
            title: "File Loaded",
            description: "Verification data loaded successfully",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Invalid JSON file",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleVerify = () => {
    if (!verificationData) {
      toast({
        title: "Error",
        description: "Please upload a verification file first",
        variant: "destructive",
      });
      return;
    }

    verifyMutation.mutate({
      log: verificationData.log,
      publicKey: verificationData.publicKey,
    });
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Verification Interface</h1>
            <p className="mt-2 text-gray-600">Audit and verify election integrity</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Verification Tools */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Verification Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="log-upload" className="text-sm font-medium text-gray-900">
                    Upload Verification Log
                  </Label>
                  <div className="mt-2 flex items-center space-x-3">
                    <Input
                      id="log-upload"
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleVerify}
                      disabled={!verificationData || verifyMutation.isPending}
                      className="bg-secondary hover:bg-secondary/90"
                    >
                      {verifyMutation.isPending ? "Verifying..." : "Verify"}
                    </Button>
                  </div>
                </div>

                {verificationData && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Loaded verification data for poll: <strong>{verificationData.pollTitle}</strong>
                      <br />
                      Vote entries: {verificationData.log?.length || 0}
                    </AlertDescription>
                  </Alert>
                )}

                <VerificationTools />
              </CardContent>
            </Card>
          </div>

          {/* Verification Results */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Verification Results</CardTitle>
              </CardHeader>
              <CardContent>
                {!verificationResult ? (
                  <div className="text-center py-8">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-gray-500">Upload and verify a log file to see results</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Overall Status */}
                    <div className={`border rounded-lg p-4 ${
                      verificationResult.chainIntegrityValid && verificationResult.signaturesValid
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}>
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {verificationResult.chainIntegrityValid && verificationResult.signaturesValid ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div className="ml-3">
                          <h4 className={`text-sm font-medium ${
                            verificationResult.chainIntegrityValid && verificationResult.signaturesValid
                              ? "text-green-800"
                              : "text-red-800"
                          }`}>
                            {verificationResult.chainIntegrityValid && verificationResult.signaturesValid
                              ? "Verification Successful"
                              : "Verification Failed"
                            }
                          </h4>
                          <p className={`text-sm ${
                            verificationResult.chainIntegrityValid && verificationResult.signaturesValid
                              ? "text-green-700"
                              : "text-red-700"
                          }`}>
                            {verificationResult.chainIntegrityValid && verificationResult.signaturesValid
                              ? "All cryptographic checks passed"
                              : "One or more checks failed"
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Checks */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-700">Chain Integrity</span>
                        <Badge variant={verificationResult.chainIntegrityValid ? "default" : "destructive"}>
                          {verificationResult.chainIntegrityValid ? "Valid" : "Invalid"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-700">Signatures</span>
                        <Badge variant={verificationResult.signaturesValid ? "default" : "destructive"}>
                          {verificationResult.signaturesValid ? "Verified" : "Invalid"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-700">Total Votes</span>
                        <Badge variant="outline">{verificationResult.totalVotes}</Badge>
                      </div>
                    </div>

                    {/* Vote Tally */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Vote Tally Verification</h4>
                      <div className="space-y-2">
                        {Object.entries(verificationResult.tally).map(([option, count]) => (
                          <div key={option} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{option}</span>
                            <span className="text-sm font-medium text-gray-900">{count} votes</span>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900">Total Verified Votes</span>
                            <span className="text-sm font-medium text-gray-900">{verificationResult.totalVotes}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Technical Details */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Technical Details</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hash Algorithm:</span>
                          <span className="font-mono text-gray-900">SHA-256</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Signature Algorithm:</span>
                          <span className="font-mono text-gray-900">ECDSA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Verification Time:</span>
                          <span className="font-mono text-gray-900">
                            {new Date(verificationResult.verificationTimestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3">
                      <Button variant="outline" className="flex-1">
                        Download Report
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={() => {
                          setVerificationResult(null);
                          setVerificationData(null);
                        }}
                      >
                        Verify Another
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </Layout>
  );
}
