"use client";
import { FormEvent, useEffect, useState } from "react";

type Priority = "low" | "medium" | "high";

type Todo = {
  id: number;
  title: string;
  completed: boolean;
  priority: Priority;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1/todo";
// Update with your backend URL

const Main = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState<string>("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "completed" | "active">("all");

  // Fetch todos from the backend
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }
      const data = await response.json();
      // Add priority property if it doesn't exist in the data from backend
      const todosWithPriority = (data.data || []).map((todo) => ({
        ...todo,
        priority: todo.priority || "medium",
      }));
      setTodos(todosWithPriority);
      setError(null);
    } catch (err) {
      console.error("Error fetching todos:", err);
      setError("Failed to load todos. Using local storage as fallback.");
      // Fallback to localStorage if the API fails
      const localTodos = localStorage.getItem("todos");
      if (localTodos) {
        try {
          const parsedTodos = JSON.parse(localTodos);
          setTodos(Array.isArray(parsedTodos) 
            ? parsedTodos.map((item, index) => {
                if (typeof item === 'string') {
                  return { 
                    id: index + 1, 
                    title: item, 
                    completed: false,
                    priority: "medium" as Priority
                  };
                } else {
                  return {
                    ...item,
                    priority: item.priority || "medium"
                  };
                }
              }) 
            : []
          );
        } catch (e) {
          setTodos([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Add a new todo
  const addTodo = async (task: string, priority: Priority) => {
    try {
      // Only send the properties expected by the backend
      const todoForBackend = { task };
      
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(todoForBackend),
      });

      if (!response.ok) {
        throw new Error("Failed to add todo");
      }

      const data = await response.json();
      
      // Add priority to the todo object for frontend use only
      const newTodo = {
        ...data.data,
        priority
      };
      
      setTodos([...todos, newTodo]);
      
      // Also update localStorage as backup
      localStorage.setItem(
        "todos", 
        JSON.stringify([...todos, newTodo])
      );
      
      return true;
    } catch (err) {
      console.error("Error adding todo:", err);
      setError("Failed to add todo. Added to local storage only.");
      
      // Fallback to localStorage
      const newTodo = { 
        id: todos.length + 1, 
        title: task, 
        completed: false,
        priority
      };
      setTodos([...todos, newTodo]);
      localStorage.setItem(
        "todos", 
        JSON.stringify([...todos, newTodo])
      );
      
      return false;
    }
  };

  const toggleTodoCompletion = (id: number) => {
    const updatedTodos = todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
    localStorage.setItem("todos", JSON.stringify(updatedTodos));
  };

  const deleteTodo = (id: number) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    localStorage.setItem("todos", JSON.stringify(updatedTodos));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    await addTodo(input, priority);
    setInput("");
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === "all") return true;
    if (filter === "completed") return todo.completed;
    if (filter === "active") return !todo.completed;
    return true;
  });

  // Sort todos by priority (high > medium > low)
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  useEffect(() => {
    fetchTodos();
  }, []);

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "high": return "bg-red-100 border-l-4 border-red-500";
      case "medium": return "bg-yellow-100 border-l-4 border-yellow-500";
      case "low": return "bg-green-100 border-l-4 border-green-500";
      default: return "bg-blue-100";
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">My Todo App</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2 mb-3">
          <input
            placeholder="Enter todo"
            className="border flex-1 p-2 rounded shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none"
            name="todo"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="p-2 bg-blue-500 rounded text-white hover:bg-blue-600 transition-colors duration-200 shadow-sm"
          >
            Add
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <label className="text-gray-700 font-medium">Priority:</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPriority("low")}
              className={`px-3 py-1 rounded ${
                priority === "low" 
                  ? "bg-green-500 text-white" 
                  : "bg-green-100 text-green-800"
              }`}
            >
              Low
            </button>
            <button
              type="button"
              onClick={() => setPriority("medium")}
              className={`px-3 py-1 rounded ${
                priority === "medium" 
                  ? "bg-yellow-500 text-white" 
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              Medium
            </button>
            <button
              type="button"
              onClick={() => setPriority("high")}
              className={`px-3 py-1 rounded ${
                priority === "high" 
                  ? "bg-red-500 text-white" 
                  : "bg-red-100 text-red-800"
              }`}
            >
              High
            </button>
          </div>
        </div>
      </form>
      
      <div className="flex justify-center mb-4">
        <div className="flex rounded-md overflow-hidden shadow-sm">
          <button 
            className={`px-3 py-1 ${filter === "all" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button 
            className={`px-3 py-1 ${filter === "active" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
            onClick={() => setFilter("active")}
          >
            Active
          </button>
          <button 
            className={`px-3 py-1 ${filter === "completed" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
            onClick={() => setFilter("completed")}
          >
            Completed
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTodos.length > 0 ? (
            sortedTodos.map((todo) => (
              <div
                className={`p-4 rounded-md shadow-sm ${getPriorityColor(todo.priority)}`}
                key={todo.id}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <input 
                      type="checkbox" 
                      checked={todo.completed}
                      onChange={() => toggleTodoCompletion(todo.id)}
                      className="h-5 w-5 rounded"
                    />
                    <p className={`font-medium break-all ${todo.completed ? "line-through text-gray-500" : "text-gray-700"}`}>
                      {todo.title}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs px-2 py-1 rounded mr-2">
                      {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                    </span>
                    <button 
                      onClick={() => deleteTodo(todo.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No todos to display</p>
          )}
        </div>
      )}
      
      {todos.length > 0 && (
        <p className="text-center text-gray-500 text-sm mt-4">
          {todos.filter(todo => todo.completed).length} of {todos.length} tasks completed
        </p>
      )}
    </div>
  );
};

export default Main;
