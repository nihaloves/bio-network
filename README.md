# SPORE-NET: A Bio-Inspired Network Resilience Simulator

**Inspired by Nature. Designed to Explore Network Resilience.**

## Team Details

**Team Name:** TanjiroKurama

**Team Members:**
- Niharika K Thilak
- Thejus R Menon

**Live Demo:** https://spore-net-adaptive-n-3qc1.bolt.host/

---

## 1. Overview

SPORE-NET is a web-based network simulation platform inspired by the adaptive transport networks of *Physarum polycephalum*, commonly known as slime mould. The project explores how biologically inspired adaptation principles can be applied to computer network routing to investigate resilience under changing traffic conditions and connection failures.

By comparing bio-inspired adaptive routing with conventional shortest-path routing, SPORE-NET provides an interactive environment for studying network performance, connectivity, and recovery during simulated disruptions.

## 2. Problem Statement

Computer networks operate in dynamic environments where link failures and changing traffic conditions can disrupt communication. Conventional shortest-path routing provides efficient routes under given conditions, but disruptions may require routes to be recalculated.

There is a need to explore adaptive routing strategies that can respond to network changes and potentially improve resilience.

## 3. Proposed Solution

SPORE-NET applies computational principles inspired by the way slime mould networks adapt their transport pathways. The simulator models network connections and investigates how their relative importance can change in response to simulated traffic and disruptions.

The project compares the behavior of this bio-inspired approach with a conventional shortest-path baseline, allowing users to examine the trade-offs between routing efficiency and network resilience.

## 4. Scientific Foundation

The project draws inspiration from research on biologically inspired adaptive network design, particularly the work of Tero et al. (2010).

In the proposed computational approach, connections that carry greater simulated flow can be assigned greater conductance, while conductance can decrease over time. This provides a simplified mathematical model for exploring adaptive network structures.

The model is inspired by biological principles; it does not claim to reproduce every aspect of a living slime mould.

**Research reference:**

Tero, A., et al. (2010). *Rules for Biologically Inspired Adaptive Network Design.* Science, 327(5964), 439–442.

[Read the research paper](https://doi.org/10.1126/science.1177894)

## 5. Objectives

- Explore bio-inspired adaptive routing in computer networks.
- Simulate network disruptions and changing conditions.
- Compare adaptive routing with conventional shortest-path routing.
- Observe changes in network connectivity and performance.
- Investigate the potential of nature-inspired algorithms for resilient network design.

## 6. Key Features

- **Interactive Simulation:** Explore a computer network through a visual interface.
- **Network Disruptions:** Examine network behavior under simulated link failures.
- **Adaptive Routing Model:** Investigate routing inspired by biological transport networks.
- **Baseline Comparison:** Compare routing strategies under equivalent simulation conditions.
- **Performance Evaluation:** Examine available network metrics to understand routing behavior.
- **Configurable Experiments:** Test different simulation conditions where supported by the application.

## 7. Methodology

1. **Network Generation:** Represent a computer network as interconnected nodes and links.
2. **Traffic Simulation:** Model communication flows between selected nodes.
3. **Routing:** Apply the selected routing strategy to determine communication paths.
4. **Disruption:** Introduce simulated link failures or other supported changes.
5. **Adaptation:** Update connection conductance according to the bio-inspired model.
6. **Comparison:** Evaluate the resulting network behavior against the conventional routing baseline.

This workflow enables controlled experiments into how routing strategies respond to changing network conditions.

## 8. Technology Stack

- **Frontend:** React, TypeScript, Vite
- **Development and Deployment:** Bolt

Additional libraries, algorithms, and backend technologies should be listed according to the final implementation.

## 9. Applications and Potential Impact

SPORE-NET explores concepts relevant to:

- Fault-tolerant communication networks
- Adaptive routing algorithms
- Distributed systems research
- Network design for dynamic environments
- Bio-inspired computing and algorithm development

These are potential research applications; further testing is required to establish real-world performance benefits.

## 10. Future Enhancements

- Introduce additional network topologies and failure scenarios.
- Expand routing performance metrics.
- Add repeatable experiments using configurable random seeds.
- Compare performance across different network sizes and traffic loads.
- Investigate hybrid routing strategies combining conventional and bio-inspired approaches.

## 11. Conclusion

SPORE-NET brings together biological inspiration, computational modelling, and network simulation to investigate an important engineering question: can adaptive principles inspired by nature help us design more resilient computer networks?

By enabling visual experimentation and comparative analysis, the project provides a foundation for further exploration of bio-inspired network design.

---

**SPORE-NET | Team TanjiroKurama**

*Exploring the connection between biological adaptation and network resilience.*
