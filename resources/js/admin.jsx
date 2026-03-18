import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/Admin/AdminLayout';
import Dashboard from './pages/Admin/Dashboard';
import Orders from './pages/Admin/Orders';
import OrderForm from './pages/Admin/OrderForm';
import Customers from './pages/Admin/Customers';
import Services from './pages/Admin/Services';
import Invoices from './pages/Admin/Invoices';
import Reports from './pages/Admin/Reports';
import Machines from './pages/Admin/Machines';

const AdminApp = () => (
    <BrowserRouter basename="/admin">
        <AdminLayout>
            <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/create" element={<OrderForm />} />
                <Route path="/orders/:id/edit" element={<OrderForm />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/services" element={<Services />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/machines" element={<Machines />} />
            </Routes>
        </AdminLayout>
    </BrowserRouter>
);

const el = document.getElementById('admin-app');
if (el) {
    createRoot(el).render(<AdminApp />);
}
