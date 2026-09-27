import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Repository from './pages/Repository'
import Findings from './pages/Findings'
import Security from './pages/Security'
import Testing from './pages/Testing'
import Agents from './pages/Agents'
import Fixes from './pages/Fixes'
import Validation from './pages/Validation'
import Reports from './pages/Reports'
import { AnalysisProvider } from './context/AnalysisContext'

export default function App() {
  return (
    <AnalysisProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/repository" element={<Repository />} />
          <Route path="/findings" element={<Findings />} />
          <Route path="/security" element={<Security />} />
          <Route path="/testing" element={<Testing />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/fixes" element={<Fixes />} />
          <Route path="/validation" element={<Validation />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </AnalysisProvider>
  )
}
