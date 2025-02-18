# Tech Radar

The Tech Radar is an interactive visualisation tool that helps track and manage technology adoption across the organisation.

## Overview

The Tech Radar provides a visual representation of technologies categorised into four quadrants:

- **Languages**: such as Python, JavaScript, Java
- **Frameworks**: such as Flask, React, Spring
- **Supporting Tools**: such as CI/CD (e.g. Jenkins, GitHub Actions, Concourse) and other tools used for development, documentation and project management (e.g. VSCode, Confluence, Jira)
- **Infrastructure**: such as AWS, Azure, GCP

Each technology is placed in one of four rings:

- **Adopt**: aim to widely adopt and mature
- **Trial**: aim to try out and evaluate
- **Assess**: aim to assess for potential adoption
- **Hold**: not recommended for new deployment without approval

## Features

### Interactive Visualisation
- Hover over blips to view information or click to lock selection
- Drag quadrant lists to customise your view
- Filter technologies by quadrant by clicking on the label around the radar
- Search functionality for quick access (CMD + K or CTRL + K)

### Technology Details
- Using the [Info Box](/components/infoBox) component, you can view:
    - Current adoption status
    - Timeline of changes
    - Related projects

### Navigation
- Keyboard shortcuts:
    - Press key `1` to move up the list
    - Press key `2` to move down the list
