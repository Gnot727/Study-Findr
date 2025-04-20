import React, { useState, useRef, useEffect } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import "./myMap.css";
import {
  FaBookmark,
  FaRegBookmark,
  FaComments,
  FaThumbsUp,
  FaThumbsDown,
} from "react-icons/fa";
import {
  FaMapMarkerAlt,
  FaBook,
  FaCoffee,
  FaUtensils,
  FaStore,
  FaUniversity,
} from "react-icons/fa";
import ReviewModal from "./ReviewModal";

//npm install "@vis.gl/react-google-maps"
//npm install react-icons
/**
 * @typedef {Object} PointOfInterest
 * @property {number} id
 * @property {Object} position
 * @property {number} position.lat``
 * @property {number} position.lng
 * @property {string} name
 * @property {string} [description]
 * @property {string} [type]
 * @property {Object} [hours]
 * @property {string} hours.open
 * @property {string} hours.close
 * @property {string[]} hours.days - Array of days the library is open
 * @property {string} [address]
 */

// Comments Modal Component for displaying and interacting with reviews
const CommentsModal = ({
  isOpen,
  onClose,
  locationId,
  locationName,
  renderStars,
}) => {
  const modalRef = useRef(null);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [endMessage, setEndMessage] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("-1");

  const lastReviewElementRef = useRef(null);
  const ITEMS_PER_PAGE = 5;

  // Get current user email from session storage
  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    setCurrentUserEmail(email);
  }, []);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (loading) return;

    const options = {
      root: null,
      rootMargin: "20px",
      threshold: 0.1,
    };

    const handleObserver = (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading) {
        loadMoreReviews();
      }
    };

    const observer = new IntersectionObserver(handleObserver, options);
    if (lastReviewElementRef.current)
      observer.observe(lastReviewElementRef.current);
    return () => lastReviewElementRef.current && observer.disconnect();
  }, [lastReviewElementRef.current, hasMore, loading]);

  // Always reset and fetch reviews when modal opens or locationId changes
  useEffect(() => {
    if (isOpen && locationId) {
      setReviews([]);
      setPage(0);
      setHasMore(true);
      setEndMessage(false);
      loadMoreReviews(true); // true = reset
    }
  }, [isOpen, locationId, sortBy, sortOrder]);

  const loadMoreReviews = async (reset = false) => {
    if (loading) return;

    const pageToLoad = reset ? 0 : page;

    setLoading(true);
    setError(null);

    try {
      const url = `http://localhost:5000/api/get_location_reviews?location_id=${locationId}&page=${pageToLoad}&limit=${ITEMS_PER_PAGE}&sort_by=${sortBy}&sort_order=${sortOrder}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await res.json();

      if (data.reviews && data.reviews.length > 0) {
        if (reset) {
          setReviews(data.reviews);
        } else {
          setReviews((prevReviews) => [...prevReviews, ...data.reviews]);
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
      setSortOrder((prev) => (prev === "-1" ? "1" : "-1"));
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
      const currentReview = reviews.find((review) => review._id === reviewId);
      const currentUserVote = getUserVoteStatus(currentReview);

      // Determine the correct action based on current state and requested action
      let finalAction = action;

      // If clicking the same button that's already active, we should remove the vote
      if (currentUserVote === action) {
        finalAction = "remove";
      }

      const res = await fetch("http://localhost:5000/api/rate_review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          review_id: reviewId,
          user_email: currentUserEmail,
          action: finalAction,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to rate review");
      }

      const data = await res.json();

      // Update the review in the state - create completely new likes/dislikes arrays
      setReviews((prevReviews) =>
        prevReviews.map((review) => {
          if (review._id === reviewId) {
            // Create fresh arrays for likes and dislikes
            let newLikes = [];
            let newDislikes = [];

            // If user liked, add them to likes
            if (finalAction === "like") {
              newLikes = [
                ...(review.likes || []).filter(
                  (email) => email !== currentUserEmail
                ),
                currentUserEmail,
              ];
              newDislikes = (review.dislikes || []).filter(
                (email) => email !== currentUserEmail
              );
            }
            // If user disliked, add them to dislikes
            else if (finalAction === "dislike") {
              newLikes = (review.likes || []).filter(
                (email) => email !== currentUserEmail
              );
              newDislikes = [
                ...(review.dislikes || []).filter(
                  (email) => email !== currentUserEmail
                ),
                currentUserEmail,
              ];
            }
            // If action was remove, remove from both arrays
            else if (finalAction === "remove") {
              newLikes = (review.likes || []).filter(
                (email) => email !== currentUserEmail
              );
              newDislikes = (review.dislikes || []).filter(
                (email) => email !== currentUserEmail
              );
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col"
        ref={modalRef}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold">Reviews for {locationName}</h3>
          <button
            className="text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Sorting options */}
        <div className="flex justify-start items-center p-4 pb-2 space-x-2 text-sm">
          <span className="text-gray-500">Sort by:</span>
          <button
            className={`px-2 py-1 rounded ${
              sortBy === "created_at"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600"
            } flex items-center space-x-1`}
            onClick={() => handleSortChange("created_at")}
          >
            <span>Date</span>
            {sortBy === "created_at" && (
              <span>{sortOrder === "-1" ? "↓" : "↑"}</span>
            )}
          </button>
          <button
            className={`px-2 py-1 rounded ${
              sortBy === "likes"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600"
            } flex items-center space-x-1`}
            onClick={() => handleSortChange("likes")}
          >
            <span>Likes</span>
            {sortBy === "likes" && (
              <span>{sortOrder === "-1" ? "↓" : "↑"}</span>
            )}
          </button>
        </div>

        <div
          className="overflow-y-auto flex-grow p-4 pt-2"
          style={{ overscrollBehavior: "contain" }}
        >
          {reviews.length > 0 ? (
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
                    className="border rounded-lg p-3 bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden mr-2">
                          {review.profile_picture ? (
                            <img
                              src={review.profile_picture}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 font-bold">
                              {(review.user_name || "A")[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-sm">
                            {review.user_name || "Anonymous User"}
                          </span>
                          <div className="text-xs text-gray-500">
                            {new Date(
                              review.created_at || Date.now()
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Like/Dislike buttons */}
                      {currentUserEmail && (
                        <div className="flex items-center space-x-1">
                          <button
                            className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs ${
                              userVote === "like"
                                ? "bg-blue-100 text-blue-700"
                                : "text-gray-500 hover:text-blue-700"
                            }`}
                            onClick={() => handleRateReview(review._id, "like")}
                            title={
                              userVote === "like"
                                ? "Remove like"
                                : "Like this review"
                            }
                          >
                            <FaThumbsUp size={12} />
                            <span>{review.likes_count || 0}</span>
                          </button>
                          <button
                            className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs ${
                              userVote === "dislike"
                                ? "bg-red-100 text-red-700"
                                : "text-gray-500 hover:text-red-700"
                            }`}
                            onClick={() =>
                              handleRateReview(review._id, "dislike")
                            }
                            title={
                              userVote === "dislike"
                                ? "Remove dislike"
                                : "Dislike this review"
                            }
                          >
                            <FaThumbsDown size={12} />
                            <span>{review.dislikes_count || 0}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="text-xs">
                        <div className="font-medium text-gray-700">
                          Quietness
                        </div>
                        <div className="flex items-center">
                          {renderStars(review.quietness)}
                          <span className="ml-1 text-gray-600">
                            {review.quietness}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs">
                        <div className="font-medium text-gray-700">Seating</div>
                        <div className="flex items-center">
                          {renderStars(review.seating)}
                          <span className="ml-1 text-gray-600">
                            {review.seating}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs">
                        <div className="font-medium text-gray-700">Vibes</div>
                        <div className="flex items-center">
                          {renderStars(review.vibes)}
                          <span className="ml-1 text-gray-600">
                            {review.vibes}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs">
                        <div className="font-medium text-gray-700">
                          Busyness
                        </div>
                        <div className="flex items-center">
                          {renderStars(review.crowdedness)}
                          <span className="ml-1 text-gray-600">
                            {review.crowdedness}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs">
                        <div className="font-medium text-gray-700">
                          Internet
                        </div>
                        <div className="flex items-center">
                          {renderStars(review.internet)}
                          <span className="ml-1 text-gray-600">
                            {review.internet}
                          </span>
                        </div>
                      </div>
                    </div>

                    {review.comment && review.comment.trim() !== "" && (
                      <div className="bg-white p-2 rounded border">
                        <p className="text-sm">{review.comment}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No reviews available for this location
            </div>
          )}
          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
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
      </div>
    </div>
  );
};

// Custom Marker component with styling that matches the app theme
const CustomMarker = ({
  position,
  title,
  onClick,
  type = "default",
  isSelected,
  markerId,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}) => {
  // Get icon based on location type
  const getIcon = () => {
    switch (type.toLowerCase()) {
      case "library":
        return <FaBook size={14} />;
      case "cafe":
        return <FaCoffee size={14} />;
      case "restaurant":
        return <FaUtensils size={14} />;
      case "store":
        return <FaStore size={14} />;
      case "university":
        return <FaUniversity size={14} />;
      default:
        return <FaMapMarkerAlt size={14} />;
    }
  };

  // Calculate z-index to ensure proper stacking order
  const zIndex = isHovered ? 1200 : isSelected ? 1100 : 1000;

  return (
    <AdvancedMarker
      position={position}
      title={title}
      onClick={onClick}
      zIndex={zIndex}
    >
      <div
        className={`custom-marker ${
          isSelected ? "selected" : ""
        } ${type.toLowerCase()}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="marker-icon">{getIcon()}</div>
        {isSelected && <div className="marker-pulse"></div>}
      </div>
    </AdvancedMarker>
  );
};

