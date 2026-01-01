import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

function Login() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState('worker')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role: selectedRole
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Giriş başarısız')
      }

      // Token'ı localStorage'a kaydet
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Role göre yönlendir
      const targetPath = data.user.role === 'admin' ? '/admin' : '/worker'
      navigate(targetPath)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-mark">
            <a href="https://karafibertekstil.com/" target="_blank" rel="noopener noreferrer" title="Kara Holding sitesine gitmek için bu logo linke basabilirsiniz">
              <img src={logo} alt="Kara Holding Logo" />
            </a>
          </div>
          <div className="brand-text">
            <h1>Kara Holding</h1>
            <p>Maaşlar, departmanlar, izinler — hepsi tek yerde.</p>
          </div>
        </div>

        <div className="role-toggle" data-active={selectedRole}>
          <button
            className={selectedRole === 'worker' ? 'active' : ''}
            onClick={() => setSelectedRole('worker')}
            type="button"
          >
            İşçi Girişi
          </button>
          <button
            className={selectedRole === 'admin' ? 'active' : ''}
            onClick={() => setSelectedRole('admin')}
            type="button"
          >
            Admin Girişi
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <div className="email-input-group">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault()
                    if (!email.includes('@')) {
                      setEmail(email + '@karaholding.com')
                    }
                  }
                }}
                placeholder="kullaniciadi"
                required
              />
              {email && !email.includes('@') && (
                <div className="email-suggestion-container">
                  <span className="email-suggestion">{email}@karaholding.com</span>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>

      <div className="hero">
        <div className="hero-text">
          <div className="hero-logo">
            <a href="https://karafibertekstil.com/" target="_blank" rel="noopener noreferrer" title="Kara Holding sitesine gitmek için bu logo linke basabilirsiniz">
              <img src={logo} alt="Kara Holding Logo" />
              <span className="click-hint">Tıklayın</span>
            </a>
          </div>
          <h2>Takımınızı akıllıca yönetin.</h2>
          <p>Maaşlar, departmanlar, izinler — hepsi tek yerde.</p>
        </div>
      </div>
    </div>
  )
}

export default Login 