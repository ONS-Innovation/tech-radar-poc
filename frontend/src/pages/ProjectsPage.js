import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeProvider } from "../contexts/ThemeContext";
import Header from "../components/Header/Header";
import Projects from "../components/Projects/Projects";
import ProjectModal from "../components/Projects/ProjectModal";
import { useData } from "../contexts/dataContext";
import toast from "react-hot-toast";
import "../styles/ProjectsPage.css";

/**
 * ProjectsPage component for displaying the projects page.
 *
 * @returns {JSX.Element} - The ProjectsPage component.
 */
function ProjectsPage() {
  const [projectsData, setProjectsData] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [radarData, setRadarData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  const { getCsvData, getTechRadarData } = useData();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [csvData, techData] = await Promise.all([
          getCsvData(),
          getTechRadarData()
        ]);
        setProjectsData(csvData);
        setRadarData(techData);
      } catch (error) {
        console.error(error);
        toast.error("Unexpected error occurred.");
      }
    };

    fetchData();
  }, [getCsvData, getTechRadarData]);

  /**
   * getTechnologyStatus function gets the technology status for a given technology.
   *
   * @param {string} tech - The technology to get the status for.
   * @returns {string|null} - The technology status or null if not found.
   */
  const getTechnologyStatus = (tech) => {
    if (!radarData || !tech) return null;

    const entry = radarData.entries.find(
      (entry) => entry.title.toLowerCase() === tech.trim().toLowerCase()
    );
    return entry
      ? entry.timeline[entry.timeline.length - 1].ringId.toLowerCase()
      : null;
  };

  /**
   * handleProjectClick function handles the project click event.
   *
   * @param {Object} project - The project object to handle the click for.
   */
  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setIsProjectModalOpen(true);
  };

  /**
   * handleRefresh function handles the refresh event.
   */
  const handleRefresh = async () => {
    try {
      const newData = await getCsvData(true); // Pass forceRefresh as true
      setProjectsData(newData);
      toast.success("Data refreshed successfully.");
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  /**
   * handleTechClick function handles the technology click event.
   *
   * @param {string} tech - The technology to handle the click for.
   */
  const handleTechClick = (tech) => {
    if (!tech) return;

    const entry = radarData?.entries.find(
      (entry) => entry.title.toLowerCase() === tech.toLowerCase().trim()
    );

    if (entry) {
      navigate("/radar", { state: { selectedTech: tech } });
    }
  };

  /**
   * getFilteredProjects function gets the filtered projects based on search term.
   * 
   * @returns {Array} - The filtered projects.
   */
  const getFilteredProjects = () => {
    if (!projectsData) return [];
    if (!searchTerm.trim()) return projectsData;

    return projectsData.filter(project => {
      const searchString = `${project.Project} ${project.Project_Short} ${project.Project_Area} ${project.Team}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });
  };

  /**
   * renderTechnologyList function renders the technology list.
   *
   * @param {string} technologies - The technologies to render.
   * @returns {JSX.Element|null} - The rendered technology list or null if not found.
   */
  const renderTechnologyList = (technologies) => {
    if (!technologies) return null;

    return technologies.split(";").map((tech, index) => {
      const trimmedTech = tech.trim();
      const status = getTechnologyStatus(trimmedTech);

      return (
        <span key={index}>
          {index > 0 && "; "}
          {status && status !== "review" && status !== "ignore" ? (
            <span
              className={`clickable-tech ${status}`}
              onClick={() => handleTechClick(trimmedTech)}
            >
              {trimmedTech}
            </span>
          ) : (
            trimmedTech
          )}
        </span>
      );
    });
  };

  const filteredProjects = getFilteredProjects();

  return (
    <ThemeProvider>
      <Header 
        searchTerm={searchTerm}
        onSearchChange={(value) => setSearchTerm(value)}
        searchResults={[]}
        onSearchResultClick={handleProjectClick}
      />
      <div className="projects-page">
        <Projects
          isOpen={true}
          onClose={() => {}}
          projectsData={filteredProjects}
          handleProjectClick={handleProjectClick}
          getTechnologyStatus={getTechnologyStatus}
          onRefresh={handleRefresh}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        {isProjectModalOpen && (
          <ProjectModal
            isOpen={isProjectModalOpen}
            onClose={() => setIsProjectModalOpen(false)}
            project={selectedProject}
            renderTechnologyList={renderTechnologyList}
            getTechnologyStatus={getTechnologyStatus}
            onTechClick={handleTechClick}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default ProjectsPage;
