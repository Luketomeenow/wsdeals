import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CallAnalyticsProps {
  callId: string;
}

interface Analytics {
  sentiment_score: number;
  sentiment_label: string;
  key_topics: string[];
  action_items: string[];
  call_quality_score: number;
  talk_time_ratio: number;
}

export function CallAnalytics({ callId }: CallAnalyticsProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [callId]);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('call_analytics')
        .select('*')
        .eq('call_id', callId)
        .maybeSingle();

      if (error) throw error;
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCall = async () => {
    setAnalyzing(true);
    try {
      const { error } = await supabase.functions.invoke('dialpad-analyze-call', {
        body: { call_id: callId },
      });

      if (error) throw error;
      await fetchAnalytics();
    } catch (error) {
      console.error('Error analyzing call:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getSentimentIcon = () => {
    if (!analytics) return null;
    
    if (analytics.sentiment_label === 'positive') {
      return <TrendingUp className="h-4 w-4 text-success" />;
    } else if (analytics.sentiment_label === 'negative') {
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getSentimentColor = () => {
    if (!analytics) return 'secondary';
    return analytics.sentiment_label === 'positive' ? 'success' :
           analytics.sentiment_label === 'negative' ? 'destructive' : 'secondary';
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading analytics...</div>;
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-4">
            No analytics available for this call.
          </p>
          <button
            onClick={analyzeCall}
            disabled={analyzing}
            className="text-sm text-primary hover:underline"
          >
            {analyzing ? 'Analyzing...' : 'Analyze Call'}
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Call Intelligence
          {getSentimentIcon()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sentiment */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Sentiment</span>
            <Badge variant={getSentimentColor()}>
              {analytics.sentiment_label}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Score: {(analytics.sentiment_score * 100).toFixed(0)}%
          </div>
        </div>

        {/* Call Quality */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Call Quality</span>
            <span className="text-sm font-bold">{analytics.call_quality_score}/100</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all"
              style={{ width: `${analytics.call_quality_score}%` }}
            />
          </div>
        </div>

        {/* Key Topics */}
        {analytics.key_topics && analytics.key_topics.length > 0 && (
          <div>
            <span className="text-sm font-medium block mb-2">Key Topics</span>
            <div className="flex flex-wrap gap-1">
              {analytics.key_topics.map((topic, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        {analytics.action_items && analytics.action_items.length > 0 && (
          <div>
            <span className="text-sm font-medium block mb-2">Action Items</span>
            <ul className="space-y-2">
              {analytics.action_items.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
