import { Microscope } from 'lucide-react';

export function Methodology() {
  return (
    <div className="max-w-[1000px] mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-spore-teal mb-2">
          <Microscope size={20} />
          <h1 className="font-display text-2xl font-bold text-spore-text">Methodology</h1>
        </div>
        <p className="text-sm text-spore-muted">
          How SPORE-NET runs experiments, explained in plain English and technical terms.
        </p>
      </div>

      <div className="space-y-8">
        {/* Graph representation */}
        <MethodSection title="Graph representation">
          <p>
            The network is modeled as a weighted undirected graph G = (V, E), where V is
            the set of nodes and E is the set of edges. Each node represents a network
            router or junction. Each edge represents a communication link between two nodes.
          </p>
          <p>
            Every edge stores four key properties: <strong>conductance</strong> (D),
            <strong> length</strong> (L, the base transmission cost),
            <strong> flow</strong> (Q, the modeled flow), and
            <strong> operational status</strong> (whether the edge is functional).
          </p>
        </MethodSection>

        {/* Node and edge generation */}
        <MethodSection title="Node and edge generation">
          <p>
            Nodes are placed at random positions on a unit square using a seeded
            pseudo-random number generator (mulberry32). The same seed always produces
            the same node positions, ensuring reproducibility.
          </p>
          <p>
            Edge generation has two stages:
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>
              A minimum spanning tree (Prim's algorithm) guarantees the network starts
              fully connected.
            </li>
            <li>
              Additional geometric edges are added between nodes within a radius chosen
              so that the average node degree approximately matches the target density:
              sparse (~2.2), balanced (~3.5), or dense (~5.5).
            </li>
          </ol>
          <p>
            Initial conductance is set to 1/(L + 0.01), so shorter edges start with
            higher conductance.
          </p>
        </MethodSection>

        {/* Conductance and flow equations */}
        <MethodSection title="Conductance and flow equations">
          <p>The adaptive algorithm uses the Physarum-inspired update rule:</p>
          <div className="my-3 bg-spore-bg rounded-lg p-5 font-mono text-center text-spore-cyan text-base">
            D<sub>ij</sub>(t+1) = D<sub>ij</sub>(t) + dt · (|Q<sub>ij</sub>| − μ · D<sub>ij</sub>(t))
          </div>
          <p>Flow is derived from the pressure (potential) field:</p>
          <div className="my-3 bg-spore-bg rounded-lg p-5 font-mono text-center text-spore-cyan text-base">
            Q<sub>ij</sub> = (D<sub>ij</sub> / L<sub>ij</sub>) · (p<sub>i</sub> − p<sub>j</sub>)
          </div>
          <p>The pressure field is solved from the conservation equation:</p>
          <div className="my-3 bg-spore-bg rounded-lg p-5 font-mono text-center text-spore-cyan text-base">
            Σ<sub>j</sub> (D<sub>ij</sub>/L<sub>ij</sub>)(p<sub>i</sub> − p<sub>j</sub>) = s<sub>i</sub>
          </div>
          <p>
            Where s<sub>i</sub> = +1 at the source, −1 at the destination, and 0
            elsewhere. This is a discrete Poisson equation solved iteratively using the
            Jacobi method (20 iterations per step).
          </p>
          <p>
            <strong>Parameters:</strong> μ = 0.15, dt = 0.5, minimum conductance = 0.001,
            maximum conductance = 20. These bounds prevent numerical instability while
            allowing meaningful adaptation.
          </p>
        </MethodSection>

        {/* Routing algorithms */}
        <MethodSection title="Routing algorithms">
          <h3 className="font-semibold text-spore-text text-sm mb-2">
            Conventional baseline — Dijkstra's shortest path
          </h3>
          <p>
            Uses Dijkstra's algorithm with a binary-heap priority queue. Edge weight =
            L/D (length divided by conductance), representing transmission cost. Failed
            nodes and edges are excluded from the search. This is a deterministic,
            well-established algorithm that serves as a fair baseline.
          </p>

          <h3 className="font-semibold text-spore-text text-sm mb-2 mt-4">
            Bio-inspired adaptive — Physarum conductance routing
          </h3>
          <p>
            At each step, the algorithm:
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Solves the pressure field using Jacobi iteration</li>
            <li>Computes flow on each edge from the pressure gradient</li>
            <li>Updates conductance using the Physarum rule</li>
            <li>Finds the route using conductance-weighted shortest path (preferring high-conductance edges)</li>
          </ol>
          <p>
            The key difference from the baseline: after a disruption, the adaptive
            algorithm redistributes conductance based on actual flow patterns, which
            may open alternative routes that the static shortest-path approach cannot
            discover.
          </p>
        </MethodSection>

        {/* Failure injection */}
        <MethodSection title="Failure-injection method">
          <p>
            Disruptions are applied after the initial network is generated and cloned
            for each strategy. Both clones receive the identical disruption, ensuring a
            fair comparison.
          </p>
          <ul className="space-y-1 ml-2">
            <li>
              <strong>Node failure:</strong> A percentage of non-source/destination
              nodes are marked as failed, disabling all their edges.
            </li>
            <li>
              <strong>Connection failure:</strong> A percentage of edges are marked as
              failed, setting their conductance to zero.
            </li>
            <li>
              <strong>Increased cost:</strong> Selected edges have their length
              increased (and conductance decreased) by a factor proportional to severity.
            </li>
            <li>
              <strong>Multiple failures:</strong> Combines node and edge failures.
            </li>
          </ul>
          <p>
            A separate disruption random seed controls which nodes/edges are affected,
            independent of the graph generation seed.
          </p>
        </MethodSection>

        {/* Random seed and reproducibility */}
        <MethodSection title="Random seed and reproducibility">
          <p>
            The simulation uses two seeds: the <strong>graph seed</strong> (determines
            node positions and edge topology) and the <strong>disruption seed</strong>
            (determines which nodes/edges are disrupted). The same pair of seeds with
            the same configuration always produces the same experiment. This is essential
            for scientific reproducibility.
          </p>
        </MethodSection>

        {/* Metrics and formulas */}
        <MethodSection title="Metrics and formulas">
          <div className="space-y-3">
            <Metric
              name="Packet delivery rate"
              formula="delivered / attempted"
              description="Fraction of packets that reach the destination. 1.0 = all delivered, 0 = none."
            />
            <Metric
              name="Average route cost"
              formula="Σ(L_ij / D_ij) for edges in path"
              description="Total transmission cost along the route. Lower is better."
            />
            <Metric
              name="Average hop count"
              formula="|path| − 1"
              description="Number of edges traversed from source to destination."
            />
            <Metric
              name="Connected components"
              formula="Count of disconnected subgraphs"
              description="Number of isolated network segments. 1 = fully connected."
            />
            <Metric
              name="Total conductance"
              formula="Σ D_ij for all operational edges"
              description="Sum of all edge conductances. Higher indicates more network capacity."
            />
            <Metric
              name="Recovery step"
              formula="First step where delivery rate ≥ pre-disruption rate"
              description="When the adaptive algorithm restores delivery to the pre-disruption level. null = no recovery."
            />
          </div>
        </MethodSection>

        {/* Experimental controls */}
        <MethodSection title="Experimental controls">
          <ul className="space-y-1 ml-2">
            <li>Both strategies start from the identical graph (deep-cloned).</li>
            <li>The same disruption is applied to both copies.</li>
            <li>The same packet demand and source/destination are used.</li>
            <li>The same number of simulation steps are run.</li>
            <li>Results are not averaged or cherry-picked — each run is reported individually.</li>
          </ul>
        </MethodSection>

        {/* Reproduction */}
        <MethodSection title="How to reproduce an experiment">
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Note the configuration: node count, density, seed, source, destination, packets, disruption type, severity, and disruption seed.</li>
            <li>Enter these values in the Run Simulation page.</li>
            <li>Click "Run Simulation".</li>
            <li>The same configuration will produce the same results every time.</li>
            <li>Save the experiment to persist it for later comparison.</li>
          </ol>
        </MethodSection>

        {/* Example */}
        <div className="research-surface rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold mb-3">Example experiment</h2>
          <p className="text-xs text-amber-600 mb-3 font-medium">
            Illustrative — numbers shown are from a typical run, not guaranteed values.
          </p>
          <div className="bg-white/60 rounded-lg p-4 font-mono text-xs space-y-2 text-spore-light-text">
            <div>Nodes: 40 | Density: balanced | Seed: 42</div>
            <div>Source: 0 → Destination: 39</div>
            <div>Packets: 100</div>
            <div>Disruption: connection-failure, 30% severity, seed 100</div>
            <div className="pt-2 border-t border-spore-light-muted/20">
              Expected: ~30% of edges fail. The conventional strategy may lose
              connectivity if the shortest path is severed. The adaptive strategy
              redistributes conductance, potentially finding alternative routes.
            </div>
          </div>
          <p className="text-xs mt-3 text-spore-light-muted">
            What it measures: whether conductance-based adaptation can recover packet
            delivery after link failures, compared to static shortest-path rerouting.
            The actual outcome depends on the specific topology and disruption — run
            the experiment to see.
          </p>
        </div>
      </div>
    </div>
  );
}

function MethodSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-spore-text mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-spore-muted leading-relaxed [&_strong]:text-spore-text [&_em]:text-spore-teal [&_ol]:space-y-1 [&_ul]:space-y-1 [&_li]:leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Metric({ name, formula, description }: { name: string; formula: string; description: string }) {
  return (
    <div className="border-l-2 border-spore-teal/40 pl-3">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <span className="text-spore-text font-medium text-sm">{name}</span>
        <code className="text-xs text-spore-cyan font-mono bg-spore-bg/50 px-2 py-0.5 rounded">{formula}</code>
      </div>
      <p className="text-xs text-spore-muted mt-1">{description}</p>
    </div>
  );
}
