import { Activity, FlaskConical, BookOpen, Microscope, ArrowRight, AlertCircle } from 'lucide-react';
import type { Page } from './Layout';
import { PreviewNetwork } from './PreviewNetwork';

interface OverviewProps {
  onNavigate: (page: Page) => void;
}

export function Overview({ onNavigate }: OverviewProps) {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden grid-pattern">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-spore-bg/80 to-spore-bg" />
        <div className="relative max-w-[1400px] mx-auto px-4 lg:px-6 pt-20 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-spore-surface border border-spore-border text-xs text-spore-teal mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-spore-teal animate-pulse-slow" />
                Computational Biology Research Tool
              </div>
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-spore-text leading-tight text-balance">
                A bio-inspired self-adaptive communication network
              </h1>
              <p className="mt-6 text-lg text-spore-muted leading-relaxed max-w-xl">
                SPORE-NET translates network adaptation principles observed in{' '}
                <em className="text-spore-teal not-italic">Physarum polycephalum</em>{' '}
                into a computational simulation. Can conductance-based routing
                improve network resilience when connections fail?
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate('simulation')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-spore-teal text-spore-bg font-semibold text-sm hover:bg-spore-teal-dim transition shadow-lg shadow-spore-teal/20"
                >
                  <Activity size={18} />
                  Run an Experiment
                </button>
                <button
                  onClick={() => onNavigate('research')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-spore-surface border border-spore-border text-spore-text font-medium text-sm hover:bg-spore-surface-light transition"
                >
                  <BookOpen size={18} />
                  Read the Research
                </button>
              </div>
            </div>

            {/* Preview network */}
            <div className="relative">
              <div className="aspect-square max-w-lg mx-auto rounded-2xl bg-spore-surface/50 border border-spore-border overflow-hidden">
                <PreviewNetwork />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scientific question */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-6 py-16">
        <div className="max-w-3xl">
          <h2 className="font-display text-2xl font-semibold text-spore-text mb-4">
            The scientific question
          </h2>
          <p className="text-spore-muted text-lg leading-relaxed">
            Can network adaptation rules inspired by the transport-network behaviour
            of <em className="text-spore-teal not-italic">Physarum polycephalum</em>{' '}
            (slime mould) improve communication-network resilience when connections
            fail or transmission conditions change?
          </p>
          <p className="text-spore-muted text-base leading-relaxed mt-4">
            SPORE-NET does not claim that fungi transmit internet packets. It translates
            observed biological principles into a mathematical model, implements that model
            in software, and measures the results — honestly, whether the bio-inspired
            approach outperforms conventional routing or not.
          </p>
        </div>
      </section>

      {/* Three stages */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12">
        <h2 className="font-display text-2xl font-semibold text-spore-text mb-8">
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <StageCard
            number="01"
            title="Model"
            description="Generate a weighted graph representing a communication network. Each edge has conductance, length, and flow — parameters inspired by biological transport networks."
            icon={<Microscope size={24} />}
          />
          <StageCard
            number="02"
            title="Simulate disruption"
            description="Inject node failures, connection failures, or increased transmission costs. The same disruption is applied to both routing strategies under identical conditions."
            icon={<AlertCircle size={24} />}
          />
          <StageCard
            number="03"
            title="Evaluate recovery"
            description="Measure packet delivery rates, route costs, hop counts, and recovery time. Compare conventional shortest-path routing against bio-inspired adaptive conductance routing."
            icon={<FlaskConical size={24} />}
          />
        </div>
      </section>

      {/* Bio inspiration */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="font-display text-2xl font-semibold text-spore-text mb-4">
              Biological inspiration
            </h2>
            <p className="text-spore-muted leading-relaxed">
              <em className="text-spore-teal not-italic">Physarum polycephalum</em> is a
              single-celled organism that constructs efficient transport networks to
              connect food sources. When part of its network is damaged, the organism
              redistributes flow and adapts its tubular connections — thickening
              high-flow paths and pruning unused ones.
            </p>
            <p className="text-spore-muted leading-relaxed mt-4">
              Researchers have formalized this behaviour as a conductance-update rule:
              edges with high flow increase in conductance, while low-flow edges decay.
              SPORE-NET applies this same principle to communication network routing.
            </p>
          </div>
          <div className="research-surface rounded-2xl p-6">
            <h3 className="font-display font-semibold text-lg mb-3">
              The adaptation rule
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              The core update, adapted from Tero et al. (2010):
            </p>
            <div className="bg-white/60 rounded-lg p-4 font-mono text-sm text-spore-light-text">
              dD<sub>ij</sub>/dt = |Q<sub>ij</sub>| − μ·D<sub>ij</sub>
            </div>
            <p className="text-xs mt-3 leading-relaxed">
              Where D<sub>ij</sub> is edge conductance, Q<sub>ij</sub> is modeled flow,
              and μ controls decay. High-flow edges strengthen; low-flow edges atrophy.
            </p>
          </div>
        </div>
      </section>

      {/* Notice */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-6 pb-16">
        <div className="rounded-xl bg-spore-surface border border-spore-warning/30 p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-spore-warning shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-spore-text mb-1">
              Computational model notice
            </h3>
            <p className="text-sm text-spore-muted leading-relaxed">
              SPORE-NET is a computational simulation inspired by biological network
              adaptation. It does not reproduce living organisms, does not claim that
              fungi transmit digital packets, and does not assert that the bio-inspired
              algorithm is superior before testing. All results shown are measured from
              the simulation engine, not from biological experiments.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-6 pb-20">
        <div className="rounded-2xl bg-gradient-to-br from-spore-surface to-spore-surface-light border border-spore-border p-8 lg:p-12 text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-spore-text mb-3">
            Ready to run an experiment?
          </h2>
          <p className="text-spore-muted max-w-xl mx-auto mb-6">
            Configure a network, inject a disruption, and compare routing strategies
            with real measured results.
          </p>
          <button
            onClick={() => onNavigate('simulation')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-spore-teal text-spore-bg font-semibold text-sm hover:bg-spore-teal-dim transition shadow-lg shadow-spore-teal/20"
          >
            Start simulation
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}

function StageCard({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-spore-surface border border-spore-border p-6 hover:border-spore-teal/40 transition group">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-spore-teal/10 flex items-center justify-center text-spore-teal group-hover:bg-spore-teal/20 transition">
          {icon}
        </div>
        <span className="font-display text-3xl font-bold text-spore-border">{number}</span>
      </div>
      <h3 className="font-display font-semibold text-spore-text text-lg mb-2">{title}</h3>
      <p className="text-sm text-spore-muted leading-relaxed">{description}</p>
    </div>
  );
}