function MapComponent({
  filteredLocations = [],
  selectedLocation,
  onSelectLocation,
}) {
  const mapStyles = {
    height: "100vh",
    width: "100vw",
    margin: 0,
    padding: 0,
    position: "absolute",
    top: 0,
    left: 0,
  };

  const defaultCenter = {
    lat: 29.6456,
    lng: -82.3519,
  };
  // State to track loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Define custom map styles inside the component
  const customMapStyle = [
    {
      featureType: "poi",
      elementType: "labels.text",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.business",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "road",
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      stylers: [{ visibility: "off" }],
    },
  ];

  const ApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  /** @type {[PointOfInterest|null, Function]} */
  const [selectMarker, setSelectMarker] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [locationReviews, setLocationReviews] = useState(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const mapRef = useRef(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null);
  const [bookmarkedIds, setAddBookmarkedIds] = useState([]);
  const [cafeLocations, setCafeLocations] = useState([]);
  const [reviewCache, setReviewCache] = useState({});
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  // Add ref to track which locations we've already fetched reviews for
  const fetchedReviewsRef = useRef(new Set());
  // Ref for InfoWindow element
  const infoWindowRef = useRef(null);
  // Ref to track which location is currently being fetched
  const currentFetchingLocationRef = useRef(null);

  // Get the current user's email from localStorage on component mount
  useEffect(() => {
    // Get user email from localStorage or your auth system
    const userEmail =
      localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail");
    setCurrentUserEmail(userEmail);

    // If we have a user email, pre-fetch their reviews to populate the cache
    if (userEmail) {
      fetchUserReviews(userEmail);
    }
  }, []);

  // Function to fetch all user reviews to populate the cache
  const fetchUserReviews = async (userEmail) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/get_user_reviews?user_email=${userEmail}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.reviews && data.reviews.length > 0) {
          // Create a cache object from the reviews array
          const cache = {};
          data.reviews.forEach((review) => {
            cache[review.location_id] = review;
          });
          setReviewCache(cache);
        }
      }
    } catch (err) {
      console.error("Error fetching user reviews:", err);
    }
  };

  // Handle external selection from sidebar
  useEffect(() => {
    if (selectedLocation) {
      const loc = filteredLocations.find((l) => l.id === selectedLocation);
      if (loc) {
        // Check if we're already fetching this location
        if (currentFetchingLocationRef.current !== loc.id) {
          handleMarkerClick(loc);
        }
      }
    }
  }, [selectedLocation, filteredLocations]);

  // Add simple pan effect when a marker is selected
  useEffect(() => {
    if (selectMarker && mapRef.current) {
      const map = mapRef.current;
      map.panTo(selectMarker.position);
      map.panBy(0, -150); // vertical offset so InfoWindow appears above marker
    }
  }, [selectMarker]);

  const handleMarkerClick = async (marker) => {
    // Verify the marker has all required properties
    if (
      !marker ||
      !marker.id ||
      !marker.position ||
      typeof marker.position.lat === "undefined" ||
      typeof marker.position.lng === "undefined"
    ) {
      console.error("Invalid marker data:", marker);
      return;
    }

    if (currentFetchingLocationRef.current === marker.id) {
      console.log(
        `Already fetching reviews for ${marker.name}, skipping duplicate fetch`
      );
      return;
    }

    console.log(
      `Clicked marker: ${marker.name} (ID: ${marker.id}, Type: ${marker.type})`
    );

    // Always clear existing review data when switching markers
    currentFetchingLocationRef.current = marker.id;
    setLocationReviews([]);
    setExistingReview(null);
    setIsLoadingReviews(true);

    // Set the selected marker to trigger InfoWindow display
    setSelectMarker(marker);

    try {
      // Special handling for "Library West" to make sure we consistently get the right data
      if (marker.name === "Library West") {
        console.log("Special handling for Library West");
      }

      // Always fetch fresh reviews for the current marker to ensure accuracy
      console.log(`Fetching reviews for ${marker.name} (${marker.id})`);
      const res = await fetch(
        `http://localhost:5000/api/get_location_reviews?location_id=${marker.id}`
      );

      if (res.ok) {
        const data = await res.json();

        // Check what was returned from the API to help debug
        console.log(`API returned for ${marker.name}:`, data);

        // Ensure reviews is ALWAYS an array before setting it
        const reviews = Array.isArray(data.reviews) ? data.reviews : [];
        console.log(`Setting ${reviews.length} reviews for ${marker.name}`);

        // Set reviews in state
        setLocationReviews(reviews);

        // Also update cache for future use
        const newCache = { ...reviewCache };
        newCache[marker.id] = reviews;
        setReviewCache(newCache);
      } else {
        console.error(
          `Error fetching reviews for ${marker.name}: ${res.status}`
        );
        setLocationReviews([]);
      }
    } catch (err) {
      console.error(`Error in review fetch for ${marker.name}:`, err);
      setLocationReviews([]);
    } finally {
      setIsLoadingReviews(false);
    }

    // If user is logged in, check if they have a review for this location
    if (currentUserEmail) {
      try {
        const res = await fetch(
          `http://localhost:5000/api/get_review?user_email=${currentUserEmail}&location_id=${marker.id}`
        );
        const result = await res.json();
        if (result.review) {
          setExistingReview(result.review);
        } else {
          setExistingReview(null);
        }
      } catch (err) {
        console.error(
          `Error checking for user review for ${marker.name}:`,
          err
        );
      }
    }
  };

  const handleReviewButton = async () => {
    if (!selectMarker) return;
    // Check if user is logged in
    if (!currentUserEmail) {
      alert("Please log in to add or edit reviews");
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:5000/api/get_review?user_email=${currentUserEmail}&location_id=${selectMarker.id}`
      );
      const result = await res.json();
      if (result.review) {
        setExistingReview(result.review);
      } else {
        setExistingReview(null);
      }
    } catch (err) {
      console.error(err);
    }
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (review) => {
    if (!selectMarker || !currentUserEmail) return;
    try {
      const payload = {
        user_email: currentUserEmail,
        location_id: selectMarker.id,
        quietness: review.quietness,
        seating: review.seating,
        vibes: review.vibes,
        crowdedness: review.crowdedness,
        internet: review.internet,
        comment: review.comment,
      };
      const res = await fetch("http://localhost:5000/api/add_review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok && result.review) {
        // Update the existing review in state with the one returned from server
        setExistingReview(result.review);

        // Refresh the location reviews to update the averages
        try {
          const reviewsRes = await fetch(
            `http://localhost:5000/api/get_location_reviews?location_id=${selectMarker.id}`
          );
          if (reviewsRes.ok) {
            const data = await reviewsRes.json();
            setLocationReviews(data.reviews);
            // Mark this location for refresh since we just added a review
            if (fetchedReviewsRef.current.has(selectMarker.id)) {
              fetchedReviewsRef.current.delete(selectMarker.id);
            }
          }
        } catch (err) {
          console.error("Error refreshing location reviews:", err);
        }
      } else {
        console.error("Error saving review:", result.errors || result.message);
      }
      // Close the modal
      setShowReviewModal(false);
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("There was an error saving your review. Please try again.");
    }
  };

  // Calculate average ratings from all reviews
  const calculateAverageRatings = (reviews) => {
    if (!reviews || reviews.length === 0) {
      return null;
    }

    const sum = {
      quietness: 0,
      seating: 0,
      vibes: 0,
      crowdedness: 0,
      internet: 0,
    };

    let count = 0;

    reviews.forEach((review) => {
      sum.quietness += review.quietness || 0;
      sum.seating += review.seating || 0;
      sum.vibes += review.vibes || 0;
      sum.crowdedness += review.crowdedness || 0;
      sum.internet += review.internet || 0;
      count++;
    });

    if (count === 0) return null;

    return {
      quietness: (sum.quietness / count).toFixed(1),
      seating: (sum.seating / count).toFixed(1),
      vibes: (sum.vibes / count).toFixed(1),
      crowdedness: (sum.crowdedness / count).toFixed(1),
      internet: (sum.internet / count).toFixed(1),
      count: count,
    };
  };

  // Function to render stars based on rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <div className="flex text-yellow-400">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="text-sm">
            ★
          </span>
        ))}
        {halfStar && <span className="text-sm">★</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300 text-sm">
            ★
          </span>
        ))}
      </div>
    );
  };

  // Fetch locations from MongoDB
  useEffect(() => {
    const fetchLocationsFromMongoDB = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        console.log(
          "Attempting to fetch places from MongoDB cafes collection..."
        );

        // Try multiple possible API endpoints for the cafes collection
        const possibleEndpoints = [
          "http://localhost:5000/api/cafes",
          "http://localhost:5000/api/get_cafes",
          "/api/cafes",
          "/api/get_cafes",
          "http://localhost:5000/api/places_db/cafes",
          "/api/places_db/cafes",
        ];

        let response = null;
        let data = null;
        let endpointUsed = "";

        // Try each endpoint until one works
        for (const endpoint of possibleEndpoints) {
          try {
            console.log(`Trying endpoint: ${endpoint}`);
            const resp = await fetch(endpoint, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            });
            if (resp.ok) {
              response = resp;
              endpointUsed = endpoint;
              break;
            }
          } catch (err) {
            // Continue to next endpoint
          }
        }

        if (response) {
          data = await response.json();
        } else {
          // If all endpoints fail, use test data based on the provided MongoDB format
          data = {
            cafes: [
              {
                _id: { $oid: "67f81dcb79a683747f0b8da8" },
                business_status: "OPERATIONAL",
                geometry: {
                  location: {
                    lat: { $numberDouble: "29.6394045" },
                    lng: { $numberDouble: "-82.34135619999999" },
                  },
                },
                icon: "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/cafe-71.png",
                name: "Opus Coffee - UF Health East Tower",
                vicinity: "1505 Southwest Archer Road, Gainesville",
                rating: { $numberDouble: "4.6" },
                price_level: { $numberInt: "2" },
              },
              // Test data objects...
            ],
          };
        }

        // Extract the cafes from the response
        let cafes = data.cafes || data.places || data.results || data;

        // Handle case where the data might be a single cafe object instead of an array
        if (cafes && !Array.isArray(cafes)) {
          if (cafes.cafes && Array.isArray(cafes.cafes)) {
            cafes = cafes.cafes;
            console.log("Found cafes array nested one level deeper");
          } else if (cafes._id) {
            // It's a single object, convert to array
            cafes = [cafes];
            console.log("Converted single cafe object to array");
          } else {
            // Try to find any array in the data
            for (const key in data) {
              if (Array.isArray(data[key]) && data[key].length > 0) {
                cafes = data[key];
                console.log(`Found array in data at key: ${key}`);
                break;
              }
            }
          }
        }

        if (!Array.isArray(cafes) || cafes.length === 0) {
          throw new Error("No cafe data found in response");
        }

        // Helper function to determine if a cafe is suitable for studying
        const isStudySpot = (place) => {
          // Known study-friendly cafe chains
          const studyFriendlyCafes = [
            "starbucks",
            "opus coffee",
            "coffee culture",
            "patticakes",
            "pascal",
            "volta",
            "curia",
            "maude",
            "karma cream",
            "midtown coffee",
            "wyatt",
            "midpoint",
            "library",
            "barnes",
            "stuzin",
            "panera",
            "einstein",
          ];

          // Non-study friendly locations to exclude
          const nonStudyFriendly = [
            "drive thru",
            "drive-thru",
            "drive through",
            "drive-through",
            "express",
            "to-go",
            "to go",
            "mobile",
            "kiosk",
            "take out",
            "takeout",
            "take-out",
            "gas station",
            "quick",
          ];

          // Name to lowercase for checking
          const name = (place.name || "").toLowerCase();

          // Check if the name contains any of the study-friendly cafe terms
          const isStudyFriendlyCafe = studyFriendlyCafes.some((cafe) =>
            name.includes(cafe)
          );

          // Check if it's explicitly non-study friendly by name
          const isNonStudyFriendly =
            nonStudyFriendly.some((term) => name.includes(term)) ||
            (place.rating?.$numberDouble !== undefined &&
              parseFloat(place.rating.$numberDouble) >= 4.0) ||
            (typeof place.rating === "number" && place.rating >= 4.0);

          const hasHighRating =
            (place.rating?.$numberDouble !== undefined &&
              parseFloat(place.rating.$numberDouble) >= 4.0) ||
            (typeof place.rating === "number" && place.rating >= 4.0);

          const hasPriceLevel =
            (place.price_level?.$numberInt !== undefined &&
              parseInt(place.price_level.$numberInt) >= 1) ||
            (place.price_level?.$numberDouble !== undefined &&
              parseFloat(place.price_level.$numberDouble) >= 1) ||
            (typeof place.price_level === "number" && place.price_level >= 1);

          // Types might contain indicators like "cafe", "bakery" etc.
          const hasStudyFriendlyType =
            place.types &&
            Array.isArray(place.types) &&
            (place.types.includes("cafe") ||
              place.types.includes("library") ||
              place.types.includes("book_store"));

          // Decision logic:
          // If it's explicitly study-friendly by name, include it
          if (isStudyFriendlyCafe) return true;

          // If it's explicitly non-study friendly by name, exclude it
          if (isNonStudyFriendly) return false;

          // Otherwise, look at other indicators like rating, price level, and types
          return hasHighRating || hasPriceLevel || hasStudyFriendlyType;
        };

        // Format the locations from MongoDB
        const formattedLocations = cafes.map((place, index) => {
          // Extract latitude and longitude with exhaustive options
          let lat, lng;

          // Try all possible paths to get latitude
          if (typeof place.geometry?.location?.lat === "number") {
            lat = place.geometry.location.lat;
          } else if (
            place.geometry?.location?.lat?.$numberDouble !== undefined
          ) {
            lat = parseFloat(place.geometry.location.lat.$numberDouble);
          } else if (typeof place.lat === "number") {
            lat = place.lat;
          } else if (typeof place.latitude === "number") {
            lat = place.latitude;
          } else if (place.position?.lat) {
            lat = place.position.lat;
          } else {
            // Last resort: use a default value for UF area
            lat = 29.6516;
          }

          // Try all possible paths to get longitude
          if (typeof place.geometry?.location?.lng === "number") {
            lng = place.geometry.location.lng;
          } else if (
            place.geometry?.location?.lng?.$numberDouble !== undefined
          ) {
            lng = parseFloat(place.geometry.location.lng.$numberDouble);
          } else if (typeof place.lng === "number") {
            lng = place.lng;
          } else if (typeof place.longitude === "number") {
            lng = place.longitude;
          } else if (place.position?.lng) {
            lng = place.position.lng;
          } else {
            // Last resort: use a default value for UF area
            lng = -82.3248;
          }

          // Add extra validation to ensure we have valid numbers
          if (isNaN(lat) || lat === 0) {
            lat = 29.6516; // Default to UF area
          }
          if (isNaN(lng) || lng === 0) {
            lng = -82.3248; // Default to UF area
          }

          // Determine location type based on the icon URL or name
          let locationType = "cafe"; // Default

          if (place.icon) {
            if (place.icon.includes("cafe")) {
              locationType = "cafe";
            } else if (
              place.icon.includes("restaurant") ||
              place.icon.includes("food")
            ) {
              locationType = "restaurant";
            } else if (
              place.icon.includes("shopping") ||
              place.icon.includes("store")
            ) {
              locationType = "store";
            } else if (
              place.icon.includes("school") ||
              place.icon.includes("library") ||
              place.icon.includes("book")
            ) {
              locationType = "library";
            } else if (place.icon.includes("university")) {
              locationType = "university";
            }
          } else {
            // Fallback to name-based detection
            const placeName = (place.name || "").toLowerCase();

            if (
              placeName.includes("starbucks") ||
              placeName.includes("coffee") ||
              placeName.includes("opus") ||
              placeName.includes("cafe")
            ) {
              locationType = "cafe";
            } else if (
              placeName.includes("restaurant") ||
              placeName.includes("grill") ||
              placeName.includes("einstein") ||
              placeName.includes("food")
            ) {
              locationType = "restaurant";
            } else if (
              placeName.includes("store") ||
              placeName.includes("wawa") ||
              placeName.includes("market") ||
              placeName.includes("shop")
            ) {
              locationType = "store";
            } else if (
              placeName.includes("library") ||
              placeName.includes("book")
            ) {
              locationType = "library";
            }
          }

          // Extract rating, handling MongoDB's $numberDouble format
          const rating =
            place.rating?.$numberDouble !== undefined
              ? parseFloat(place.rating.$numberDouble)
              : place.rating || 0;

          // Extract price level data (if available)
          let priceLevel = null;
          if (place.price_level?.$numberInt !== undefined) {
            priceLevel = parseInt(place.price_level.$numberInt);
          } else if (place.price_level?.$numberDouble !== undefined) {
            priceLevel = parseInt(place.price_level.$numberDouble);
          } else if (typeof place.price_level === "number") {
            priceLevel = place.price_level;
          } else if (
            typeof place.price_level === "string" &&
            !isNaN(place.price_level)
          ) {
            priceLevel = parseInt(place.price_level);
          }

          return {
            id: `place-${
              place._id?.$oid || place._id || place.place_id || index
            }`,
            position: {
              lat: lat,
              lng: lng,
            },
            name: place.name || "Unknown Location",
            hours: place.opening_hours,
            description: place.types ? place.types.join(", ") : "",
            address: place.vicinity || place.address,
            rating: rating,
            price_level: priceLevel,
            photos: place.photos,
            type: locationType,
            place_id: place.place_id,
            originalIcon: place.icon,
            isStudySpot:
              locationType === "library" ||
              (locationType === "cafe" && isStudySpot(place)),
          };
        });

        // Filter out locations with invalid coordinates with less strict validation
        // Also filter to only include cafes that are identified as study spots
        const validLocations = formattedLocations.filter((loc) => {
          const hasValidCoordinates =
            !isNaN(loc.position.lat) &&
            !isNaN(loc.position.lng) &&
            Math.abs(loc.position.lat) > 0.01 && // Avoid values too close to zero
            Math.abs(loc.position.lng) > 0.01; // Avoid values too close to zero

          // Filter by location type and study-friendliness:
          // 1. Include all libraries (always good for studying)
          // 2. Include cafes only if they're identified as study spots
          // 3. Exclude restaurants that aren't explicitly study-friendly

          const isStudyLocation =
            loc.type === "library" || (loc.type === "cafe" && loc.isStudySpot);

          return hasValidCoordinates && isStudyLocation;
        });

        // Even if no valid locations are found, add test locations
        if (validLocations.length === 0) {
          // Add some default test locations for UF area
          const testLocations = [
            {
              id: "test-1",
              position: { lat: 29.6463, lng: -82.3431 },
              name: "Starbucks - UF Campus",
              address: "Museum Rd, Gainesville, FL",
              rating: 4.5,
              price_level: 2,
              type: "cafe",
              isStudySpot: true,
            },
            {
              id: "test-2",
              position: { lat: 29.6516, lng: -82.3429 },
              name: "Library West",
              address: "1545 W University Ave, Gainesville, FL",
              rating: 4.8,
              price_level: 1,
              type: "library",
              isStudySpot: true,
            },
            {
              id: "test-3",
              position: { lat: 29.6399, lng: -82.3241 },
              name: "Wawa",
              address: "1614 W University Ave, Gainesville, FL",
              rating: 4.3,
              price_level: 1,
              type: "store",
              isStudySpot: false,
            },
          ].filter((loc) => loc.isStudySpot); // Only include locations that are study spots

          setCafeLocations(testLocations);
          setIsLoading(false);
        } else {
          setCafeLocations(validLocations);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
        setLoadError(error.message || "Failed to load cafe locations");
        setIsLoading(false);
      }
    };
    fetchLocationsFromMongoDB();
  }, []);

  const handleToggleBookmark = async (id, name, latitude, longitude) => {
    try {
      if (bookmarkedIds.includes(id)) {
        setAddBookmarkedIds((prev) => prev.filter((item) => item !== id));
      } else {
        const bookmarkData = {
          name: name,
          latitude: latitude,
          longitude: longitude,
        };

        const response = await fetch("api/add_bookmark", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bookmarkData),
        });

        if (response.ok) {
          const data = await response.json();
          setAddBookmarkedIds((curr) => [...curr, id]);
        } else {
          const errormsg = await response.json();
          console.error("Error adding bookmark: ", errormsg.errors.general);
        }
      }
    } catch (error) {
      console.error("Error adding/removing bookmark", error);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      {isLoading && (
        <div className="absolute top-4 left-0 right-0 z-10 flex justify-center">
          <div className="bg-white rounded-full py-2 px-4 shadow-lg">
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              Loading locations...
            </span>
          </div>
        </div>
      )}

      {loadError && (
        <div className="absolute top-4 left-0 right-0 z-10 flex justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md shadow-md">
            Error: {loadError}
          </div>
        </div>
      )}

      <APIProvider apiKey={ApiKey}>
        <Map
          mapId="8f541b0eea4c8250"
          style={mapStyles}
          defaultZoom={12}
          defaultCenter={defaultCenter}
          gestureHandling={"greedy"}
          disableDefaultUI={true}
          mapTypeId="roadmap"
          onLoad={(map) => {
            mapRef.current = map;
          }}
          options={{
            styles: customMapStyle,
            streetViewControl: false,
            fullscreenControl: false,
          }}
          onClick={() => {
            setSelectMarker(null);
          }}
        >
          {/* Display only filtered locations */}
          {filteredLocations.map((location) => (
            <CustomMarker
              key={location.id}
              markerId={location.id}
              position={location.position}
              title={location.name}
              onClick={() => {
                handleMarkerClick(location);
                if (onSelectLocation) onSelectLocation(location.id);
              }}
              type={location.type || "default"}
              isSelected={selectMarker && selectMarker.id === location.id}
              isHovered={hoveredMarkerId === location.id}
              onMouseEnter={() => setHoveredMarkerId(location.id)}
              onMouseLeave={() => setHoveredMarkerId(null)}
            />
          ))}

          {/* Display info window when a marker is selected */}
          {selectMarker && (
            <InfoWindow
              position={selectMarker.position}
              onCloseClick={() => {
                setSelectMarker(null);
                if (onSelectLocation) onSelectLocation(null);
              }}
              options={{
                pixelOffset: new window.google.maps.Size(0, -30), // Offset to position above marker
                disableAutoPan: true, // We handle panning manually for better control
              }}
            >
              <div
                className="flex flex-col w-full p-3 relative pb-12"
                style={{ maxWidth: "300px" }}
                ref={infoWindowRef}
              >
                <button
                  onClick={() => {
                    handleToggleBookmark(
                      selectMarker.id,
                      selectMarker.name,
                      selectMarker.position.lat,
                      selectMarker.position.lng
                    );
                  }}
                  className="absolute top-2 right-2 text-gray-500 hover:text-blue-600 transition-colors"
                  title="Bookmark This Location"
                >
                  {bookmarkedIds.includes(selectMarker.id) ? (
                    <FaBookmark size={20} />
                  ) : (
                    <FaRegBookmark size={20} />
                  )}
                </button>
                <h3 className="text-lg font-bold mb-2 pr-7">
                  {selectMarker.name}
                </h3>

                {selectMarker.description && (
                  <p className="text-sm mb-2 text-gray-700">
                    {selectMarker.description}
                  </p>
                )}

                {selectMarker.address && (
                  <p className="text-sm mb-2 text-gray-700">
                    <span className="font-semibold">Address:</span>{" "}
                    {selectMarker.address}
                  </p>
                )}

                {/* Show rating if available (for MongoDB locations) */}
                {selectMarker.rating && (
                  <p className="text-sm mb-2 text-gray-700">
                    <span className="font-semibold">Google Rating:</span>{" "}
                    {selectMarker.rating}/5
                    <span className="ml-2 text-yellow-400">
                      {[...Array(Math.floor(selectMarker.rating))].map(
                        (_, i) => (
                          <span key={i}>★</span>
                        )
                      )}
                      {[...Array(5 - Math.floor(selectMarker.rating))].map(
                        (_, i) => (
                          <span key={i} className="text-gray-300">
                            ★
                          </span>
                        )
                      )}
                    </span>
                  </p>
                )}

                {/* Show price level if available */}
                {selectMarker.price_level && (
                  <p className="text-sm mb-2 text-gray-700">
                    <span className="font-semibold">Price:</span>{" "}
                    <span className="text-green-600">
                      {[...Array(selectMarker.price_level)].map((_, i) => (
                        <span key={i}>$</span>
                      ))}
                    </span>
                  </p>
                )}

                {selectMarker.hours && (
                  <div className="text-sm mb-4 text-gray-700">
                    <p className="mb-1">
                      <span className="font-semibold">Hours:</span>{" "}
                      {selectMarker.hours.open}
                      {selectMarker.hours.close
                        ? ` - ${selectMarker.hours.close}`
                        : ""}
                    </p>
                    {selectMarker.hours.days && (
                      <p>
                        <span className="font-semibold">Open:</span>{" "}
                        {selectMarker.hours.days.join(", ")}
                      </p>
                    )}
                  </div>
                )}

                {/* Show User Ratings summary if available */}
                {locationReviews && locationReviews.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <div className="flex flex-nowrap items-center w-full mb-2">
                      <h4 className="text-sm font-bold text-gray-700 whitespace-nowrap mr-2">
                        Study Findr Ratings
                      </h4>
                      <button
                        className="text-xs text-blue-500 hover:text-blue-700 flex items-center whitespace-nowrap cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCommentsModal(true);
                        }}
                        title="View all reviews"
                      >
                        <FaComments className="mr-1" />
                        {locationReviews.length}{" "}
                        {locationReviews.length === 1 ? "review" : "reviews"}
                      </button>
                    </div>
                    {(() => {
                      const avgRatings =
                        calculateAverageRatings(locationReviews);
                      if (!avgRatings) return null;

                      return (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-xs">
                            <div className="font-medium text-gray-700">
                              Quietness
                            </div>
                            <div className="flex items-center">
                              {renderStars(avgRatings.quietness)}
                              <span className="ml-1 text-gray-600">
                                {avgRatings.quietness}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs">
                            <div className="font-medium text-gray-700">
                              Seating
                            </div>
                            <div className="flex items-center">
                              {renderStars(avgRatings.seating)}
                              <span className="ml-1 text-gray-600">
                                {avgRatings.seating}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs">
                            <div className="font-medium text-gray-700">
                              Vibes
                            </div>
                            <div className="flex items-center">
                              {renderStars(avgRatings.vibes)}
                              <span className="ml-1 text-gray-600">
                                {avgRatings.vibes}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs">
                            <div className="font-medium text-gray-700">
                              Busyness
                            </div>
                            <div className="flex items-center">
                              {renderStars(avgRatings.crowdedness)}
                              <span className="ml-1 text-gray-600">
                                {avgRatings.crowdedness}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs">
                            <div className="font-medium text-gray-700">
                              Internet
                            </div>
                            <div className="flex items-center">
                              {renderStars(avgRatings.internet)}
                              <span className="ml-1 text-gray-600">
                                {avgRatings.internet}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Replace the User Comments section with a preview and button to see all */}
                {locationReviews &&
                  Array.isArray(locationReviews) &&
                  locationReviews.filter(
                    (review) => review.comment && review.comment.trim() !== ""
                  ).length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-12">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold text-gray-700">
                          Recent Comments
                        </h4>
                        <button
                          className="text-blue-500 hover:text-blue-700 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCommentsModal(true);
                          }}
                        >
                          View All
                        </button>
                      </div>
                      <div className="space-y-2 max-h-24 overflow-y-auto">
                        {locationReviews
                          .filter(
                            (review) =>
                              review.comment && review.comment.trim() !== ""
                          )
                          .slice(0, 2) // Just show 2 preview comments
                          .map((review, index) => (
                            <div
                              key={index}
                              className="p-2 bg-white rounded border border-gray-200"
                            >
                              <p className="text-xs text-gray-600 italic">
                                {review.comment}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Button positioned at bottom with proper spacing */}
                <button
                  className="absolute bottom-2 left-0 right-0 mx-3 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  onClick={handleReviewButton}
                >
                  {existingReview ? "Edit Review" : "Add User Review"}
                </button>
              </div>
            </InfoWindow>
          )}
        </Map>
        {/* Place CommentsModal at the root level outside the Map component */}
        {selectMarker && showCommentsModal && (
          <CommentsModal
            isOpen={showCommentsModal}
            onClose={() => setShowCommentsModal(false)}
            locationId={selectMarker.id}
            locationName={selectMarker.name}
            renderStars={renderStars}
          />
        )}
        {/* Review Modal for adding/editing user reviews */}
        {showReviewModal && (
          <ReviewModal
            show={showReviewModal}
            onCancel={() => setShowReviewModal(false)}
            onSubmit={handleReviewSubmit}
            existingReview={existingReview}
          />
        )}
      </APIProvider>
    </div>
  );
}

export default MapComponent;
