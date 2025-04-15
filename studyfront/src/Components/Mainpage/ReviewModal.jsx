import React, { useState, useEffect } from 'react';

const StarRating = ({ rating, setRating }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div>
      {stars.map((star, index) => (
        <span
          key={index}
          onClick={() => setRating(star)}
          style={{ cursor: "pointer", fontSize: "1.5rem", color: star <= rating ? "#FFD700" : "#ccc", marginRight: "4px" }}
        >
          {star <= rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
};

function ReviewModal({ show, onCancel, onSubmit, existingReview }) {
  const [quietness, setQuietness] = useState(existingReview ? existingReview.quietness : 0);
  const [seating, setSeating] = useState(existingReview ? existingReview.seating : 0);
  const [vibes, setVibes] = useState(existingReview ? existingReview.vibes : 0);
  const [crowdedness, setCrowdedness] = useState(existingReview ? existingReview.crowdedness : 0);
  const [internet, setInternet] = useState(existingReview ? existingReview.internet : 0);
  const [comment, setComment] = useState(existingReview ? existingReview.comment : '');

  useEffect(() => {
    if (existingReview) {
      setQuietness(existingReview.quietness);
      setSeating(existingReview.seating);
      setVibes(existingReview.vibes);
      setCrowdedness(existingReview.crowdedness);
      setInternet(existingReview.internet);
      setComment(existingReview.comment || '');
    }
  }, [existingReview]);

  if (!show) return null;

  const handleSubmit = () => {
    onSubmit({ quietness, seating, vibes, crowdedness, internet, comment });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded shadow p-6 w-80">
        <h2 className="text-lg font-bold mb-4">{existingReview ? 'Edit Your Review' : 'Add User Review'}</h2>
        
        <div className="mb-4">
          <label className="block text-sm">Quietness / Noise</label>
          <StarRating rating={quietness} setRating={setQuietness} />
        </div>
        <div className="mb-4">
          <label className="block text-sm">Seating</label>
          <StarRating rating={seating} setRating={setSeating} />
        </div>
        <div className="mb-4">
          <label className="block text-sm">Vibes</label>
          <StarRating rating={vibes} setRating={setVibes} />
        </div>
        <div className="mb-4">
          <label className="block text-sm">Crowdedness</label>
          <StarRating rating={crowdedness} setRating={setCrowdedness} />
        </div>
        <div className="mb-4">
          <label className="block text-sm">Internet</label>
          <StarRating rating={internet} setRating={setInternet} />
        </div>
        <div className="mb-4">
          <label className="block text-sm">Comment (optional)</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full border p-1" rows="3" placeholder="Share your thoughts..."></textarea>
        </div>
        <div className="flex justify-end">
          <button onClick={onCancel} className="mr-2 px-3 py-1 rounded bg-gray-300 hover:bg-gray-400">Cancel</button>
          <button onClick={handleSubmit} className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">{existingReview ? 'Update' : 'Submit'}</button>
        </div>
      </div>
    </div>
  );
}

export default ReviewModal; 