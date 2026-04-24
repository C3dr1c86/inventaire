import { useNavigate } from 'react-router-dom'
import { ScanLine, ArrowRightLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import TC57Layout from '../../components/layout/TC57Layout'
import { getArticles } from '../../services/articleService'

function TC57Home() {
  const navigate = useNavigate()

  const { data: stockBas } = useQuery({
    queryKey: ['tc57-stock-bas'],
    queryFn: () => getArticles({ stock_bas: true, limit: 1 }),
  })

  return (
    <TC57Layout title="Gestion de stock" showBack={false}>
      <div className="tc57-home">
        {stockBas?.total > 0 && (
          <div className="tc57-alert-banner">
            ⚠️ {stockBas.total} article{stockBas.total > 1 ? 's' : ''} en stock bas
          </div>
        )}

        <button
          className="tc57-action-card tc57-action-scan"
          onClick={() => navigate('/tc57/scan')}
        >
          <ScanLine size={52} />
          <span className="tc57-action-label">Scanner</span>
          <span className="tc57-action-sublabel">Article · Emplacement</span>
        </button>

        <button
          className="tc57-action-card tc57-action-mouvement"
          onClick={() => navigate('/tc57/scan')}
        >
          <ArrowRightLeft size={52} />
          <span className="tc57-action-label">Mouvement</span>
          <span className="tc57-action-sublabel">Entrée · Sortie de stock</span>
        </button>
      </div>
    </TC57Layout>
  )
}

export default TC57Home
