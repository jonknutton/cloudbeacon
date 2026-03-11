/**
 * FEATURE: Projects
 * Responsibility: Project creation, management, workflows
 * 
 * SUBFEATURES:
 * - projectpage/ - Individual project detail page
 * - projects-list/ - Project listing and browsing (future)
 * 
 * SUBMODULES (projectpage):
 * - overview-tab.js - Project overview
 * - plan-tab.js - Planning and tasks
 *   - tasks.js - Task CRUD
 *   - activities.js - Work breakdown
 *   - gantt.js - Gantt visualization
 * - team-tab.js - Team management  
 * - updates-tab.js - Project updates/timeline
 * - costs-tab.js - Budget/pricing
 * - funds-tab.js - Funding/bids
 * 
 * IMPORTS: Core, Services/project-service
 * EXPORTS: Public projects API
 */

// Project operations
// export { 
//     createProject, 
//     loadProject, 
//     updateProject,
//     deleteProject 
// } from './projectpage/projectpage-loader.js';

// Task management
// export {
//     createTask,
//     updateTask,
//     deleteTask,
//     reorderTasks
// } from './projectpage/plan-tab/tasks.js';

// Team management
// export {
//     addTeamMember,
//     removeTeamMember,
//     updateMemberRole
// } from './projectpage/team-tab.js';

// Project updates
// export {
//     addUpdate,
//     loadUpdates,
//     deleteUpdate
// } from './projectpage/updates-tab.js';

/**
 * USAGE:
 * import { loadProject, createTask } from './projects/index.js';
 * 
 * const project = await loadProject(projectId);
 * const newTask = await createTask({ name: 'Do something', projectId });
 */
