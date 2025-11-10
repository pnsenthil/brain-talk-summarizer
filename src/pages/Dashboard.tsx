import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Clock, FileText, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
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
          value="12"
          icon={Users}
          trend={{ value: "8% from yesterday", positive: false }}
          iconBgColor="bg-medical-blue"
        />
        <StatsCard
          title="Avg Wait Time"
          value="18 min"
          icon={Clock}
          trend={{ value: "12% improvement", positive: true }}
          iconBgColor="bg-medical-teal"
        />
        <StatsCard
          title="Notes Completed"
          value="8/9"
          icon={FileText}
          iconBgColor="bg-success"
        />
        <StatsCard
          title="Follow-ups Due"
          value="5"
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
              {[
                { time: "09:00", name: "John Davis", type: "Follow-up", status: "completed" },
                { time: "09:30", name: "Emma Wilson", type: "New Patient", status: "in-progress" },
                { time: "10:00", name: "Michael Brown", type: "Follow-up", status: "waiting" },
                { time: "10:30", name: "Sarah Johnson", type: "Urgent", status: "waiting" },
              ].map((appointment, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-muted-foreground w-16">{appointment.time}</span>
                    <div>
                      <p className="font-medium text-foreground">{appointment.name}</p>
                      <p className="text-sm text-muted-foreground">{appointment.type}</p>
                    </div>
                  </div>
                  <Badge 
                    className={
                      appointment.status === "completed" ? "bg-success text-success-foreground" :
                      appointment.status === "in-progress" ? "bg-primary text-primary-foreground" :
                      "bg-muted text-muted-foreground"
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[
                { action: "Completed consultation", patient: "John Davis", time: "5 min ago" },
                { action: "Generated SOAP note", patient: "Emma Wilson", time: "15 min ago" },
                { action: "Prescribed medication", patient: "Michael Brown", time: "1 hour ago" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-medical-blue" />
                  <p className="flex-1">
                    <span className="font-medium">{activity.action}</span> for {activity.patient}
                  </p>
                  <span className="text-muted-foreground text-xs">{activity.time}</span>
                </div>
              ))}
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
                  <span className="font-medium">42</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-medical-blue" style={{ width: "84%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Notes Completion</span>
                  <span className="font-medium">95%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success" style={{ width: "95%" }} />
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
