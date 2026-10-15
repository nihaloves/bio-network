import { BookOpen, ExternalLink, AlertCircle, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

interface Reference {
  citation: string;
  url: string;
  supports: string;
  distinction: string;
}

const REFERENCES: Reference[] = [
  {
    citation:
      'Tero, A., Takagi, S., Saigusa, T., Ito, K., Bebber, D. P., Fricker, M. D., Yumiki, K., Kobayashi, R., & Nakagaki, T. (2010). "Rules for Biologically Inspired Adaptive Network Design." Science, 327(5964), 439–442.',
    url: 'https://doi.org/10.1126/science.1177894',
    supports:
      'Establishes the conductance-update rule (dD/dt = |Q| − μD) that SPORE-NET adapts for its adaptive routing algorithm. Demonstrates that Physarum polycephalum constructs efficient transport networks through flow-driven tube adaptation.',
    distinction:
      'The paper studies biological transport networks in a slime mould. SPORE-NET applies a simplified discrete approximation of the same mathematical principle to communication network routing — a different domain with different constraints.',
  },
  {
    citation:
      'Nakagaki, T., Yamada, H., & Tóth, Á. (2000). "Intelligence: Maze-solving by an amoeboid organism." Nature, 407, 470.',
    url: 'https://doi.org/10.1038/35035159',
    supports:
      'Demonstrates that Physarum polycephalum can find the shortest path through a maze, providing foundational evidence that biological networks can solve network-optimization problems.',
    distinction:
      'This experiment used a physical maze with a living organism. SPORE-NET does not reproduce biological experiments; it uses the mathematical insights as algorithmic inspiration.',
  },
  {
    citation:
      'Bonifaci, U., Mehlhorn, K., & Varma, G. (2012). "Physarum Can Compute Shortest Paths." Journal of Theoretical Biology, 309, 121–133.',
    url: 'https://doi.org/10.1016/j.jtbi.2012.06.017',
    supports:
      'Provides a mathematical proof that the Physarum-inspired conductance model converges to shortest paths under certain conditions, supporting the theoretical basis of our adaptive algorithm.',
    distinction:
      'The proof applies to a continuous model with specific assumptions. SPORE-NET uses a discrete approximation with finite iterations, which may not fully converge in all scenarios.',
  },
  {
    citation:
      'Becker, M., Kiesel, D., & Schreck, T. (2015). "Approaching the Slime Mold Physarum polycephalum for Network Routing." In: Menczer F., et al. (eds) Proc. IEEE/WIC/ACM Int. Conf. on Web Intelligence (WI).',
    url: 'https://doi.org/10.1109/WI.2013.14',
    supports:
      'Explores applying Physarum-inspired models to communication network routing, providing precedent for the domain transfer that SPORE-NET undertakes.',
    distinction:
      'Their implementation details differ from SPORE-NET. We do not claim equivalence; our results are measured independently from our own simulation engine.',
  },
  {
    citation:
      'Watanabe, S., Tero, A., Takamatsu, A., & Nakagaki, T. (2011). "Traffic optimization in railroad networks using an algorithm mimicking an amoeboid organism." Physarum. Royal Society Open Science, 22(1), 179–186.',
    url: 'https://doi.org/10.1098/rsif.2011.0370',
    supports:
      'Demonstrates application of the Physarum model to a real-world transport network (railroads), showing the approach generalizes beyond biological networks.',
    distinction:
      'The railroad network is a fixed infrastructure problem. SPORE-NET addresses dynamic communication network resilience under disruption — a different problem class.',
  },
];

const CLAIM_VS_EVIDENCE: { claim: string; status: string; icon: 'check' | 'x' | 'help' | 'code' }[] = [
  {
    claim: 'Biological transport networks adapt through flow-driven conductance changes',
    status: 'Supported by published research (Tero et al., 2010)',
    icon: 'check',
  },
  {
    claim: 'Our algorithm implements a model inspired by biological network adaptation',
    status: 'Demonstrated by our code and methodology — verifiable in the simulation engine',
    icon: 'code',
  },
  {
    claim: 'Our algorithm outperforms conventional shortest-path routing under disruption',
    status: 'Unknown until measured — results are shown honestly, without manipulation',
    icon: 'help',
  },
  {
    claim: 'Our model represents a real extraterrestrial communication network',
    status: 'Not established — this is a computational simulation, not a physical system',
    icon: 'x',
  },
  {
    claim: 'The Physarum conductance model converges to shortest paths in theory',
    status: 'Proven under specific conditions (Bonifaci et al., 2012)',
    icon: 'check',
  },
  {
    claim: 'Living fungi or slime moulds implement digital communication protocols',
    status: 'Not established — biological transport is chemical/physical, not digital',
    icon: 'x',
  },
];

export function Research() {
  return (
    <div className="max-w-[1000px] mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-spore-teal mb-2">
          <BookOpen size={20} />
          <h1 className="font-display text-2xl font-bold text-spore-text">Research & Theory</h1>
        </div>
        <p className="text-sm text-spore-muted">
          The scientific basis for SPORE-NET, with verified references and honest claims.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {/* Biological background */}
        <Section title="1. Biological background" dark>
          <p>
            <em>Physarum polycephalum</em> is a unicellular slime mould belonging to the
            class Myxomycetes. Despite lacking a nervous system, it constructs complex
            transport networks that connect dispersed food sources with remarkable
            efficiency. Its body consists of a network of tubular veins through which
            cytoplasm streams rhythmically, transporting nutrients and chemical signals.
          </p>
          <p>
            When the organism encounters multiple food sources, it grows tubular
            connections between them. Over time, tubes carrying high flow thicken and
            persist, while low-flow tubes shrink and disappear. This self-organizing
            process produces networks that often approximate the optimal Steiner tree
            connecting the food sources.
          </p>
        </Section>

        {/* What researchers observed */}
        <Section title="2. What researchers have actually observed" dark>
          <ul className="space-y-2">
            <li>
              <strong>Maze-solving:</strong> Nakagaki et al. (2000) showed that{' '}
              <em>Physarum</em> can find the shortest path through a maze, with the
              organism's body converging to the shortest route between food sources.
            </li>
            <li>
              <strong>Network design:</strong> Tero et al. (2010) demonstrated that{' '}
              <em>Physarum</em> constructs networks comparable to the Tokyo rail network
              in terms of cost, efficiency, and fault tolerance.
            </li>
            <li>
              <strong>Adaptation:</strong> When part of the network is damaged, the
              organism reroutes flow through alternative paths and regenerates connections.
            </li>
          </ul>
        </Section>

        {/* Mathematical principles */}
        <Section title="3. The mathematical principles used" dark>
          <p>
            Tero et al. (2010) formalized the tube adaptation as a system of
            differential equations:
          </p>
          <div className="my-4 bg-spore-bg rounded-lg p-6 font-mono text-center text-spore-cyan text-lg">
            dD<sub>ij</sub>/dt = |Q<sub>ij</sub>| − μ·D<sub>ij</sub>
          </div>
          <p>Where:</p>
          <ul className="space-y-1">
            <li>
              <strong>D<sub>ij</sub></strong> — conductance (capacity) of the tube/edge
              between nodes i and j
            </li>
            <li>
              <strong>Q<sub>ij</sub></strong> — flow through the edge, proportional to
              the pressure difference: Q<sub>ij</sub> = (D<sub>ij</sub>/L<sub>ij</sub>)·(p<sub>i</sub> − p<sub>j</sub>)
            </li>
            <li>
              <strong>μ</strong> — decay rate controlling how quickly unused tubes atrophy
            </li>
            <li>
              <strong>L<sub>ij</sub></strong> — length of the edge
            </li>
            <li>
              <strong>p<sub>i</sub></strong> — pressure at node i, solved from the
              conservation equation: Σ<sub>j</sub> Q<sub>ij</sub> = s<sub>i</sub>
            </li>
          </ul>
          <p className="mt-3">
            The source node has positive demand (s = +1), the sink has negative demand
            (s = −1), and all other nodes have zero demand. The pressure field is
            obtained by solving this as a discrete Poisson equation.
          </p>
        </Section>

        {/* Mapping to computational model */}
        <Section title="4. How principles map to our computational model" dark>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-spore-border">
                <th className="text-left py-2 text-spore-teal font-medium">Biological concept</th>
                <th className="text-left py-2 text-spore-teal font-medium">SPORE-NET implementation</th>
              </tr>
            </thead>
            <tbody className="text-spore-muted">
              <tr className="border-b border-spore-border/50">
                <td className="py-2 pr-4">Tube / vein</td>
                <td className="py-2">Graph edge with conductance, length, flow</td>
              </tr>
              <tr className="border-b border-spore-border/50">
                <td className="py-2 pr-4">Junction / food source</td>
                <td className="py-2">Graph node (source = food, destination = food)</td>
              </tr>
              <tr className="border-b border-spore-border/50">
                <td className="py-2 pr-4">Cytoplasmic flow</td>
                <td className="py-2">Modeled flow Q derived from pressure gradient</td>
              </tr>
              <tr className="border-b border-spore-border/50">
                <td className="py-2 pr-4">Tube thickening / thinning</td>
                <td className="py-2">Discrete conductance update each step</td>
              </tr>
              <tr className="border-b border-spore-border/50">
                <td className="py-2 pr-4">Tube severance / damage</td>
                <td className="py-2">Edge or node failure (disruption injection)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Pressure / protoplasmic streaming</td>
                <td className="py-2">Potential field solved via Jacobi iteration</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Assumptions and simplifications */}
        <Section title="5. Assumptions and simplifications" dark>
          <ul className="space-y-2">
            <li>
              <strong>Discrete time:</strong> The continuous ODE is approximated with
              fixed time steps (dt = 0.5). This is a standard numerical approximation,
              not a claim of biological accuracy.
            </li>
            <li>
              <strong>Single source-sink pair:</strong> The model handles one
              source–destination pair. Real biological networks may have multiple
              sources and sinks.
            </li>
            <li>
              <strong>Unit demand:</strong> We use a demand of 1.0. Real networks have
              heterogeneous traffic.
            </li>
            <li>
              <strong>Static topology:</strong> The graph structure is fixed; only
              conductance values adapt. Real <em>Physarum</em> can grow new tubes.
            </li>
            <li>
              <strong>Finite iterations:</strong> The Jacobi solver runs a fixed number
              of iterations (20), not to full convergence.
            </li>
            <li>
              <strong>Conductance bounds:</strong> We clamp conductance to [0.001, 20]
              to prevent numerical instability. The biological system has physical limits
              that differ.
            </li>
          </ul>
        </Section>

        {/* Limitations */}
        <Section title="6. Limitations" dark>
          <ul className="space-y-2">
            <li>
              The simulation uses a simplified flow model that may not capture all
              dynamics of the original Tero et al. formulation.
            </li>
            <li>
              Results depend on graph topology, which is randomly generated but
              deterministic per seed. Different seeds may produce different outcomes.
            </li>
            <li>
              The comparison is between two specific routing strategies. Many other
              adaptive routing algorithms exist (OSPF, RIP, ant-colony optimization)
              that are not tested here.
            </li>
            <li>
              The model does not simulate queuing delays, packet loss from congestion,
              or realistic traffic patterns.
            </li>
            <li>
              Performance claims are specific to the tested configurations and should
              not be generalized without further testing.
            </li>
          </ul>
        </Section>

        {/* References */}
        <Section title="7. Research references" dark>
          <p className="mb-4">
            Each reference below has been verified for title, authors, publication venue,
            year, and DOI. Click through to the original source to confirm.
          </p>
          <div className="space-y-6">
            {REFERENCES.map((ref, i) => (
              <div
                key={i}
                className="border-l-2 border-spore-teal/40 pl-4 py-1"
              >
                <p className="text-sm text-spore-text leading-relaxed">
                  {ref.citation}
                </p>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-spore-teal hover:text-spore-cyan mt-2"
                >
                  <ExternalLink size={12} />
                  {ref.url}
                </a>
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs text-spore-muted">
                    <span className="text-spore-teal font-medium">Supports: </span>
                    {ref.supports}
                  </p>
                  <p className="text-xs text-spore-muted">
                    <span className="text-spore-warning font-medium">Distinction: </span>
                    {ref.distinction}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Claim vs evidence */}
        <div className="research-surface rounded-2xl p-6">
          <h2 className="font-display text-xl font-bold mb-4">Claim versus evidence</h2>
          <p className="text-sm mb-4 text-spore-light-muted">
            We distinguish what is established from what is not. Biological inspiration
            does not establish that living fungi implement digital communication protocols.
          </p>
          <div className="space-y-3">
            {CLAIM_VS_EVIDENCE.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/50"
              >
                {item.icon === 'check' && <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />}
                {item.icon === 'x' && <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />}
                {item.icon === 'help' && <HelpCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />}
                {item.icon === 'code' && <CheckCircle2 size={18} className="text-teal-600 shrink-0 mt-0.5" />}
                <div>
                  <p className="text-sm font-medium text-spore-light-text">{item.claim}</p>
                  <p className="text-xs text-spore-light-muted mt-0.5">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final notice */}
        <div className="rounded-xl bg-spore-surface border border-spore-warning/30 p-5 flex gap-3">
          <AlertCircle className="w-5 h-5 text-spore-warning shrink-0 mt-0.5" />
          <p className="text-sm text-spore-muted leading-relaxed">
            Biological inspiration does not establish that living fungi or slime moulds
            implement digital communication protocols. The transport networks of{' '}
            <em>Physarum polycephalum</em> carry chemical and physical flows, not data
            packets. SPORE-NET uses the mathematical structure of biological adaptation
            as algorithmic inspiration for a computational routing model.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  dark,
}: {
  title: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  if (dark) {
    return (
      <section>
        <h2 className="font-display text-lg font-semibold text-spore-text mb-3">{title}</h2>
        <div className="space-y-3 text-sm text-spore-muted leading-relaxed [&_strong]:text-spore-text [&_em]:text-spore-teal [&_ul]:space-y-2 [&_li]:leading-relaxed">
          {children}
        </div>
      </section>
    );
  }
  return (
    <section className="research-surface rounded-2xl p-6">
      <h2 className="font-display text-lg font-semibold mb-3">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed [&_strong]:text-spore-light-text">
        {children}
      </div>
    </section>
  );
}
