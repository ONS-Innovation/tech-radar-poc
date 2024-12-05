import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './ThemeToggle.css';
import { IoMoonOutline as MoonIcon, IoSunnyOutline as SunIcon } from "react-icons/io5";


function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

export default ThemeToggle; 