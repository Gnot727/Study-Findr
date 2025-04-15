<<<<<<< HEAD
import React, { useState, useRef, useEffect } from "react";
=======
import React, { useState, useEffect, useRef } from "react";
>>>>>>> Bookmark
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
<<<<<<< HEAD
  LoadScript,
  Marker,
} from "@react-google-maps/api";
import "./myMap.css"; // Fix the import path with a relative path
import bookmarkComponent from "./bookmarks.tsx";
import ReviewModal from "./ReviewModal";
//npm install "@react-google-maps/api"
=======
} from "@vis.gl/react-google-maps";
import "./myMap.css";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { FaMapMarkerAlt, FaBook, FaCoffee } from "react-icons/fa";
>>>>>>> Bookmark

//npm install "@vis.gl/react-google-maps"
//npm install react-icons
/**
 * @typedef {Object} PointOfInterest
 * @property {number} id
 * @property {Object} position
 * @property {number} position.lat
 * @property {number} position.lng
 * @property {string} name
 * @property {string} [description]
 * @property {string} [type]
 * @property {Object} [hours]
 * @property {string} hours.open
 * @property {string} hours.close
 * @property {string[]} hours.days - Array of days the library is open
 * @property {string} [address] - Might be optional
 */

// Custom Marker component with styling that matches the app theme
const CustomMarker = ({
  position,
  title,
  onClick,
  type = "default",
  isSelected,
}) => {
  // Define icon based on location type
  const getIcon = () => {
    switch (type.toLowerCase()) {
      case "library":
        return <FaBook />;
      case "cafe":
        return <FaCoffee />;
      default:
        return <FaMapMarkerAlt />;
    }
  };

  return (
    <AdvancedMarker position={position} title={title} onClick={onClick}>
      <div className={`custom-marker ${isSelected ? "selected" : ""}`}>
        <div className="marker-icon">{getIcon()}</div>
        {isSelected && <div className="marker-pulse"></div>}
      </div>
    </AdvancedMarker>
  );
};

