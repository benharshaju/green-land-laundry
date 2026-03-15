import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DevLayout from './components/Developer/DevLayout';
import DevDashboard from './pages/Developer/Dashboard';
import SystemHealth from './pages/Developer/SystemHealth';
import AiImages from './pages/Developer/AiImages';
import Logs from './pages/Developer/Logs';

const DevApp = () => (
    <BrowserRouter basename="/developer">
        <DevLayout>
            <Routes>
                <Route path="/dashboard" element={<DevDashboard />} />
                <Route path="/system-health" element={<SystemHealth />} />
                <Route path="/ai-images" element={<AiImages />} />
                <Route path="/logs" element={<Logs />} />
            </Routes>
        </DevLayout>
    </BrowserRouter>
);

const el = document.getElementById('developer-app');
if (el) createRoot(el).render(<DevApp />);
