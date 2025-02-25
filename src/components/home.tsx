import React from "react";
import ChatPane from "./ChatPane";
import TaskPane from "./TaskPane";

const Home = () => {
  const [messages, setMessages] = React.useState([
    {
      id: "1",
      message: "Hello! How can I help you manage your tasks today?",
      isAi: true,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [tasks, setTasks] = React.useState([
    // Starred tasks
    {
      id: "1",
      title: "Complete project proposal",
      completed: false,
      priority: "high",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      isStarred: true,
      timeEstimate: 2,
      subtasks: [
        { id: "1-1", title: "Research market trends", completed: true },
        { id: "1-2", title: "Draft executive summary", completed: false },
      ],
    },
    {
      id: "2",
      title: "Strategic planning meeting",
      completed: false,
      priority: "high",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      isStarred: true,
      timeEstimate: 1.5,
      subtasks: [],
    },

    // Due today
    {
      id: "3",
      title: "Submit quarterly report",
      completed: false,
      priority: "high",
      dueDate: new Date(),
      isStarred: false,
      timeEstimate: 3,
      subtasks: [],
    },
    {
      id: "4",
      title: "Client presentation review",
      completed: false,
      priority: "medium",
      dueDate: new Date(),
      isStarred: false,
      timeEstimate: 1,
      subtasks: [],
    },

    // Due tomorrow
    {
      id: "5",
      title: "Team sync meeting",
      completed: false,
      priority: "medium",
      dueDate: new Date(Date.now() + 86400000),
      isStarred: false,
      timeEstimate: 1,
      subtasks: [],
    },

    // Due this week
    {
      id: "6",
      title: "Code review for feature X",
      completed: false,
      priority: "medium",
      dueDate: new Date(Date.now() + 86400000 * 4),
      isStarred: false,
      timeEstimate: 2,
      subtasks: [],
    },
    {
      id: "7",
      title: "Update documentation",
      completed: false,
      priority: "low",
      dueDate: new Date(Date.now() + 86400000 * 6),
      isStarred: false,
      timeEstimate: 3,
      subtasks: [],
    },

    // Due next week
    {
      id: "8",
      title: "Sprint planning",
      completed: false,
      priority: "high",
      dueDate: new Date(Date.now() + 86400000 * 8),
      isStarred: false,
      timeEstimate: 2,
      subtasks: [],
    },
    {
      id: "9",
      title: "Quarterly goals review",
      completed: false,
      priority: "medium",
      dueDate: new Date(Date.now() + 86400000 * 10),
      isStarred: false,
      timeEstimate: 1.5,
      subtasks: [],
    },

    // Future tasks
    {
      id: "10",
      title: "Annual strategy meeting",
      completed: false,
      priority: "high",
      dueDate: new Date(Date.now() + 86400000 * 20),
      isStarred: false,
      timeEstimate: 4,
      subtasks: [],
    },

    // No due date
    {
      id: "11",
      title: "Research new technologies",
      completed: false,
      priority: "low",
      isStarred: false,
      timeEstimate: 2,
      subtasks: [],
    },

    // Completed tasks
    {
      id: "12",
      title: "Setup development environment",
      completed: true,
      completedAt: Date.now() - 1000 * 60 * 30,
      priority: "medium",
      isStarred: false,
      timeEstimate: 1,
      subtasks: [],
    },
    {
      id: "13",
      title: "Initial project setup",
      completed: true,
      completedAt: Date.now() - 1000 * 60 * 60 * 2,
      priority: "high",
      isStarred: false,
      timeEstimate: 2,
      subtasks: [],
    },
  ]);

  const handleSendMessage = (message: string) => {
    const newMessage = {
      id: String(messages.length + 1),
      message,
      isAi: false,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages([...messages, newMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: String(messages.length + 2),
        message: "I'll help you with that task!",
        isAi: true,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const handleTaskToggle = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? Date.now() : undefined,
            }
          : task,
      ),
    );
  };

  const getDateForSection = (section: string): Date | undefined => {
    const now = new Date();
    switch (section) {
      case "Due Today & Overdue":
        return now;
      case "Due Tomorrow":
        return new Date(now.getTime() + 86400000);
      case "Due This Week":
        return new Date(now.getTime() + 86400000 * 3); // Middle of the week
      case "Due Next Week":
        return new Date(now.getTime() + 86400000 * 10); // Middle of next week
      case "Future Tasks":
        return new Date(now.getTime() + 86400000 * 15); // Two weeks from now
      default:
        return undefined;
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

      // Create a new task object to ensure state update
      const updatedTask = {
        ...movedTask,
        dueDate:
          targetSection && !movedTask.isStarred && !movedTask.completed
            ? getDateForSection(targetSection)
            : movedTask.dueDate,
      };

      // Insert the task at the target position
      newTasks.splice(targetIndex, 0, updatedTask);
      return newTasks;
    });
  };

  return (
    <div className="flex h-screen bg-background border-0">
      <div className="w-[600px]">
        <ChatPane messages={messages} onSendMessage={handleSendMessage} />
      </div>
      <div className="flex-1">
        <TaskPane
          tasks={tasks}
          onTaskToggle={handleTaskToggle}
          onTaskReorder={handleTaskReorder}
          onTasksUpdate={setTasks}
          onToggleStar={(id) => {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === id ? { ...task, isStarred: !task.isStarred } : task,
              ),
            );
          }}
        />
      </div>
    </div>
  );
};

export default Home;
