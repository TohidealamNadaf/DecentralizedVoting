import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CheckCircle, Clock, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Vote() {
  const [, params] = useRoute("/vote/:token");
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: voteData, isLoading } = useQuery({
    queryKey: [`/api/vote/${params?.token}`],
    enabled: !!params?.token,
  });

  const submitVoteMutation = useMutation({
    mutationFn: async (choices: string[]) => {
      const response = await apiRequest("POST", "/api/vote", {
        token: params?.token,
        choices,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vote Submitted",
        description: "Your vote has been recorded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit vote",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading voting interface...</p>
        </div>
      </div>
    );
  }

  if (!voteData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 mb-4">
              <CheckCircle className="h-12 w-12 mx-auto" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Voting Link</h1>
            <p className="text-gray-600">
              This voting link is invalid or has already been used.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { poll, voter } = voteData;
  
  const getTimeRemaining = () => {
    const now = new Date();
    const endDate = new Date(poll.endDate);
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return "Voting has ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days} days, ${hours} hours`;
    if (hours > 0) return `${hours} hours, ${minutes} minutes`;
    return `${minutes} minutes`;
  };

  const handleChoiceChange = (choice: string, checked: boolean) => {
    if (poll.allowMultiple) {
      if (checked) {
        setSelectedChoices([...selectedChoices, choice]);
      } else {
        setSelectedChoices(selectedChoices.filter(c => c !== choice));
      }
    } else {
      setSelectedChoices(checked ? [choice] : []);
    }
  };

  const handleSubmit = () => {
    if (selectedChoices.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one option",
        variant: "destructive",
      });
      return;
    }

    submitVoteMutation.mutate(selectedChoices);
  };

  if (submitVoteMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-green-500 mb-4">
              <CheckCircle className="h-12 w-12 mx-auto" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Vote Submitted</h1>
            <p className="text-gray-600">
              Your vote has been recorded and added to the cryptographic log.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 text-xl font-semibold text-gray-900">VoteSecure</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{poll.title}</h1>
          <p className="mt-2 text-gray-600">{poll.description}</p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              Voting ends in {getTimeRemaining()}
            </span>
          </div>
        </div>

        {/* Voting Form */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {poll.allowMultiple ? (
                // Multiple choice
                poll.options.map((option: string) => (
                  <div key={option} className="vote-option">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={option}
                        checked={selectedChoices.includes(option)}
                        onCheckedChange={(checked) => handleChoiceChange(option, checked as boolean)}
                      />
                      <Label htmlFor={option} className="flex-1 cursor-pointer">
                        <p className="text-sm font-medium text-gray-900">{option}</p>
                      </Label>
                    </div>
                  </div>
                ))
              ) : (
                // Single choice
                <RadioGroup 
                  value={selectedChoices[0] || ""} 
                  onValueChange={(value) => setSelectedChoices([value])}
                >
                  {poll.options.map((option: string) => (
                    <div key={option} className="vote-option">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="flex-1 cursor-pointer">
                          <p className="text-sm font-medium text-gray-900">{option}</p>
                        </Label>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>

            <Alert className="mt-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your vote will be cryptographically secured and added to a tamper-evident log. 
                After voting closes, you can verify the integrity of all votes using our verification tools.
              </AlertDescription>
            </Alert>

            <div className="mt-8 flex justify-center">
              <Button 
                size="lg" 
                onClick={handleSubmit}
                disabled={submitVoteMutation.isPending || selectedChoices.length === 0}
              >
                {submitVoteMutation.isPending ? "Submitting..." : "Submit Vote"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
