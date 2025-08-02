import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AddChannel() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const addNewTag = async () => {
    const cleanTag = newTag.trim();
    if (!cleanTag || tags.find(t => t.name.toLowerCase() === cleanTag.toLowerCase())) return;
    try {
      const response = await fetch('/api/tags/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanTag })
      });
      if (response.ok) {
        setMessage('Тег отправлен на модерацию!');
        setNewTag('');
      } else {
        setMessage('Ошибка при отправке тега');
      }
    } catch {
      setMessage('Ошибка при отправке тега');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          link,
          tags: selectedTags
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Канал успешно добавлен! Он будет проверен администратором.');
        setTitle('');
        setDescription('');
        setLink('');
        setSelectedTags([]);
      } else {
        setMessage(data.error || 'Ошибка при добавлении канала');
      }
    } catch (error) {
      setMessage('Ошибка при добавлении канала');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="channel-detail-container">
      <div className="channel-header">
        <Link to="/" className="back-button">
          <ArrowLeft size={24} className="mr-2" />
          Назад
        </Link>
        <h1 className="text-xl font-semibold">Добавить канал</h1>
        <div className="w-8"></div>
      </div>
      <div className="channel-content">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="review-form space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Название канала *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Введите название канала" className="review-textarea" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Описание</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Краткое описание канала" rows="3" className="review-textarea" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ссылка на канал *</label>
              <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://t.me/channel_name" className="review-textarea" required />
              <p className="text-xs text-gray-500 mt-1">Формат: https://t.me/channel_name</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Теги</label>
              <div className="tags-container">
                {tags.map((tag) => (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} className={`tag ${selectedTags.includes(tag.id) ? 'bg-blue-600 border-blue-500 text-white' : ''}`}>
                    {tag.name}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Предложить новый тег</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newTag} 
                    onChange={(e) => setNewTag(e.target.value)} 
                    placeholder="Введите название тега" 
                    className="review-textarea flex-1" 
                  />
                  <button 
                    type="button" 
                    onClick={addNewTag}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    Добавить
                  </button>
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? (<><Loader2 size={20} className="animate-spin mr-3" />Загрузка...</>) : (<>Добавить канал</>)}
            </button>
            {message && (
              <div className={`mt-4 p-3 rounded-2xl text-center ${message.includes('успешно') ? 'bg-green-900 border border-green-700 text-green-300' : 'bg-red-900 border border-red-700 text-red-300'}`}>
                {message}
              </div>
            )}
            <div className="review-form mt-6">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-1">Модерация</h3>
                  <p className="text-gray-300 text-sm">Ваш канал будет проверен администратором перед публикацией. Обычно это занимает несколько часов.</p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 