import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Search, CheckCircle2, X, Clock, Phone, Building2, User, Handshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NewTaskForm } from "@/components/tasks/NewTaskForm";
import { ClickToCall } from "@/components/calls/ClickToCall";
import { Link } from "react-router-dom";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  assigned_to?: string;
  created_at: string;
  deal_id?: string;
  contact_id?: string;
  company_id?: string;
  deals?: {
    id: string;
    name: string;
    stage: string;
    amount?: number;
  };
  contacts?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
  };
  companies?: {
    id: string;
    name: string;
    phone?: string;
  };
}

const priorityColors = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
} as const;

const statusColors = {
  pending: "secondary",
  in_progress: "primary",
  completed: "success",
  cancelled: "destructive",
} as const;

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          deals:deal_id (
            id,
            name,
            stage,
            amount
          ),
          contacts:contact_id (
            id,
            first_name,
            last_name,
            phone,
            email
          ),
          companies:company_id (
            id,
            name,
            phone
          )
        `)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ 
          status: newStatus as any,
          ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {})
        })
        .eq("id", taskId);

      if (error) throw error;

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus as any } : task
        )
      );

      toast.success(`Task marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.deals?.name.toLowerCase().includes(searchLower) ||
          task.contacts?.first_name.toLowerCase().includes(searchLower) ||
          task.contacts?.last_name.toLowerCase().includes(searchLower) ||
          task.companies?.name.toLowerCase().includes(searchLower)
      );
    }

    if (activeTab === "overdue") {
      filtered = filtered.filter(
        (task) =>
          task.status !== "completed" &&
          task.due_date &&
          new Date(task.due_date) < new Date()
      );
    } else if (activeTab === "today") {
      const today = new Date().toDateString();
      filtered = filtered.filter(
        (task) =>
          task.status !== "completed" &&
          task.due_date &&
          new Date(task.due_date).toDateString() === today
      );
    } else if (activeTab !== "all") {
      filtered = filtered.filter((task) => task.status === activeTab);
    }

    return filtered;
  }, [tasks, searchTerm, activeTab]);

  const startTaskQueue = () => {
    setCurrentTaskIndex(0);
    setActiveTab("queue");
  };

  const handleTaskAction = async (action: "complete" | "skip" | "reschedule") => {
    const currentTask = filteredTasks[currentTaskIndex];
    
    if (action === "complete") {
      await updateTaskStatus(currentTask.id, "completed");
    } else if (action === "reschedule") {
      toast.info("Reschedule functionality coming soon");
    }

    if (currentTaskIndex < filteredTasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      toast.success("All tasks completed!");
      setActiveTab("all");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 space-y-6 bg-gradient-subtle">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Tasks
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your tasks and follow up with deals
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {activeTab !== "queue" && (
            <Button onClick={startTaskQueue} variant="outline" className="shadow-soft">
              <Clock className="mr-2 h-4 w-4" />
              Start Queue Mode
            </Button>
          )}
          <NewTaskForm onSuccess={fetchTasks}>
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </NewTaskForm>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks, deals, contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="queue">Queue Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {filteredTasks.length > 0 && currentTaskIndex < filteredTasks.length ? (
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      Task {currentTaskIndex + 1} of {filteredTasks.length}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {filteredTasks[currentTaskIndex].title}
                    </CardDescription>
                  </div>
                  <Badge variant={priorityColors[filteredTasks[currentTaskIndex].priority as keyof typeof priorityColors]}>
                    {filteredTasks[currentTaskIndex].priority} priority
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {filteredTasks[currentTaskIndex].description && (
                  <p className="text-muted-foreground">
                    {filteredTasks[currentTaskIndex].description}
                  </p>
                )}

                {filteredTasks[currentTaskIndex].deals && (
                  <div className="p-4 bg-accent rounded-lg border space-y-2">
                    <div className="flex items-center space-x-2">
                      <Handshake className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Deal:</span>
                      <Link 
                        to={`/deals/${filteredTasks[currentTaskIndex].deals.id}`}
                        className="text-primary hover:underline"
                      >
                        {filteredTasks[currentTaskIndex].deals.name}
                      </Link>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Stage: {filteredTasks[currentTaskIndex].deals.stage}</span>
                      {filteredTasks[currentTaskIndex].deals.amount && (
                        <span>Value: ${filteredTasks[currentTaskIndex].deals.amount.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                )}

                {filteredTasks[currentTaskIndex].contacts && (
                  <div className="p-4 bg-accent rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Contact:</span>
                        <span>
                          {filteredTasks[currentTaskIndex].contacts.first_name}{" "}
                          {filteredTasks[currentTaskIndex].contacts.last_name}
                        </span>
                      </div>
                      {filteredTasks[currentTaskIndex].contacts.phone && (
                        <ClickToCall 
                          phoneNumber={filteredTasks[currentTaskIndex].contacts.phone!}
                          contactId={filteredTasks[currentTaskIndex].contacts.id}
                          dealId={filteredTasks[currentTaskIndex].deals?.id}
                        />
                      )}
                    </div>
                    {filteredTasks[currentTaskIndex].contacts.email && (
                      <div className="text-sm text-muted-foreground">
                        Email: {filteredTasks[currentTaskIndex].contacts.email}
                      </div>
                    )}
                  </div>
                )}

                {filteredTasks[currentTaskIndex].companies && (
                  <div className="p-4 bg-accent rounded-lg border space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-semibold">Company:</span>
                        <span>{filteredTasks[currentTaskIndex].companies.name}</span>
                      </div>
                      {filteredTasks[currentTaskIndex].companies.phone && (
                        <ClickToCall 
                          phoneNumber={filteredTasks[currentTaskIndex].companies.phone!}
                          companyId={filteredTasks[currentTaskIndex].companies.id}
                          dealId={filteredTasks[currentTaskIndex].deals?.id}
                        />
                      )}
                    </div>
                  </div>
                )}

                {filteredTasks[currentTaskIndex].due_date && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Due: {new Date(filteredTasks[currentTaskIndex].due_date).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-4 border-t">
                  <Button
                    onClick={() => handleTaskAction("complete")}
                    className="flex-1 shadow-glow"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete
                  </Button>
                  <Button
                    onClick={() => handleTaskAction("skip")}
                    variant="outline"
                    className="flex-1"
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={() => handleTaskAction("reschedule")}
                    variant="outline"
                    className="flex-1"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Reschedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No tasks in queue</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {["all", "overdue", "today"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <Card key={task.id} className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant={statusColors[task.status as keyof typeof statusColors]}>
                          {task.status}
                        </Badge>
                        <Badge variant={priorityColors[task.priority as keyof typeof priorityColors]}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    {task.description && (
                      <CardDescription>{task.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {task.deals && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Handshake className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Deal:</span>
                        <Link 
                          to={`/deals/${task.deals.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {task.deals.name}
                        </Link>
                        <span className="text-muted-foreground">
                          ({task.deals.stage})
                        </span>
                      </div>
                    )}

                    {task.contacts && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Contact:</span>
                          <span className="font-medium">
                            {task.contacts.first_name} {task.contacts.last_name}
                          </span>
                        </div>
                        {task.contacts.phone && (
                          <ClickToCall 
                            phoneNumber={task.contacts.phone}
                            contactId={task.contacts.id}
                            dealId={task.deals?.id}
                          />
                        )}
                      </div>
                    )}

                    {task.companies && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Company:</span>
                        <span className="font-medium">{task.companies.name}</span>
                      </div>
                    )}

                    {task.due_date && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {new Date(task.due_date).toLocaleString()}</span>
                      </div>
                    )}

                    {task.status !== "completed" && (
                      <div className="flex items-center space-x-2 pt-2 border-t">
                        <Button
                          onClick={() => updateTaskStatus(task.id, "completed")}
                          size="sm"
                          className="shadow-glow"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Complete
                        </Button>
                        <Button
                          onClick={() => updateTaskStatus(task.id, "in_progress")}
                          size="sm"
                          variant="outline"
                        >
                          In Progress
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No tasks found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
