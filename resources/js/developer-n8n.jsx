import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DevLayout from './components/Developer/DevLayout';
import N8nWorkflows from './pages/Developer/N8nWorkflows';

const N8nApp = () => (
    <BrowserRouter basename="/developer">
        <DevLayout>
            <Routes>
                <Route path="/n8n" element={<N8nWorkflows />} />
            </Routes>
        </DevLayout>
    </BrowserRouter>
);

const el = document.getElementById('developer-n8n-app');
if (el) createRoot(el).render(<N8nApp />);
