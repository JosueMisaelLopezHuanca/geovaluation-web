import { useEffect, useState } from "react"

const THEME_STORAGE_KEY = "catastro-theme"

const getInitialTheme = () => {
  if (typeof window === "undefined") return "light"

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export const useTheme = () => {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  return {
    theme,
    setTheme,
    toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
  }
}
