import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, MessageCircle, Send, User, EyeOff } from 'lucide-react';

const ChannelDetail = () => {
  const { id } = useParams();
  const [channel, setChannel] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  
  const [reviewData, setReviewData] = useState({
    text: '',
    nickname: '',
    isAnonymous: false,
    rating: 5
  });

  useEffect(() => {
    fetchChannelData();
  }, [id]);

  const fetchChannelData = async () => {
    try {
      const [channelResponse, reviewsResponse] = await Promise.all([
        fetch(`/api/channels/${id}`),
        fetch(`/api/channels/${id}/reviews`)
      ]);
      
      const channelData = await channelResponse.json();
      const reviewsData = await reviewsResponse.json();
      
      setChannel(channelData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching channel data:', error);
      setMessage('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!reviewData.text.trim()) {
      setMessage('Пожалуйста, напишите отзыв');
      return;
    }

    if (!reviewData.isAnonymous && !reviewData.nickname.trim()) {
      setMessage('Пожалуйста, укажите никнейм или выберите анонимный отзыв');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(`/api/channels/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: reviewData.text.trim(),
          nickname: reviewData.isAnonymous ? '' : reviewData.nickname.trim(),
          isAnonymous: reviewData.isAnonymous,
          rating: reviewData.rating
        }),
      });

      if (response.ok) {
        setMessage('Отзыв успешно отправлен! Ожидает модерации.');
        setReviewData({ text: '', nickname: '', isAnonymous: false, rating: 5 });
        setTimeout(() => {
          fetchChannelData(); // Refresh reviews
        }, 2000);
      } else {
        const error = await response.json();
        setMessage(error.message || 'Ошибка при отправке отзыва');
      }
    } catch (error) {
      setMessage('Ошибка сети. Попробуйте еще раз.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, interactive = false, onStarClick = null) => {
    const rounded = Math.round(rating * 2) / 2;
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={28}
            fill={star <= rounded ? '#FFD600' : 'none'}
            stroke={star <= rounded ? '#FFD600' : '#444'}
            className={`star ${interactive ? 'cursor-pointer hover:scale-125 transition-transform duration-100' : ''}`}
            onClick={() => interactive && onStarClick && onStarClick(star)}
          />
        ))}
      </div>
    );
  };

  const renderRating = () => {
    if (reviews.length === 0) {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm">0 из 5</span>
          <span className="text-gray-400 text-sm">(0 отзывов)</span>
        </div>
      );
    }
    
    // Calculate average rating from reviews
    const avgRating = reviews.reduce((sum, review) => sum + (review.rating || 5), 0) / reviews.length;
    
    return (
      <div className="flex items-center space-x-2">
        {renderStars(Math.round(avgRating))}
        <span className="text-yellow-400 font-semibold">{avgRating.toFixed(1)}</span>
        <span className="text-gray-400 text-sm">({reviews.length} отзывов)</span>
      </div>
    );
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

  if (!channel) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Канал не найден</p>
          <Link
            to="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="channel-detail-container">
      {/* Header */}
      <div className="channel-header">
        <Link
          to="/"
          className="back-button"
        >
          <ArrowLeft size={24} className="mr-2" />
          Назад
        </Link>
        <h1 className="text-xl font-semibold">Детали канала</h1>
        <div className="w-8"></div> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="channel-content">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Channel Info */}
          <div className="channel-info-card">
            <div className="flex items-start justify-between mb-4">
              <h2 className="channel-info-title">{channel.title}</h2>
              {renderRating()}
            </div>
            
            {channel.description && (
              <p className="channel-info-description">{channel.description}</p>
            )}
            
            <div className="channel-info-footer">
              <div className="tags-container">
                {channel.tags && channel.tags.split(',').map((tag, index) => (
                  <span key={index} className="tag">
                    {tag.trim()}
                  </span>
                ))}
              </div>
              
              <a
                href={channel.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors flex items-center"
              >
                <MessageCircle size={16} className="mr-2" />
                Перейти
              </a>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="reviews-section">
            <h3 className="reviews-title">
              <MessageCircle size={24} className="mr-3" />
              Отзывы ({reviews.length})
            </h3>

            {/* Add Review Form */}
            <div className="review-form">
              <h4 className="review-form-title">Оставить отзыв</h4>
              
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <textarea
                    value={reviewData.text}
                    onChange={(e) => setReviewData(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Напишите ваш отзыв..."
                    rows="4"
                    className="review-textarea"
                    required
                  />
                </div>

                <div className="review-options">
                  <div className="flex items-center space-x-4">
                    <label className="anonymous-checkbox">
                      <input
                        type="checkbox"
                        checked={reviewData.isAnonymous}
                        onChange={(e) => setReviewData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                      />
                      <EyeOff size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-300">Анонимно</span>
                    </label>
                  </div>
                  
                  <div className="rating-selector">
                    <span className="rating-selector-label">Рейтинг:</span>
                    <div className="stars-container">
                      {renderStars(reviewData.rating, true, (star) => 
                        setReviewData(prev => ({ ...prev, rating: star }))
                      )}
                    </div>
                    <span className="rating-text">({reviewData.rating}/5)</span>
                  </div>
                </div>

                {!reviewData.isAnonymous && (
                  <div>
                    <input
                      type="text"
                      value={reviewData.nickname}
                      onChange={(e) => setReviewData(prev => ({ ...prev, nickname: e.target.value }))}
                      placeholder="Ваш никнейм"
                      className="w-full bg-gray-800 border-2 border-gray-700 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="submit-button"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send size={18} className="mr-3" />
                      Отправить отзыв
                    </>
                  )}
                </button>
              </form>

              {message && (
                <div className={`mt-4 p-3 rounded-2xl text-center ${
                  message.includes('успешно') 
                    ? 'bg-green-900 border border-green-700 text-green-300'
                    : 'bg-red-900 border border-red-700 text-red-300'
                }`}>
                  {message}
                </div>
              )}
            </div>

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <div className="review-author">
                        {review.is_anonymous ? (
                          <div className="author-avatar anonymous">
                            <User size={16} className="text-gray-400" />
                          </div>
                        ) : (
                          <div className="author-avatar">
                            <span className="text-white text-sm font-medium">
                              {review.nickname.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="author-info">
                          <p className="author-name">
                            {review.is_anonymous ? 'Аноним' : review.nickname}
                          </p>
                          <p className="review-date">
                            {new Date(review.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <div className="review-rating">
                        <div className="stars-container">
                          {renderStars(review.rating || 5)}
                        </div>
                        <span className="rating-text">({review.rating || 5}/5)</span>
                      </div>
                    </div>
                    <p className="review-text">{review.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-reviews">
                <MessageCircle size={48} className="empty-reviews-icon" />
                <p className="empty-reviews-text">Пока нет отзывов</p>
                <p className="empty-reviews-subtext">Будьте первым!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelDetail; 