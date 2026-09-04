import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../types';
import { useProjectStore } from '../../stores/useProjectStore';
import { b3ToProject, parseImportedJson, projectToB3 } from '../../lib/behavior/b3';
import {
  listLocalProjects,
  removeLocalProject,
  writeLocalProject,
} from '../../lib/storage/local-projects';
import { useSyncStore } from '../../lib/storage/cloud-sync';
import { track } from '../../lib/analytics';
import { setProjectOrigin } from '../../lib/product-metrics';
import { Button } from '../../components/ui/button';
import { Plus, Download, Trash, FolderOpen, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const project = useProjectStore(state => state.project);
  const createProject = useProjectStore(state => state.createProject);
  const loadProject = useProjectStore(state => state.loadProject);
  const renameProject = useProjectStore(state => state.renameProject);
  const closeProject = useProjectStore(state => state.closeProject);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  // Load projects from local storage; re-read when cloud sync changes it
  const [projects, setProjects] = useState<Project[]>([]);
  const localRevision = useSyncStore(state => state.localRevision);

  useEffect(() => {
    const loadedProjects = [];
    for (const raw of listLocalProjects()) {
      try {
        const imported = parseImportedJson(raw);
        if (imported.kind === 'project') {
          loadedProjects.push(imported.project);
        }
      } catch (e) {
        console.error('Error parsing stored project:', e);
      }
    }

    // If no projects in localStorage but we have a current project, use that
    if (loadedProjects.length === 0 && project) {
      setProjects([project]);
    } else {
      setProjects(loadedProjects);
    }
  }, [project, localRevision]);

  const handleCreateProject = () => {
    if (projectName.trim() === '') return;
    
    // createProject persists via the store's saveProject and records origin
    createProject(projectName, projectDescription);
    track('project_created');
    toast.success('Project created successfully');


    setProjectName('');
    setProjectDescription('');
    setIsCreating(false);
    navigate('/editor');
  };

  const handleExportProject = (project: Project) => {
    const serialized = projectToB3(project);
    const dataStr = JSON.stringify(serialized, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportName = `${project.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  };

  const commitRename = (target: Project) => {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name || name === target.name) return;

    if (project?.id === target.id) {
      // Open project: rename through the store (also persists)
      renameProject(name);
    } else {
      // Closed project: rewrite its stored payload directly
      try {
        const updated = { ...target, name, updatedAt: new Date().toISOString() };
        writeLocalProject(projectToB3(updated));
      } catch (error) {
        console.error('Error renaming project:', error);
        toast.error('Failed to rename project');
        return;
      }
    }
    setProjects(prev => prev.map(p => (p.id === target.id ? { ...p, name } : p)));
    toast.success('Project renamed');
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const imported = parseImportedJson(json);

        if (imported.kind === 'project') {
          loadProject(imported.project);
          setProjectOrigin(imported.project.id, 'import');
        } else if (imported.kind === 'tree') {
          // A standalone tree file becomes a new single-tree project
          const importedProject = b3ToProject({
            trees: [imported.tree],
            custom_nodes: imported.tree.custom_nodes,
          });
          loadProject(importedProject);
          setProjectOrigin(importedProject.id, 'import');
        } else {
          toast.error('Node files can be imported from within the editor');
          return;
        }
        navigate('/editor');
      } catch (error) {
        console.error('Failed to parse project file', error);
        toast.error('Invalid behavior tree file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-medium">專案</h1>
        <div className="flex space-x-4">
          <Button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2"
          >
            <Plus size={18} /> 新專案
          </Button>
          <div className="relative">
            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              匯入專案
            </Button>
            <input 
              type="file" 
              id="file-input" 
              accept=".json" 
              className="hidden" 
              onChange={handleImportProject}
            />
          </div>
        </div>
      </div>

      {isCreating && (
        <div className="card mb-8">
          <h2 className="text-xl font-medium mb-4">建立新專案</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">專案名稱</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="我的行為樹專案"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">描述</label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="專案描述"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                取消
              </Button>
              <Button onClick={handleCreateProject}>
                建立專案
              </Button>
            </div>
          </div>
        </div>
      )}

      {projects.length > 0 ? (
        <div className="grid gap-6">
          {projects.map((item) => (
            <div key={item.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {renamingId === item.id ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => commitRename(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename(item);
                          else if (e.key === 'Escape') setRenamingId(null);
                        }}
                        className="text-xl font-medium"
                        autoFocus
                      />
                    ) : (
                      <h3 className="text-xl font-medium truncate">{item.name}</h3>
                    )}
                    {project?.id === item.id && (
                      <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border border-accent bg-accent-wash text-accent-soft">
                        開啟
                      </span>
                    )}
                  </div>
                  <p className="text-muted mt-1">{item.description}</p>
                  <div className="flex mt-2 text-sm text-faint">
                    <span className="mr-4">樹：{Object.keys(item.trees).length}</span>
                    <span>最後更新：{new Date(item.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {project?.id === item.id ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="關閉專案"
                      onClick={() => {
                        closeProject();
                        toast.success('專案已關閉');
                      }}
                    >
                      <X size={16} />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="開啟專案"
                      onClick={() => {
                        loadProject(item);
                        navigate('/editor');
                      }}
                    >
                      <FolderOpen size={16} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    title="重新命名專案"
                    onClick={() => {
                      setRenamingId(item.id);
                      setRenameValue(item.name);
                    }}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" title="匯出專案" onClick={() => handleExportProject(item)}>
                    <Download size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="刪除專案"
                    className="text-danger-soft hover:bg-danger/10"
                    onClick={() => {
                      if (!confirm(`刪除專案「${item.name}」？`)) return;
                      removeLocalProject(item.id);
                      if (project?.id === item.id) {
                        closeProject();
                      }
                      setProjects(prev => prev.filter(p => p.id !== item.id));
                      toast.success('專案已刪除');
                    }}
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center">
          <h2 className="text-xl font-medium mb-2">尚無專案</h2>
          <p className="text-muted mb-6">
            開始建立您的第一個行為樹專案。
          </p>
          <Button onClick={() => setIsCreating(true)}>
            建立您的第一個專案
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
