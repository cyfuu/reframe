import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import type { Project } from '../types';

const MY_GITHUB_USERNAME = 'cyfuu';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingProjects: Project[];
}

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
}

export function NewProjectModal({ isOpen, onClose, onSuccess, existingProjects }: Props) {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [savingRepo, setSavingRepo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchGithubRepos();
    }
  }, [isOpen, existingProjects]);

  async function fetchGithubRepos() {
    setIsLoadingRepos(true);
    setError(null);

    try {
      const res = await fetch(`https://api.github.com/users/${MY_GITHUB_USERNAME}/repos?sort=updated`);
      if (!res.ok) throw new Error('Failed to fetch from GitHub');
      
      const data: GithubRepo[] = await res.json();

      // FILTER 
      const existingUrls = existingProjects.map(p => p.repoUrl.toLowerCase());
      const availableRepos = data.filter(
        repo => !existingUrls.includes(repo.full_name.toLowerCase())
      );

      setRepos(availableRepos);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingRepos(false);
    }
  }

  async function handleAddProject(repo: GithubRepo) {
    setSavingRepo(repo.full_name);
    setError(null);

    const { error: dbError } = await supabase
      .from('projects')
      .insert([{ 
        name: repo.name, 
        repo_url: repo.full_name 
      }]);

    if (dbError) {
      setError(dbError.message);
      setSavingRepo(null);
    } else {
      setSavingRepo(null);
      onSuccess();
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
          className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 w-full max-w-md relative"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Select a Repository</h2>
            <p className="text-sm text-gray-500">Showing public repos for @{MY_GITHUB_USERNAME}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mb-4 shrink-0">{error}</p>}

        <div className="overflow-y-auto pr-2 space-y-3 flex-1 custom-scrollbar">
          {isLoadingRepos ? (
            <div className="text-center text-gray-500 py-8 animate-pulse">
              Fetching your repositories...
            </div>
          ) : repos.length === 0 ? (
            <div className="text-center text-gray-500 py-8 border border-dashed border-gray-800 rounded-xl">
              All your public repositories are already added!
            </div>
          ) : (
            repos.map(repo => (
              <div key={repo.id} className="bg-[#050505] border border-gray-800 rounded-xl p-4 flex justify-between items-center hover:border-gray-600 transition-colors">
                <div className="truncate pr-4">
                  <h3 className="text-white font-medium truncate">{repo.name}</h3>
                  <p className="text-gray-500 text-sm truncate">{repo.full_name}</p>
                </div>
                <button
                  onClick={() => handleAddProject(repo)}
                  disabled={savingRepo === repo.full_name}
                  className="shrink-0 bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {savingRepo === repo.full_name ? 'Adding...' : 'Add'}
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}