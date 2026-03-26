export interface Changelog {
  id: string;
  tag: string;
  date: string;
  commitHash: string;
  title: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  lastUpdated: string;
  logCount: number;
}