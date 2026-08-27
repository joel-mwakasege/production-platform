import { PreviewDashboard } from './components/PreviewDashboard'
import './App.css'

function App() {
  // BYPASS: Instantly return the local preview dashboard, skipping all Auth and API calls
  return <PreviewDashboard />
}

export default App