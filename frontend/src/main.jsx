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

// Charte graphique — ordre d'import obligatoire
import './styles/variables.css'   // 1. Tokens design (couleurs, typo, espacements)
import './styles/base.css'        // 2. Reset + typographie + utilitaires
import './styles/layout.css'      // 3. Sidebar, Header, grilles, responsive
import './styles/components.css'  // 4. Composants réutilisables
import './styles/index.css'       // 5. Styles existants (surcharges temporaires pendant migration)

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