function MapComponent({
  libraries = [],
  mongoLocations = [],
  setLibraries,
  setMongoLocations,
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
   // Wider bounds to ensure InfoWindow visibility
  //  const bounds = {
  //   north: 29.695, // Increased north boundary
  //   south: 29.603, // Decreased south boundary
  //   west: -82.404, // Increased west boundary
  //   east: -82.305, // Increased east boundary
  // };

  // Define custom map styles inside the component
  const customMapStyle = [
    {
      featureType: "poi", // Hide all points of interest (businesses, landmarks, etc.)
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ];

  const ApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  /** @type {[PointOfInterest|null, Function]} */
  const [selectMarker, setSelectMarker] = useState(null);
  const [addBookmark, setAddBookmark] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [locationReviews, setLocationReviews] = useState(null);
  const mapRef = useRef(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Get the current user's email from localStorage on component mount
  useEffect(() => {
    // Get user email from localStorage or your auth system
    const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
    setCurrentUserEmail(userEmail);
  }, []);

  const handleMarkerClick = async (marker) => {
    const map = mapRef.current;
    if (map && window.google) {
      // Just set the marker without any automatic positioning
      setSelectMarker(marker);
      
      // Fetch all reviews for this location to calculate averages
      try {
        const res = await fetch(`http://localhost:5000/api/get_location_reviews?location_id=${marker.id}`);
        if (res.ok) {
          const data = await res.json();
          setLocationReviews(data.reviews);
        }
      } catch (err) {
        console.error("Error fetching location reviews:", err);
        setLocationReviews(null);
      }
      
      // If user is logged in, also check if they have a review
      if (currentUserEmail) {
        try {
          const res = await fetch(`http://localhost:5000/api/get_review?user_email=${currentUserEmail}&location_id=${marker.id}`);
          const result = await res.json();
          if (result.review) {
            setExistingReview(result.review);
          } else {
            setExistingReview(null);
          }
        } catch (err) {
          console.error("Error checking for existing review:", err);
        }
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
      const res = await fetch(`http://localhost:5000/api/get_review?user_email=${currentUserEmail}&location_id=${selectMarker.id}`);
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
        comment: review.comment
      };
      
      const res = await fetch("http://localhost:5000/api/add_review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (res.ok && result.review) {
        // Update the existing review in state with the one returned from server
        setExistingReview(result.review);
        console.log("Review saved:", result.message);
        
        // Refresh the location reviews to update the averages
        try {
          const reviewsRes = await fetch(`http://localhost:5000/api/get_location_reviews?location_id=${selectMarker.id}`);
          if (reviewsRes.ok) {
            const data = await reviewsRes.json();
            setLocationReviews(data.reviews);
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
      internet: 0
    };
    
    let count = 0;
    
    reviews.forEach(review => {
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
      count: count
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
          <span key={`full-${i}`} className="text-sm">★</span>
        ))}
        {halfStar && <span className="text-sm">★</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300 text-sm">★</span>
        ))}
      </div>
    );
  };

<<<<<<< HEAD
  /** @type {PointOfInterest[]} */
  const libraries = [
    {
      id: 1,
      position: {
        lat: 29.6479572,
        lng: -82.3439199,
      },
      name: "Marston Library",
      description: "Science Library",
      type: "Library",
      hours: {
        open: "24/7",
        days: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
      address: "444 Newell Dr, Gainesville, FL 32611",
    },
    {
      id: 2,
      position: {
        lat: 29.6515513,
        lng: -82.34281469999999,
      },
      name: "Library West",
      description: "Main campus library",
      type: "Library",
      hours: {
        open: "24/7",
        days: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
      address: "1545 W University Ave, Gainesville, FL 32611",
    },
    {
      id: 3,
      position: {
        lat: 29.6508246,
        lng: -82.3417565,
      },
      name: "Smathers Library",
      description: "Special collections and area studies",
      type: "Library",
      hours: {
        open: "9:00 AM",
        close: "6:00 PM",
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      },
      address: "1508 Union Rd, Gainesville, FL 32611",
    },
  ];

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <LoadScript 
        googleMapsApiKey={ApiKey}
        onLoad={() => setGoogleMapsLoaded(true)}
      >
        <GoogleMap
          mapContainerStyle={mapStyles}
          zoom={14}
          center={defaultCenter}
=======
  const bounds = {
    north: 29.675,
    south: 29.613,
    west: -82.394,
    east: -82.315,
  };

  // Map styling defined inline
  const mapStyling = [
    [
      {
        featureType: "poi",
        elementType: "labels.text",
        stylers: [
          {
            visibility: "off",
          },
        ],
      },
      {
        featureType: "poi.business",
        stylers: [
          {
            visibility: "off",
          },
        ],
      },
      {
        featureType: "road",
        elementType: "labels.icon",
        stylers: [
          {
            visibility: "off",
          },
        ],
      },
      {
        featureType: "transit",
        stylers: [
          {
            visibility: "off",
          },
        ],
      },
    ],
  ];

  const ApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  /** @type {[PointOfInterest|null, Function]} */
  const [selectMarker, setSelectMarker] = useState(null);
  // Map reference for accessing map methods
  const mapRef = useRef(null);

  // Function to fetch locations from MongoDB
  const fetchMongoLocations = async () => {
    try {
      const response = await fetch("/api/get_locations");
      const data = await response.json();

      if (response.ok) {
        console.log("MongoDB locations:", data.results);
        const formattedLocations = data.results.map((location, index) => ({
          id: `mongo-${index}`,
          position: {
            lat: location.geometry.location.lat,
            lng: location.geometry.location.lng,
          },
          name: location.name,
          hours: location.opening_hours,
          description: location.types ? location.types.join(", ") : "",
          address: location.vicinity,
          rating: location.rating,
          photos: location.photos,
        }));

        setMongoLocations(formattedLocations);
      } else {
        console.error("Failed to fetch MongoDB locations");
      }
    } catch (error) {
      console.error("Error fetching MongoDB locations:", error);
    }
  };

  // Fetch MongoDB locations when component mounts only if not provided
  useEffect(() => {
    if (mongoLocations.length === 0) {
      fetchMongoLocations();
    }
  }, [mongoLocations.length]);

  const [expandDetails, setExpandDetails] = useState(false);
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const [noiseLevel, setNoiseLevel] = useState("Medium");
  const [bookmarkedIds, setAddBookmarkedIds] = useState([]);

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
      <APIProvider apiKey={ApiKey}>
        <Map
          mapId="8f541b0eea4c8250"
          style={mapStyles}
          defaultZoom={15}
          defaultCenter={defaultCenter}
          gestureHandling={"greedy"}
          disableDefaultUI={true}
          mapTypeId="roadmap"
>>>>>>> Bookmark
          onLoad={(map) => {
            mapRef.current = map;
          }}
          options={{
<<<<<<< HEAD
            styles: customMapStyle,
            streetViewControl: false,
            zoomControl: true,
            mapTypeControl: false,
            fullscreenControl: false,
            clickableIcons: false,
            gestureHandling: 'greedy',
            minZoom: 3,
            maxZoom: 20
=======
            styles: mapStyling,
            restriction: {
              latLngBounds: bounds,
              strictBounds: false,
            },
            streetViewControl: false,
            fullscreenControl: false,
>>>>>>> Bookmark
          }}
          onClick={() => setSelectMarker(null)}
        >
          {/* Display libraries */}
          {libraries.map((lib) => (
            <CustomMarker
              key={lib.id}
              position={lib.position}
              title={lib.name}
<<<<<<< HEAD
              onClick={() => handleMarkerClick(lib)}
              options={{
                optimized: false,
                clickable: true,
                animation: googleMapsLoaded && window.google ? window.google.maps.Animation.DROP : null
              }}
=======
              onClick={() => {
                console.log("Library marker clicked:", lib);
                setSelectMarker(lib);
              }}
              type={lib.type}
              isSelected={selectMarker && selectMarker.id === lib.id}
            />
          ))}

          {/* Display MongoDB locations */}
          {mongoLocations.map((location) => (
            <CustomMarker
              key={location.id}
              position={location.position}
              title={location.name}
              onClick={() => {
                console.log("MongoDB location clicked:", location);
                setSelectMarker(location);
              }}
              type={location.type}
              isSelected={selectMarker && selectMarker.id === location.id}
>>>>>>> Bookmark
            />
          ))}

          {selectMarker && googleMapsLoaded && (
            <InfoWindow
              position={selectMarker.position}
<<<<<<< HEAD
              onCloseClick={() => setSelectMarker(null)}
              options={{
                pixelOffset: new window.google.maps.Size(0, -35),
                maxWidth: 240,
                disableAutoPan: false, // Let Google Maps only adjust if InfoWindow would be cut off
                zIndex: 10
              }}
            >
              <div className="flex flex-col w-full p-2 relative pb-12">
=======
              onCloseClick={() => {
                setSelectMarker(null);
                setExpandDetails(false);
              }}
            >
              <div className="flex flex-col w-64 p-3 relative pb-12">
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

>>>>>>> Bookmark
                <h3 className="text-lg font-bold mb-2">{selectMarker.name}</h3>

                {selectMarker.description && (
                  <p className="text-sm mb-2">{selectMarker.description}</p>
                )}

                {selectMarker.address && (
                  <p className="text-sm mb-2">
                    <span className="font-semibold">Address:</span>{" "}
                    {selectMarker.address}
                  </p>
                )}

                {/* Show rating if available (for MongoDB locations) */}
                {selectMarker.rating && (
                  <p className="text-sm mb-2">
                    <span className="font-semibold">Rating:</span>{" "}
                    {selectMarker.rating}/5
                  </p>
                )}

                {selectMarker.hours && (
                  <div className="text-sm mb-4">
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
<<<<<<< HEAD
                
                {/* Display average ratings if available */}
                {locationReviews && locationReviews.length > 0 && (
                  <div className="text-sm mb-4 p-2 bg-gray-50 rounded">
                    <p className="font-semibold mb-1">Average Ratings ({calculateAverageRatings(locationReviews).count} reviews):</p>
                    <div className="grid grid-cols-2 gap-1">
                      <span>Quietness:</span>
                      <div className="flex items-center">
                        {renderStars(parseFloat(calculateAverageRatings(locationReviews).quietness))}
                        <span className="ml-1 text-xs">({calculateAverageRatings(locationReviews).quietness})</span>
                      </div>
                      
                      <span>Seating:</span>
                      <div className="flex items-center">
                        {renderStars(parseFloat(calculateAverageRatings(locationReviews).seating))}
                        <span className="ml-1 text-xs">({calculateAverageRatings(locationReviews).seating})</span>
                      </div>
                      
                      <span>Vibes:</span>
                      <div className="flex items-center">
                        {renderStars(parseFloat(calculateAverageRatings(locationReviews).vibes))}
                        <span className="ml-1 text-xs">({calculateAverageRatings(locationReviews).vibes})</span>
                      </div>
                      
                      <span>Crowdedness:</span>
                      <div className="flex items-center">
                        {renderStars(parseFloat(calculateAverageRatings(locationReviews).crowdedness))}
                        <span className="ml-1 text-xs">({calculateAverageRatings(locationReviews).crowdedness})</span>
                      </div>
                      
                      <span>Internet:</span>
                      <div className="flex items-center">
                        {renderStars(parseFloat(calculateAverageRatings(locationReviews).internet))}
                        <span className="ml-1 text-xs">({calculateAverageRatings(locationReviews).internet})</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={handleReviewButton}
                  className="absolute bottom-2 left-0 right-0 mx-3 p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
=======

                {/* Add place_id for reference if available */}
                {selectMarker.place_id && (
                  <p className="text-xs text-gray-500 mb-2">
                    ID: {selectMarker.place_id}
                  </p>
                )}

                {/* Button positioned at bottom with proper spacing */}
                <button
                  className="absolute bottom-2 left-0 right-0 mx-3 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  onClick={() => setExpandDetails(true)}
>>>>>>> Bookmark
                >
                  {existingReview ? "Edit Review" : "Add User Review"}
                </button>
              </div>
            </InfoWindow>
          )}
<<<<<<< HEAD
        </GoogleMap>
        <button
          className="absolute rounded p-4 font-bold bg-white bottom-8 right-24 z-10"
          onClick={addBookmark}
        >
          Add Bookmark?
        </button>
      </LoadScript>
      {showReviewModal && (
        <ReviewModal 
          show={showReviewModal} 
          existingReview={existingReview}
          onCancel={() => { setShowReviewModal(false); }}
          onSubmit={handleReviewSubmit}
        />
      )}
=======
        </Map>
      </APIProvider>
>>>>>>> Bookmark
    </div>
  );
}

export default MapComponent;
