import React from 'react';
import {createRoot} from 'react-dom/client';
import LearningApp from '../components/LearningApp';
import {Account} from './Account';
import './globals.css';
import './discovery.css';
import 'katex/dist/katex.min.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode>{location.pathname==='/account'||location.pathname==='/oauth/consent'?<Account/>:<LearningApp/>}</React.StrictMode>);
