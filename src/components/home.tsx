import React from "react";
import { useAuth } from "@/contexts/AuthContext.jsx";
import { supabase } from "@/lib/supabase";
import { processUserMessage } from "@/lib/chat";
import ChatPane from "./ChatPane";
import TaskPane from "./TaskPane";
import Navbar from "./Navbar";

import { Button } from "./ui/button";

const Home = () => {
  const [projects, setProjects] = React.useState([]);

  const [messages, setMessages] = React.useState([
    {
      id: "1",
      message: "Hello! How can I help you manage your tasks today?",
      isAi: true,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [modelType, setModelType] = React.useState<"openai" | "gemini">(
    "gemini",
  );
  const [tasks, setTasks] = React.useState([]);
  const { user } = useAuth();

  const loadTasks = React.useCallback(async () => {
    if (!user) return;

    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id);

      if (!projectsError && projectsData) {
        setProjects(projectsData);
      }

      // Fetch tasks with their subtasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`*, subtasks (*)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;

      if (tasksData) {
        const transformedTasks = tasksData.map((task) => ({
          id: task.id,
          title: task.title,
          completed: task.completed || false,
          completedAt: task.completed_at
            ? new Date(task.completed_at).getTime()
            : undefined,
          priority: task.priority || "medium",
          dueDate: task.due_date ? new Date(task.due_date) : undefined,
          isStarred: task.is_starred || false,
          projectId: task.project_id,
          timeEstimate: task.time_estimate,
          subtasks:
            task.subtasks?.map((subtask) => ({
              id: subtask.id,
              title: subtask.title,
              completed: subtask.completed || false,
            })) || [],
        }));

        setTasks(transformedTasks);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  }, [user]);

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Set up realtime subscription
  React.useEffect(() => {
    if (!user) return;

    const tasksSubscription = supabase
      .channel("tasks-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          loadTasks();
        },
      )
      .subscribe();

    const subtasksSubscription = supabase
      .channel("subtasks-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subtasks" },
        () => {
          loadTasks();
        },
      )
      .subscribe();

    const projectsSubscription = supabase
      .channel("projects-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          loadTasks();
        },
      )
      .subscribe();

    return () => {
      tasksSubscription.unsubscribe();
      subtasksSubscription.unsubscribe();
      projectsSubscription.unsubscribe();
    };
  }, [user, loadTasks]);

  const handleSendMessage = async (message: string) => {
    // Limit conversation history to prevent token overflow
    if (messages.length > 10) {
      // Keep only the first welcome message and the 9 most recent messages
      const welcomeMessage = messages[0];
      const recentMessages = messages.slice(-9);
      setMessages([welcomeMessage, ...recentMessages]);
    }

    const newMessage = {
      id: String(messages.length + 1),
      message,
      isAi: false,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages([...messages, newMessage]);

    // Show typing indicator
    const typingIndicatorId = String(messages.length + 2);
    setMessages((prev) => [
      ...prev,
      {
        id: typingIndicatorId,
        message: "Thinking...",
        isAi: true,
        timestamp: new Date().toLocaleTimeString(),
        isTyping: true,
      },
    ]);

    try {
      const response = await processUserMessage(message, user.id, modelType);

      // Remove typing indicator and add actual response
      if (response.message) {
        if (response.confirmation) {
          // Handle deletion confirmation
          setMessages((prev) =>
            prev
              .filter((msg) => msg.id !== typingIndicatorId)
              .concat({
                id: String(messages.length + 2),
                message: response.message,
                isAi: true,
                timestamp: new Date().toLocaleTimeString(),
                confirmation: response.confirmation,
              }),
          );
        } else {
          // Regular response
          setMessages((prev) =>
            prev
              .filter((msg) => msg.id !== typingIndicatorId)
              .concat({
                id: String(messages.length + 2),
                message: response.message || "Got it! I've updated your tasks.",
                isAi: true,
                timestamp: new Date().toLocaleTimeString(),
              }),
          );
        }
      } else {
        // If no message was returned, add a default one
        setMessages((prev) =>
          prev
            .filter((msg) => msg.id !== typingIndicatorId)
            .concat({
              id: String(messages.length + 2),
              message: "Got it! I've updated your tasks.",
              isAi: true,
              timestamp: new Date().toLocaleTimeString(),
            }),
        );
      }

      // Refresh tasks after AI actions
      loadTasks();
    } catch (error) {
      console.error("Error processing message:", error);

      // If using Gemini and it fails, try to switch to OpenAI automatically
      if (
        modelType === "gemini" &&
        error.message &&
        error.message.includes("Gemini API error")
      ) {
        setModelType("openai");
        setMessages((prev) =>
          prev
            .filter((msg) => msg.id !== typingIndicatorId)
            .concat({
              id: String(messages.length + 2),
              message:
                "Gemini service is currently unavailable. I've switched to GPT-3.5 Turbo for you. Please try your message again.",
              isAi: true,
              timestamp: new Date().toLocaleTimeString(),
            }),
        );
      } else {
        // Regular error handling
        setMessages((prev) =>
          prev
            .filter((msg) => msg.id !== typingIndicatorId)
            .concat({
              id: String(messages.length + 2),
              message:
                "Sorry, I encountered an error processing your request: " +
                (error.message || error),
              isAi: true,
              timestamp: new Date().toLocaleTimeString(),
            }),
        );
      }
    }
  };

  const handleTaskToggle = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !user) return;

    const newCompletedState = !task.completed;
    const completedAt = newCompletedState ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          completed: newCompletedState,
          completed_at: completedAt,
        })
        .eq("id", taskId)
        .eq("user_id", user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const handleTaskReorder = (
    sourceIndex: number,
    targetIndex: number,
    targetSection?: string,
  ) => {
    setTasks((prevTasks) => {
      const newTasks = [...prevTasks];
      const [movedTask] = newTasks.splice(sourceIndex, 1);
      newTasks.splice(targetIndex, 0, movedTask);
      return newTasks;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background border-0 overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[600px] border-r border-border/40 overflow-hidden">
          <ChatPane
            messages={messages}
            onSendMessage={handleSendMessage}
            modelType={modelType}
            onModelChange={setModelType}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <TaskPane
            tasks={tasks}
            projects={projects}
            onTaskToggle={handleTaskToggle}
            onTaskReorder={handleTaskReorder}
            onTasksUpdate={setTasks}
            onToggleStar={(id) => {
              setTasks((prev) =>
                prev.map((task) =>
                  task.id === id
                    ? { ...task, isStarred: !task.isStarred }
                    : task,
                ),
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
