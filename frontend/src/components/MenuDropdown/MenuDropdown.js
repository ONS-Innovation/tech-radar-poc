import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import './MenuDropdown.css';
import { IoMenu, IoStatsChart, IoPeople } from 'react-icons/io5'
import { MdOutlineRadar } from "react-icons/md";
;

function MenuDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatsClick = () => {
    navigate('/statistics');
    setIsOpen(false);
  };

  const handleProjectsClick = () => {
    navigate('/projects');
    setIsOpen(false);
  };

  const handleRadarClick = () => {
    navigate('/radar');
    setIsOpen(false);
  };

  return (
    <div className="menu-dropdown" ref={dropdownRef}>
      <button className="menu-button" onClick={() => setIsOpen(!isOpen)}>
        <IoMenu size={20} />
      </button>

      {isOpen && (
        <div className="dropdown-content">

            <>
              <button onClick={handleRadarClick}>
                <MdOutlineRadar size={16} />
                Tech Radar
              </button>
              <button onClick={handleStatsClick}>
                <IoStatsChart size={16} />
                Statistics
              </button>
              <button onClick={handleProjectsClick}>
                <IoPeople size={16} />
                Projects
              </button>
            </>

          <div className="theme-toggle-container">
            <ThemeToggle />
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuDropdown; 