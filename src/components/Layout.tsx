import { useState, useCallback } from 'react';
import { Network, Activity, FlaskConical, BookOpen, Microscope, Menu, X } from 'lucide-react';

export type Page = 'overview' | 'simulation' | 'results' | 'research' | 'methodology';

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Network size={18} /> },
  { id: 'simulation', label: 'Run Simulation', icon: <Activity size={18} /> },
  { id: 'results', label: 'Results & Experiments', icon: <FlaskConical size={18} /> },
  { id: 'research', label: 'Research & Theory', icon: <BookOpen size={18} /> },
  { id: 'methodology', label: 'Methodology', icon: <Microscope size={18} /> },
];

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useCallback(
    (page: Page) => {
      onNavigate(page);
      setMobileOpen(false);
    },
    [onNavigate],
  );

  return (
    <div className="min-h-screen flex flex-col bg-spore-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-spore-bg/95 backdrop-blur border-b border-spore-border">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate('overview')}
            className="flex items-center gap-2.5 group"
            aria-label="SPORE-NET home"
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-spore-teal/20 rounded-lg blur-sm group-hover:bg-spore-teal/30 transition" />
              <Network className="w-6 h-6 text-spore-teal relative z-10" />
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-spore-text text-base leading-none">
                SPORE-NET
              </div>
              <div className="text-[10px] text-spore-muted leading-none mt-0.5">
                2.0
              </div>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  currentPage === item.id
                    ? 'bg-spore-surface text-spore-teal'
                    : 'text-spore-muted hover:text-spore-text hover:bg-spore-surface/50'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-spore-text hover:bg-spore-surface"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-spore-border bg-spore-bg animate-slide-up">
            <div className="max-w-[1400px] mx-auto px-4 py-2 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    currentPage === item.id
                      ? 'bg-spore-surface text-spore-teal'
                      : 'text-spore-muted hover:text-spore-text hover:bg-spore-surface/50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-spore-border bg-spore-bg">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6 text-center text-xs text-spore-dim">
          <p>
            SPORE-NET 2.0 — A bio-inspired self-adaptive communication network simulation.
          </p>
          <p className="mt-1">
            This is a computational model, not a live biological system. Results are
            measured from the simulation engine, not from living organisms.
          </p>
        </div>
      </footer>
    </div>
  );
}
