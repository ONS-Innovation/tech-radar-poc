import React from 'react';
import { IoCloudUploadOutline } from "react-icons/io5";
import toast from 'react-hot-toast';

function FileUpload({ onFileUpload, checkForDuplicates }) {
  const convertJsonToCsvFormat = (json) => {
    return json.projects.map(project => {
      const details = project.details[0];
      const architecture = project.architecture;
      
      return {
        Project: details.name,
        Project_Short: details.short_name,
        Project_Area: details.project_description,
        Documentation: details.documentation_link?.[0],
        
        Team: project.user.map(u => u.email).join('; '),

        Language_Main: architecture.languages.main.join('; '),
        Language_Others: architecture.languages.others.join('; '),
        
        Language_Frameworks: architecture.frameworks.others.join('; '),
        
        Hosted: architecture.hosting.details?.join('; ') || architecture.hosting.type?.join('; '),
        
        Datastores: [...(architecture.database.main || []), ...(architecture.database.others || [])].join('; '),
        
        CICD: [...(architecture.cicd.main || []), ...(architecture.cicd.others || [])].join('; '),
        
        Source_Control: project.source_control?.[0]?.type,
        
        Project_Stage: project.stage,
        
        Infrastructure: [...(architecture.infrastructure.main || []), ...(architecture.infrastructure.others || [])].join('; '),
        
        Developed: project.developed[0],
        Development_Partners: project.developed[1]?.join('; '),
      };
    });
  };

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

  return (
    <label className="upload-button">
      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <IoCloudUploadOutline size={16} />
    </label>
  );
}

export default FileUpload;
