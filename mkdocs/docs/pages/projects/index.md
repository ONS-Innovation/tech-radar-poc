# Projects

The Projects section provides a comprehensive view of all projects and their technology stacks gathered by the Tech Audit tool.

## Overview

The Projects interface allows you to:

- View all projects recorded by the Tech Audit tool
- View project information with the [Project Modal](/components/projectModal)
- Sort by, refresh and search

### Sorting

- Alphabetical (asc/desc)
- Technology count (asc/desc)
- Technology status (most/least)
    - There are 2 boxes where a user can select the technology ring from the Radar (adopt, trial, assess, hold) and a box to choose most ratio or least ratio.
    - Select a ring in the left box. Then select a ratio. The list will be filtered with the percentage of technolgies used within that project with that ring, sorted by the ratio.
    - To best understand this feature, test it for yourself or read the example below.
    - For example:
        - Project A has 10 technologies. 9 are in the adopt ring, 1 is in the hold ring.
        - Project B has 10 technologies. 1 is in the adopt ring, 9 are in the hold ring.
        - If a user selects the 'Adopt' ring and the 'Most Ratio', then Project A will be at the top of the list.
        - If a user selects the 'Hold' ring and the 'Most Ratio', then Project B will be at the top of the list.

### Refresh

- Click the refresh button to refresh the list or just refresh the page manually. 
- This refreshes the data without refreshing other cached data, which manually refreshing would do.

### Search

- Use the search bar to search for a project (CMD + K or CTRL + K)
- The search will filter the project list
