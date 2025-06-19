import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Download, Upload, Database, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function BackupRecovery() {
  const [backupProgress, setBackupProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/backup/create");
      return response.json();
    },
    onSuccess: (data) => {
      // Simulate progress for user feedback
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setBackupProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          // Download the backup file
          const blob = new Blob([JSON.stringify(data.backup, null, 2)], { 
            type: 'application/json' 
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `voting-backup-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
          
          toast({
            title: "Backup Created",
            description: "Database backup downloaded successfully",
          });
          setBackupProgress(0);
        }
      }, 200);
    },
    onError: (error: any) => {
      toast({
        title: "Backup Failed",
        description: error.message || "Failed to create backup",
        variant: "destructive",
      });
      setBackupProgress(0);
    },
  });

  const restoreBackupMutation = useMutation({
    mutationFn: async (backupData: any) => {
      const response = await apiRequest("POST", "/api/backup/restore", {
        backup: backupData
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Restore Complete",
        description: "Database restored from backup successfully",
      });
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Restore Failed",
        description: error.message || "Failed to restore backup",
        variant: "destructive",
      });
    },
  });

  const handleBackupCreate = () => {
    createBackupMutation.mutate();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid JSON backup file",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) return;

    try {
      const fileContent = await selectedFile.text();
      const backupData = JSON.parse(fileContent);
      restoreBackupMutation.mutate(backupData);
    } catch (error) {
      toast({
        title: "Invalid Backup",
        description: "Failed to parse backup file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Database Backup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Create encrypted backups of all voting data including polls, votes, and audit logs.
                Backups preserve cryptographic integrity and can be used for disaster recovery.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Create Full Backup</h4>
                <p className="text-sm text-gray-600">
                  Export all voting data with cryptographic signatures
                </p>
              </div>
              <Button 
                onClick={handleBackupCreate}
                disabled={createBackupMutation.isPending}
                className="flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                {createBackupMutation.isPending ? "Creating..." : "Create Backup"}
              </Button>
            </div>

            {backupProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Creating backup...</span>
                  <span>{backupProgress}%</span>
                </div>
                <Progress value={backupProgress} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Restore from Backup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Warning: Restoring from backup will replace all current data. 
                This action cannot be undone. Create a backup before proceeding.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Label htmlFor="backup-file">Select Backup File</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>File selected: {selectedFile.name}</span>
                </div>
              )}
            </div>

            <Button 
              onClick={handleRestore}
              disabled={!selectedFile || restoreBackupMutation.isPending}
              variant="destructive"
              className="w-full"
            >
              {restoreBackupMutation.isPending ? "Restoring..." : "Restore Database"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}