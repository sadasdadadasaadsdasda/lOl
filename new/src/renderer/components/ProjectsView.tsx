import React, { useState, useCallback } from 'react';
import { Plus, Folder, MoreVertical, Trash2, Edit, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../App';

export interface ProjectsViewProps {
  projects: Project[];
  currentProjectId: string | null;
  onSelectProject: (id: string | null) => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  currentProjectId,
  onSelectProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Handle create project
  const handleCreateProject = useCallback(() => {
    if (newProjectName.trim() === '') return;
    
    // In a real implementation, we would create the project
    console.log('Create project:', newProjectName);
    setNewProjectName('');
    setShowNewProjectInput(false);
  }, [newProjectName]);

  // Handle edit project
  const handleEditProject = useCallback((project: Project) => {
    setEditingProjectId(project.id);
    setEditValue(project.name);
  }, []);

  // Handle save edit
  const handleSaveEdit = useCallback(() => {
    if (!editingProjectId || editValue.trim() === '') return;
    
    // In a real implementation, we would update the project
    console.log('Update project:', editingProjectId, editValue);
    setEditingProjectId(null);
    setEditValue('');
  }, [editingProjectId, editValue]);

  // Handle delete project
  const handleDeleteProject = useCallback((projectId: string) => {
    // In a real implementation, we would delete the project
    console.log('Delete project:', projectId);
  }, []);

  // Filter projects
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full p-4">
      <h1 className="text-xl font-bold mb-4">Projects</h1>

      {/* Search and create */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        
        <button
          onClick={() => setShowNewProjectInput(true)}
          className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* New project input */}
      <AnimatePresence>
        {showNewProjectInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject();
                  if (e.key === 'Escape') {
                    setNewProjectName('');
                    setShowNewProjectInput(false);
                  }
                }}
                className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={handleCreateProject}
                disabled={newProjectName.trim() === ''}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/80 disabled:opacity-50 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setNewProjectName('');
                  setShowNewProjectInput(false);
                }}
                className="p-2 hover:bg-accent/50 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projects list */}
      <div className="flex-1 overflow-auto">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Folder className="w-12 h-12 mb-4 opacity-50" />
            <p>No projects yet</p>
            <p className="text-sm mt-1">Create a project to organize your conversations</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                whileHover={{ scale: 1.01 }}
                className={`border border-border rounded-lg p-4 transition-colors ${
                  currentProjectId === project.id
                    ? 'bg-accent border-primary'
                    : 'hover:bg-accent/50'
                }`}
                onClick={() => onSelectProject(project.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  {editingProjectId === project.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') {
                          setEditingProjectId(null);
                          setEditValue('');
                        }
                        e.stopPropagation();
                      }}
                      autoFocus
                      className="flex-1 px-2 py-1 text-sm border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4" />
                        <span className="font-medium">{project.name}</span>
                      </div>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-secondary/50 rounded transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {editingProjectId === project.id ? (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit();
                      }}
                      className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/80"
                    >
                      Save
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProjectId(null);
                        setEditValue('');
                      }}
                      className="px-3 py-1 text-xs bg-secondary rounded hover:bg-secondary/80"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {project.conversations.length} conversation{project.conversations.length !== 1 ? 's' : ''}
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditProject(project);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs border border-border rounded hover:bg-accent/50 transition-colors"
                  >
                    <Edit className="w-3 h-3 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs border border-destructive text-destructive rounded hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 inline mr-1" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsView;
