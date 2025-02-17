import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  IoSearch,
  IoClose,
  IoOptions,
  IoChevronDown,
  IoRefresh,
} from "react-icons/io5";
import SkeletonStatCard from "../Statistics/Skeletons/SkeletonStatCard";
import "../../styles/components/Projects.css";

/**
 * Projects component for displaying a list of projects.
 *
 * @param {Object} props - The props passed to the Projects component.
 * @param {boolean} props.isOpen - Whether the projects list is open.
 * @param {Array} props.projectsData - The array of projects data.
 * @param {Function} props.handleProjectClick - Function to handle project click.
 * @param {Function} props.getTechnologyStatus - Function to get technology status.
 * @param {Function} props.onRefresh - Function to refresh the projects data.
 */
const Projects = ({
  isOpen,
  projectsData,
  handleProjectClick,
  getTechnologyStatus,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("order-earliest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("adopt");
  const [selectedRatio, setSelectedRatio] = useState("most");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isFilterOpen && !event.target.closest(".projects-filter-wrapper")) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  /**
   * calculateTechnologyDistribution function calculates the technology distribution for a given project.
   *
   * @param {Object} project - The project object containing project details.
   * @returns {Object} - An object containing the technology distribution.
   */
  const calculateTechnologyDistribution = useCallback(
    (project) => {
      const techColumns = [
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

      const technologies = techColumns.reduce((acc, column) => {
        if (project[column]) {
          const techs = project[column].split(";").map((tech) => tech.trim());
          acc.push(...techs);
        }
        return acc;
      }, []);

      const distribution = {
        adopt: 0,
        trial: 0,
        assess: 0,
        hold: 0,
        unknown: 0,
        total: technologies.length,
      };

      technologies.forEach((tech) => {
        const status = getTechnologyStatus(tech);
        if (status && status !== "review" && status !== "ignore") {
          distribution[status]++;
        } else {
          distribution.unknown++;
        }
      });

      return distribution;
    },
    [getTechnologyStatus]
  );

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projectsData || [];

    if (searchTerm.trim()) {
      filtered = filtered.filter((project) => {
        const searchString =
          `${project.Project} ${project.Project_Short} ${project.Project_Area} ${project.Team}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
      });
    }

    return [...filtered].sort((a, b) => {
      const getDistribution = (project) => {
        const distribution = calculateTechnologyDistribution(project);
        return {
          total: distribution.total,
          adoptRatio: distribution.adopt / distribution.total || 0,
          trialRatio: distribution.trial / distribution.total || 0,
          assessRatio: distribution.assess / distribution.total || 0,
          holdRatio: distribution.hold / distribution.total || 0,
        };
      };

      switch (sortBy) {
        case "name-asc":
          return (a.Project || "").localeCompare(b.Project || "");
        case "name-desc":
          return (b.Project || "").localeCompare(a.Project || "");
        case "tech-most":
          return getDistribution(b).total - getDistribution(a).total;
        case "tech-least":
          return getDistribution(a).total - getDistribution(b).total;
        case "adopt-high":
        case "adopt-low":
        case "trial-high":
        case "trial-low":
        case "assess-high":
        case "assess-low":
        case "hold-high":
        case "hold-low": {
          const [type, direction] = sortBy.split("-");
          const aRatio = getDistribution(a)[`${type}Ratio`];
          const bRatio = getDistribution(b)[`${type}Ratio`];
          return direction === "high" ? bRatio - aRatio : aRatio - bRatio;
        }
        default:
          return 0;
      }
    });
  }, [projectsData, sortBy, calculateTechnologyDistribution]);

  if (!isOpen) return null;

  return (
    <div className="projects-modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="projects-content-header">
        <h2>Projects</h2>
        <div className="projects-content-header-flex">
          <span className="projects-modal-content-subtitle">
            Click on a project to view its details. Hover over the coloured bar
            to see the technology distribution.
          </span>
          <div className="projects-search-container">
            <div className="projects-filter-wrapper">
              <button
                className="projects-filter-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFilterOpen(!isFilterOpen);
                }}
              >
                <IoOptions />
                Sort by
              </button>
              {isFilterOpen && (
                <div className="projects-filter-dropdown">
                  <div className="filter-group">
                    <div className="filter-group-title">Name</div>
                    <button
                      className={sortBy === "name-asc" ? "active" : ""}
                      onClick={() => setSortBy("name-asc")}
                    >
                      A to Z
                    </button>
                    <button
                      className={sortBy === "name-desc" ? "active" : ""}
                      onClick={() => setSortBy("name-desc")}
                    >
                      Z to A
                    </button>
                  </div>
                  <div className="filter-group">
                    <div className="filter-group-title">Technologies</div>
                    <button
                      className={sortBy === "tech-most" ? "active" : ""}
                      onClick={() => setSortBy("tech-most")}
                    >
                      Most technologies
                    </button>
                    <button
                      className={sortBy === "tech-least" ? "active" : ""}
                      onClick={() => setSortBy("tech-least")}
                    >
                      Least technologies
                    </button>
                  </div>
                  <div className="filter-group">
                    <div className="filter-group-title">Technology Status</div>
                    <div className="filter-controls">
                      <div className="filter-select-wrapper">
                        <select
                          className="filter-select"
                          value={selectedType}
                          onChange={(e) => {
                            setSelectedType(e.target.value);
                            setSortBy(`${e.target.value}-${selectedRatio}`);
                          }}
                        >
                          <option value="adopt">Adopt</option>
                          <option value="trial">Trial</option>
                          <option value="assess">Assess</option>
                          <option value="hold">Hold</option>
                        </select>
                        <IoChevronDown className="select-chevron" />
                      </div>

                      <div className="filter-select-wrapper">
                        <select
                          className="filter-select"
                          value={selectedRatio}
                          onChange={(e) => {
                            setSelectedRatio(e.target.value);
                            setSortBy(`${selectedType}-${e.target.value}`);
                          }}
                        >
                          <option value="high">Most Ratio</option>
                          <option value="low">Least Ratio</option>
                        </select>
                        <IoChevronDown className="select-chevron" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              className="projects-filter-button projects-refresh-button"
              onClick={onRefresh}
              title="Refresh the data"
            >
              <IoRefresh />
              Refresh
            </button>

            <div className="projects-search-results">
              <span className="projects-search-count">
                Found {filteredAndSortedProjects.length} project
                {filteredAndSortedProjects.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="projects-list">
        {!projectsData ? (
          <div className="projects-loading-skeleton">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="project-item-skeleton">
                <SkeletonStatCard />
                <div className="technology-distribution-skeleton">
                  <div className="distribution-segment-skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedProjects.length > 0 ? (
          filteredAndSortedProjects.map((project, index) => {
            const distribution = calculateTechnologyDistribution(project);
            const total = distribution.total || 1;

            return (
              <div
                key={index}
                className="project-item"
                onClick={() => handleProjectClick(project)}
              >
                <div className="project-item-header">
                  <div className="project-name">
                    <span>{project.Project}</span>
                    <span className="project-name-short">
                      {project.Project_Short ? `(${project.Project_Short})` : ""}
                    </span>
                  </div>
                </div>

                <div className="technology-distribution">
                  {distribution.total > 0 ? (
                    <>
                      {distribution.adopt > 0 && (
                        <div
                          className="distribution-segment adopt"
                          style={{
                            width: `${(distribution.adopt / total) * 100}%`,
                          }}
                          title={`Adopt (${distribution.adopt}/${total})`}
                        >
                          <span className="segment-tooltip">
                            Adopt ({distribution.adopt}/{total})
                          </span>
                        </div>
                      )}
                      {distribution.trial > 0 && (
                        <div
                          className="distribution-segment trial"
                          style={{
                            width: `${(distribution.trial / total) * 100}%`,
                          }}
                          title={`Trial (${distribution.trial}/${total})`}
                        >
                          <span className="segment-tooltip">
                            Trial ({distribution.trial}/{total})
                          </span>
                        </div>
                      )}
                      {distribution.assess > 0 && (
                        <div
                          className="distribution-segment assess"
                          style={{
                            width: `${(distribution.assess / total) * 100}%`,
                          }}
                          title={`Assess (${distribution.assess}/${total})`}
                        >
                          <span className="segment-tooltip">
                            Assess ({distribution.assess}/{total})
                          </span>
                        </div>
                      )}
                      {distribution.hold > 0 && (
                        <div
                          className="distribution-segment hold"
                          style={{
                            width: `${(distribution.hold / total) * 100}%`,
                          }}
                          title={`Hold (${distribution.hold}/${total})`}
                        >
                          <span className="segment-tooltip">
                            Hold ({distribution.hold}/{total})
                          </span>
                        </div>
                      )}
                      {distribution.unknown > 0 && (
                        <div
                          className="distribution-segment unknown"
                          style={{
                            width: `${(distribution.unknown / total) * 100}%`,
                          }}
                          title={`Unknown (${distribution.unknown}/${total})`}
                        >
                          <span className="segment-tooltip">
                            Unknown ({distribution.unknown}/{total})
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      className="distribution-segment unknown"
                      style={{ width: "100%" }}
                      title="No technologies found"
                    >
                      <span className="segment-tooltip">
                        No technologies found
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="projects-empty-state">No projects found</div>
        )}
      </div>
    </div>
  );
};

export default Projects;
