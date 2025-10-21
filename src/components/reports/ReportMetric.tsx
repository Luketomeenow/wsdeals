import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ReportMetricProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  positive?: boolean;
}

export function ReportMetric({ title, value, icon: Icon, trend, positive }: ReportMetricProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <p className={`text-xs ${positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}