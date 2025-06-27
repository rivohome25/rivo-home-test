"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import {
  format,
  parseISO,
  isSameDay,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { toast } from "sonner";
import { Calendar, CheckCircle, Circle, Home } from "lucide-react";

type Task = {
  id: string;
  task_id: number;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string; // "YYYY-MM-DD"
  property_id: string;
  property_address?: string;
};

type Property = {
  id: string;
  address: string;
};

export default function TaskCalendar() {
  const supabase: SupabaseClient = createClientComponentClient();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [tasksOnDate, setTasksOnDate] = useState<Task[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch user properties for display
  const fetchProperties = async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("id, address")
      .order("address");

    if (error) {
      console.error("Error fetching properties:", error);
    } else if (data) {
      setProperties(data);
    }
  };

  // Fetch all user_tasks for the current month
  const fetchTasksForMonth = async (year: number, month: number) => {
    setLoading(true);
    setErrorMsg(null);

    // Build start_of_month and end_of_month strings
    const start = format(startOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");
    const end = format(endOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("user_tasks")
      .select(`
        id,
        task_id,
        completed,
        due_date,
        property_id,
        master_tasks!inner(name, description),
        properties!inner(address)
      `)
      .gte("due_date", start)
      .lte("due_date", end)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching tasks:", error);
      setErrorMsg(error.message);
      toast.error("Failed to load maintenance tasks");
    } else if (data) {
      // Map master_tasks and properties joins to our Task type
      const mapped = data.map((row: any) => ({
        id: row.id,
        task_id: row.task_id,
        title: row.master_tasks.name,
        description: row.master_tasks.description,
        completed: row.completed,
        due_date: row.due_date,
        property_id: row.property_id,
        property_address: row.properties.address,
      }));
      setTasks(mapped);
    }

    setLoading(false);
  };

  // On mount, fetch properties and tasks for the current month
  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    fetchTasksForMonth(year, month);
  }, [currentMonth]);

  // When a date is selected, filter tasks
  useEffect(() => {
    if (!selectedDate) {
      setTasksOnDate([]);
      return;
    }
    const selectedStr = format(selectedDate, "yyyy-MM-dd");
    const filtered = tasks.filter((t) => t.due_date === selectedStr);
    setTasksOnDate(filtered);
  }, [selectedDate, tasks]);

  // Mark a task as completed/incomplete
  const toggleComplete = async (task: Task) => {
    setLoading(true);
    
    // Update the task completion status
    const { error } = await supabase
      .from("user_tasks")
      .update({ completed: !task.completed })
      .eq("id", task.id);

    if (error) {
      console.error("Error toggling task:", error);
      setErrorMsg(error.message);
      toast.error("Failed to update task status");
      setLoading(false);
      return;
    }

    // If marking as completed, insert into user_task_history
    if (!task.completed) {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error: historyError } = await supabase
          .from("user_task_history")
          .insert({
            user_id: user.id,
            property_id: task.property_id,
            task_type: task.title,
            task_date: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
            source: "self_reported", // Default to self-reported for now
            verification_level: 0.6,
            notes: "Task completed via dashboard",
            media_url: null,
          });

        if (historyError) {
          console.error("Error creating task history:", historyError);
          // Don't fail the operation, but log the error
        }
      }
    }

    // Update local state
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, completed: !t.completed } : t
      )
    );
    
    toast.success(
      `Task marked as ${!task.completed ? "completed" : "incomplete"}`
    );
    
    setLoading(false);
  };

  // Compute "modifiers" for react-day-picker (to highlight days with tasks)
  const modifiers: Record<string, Date[]> = {
    hasTask: tasks.map((t) => parseISO(t.due_date)),
    completedTask: tasks
      .filter((t) => t.completed)
      .map((t) => parseISO(t.due_date)),
    hasIncompleteTask: tasks
      .filter((t) => !t.completed)
      .map((t) => parseISO(t.due_date)),
  };

  // Group tasks by completion status for selected date
  const completedTasksOnDate = tasksOnDate.filter((t) => t.completed);
  const incompleteTasksOnDate = tasksOnDate.filter((t) => !t.completed);

  // Get property name by id
  const getPropertyAddress = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    return property?.address || "Unknown Property";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* CALENDAR */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Maintenance Calendar
            </h2>
          </div>

          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            captionLayout="dropdown"
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            modifiers={modifiers}
            modifiersStyles={{
              hasTask: {
                backgroundColor: "#fef3c7", // amber-100 for tasks
                borderColor: "#f59e0b", // amber-500 border
                borderWidth: "2px",
              },
              hasIncompleteTask: {
                backgroundColor: "#fef3c7", // amber-100 for incomplete
                borderColor: "#f59e0b", // amber-500 border
                borderWidth: "2px",
              },
              completedTask: {
                backgroundColor: "#d1fae5", // green-100 for completed
                borderColor: "#10b981", // green-500 border
                borderWidth: "2px",
              },
            }}
            className="!font-sans"
          />

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 bg-amber-100 border-2 border-amber-500 rounded"></span>
              <span>Tasks Due</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 bg-green-100 border-2 border-green-500 rounded"></span>
              <span>Tasks Completed</span>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading tasks...</span>
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{errorMsg}</div>
            </div>
          )}
        </div>
      </div>

      {/* TASK LIST FOR SELECTED DATE */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedDate
              ? `Tasks for ${format(selectedDate, "MMMM d, yyyy")}`
              : "Select a date to view tasks"}
          </h3>

          {selectedDate && tasksOnDate.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No tasks scheduled for this day.</p>
            </div>
          )}

          {selectedDate && tasksOnDate.length > 0 && (
            <div className="space-y-6">
              {/* Incomplete Tasks */}
              {incompleteTasksOnDate.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-amber-800 mb-3 flex items-center gap-2">
                    <Circle className="h-4 w-4" />
                    Pending Tasks ({incompleteTasksOnDate.length})
                  </h4>
                  <div className="space-y-3">
                    {incompleteTasksOnDate.map((task) => (
                      <div
                        key={task.id}
                        className="border border-amber-200 rounded-lg p-4 bg-amber-50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <Home className="h-3 w-3" />
                              <span>{task.property_address}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleComplete(task)}
                            className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            disabled={loading}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks */}
              {completedTasksOnDate.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Completed Tasks ({completedTasksOnDate.length})
                  </h4>
                  <div className="space-y-3">
                    {completedTasksOnDate.map((task) => (
                      <div
                        key={task.id}
                        className="border border-green-200 rounded-lg p-4 bg-green-50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 line-through">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <Home className="h-3 w-3" />
                              <span>{task.property_address}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleComplete(task)}
                            className="ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            disabled={loading}
                          >
                            <Circle className="h-4 w-4 mr-1" />
                            Undo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Task Summary */}
        {tasks.length > 0 && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              This Month Summary
            </h4>
            <div className="text-sm text-blue-800">
              <p>
                {tasks.filter((t) => t.completed).length} of {tasks.length}{" "}
                tasks completed
              </p>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      tasks.length > 0
                        ? (tasks.filter((t) => t.completed).length /
                            tasks.length) *
                          100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 