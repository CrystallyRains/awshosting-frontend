"use client";
import { FormEvent, useEffect, useState } from "react";

type Repair = {
  id: number;
  title: string;
  completed: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1/todo";
// Update with your backend URL

const Main = () => {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "completed" | "active">("all");

  // Fetch repairs from the backend
  const fetchRepairs = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch repairs");
      }
      const data = await response.json();
      setRepairs(data.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching repairs:", err);
      setError("Failed to load repair items. Using local storage as fallback.");
      // Fallback to localStorage if the API fails
      const localRepairs = localStorage.getItem("repairs");
      if (localRepairs) {
        try {
          const parsedRepairs = JSON.parse(localRepairs);
          setRepairs(Array.isArray(parsedRepairs) 
            ? parsedRepairs.map((title, index) => ({ 
                id: index + 1, 
                title: typeof title === 'string' ? title : title.title, 
                completed: typeof title === 'object' ? title.completed || false : false 
              })) 
            : []
          );
        } catch (e) {
          setRepairs([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Add a new repair item
  const addRepair = async (task: string) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task }),
      });

      if (!response.ok) {
        throw new Error("Failed to add repair item");
      }

      const data = await response.json();
      setRepairs([...repairs, data.data]);
      
      // Also update localStorage as backup
      localStorage.setItem(
        "repairs", 
        JSON.stringify([...repairs, data.data])
      );
      
      return true;
    } catch (err) {
      console.error("Error adding repair item:", err);
      setError("Failed to add repair item. Added to local storage only.");
      
      // Fallback to localStorage
      const newRepair = { 
        id: repairs.length + 1, 
        title: task, 
        completed: false 
      };
      setRepairs([...repairs, newRepair]);
      localStorage.setItem(
        "repairs", 
        JSON.stringify([...repairs, newRepair])
      );
      
      return false;
    }
  };

  const toggleRepairCompletion = (id: number) => {
    const updatedRepairs = repairs.map(repair => 
      repair.id === id ? { ...repair, completed: !repair.completed } : repair
    );
    setRepairs(updatedRepairs);
    localStorage.setItem("repairs", JSON.stringify(updatedRepairs));
  };

  const deleteRepair = (id: number) => {
    const updatedRepairs = repairs.filter(repair => repair.id !== id);
    setRepairs(updatedRepairs);
    localStorage.setItem("repairs", JSON.stringify(updatedRepairs));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    await addRepair(input);
    setInput("");
  };

  const filteredRepairs = repairs.filter(repair => {
    if (filter === "all") return true;
    if (filter === "completed") return repair.completed;
    if (filter === "active") return !repair.completed;
    return true;
  });

  useEffect(() => {
    fetchRepairs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Repair List</h1>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 text-sm text-red-700">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <input
              placeholder="What needs to be repaired?"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              name="repair"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
            >
              Add
            </button>
          </div>
        </form>
        
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-md shadow-sm">
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                filter === "all" 
                  ? "bg-blue-50 text-blue-700 border-blue-300" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium border-t border-b ${
                filter === "active" 
                  ? "bg-blue-50 text-blue-700 border-blue-300" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setFilter("active")}
            >
              Pending
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
                filter === "completed" 
                  ? "bg-blue-50 text-blue-700 border-blue-300" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setFilter("completed")}
            >
              Repaired
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRepairs.length > 0 ? (
              filteredRepairs.map((repair) => (
                <div
                  key={repair.id}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                >
                  <input 
                    type="checkbox" 
                    checked={repair.completed}
                    onChange={() => toggleRepairCompletion(repair.id)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <p 
                    className={`ml-3 flex-1 text-gray-700 ${
                      repair.completed ? "line-through text-gray-400" : ""
                    }`}
                  >
                    {repair.title}
                  </p>
                  <button 
                    onClick={() => deleteRepair(repair.id)}
                    className="ml-2 text-gray-400 hover:text-red-500"
                    aria-label="Delete repair item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No repair items to display</p>
                <p className="text-sm text-gray-400 mt-1">Add a new repair item to get started</p>
              </div>
            )}
          </div>
        )}
        
        {repairs.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>{repairs.filter(repair => repair.completed).length} of {repairs.length} repaired</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Main;
