
"use client"

import * as React from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { name: "light", label: "Light", icon: Sun },
    { name: "dark", label: "Dark", icon: Moon },
    { name: "system", label: "System", icon: Monitor },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 rounded-lg border p-1">
      {themes.map((t) => (
        <Button
          key={t.name}
          variant={theme === t.name ? "default" : "ghost"}
          size="sm"
          onClick={() => setTheme(t.name)}
          className="justify-center"
        >
          <t.icon className="mr-2 h-4 w-4" />
          {t.label}
        </Button>
      ))}
    </div>
  )
}
