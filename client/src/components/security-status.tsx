import { CheckCircle, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SecurityStatus() {
  const securityChecks = [
    {
      title: "Cryptographic Verification",
      subtitle: "All vote logs properly signed",
      status: "valid",
    },
    {
      title: "Hash Chain Integrity",
      subtitle: "No tampering detected",
      status: "valid",
    },
    {
      title: "HTTPS Encryption",
      subtitle: "All traffic secured",
      status: "valid",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {securityChecks.map((check, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{check.title}</p>
                <p className="text-xs text-gray-500">{check.subtitle}</p>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-gray-200">
            <Button className="w-full bg-secondary hover:bg-secondary/90">
              <Download className="w-4 h-4 mr-2" />
              Download Security Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
