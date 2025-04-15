import React, { useState, useEffect, useRef } from 'react';
import { FaStar, FaUser, FaThumbsUp, FaThumbsDown, FaSort, FaSortAmountDown } from 'react-icons/fa';

function ReviewsModal({ show, onClose, locationId, locationName }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("created_at"); // Default sort by date
  const [sortOrder, setSortOrder] = useState("-1"); // Default newest first
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [endMessage, setEndMessage] = useState(false);
  
  const observer = useRef();
  const lastReviewElementRef = useRef();
  
  const ITEMS_PER_PAGE = 5; // Number of reviews to fetch per page

  // Get current user email from session storage
  useEffect(() => {
    const email = sessionStorage.getItem('userEmail');
    setCurrentUserEmail(email);
  }, []);
  
  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (loading) return;
    
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const handleObserver = (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading) {
        loadMoreReviews();
      }
    };
    
    const currentObserver = new IntersectionObserver(handleObserver, options);
    
    if (lastReviewElementRef.current) {
      currentObserver.observe(lastReviewElementRef.current);
    }
    
    return () => {
      if (lastReviewElementRef.current) {
        currentObserver.disconnect();
      }
    };
  }, [lastReviewElementRef.current, hasMore, loading]);
  
  // Load initial reviews when modal opens or sort changes
  useEffect(() => {
    if (show && locationId) {
      setReviews([]);
      setPage(0);
      setHasMore(true);
      setEndMessage(false);
      loadMoreReviews(true); // true = reset
    }
  }, [show, locationId, sortBy, sortOrder]);
  
  const loadMoreReviews = async (reset = false) => {
    if (loading) return;
    
    const pageToLoad = reset ? 0 : page;
    
    setLoading(true);
    setError(null);
    
    try {
      const url = `http://localhost:5000/api/get_location_reviews?location_id=${locationId}&page=${pageToLoad}&limit=${ITEMS_PER_PAGE}&sort_by=${sortBy}&sort_order=${sortOrder}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const data = await res.json();
      
      if (data.reviews && data.reviews.length > 0) {
        if (reset) {
          setReviews(data.reviews);
        } else {
          setReviews(prevReviews => [...prevReviews, ...data.reviews]);
        }
        
        setPage(pageToLoad + 1);
        
        // Check if we've reached the end
        if (!data.has_more) {
          setHasMore(false);
          setEndMessage(true);
        } else {
          setHasMore(true);
        }
      } else {
        // No reviews returned
        setHasMore(false);
        if (reset) {
          // If this is the first load and we got no reviews
          setReviews([]);
        } else if (data.reviews && data.reviews.length === 0) {
          // If we loaded some reviews but have reached the end
          setEndMessage(true);
        }
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Failed to load reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      // Toggle sort order if clicking the same field
      setSortOrder(prev => prev === "-1" ? "1" : "-1");
    } else {
      // Set new sort field and default to descending order
      setSortBy(newSortBy);
      setSortOrder("-1");
    }
  };
  
  // Function to handle likes and dislikes
  const handleRateReview = async (reviewId, action) => {
    if (!currentUserEmail) {
      alert("Please log in to rate reviews");
      return;
    }
    
    try {
      // Get current review to determine the correct action
      const currentReview = reviews.find(review => review._id === reviewId);
      const currentUserVote = getUserVoteStatus(currentReview);
      
      // Determine the correct action based on current state and requested action
      let finalAction = action;
      
      // If clicking the same button that's already active, we should remove the vote
      if (currentUserVote === action) {
        finalAction = 'remove';
      }
      
      const res = await fetch("http://localhost:5000/api/rate_review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          review_id: reviewId,
          user_email: currentUserEmail,
          action: finalAction
        })
      });
      
      if (!res.ok) {
        throw new Error("Failed to rate review");
      }
      
      const data = await res.json();
      
      // Update the review in the state - create completely new likes/dislikes arrays
      setReviews(prevReviews => 
        prevReviews.map(review => {
          if (review._id === reviewId) {
            // Create fresh arrays for likes and dislikes
            let newLikes = [];
            let newDislikes = [];
            
            // If user liked, add them to likes
            if (finalAction === 'like') {
              newLikes = [...(review.likes || []).filter(email => email !== currentUserEmail), currentUserEmail];
              newDislikes = (review.dislikes || []).filter(email => email !== currentUserEmail);
            } 
            // If user disliked, add them to dislikes
            else if (finalAction === 'dislike') {
              newLikes = (review.likes || []).filter(email => email !== currentUserEmail);
              newDislikes = [...(review.dislikes || []).filter(email => email !== currentUserEmail), currentUserEmail];
            } 
            // If action was remove, remove from both arrays
            else if (finalAction === 'remove') {
              newLikes = (review.likes || []).filter(email => email !== currentUserEmail);
              newDislikes = (review.dislikes || []).filter(email => email !== currentUserEmail);
            }
            
            // Return updated review with new arrays
            return { 
              ...review, 
              likes: newLikes,
              dislikes: newDislikes,
              likes_count: data.likes_count, 
              dislikes_count: data.dislikes_count,
            };
          }
          return review;
        })
      );
    } catch (err) {
      console.error("Error rating review:", err);
      alert("Failed to rate review. Please try again.");
    }
  };

  // Function to determine if user has liked or disliked a review
  const getUserVoteStatus = (review) => {
    if (!currentUserEmail || !review.likes || !review.dislikes) return null;
    
    if (review.likes.includes(currentUserEmail)) return "like";
    if (review.dislikes.includes(currentUserEmail)) return "dislike";
    return null;
  };
  
  // Function to render stars based on rating
  const renderStars = (rating) => {
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <FaStar
            key={i}
            className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };
  
  // Function to format date properly for MongoDB ISO date strings
  const formatDate = (dateStr) => {
    if (!dateStr) return "No date available";
    
    try {
      // Create a new Date object from the ISO string
      const date = new Date(dateStr);
      
      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      
      return "Invalid date";
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Date error';
    }
  };
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[500px] max-w-[95vw] max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Reviews for {locationName}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Sorting options */}
        <div className="flex justify-start items-center mb-4 space-x-2 text-sm">
          <span className="text-gray-500">Sort by:</span>
          <button 
            className={`px-2 py-1 rounded ${sortBy === 'created_at' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'} flex items-center space-x-1`}
            onClick={() => handleSortChange('created_at')}
          >
            <span>Date</span>
            {sortBy === 'created_at' && (
              <span>{sortOrder === "-1" ? "↓" : "↑"}</span>
            )}
          </button>
          <button 
            className={`px-2 py-1 rounded ${sortBy === 'likes' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'} flex items-center space-x-1`}
            onClick={() => handleSortChange('likes')}
          >
            <span>Likes</span>
            {sortBy === 'likes' && (
              <span>{sortOrder === "-1" ? "↓" : "↑"}</span>
            )}
          </button>
        </div>
        
        <div className="overflow-y-auto flex-grow">
          {reviews.length === 0 && !loading && !error ? (
            <p className="text-center text-gray-500 py-6">No reviews yet for this location.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, index) => {
                // Check if this is the last element
                const isLastElement = index === reviews.length - 1;
                // Get user's vote status
                const userVote = getUserVoteStatus(review);
                
                return (
                  <div 
                    key={review._id || index} 
                    ref={isLastElement ? lastReviewElementRef : null}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 font-medium mr-3 overflow-hidden">
                          {review.profile_picture ? (
                            <img 
                              src={review.profile_picture}
                              alt={review.user_name || 'User'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg">{review.user_name ? review.user_name.charAt(0).toUpperCase() : 'A'}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{review.user_name || 'Anonymous User'}</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(review.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Like/Dislike buttons */}
                      {currentUserEmail && (
                        <div className="flex items-center space-x-2">
                          <button 
                            className={`flex items-center space-x-1 px-2 py-1 rounded ${userVote === 'like' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-blue-700'}`}
                            onClick={() => handleRateReview(review._id, 'like')}
                            title={userVote === 'like' ? "Remove like" : "Like this review"}
                          >
                            <FaThumbsUp size={14} />
                            <span>{review.likes_count || 0}</span>
                          </button>
                          <button 
                            className={`flex items-center space-x-1 px-2 py-1 rounded ${userVote === 'dislike' ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:text-red-700'}`}
                            onClick={() => handleRateReview(review._id, 'dislike')}
                            title={userVote === 'dislike' ? "Remove dislike" : "Dislike this review"}
                          >
                            <FaThumbsDown size={14} />
                            <span>{review.dislikes_count || 0}</span>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                      <div>
                        <span className="text-xs text-gray-600">Quietness</span>
                        {renderStars(review.quietness)}
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Seating</span>
                        {renderStars(review.seating)}
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Vibes</span>
                        {renderStars(review.vibes)}
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Busyness</span>
                        {renderStars(review.crowdedness)}
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Internet</span>
                        {renderStars(review.internet)}
                      </div>
                    </div>
                    
                    {review.comment && (
                      <div className="mt-2 text-sm">
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {loading && (
                <div className="py-4 text-center">
                  <div className="inline-block animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
                  <span className="ml-2 text-gray-600">Loading more reviews...</span>
                </div>
              )}
              
              {error && (
                <div className="py-4 text-center text-red-500">
                  {error}
                  <button 
                    onClick={() => loadMoreReviews()} 
                    className="ml-2 text-blue-500 hover:underline"
                  >
                    Try Again
                  </button>
                </div>
              )}
              
              {endMessage && !loading && reviews.length > 0 && (
                <div className="py-3 text-center text-gray-500 text-sm">
                  No more reviews to load
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewsModal; 