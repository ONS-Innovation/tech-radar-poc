import React from 'react';
import "../../styles/components/ProjectModal.css";
import { IoClose } from 'react-icons/io5';

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
  if (!isOpen || !project) return null;

  // Fields that should use renderTechnologyList
  const technologyListFields = [
    'Language_Main',
    'Language_Others',
    'Language_Frameworks',
    'Infrastructure',
    'CICD',
    'Cloud_Services',
    'IAM_Services',
    'Testing_Frameworks',
    'Containers',
    'Static_Analysis',
    'Code_Formatter',
    'Monitoring',
    'Datastores',
    'Data_Output_Formats',
    'Integrations_ONS',
    'Integrations_External',
    'Database_Technologies'

  ];

  // Custom field labels mapping
  const fieldLabels = {
    Project_Area: 'Project Area',
    DST_Area: 'DST Area',
    Language_Main: 'Main Language',
    Language_Others: 'Other Languages',
    Language_Frameworks: 'Frameworks',
    Testing_Frameworks: 'Testing Frameworks',
    Hosted: 'Hosted On',
    Architectures: 'Architecture',
    Source_Control: 'Source Control',
    Branching_Strategy: 'Branching Strategy',
    Static_Analysis: 'Static Analysis',
    Code_Formatter: 'Code Formatter',
    Data_Output_Formats: 'Data Output Formats',
    Integrations_ONS: 'ONS Integrations',
    Integrations_External: 'External Integrations'
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content project-modal" onClick={(e) => e.stopPropagation()}>
        <div className="project-header">
          <div className="project-header-left">
            <h2>{project.Project}</h2>
            {project.Project_Short && (
              <div className="project-short-name">({project.Project_Short})</div>
            )}
          </div>
          <div className="project-header-right">
            <button className="modal-close" onClick={onClose}>
              <IoClose />
            </button>
          </div>
        </div>

        <div className="project-details">
          {Object.entries(project).map(([key, value]) => {
            // Skip empty values, Project and Project_Short (already shown in header)
            if (!value || key === 'Project' || key === 'Project_Short') return null;

            // Special handling for Documentation
            if (key === 'Documentation' || key === 'Repo') {
              return (
                <div key={key} className="detail-item">
                  <h3>{key === 'Documentation' ? 'Documentation:' : 'Repo:'}</h3>
                  <a href={value} target="_blank" rel="noopener noreferrer">
                    {key === 'Documentation' ? 'View Documentation' : 'View Repo'}
                  </a>
                </div>
              );
            }

            return (
              <div key={key} className="detail-item">
                <h3>{fieldLabels[key] || key.replace(/_/g, ' ')}:</h3>
                <p>
                  {technologyListFields.includes(key) 
                    ? renderTechnologyList(value)
                    : value.replace(/;/g, '; ')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProjectModal; 