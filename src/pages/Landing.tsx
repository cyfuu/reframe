import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '/logo.svg';
import { useAuth } from '../lib/auth';

const RAW_COMMITS = [
  ['a91c3f2', 'fix typo'],
  ['7be0d14', 'adjust padding'],
  ['c40e8a9', 'wip'],
  ['2d5f6b1', "merge branch 'main'"],
  ['e83a7c0', 'fix padding again'],
  ['5f19d0b', 'add theme toggle'],
];

export function Landing() {
  const { isAdmin } = useAuth();

  if (isAdmin) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <motion.div
      className="max-w-5xl pt-6 md:pt-16"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="relative isolate">
        <img
          src={logo}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{ filter: 'var(--logo-invert)' }}
          className="pointer-events-none absolute -right-16 -top-6 -z-10 w-64 select-none opacity-[0.07] sm:-right-10 sm:w-80 lg:right-0 lg:top-1/2 lg:w-[26rem] lg:-translate-y-1/2 lg:translate-x-[8%] lg:opacity-90 xl:translate-x-[16%]"
        />

        <div className="lg:max-w-[36rem]">
      <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl md:text-6xl lg:text-5xl xl:text-[3.25rem]">
        Commits are what happened. Releases are what mattered.
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mute">
        Reframe turns a pile of commits into a readable timeline: what shipped, why it was built
        that way, and what I learned along the way.
      </p>

      <div className="mt-8">
        <Link to="/projects" className="btn btn-primary px-5 py-2.5">
          Browse projects <span aria-hidden="true">→</span>
        </Link>
      </div>
        </div>
      </div>

      {/* raw -> reframed */}
      <div
        className="mt-16 grid gap-4 md:mt-24 md:grid-cols-[1fr_auto_1.25fr] md:items-start"
        role="img"
        aria-label="Example: six raw commits are grouped into one release entry"
      >
        <div className="rounded-md border border-line bg-sunken p-4 font-mono text-xs leading-6">
          <p className="mb-2 text-mute">$ git log --oneline</p>
          {RAW_COMMITS.map(([sha, msg]) => (
            <p key={sha} className="truncate text-mute">
              <span className="text-ink">{sha}</span> {msg}
            </p>
          ))}
        </div>

        <div className="flex items-center justify-center font-mono text-xl text-mute md:h-full" aria-hidden="true">
          <span className="rotate-90 md:rotate-0">→</span>
        </div>

        <div className="relative rounded-md border border-line bg-surface p-4 pl-8">
          <span
            aria-hidden="true"
            className="absolute left-4 top-[21px] size-[11px] rounded-full bg-[var(--k-feature)]"
          />
          <div className="flex flex-wrap items-center gap-x-3 font-mono text-xs leading-5 text-mute">
            <span>Oct 12, 2026</span>
            <span className="rounded-sm bg-[color-mix(in_srgb,var(--k-feature)_14%,transparent)] px-1.5 py-px text-[color-mix(in_srgb,var(--k-feature)_72%,var(--ink))]">
              feature
            </span>
            <span className="rounded border border-line px-1.5 py-px text-ink">5f19d0b</span>
          </div>
          <p className="mt-2 text-base font-semibold tracking-tight text-ink">
            A theme that remembers you
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-mute marker:text-line-strong">
            <li>Follows your system setting until you pick one</li>
            <li>No flash of the wrong theme on load</li>
            <li>Fixed spacing regressions along the way</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}