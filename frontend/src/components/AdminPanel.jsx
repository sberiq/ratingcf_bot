import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  LogOut, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Users, 
  MessageCircle, 
  Tag, 
  Shield,
  ArrowLeft
} from 'lucide-react';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('channels');
  const [channels, setChannels] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [tags, setTags] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // Form states
  const [newTagName, setNewTagName] = useState('');
  const [newAdminData, setNewAdminData] = useState({ username: '', password: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [channelsRes, reviewsRes, tagsRes, adminsRes] = await Promise.all([
        fetch('/api/admin/channels/pending', { headers }),
        fetch('/api/admin/reviews/pending', { headers }),
        fetch('/api/admin/tags', { headers }),
        fetch('/api/admin/admins', { headers })
      ]);

      if (channelsRes.ok) setChannels(await channelsRes.json());
      if (reviewsRes.ok) setReviews(await reviewsRes.json());
      if (tagsRes.ok) setTags(await tagsRes.json());
      if (adminsRes.ok) setAdmins(await adminsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const handleChannelAction = async (channelId, action) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/channels/${channelId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setChannels(prev => prev.filter(ch => ch.id !== channelId));
        setMessage(`Канал ${action === 'approve' ? 'одобрен' : 'отклонен'}`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Ошибка при выполнении действия');
    }
  };

  const handleReviewAction = async (reviewId, action) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/reviews/${reviewId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
        setMessage(`Отзыв ${action === 'approve' ? 'одобрен' : 'отклонен'}`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Ошибка при выполнении действия');
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newTagName.trim() })
      });

      if (response.ok) {
        const newTag = await response.json();
        setTags(prev => [...prev, newTag]);
        setNewTagName('');
        setMessage('Тег создан');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Ошибка при создании тега');
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('Удалить этот тег?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/tags/${tagId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setTags(prev => prev.filter(t => t.id !== tagId));
        setMessage('Тег удален');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Ошибка при удалении тега');
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminData.username.trim() || !newAdminData.password.trim()) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAdminData)
      });

      if (response.ok) {
        const newAdmin = await response.json();
        setAdmins(prev => [...prev, newAdmin]);
        setNewAdminData({ username: '', password: '' });
        setMessage('Админ создан');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Ошибка при создании админа');
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Удалить этого админа?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setAdmins(prev => prev.filter(a => a.id !== adminId));
        setMessage('Админ удален');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Ошибка при удалении админа');
    }
  };

  const handleApproveTag = async (tagId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/tags/${tagId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setTags(prev => prev.filter(t => t.id !== tagId));
        setMessage('Тег одобрен');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Ошибка при модерации тега');
    }
  };
  const handleRejectTag = async (tagId) => {
    if (!window.confirm('Отклонить и удалить этот тег?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/tags/${tagId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setTags(prev => prev.filter(t => t.id !== tagId));
        setMessage('Тег отклонен и удален');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Ошибка при модерации тега');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} className="mr-2" />
          Назад
        </button>
        <h1 className="text-xl font-semibold flex items-center">
          <Shield size={24} className="mr-3" />
          Админ панель
        </h1>
        <button
          onClick={handleLogout}
          className="flex items-center text-red-400 hover:text-red-300 transition-colors"
        >
          <LogOut size={24} className="mr-2" />
          Выйти
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className="mx-6 mt-4 p-4 bg-green-900 border border-green-700 rounded-2xl text-center">
          <p className="text-green-300">{message}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-6">
        {[
          { id: 'channels', label: 'Каналы', icon: MessageCircle, count: channels.length },
          { id: 'reviews', label: 'Отзывы', icon: MessageCircle, count: reviews.length },
          { id: 'tags', label: 'Теги', icon: Tag, count: tags.length },
          { id: 'admins', label: 'Админы', icon: Users, count: admins.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-6 py-4 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <tab.icon size={20} className="mr-2" />
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 bg-gray-700 text-white text-xs px-2 py-1 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Channels Tab */}
          {activeTab === 'channels' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-6">Каналы на модерации</h2>
              {channels.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle size={48} className="text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Нет каналов на модерации</p>
                </div>
              ) : (
                channels.map((channel) => (
                  <div key={channel.id} className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{channel.title}</h3>
                        {channel.description && (
                          <p className="text-gray-300 mb-3">{channel.description}</p>
                        )}
                        <a
                          href={channel.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          {channel.link}
                        </a>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleChannelAction(channel.id, 'approve')}
                          className="bg-green-600 hover:bg-green-700 p-3 rounded-xl transition-colors"
                          title="Одобрить"
                        >
                          <Check size={20} />
                        </button>
                        <button
                          onClick={() => handleChannelAction(channel.id, 'reject')}
                          className="bg-red-600 hover:bg-red-700 p-3 rounded-xl transition-colors"
                          title="Отклонить"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-6">Отзывы на модерации</h2>
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle size={48} className="text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Нет отзывов на модерации</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm text-gray-400">
                            {review.is_anonymous ? 'Аноним' : review.nickname}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-2">{review.text}</p>
                        <p className="text-sm text-gray-400">
                          Канал: <span className="text-blue-400">{review.channel_title}</span>
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleReviewAction(review.id, 'approve')}
                          className="bg-green-600 hover:bg-green-700 p-3 rounded-xl transition-colors"
                          title="Одобрить"
                        >
                          <Check size={20} />
                        </button>
                        <button
                          onClick={() => handleReviewAction(review.id, 'reject')}
                          className="bg-red-600 hover:bg-red-700 p-3 rounded-xl transition-colors"
                          title="Отклонить"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tags Tab */}
          {activeTab === 'tags' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Управление тегами</h2>
              
              {/* Create Tag Form */}
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Создать новый тег</h3>
                <form onSubmit={handleCreateTag} className="flex space-x-4">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Название тега"
                    className="flex-1 bg-gray-800 border-2 border-gray-700 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-200 flex items-center"
                  >
                    <Plus size={20} className="mr-2" />
                    Создать
                  </button>
                </form>
              </div>

              {tags.some(tag => tag.status === 'pending') && (
                <div className="bg-gray-900 border border-yellow-600 rounded-2xl p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-yellow-400">Ожидают модерации</h3>
                  <div className="space-y-3">
                    {tags.filter(tag => tag.status === 'pending').map(tag => (
                      <div key={tag.id} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl p-3">
                        <span className="text-lg font-medium text-yellow-300">{tag.name}</span>
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveTag(tag.id)} className="bg-green-600 hover:bg-green-700 p-2 rounded-xl transition-colors" title="Одобрить"><Check size={18} /></button>
                          <button onClick={() => handleRejectTag(tag.id)} className="bg-red-600 hover:bg-red-700 p-2 rounded-xl transition-colors" title="Отклонить"><X size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags List */}
              <div className="space-y-3">
                {tags.map((tag) => (
                  <div key={tag.id} className="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-lg font-medium">{tag.name}</span>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="bg-red-600 hover:bg-red-700 p-2 rounded-xl transition-colors"
                      title="Удалить тег"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admins Tab */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Управление админами</h2>
              
              {/* Create Admin Form */}
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Создать нового админа</h3>
                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newAdminData.username}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Имя пользователя"
                      className="bg-gray-800 border-2 border-gray-700 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      required
                    />
                    <input
                      type="password"
                      value={newAdminData.password}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Пароль"
                      className="bg-gray-800 border-2 border-gray-700 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-200 flex items-center"
                  >
                    <Plus size={20} className="mr-2" />
                    Создать админа
                  </button>
                </form>
              </div>

              {/* Admins List */}
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div key={admin.id} className="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <Users size={20} className="text-white" />
                      </div>
                      <span className="text-lg font-medium">{admin.username}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="bg-red-600 hover:bg-red-700 p-2 rounded-xl transition-colors"
                      title="Удалить админа"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 