/**
 * Point d'entrée de l'application React.
 *
 * Configure React Query, le routeur et enregistre le Service Worker PWA.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { registerSW } from 'virtual:pwa-register'
import { toast } from 'react-toastify'
import { setQueryClient, startAutoSync } from './services/syncService'
import App from './App'

// Styles existants en base (héritage v1.9.16)
import './styles/index.css'
// Charte graphique — toujours en dernier pour prendre priorité
import './styles/variables.css'   // tokens design
import './styles/base.css'        // reset + typo
import './styles/layout.css'      // sidebar, header, grilles
import './styles/components.css'  // composants
import './styles/tc57.css'        // interface terminal TC57

// Enregistrement du Service Worker PWA (actif uniquement en production)
registerSW({
  onNeedRefresh() {
    toast.info('Une mise à jour est disponible — rechargez la page pour l\'installer.', {
      autoClose: false,
      closeOnClick: false,
      closeButton: true,
    })
  },
  onOfflineReady() {
    toast.success('Application prête pour une utilisation hors-ligne.', { autoClose: 4000 })
  },
})

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

// Injecter le queryClient dans le syncService pour invalider les caches après sync
setQueryClient(queryClient)

// Démarrer la sync automatique à la reconnexion
startAutoSync(({ synced, failed }) => {
  if (synced > 0 && failed === 0) {
    toast.success(`${synced} opération(s) synchronisée(s) avec succès.`)
  } else if (synced > 0 && failed > 0) {
    toast.warning(`${synced} synchronisée(s), ${failed} en erreur. Vérifiez le bouton de sync.`)
  }
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
