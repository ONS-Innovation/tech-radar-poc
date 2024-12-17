import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * Creates a context for managing the theme state.
 */
const ThemeContext = createContext();

/**
 * Provides the theme state and toggle function to its children.
 * 
 * @param {React.ReactNode} children - The children components to be wrapped.
 * @returns {React.ReactNode} The children wrapped in the ThemeContext.Provider.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme || "light";
  });

  /**
   * Effect to update the theme in local storage and apply it to the document.
   */
  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
  }, [theme]);

  /**
   * Toggles the theme between 'light' and 'dark'.
   */
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use the theme context.
 * 
 * @returns {Object} The theme state and toggle function.
 * @throws {Error} If used outside of a ThemeProvider.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
