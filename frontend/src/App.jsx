import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import ReadinessSummary from './pages/ReadinessSummary';
import NextAction from './pages/NextAction';
import InteractionDetail from './pages/InteractionDetail';
import LiveSupport from './pages/LiveSupport';
import Reflection from './pages/Reflection';
import AnchorsTab from './pages/AnchorsTab';
import ThisWeek from './pages/ThisWeek';
import Support from './pages/Support';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/readiness" element={<ReadinessSummary />} />
          <Route path="/action" element={<NextAction />} />
          <Route path="/interaction" element={<InteractionDetail />} />
          <Route path="/live" element={<LiveSupport />} />
          <Route path="/reflect" element={<Reflection />} />
          <Route path="/anchors" element={<AnchorsTab />} />
          <Route path="/week" element={<ThisWeek />} />
          <Route path="/support" element={<Support />} />
        </Route>
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
