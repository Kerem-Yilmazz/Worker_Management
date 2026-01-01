import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

function AdminDashboard() {
  const navigate = useNavigate()
  const [workers, setWorkers] = useState([])
  const [departments, setDepartments] = useState([])
  const [positions, setPositions] = useState([])


  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddDeptForm, setShowAddDeptForm] = useState(false)
  const [showAddPosForm, setShowAddPosForm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [showEditDeptModal, setShowEditDeptModal] = useState(false)
  const [showEditPosModal, setShowEditPosModal] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [showAddAnnouncementForm, setShowAddAnnouncementForm] = useState(false)

  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [selectedPosition, setSelectedPosition] = useState(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: '',
    position: ''
  })
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    department: '',
    position: ''
  })

  const [deptFormData, setDeptFormData] = useState({
    name: '',
    description: ''
  })
  const [editDeptFormData, setEditDeptFormData] = useState({
    name: '',
    description: ''
  })
  const [posFormData, setPosFormData] = useState({
    name: '',
    department: '',
    level: 1,
    description: ''
  })
  const [editPosFormData, setEditPosFormData] = useState({
    name: '',
    department: '',
    level: 1,
    description: ''
  })

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    selectedWorkers: [],
    selectAll: false
  });
  const [announcements, setAnnouncements] = useState([]);
  const [adminLeaves, setAdminLeaves] = useState([])
  const [loadingAdminLeaves, setLoadingAdminLeaves] = useState(false)
  const pendingLeaveCount = adminLeaves.filter(l => l.status === 'pending').length

  // Fazla Mesai Teklifleri (Admin)
  const [overtimeOffers, setOvertimeOffers] = useState([])
  const [loadingOffers, setLoadingOffers] = useState(false)
  const [overtimeForm, setOvertimeForm] = useState({
    department: '',
    weekStart: '',
    hoursRequired: 10,
    bonusAmount: 0,
    note: ''
  })
  const [showEditAnnouncementModal, setShowEditAnnouncementModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [editAnnouncementForm, setEditAnnouncementForm] = useState({ title: '', message: '' });
  
  // Silme onay modal'ı için state
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState(null);
  // SMS paneli için state
  const [showSmsPanel, setShowSmsPanel] = useState(false);
  const [adminRequests, setAdminRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingRequests, setLoadingRequests] = useState(false);
  
  // Arama için state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  
  // Click outside için ref
  const searchRef = useRef(null);

  useEffect(() => {
    console.log('useEffect çalıştı');
    
    // Token kontrolü
    const token = localStorage.getItem('token');
    console.log('LocalStorage token:', token ? 'Token var' : 'Token yok');
    console.log('Token length:', token ? token.length : 0);
    
    if (!token) {
      console.error('Token bulunamadı! Lütfen tekrar giriş yapın.');
      alert('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      navigate('/');
      return;
    }
    
    fetchWorkers()
    fetchDepartments()
    fetchPositions()
    fetchAnnouncements()
    // Talepleri otomatik çek ve rozet güncel kalsın
    fetchAdminRequests()
    fetchAdminLeaves()
    fetchOvertimeOffers()
  }, [])

  // Arama terimi değiştiğinde işçileri filtrele
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredWorkers(workers);
    } else {
      const filtered = workers.filter(worker => {
        const searchLower = searchTerm.toLowerCase();
        
        // Özel filtreler
        if (searchTerm === 'departman') {
          return worker.department && worker.department.name;
        }
        if (searchTerm === 'pozisyon') {
          return worker.position && worker.position.name;
        }
        if (searchTerm === 'atansiz') {
          return !worker.department || !worker.position;
        }
        
        // Departman bazlı filtreler
        if (searchTerm.startsWith('dept:')) {
          const deptName = searchTerm.substring(5);
          return worker.department?.name === deptName;
        }
        
        // Genel arama
        return (
          worker.firstName?.toLowerCase().includes(searchLower) ||
          worker.lastName?.toLowerCase().includes(searchLower) ||
          worker.email?.toLowerCase().includes(searchLower) ||
          worker.department?.name?.toLowerCase().includes(searchLower) ||
          worker.position?.name?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredWorkers(filtered);
      
      // Arama geçmişine ekle (sadece anlamlı aramalar)
      if (searchTerm.trim().length > 2 && !searchHistory.includes(searchTerm)) {
        setSearchHistory(prev => [searchTerm, ...prev.slice(0, 4)]);
      }
    }
  }, [searchTerm, workers, searchHistory]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchAdminLeaves = async () => {
    try {
      setLoadingAdminLeaves(true)
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:5000/api/leaves/admin', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('İzin talepleri alınamadı')
      const data = await res.json()
      setAdminLeaves(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingAdminLeaves(false)
    }
  }

  const decideLeave = async (leaveId, status) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:5000/api/leaves/admin/${leaveId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Güncellenemedi')
      const updated = await res.json()
      setAdminLeaves(prev => prev.map(l => l._id === updated._id ? updated : l))
      alert(status === 'approved' ? 'İzin onaylandı' : 'İzin reddedildi')
    } catch (e) {
      alert(e.message)
    }
  }

  const fetchOvertimeOffers = async () => {
    try {
      setLoadingOffers(true)
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:5000/api/overtime/offers', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Teklifler alınamadı')
      const data = await res.json()
      setOvertimeOffers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingOffers(false)
    }
  }

  const createOvertimeOffer = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:5000/api/overtime/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(overtimeForm)
      })
      if (!res.ok) throw new Error((await res.json()).message || 'Teklif oluşturulamadı')
      const created = await res.json()
      setOvertimeOffers(prev => [created, ...prev])
      setOvertimeForm({ department: '', weekStart: '', hoursRequired: 10, bonusAmount: 0, note: '' })
      alert('Fazla mesai teklifi oluşturuldu')
    } catch (e) {
      alert(e.message)
    }
  }

  const fetchAdminRequests = async () => {
    try {
      setLoadingRequests(true)
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:5000/api/requests/admin', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Talepler alınamadı')
      const data = await res.json()
      setAdminRequests(data)
      // basit okunmamış sayacı: open olanları say
      setUnreadCount(data.filter(r => r.status === 'open').length)
    } catch (e) {
      console.error(e)
      alert('Talepler yüklenemedi')
    } finally {
      setLoadingRequests(false)
    }
  }

  const fetchWorkers = async () => {
    try {
      const token = localStorage.getItem('token')
      console.log('Fetching workers with token:', token ? 'Token exists' : 'No token')
      
      const response = await fetch('http://localhost:5000/api/workers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('Workers response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Workers data received:', data)
        setWorkers(data)
      } else {
        console.error('Workers response not ok:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('İşçiler yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }



  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/departments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      }
    } catch (error) {
      console.error('Departmanlar yüklenirken hata:', error)
    }
  }

  const fetchPositions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/positions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPositions(data)
      }
    } catch (error) {
      console.error('Pozisyonlar yüklenirken hata:', error)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      }
    } catch (error) {
      console.error('Duyurular yüklenirken hata:', error)
    }
  }


  const handleAddWorker = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('http://localhost:5000/api/workers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email, // Backend otomatik olarak @karaholding.com ekleyecek
          password: formData.password,
          department: formData.department,
          position: formData.position,

        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'İşçi eklenirken hata oluştu')
      }

      const responseData = await response.json()
      console.log('Backend response:', responseData)
      
      const newWorker = responseData.worker
      console.log('New worker data:', newWorker)
      
      // Yeni işçiyi listeye ekle
      setWorkers(prevWorkers => {
        console.log('Previous workers:', prevWorkers)
        const updatedWorkers = [...prevWorkers, newWorker]
        console.log('Updated workers:', updatedWorkers)
        return updatedWorkers
      })
      
      // Formu temizle
      setFormData({ firstName: '', lastName: '', email: '', password: '', department: '', position: '' })
      setShowAddForm(false)
      
      // Başarı mesajı
      alert('İşçi başarıyla eklendi!')
      
      // İşçi listesini yenile
      fetchWorkers()
    } catch (error) {
      alert('Hata: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDepartment = async (e) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(deptFormData)
      })

      if (response.ok) {
        const data = await response.json()
        setDepartments([...departments, data.department])
        setDeptFormData({ name: '', description: '' })
        setShowAddDeptForm(false)
        alert('Departman başarıyla eklendi!')
      } else {
        const error = await response.json()
        alert(`Hata: ${error.message}`)
      }
    } catch (error) {
      alert('Departman eklenirken hata oluştu')
    }
  }

  const handleEditDepartment = (department) => {
    setSelectedDepartment(department)
    setEditDeptFormData({
      name: department.name,
      description: department.description || ''
    })
    setShowEditDeptModal(true)
  }

  const handleUpdateDepartment = async (e) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/departments/${selectedDepartment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editDeptFormData)
      })

      if (response.ok) {
        const data = await response.json()
        setDepartments(departments.map(dept => dept._id === data.department._id ? data.department : dept))
        setShowEditDeptModal(false)
        alert('Departman başarıyla güncellendi!')
      } else {
        const error = await response.json()
        alert(`Hata: ${error.message}`)
      }
    } catch (error) {
      alert('Departman güncellenirken hata oluştu')
    }
  }

  const handleDeleteDepartment = async (departmentId) => {
    if (!confirm('Bu departmanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/departments/${departmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setDepartments(departments.filter(dept => dept._id !== departmentId))
        alert('Departman başarıyla silindi!')
      } else {
        const error = await response.json()
        alert(`Hata: ${error.message}`)
      }
    } catch (error) {
      alert('Departman silinirken hata oluştu')
    }
  }

  const handleAddPosition = async (e) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(posFormData)
      })

      if (response.ok) {
        const data = await response.json()
        setPositions([...positions, data.position])
        setPosFormData({ name: '', department: '', level: 1, description: '' })
        setShowAddPosForm(false)
        alert('Pozisyon başarıyla eklendi!')
      } else {
        const error = await response.json()
        alert(`Hata: ${error.message}`)
      }
    } catch (error) {
      alert('Pozisyon eklenirken hata oluştu')
    }
  }

  const handleEditPosition = (position) => {
    setSelectedPosition(position)
    console.log('Editing position:', position)
    console.log('Position department:', position.department)
    
    // Departman ID'sini doğru şekilde al
    let departmentId = ''
    if (position.department) {
      if (typeof position.department === 'object' && position.department._id) {
        departmentId = position.department._id
      } else if (typeof position.department === 'string') {
        departmentId = position.department
      }
    }
    
    console.log('Department ID:', departmentId)
    
    setEditPosFormData({
      name: position.name,
      department: departmentId,
      level: position.level,
      description: position.description || ''
    })
    setShowEditPosModal(true)
  }

  const handleUpdatePosition = async (e) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/positions/${selectedPosition._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editPosFormData)
      })

      if (response.ok) {
        const data = await response.json()
        setPositions(positions.map(pos => pos._id === data.position._id ? data.position : pos))
        setShowEditPosModal(false)
        alert('Pozisyon başarıyla güncellendi!')
      } else {
        const error = await response.json()
        alert(`Hata: ${error.message}`)
      }
    } catch (error) {
      alert('Pozisyon güncellenirken hata oluştu')
    }
  }

  const handleDeletePosition = async (positionId) => {
    if (!confirm('Bu pozisyonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/positions/${positionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setPositions(positions.filter(pos => pos._id !== positionId))
        alert('Pozisyon başarıyla silindi!')
      } else {
        const error = await response.json()
        alert(`Hata: ${error.message}`)
      }
    } catch (error) {
      alert('Pozisyon silinirken hata oluştu')
    }
  }

  const handleDeleteOvertimeOffer = async (offerId) => {
    // Silinecek teklifi bul
    const offer = overtimeOffers.find(o => o._id === offerId);
    if (!offer) return;
    
    // Modal'ı göster
    setOfferToDelete(offer);
    setShowDeleteConfirmModal(true);
  }

  const confirmDeleteOvertimeOffer = async () => {
    if (!offerToDelete) return;

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/overtime/offers/${offerToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setOvertimeOffers(prev => prev.filter(offer => offer._id !== offerToDelete._id))
        alert('Fazla mesai teklifi başarıyla silindi!')
        setShowDeleteConfirmModal(false)
        setOfferToDelete(null)
      } else {
        const error = await response.json()
        alert(`Hata: ${error.message}`)
      }
    } catch (error) {
      alert('Fazla mesai teklifi silinirken hata oluştu')
    }
  }

  const handleDeleteWorker = async (workerId) => {
    if (!confirm('Bu işçiyi silmek istediğinizden emin misiniz?')) return

    try {
      const token = localStorage.getItem('token')
      console.log('Deleting worker with ID:', workerId)
      console.log('Token exists:', !!token)
      
      const response = await fetch(`http://localhost:5000/api/workers/${workerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Delete response status:', response.status)
      
      if (response.ok) {
        const responseData = await response.json()
        console.log('Delete response data:', responseData)
        
        // İşçiyi listeden kaldır
        setWorkers(prevWorkers => {
          console.log('Previous workers before delete:', prevWorkers)
          const filteredWorkers = prevWorkers.filter(worker => worker._id !== workerId)
          console.log('Workers after delete:', filteredWorkers)
          return filteredWorkers
        })
        
        alert('İşçi başarıyla silindi!')
        
        // İşçi listesini yenile
        fetchWorkers()
      } else {
        const error = await response.json()
        console.error('Delete error:', error)
        alert(`Hata: ${error.message}`)
      }
    } catch (error) {
      console.error('Delete exception:', error)
      alert('İşçi silinirken hata oluştu')
    }
  }

  const handleEditWorker = (worker) => {
    setSelectedWorker(worker)
    
    setEditFormData({
      firstName: worker.firstName,
      lastName: worker.lastName,
      department: worker.department ? worker.department._id : '',
      position: worker.position ? worker.position._id : ''
    })
    setShowEditModal(true)
  }

  const handleUpdateWorker = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/workers/${selectedWorker._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: editFormData.firstName,
          lastName: editFormData.lastName,
          department: editFormData.department,
          position: editFormData.position,

        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'İşçi güncellenirken hata oluştu')
      }

      const responseData = await response.json()
      const updatedWorker = responseData.worker
      
      // İşçi listesini güncelle
      setWorkers(prevWorkers => prevWorkers.map(worker => worker._id === updatedWorker._id ? updatedWorker : worker))
      setShowEditModal(false)
      
      // Başarı mesajı
      alert('İşçi başarıyla güncellendi!')
      
      // İşçi listesini yenile
      fetchWorkers()
    } catch (error) {
      alert('Hata: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Seçilen işçilere göre audience belirle
      let audience = 'all';
      let workersToSend = [];
      let department = null;
      
      if (announcementForm.selectAll) {
        audience = 'all';
      } else if (announcementForm.selectedWorkers && announcementForm.selectedWorkers.length > 0) {
        audience = 'specific';
        workersToSend = announcementForm.selectedWorkers;
      }

      console.log('Sending announcement data:', {
        title: announcementForm.title,
        message: announcementForm.message,
        audience,
        workers: workersToSend,
        department
      });

      const response = await fetch('http://localhost:5000/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: announcementForm.title,
          message: announcementForm.message,
          audience,
          workers: workersToSend,
          department
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Duyuru oluşturulurken hata oluştu');
      }

      const responseData = await response.json();
      
      // State'i güvenli şekilde güncelle
      setAnnouncements(prevAnnouncements => [responseData, ...prevAnnouncements]);
      
      setAnnouncementForm({
        title: '',
        message: '',
        selectedWorkers: [],
        selectAll: false
      });
      
      // Duyuru listesini yenile
      fetchAnnouncements();
      
      alert('Duyuru başarıyla oluşturuldu!');
    } catch (error) {
      alert('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!confirm('Bu duyuruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) return;

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        navigate('/');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // State'i güvenli şekilde güncelle
        setAnnouncements(prevAnnouncements => 
          prevAnnouncements.filter(ann => ann._id !== announcementId)
        );
        alert('Duyuru başarıyla silindi!');
      } else {
        const error = await response.json();
        alert(`Hata: ${error.message}`);
      }
    } catch (error) {
      console.error('Duyuru silme hatası:', error);
      alert('Duyuru silinirken hata oluştu: ' + error.message);
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setEditAnnouncementForm({
      title: announcement.title || '',
      message: announcement.message || ''
    });
    setShowEditAnnouncementModal(true);
  };

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/announcements/${selectedAnnouncement._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editAnnouncementForm.title,
          message: editAnnouncementForm.message
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Duyuru güncellenemedi');
      }

      const updated = await response.json();
      setAnnouncements(prev => prev.map(a => a._id === updated._id ? updated : a));
      setShowEditAnnouncementModal(false);
      setSelectedAnnouncement(null);
      setEditAnnouncementForm({ title: '', message: '' });
      alert('Duyuru güncellendi');
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  };

  

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Yükleniyor...</div>
      </div>
    )
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
            <h1>Admin Dashboard</h1>
            {pendingLeaveCount > 0 && (
              <span className="header-badge">İzin talepleri: {pendingLeaveCount}</span>
            )}
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
                  // Departman yönetimi bölümüne scroll (ilk sırada)
                  document.querySelector('.departments-section')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  })
                }}
              >
                🏢 Departman Yönetimi
              </button>
              <button 
                className="sidebar-nav-item"
                onClick={() => {
                  setShowSidebar(false)
                  // Pozisyon yönetimi bölümüne scroll (ikinci sırada)
                  document.querySelector('.positions-section')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  })
                }}
              >
                📋 Pozisyon Yönetimi
              </button>
              <button 
                className="sidebar-nav-item"
                onClick={() => {
                  setShowSidebar(false)
                  // İşçi yönetimi bölümüne scroll (son sırada)
                  document.querySelector('.workers-section')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  })
                }}
              >
                👥 İşçi Yönetimi
              </button>
              <button 
                className="sidebar-nav-item"
                onClick={() => {
                  setShowSidebar(false)
                  // Duyuru yönetimi bölümüne scroll
                  document.querySelector('.announcements-section')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  })
                }}
              >
                📢 Duyuru Yönetimi
              </button>
              <button 
                className={`sidebar-nav-item${pendingLeaveCount > 0 ? ' has-alert' : ''}`}
                onClick={() => {
                  setShowSidebar(false)
                  // İzin talepleri bölümüne scroll
                  document.querySelector('.leaves-section')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  })
                }}
              >
                🗓️ İzin Talepleri {pendingLeaveCount > 0 && <span className="badge">{pendingLeaveCount}</span>}
              </button>
              <button 
                className="sidebar-nav-item"
                onClick={() => {
                  setShowSidebar(false)
                  document.querySelector('.overtime-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                ⏱️ Fazla Mesai Teklifleri
              </button>
            </nav>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        <div className="stats-section">
          <div className="stat-card">
            <h3>Toplam İşçi</h3>
            <p className="stat-number">{workers.length}</p>
          </div>
          <div className="stat-card">
            <h3>Departman</h3>
            <p className="stat-number">{departments.length}</p>
          </div>
          <div className="stat-card">
            <h3>Aktif Duyurular</h3>
            <p className="stat-number">{announcements.length}</p>
          </div>
        </div>

        <div className="departments-section">
          <div className="section-header">
            <h2>Departman Yönetimi</h2>
            <button 
              className="add-btn"
              onClick={() => setShowAddDeptForm(!showAddDeptForm)}
            >
              {showAddDeptForm ? 'İptal' : 'Yeni Departman Ekle'}
            </button>
          </div>

          {showAddDeptForm && (
            <form className="add-department-form" onSubmit={handleAddDepartment}>
              <div className="form-row">
                <div className="form-group">
                  <label>Departman Adı</label>
                  <input
                    type="text"
                    value={deptFormData.name}
                    onChange={(e) => setDeptFormData({...deptFormData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Açıklama</label>
                  <input
                    type="text"
                    value={deptFormData.description}
                    onChange={(e) => setDeptFormData({...deptFormData, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Departman Ekle
                </button>
              </div>
            </form>
          )}

          <div className="departments-list">
            <h3>Mevcut Departmanlar</h3>
            {departments.length === 0 ? (
              <p className="no-data">Henüz departman eklenmemiş</p>
            ) : (
              <div className="departments-grid">
                {departments.map(dept => (
                  <div key={dept._id} className="department-card">
                    <div className="department-info">
                      <h4>{dept.name}</h4>
                      <p>{dept.description || 'Açıklama yok'}</p>
                    </div>
                    <div className="department-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEditDepartment(dept)}
                      >
                        Düzenle
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteDepartment(dept._id)}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="positions-section">
          <div className="section-header">
            <h2>Pozisyon Yönetimi</h2>
            <button 
              className="add-btn"
              onClick={() => setShowAddPosForm(!showAddPosForm)}
            >
              {showAddPosForm ? 'İptal' : 'Yeni Pozisyon Ekle'}
            </button>
          </div>

          {showAddPosForm && (
            <form className="add-position-form" onSubmit={handleAddPosition}>
              <div className="form-row">
                <div className="form-group">
                  <label>Pozisyon Adı</label>
                  <input
                    type="text"
                    value={posFormData.name}
                    onChange={(e) => setPosFormData({...posFormData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Departman</label>
                  <select
                    value={posFormData.department}
                    onChange={(e) => setPosFormData({...posFormData, department: e.target.value, level: 1})}
                    required
                  >
                    <option value="">Departman seçin</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Seviye</label>
                  <select
                    value={posFormData.level}
                    onChange={(e) => setPosFormData({...posFormData, level: parseInt(e.target.value)})}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                      <option key={level} value={level}>
                        Seviye {level}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Açıklama</label>
                  <input
                    type="text"
                    value={posFormData.description}
                    onChange={(e) => setPosFormData({...posFormData, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Pozisyon Ekle
                </button>
              </div>
            </form>
          )}

          <div className="positions-list">
            <h3>Mevcut Pozisyonlar</h3>
            {positions.length === 0 ? (
              <p className="no-data">Henüz pozisyon eklenmemiş</p>
            ) : (
              <div className="positions-grid">
                {positions.map(pos => (
                  <div key={pos._id} className="position-card">
                    <div className="position-info">
                      <h4>{pos.name}</h4>
                      <p className="department-name">{pos.department?.name}</p>
                      <p className="position-level">Seviye: {pos.level}</p>
                      <p>{pos.description || 'Açıklama yok'}</p>
                    </div>
                    <div className="position-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEditPosition(pos)}
                      >
                        Düzenle
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeletePosition(pos._id)}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="workers-section">
          <div className="section-header">
            <h2>İşçi Yönetimi</h2>
            <button 
              className="add-btn"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'İptal' : 'Yeni İşçi Ekle'}
            </button>
          </div>

          {/* Arama Çubuğu */}
          <div className="search-section">
            <div className="search-container" ref={searchRef}>
              <input
                type="text"
                placeholder="İşçi ara... (ad, soyad, email, departman, pozisyon)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowSearchHistory(true)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                  title="Aramayı temizle"
                >
                  ✕
                </button>
              )}
              
              {/* Arama Geçmişi */}
              {showSearchHistory && searchHistory.length > 0 && (
                <div className="search-history">
                  <div className="history-header">
                    <span>Son Aramalar:</span>
                    <button 
                      className="clear-history-btn"
                      onClick={() => setSearchHistory([])}
                      title="Geçmişi temizle"
                    >
                      Temizle
                    </button>
                  </div>
                  {searchHistory.map((term, index) => (
                    <button
                      key={index}
                      className="history-item"
                      onClick={() => {
                        setSearchTerm(term);
                        setShowSearchHistory(false);
                      }}
                    >
                      🔍 {term}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Hızlı Filtreler */}
            <div className="quick-filters">
              <span className="filter-label">Hızlı filtreler:</span>
              <button 
                className={`filter-btn ${searchTerm === '' ? 'active' : ''}`}
                onClick={() => setSearchTerm('')}
              >
                Tümü ({workers.length})
              </button>
              <button 
                className={`filter-btn ${searchTerm === 'departman' ? 'active' : ''}`}
                onClick={() => setSearchTerm('departman')}
              >
                Departman ({workers.filter(w => w.department).length})
              </button>
              <button 
                className={`filter-btn ${searchTerm === 'pozisyon' ? 'active' : ''}`}
                onClick={() => setSearchTerm('pozisyon')}
              >
                Pozisyon ({workers.filter(w => w.position).length})
              </button>
              <button 
                className={`filter-btn ${searchTerm === 'atansiz' ? 'active' : ''}`}
                onClick={() => setSearchTerm('atansiz')}
              >
                Atanmamış ({workers.filter(w => !w.department || !w.position).length})
              </button>
              
              {/* Departman Bazlı Filtreler */}
              <div className="department-filters">
                <span className="filter-label">Departman:</span>
                {departments.map(dept => (
                  <button
                    key={dept._id}
                    className={`filter-btn ${searchTerm === `dept:${dept.name}` ? 'active' : ''}`}
                    onClick={() => setSearchTerm(`dept:${dept.name}`)}
                  >
                    {dept.name} ({workers.filter(w => w.department?._id === dept._id).length})
                  </button>
                ))}
              </div>
            </div>
            
            {searchTerm && (
              <div className="search-results-info">
                <span className="search-count">
                  {filteredWorkers.length} işçi bulundu
                </span>
                <span className="total-count">
                  (toplam {workers.length} işçi)
                </span>
                
                {/* Sıralama ve Gruplandırma Seçenekleri */}
                <div className="sort-options">
                  <span className="sort-label">Sırala:</span>
                  <select 
                    className="sort-select"
                    onChange={(e) => {
                      const sortBy = e.target.value;
                      const sorted = [...filteredWorkers].sort((a, b) => {
                        switch (sortBy) {
                          case 'name':
                            return (a.firstName + ' ' + a.lastName).localeCompare(b.firstName + ' ' + b.lastName, 'tr');
                          case 'department':
                            return (a.department?.name || '').localeCompare(b.department?.name || '', 'tr');
                          case 'position':
                            return (a.position?.name || '').localeCompare(b.position?.name || '', 'tr');
                          default:
                            return 0;
                        }
                      });
                      setFilteredWorkers(sorted);
                    }}
                  >
                    <option value="">Varsayılan</option>
                    <option value="name">Ada göre</option>
                    <option value="department">Departmana göre</option>
                    <option value="position">Pozisyona göre</option>
                  </select>
                  
                  <span className="sort-label">Grupla:</span>
                  <select 
                    className="sort-select"
                    onChange={(e) => {
                      const groupBy = e.target.value;
                      if (groupBy === '') {
                        // Gruplandırmayı kaldır
                        setFilteredWorkers(workers.filter(worker => {
                          const searchLower = searchTerm.toLowerCase();
                          return (
                            worker.firstName?.toLowerCase().includes(searchLower) ||
                            worker.lastName?.toLowerCase().includes(searchLower) ||
                            worker.email?.toLowerCase().includes(searchLower) ||
                            worker.department?.name?.toLowerCase().includes(searchLower) ||
                            worker.position?.name?.toLowerCase().includes(searchLower)
                          );
                        }));
                      } else {
                        // Gruplandır
                        const grouped = {};
                        filteredWorkers.forEach(worker => {
                          let key = '';
                          switch (groupBy) {
                            case 'department':
                              key = worker.department?.name || 'Atanmamış';
                              break;
                            case 'position':
                              key = worker.position?.name || 'Atanmamış';
                              break;
                            default:
                              key = 'Diğer';
                          }
                          if (!grouped[key]) grouped[key] = [];
                          grouped[key].push(worker);
                        });
                        
                        // Gruplandırılmış sonuçları düzleştir
                        const flattened = Object.values(grouped).flat();
                        setFilteredWorkers(flattened);
                      }
                    }}
                  >
                    <option value="">Gruplandırma yok</option>
                    <option value="department">Departmana göre</option>
                    <option value="position">Pozisyona göre</option>
                  </select>
                </div>
                
                <button 
                  className="export-btn"
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," + 
                      "Ad,Soyad,Email,Departman,Pozisyon\n" +
                      filteredWorkers.map(w => 
                        `${w.firstName},${w.lastName},${w.email},${w.department?.name || ''},${w.position?.name || ''}`
                      ).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `isci_listesi_${new Date().toLocaleDateString('tr-TR')}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  title="Sonuçları CSV olarak indir"
                >
                  📥 CSV İndir
                </button>
              </div>
            )}
          </div>

          {showAddForm && (
            <form className="add-worker-form" onSubmit={handleAddWorker}>
              <div className="form-row">
                <div className="form-group">
                  <label>Ad</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Soyad</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <div className="email-input-group">
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault()
                        if (!formData.email.includes('@')) {
                          setFormData({...formData, email: formData.email + '@karaholding.com'})
                        }
                      }
                    }}
                    placeholder="kullaniciadi"
                    required
                  />
                  {formData.email && !formData.email.includes('@') && (
                    <div className="email-suggestion-container">
                      <span className="email-suggestion">{formData.email}@karaholding.com</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Şifre</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Departman</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value, position: ''})}
                    required
                  >
                    <option value="">Departman seçin</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Pozisyon</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    required
                  >
                    <option value="">Pozisyon seçin</option>
                    {positions
                      .filter(pos => !formData.department || pos.department === formData.department || pos.department._id === formData.department)
                      .map(pos => (
                        <option key={pos._id} value={pos._id}>
                          {pos.name} (Seviye: {pos.level})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  İşçi Ekle
                </button>
              </div>
            </form>
          )}

          <div className="workers-list">
            <h3>Mevcut İşçiler ({filteredWorkers.length})</h3>
            {filteredWorkers.length === 0 ? (
              <p className="no-data">
                {searchTerm ? `"${searchTerm}" için sonuç bulunamadı` : 'Henüz işçi eklenmemiş'}
              </p>
            ) : (
              <>
                {/* Arama Sonuç Özeti */}
                {searchTerm && (
                  <div className="search-summary">
                    <div className="summary-stats">
                      <div className="stat-item">
                        <span className="stat-label">Departman:</span>
                        <span className="stat-value">
                          {[...new Set(filteredWorkers.map(w => w.department?.name).filter(Boolean))].length} farklı departman
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Pozisyon:</span>
                        <span className="stat-value">
                          {[...new Set(filteredWorkers.map(w => w.position?.name).filter(Boolean))].length} farklı pozisyon
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Atanmamış:</span>
                        <span className="stat-value">
                          {filteredWorkers.filter(w => !w.department || !w.position).length} kişi
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="workers-grid">
                  {filteredWorkers.map(worker => (
                    <div key={worker._id} className="worker-card">
                      <div className="worker-info">
                        <h4>{worker.firstName} {worker.lastName}</h4>
                        <p>{worker.email}</p>
                        <p className="department">
                          Departman: {worker.department ? worker.department.name : 'Atanmamış'}
                        </p>
                        <p className="position">
                          Pozisyon: {worker.position ? `${worker.position.name} (Seviye: ${worker.position.level})` : 'Atanmamış'}
                        </p>
                      </div>
                      <div className="worker-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEditWorker(worker)}
                        >
                          Düzenle
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteWorker(worker._id)}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="announcements-section">
          <div className="section-header">
            <h2>Duyuru Yönetimi</h2>
            <button 
              className="add-btn"
              onClick={() => setShowAddAnnouncementForm(!showAddAnnouncementForm)}
            >
              {showAddAnnouncementForm ? 'İptal' : 'Yeni Duyuru Ekle'}
            </button>
          </div>

          {showAddAnnouncementForm && (
            <div className="add-announcement-form">
              <form onSubmit={handleAddAnnouncement}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Duyuru Başlığı</label>
                    <input
                      type="text"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                      placeholder="Duyuru başlığını girin..."
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Duyuru Mesajı</label>
                    <textarea
                      value={announcementForm.message}
                      onChange={(e) => setAnnouncementForm({...announcementForm, message: e.target.value})}
                      placeholder="Duyuru mesajını detaylı olarak yazın..."
                      rows={4}
                      required
                    ></textarea>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Hedef Kitle Seçimi</label>
                    <div className="audience-selection">
                      <div className="select-all-section">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={announcementForm.selectAll}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAnnouncementForm({
                                  ...announcementForm,
                                  selectAll: true,
                                  selectedWorkers: workers.map(w => w._id)
                                });
                              } else {
                                setAnnouncementForm({
                                  ...announcementForm,
                                  selectAll: false,
                                  selectedWorkers: []
                                });
                              }
                            }}
                          />
                          <span className="checkmark"></span>
                          <strong>Tüm İşçileri Seç</strong>
                        </label>
                      </div>

                      <div className="workers-selection-section">
                        <h4>İşçi Seçimi</h4>
                        <div className="workers-selection-grid">
                          {workers.map(worker => (
                            <label key={worker._id} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={announcementForm.selectedWorkers.includes(worker._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAnnouncementForm({
                                      ...announcementForm,
                                      selectedWorkers: [...announcementForm.selectedWorkers, worker._id],
                                      selectAll: false
                                    });
                                  } else {
                                    setAnnouncementForm({
                                      ...announcementForm,
                                      selectedWorkers: announcementForm.selectedWorkers.filter(id => id !== worker._id),
                                      selectAll: false
                                    });
                                  }
                                }}
                              />
                              <span className="checkmark"></span>
                              <div className="worker-info">
                                <span className="worker-name">{worker.firstName} {worker.lastName}</span>
                                <span className="worker-dept">{worker.department?.name || 'Departman yok'}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    Duyuru Oluştur
                  </button>
                </div>
              </form>
            </div>
          )}

          {announcements.length > 0 && (
            <div className="announcements-list">
              <h3>Mevcut Duyurular ({announcements.length})</h3>
                  <div className="announcements-grid">
                    {announcements.map(announcement => (
                      <div key={announcement._id} className="announcement-card">
                        <div className="announcement-info">
                          <h4>{announcement.title}</h4>
                          <p className="announcement-message">{announcement.message}</p>
                          <div className="announcement-meta">
                            <p className="announcement-audience">
                              <strong>Hedef:</strong>{' '}
                              {announcement.audience === 'all' && 'Tüm İşçiler'}
                              {announcement.audience === 'specific' && (
                                <>
                                  Seçili İşçiler: {
                                    (announcement.workers && announcement.workers.length)
                                      ? announcement.workers
                                          .map(w => [w?.firstName, w?.lastName].filter(Boolean).join(' '))
                                          .filter(Boolean)
                                          .join(', ')
                                      : `${announcement.workers?.length || 0} kişi`
                                  }
                                </>
                              )}
                              {!(announcement.audience === 'all' || announcement.audience === 'specific') && 'Bilinmeyen'}
                            </p>
                            <p className="announcement-date">
                              <strong>Oluşturulma:</strong> {new Date(announcement.createdAt).toLocaleString('tr-TR')}
                            </p>
                          </div>
                        </div>
                        <div className="announcement-actions">
                          <button 
                            className="edit-btn"
                            onClick={() => handleEditAnnouncement(announcement)}
                          >
                            Düzenle
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteAnnouncement(announcement._id)}
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
            </div>
          )}
        </div>

        {/* İzin Talepleri (Admin) */}
        <div className="leaves-section">
          <div className="section-header">
            <h2>İzin Talepleri</h2>
            <button className="add-btn" onClick={fetchAdminLeaves} disabled={loadingAdminLeaves}>
              Yenile
            </button>
          </div>
          {loadingAdminLeaves ? (
            <p className="no-data">Yükleniyor...</p>
          ) : adminLeaves.length === 0 ? (
            <p className="no-data">Henüz izin talebi yok.</p>
          ) : (
          <div className="leaves-grid">
              {adminLeaves.map(l => (
                <div key={l._id} className="leave-card">
                  <div className="leave-info">
                  <h4>{new Date(l.startDate).toLocaleDateString('tr-TR')} → {new Date(l.endDate).toLocaleDateString('tr-TR')}</h4>
                  <p className="meta"><strong>Çalışan:</strong> {l.user?.firstName} {l.user?.lastName} — {l.user?.email}</p>
                  <p className="type"><strong>Tür:</strong> {l.type === 'annual' ? 'Yıllık' : l.type === 'sick' ? 'Sağlık' : l.type === 'unpaid' ? 'Ücretsiz' : 'Diğer'}</p>
                    {l.reason && <p className="reason">{l.reason}</p>}
                  <p className="status"><strong>Durum:</strong> <span className={`status-${l.status}`}>{l.status === 'pending' ? 'Beklemede' : l.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}</span></p>
                  {l.decidedBy && <p className="meta"><strong>Karar:</strong> {l.decidedBy?.firstName} {l.decidedBy?.lastName} — {l.decisionAt ? new Date(l.decisionAt).toLocaleString('tr-TR') : ''}</p>}
                  </div>
                  {l.status === 'pending' && (
                    <div className="department-actions">
                      <button className="salary-btn" onClick={() => decideLeave(l._id, 'approved')}>Onayla</button>
                      <button className="delete-btn" onClick={() => decideLeave(l._id, 'rejected')}>Reddet</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fazla Mesai Teklifleri (Admin) */}
        <div className="overtime-section">
          <div className="section-header">
            <h2>Fazla Mesai Teklifleri</h2>
            <button className="add-btn" onClick={fetchOvertimeOffers} disabled={loadingOffers}>Yenile</button>
          </div>

          <form className="add-position-form" onSubmit={createOvertimeOffer}>
            <div className="form-row">
              <div className="form-group">
                <label>Departman</label>
                <select
                  value={overtimeForm.department}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, department: e.target.value })}
                  required
                >
                  <option value="">Departman seçin</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Hafta Başlangıcı</label>
                <input
                  type="date"
                  value={overtimeForm.weekStart}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, weekStart: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Gerekli Fazla Mesai (saat)</label>
                <input
                  type="number"
                  min={1}
                  value={overtimeForm.hoursRequired}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, hoursRequired: parseInt(e.target.value || '0', 10) })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Verilecek Bonus (TL)</label>
                <input
                  type="number"
                  min={0}
                  value={overtimeForm.bonusAmount}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, bonusAmount: parseFloat(e.target.value || '0') })}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{width:'100%'}}>
                <label>Not</label>
                <input
                  type="text"
                  value={overtimeForm.note}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, note: e.target.value })}
                  placeholder="Detay veya şartlar..."
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-btn">Teklif Oluştur</button>
            </div>
          </form>

          <div className="positions-list" style={{marginTop: 24}}>
            <div className="section-header">
              <h3>Mevcut Fazla Mesai Teklifleri</h3>
              <button className="add-btn" onClick={fetchOvertimeOffers} disabled={loadingOffers}>Yenile</button>
            </div>
            {overtimeOffers.length === 0 ? (
              <p className="no-data">Henüz teklif yok.</p>
            ) : (
              <div className="positions-grid">
                {overtimeOffers.map(o => (
                  <div key={o._id} className="position-card">
                    <div className="position-info">
                      <h4>{o.department?.name || 'Departman'} — {new Date(o.weekStart).toLocaleDateString('tr-TR')}</h4>
                      <p>Gerekli Saat: {o.hoursRequired}</p>
                      <p>Bonus: {o.bonusAmount} TL</p>
                      {o.note && <p>{o.note}</p>}
                      <p className={`status-${o.status}`}>Durum: {o.status}</p>
                      {o.status === 'accepted' && (
                        <p className="meta">Kabul Eden: {o.acceptedBy && o.acceptedBy.firstName && o.acceptedBy.lastName ? `${o.acceptedBy.firstName} ${o.acceptedBy.lastName}` : 'Henüz kabul edilmedi'} {o.acceptedAt ? `(${new Date(o.acceptedAt).toLocaleString('tr-TR')})` : ''}</p>
                      )}
                    </div>
                    <div className="position-actions">
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteOvertimeOffer(o._id)}
                        title="Fazla mesai teklifini sil"
                      >
                        🗑️ Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showEditAnnouncementModal && selectedAnnouncement && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Duyuruyu Düzenle</h2>
              <form onSubmit={handleUpdateAnnouncement}>
                <div className="form-group">
                  <label>Başlık</label>
                  <input
                    type="text"
                    value={editAnnouncementForm.title}
                    onChange={(e) => setEditAnnouncementForm({ ...editAnnouncementForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mesaj</label>
                  <textarea
                    rows={4}
                    value={editAnnouncementForm.message}
                    onChange={(e) => setEditAnnouncementForm({ ...editAnnouncementForm, message: e.target.value })}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="submit-btn">Kaydet</button>
                  <button type="button" className="cancel-btn" onClick={() => setShowEditAnnouncementModal(false)}>İptal</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && selectedWorker && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>İşçi Düzenle</h2>
              <form onSubmit={handleUpdateWorker}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Ad</label>
                    <input
                      type="text"
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Soyad</label>
                    <input
                      type="text"
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Departman</label>
                  <select
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({...editFormData, department: e.target.value, position: ''})}
                    required
                  >
                    <option value="">Departman seçin</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Pozisyon</label>
                  <select
                    value={editFormData.position}
                    onChange={(e) => setEditFormData({...editFormData, position: e.target.value})}
                    required
                  >
                    <option value="">Pozisyon seçin</option>
                    {positions
                      .filter(pos => editFormData.department === '' || pos.department === editFormData.department || pos.department._id === editFormData.department)
                      .map(pos => (
                        <option key={pos._id} value={pos._id}>
                          {pos.name} (Seviye: {pos.level})
                        </option>
                      ))}
                  </select>
                </div>



                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    İşçiyi Güncelle
                  </button>
                  <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

         {showEditDeptModal && selectedDepartment && (
           <div className="modal-overlay">
             <div className="modal-content">
               <h2>Departman Düzenle</h2>
               <form onSubmit={handleUpdateDepartment}>
                 <div className="form-group">
                   <label>Departman Adı</label>
                   <input
                     type="text"
                     value={editDeptFormData.name}
                     onChange={(e) => setEditDeptFormData({...editDeptFormData, name: e.target.value})}
                     required
                   />
                 </div>
                 <div className="form-group">
                   <label>Açıklama</label>
                   <input
                     type="text"
                     value={editDeptFormData.description}
                     onChange={(e) => setEditDeptFormData({...editDeptFormData, description: e.target.value})}
                   />
                 </div>
                 <div className="form-actions">
                   <button type="submit" className="submit-btn">
                     Departmanı Güncelle
                   </button>
                   <button type="button" className="cancel-btn" onClick={() => setShowEditDeptModal(false)}>
                     İptal
                   </button>
                 </div>
               </form>
             </div>
           </div>
         )}

         {showEditPosModal && selectedPosition && (
           <div className="modal-overlay">
             <div className="modal-content">
               <h2>Pozisyon Düzenle</h2>
               <form onSubmit={handleUpdatePosition}>
                 <div className="form-group">
                   <label>Pozisyon Adı</label>
                   <input
                     type="text"
                     value={editPosFormData.name}
                     onChange={(e) => setEditPosFormData({...editPosFormData, name: e.target.value})}
                     required
                   />
                 </div>
                 <div className="form-group">
                   <label>Departman</label>
                   <select
                     value={editPosFormData.department}
                     onChange={(e) => setEditPosFormData({...editPosFormData, department: e.target.value, level: 1})}
                     required
                   >
                     <option value="">Departman seçin</option>
                     {departments.map(dept => (
                       <option key={dept._id} value={dept._id}>
                         {dept.name}
                       </option>
                     ))}
                   </select>
                 </div>
                 <div className="form-group">
                   <label>Seviye</label>
                   <select
                     value={editPosFormData.level}
                     onChange={(e) => setEditPosFormData({...editPosFormData, level: parseInt(e.target.value)})}
                     required
                   >
                     {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                       <option key={level} value={level}>
                         Seviye {level}
                       </option>
                     ))}
                   </select>
                 </div>
                 <div className="form-group">
                   <label>Açıklama</label>
                   <input
                     type="text"
                     value={editPosFormData.description}
                     onChange={(e) => setEditPosFormData({...editPosFormData, description: e.target.value})}
                   />
                 </div>
                 <div className="form-actions">
                   <button type="submit" className="submit-btn">
                     Pozisyonu Güncelle
                   </button>
                   <button type="button" className="cancel-btn" onClick={() => setShowEditPosModal(false)}>
                     İptal
                   </button>
                 </div>
               </form>
             </div>
           </div>
         )}

        {/* Fazla Mesai Teklifi Silme Onay Modal'ı */}
        {showDeleteConfirmModal && offerToDelete && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>⚠️ Fazla Mesai Teklifini Sil</h2>
              <div className="delete-confirmation">
                <p className="warning-text">
                  Bu fazla mesai teklifini silmek istediğinizden emin misiniz?
                </p>
                <div className="offer-details">
                  <div className="detail-item">
                    <strong>Departman:</strong> {offerToDelete.department?.name || 'Bilinmeyen'}
                  </div>
                  <div className="detail-item">
                    <strong>Hafta:</strong> {new Date(offerToDelete.weekStart).toLocaleDateString('tr-TR')}
                  </div>
                  <div className="detail-item">
                    <strong>Gerekli Saat:</strong> {offerToDelete.hoursRequired} saat
                  </div>
                  <div className="detail-item">
                    <strong>Bonus:</strong> {offerToDelete.bonusAmount} TL
                  </div>
                  {offerToDelete.note && (
                    <div className="detail-item">
                      <strong>Not:</strong> {offerToDelete.note}
                    </div>
                  )}
                  <div className="detail-item">
                    <strong>Durum:</strong> 
                    <span className={`status-${offerToDelete.status}`}>
                      {offerToDelete.status === 'open' && '🟢 Açık'}
                      {offerToDelete.status === 'accepted' && '✅ Kabul Edildi'}
                      {offerToDelete.status === 'closed' && '🔴 Kapalı'}
                    </span>
                  </div>
                  {offerToDelete.status === 'accepted' && (
                    <div className="detail-item">
                      <strong>Kabul Eden:</strong> {offerToDelete.acceptedBy && offerToDelete.acceptedBy.firstName && offerToDelete.acceptedBy.lastName ? `${offerToDelete.acceptedBy.firstName} ${offerToDelete.acceptedBy.lastName}` : 'Henüz kabul edilmedi'}
                    </div>
                  )}
                </div>
                <p className="warning-text">
                  <strong>⚠️ Uyarı:</strong> Bu işlem geri alınamaz!
                </p>
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="delete-btn" 
                  onClick={confirmDeleteOvertimeOffer}
                  style={{minWidth: '120px'}}
                >
                  🗑️ Evet, Sil
                </button>
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => {
                    setShowDeleteConfirmModal(false)
                    setOfferToDelete(null)
                  }}
                >
                  ❌ İptal
                </button>
              </div>
            </div>
          </div>
        )}

                 
      </div>

      {/* Sağ altta SMS panelini açan yüzen buton */}
      <button
        className="floating-sms-btn"
        onClick={() => {
          const toOpen = !showSmsPanel
          setShowSmsPanel(toOpen)
          if (toOpen) fetchAdminRequests()
        }}
        title="Talepler / SMS"
      >
        <span className="icon">💬</span>
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {showSmsPanel && (
        <div className="sms-panel">
          <div className="sms-panel-header">
            <h4>Talepler</h4>
            <div className="sp-actions">
              <button className="refresh-btn" onClick={fetchAdminRequests} disabled={loadingRequests}>
                {loadingRequests ? '...' : 'Yenile'}
              </button>
              <button className="close-btn" onClick={() => setShowSmsPanel(false)}>✕</button>
            </div>
          </div>
          <div className="sms-panel-body">
            {adminRequests.length === 0 ? (
              <p className="no-data">Talep yok</p>
            ) : (
              <ul className="sms-requests-list">
                {adminRequests.map(r => (
                  <li key={r._id} className="sms-request-item">
                    <div className="left">
                      <div className="title">{r.title}</div>
                      <div className="meta">{new Date(r.createdAt).toLocaleString('tr-TR')} — {r.user?.firstName} {r.user?.lastName}</div>
                      <label className="checkbox-label" style={{display:'inline-flex', alignItems:'center', gap:8, marginTop:6}}>
                        <input
                          type="checkbox"
                          checked={!!r.acknowledged}
                          onChange={async (e) => {
                            try {
                              const token = localStorage.getItem('token')
                              const resp = await fetch(`http://localhost:5000/api/requests/admin/${r._id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ acknowledged: e.target.checked })
                              })
                              if (!resp.ok) throw new Error('İşaretlenemedi')
                              const updated = await resp.json()
                              setAdminRequests(prev => prev.map(x => x._id === r._id ? updated : x))
                            } catch (err) {
                              alert('Hata: ' + err.message)
                            }
                          }}
                        />
                        <span className="checkmark" style={{width:18, height:18, borderColor: 'rgba(255,255,255,0.4)'}}></span>
                        {r.acknowledged ? <span style={{color:'#10b981', fontWeight:600}}>✔ İşaretlendi</span> : <span style={{color:'#9aa0a6'}}>İşaretle</span>}
                      </label>
                      <div className="msg">{r.message}</div>
                    </div>
                    <div className="right">
                      <select
                        className="req-status"
                        value={r.status}
                        onChange={async (e) => {
                          try {
                            const token = localStorage.getItem('token')
                            const resp = await fetch(`http://localhost:5000/api/requests/admin/${r._id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ status: e.target.value })
                            })
                            if (!resp.ok) throw new Error('Durum güncellenemedi')
                            const updated = await resp.json()
                            setAdminRequests(prev => prev.map(x => x._id === r._id ? updated : x))
                            setUnreadCount(prev => updated.status === 'open' ? prev : Math.max(0, prev - 1))
                          } catch (err) {
                            alert('Hata: ' + err.message)
                          }
                        }}
                      >
                        <option value="open">Açık</option>
                        <option value="in_progress">İşlemde</option>
                        <option value="closed">Kapalı</option>
                      </select>
                      <button
                        className="edit-btn"
                        onClick={async () => {
                          const responseText = prompt('Yanıt (isteğe bağlı):')
                          try {
                            const token = localStorage.getItem('token')
                            const resp = await fetch(`http://localhost:5000/api/requests/admin/${r._id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ status: 'in_progress', response: responseText || '' })
                            })
                            if (!resp.ok) throw new Error('Talep yanıtlanamadı')
                            const updated = await resp.json()
                            setAdminRequests(prev => prev.map(x => x._id === r._id ? updated : x))
                          } catch (err) {
                            alert('Hata: ' + err.message)
                          }
                        }}
                      >
                        Yanıtla
                      </button>
                      <button
                        className="delete-btn"
                        onClick={async () => {
                          if (!confirm('Talebi silmek istiyor musunuz?')) return;
                          try {
                            const token = localStorage.getItem('token')
                            const resp = await fetch(`http://localhost:5000/api/requests/admin/${r._id}`, {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${token}` }
                            })
                            if (!resp.ok) throw new Error('Talep silinemedi')
                            setAdminRequests(prev => prev.filter(x => x._id !== r._id))
                            setUnreadCount(prev => r.status === 'open' ? Math.max(0, prev - 1) : prev)
                          } catch (err) {
                            alert('Hata: ' + err.message)
                          }
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard 