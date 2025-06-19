import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CheckCircle, Clock, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout";

export default function Vote() {
  const [, params] = useRoute("/vote/:token");
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const { toast } = useToast();

  // If no token provided, show token entry interface
  if (!params?.token) {
    return (
      <Layout>
        <div className="py-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Enter Voting Token</h1>
              <p className="mt-2 text-gray-600">Please enter your unique voting token to access your ballot</p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="token">Voting Token</Label>
                    <Input
                      id="token"
                      type="text"
                      placeholder="Enter your voting token"
                      className="mt-2"
                    />
                  </div>
                  <Button className="w-full">Access Ballot</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

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
      <Layout>
        <div className="py-8">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="animate-pulse">Loading ballot...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!voteData) {
    return (
      <Layout>
        <div className="py-8">
          <div className="max-w-2xl mx-auto px-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Invalid voting token or ballot not found.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </Layout>
    );
  }

  const poll = (voteData as any)?.poll;
  const voter = (voteData as any)?.voter;

  if (!poll || !voter) {
    return (
      <Layout>
        <div className="py-8">
          <div className="max-w-2xl mx-auto px-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Unable to load ballot information.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </Layout>
    );
  }

  const handleChoiceChange = (choice: string, checked: boolean) => {
    if (poll.allowMultiple) {
      setSelectedChoices(prev => 
        checked 
          ? [...prev, choice]
          : prev.filter(c => c !== choice)
      );
    } else {
      setSelectedChoices(checked ? [choice] : []);
    }
  };

  const handleSubmit = () => {
    if (selectedChoices.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one option before voting",
        variant: "destructive",
      });
      return;
    }
    submitVoteMutation.mutate(selectedChoices);
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle>{poll.title}</CardTitle>
              <p className="text-gray-600">{poll.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">
                    {poll.allowMultiple ? "Select all that apply:" : "Select one option:"}
                  </h3>
                  <div className="space-y-3">
                    {poll.options.map((option: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        {poll.allowMultiple ? (
                          <Checkbox
                            id={`option-${index}`}
                            checked={selectedChoices.includes(option)}
                            onCheckedChange={(checked) => handleChoiceChange(option, checked as boolean)}
                          />
                        ) : (
                          <RadioGroup
                            value={selectedChoices[0] || ""}
                            onValueChange={(value) => setSelectedChoices([value])}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`option-${index}`} />
                            </div>
                          </RadioGroup>
                        )}
                        <Label htmlFor={`option-${index}`} className="flex-1">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSubmit}
                    disabled={submitVoteMutation.isPending}
                    className="w-full"
                  >
                    {submitVoteMutation.isPending ? "Submitting Vote..." : "Submit Vote"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}