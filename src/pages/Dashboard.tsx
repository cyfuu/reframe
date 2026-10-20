import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/auth';
import { formatDate } from '../lib/format';
import { ProjectRow } from '../components/ProjectRow';
import { NewProjectModal } from '../components/NewProjectModal';
import type { Project, ProjectRecord } from '../types';

type ProjectWithLogs = ProjectRecord & { logs: { id: string; created_at: string }[] | null };

function toProject(row: ProjectWithLogs): { project: Project; activityAt: string } {
  const logs = row.logs ?? [];
  const latest = logs.reduce<string | null>(
    (acc, l) => (!acc || l.created_at > acc ? l.created_at : acc),
    null,
  );

  return {
    project: {
      id: row.id,
      name: row.name,
      repoUrl: row.repo_url,
      role: row.role === 'contributor' ? 'contributor' : 'owner',
      lastRelease: latest ? formatDate(latest) : null,
      logCount: logs.length,
    },
    activityAt: latest ?? row.created_at,
  };
}

export function Dashboard() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from('projects')
        .select('*, logs(id, created_at)')
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error('Error fetching projects:', error.message);
        toast.error('Failed to load projects');
      } else if (data) {
        const mapped = (data as ProjectWithLogs[]).map(toProject);
        mapped.sort((a, b) => b.activityAt.localeCompare(a.activityAt));
        setProjects(mapped.map((m) => m.project));
      }
      setIsLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function handleDeleteProject(projectId: string) {
    const isConfirmed = window.confirm(
      'Delete this project and ALL of its release notes? This cannot be undone.',
    );
    if (!isConfirmed) return;

    const toastId = toast.loading('Deleting project…');
    const { error } = await supabase.from('projects').delete().eq('id', projectId);

    if (error) {
      toast.error(`Error deleting project: ${error.message}`, { id: toastId });
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success('Project deleted', { id: toastId });
    }
  }

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Projects</h1>
          <p className="mt-2 max-w-xl text-mute">
            Repositories I’ve built or contributed to, each with its own release timeline.
          </p>
        </div>

        {isAdmin && (
          <button type="button" onClick={() => setIsModalOpen(true)} className="btn btn-primary self-start sm:self-auto">
            + add project
          </button>
        )}
      </div>

      {isLoading ? (
        <ul className="divide-y divide-line rounded-md border border-line" aria-busy="true" aria-label="Loading projects">
          {[0, 1, 2].map((i) => (
            <li key={i} className="px-5 py-4">
              <div className="h-4 w-40 animate-pulse rounded bg-sunken" />
              <div className="mt-2 h-3 w-56 animate-pulse rounded bg-sunken" />
            </li>
          ))}
        </ul>
      ) : projects.length === 0 ? (
        <div className="rounded-md border border-dashed border-line-strong px-6 py-14 text-center">
          <p className="font-mono text-sm text-mute">
            {isAdmin ? 'No projects yet. Add your first repository.' : 'No projects published yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(0,1fr)_6.5rem_7rem_8.5rem] gap-x-6 px-5 pb-2 font-mono text-[11px] uppercase tracking-wider text-mute sm:grid" aria-hidden="true">
            <span>repository</span>
            <span>role</span>
            <span className="text-right">entries</span>
            <span className="text-right">last release</span>
          </div>
          <ul className="divide-y divide-line overflow-hidden rounded-md border border-line">
            {projects.map((project) => (
              <ProjectRow key={project.id} project={project} isAdmin={isAdmin} onDelete={handleDeleteProject} />
            ))}
          </ul>
        </>
      )}

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
          toast.success('Project added');
        }}
        existingProjects={projects}
      />
    </motion.div>
  );
}