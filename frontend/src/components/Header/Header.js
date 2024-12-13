import React from "react";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
// import FileUpload from "./FileUpload";
import "../../styles/Header.css";
import Logo from "../../assets/logo.png";
import { IoClose, IoSearch } from "react-icons/io5";

/**
 * Header component for the Tech Radar application.
 * 
 * This component renders the header section of the application, including the logo, search bar, 
 * file upload functionality, and theme toggle.
 * 
 * @param {Object} props - The props passed to the Header component.
 * @param {string} props.searchTerm - The current search term.
 * @param {Function} props.onSearchChange - Function to call when the search term changes.
 * @param {Array} props.searchResults - Array of search results.
 * @param {Function} props.onSearchResultClick - Function to call when a search result is clicked.
 * @param {Function} props.onFileUpload - Function to call when a file is uploaded.
 * @param {Function} props.checkForDuplicates - Function to call to check for duplicates.
 * @param {Function} props.onOpenProjects - Function to call when the projects button is clicked.
 */
function Header({
  searchTerm,
  onSearchChange,
  searchResults,
  onSearchResultClick,
  // onFileUpload,
  // checkForDuplicates,
  onOpenProjects,
}) {
  /**
   * Clears the search term.
   */
  const clearSearch = () => {
    onSearchChange("");
  };
  return (
    <header className="radar-header">
      <div className="header-left">
        <img src={Logo} alt="Logo" className="logo" />
        <h1>Tech Radar</h1>
      </div>
      <div className="header-right">
        <div className="search-container">
          <IoSearch className="search-icon" />

          <input
            type="text"
            placeholder="Search technologies..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          <button
            className="search-clear"
            onClick={clearSearch}
            style={{ display: searchTerm ? "block" : "none" }}
          >
            {" "}
            <IoClose />{" "}
          </button>
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="search-result-item"
                  onClick={() => onSearchResultClick(result)}
                >
                  <span className="search-result-title">{result.title}</span>
                  <span
                    className={`search-result-ring ${result.timeline[0].ringId.toLowerCase()}`}
                  >
                    {result.timeline[0].ringId}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          className="projects-button"
          onClick={onOpenProjects}
        >
          View Projects
        </button>

        {/* <FileUpload
          onFileUpload={onFileUpload}
          checkForDuplicates={checkForDuplicates}
        /> */}

        <ThemeToggle />
      </div>
    </header>
  );
}

export default Header;
