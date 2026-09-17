import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { UserProvider } from './context/UserContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import MealPlanner from './pages/MealPlanner';
import Schedule from './pages/Schedule';
import Profile from './pages/Profile';
import './index.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <UserProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="main-content">
            <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/workout" element={<Workout />} />
              <Route path="/meals" element={<MealPlanner />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
