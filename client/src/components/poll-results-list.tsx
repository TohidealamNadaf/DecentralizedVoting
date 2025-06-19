import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from "lucide-react";

export default function PollResultsList() {
  const { data: polls = [] } = useQuery({
    queryKey: ["/api/polls"],
  });

  const completedPolls = polls.filter((poll: any) => {
    const now = new Date();
    const endDate = new Date(poll.endDate);
    return endDate <= now;
  });

  const getTimeEnded = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = now.getTime() - end.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `Ended ${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `Ended ${hours} hour${hours > 1 ? 's' : ''} ago`;
    return "Just ended";
  };

  return (
    <div className="space-y-6">
      {completedPolls.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Polls</h3>
            <p className="text-gray-600">
              Poll results will appear here once voting periods end.
            </p>
            <Link href="/">
              <Button className="mt-4">
                Create New Poll
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {completedPolls.map((poll: any) => (
            <Card key={poll.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{poll.title}</CardTitle>
                  <Badge variant="secondary">Completed</Badge>
                </div>
                <p className="text-sm text-gray-600">{poll.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Votes:</span>
                    <span className="font-medium">{poll.votesCount || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Eligible Voters:</span>
                    <span className="font-medium">{poll.eligibleVotersCount || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Participation:</span>
                    <span className="font-medium">
                      {poll.eligibleVotersCount ? 
                        Math.round(((poll.votesCount || 0) / poll.eligibleVotersCount) * 100) : 0
                      }%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-gray-900">{getTimeEnded(poll.endDate)}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <Link href={`/results/${poll.id}`}>
                      <Button className="w-full">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        View Results
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}