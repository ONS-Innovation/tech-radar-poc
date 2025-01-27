import React, { useState } from "react";
import "../../styles/components/ProjectModal.css";
import { IoClose, IoSearch } from "react-icons/io5";
import { FiLink2 } from 'react-icons/fi';

/**
 * ProjectModal component for displaying project details in a modal.
 *
 * @param {Object} props - The props passed to the ProjectModal component.
 * @param {boolean} props.isOpen - Whether the modal is open.
 * @param {Function} props.onClose - Function to call when the modal is closed.
 * @param {Object} props.project - The project object containing project details.
 * @param {Function} props.renderTechnologyList - Function to render technology list.
 */
const ProjectModal = ({ isOpen, onClose, project, renderTechnologyList }) => {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen || !project) return null;

  // Group definitions
  const groups = {
    languages: [
      "Language_Main",
      "Language_Others",
      "Language_Frameworks",
      "Testing_Frameworks",
    ],
    infrastructure: [
      "Infrastructure",
      "CICD",
      "Cloud_Services",
      "Containers",
      "Hosted",
      "Architectures",
    ],
    security: ["IAM_Services", "Source_Control", "Branching_Strategy"],
    quality: ["Static_Analysis", "Code_Formatter", "Monitoring"],
    data: ["Datastores", "Database_Technologies", "Data_Output_Formats"],
    integrations: ["Integrations_ONS", "Integrations_External"],
    general: [
      "Project_Area",
      "DST_Area",
      "Project_Tools",
      "Other_Tools",
      "Datasets_Used",
    ],
  };

  const fieldLabels = {
    Project_Area: "Project Area",
    DST_Area: "DST Area",
    Language_Main: "Main Language",
    Language_Others: "Other Languages",
    Language_Frameworks: "Frameworks",
    Testing_Frameworks: "Testing Frameworks",
    Hosted: "Hosted On",
    Architectures: "Architecture",
    Source_Control: "Source Control",
    Branching_Strategy: "Branching Strategy",
    Static_Analysis: "Static Analysis",
    Code_Formatter: "Code Formatter",
    Data_Output_Formats: "Data Output Formats",
    Integrations_ONS: "ONS Integrations",
    Integrations_External: "External Integrations",
  };

  const technologyListFields = [
    "Language_Main",
    "Language_Others",
    "Language_Frameworks",
    "Infrastructure",
    "CICD",
    "Cloud_Services",
    "IAM_Services",
    "Testing_Frameworks",
    "Containers",
    "Static_Analysis",
    "Code_Formatter",
    "Monitoring",
    "Datastores",
    "Data_Output_Formats",
    "Integrations_ONS",
    "Integrations_External",
    "Database_Technologies",
  ];

  const filterItems = (items) => {
    return items.filter((key) => {
      if (!project[key]) return false;
      const label = fieldLabels[key] || key.replace(/_/g, " ");
      const value = project[key].toString().toLowerCase();
      return (
        label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        value.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  };

  const renderGroup = (title, keys) => {
    const filteredKeys = filterItems(keys);
    if (filteredKeys.length === 0) return null;

    return (
      <div className="project-group">
        <h3 className="group-title">{title}</h3>
        <div className="group-content">
          {filteredKeys.map((key) => (
            <div key={key} className="detail-item">
              <h3>{fieldLabels[key] || key.replace(/_/g, " ")}:</h3>
              <p>
                {technologyListFields.includes(key)
                  ? renderTechnologyList(project[key])
                  : project[key].replace(/;/g, "; ")}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content project-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="project-header">
          <div className="project-header-left">
            <h2>{project.Project}</h2>
            <div className="project-short-name-container">
              {project.Project_Short && (
                <div className="project-short-name">
                  ({project.Project_Short})
                </div>
              )}
              {project.Repo || project.Documentation ? (
                <div className="project-links">
                  {project.Repo &&
                    project.Repo.split(";").map((repo, index) => (
                      <a
                        key={index}
                        href={repo.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-link"
                        title={repo.trim()}
                      >
                        View Repo <FiLink2 />
                      </a>
                    ))}
                  {project.Documentation && (
                    <a
                      href={project.Documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                      title={project.Documentation}
                    >
                      View Documentation <FiLink2 />
                    </a>
                  )}
                </div>
              ) : null}
            </div>
          </div>
          <div className="project-header-right">
          <div className="search-container-projects">
          <IoSearch className="search-icon-projects" />
          <input
            type="text"
            placeholder="Search project details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-projects"
          />
        </div>
            <button className="modal-close" onClick={onClose}>
              <IoClose />
            </button>
          </div>
        </div>

        <div className="project-details">
          {renderGroup("Languages & Frameworks", groups.languages)}
          {renderGroup("Infrastructure & Deployment", groups.infrastructure)}
          {renderGroup("Security & Source Control", groups.security)}
          {renderGroup("Quality & Monitoring", groups.quality)}
          {renderGroup("Data Management", groups.data)}
          {renderGroup("Integrations", groups.integrations)}
          {renderGroup("General Information", groups.general)}
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
