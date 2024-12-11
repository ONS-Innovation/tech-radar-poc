import React from "react";
import { useTheme } from "../../contexts/ThemeContext";
import "../../styles/ThemeToggle.css";
import {
  IoMoonOutline as MoonIcon,
  IoSunnyOutline as SunIcon,
} from "react-icons/io5";

/**
 * ThemeToggle component allows users to switch between light and dark theme.
 * It uses the useTheme hook from ThemeContext to get the current theme and toggleTheme function.
 * 
 * @returns A button that toggles the theme when clicked.
 */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

export default ThemeToggle;
