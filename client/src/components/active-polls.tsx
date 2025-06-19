import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function ActivePolls() {
  const { data: polls = [] } = useQuery({
    queryKey: ["/api/polls"],
  });

  const activePolls = polls.filter((poll: any) => {
    const now = new Date();
    const endDate = new Date(poll.endDate);
    return poll.isActive && endDate > now;
  });

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `Ends in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Ends in ${hours} hour${hours > 1 ? 's' : ''}`;
    return "Ending soon";
  };

  const getStatusBadge = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    const hoursRemaining = diff / (1000 * 60 * 60);
    
    if (hoursRemaining <= 0) return <Badge variant="secondary">Ended</Badge>;
    if (hoursRemaining <= 24) return <Badge variant="destructive">Ending Soon</Badge>;
    return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Polls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activePolls.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No active polls</p>
        ) : (
          activePolls.map((poll: any) => (
            <div key={poll.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">{poll.title}</h4>
                {getStatusBadge(poll.endDate)}
              </div>
              <p className="text-xs text-gray-600 mb-3">{poll.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Participation</span>
                  <span className="font-medium">
                    {poll.votesCount || 0}/{poll.eligibleVotersCount || 0} 
                    ({poll.eligibleVotersCount ? Math.round(((poll.votesCount || 0) / poll.eligibleVotersCount) * 100) : 0}%)
                  </span>
                </div>
                <Progress 
                  value={poll.eligibleVotersCount ? ((poll.votesCount || 0) / poll.eligibleVotersCount) * 100 : 0} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{getTimeRemaining(poll.endDate)}</span>
                  <Link href={`/results/${poll.id}`} className="text-primary hover:text-primary/80">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
