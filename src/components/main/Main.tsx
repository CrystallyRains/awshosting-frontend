"use client";
import { FormEvent, useEffect, useState } from "react";

type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1/todo";
// Update with your backend URL

const Main = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch todos from the backend
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }
      const data = await response.json();
      setTodos(data.data || []);
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
            ? parsedTodos.map((title, index) => ({ 
                id: index + 1, 
                title, 
                completed: false 
              })) 
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
  const addTodo = async (task: string) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task }),
      });

      if (!response.ok) {
        throw new Error("Failed to add todo");
      }

      const data = await response.json();
      setTodos([...todos, data.data]);
      
      // Also update localStorage as backup
      localStorage.setItem(
        "todos", 
        JSON.stringify([...todos, data.data])
      );
      
      return true;
    } catch (err) {
      console.error("Error adding todo:", err);
      setError("Failed to add todo. Added to local storage only.");
      
      // Fallback to localStorage
      const newTodo = { 
        id: todos.length + 1, 
        title: task, 
        completed: false 
      };
      setTodos([...todos, newTodo]);
      localStorage.setItem(
        "todos", 
        JSON.stringify([...todos, newTodo])
      );
      
      return false;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    await addTodo(input);
    setInput("");
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-[2rem] font-bold text-center mb-6">Best Todo App</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <input
          placeholder="Enter todo"
          className="border flex-1 p-2 rounded"
          name="todo"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="p-2 bg-blue-500 rounded text-white hover:bg-blue-600"
        >
          Add Todo
        </button>
      </form>
      
      {loading ? (
        <p className="text-center">Loading todos...</p>
      ) : (
        <div className="space-y-3">
          {todos.length > 0 ? (
            todos.map((todo) => (
              <div
                className="bg-blue-100 p-4 rounded-md"
                key={todo.id}
              >
                <p className="font-medium text-gray-700 break-all">{todo.title}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No todos to display</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Main;