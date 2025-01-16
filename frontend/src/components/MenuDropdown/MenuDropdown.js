import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import './MenuDropdown.css';
import { IoHome, IoMenu, IoStatsChart, IoPeople } from 'react-icons/io5'
import { MdOutlineRadar } from "react-icons/md";
;

function MenuDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="menu-dropdown" ref={dropdownRef}>
      <button className="menu-button" onClick={() => setIsOpen(!isOpen)}>
        <IoMenu size={20} />
      </button>

      {isOpen && (
        <div className="dropdown-content">
            <div className="home-button-container">
              <button onClick={() => handleNavClick('/')} className={location.pathname === '/' ? 'active' : ''}>
                <IoHome size={16} />
                Home
              </button>
            </div>
            <div>
              <button onClick={() => handleNavClick('/radar')} className={location.pathname === '/radar' ? 'active' : ''}>
                <MdOutlineRadar size={16} />
                Tech Radar
              </button>
              <button onClick={() => handleNavClick('/statistics')} className={location.pathname === '/statistics' ? 'active' : ''}>
                <IoStatsChart size={16} />
                Statistics
              </button>
              <button onClick={() => handleNavClick('/projects')} className={location.pathname === '/projects' ? 'active' : ''}>
                <IoPeople size={16} />
                Projects
              </button>
            </div>

          <div className="theme-toggle-container">
            <ThemeToggle />
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuDropdown; 