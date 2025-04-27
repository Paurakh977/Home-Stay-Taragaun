"use client"

import * as React from "react"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TodoItem {
  id: string
  text: string
  completed: boolean
}

interface TodoProps {
  className?: string
}

export function Todo({ className }: TodoProps) {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [newTodo, setNewTodo] = useState<string>("")

  const addTodo = () => {
    if (newTodo.trim() === "") return
    
    const todo: TodoItem = {
      id: Date.now().toString(),
      text: newTodo,
      completed: false
    }
    
    setTodos([...todos, todo])
    setNewTodo("")
  }

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo()
    }
  }

  return (
    <div className={cn("w-full max-w-md mx-auto p-4", className)}>
      <h2 className="text-2xl font-bold mb-4">Todo List</h2>
      
      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="Add a new todo..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <button 
          onClick={addTodo}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {todos.map(todo => (
          <li 
            key={todo.id} 
            className="flex items-center gap-2 p-2 border rounded-md"
          >
            <Checkbox 
              checked={todo.completed}
              onCheckedChange={() => toggleTodo(todo.id)}
            />
            <span className={cn(
              "flex-1",
              todo.completed && "line-through text-gray-500"
            )}>
              {todo.text}
            </span>
            <button 
              onClick={() => deleteTodo(todo.id)}
              className="text-red-500"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {todos.length === 0 && (
        <p className="text-center text-gray-500 mt-4">No todos yet. Add one above!</p>
      )}
    </div>
  )
} 