import React from 'react';
import '../../styles/ProjectModal.css';

const ProjectModal = ({ isOpen, onClose, project, renderTechnologyList }) => {
  if (!isOpen || !project) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content project-modal" onClick={(e) => e.stopPropagation()}>

        {/* Project Title Section */}
        <div className="project-header">
            <div className="project-header-left">
                <h2>{project.Project}</h2>
                {project.Project_Short && (
                    <div className="project-short-name">({project.Project_Short})</div>
                )}
            </div>
            <div className="project-header-right">
                <button className="modal-close" onClick={onClose}>×</button>
            </div>

        </div>

        <div className="project-details">
          {/* Core Details */}
          {project.Project_Area && (
            <div className="detail-item">
              <h3>Project Area:</h3>
              <p>{project.Project_Area}</p>
            </div>
          )}

          {project.Team && (
            <div className="detail-item">
              <h3>Team:</h3>
              <p>{project.Team}</p>
            </div>
          )}

          {project.DST_Area && (
            <div className="detail-item">
              <h3>DST Area:</h3>
              <p>{project.DST_Area}</p>
            </div>
          )}

          {/* Languages & Frameworks */}
          {project.Language_Main && (
            <div className="detail-item">
              <h3>Main Language:</h3>
              <p>{renderTechnologyList(project.Language_Main)}</p>
            </div>
          )}

          {project.Language_Others && (
            <div className="detail-item">
              <h3>Other Languages:</h3>
              <p>{renderTechnologyList(project.Language_Others)}</p>
            </div>
          )}

          {project.Language_Frameworks && (
            <div className="detail-item">
              <h3>Frameworks:</h3>
              <p>{renderTechnologyList(project.Language_Frameworks)}</p>
            </div>
          )}

          {/* Testing */}
          {project.Testing_Frameworks && (
            <div className="detail-item">
              <h3>Testing Frameworks:</h3>
              <p>{renderTechnologyList(project.Testing_Frameworks)}</p>
            </div>
          )}

          {/* Infrastructure */}
          {project.Hosted && (
            <div className="detail-item">
              <h3>Hosted On:</h3>
              <p>{project.Hosted}</p>
            </div>
          )}

          {project.Containers && (
            <div className="detail-item">
              <h3>Containers:</h3>
              <p>{renderTechnologyList(project.Containers)}</p>
            </div>
          )}

          {project.Architectures && (
            <div className="detail-item">
              <h3>Architecture:</h3>
              <p>{project.Architectures}</p>
            </div>
          )}

          {/* Source Control */}
          {project.Source_Control && (
            <div className="detail-item">
              <h3>Source Control:</h3>
              <p>{project.Source_Control}</p>
            </div>
          )}

          {project.Branching_Strategy && (
            <div className="detail-item">
              <h3>Branching Strategy:</h3>
              <p>{project.Branching_Strategy}</p>
            </div>
          )}

          {/* Development Tools */}
          {project.Static_Analysis && (
            <div className="detail-item">
              <h3>Static Analysis:</h3>
              <p>{renderTechnologyList(project.Static_Analysis)}</p>
            </div>
          )}

          {project.Code_Formatter && (
            <div className="detail-item">
              <h3>Code Formatter:</h3>
              <p>{renderTechnologyList(project.Code_Formatter)}</p>
            </div>
          )}

          {/* Data & Monitoring */}
          {project.Monitoring && (
            <div className="detail-item">
              <h3>Monitoring:</h3>
              <p>{renderTechnologyList(project.Monitoring)}</p>
            </div>
          )}

          {project.Datastores && (
            <div className="detail-item">
              <h3>Datastores:</h3>
              <p>{renderTechnologyList(project.Datastores)}</p>
            </div>
          )}

          {project.Data_Output_Formats && (
            <div className="detail-item">
              <h3>Data Output Formats:</h3>
              <p>{renderTechnologyList(project.Data_Output_Formats)}</p>
            </div>
          )}

          {/* Integrations */}
          {project.Integrations_ONS && (
            <div className="detail-item">
              <h3>ONS Integrations:</h3>
              <p>{renderTechnologyList(project.Integrations_ONS)}</p>
            </div>
          )}

          {project.Integrations_External && (
            <div className="detail-item">
              <h3>External Integrations:</h3>
              <p>{renderTechnologyList(project.Integrations_External)}</p>
            </div>
          )}

          {/* Documentation */}
          {project.Documentation && (
            <div className="detail-item">
              <h3>Documentation:</h3>
              <a href={project.Documentation} target="_blank" rel="noopener noreferrer">
                View Documentation
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectModal; 