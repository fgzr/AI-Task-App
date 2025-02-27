import { supabase } from "./supabase";
import { getChatCompletion } from "./openai";

type SubTask = {
  id?: string;
  title: string;
  completed?: boolean;
};

type Task = {
  id?: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  projectId?: string;
  projectKey?: string; // Reference to a newly created project
  projectName?: string; // Alternative reference to a newly created project
  dueDate?: Date;
  timeEstimate?: number;
  subtasks?: SubTask[];
  completed?: boolean;
};

type Project = {
  id?: string;
  name: string;
  color: string;
  key?: string; // Optional key to reference this project when creating tasks
};

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

// Store conversation history - limited to fewer messages to reduce token usage
let conversationHistory: ChatMessage[] = [];

export async function processUserMessage(message: string, userId: string) {
  // Get existing tasks and projects for context - limit to recent/relevant items only
  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("*, subtasks(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20); // Only get the 20 most recent tasks

  const { data: existingProjects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId);

  // Format existing data for context - minimize data sent to API
  const tasksContext = existingTasks
    ? existingTasks.map((task) => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        projectId: task.project_id,
        completed: task.completed,
        // Only include essential subtask data
        subtasks: task.subtasks?.map((st) => ({
          id: st.id,
          title: st.title,
          completed: st.completed,
        })),
      }))
    : [];

  const projectsContext = existingProjects
    ? existingProjects.map((project) => ({
        id: project.id,
        name: project.name,
        color: project.color,
      }))
    : [];

  // Add user message to conversation history
  conversationHistory.push({ role: "user", content: message });

  // Keep only the last 5 messages to reduce token usage
  if (conversationHistory.length > 5) {
    conversationHistory = conversationHistory.slice(
      conversationHistory.length - 5,
    );
  }

  // Prepare messages for the AI - with a more explicit system prompt
  const messages = [
    {
      role: "system" as const,
      content: `You are a task management AI assistant. Help users manage tasks and projects.
      
      CONTEXT (Recent items only):
      Tasks: ${JSON.stringify(tasksContext)}
      Projects: ${JSON.stringify(projectsContext)}
      
      ULTRA CRITICAL INSTRUCTIONS:
      1. NEVER say you created something unless you include the __ACTION_DATA marker with the creation data
      2. ALWAYS include the __ACTION_DATA marker in responses when creating/modifying data
      3. CREATE TASKS AND PROJECTS IMMEDIATELY without asking follow-up questions
      4. SUGGEST SPECIFIC TASKS based on the project type - don't ask the user what tasks they want
      5. If user mentions a business type (bookstore, restaurant, etc.), CREATE A PROJECT AND SUGGEST RELEVANT TASKS
      6. When user asks to add subtasks to an existing task, use "add_subtasks" action type, NOT "create_task"
      
      BOOKSTORE EXAMPLE:
      User: "I need to set up my bookstore"
      Assistant: "Created a Bookstore project with initial setup tasks."
      __ACTION_DATA: { "actions": [
        { "type": "create_project", "data": { "name": "Bookstore", "color": "#4f46e5" } },
        { "type": "create_task", "data": { "title": "Set up inventory system", "priority": "high", "projectKey": "Bookstore", "subtasks": [{"title":"Research inventory software"},{"title":"Import initial book catalog"}] } },
        { "type": "create_task", "data": { "title": "Design store layout", "priority": "medium", "projectKey": "Bookstore" } },
        { "type": "create_task", "data": { "title": "Hire staff", "priority": "medium", "projectKey": "Bookstore" } }
      ] }
      
      ADDING SUBTASKS EXAMPLE:
      User: "Can you add subtasks to the Hire staff task?"
      Assistant: "Added subtasks to the Hire staff task."
      __ACTION_DATA: { "actions": [
        { "type": "add_subtasks", "data": { "id": "task-id-for-hire-staff", "subtasks": [{"title":"Write job descriptions"},{"title":"Post job listings"},{"title":"Schedule interviews"}] } }
      ] }
      
      RESTAURANT EXAMPLE:
      User: "I'm opening a restaurant"
      Assistant: "Created a Restaurant project with essential startup tasks."
      __ACTION_DATA: { "actions": [
        { "type": "create_project", "data": { "name": "Restaurant", "color": "#ef4444" } },
        { "type": "create_task", "data": { "title": "Develop menu", "priority": "high", "projectKey": "Restaurant", "subtasks": [{"title":"Research competitors"},{"title":"Test recipes"}] } },
        { "type": "create_task", "data": { "title": "Obtain permits and licenses", "priority": "high", "projectKey": "Restaurant" } }
      ] }
      
      RESPONSE FORMAT:
      [Your brief response to user]
      __ACTION_DATA: { "actions": [{ "type": "action_type", "data": { ... } }] }
      
      Action types: "create_task", "update_task", "delete_task", "create_project", "update_project", "delete_project", "complete_task", "add_subtasks"
      
      Task fields: id, title, description, priority("low","medium","high"), projectId, projectKey/projectName, dueDate, timeEstimate, subtasks, completed
      
      Project fields: id, name, color, key
      
      CRITICAL RULES:
      1. NEVER say you created something without including the __ACTION_DATA marker
      2. ALWAYS suggest specific tasks based on the project type
      3. Keep responses brief (1 sentence max)
      4. Create projects before tasks
      5. Assign tasks to projects using projectKey/projectName
      6. Include subtasks for complex tasks
      7. If user mentions a specific project name, use that exact name
      8. When user asks to add subtasks to an existing task, use "add_subtasks" action type with the task id`,
    },
    ...conversationHistory,
  ];

  const response = await getChatCompletion(messages);
  if (!response?.content) throw new Error("No response from AI");

  // Add AI response to conversation history
  conversationHistory.push({ role: "assistant", content: response.content });

  // Parse the AI response for actions
  const actions = parseAIResponse(response.content);

  if (!actions || actions.length === 0) {
    console.log("No actions found in AI response:", response.content);
    return {
      message:
        response.content.split("__ACTION_DATA:")[0].trim() ||
        "I've processed your request.",
    };
  }

  // Process project actions first, then task actions
  const projectActions = actions.filter(
    (action) =>
      action.type === "create_project" ||
      action.type === "update_project" ||
      action.type === "delete_project",
  );

  const taskActions = actions.filter(
    (action) =>
      action.type === "create_task" ||
      action.type === "update_task" ||
      action.type === "delete_task" ||
      action.type === "complete_task" ||
      action.type === "add_subtasks",
  );

  console.log("Project actions:", projectActions);
  console.log("Task actions:", taskActions);

  // Store newly created project IDs to use for tasks
  const newProjectIds = new Map();

  // Execute project actions first
  for (const action of projectActions) {
    switch (action.type) {
      case "create_project":
        try {
          const newProject = await createProject(action.data, userId);
          if (newProject && newProject.id) {
            // Store the new project ID with a key that can be referenced by tasks
            if (action.data.key) {
              newProjectIds.set(action.data.key, newProject.id);
            }
            // Always store by name as well for easier reference
            newProjectIds.set(action.data.name, newProject.id);
            console.log(
              `Created project ${action.data.name} with ID ${newProject.id}`,
            );
          }
        } catch (error) {
          console.error("Error creating project:", error);
          throw error;
        }
        break;
      case "update_project":
        await updateProject(action.data.id, action.data, userId);
        break;
      case "delete_project":
        // Don't delete immediately, ask for confirmation
        return {
          message: response.content.split("__ACTION_DATA:")[0].trim(),
          confirmation: {
            type: "delete_project",
            id: action.data.id,
          },
        };
    }
  }

  // Then execute task actions
  for (const action of taskActions) {
    switch (action.type) {
      case "create_task":
        try {
          // Check if this task references a newly created project
          if (
            action.data.projectKey &&
            newProjectIds.has(action.data.projectKey)
          ) {
            // Replace the projectKey with the actual projectId
            action.data.projectId = newProjectIds.get(action.data.projectKey);
            console.log(
              `Assigning task to project with key ${action.data.projectKey}, ID: ${action.data.projectId}`,
            );
          } else if (
            action.data.projectName &&
            newProjectIds.has(action.data.projectName)
          ) {
            // Also check if projectName is used as a reference
            action.data.projectId = newProjectIds.get(action.data.projectName);
            console.log(
              `Assigning task to project with name ${action.data.projectName}, ID: ${action.data.projectId}`,
            );
          }

          await createTask(action.data, userId);
        } catch (error) {
          console.error("Error creating task:", error);
          throw error;
        }
        break;
      case "update_task":
        await updateTask(action.data.id, action.data, userId);
        break;
      case "add_subtasks":
        try {
          // If we have a task ID, use it directly
          if (action.data.id) {
            await addSubtasksToTask(
              action.data.id,
              action.data.subtasks,
              userId,
            );
          }
          // If we have a task name but no ID, try to find the task by name
          else if (action.data.taskName) {
            console.log(`Looking up task by name: "${action.data.taskName}"`);
            const task = await findTaskByName(action.data.taskName, userId);

            if (task) {
              await addSubtasksToTask(task.id, action.data.subtasks, userId);
              console.log(`Successfully added subtasks to task: ${task.title}`);
            } else {
              console.error(
                `Could not find task with name: ${action.data.taskName}`,
              );
              throw new Error(`Task not found: ${action.data.taskName}`);
            }
          } else {
            throw new Error("No task ID or name provided for adding subtasks");
          }
        } catch (error) {
          console.error("Error adding subtasks:", error);
          throw error;
        }
        break;
      case "delete_task":
        // Don't delete immediately, ask for confirmation
        return {
          message: response.content.split("__ACTION_DATA:")[0].trim(),
          confirmation: {
            type: "delete_task",
            id: action.data.id,
          },
        };
      case "complete_task":
        await completeTask(action.data.id, userId);
        break;
    }
  }

  const parts = response.content.split("__ACTION_DATA:");
  return { message: parts[0].trim() || "Got it! I've updated your tasks." };
}

