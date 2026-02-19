/**
 * Point d'entrée de l'application React.
 *
 * Configure React Query et le routeur.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

// Styles existants en base (héritage v1.9.16)
import './styles/index.css'
// Charte graphique — toujours en dernier pour prendre priorité
import './styles/variables.css'   // tokens design
import './styles/base.css'        // reset + typo
import './styles/layout.css'      // sidebar, header, grilles
import './styles/components.css'  // composants

// Configuration de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
