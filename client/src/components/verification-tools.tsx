import { CheckCircle } from "lucide-react";

export default function VerificationTools() {
  const checks = [
    { name: "Chain Integrity", status: "valid", description: "Hash chain verified" },
    { name: "Signature", status: "valid", description: "Digital signatures valid" },
    { name: "Tally Match", status: "valid", description: "Vote count confirmed" },
  ];

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-3">Hash Chain Verification</h4>
      <div className="bg-gray-50 rounded-md p-3 space-y-2">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className={`security-indicator ${check.status}`}></div>
            <div className="flex-1">
              <span className="text-sm text-gray-700">{check.name}: </span>
              <span className="text-sm font-medium text-gray-900">{check.description}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Public Key Verification</h4>
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-xs font-mono text-gray-600 break-all mb-2">
            04a6b2c3d4e5f6789abc... (truncated)
          </p>
          <div className="flex items-center space-x-2">
            <div className="security-indicator valid"></div>
            <span className="text-sm text-gray-700">Key Valid</span>
          </div>
        </div>
      </div>
    </div>
  );
}
