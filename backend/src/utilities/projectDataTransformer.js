/**
 * Transforms a project object from the raw JSON format to the CSV format.
 * @param {Object} project - The raw project data object
 * @returns {Object} The transformed project data in CSV format
 */
function transformProjectToCSVFormat(project) {
  // Find primary technical contact
  const technicalContact = project.user.find(u => u.roles.includes("Technical Contact"))?.email || "";
  
  // Get main languages and others as comma-separated strings
  const mainLanguages = project.architecture.languages.main.join("; ");
  const otherLanguages = project.architecture.languages.others.join("; ");
  const frameworks = project.architecture.frameworks.others.join("; ");
  
  // Get source control details
  const sourceControl = project.source_control[0]?.type || "";
  
  // Transform to match desired CSV structure
  return {
    Project: project.details[0]?.name || "",
    Project_Short: project.details[0]?.short_name || "",
    Project_Area: "",
    DST_Area: "",
    Team: technicalContact,
    Language_Main: mainLanguages,
    Language_Others: otherLanguages,
    Language_Frameworks: frameworks,
    Testing_Frameworks: "", // Not directly available in new format
    Hosted: project.architecture.hosting.type.join("; "),
    Messaging_Type: "",
    Containers: "", // Not directly available in new format
    Architectures: project.architecture.hosting.details.join("; "),
    Source_Control: sourceControl,
    Branching_Strategy: "",
    Repo: project.source_control[0]?.links.map(link => link.url).join("; ") || "",
    Static_Analysis: "",
    Code_Formatter: "",
    Package_Manager: "",
    Security_Tools: "",
    CICD: project.architecture.cicd.others.join("; "),
    CICD_Orchestration: "",
    Monitoring: "",
    Datastores: project.architecture.database.others.join("; "),
    Database_Technologies: project.architecture.database.main.join("; "),
    Data_Output_Formats: "",
    Business_Dashboards: "",
    Integrations_ONS: "",
    Integrations_External: "",
    IAM_Services: "",
    Datasets_Used: "",
    Project_Tools: project.supporting_tools.project_tracking || "",
    Documentation: project.details[0]?.documentation_link?.join("; ") || "",
    Infrastructure: project.architecture.infrastructure.others.join("; "),
    // New fields
    Code_Editors: project.supporting_tools.code_editors.others.join("; "),
    Communication: project.supporting_tools.communication.others.join("; "),
    Collaboration: project.supporting_tools.collaboration.others.join("; "),
    Incident_Management: project.supporting_tools.incident_management || "",
    Documentation_Tools: project.supporting_tools.documentation.others.join("; "),
    UI_Tools: project.supporting_tools.user_interface.others.join("; "),
    Diagram_Tools: project.supporting_tools.diagrams.others.join("; ")
  };
}

module.exports = {
  transformProjectToCSVFormat
}; 