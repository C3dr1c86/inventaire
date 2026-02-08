/**
 * Composant Loader - Indicateur de chargement animé.
 *
 * Affiche une animation de chargement élégante et responsive.
 */

function Loader({ size = 'medium', text = 'Chargement...' }) {
  const sizes = {
    small: '24px',
    medium: '40px',
    large: '60px'
  }

  const spinnerSize = sizes[size] || sizes.medium

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      padding: '2rem'
    }}>
      <div
        className="spinner"
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      {text && (
        <p style={{
          color: '#6c757d',
          fontSize: '0.95rem',
          margin: 0
        }}>
          {text}
        </p>
      )}
    </div>
  )
}

export default Loader