// Helper function to find a task by name in the tasks context
async function findTaskByName(taskName: string, userId: string) {
  console.log(`Looking for task with name similar to: "${taskName}"`);

  // Normalize the task name for comparison
  const normalizedSearchName = taskName.toLowerCase().trim();

  try {
    // Get all tasks for this user
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    if (!tasks || tasks.length === 0) return null;

    // Try to find an exact match first
    let matchedTask = tasks.find(
      (task) => task.title.toLowerCase() === normalizedSearchName,
    );

    // If no exact match, try to find a task that contains the search term
    if (!matchedTask) {
      matchedTask = tasks.find((task) =>
        task.title.toLowerCase().includes(normalizedSearchName),
      );
    }

    // If still no match, try to find a task where the search term contains the task name
    if (!matchedTask) {
      matchedTask = tasks.find((task) =>
        normalizedSearchName.includes(task.title.toLowerCase()),
      );
    }

    if (matchedTask) {
      console.log(
        `Found matching task: ${matchedTask.title} (ID: ${matchedTask.id})`,
      );
      return matchedTask;
    }

    console.log(`No matching task found for: "${taskName}"`);
    return null;
  } catch (error) {
    console.error("Error finding task by name:", error);
    return null;
  }
}

function parseAIResponse(content: string) {
  console.log("Full AI response:", content);
  const parts = content.split("__ACTION_DATA:");

  if (parts.length < 2) {
    console.log("No __ACTION_DATA: marker found in response");

    // Check if the response mentions creating a project or task without action data
    const lowerContent = content.toLowerCase();

    // Check for subtask additions
    if (lowerContent.includes("added") && lowerContent.includes("subtask")) {
      console.log("AI claimed to add subtasks but didn't include action data");

      // Try to extract the task name and subtasks from the response
      const taskNameMatch =
        content.match(/added .* subtasks? to the ["']?([\w\s]+)["']? task/i) ||
        content.match(/added .* to the ["']?([\w\s]+)["']? task/i) ||
        content.match(/added the following subtasks? to ["']?([\w\s]+)["']?/i);

      if (taskNameMatch && taskNameMatch[1]) {
        const taskName = taskNameMatch[1].trim();
        console.log(`Extracted task name: "${taskName}"`);

        // Extract subtasks from numbered or bulleted list
        const subtasks = [];
        const lines = content.split("\n");

        for (const line of lines) {
          const trimmedLine = line.trim();
          // Match numbered items like "1. Task name" or bulleted items like "• Task name" or "- Task name"
          const subtaskMatch =
            trimmedLine.match(/^\d+\.\s+(.+)$/) ||
            trimmedLine.match(/^[•\-\*]\s+(.+)$/);

          if (subtaskMatch && subtaskMatch[1]) {
            subtasks.push({ title: subtaskMatch[1].trim() });
          }
        }

        if (subtasks.length > 0) {
          console.log(`Extracted ${subtasks.length} subtasks:`, subtasks);

          return [
            {
              type: "add_subtasks",
              data: {
                taskName: taskName, // We'll use this to look up the task ID
                subtasks: subtasks,
              },
            },
          ];
        }
      }
    }

    // Check for project or task creation
    if (
      lowerContent.includes("created") ||
      lowerContent.includes("added") ||
      lowerContent.includes("new project") ||
      lowerContent.includes("new task")
    ) {
      console.log(
        "AI claimed to create something but didn't include action data",
      );

      // Create fallback actions based on content
      if (lowerContent.includes("bookstore")) {
        console.log("Creating fallback bookstore project and tasks");
        return [
          {
            type: "create_project",
            data: {
              name: "Bookstore",
              color: "#4f46e5",
            },
          },
          {
            type: "create_task",
            data: {
              title: "Set up inventory system",
              priority: "high",
              projectKey: "Bookstore",
              subtasks: [
                { title: "Research inventory software" },
                { title: "Import initial book catalog" },
              ],
            },
          },
          {
            type: "create_task",
            data: {
              title: "Design store layout",
              priority: "medium",
              projectKey: "Bookstore",
            },
          },
          {
            type: "create_task",
            data: {
              title: "Hire staff",
              priority: "medium",
              projectKey: "Bookstore",
            },
          },
        ];
      }
    }

    return [];
  }

  try {
    // Clean up the JSON string before parsing
    let actionData = parts[1].trim();
    console.log("Raw action data:", actionData);

    // Find the opening and closing braces of the JSON object
    const firstBrace = actionData.indexOf("{");
    let lastBrace = actionData.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      console.error("Invalid JSON format: missing braces");
      return [];
    }

    // Extract just the JSON object
    actionData = actionData.substring(firstBrace, lastBrace + 1);
    console.log("Extracted JSON:", actionData);

    const parsedData = JSON.parse(actionData);
    console.log("Parsed data:", parsedData);
    return parsedData.actions || [];
  } catch (error) {
    console.error("Error parsing AI response:", error);
    console.error("Content that failed to parse:", content);
    return [];
  }
}

async function createTask(task: Task, userId: string) {
  // Set default values
  const priority = task.priority || "medium";
  const timeEstimate = task.timeEstimate || estimateTaskEffort(task);

  const { data, error } = await supabase
    .from("tasks")
    .insert([
      {
        title: task.title,
        description: task.description,
        priority: priority,
        project_id: task.projectId,
        due_date: task.dueDate ? new Date(task.dueDate).toISOString() : null,
        time_estimate: timeEstimate,
        user_id: userId,
        completed: task.completed || false,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // Create subtasks if any
  if (task.subtasks?.length && data?.id) {
    await supabase.from("subtasks").insert(
      task.subtasks.map((subtask, index) => ({
        title: subtask.title,
        completed: subtask.completed || false,
        task_id: data.id,
        position: index,
      })),
    );
  }

  return data;
}

async function createProject(project: Project, userId: string) {
  // Default color if not provided
  const color = project.color || getRandomColor();

  // Check if a project with this name already exists
  const { data: existingProject } = await supabase
    .from("projects")
    .select("*")
    .eq("name", project.name)
    .eq("user_id", userId)
    .single();

  if (existingProject) {
    console.log(
      `Project with name "${project.name}" already exists, using existing project:`,
      existingProject,
    );
    return existingProject;
  }

  // Create new project if it doesn't exist
  const { data, error } = await supabase
    .from("projects")
    .insert([
      {
        name: project.name,
        color: color,
        user_id: userId,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  console.log("Created new project:", data);
  return data;
}

async function updateTask(taskId: string, task: Partial<Task>, userId: string) {
  // First update the task
  const { error } = await supabase
    .from("tasks")
    .update({
      title: task.title,
      description: task.description,
      priority: task.priority,
      project_id: task.projectId,
      due_date: task.dueDate ? new Date(task.dueDate).toISOString() : null,
      time_estimate: task.timeEstimate,
      completed: task.completed,
    })
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) throw error;

  // Then handle subtasks if provided
  if (task.subtasks) {
    // Delete existing subtasks
    await supabase.from("subtasks").delete().eq("task_id", taskId);

    // Insert new subtasks
    if (task.subtasks.length > 0) {
      await supabase.from("subtasks").insert(
        task.subtasks.map((subtask, index) => ({
          title: subtask.title,
          completed: subtask.completed || false,
          task_id: taskId,
          position: index,
        })),
      );
    }
  }
}

async function addSubtasksToTask(
  taskId: string,
  subtasks: SubTask[],
  userId: string,
) {
  console.log(`Adding ${subtasks.length} subtasks to task ${taskId}`);

  // First verify the task exists and belongs to the user
  const { data: taskData, error: taskError } = await supabase
    .from("tasks")
    .select("*, subtasks(*)")
    .eq("id", taskId)
    .eq("user_id", userId)
    .single();

  if (taskError) {
    console.error("Error fetching task:", taskError);
    throw taskError;
  }

  if (!taskData) {
    throw new Error(`Task with ID ${taskId} not found`);
  }

  // Get the current highest position value
  let maxPosition = 0;
  if (taskData.subtasks && taskData.subtasks.length > 0) {
    maxPosition = Math.max(...taskData.subtasks.map((st) => st.position || 0));
  }

  // Insert new subtasks with positions continuing from the highest existing position
  if (subtasks.length > 0) {
    const { error: insertError } = await supabase.from("subtasks").insert(
      subtasks.map((subtask, index) => ({
        title: subtask.title,
        completed: subtask.completed || false,
        task_id: taskId,
        position: maxPosition + index + 1, // Start from the next position after the highest existing one
      })),
    );

    if (insertError) {
      console.error("Error adding subtasks:", insertError);
      throw insertError;
    }
  }

  console.log(
    `Successfully added ${subtasks.length} subtasks to task ${taskId}`,
  );
}

async function updateProject(
  projectId: string,
  project: Partial<Project>,
  userId: string,
) {
  const { error } = await supabase
    .from("projects")
    .update({
      name: project.name,
      color: project.color,
    })
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) throw error;
}

async function completeTask(taskId: string, userId: string) {
  const { error } = await supabase
    .from("tasks")
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) throw error;
}

// Helper function to estimate task effort based on title, description, and subtasks
function estimateTaskEffort(task: Task): number {
  let estimate = 1; // Default 1 hour
  let reasoning = "Starting with base estimate of 1 hour.";

  // Adjust based on title length and complexity
  if (task.title) {
    const words = task.title.split(" ").length;
    if (words > 5) {
      estimate += 0.5;
      reasoning += ` Title has ${words} words (>5), adding 0.5 hours.`;
    }
    if (
      task.title.toLowerCase().includes("complex") ||
      task.title.toLowerCase().includes("difficult")
    ) {
      estimate += 1;
      reasoning += ` Title contains 'complex' or 'difficult', adding 1 hour.`;
    }
  }

  // Adjust based on description
  if (task.description) {
    const words = task.description.split(" ").length;
    const descriptionAddition = Math.min(words / 50, 2);
    estimate += descriptionAddition;
    reasoning += ` Description has ${words} words, adding ${descriptionAddition.toFixed(1)} hours.`;
  }

  // Adjust based on subtasks
  if (task.subtasks && task.subtasks.length > 0) {
    const subtaskAddition = task.subtasks.length * 0.5;
    estimate += subtaskAddition;
    reasoning += ` Task has ${task.subtasks.length} subtasks, adding ${subtaskAddition} hours.`;
  }

  // Adjust based on priority
  if (task.priority === "high") {
    const oldEstimate = estimate;
    estimate *= 1.2;
    reasoning += ` High priority task, multiplying by 1.2 (${oldEstimate} → ${estimate.toFixed(1)}).`;
  }

  console.log(
    `Task "${task.title}" effort estimate: ${Math.round(estimate)} hours. Reasoning: ${reasoning}`,
  );
  return Math.round(estimate);
}

// Helper function to generate a random color
function getRandomColor(): string {
  const colors = [
    "#4f46e5", // Indigo
    "#0ea5e9", // Sky
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#6366f1", // Indigo
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
