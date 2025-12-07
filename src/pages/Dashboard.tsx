import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Clock, FileText, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Consultation {
  id: string;
  scheduled_time: string | null;
  status: string | null;
  patients: {
    full_name: string;
  } | null;
  visit_type: string | null;
}

interface DashboardStats {
  patientsToday: number;
  avgWaitTime: number;
  notesCompleted: number;
  totalConsultations: number;
  followUpsDue: number;
}

const Dashboard = () => {
  const [todayConsultations, setTodayConsultations] = useState<Consultation[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    patientsToday: 0,
    avgWaitTime: 0,
    notesCompleted: 0,
    totalConsultations: 0,
    followUpsDue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch today's consultations
      const { data: consultations, error: consultationsError } = await supabase
        .from('consultations')
        .select(`
          id,
          scheduled_time,
          status,
          visit_type,
          patients (
            full_name
          )
        `)
        .gte('scheduled_time', today.toISOString())
        .lt('scheduled_time', tomorrow.toISOString())
        .order('scheduled_time', { ascending: true });

      if (consultationsError) throw consultationsError;

      setTodayConsultations(consultations || []);

      // Calculate stats
      const completedCount = consultations?.filter(c => c.status === 'completed').length || 0;
      const totalCount = consultations?.length || 0;

      // Fetch completed notes count
      const { count: notesCount } = await supabase
        .from('clinical_notes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Fetch recent activity (completed consultations)
      const { data: recentConsultations } = await supabase
        .from('consultations')
        .select(`
          id,
          status,
          updated_at,
          patients (
            full_name
          )
        `)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(5);

      const activity = (recentConsultations || []).map(c => ({
        action: "Completed consultation",
        patient: c.patients?.full_name || 'Unknown',
        time: getTimeAgo(new Date(c.updated_at || '')),
      }));

      setRecentActivity(activity);

      setStats({
        patientsToday: totalCount,
        avgWaitTime: 18, // This could be calculated from actual data
        notesCompleted: notesCount || 0,
        totalConsultations: totalCount,
        followUpsDue: 5, // This could be fetched from a follow-ups table
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getStatusBadgeClass = (status: string | null) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'in_progress':
        return 'bg-primary text-primary-foreground';
      case 'waiting':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatStatus = (status: string | null) => {
    if (!status) return 'Pending';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Welcome back, Dr. Mitchell</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Patients Today"
          value={isLoading ? "..." : String(stats.patientsToday)}
          icon={Users}
          iconBgColor="bg-medical-blue"
        />
        <StatsCard
          title="Avg Wait Time"
          value={`${stats.avgWaitTime} min`}
          icon={Clock}
          trend={{ value: "12% improvement", positive: true }}
          iconBgColor="bg-medical-teal"
        />
        <StatsCard
          title="Notes Completed"
          value={isLoading ? "..." : `${stats.notesCompleted}/${stats.totalConsultations}`}
          icon={FileText}
          iconBgColor="bg-success"
        />
        <StatsCard
          title="Follow-ups Due"
          value={String(stats.followUpsDue)}
          icon={Calendar}
          iconBgColor="bg-warning"
        />
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Today's Schedule</h3>
              <Button variant="outline" size="sm">View All</Button>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : todayConsultations.length === 0 ? (
                <p className="text-muted-foreground text-sm">No consultations scheduled for today</p>
              ) : (
                todayConsultations.map((consultation) => (
                  <div key={consultation.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-muted-foreground w-16">
                        {formatTime(consultation.scheduled_time)}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">
                          {consultation.patients?.full_name || 'Unknown Patient'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {consultation.visit_type || 'Consultation'}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusBadgeClass(consultation.status)}>
                      {formatStatus(consultation.status)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-sm">No recent activity</p>
              ) : (
                recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-medical-blue" />
                    <p className="flex-1">
                      <span className="font-medium">{activity.action}</span> for {activity.patient}
                    </p>
                    <span className="text-muted-foreground text-xs">{activity.time}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar - Alerts & Metrics */}
        <div className="space-y-6">
          {/* Alerts */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-alert-amber" />
              <h3 className="text-lg font-semibold">Alerts</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-alert-red/10 border border-alert-red/20">
                <p className="font-medium text-sm text-alert-red">Drug Interaction Alert</p>
                <p className="text-xs text-muted-foreground mt-1">3 pending reviews</p>
              </div>
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="font-medium text-sm text-warning">Incomplete Triages</p>
                <p className="text-xs text-muted-foreground mt-1">2 patients waiting</p>
              </div>
              <div className="p-3 rounded-lg bg-medical-blue/10 border border-medical-blue/20">
                <p className="font-medium text-sm text-medical-blue">Follow-up Due</p>
                <p className="text-xs text-muted-foreground mt-1">5 patients this week</p>
              </div>
            </div>
          </Card>

          {/* Performance Metrics */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-success" />
              <h3 className="text-lg font-semibold">This Week</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Consultations</span>
                  <span className="font-medium">{stats.totalConsultations}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-medical-blue" style={{ width: `${Math.min(stats.totalConsultations * 2, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Notes Completion</span>
                  <span className="font-medium">
                    {stats.totalConsultations > 0 
                      ? Math.round((stats.notesCompleted / stats.totalConsultations) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success" 
                    style={{ 
                      width: `${stats.totalConsultations > 0 
                        ? (stats.notesCompleted / stats.totalConsultations) * 100 
                        : 0}%` 
                    }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Avg. Time/Patient</span>
                  <span className="font-medium">23 min</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-medical-teal" style={{ width: "76%" }} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
