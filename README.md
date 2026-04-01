<h1 align="center">
  Reframe
</h1>

<p align="center">
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-B73BFE?style=flat-square&logo=vite&logoColor=FFD62E" alt="Vite"></a>
  <a href="https://www.framer.com/motion/"><img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white" alt="Framer Motion"></a>
</p>

<p align="center">
  <a href="https://cyfuu.github.io/reframe/"><img src="https://img.shields.io/badge/Live_Demo-View_Here-blue?style=flat-square" alt="Live Demo"></a>
</p>

> **Reframe is a curated, human-readable timeline of your software projects. It sits directly between your raw GitHub commits and your polished portfolio.**

Currently designed as a centralized personal developer workspace, Reframe acts as a unified hub to track milestones, write detailed release notes, and showcase my coding journey.

### Beyond the Commit Log

Standard version control is incredible for tracking code, but it struggles to communicate the actual journey. While raw Git history is essential for development, it often falls short when sharing your progress:

* **The Signal-to-Noise Ratio:** For every meaningful feature, there are dozens of commits fixing typos, adjusting padding, or resolving merge conflicts.
* **The Missing "Why":** A code diff shows exactly *what* changed, but it rarely captures the architectural decisions, the roadblocks, or the user impact behind those changes.
* **The Audience Gap:** Hiring managers, non-technical founders, and end-users rarely dig through raw repository logs.

Reframe bridges this gap. It allows you to pull in messy, day-to-day code via the GitHub API and aggregate it into clean, visual "Release Notes." By grouping raw commit hashes under a human-readable umbrella, it documents not just what was built, but *why* it was built and *what was learned* along the way.

**Note:** Reframe features secure authenticated routes for creating and editing logs. Check out the [Live Demo here](https://cyfuu.github.io/reframe/).

---

## Features

- **Premium UI/UX:** Buttery-smooth, staggered animations and transitions powered by Framer Motion, with bespoke scroll-tracking for native-feeling mobile interactions.
- **Changelog Timeline:** Beautifully structured project updates, complete with tag filtering, timestamped entries, and direct links to GitHub commit hashes.
- **GitHub Integration:** A dedicated workspace sidebar to track recent repository commits while writing updates.
- **Secure Authentication:** Protected routes ensuring only authorized access to create, edit, or delete projects and logs.
- **Client-Side Routing:** Lightning-fast navigation using React Router (`BrowserRouter`), elegantly configured with custom fallbacks for static GitHub Pages hosting.
- **Responsive Design:** Perfectly optimized to scale gracefully from desktop monitors down to mobile touchscreens.

## Disclaimer

This project is built primarily as a personal workspace. The protected routes and data integrations are restricted to authorized users to manage project logs. While the public can view the timelines and project evolution, editing capabilities are secured and locked.
