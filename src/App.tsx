import { useState } from 'react';
import { Layout, type Page } from '@/components/Layout';
import { Overview } from '@/components/Overview';
import { Simulation } from '@/components/Simulation';
import { Results } from '@/components/Results';
import { Research } from '@/components/Research';
import { Methodology } from '@/components/Methodology';

function App() {
  const [page, setPage] = useState<Page>('overview');

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {page === 'overview' && <Overview onNavigate={setPage} />}
      {page === 'simulation' && <Simulation />}
      {page === 'results' && <Results />}
      {page === 'research' && <Research />}
      {page === 'methodology' && <Methodology />}
    </Layout>
  );
}

export default App;
