import { useState } from "react";
import { Clock, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VotingInterfaceProps {
  poll: {
    id: number;
    title: string;
    description: string;
    options: string[];
    allowMultiple: boolean;
    endDate: string;
  };
  onVoteSubmit: (choices: string[]) => void;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export default function VotingInterface({ 
  poll, 
  onVoteSubmit, 
  isSubmitting = false, 
  disabled = false 
}: VotingInterfaceProps) {
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);

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
    if (selectedChoices.length === 0 || disabled) return;
    onVoteSubmit(selectedChoices);
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-8">
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
                      id={`option-${option}`}
                      checked={selectedChoices.includes(option)}
                      onCheckedChange={(checked) => handleChoiceChange(option, checked as boolean)}
                      disabled={disabled}
                    />
                    <Label htmlFor={`option-${option}`} className="flex-1 cursor-pointer">
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
                disabled={disabled}
              >
                {poll.options.map((option: string) => (
                  <div key={option} className="vote-option">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={option} id={`radio-${option}`} />
                      <Label htmlFor={`radio-${option}`} className="flex-1 cursor-pointer">
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
              disabled={isSubmitting || selectedChoices.length === 0 || disabled}
              className="px-8"
            >
              {isSubmitting ? "Submitting..." : "Submit Vote"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
