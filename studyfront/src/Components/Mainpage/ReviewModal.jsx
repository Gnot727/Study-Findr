import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';

const StarRating = ({ rating, setRating }) => {
  const [hover, setHover] = useState(0);
  const stars = [1, 2, 3, 4, 5];
  
  return (
    <div className="flex">
      {stars.map((star) => (
        <div
          key={star}
          className="cursor-pointer p-1"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        >
          <FaStar 
            size={24} 
            color={(hover || rating) >= star ? "#FFD700" : "#e4e5e9"} 
            className="transition-colors duration-150"
          />
        </div>
      ))}
    </div>
  );
};

function ReviewModal({ show, onCancel, onSubmit, existingReview }) {
  const [quietness, setQuietness] = useState(existingReview ? existingReview.quietness : 0);
  const [seating, setSeating] = useState(existingReview ? existingReview.seating : 0);
  const [vibes, setVibes] = useState(existingReview ? existingReview.vibes : 0);
  const [busyness, setBusyness] = useState(existingReview ? existingReview.crowdedness : 0);
  const [internet, setInternet] = useState(existingReview ? existingReview.internet : 0);
  const [comment, setComment] = useState(existingReview ? existingReview.comment : '');

  useEffect(() => {
    if (existingReview) {
      setQuietness(existingReview.quietness);
      setSeating(existingReview.seating);
      setVibes(existingReview.vibes);
      setBusyness(existingReview.crowdedness);
      setInternet(existingReview.internet);
      setComment(existingReview.comment || '');
    } else {
      setQuietness(0);
      setSeating(0);
      setVibes(0);
      setBusyness(0);
      setInternet(0);
      setComment('');
    }
  }, [existingReview]);

  if (!show) return null;

  const handleSubmit = () => {
    onSubmit({ 
      quietness, 
      seating, 
      vibes, 
      crowdedness: busyness, // Map busyness back to crowdedness for backend compatibility
      internet, 
      comment 
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-[90vw]">
        <h2 className="text-xl font-bold mb-5 text-gray-800 border-b pb-2">
          {existingReview ? 'Edit Your Review' : 'Add User Review'}
        </h2>
        
        <div className="space-y-5">
          <div className="rating-item">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quietness</label>
            <StarRating rating={quietness} setRating={setQuietness} />
          </div>
          
          <div className="rating-item">
            <label className="block text-sm font-medium text-gray-700 mb-1">Seating</label>
            <StarRating rating={seating} setRating={setSeating} />
          </div>
          
          <div className="rating-item">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vibes</label>
            <StarRating rating={vibes} setRating={setVibes} />
          </div>
          
          <div className="rating-item">
            <label className="block text-sm font-medium text-gray-700 mb-1">Busyness</label>
            <StarRating rating={busyness} setRating={setBusyness} />
          </div>
          
          <div className="rating-item">
            <label className="block text-sm font-medium text-gray-700 mb-1">Internet</label>
            <StarRating rating={internet} setRating={setInternet} />
          </div>
          
          <div className="rating-item pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
            <textarea 
              value={comment} 
              onChange={e => setComment(e.target.value)} 
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              rows="3" 
              placeholder="Share your thoughts..."
            ></textarea>
          </div>
        </div>
        
        <div className="flex justify-end mt-6 pt-4 border-t">
          <button 
            onClick={onCancel} 
            className="mr-3 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
          >
            {existingReview ? 'Update' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewModal;