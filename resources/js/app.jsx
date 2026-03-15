import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';

// Public/shared app entry point
const el = document.getElementById('app');
if (el) {
    createRoot(el).render(<div>Green Land Laundry</div>);
}
