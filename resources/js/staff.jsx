import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StaffLayout from './components/Staff/StaffLayout';
import StaffDashboard from './pages/Staff/Dashboard';
import StaffOrders from './pages/Staff/Orders';

const StaffApp = () => (
    <BrowserRouter basename="/staff">
        <StaffLayout>
            <Routes>
                <Route path="/dashboard" element={<StaffDashboard />} />
                <Route path="/orders" element={<StaffOrders />} />
            </Routes>
        </StaffLayout>
    </BrowserRouter>
);

const el = document.getElementById('staff-app');
if (el) createRoot(el).render(<StaffApp />);
