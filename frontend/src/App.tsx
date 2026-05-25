import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Sites from './pages/Sites'
import SiteDetail from './pages/SiteDetail'
import Settings from './pages/Settings'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sites" element={<Sites />} />
        <Route path="/sites/:id" element={<SiteDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={
          <div className="text-center py-20 text-[#7a7a8a]">
            <h2 className="text-xl font-bold text-white mb-2">404</h2>
            <p>Page not found</p>
          </div>
        } />
      </Routes>
    </Layout>
  )
}

export default App
