import React from 'react';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import './Header.css';
import Logo from './logo.png';
import { IoCloudUploadOutline } from "react-icons/io5";
import toast from 'react-hot-toast';

function Header({ 
  searchTerm, 
  onSearchChange, 
  searchResults, 
  onSearchResultClick, 
  onFileUpload,
  checkForDuplicates 
}) {
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          const convertedData = convertJsonToCsvFormat(json);
          const { newProjects, duplicates } = checkForDuplicates(convertedData);
          
          if (newProjects.length > 0) {
            onFileUpload(newProjects);
            toast.success(
              <div>
                <strong>Import Summary:</strong><br />
                + {newProjects.length} new projects added<br />
                {duplicates.length > 0 && `- ${duplicates.length} duplicates skipped`}
              </div>,
              { duration: 5000 }
            );
          } else {
            toast.error(`All ${duplicates.length} projects already exist`);
          }
        } catch (error) {
          console.error('Error processing file:', error);
          toast.error('Error processing file. Please ensure it\'s in the correct format.');
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const convertJsonToCsvFormat = (json) => {
    return json.projects.map(project => {
      // Extract main details
      const details = project.details[0];
      const architecture = project.architecture;
      
      return {
        Project: details.name,
        Project_Short: details.short_name,
        Project_Area: details.project_description,
        Documentation: details.documentation_link?.[0],
        
        // Team info
        Team: project.user.map(u => u.email).join('; '),
        
        // Languages
        Language_Main: architecture.languages.main.join('; '),
        Language_Others: architecture.languages.others.join('; '),
        
        // Frameworks
        Language_Frameworks: architecture.frameworks.others.join('; '),
        
        // Infrastructure & Hosting
        Hosted: architecture.hosting.details?.join('; ') || architecture.hosting.type?.join('; '),
        
        // Database
        Datastores: [...(architecture.database.main || []), ...(architecture.database.others || [])].join('; '),
        
        // CICD
        CICD: [...(architecture.cicd.main || []), ...(architecture.cicd.others || [])].join('; '),
        
        // Source Control
        Source_Control: project.source_control?.[0]?.type,
        
        // Development Stage
        Project_Stage: project.stage,
        
        // Infrastructure
        Infrastructure: [...(architecture.infrastructure.main || []), ...(architecture.infrastructure.others || [])].join('; '),
        
        // Development info
        Developed: project.developed[0],
        Development_Partners: project.developed[1]?.join('; '),
      };
    });
  };

  return (
    <header className="radar-header">
      <div className="header-left">
        <img src={Logo} alt="Logo" className="logo"/>
        <h1>Tech Radar</h1>
      </div>
      <div className="header-right">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search technologies..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="search-result-item"
                  onClick={() => onSearchResultClick(result)}
                >
                  <span className="search-result-title">{result.title}</span>
                  <span className={`search-result-ring ${result.timeline[0].ringId.toLowerCase()}`}>
                    {result.timeline[0].ringId}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <label className="upload-button">
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <IoCloudUploadOutline size={16} />
        </label>
        
        <ThemeToggle />
      </div>
    </header>
  );
}

export default Header; 