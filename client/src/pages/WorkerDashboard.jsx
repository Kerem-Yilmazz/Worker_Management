import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

function WorkerDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('announcements')
  const [announcements, setAnnouncements] = useState([])
  const [leaves, setLeaves] = useState([])
  const [shifts, setShifts] = useState([])

  const [creatingLeave, setCreatingLeave] = useState(false)
  const [creatingRequest, setCreatingRequest] = useState(false)
  const [requests, setRequests] = useState([])
  const [unreadReplies, setUnreadReplies] = useState(0)
  const [unreadLeaveDecisions, setUnreadLeaveDecisions] = useState(0)
  const [openOffers, setOpenOffers] = useState([])
  const [unreadOpenOffers, setUnreadOpenOffers] = useState(0)
  const [acceptedOffers, setAcceptedOffers] = useState([])
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', type: 'annual', reason: '' })
  const [requestForm, setRequestForm] = useState({ title: '', message: '' })
  const [showSidebar, setShowSidebar] = useState(false)
  const token = localStorage.getItem('token')

  async function api(path, options = {}) {
    const currentToken = localStorage.getItem('token')
    const res = await fetch(`http://localhost:5000${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
        ...(options.headers || {}),
      },
    })
    if (!res.ok) {
      let message = 'İşlem başarısız'
      try {
        const data = await res.clone().json()
        message = data.message || message
      } catch (_) {
        try {
          const text = await res.clone().text()
          if (text) message = text
        } catch (_) {}
      }
      throw new Error(message)
    }
    return res.json()
  }

  useEffect(() => {
    if (!token) return
    
    // localStorage'dan kabul edilen teklifleri yükle
    const savedAcceptedOffers = localStorage.getItem('acceptedOffers')
    if (savedAcceptedOffers) {
      try {
        setAcceptedOffers(JSON.parse(savedAcceptedOffers))
      } catch (e) {
        console.error('Saved accepted offers parse error:', e)
      }
    }
    

    
    ;(async () => {
      const results = await Promise.allSettled([
        api('/api/announcements'),
        api('/api/leaves/me'),
        api('/api/shifts'),
        api('/api/requests'),
        api('/api/overtime/offers/open'),
        api('/api/overtime/offers/accepted')
      ])

      if (results[0].status === 'fulfilled') {
        setAnnouncements(results[0].value)
      } else {
        console.error('Announcements fetch failed:', results[0].reason)
      }

      if (results[1].status === 'fulfilled') {
        const list = results[1].value
        setLeaves(list)
        const lastSeenLeaves = parseInt(localStorage.getItem('leavesLastSeenAt') || '0', 10)
        const unreadLeaves = list.filter(l => l.status !== 'pending' && l.decisionAt && new Date(l.decisionAt).getTime() > lastSeenLeaves).length
        setUnreadLeaveDecisions(unreadLeaves)
      }
      if (results[2].status === 'fulfilled') setShifts(results[2].value)
      if (results[3].status === 'fulfilled') {
        const list = results[4].value
        setRequests(list)
        // Yeni yanıt bildirimi: son görülme zamanından yeni olan yanıtları say
        const lastSeen = parseInt(localStorage.getItem('requestsLastSeenAt') || '0', 10)
        const unread = list.filter(r => r.respondedAt && new Date(r.respondedAt).getTime() > lastSeen).length
        setUnreadReplies(unread)
      }
      if (results[4] && results[4].status === 'fulfilled') {
        const list = results[4].value
        setOpenOffers(list)
        const lastSeenOffers = parseInt(localStorage.getItem('overtimeOffersLastSeenAt') || '0', 10)
        const unread = list.filter(o => o.createdAt && new Date(o.createdAt).getTime() > lastSeenOffers).length
        setUnreadOpenOffers(unread)
      }
      
      if (results[5] && results[5].status === 'fulfilled') {
        const acceptedData = results[5].value
        setAcceptedOffers(acceptedData)
        // localStorage'a kaydet
        localStorage.setItem('acceptedOffers', JSON.stringify(acceptedData))
      }
    })()
  }, [token])

  // Sayfa yüklendiğinde localStorage'dan verileri yükle
  useEffect(() => {
    if (token) {
      // localStorage'dan kabul edilen teklifleri yükle
      const savedAcceptedOffers = localStorage.getItem('acceptedOffers')
      if (savedAcceptedOffers) {
        try {
          setAcceptedOffers(JSON.parse(savedAcceptedOffers))
        } catch (e) {
          console.error('Saved accepted offers parse error:', e)
        }
      }
      

    }
  }, []) // Sadece bir kez çalışsın

  async function submitLeave(e) {
    e.preventDefault()
    setCreatingLeave(true)
    try {
      // Basit istemci doğrulaması: 14 gün sınırı
      const start = new Date(leaveForm.startDate)
      const end = new Date(leaveForm.endDate)
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Geçersiz tarih')
      }
      if (end < start) {
        throw new Error('Bitiş tarihi başlangıç tarihinden önce olamaz')
      }
      const oneDayMs = 24 * 60 * 60 * 1000
      const days = Math.floor((new Date(end.getFullYear(), end.getMonth(), end.getDate()) - new Date(start.getFullYear(), start.getMonth(), start.getDate())) / oneDayMs) + 1
      if (days > 14) {
        throw new Error('İzin süresi en fazla 14 gün olabilir')
      }
      const created = await api('/api/leaves', { method: 'POST', body: JSON.stringify(leaveForm) })
      setLeaves((prev) => [created, ...prev])
      setLeaveForm({ startDate: '', endDate: '', type: 'annual', reason: '' })
      setActiveTab('leaves')
    } catch (e) {
      alert(e.message)
    } finally {
      setCreatingLeave(false)
    }
  }

  async function submitRequest(e) {
    e.preventDefault()
    setCreatingRequest(true)
    try {
      const created = await api('/api/requests', { method: 'POST', body: JSON.stringify(requestForm) })
      setRequests((prev) => [created, ...prev])
      setRequestForm({ title: '', message: '' })
      setActiveTab('request')
    } catch (e) {
      alert(e.message)
    } finally {
      setCreatingRequest(false)
    }
  }

  // Kabul edilen tekliflerden toplam saat hesaplama
  const totalAcceptedHours = useMemo(() => {
    if (!acceptedOffers || acceptedOffers.length === 0) return 0
    return acceptedOffers.reduce((total, offer) => total + offer.hoursRequired, 0)
  }, [acceptedOffers])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="hamburger-btn"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              ☰
            </button>
            <img src={logo} alt="Kara Holding Logo" className="header-logo" />
      <h1>İşçi Paneli</h1>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </div>

      {showSidebar && (
        <div className="sidebar-overlay" onClick={() => setShowSidebar(false)}>
          <div className="sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header">
              <h3>Menü</h3>
              <button 
                className="close-sidebar-btn"
                onClick={() => setShowSidebar(false)}
              >
                ✕
              </button>
            </div>
            <nav className="sidebar-nav">
              <button 
                className="sidebar-nav-item"
                onClick={() => {
                  setShowSidebar(false)
                  setActiveTab('announcements')
                }}
              >
                📢 Duyurular
              </button>
              <button 
                className="sidebar-nav-item"
                onClick={() => {
                  setShowSidebar(false)
                  setActiveTab('shifts')
                  
                  // localStorage'dan kabul edilen teklifleri yükle
                  const savedAcceptedOffers = localStorage.getItem('acceptedOffers')
                  if (savedAcceptedOffers) {
                    try {
                      setAcceptedOffers(JSON.parse(savedAcceptedOffers))
                    } catch (e) {
                      console.error('Saved accepted offers parse error:', e)
                    }
                  }
                  
                  // localStorage'dan monthly overtime'ı yükle
                  const savedMonthlyOvertime = localStorage.getItem('monthlyOvertime')
                  if (savedMonthlyOvertime) {
                    try {
                      setMonthlyOvertime(JSON.parse(savedMonthlyOvertime))
                    } catch (e) {
                      console.error('Saved monthly overtime parse error:', e)
                    }
                  }
                }}
              >
                ⏰ Vardiyalar
              </button>
              <button 
                className="sidebar-nav-item"
                onClick={() => {
                  setShowSidebar(false)
                  setActiveTab('leaves')
                  setUnreadLeaveDecisions(0)
                  localStorage.setItem('leavesLastSeenAt', String(Date.now()))
                }}
              >
                🏖️ İzinler {unreadLeaveDecisions > 0 && <span className="badge">{unreadLeaveDecisions}</span>}
              </button>
              <button 
                className="sidebar-nav-item"
                onClick={() => {
                  setShowSidebar(false)
                  setActiveTab('request')
                }}
              >
                💬 Talepler
              </button>
            </nav>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        <div className="stats-section">
          <div className="stat-card">
            <h3>Bu Ay Fazla Mesai</h3>
            <p className="stat-number">{acceptedOffers?.reduce((sum, offer) => sum + (offer.hoursRequired || 0), 0) || 0} saat</p>
            <div style={{fontSize: '12px', opacity: '0.7', marginTop: '4px'}}>
              <p>📋 Kabul edilen tekliflerden: {acceptedOffers?.reduce((sum, offer) => sum + (offer.hoursRequired || 0), 0) || 0} saat</p>
            </div>
          </div>
          <div className="stat-card">
            <h3>Bekleyen İzin</h3>
            <p className="stat-number">{leaves.filter(l => l.status === 'pending').length}</p>
          </div>
          <div className="stat-card">
            <h3>Açık Talepler</h3>
            <p className="stat-number">{requests.filter(r => r.status === 'open').length}</p>
          </div>
        </div>

        <div className="content-tabs">
          <div className="tabs">
            <button 
              className={activeTab === 'announcements' ? 'active' : ''} 
              onClick={() => setActiveTab('announcements')}
            >
              📢 Duyurular
            </button>
            <button 
              className={activeTab === 'shifts' ? 'active' : ''} 
                              onClick={() => { 
                  setActiveTab('shifts'); 
                  setUnreadOpenOffers(0); 
                  localStorage.setItem('overtimeOffersLastSeenAt', String(Date.now()));
                  
                  // localStorage'dan kabul edilen teklifleri yükle
                  const savedAcceptedOffers = localStorage.getItem('acceptedOffers')
                  if (savedAcceptedOffers) {
                    try {
                      setAcceptedOffers(JSON.parse(savedAcceptedOffers))
                    } catch (e) {
                      console.error('Saved accepted offers parse error:', e)
                    }
                  }
                  
                  // localStorage'dan monthly overtime'ı yükle
                  const savedMonthlyOvertime = localStorage.getItem('monthlyOvertime')
                  if (savedMonthlyOvertime) {
                    try {
                      setMonthlyOvertime(JSON.parse(savedMonthlyOvertime))
                    } catch (e) {
                      console.error('Saved monthly overtime parse error:', e)
                    }
                  }
                }}
            >
              ⏰ Vardiyalar {unreadOpenOffers > 0 && <span className="badge">{unreadOpenOffers}</span>}
            </button>
            <button 
              className={activeTab === 'leaves' ? 'active' : ''} 
              onClick={() => { 
                setActiveTab('leaves'); 
                setUnreadLeaveDecisions(0);
                localStorage.setItem('leavesLastSeenAt', String(Date.now()));
              }}
            >
              🏖️ İzinler {unreadLeaveDecisions > 0 && <span className="badge">{unreadLeaveDecisions}</span>}
            </button>
            <button 
              className={activeTab === 'request' ? 'active' : ''} 
              onClick={() => { 
                setActiveTab('request'); 
                setUnreadReplies(0);
                localStorage.setItem('requestsLastSeenAt', String(Date.now()));
              }}
            >
              💬 Talepler {unreadReplies > 0 && <span className="badge">{unreadReplies}</span>}
            </button>
          </div>

          {activeTab === 'announcements' && (
            <div className="section-content">
              <div className="section-header">
                <h2>Duyurular</h2>
              </div>
              {!announcements.length && (
                <div className="no-data">
                  Henüz duyuru yok.
                  <pre style={{whiteSpace:'pre-wrap',marginTop:8}}>
                    {`debug: token=${token ? 'var' : 'yok'}, annCount=${announcements?.length ?? 0}`}
                  </pre>
                </div>
              )}
              <div className="announcements-grid">
                {announcements.map((a) => (
                  <div key={a._id} className="announcement-card">
                    <div className="announcement-info">
                      <h4>{a.title}</h4>
                      <p className="meta">{new Date(a.createdAt).toLocaleString()} — {a.createdBy?.firstName} {a.createdBy?.lastName}</p>
                      <p className="message">{a.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'shifts' && openOffers.length > 0 && (
            <div className="section-content">
              <div className="section-header">
                <h2>Departmanınız için Açık Fazla Mesai Teklifleri</h2>
              </div>
              <div className="positions-grid">
                {openOffers.map(o => (
                  <div key={o._id} className="position-card">
                    <div className="position-info">
                      <h4>{new Date(o.weekStart).toLocaleDateString('tr-TR')} haftası</h4>
                      <p>Gerekli Saat: {o.hoursRequired}</p>
                      <p>Bonus: {o.bonusAmount} TL</p>
                      {o.note && <p>{o.note}</p>}
                    </div>
                    <div className="position-actions">
                      <button className="salary-btn" onClick={async () => {
                        try {
                          const accepted = await api(`/api/overtime/offers/${o._id}/accept`, { method: 'POST' })
                          alert('Teklif kabul edildi')
                          setOpenOffers(prev => prev.filter(x => x._id !== o._id))
                          
                          // Kabul edilen teklifi acceptedOffers listesine ekle
                          const newAcceptedOffers = acceptedOffers ? [accepted, ...acceptedOffers] : [accepted]
                          setAcceptedOffers(newAcceptedOffers)
                          // localStorage'a kaydet
                          localStorage.setItem('acceptedOffers', JSON.stringify(newAcceptedOffers))
                          
                          // Artık monthlyOvertime state'ini güncellemeye gerek yok
                          // Sadece acceptedOffers array'i güncellendiği için otomatik olarak hesaplanacak
                        } catch (e) {
                          alert(e.message)
                        }
                      }}>Kabul Et</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'shifts' && (
            <div className="section-content">
              <div className="section-header">
                <h2>Vardiyalarım</h2>
              </div>
              <div className="overtime-badge">
                <span>Bu ay fazla mesai: {acceptedOffers?.reduce((sum, offer) => sum + (offer.hoursRequired || 0), 0) || 0} saat</span>
                <div style={{marginTop: '8px', fontSize: '14px', opacity: '0.8'}}>
                  <div>📋 Kabul edilen tekliflerden: {acceptedOffers?.reduce((sum, offer) => sum + (offer.hoursRequired || 0), 0) || 0} saat</div>
                </div>
              </div>
              {!shifts.length && <p className="no-data">Tanımlı vardiya yok.</p>}
              <div className="shifts-grid">
                {shifts.map((s) => (
                  <div key={s._id} className="shift-card">
                    <div className="shift-info">
                      <h4>{new Date(s.date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>
                      <p className="time">{s.startTime} - {s.endTime}</p>
                      {s.overtimeHours ? <p className="overtime">Fazla Mesai: {s.overtimeHours} saat</p> : null}
                      {s.notes && <p className="notes">{s.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Kabul Edilen Fazla Mesai Teklifleri */}
              {acceptedOffers && acceptedOffers.length > 0 && (
                <div style={{marginTop: '32px'}}>
                  <h3 style={{color: '#10b981', marginBottom: '16px'}}>✅ Kabul Ettiğim Fazla Mesai Teklifleri ({acceptedOffers.length})</h3>
                  <div style={{display: 'grid', gap: '16px'}}>
                    {acceptedOffers.map(offer => (
                      <div key={offer._id} style={{
                        background: 'rgba(10, 185, 129, 0.05)',
                        border: '1px solid rgba(10, 185, 129, 0.2)',
                        borderRadius: '12px',
                        padding: '20px'
                      }}>
                        <h4 style={{color: '#10b981', margin: '0 0 16px 0'}}>🎯 {new Date(offer.weekStart).toLocaleDateString('tr-TR')} Haftası</h4>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                          <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <span style={{color: 'var(--muted)'}}>⏰ Gerekli Saat:</span>
                            <span style={{fontWeight: '600'}}>{offer.hoursRequired} saat</span>
                          </div>
                          <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <span style={{color: 'var(--muted)'}}>💰 Bonus:</span>
                            <span style={{fontWeight: '600'}}>{offer.bonusAmount} TL</span>
                          </div>
                          {offer.note && (
                            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                              <span style={{color: 'var(--muted)'}}>📝 Not:</span>
                              <span style={{fontWeight: '600'}}>{offer.note}</span>
                            </div>
                          )}
                          <div style={{
                            display: 'flex', 
                            justifyContent: 'space-between',
                            marginTop: '16px',
                            paddingTop: '12px',
                            borderTop: '1px solid rgba(16, 185, 129, 0.2)',
                            color: '#10b981',
                            fontWeight: '600'
                          }}>
                            <span>✅ Kabul Tarihi:</span>
                            <span>{new Date(offer.acceptedAt).toLocaleString('tr-TR')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'leaves' && (
            <div className="section-content">
              <div className="section-header">
                <h2>İzin Taleplerim</h2>
                <button 
                  className="add-btn"
                  onClick={() => setShowSidebar(false)}
                >
                  Yeni İzin Talebi
                </button>
              </div>
              
              <div className="leave-form-section">
                <form onSubmit={submitLeave} className="add-leave-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Başlangıç Tarihi</label>
                      <input 
                        type="date" 
                        value={leaveForm.startDate} 
                        onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Bitiş Tarihi</label>
                      <input 
                        type="date" 
                        value={leaveForm.endDate} 
                        min={leaveForm.startDate || undefined}
                        max={leaveForm.startDate ? new Date(new Date(leaveForm.startDate).getTime() + 13 * 24 * 60 * 60 * 1000).toISOString().slice(0,10) : undefined}
                        onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>İzin Türü</label>
                      <select 
                        value={leaveForm.type} 
                        onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                      >
                        <option value="annual">Yıllık İzin</option>
                        <option value="sick">Sağlık İzni</option>
                        <option value="unpaid">Ücretsiz İzin</option>
                        <option value="other">Diğer</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Açıklama</label>
                      <textarea 
                        value={leaveForm.reason} 
                        onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} 
                        rows={3}
                        placeholder="İzin sebebinizi belirtin..."
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={creatingLeave}>
                      {creatingLeave ? 'Gönderiliyor...' : 'İzin Talebi Oluştur'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="leaves-list">
                <h3>Mevcut İzin Taleplerim</h3>
                {!leaves.length && <p className="no-data">Henüz izin talebi yok.</p>}
                <div className="leaves-grid">
                  {leaves.map((l) => (
                    <div key={l._id} className="leave-card">
                      <div className="leave-info">
                        <h4>{new Date(l.startDate).toLocaleDateString('tr-TR')} → {new Date(l.endDate).toLocaleDateString('tr-TR')}</h4>
                        <p className="type">{l.type === 'annual' ? 'Yıllık İzin' : l.type === 'sick' ? 'Sağlık İzni' : l.type === 'unpaid' ? 'Ücretsiz İzin' : 'Diğer'}</p>
                        <p className="status">Durum: <span className={`status-${l.status}`}>{l.status === 'pending' ? 'Beklemede' : l.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}</span></p>
                        {l.reason && <p className="reason">{l.reason}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'request' && (
            <div className="section-content">
              <div className="section-header">
                <h2>Talep / Geri Bildirim</h2>
              </div>
              
              <div className="request-form-section">
                <form onSubmit={submitRequest} className="add-request-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Başlık</label>
                      <input 
                        type="text" 
                        value={requestForm.title} 
                        onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })} 
                        placeholder="Talebinizin başlığını yazın..."
                        required 
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Mesaj</label>
                      <textarea 
                        rows={4} 
                        value={requestForm.message} 
                        onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })} 
                        placeholder="Detaylı açıklamanızı yazın..."
                        required 
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={creatingRequest}>
                      {creatingRequest ? 'Gönderiliyor...' : 'Talebi Gönder'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="requests-list">
                <h3>Gönderilen Talepler</h3>
                {!requests.length && <p className="no-data">Henüz talep yok.</p>}
                <div className="requests-grid">
                  {requests.map((r) => (
                    <div key={r._id} className="request-card">
                      <div className="request-info">
                        <h4>{r.title}</h4>
                        <p className="status">Durum: <span className={`status-${r.status}`}>{r.status === 'open' ? 'Açık' : r.status === 'in_progress' ? 'İşlemde' : 'Kapalı'}</span></p>
                        <p className="meta">{new Date(r.createdAt).toLocaleString('tr-TR')}</p>
                        <p className="message">{r.message}</p>
                      {r.response && (
                        <div className="reply-box">
                          <div className="reply-header">Admin Yanıtı {r.respondedBy ? `— ${r.respondedBy.firstName} ${r.respondedBy.lastName}` : ''} ({r.respondedAt ? new Date(r.respondedAt).toLocaleString('tr-TR') : ''})</div>
                          <div className="reply-content">{r.response}</div>
                        </div>
                      )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WorkerDashboard 