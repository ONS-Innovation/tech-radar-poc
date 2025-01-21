import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import Header from '../components/Header/Header';
import Projects from '../components/Projects/Projects';
import ProjectModal from '../components/Projects/ProjectModal';
import { fetchCSVFromS3 } from '../utilities/getCSVData';
import { fetchTechRadarJSONFromS3 } from '../utilities/getTechRadarJson';
import toast from 'react-hot-toast';
import '../styles/ProjectsPage.css';

function ProjectsPage() {
  const [projectsData, setProjectsData] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [radarData, setRadarData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchCSVFromS3();
        setProjectsData(data);
      } catch (error) {
        try {
          const response = await fetch('/tech_radar/onsTechData.csv');
          if (!response.ok) {
            throw new Error('Failed to fetch local CSV');
          }
          const csvText = await response.text();
          const rows = csvText.split('\n');
          const headers = rows[0].split(',');
          const data = rows.slice(1).map(row => {
            const values = row.split(',');
            return headers.reduce((obj, header, i) => {
              obj[header] = values[i];
              return obj;
            }, {});
          });
          setProjectsData(data);
        } catch (fallbackError) {
          console.error('Failed to load project data:', fallbackError);
        }
      }
    };

    const fetchRadarData = async () => {
      try {
        const data = await fetchTechRadarJSONFromS3();
        setRadarData(data);
      } catch (error) {
        console.error('Failed to load radar data:', error);
      }
    };

    fetchData();
    fetchRadarData();
  }, []);

  const getTechnologyStatus = (tech) => {
    if (!radarData || !tech) return null;

    const entry = radarData.entries.find(
      entry => entry.title.toLowerCase() === tech.trim().toLowerCase()
    );
    return entry ? entry.timeline[0].ringId.toLowerCase() : null;
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setIsProjectModalOpen(true);
  };

  const handleRefresh = async () => {
    try {
      const newData = await fetchCSVFromS3();
      setProjectsData(newData);
      toast.success('Data refreshed successfully.');
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handleTechClick = (tech) => {
    if (!tech) return;

    const entry = radarData?.entries.find(
      entry => entry.title.toLowerCase() === tech.toLowerCase().trim()
    );

    if (entry) {
      navigate('/radar', { state: { selectedTech: tech } });
    }
  };

  const renderTechnologyList = (technologies) => {
    if (!technologies) return null;

    return technologies.split(';').map((tech, index) => {
      const trimmedTech = tech.trim();
      const status = getTechnologyStatus(trimmedTech);

      return (
        <span key={index}>
          {index > 0 && '; '}
          {status ? (
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

  return (
    <ThemeProvider>
      <Header hideSearch />
      <div className="projects-page">
        <Projects
          isOpen={true}
          onClose={() => {}}
          projectsData={projectsData}
          handleProjectClick={handleProjectClick}
          getTechnologyStatus={getTechnologyStatus}
          onRefresh={handleRefresh}
        />
        {isProjectModalOpen && (
          <ProjectModal
            isOpen={isProjectModalOpen}
            onClose={() => setIsProjectModalOpen(false)}
            project={selectedProject}
            renderTechnologyList={renderTechnologyList}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default ProjectsPage;
