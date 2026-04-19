import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { insightsApi } from "@/api/endpoints";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from "react-hot-toast";
import { useAuth } from "@/store/AuthContext";

export default function InsightsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: anomaliesRaw, isLoading: loadingAnomalies } = useQuery({
    queryKey: ['anomalies'],
    queryFn: insightsApi.getAnomalies,
  });
  
  const { data: forecastRaw, isLoading: loadingForecast } = useQuery({
    queryKey: ['forecast'],
    queryFn: insightsApi.getForecast,
  });

  const refreshMutation = useMutation({
    mutationFn: insightsApi.refreshForecast,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['forecast'] });
      toast.success("Insights refreshed");
    }
  });

  if (loadingAnomalies || loadingForecast) return <div>Loading AI Insights...</div>;

  const anomaliesData = anomaliesRaw?.data;
  const forecastData = forecastRaw?.data;

  // Prepare chart data from overall historical + predicted
  let overallChartData = [];
  if (forecastData?.sufficient_data && forecastData.overall) {
    overallChartData = [...forecastData.overall.historical];
    // Add predicted point safely
    const lastHist = overallChartData[overallChartData.length - 1];
    if (lastHist) {
      overallChartData.push({
        month: `${forecastData.overall.next_year}-${forecastData.overall.next_month.toString().padStart(2, '0')}`,
        predicted: forecastData.overall.predicted_next_month,
      });
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" /> AI Insights
          </h1>
          <p className="text-muted-foreground mt-1">Machine Learning powered analysis of your finances</p>
        </div>
        <Button onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          Refresh Models
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Anomalies Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Anomaly Detection
              </CardTitle>
              <CardDescription>
                Identifies unusual spending patterns using an Isolation Forest algorithm looking at amount, day, hour, and category.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!anomaliesData?.sufficient_data ? (
                <div className="text-center p-6 border border-dashed rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Not enough data to run anomaly detection yet.<br/>(Need at least 10 transactions)</p>
                </div>
              ) : anomaliesData.anomalies.length === 0 ? (
                <div className="text-center p-6 border rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200">
                  <p className="font-medium">No anomalous transactions detected!</p>
                  <p className="text-sm mt-1">Your spending behavior looks normal.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Desc</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {anomaliesData.anomalies.map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="text-xs">{a.date}</TableCell>
                          <TableCell className="text-xs truncate max-w-[120px]">{a.note}</TableCell>
                          <TableCell className="text-right text-destructive font-medium">
                            {user?.currency} {a.amount}
                            <Badge variant="destructive" className="ml-2 scale-75 border-none">Anomalous</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Forecasting Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" /> Expense Forecast
              </CardTitle>
              <CardDescription>
                Predicts next month's total expenses using historic monthly totals via Linear Regression.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!forecastData?.sufficient_data ? (
                <div className="text-center p-6 border border-dashed rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Not enough historic data for forecasting.<br/>(Need at least 3 months of expenses)</p>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium pb-1">Predicted for Next Month</p>
                        <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: user?.currency }).format(forecastData.overall.predicted_next_month)}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground space-y-1">
                        <p>Model Accuracy:</p>
                        <p>MAE: ±{forecastData.overall.mae}</p>
                        <p>RMSE: ±{forecastData.overall.rmse}</p>
                      </div>
                   </div>

                   <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={overallChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" tickLine={false} axisLine={false}  />
                          <YAxis tickLine={false} axisLine={false} width={60} tickFormatter={(value) => `${value / 1000}k`} />
                          <Tooltip />
                          <Line type="monotone" dataKey="total" stroke="#64748b" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} name="Actual" />
                          <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={3} strokeDasharray="5 5" dot={{r:5}} activeDot={{r:7}} name="Predicted" />
                        </LineChart>
                      </ResponsiveContainer>
                   </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
