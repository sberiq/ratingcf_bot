import React, { useState } from 'react';
import { Search, Plus, Settings, HelpCircle, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const url = `/api/channels?search=${encodeURIComponent(searchQuery.trim())}`;
      console.log('Searching with URL:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let data = await response.json();
      console.log('Search results:', data);
      
      setChannels(data);
    } catch (error) {
      console.error('Error searching channels:', error);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const renderStars = (rating) => {
    const rounded = Math.round(rating);
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={18}
            fill={star <= rounded ? '#fbbf24' : 'none'}
            stroke={star <= rounded ? '#fbbf24' : '#6b7280'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="homepage-absroot">
      <div className="homepage-centerblock">
        <h1 className="homepage-title">@ratingcf_bot</h1>
        <div className="homepage-madeby">made by <span className="homepage-mono">@cfmacan x 
@adzuconf</span></div>
        <div className="homepage-searchrow">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="homepage-searchinput"
            placeholder="поиск"
            autoComplete="off"
          />
          <button 
            className="homepage-searchbtn" 
            onClick={handleSearch}
            disabled={loading}
          >
            <Search size={30} className="homepage-searchicon" />
          </button>
        </div>
        <div className="homepage-searchlabel">поиск</div>
        <div className="homepage-rowbtns">
          <Link to="/add-channel" className="homepage-bluebtn">
            <Plus size={25} className="homepage-blueicon" />Добавить канал
          </Link>
          <Link to="/admin" className="homepage-bluebtn">
            <Settings size={25} className="homepage-blueicon" />Админ панель
          </Link>
        </div>
        <div className="homepage-info-block">
          <div className="homepage-info-title">Что умеет этот бот?</div>
          <div className="homepage-info-desc">
            В этом боте вы можете искать кф по названию или тегам, а также оставлять на них отзывы публично или анонимно.<br/>
            Это поможет людям находить интересующие их кр намного проще, чем через поиск Telegram или вп.<br/>
            <span className="homepage-info-highlight">(!) По всем вопросам писать прямо в бота</span>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="search-results-container">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Поиск...</p>
            </div>
          ) : channels.length > 0 ? (
            <div className="space-y-4">
              <h2 className="search-results-title">
                Показано - {channels.length} результатов
              </h2>
              {channels.map((channel) => (
                <div key={channel.id} className="channel-card">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="channel-title">{channel.title}</h3>
                  </div>
                  
                  {channel.description && (
                    <p className="channel-description">{channel.description}</p>
                  )}
                  
                  <div className="rating-section">
                    <span className="rating-label">Рейтинг:</span>
                    {renderStars(channel.avgRating)}
                    <span className="rating-text">{channel.avgRating ? channel.avgRating.toFixed(1) : '0'} из 5</span>
                    <span className="rating-text ml-2">({channel.reviewCount} отзывов)</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="tags-container">
                      {channel.tags && channel.tags.split(',').map((tag, index) => (
                        <span key={index} className="tag">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-end gap-3 mt-4">
                      <Link to={`/channel/${channel.id}`} className="details-button">Подробнее</Link>
                      <a href={channel.link} target="_blank" rel="noopener noreferrer" className="details-button">Перейти</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">Каналы не найдены</p>
              <p className="text-gray-500 text-sm">Попробуйте изменить поисковый запрос</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 