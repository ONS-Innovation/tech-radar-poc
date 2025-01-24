import React, { useState, useEffect } from "react";
import "../../styles/components/ProjectModal.css";
import "../../styles/LangColours.css";
import { IoClose, IoSearch } from "react-icons/io5";
import { FiLink2 } from "react-icons/fi";
import { fetchRepositoryData } from "../../utilities/getRepositoryData";
import SkeletonLanguageCard from "../Statistics/Skeletons/SkeletonLanguageCard";
/**
 * ProjectModal component for displaying project details in a modal.
 *
 * @param {Object} props - The props passed to the ProjectModal component.
 * @param {boolean} props.isOpen - Whether the modal is open.
 * @param {Function} props.onClose - Function to call when the modal is closed.
 * @param {Object} props.project - The project object containing project details.
 * @param {Function} props.renderTechnologyList - Function to render technology list.
 * @param {Function} props.getTechnologyStatus - Function to get the technology status.
 * @param {Function} props.onTechClick - Function to handle technology click.
 */
const ProjectModal = ({
  isOpen,
  onClose,
  project,
  renderTechnologyList,
  getTechnologyStatus,
  onTechClick,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [repoData, setRepoData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRepoInfo = async () => {
      if (isOpen && project?.Repo) {
        setIsLoading(true);
        // Extract repo names from project.Repo
        const projectRepos = project.Repo.split(";")
          .map((repo) => {
            const match = repo.trim().match(/github\.com\/[^/]+\/([^/]+)/);
            return match ? match[1] : null;
          })
          .filter(Boolean);

        if (projectRepos.length > 0) {
          const data = await fetchRepositoryData(projectRepos);
          if (data?.repositories) {
            setRepoData(data.repositories);
          }
        }
        setIsLoading(false);
      } else {
        setRepoData(null);
      }
    };

    fetchRepoInfo();
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const renderRepoInfo = () => {
    if (!project.Repo) return null;
    console.log(repoData);

    return (
      <div className="repo-info">
        <h3 className="group-title">Linked Repositories</h3>
        {isLoading ? (
          <SkeletonLanguageCard />
        ) : repoData?.length > 0 ? (
          <div className="repo-grid">
            {repoData.map((repo, index) => (
              <div key={index} className="repo-card">
                <div className="repo-stats">
                  <div className="repo-stats-left">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="repo-name"
                    >
                      {repo.name}
                    </a>
                    
                  </div>
                  <div className="repo-badges">
                      <span className="repo-badge">
                        {repo.visibility.toLowerCase()}
                      </span>
                      <span className="repo-badge">
                        {repo.is_archived ? "Archived" : "Active"}
                      </span>
                      <p
                        className={`repo-last-commit ${!repo.is_archived && new Date(repo.last_commit) < new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) ? "last-commit-threshold" : ""}`}
                      >
                        Last commit:{" "}
                        {new Date(repo.last_commit).toLocaleDateString()}
                      </p>
                    </div>
                </div>

                <div className="language-labels">
                  {repo.technologies.languages.map((lang, i) => {
                    const status = getTechnologyStatus
                      ? getTechnologyStatus(lang.name)
                      : null;
                    return (
                      <span
                        key={i}
                        className={`language-label ${status ? `clickable-tech ${status}` : ""}`}
                        onClick={() =>
                          status && onTechClick && onTechClick(lang.name)
                        }
                        title={`${lang.name} (${lang.percentage.toFixed(1)}%)`}
                      >
                        {`${lang.name} (${lang.percentage.toFixed(1)}%)`}
                      </span>
                    );
                  })}
                </div>
                {repo.technologies?.languages && (
                  <div className="repo-languages">
                    <div className="language-bars">
                      {repo.technologies.languages.map((lang, i) => (
                        <div
                          key={i}
                          className={`language-bar ${lang.name}`}
                          style={{
                            width: `${lang.percentage}%`,
                          }}
                          title={`${lang.name}: ${lang.percentage.toFixed(1)}%`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="repo-info-loading">
            No repository information available. The repositories might be
            private, not found or from another organisation.
          </div>
        )}
      </div>
    );
  };

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
            {project.Project_Short && (
              <div className="project-short-name-container">
                {project.Project_Short && (
                  <div className="project-short-name">
                    ({project.Project_Short})
                  </div>
                )}
                {project.Repo || project.Documentation ? (
                  <div className="project-links">
                    {/* {project.Repo &&
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
                      ))} */}
                    {project.Documentation && (
                      <a
                        href={project.Documentation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-link"
                        title={project.Documentation}
                      >
                        View Documentation
                      </a>
                    )}
                  </div>
                ) : null}
              </div>
            )}
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

        {renderRepoInfo()}

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
