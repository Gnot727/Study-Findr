import React, { useState, useRef, useEffect } from "react";
import {
  GoogleMap,
  InfoWindow,
  LoadScript,
  Marker,
} from "@react-google-maps/api";
import "./myMap.css"; // Fix the import path with a relative path
import bookmarkComponent from "./bookmarks.tsx";
import ReviewModal from "./ReviewModal";
//npm install "@react-google-maps/api"

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

const MapComponent = () => {
  // Update the mapStyles to use 100vh (viewport height) and 100vw (viewport width)
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
  const mapRef = useRef(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Get the current user's email from localStorage on component mount
  useEffect(() => {
    // Get user email from localStorage or your auth system
    const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
    setCurrentUserEmail(userEmail);
  }, []);

  const handleMarkerClick = (marker) => {
    const map = mapRef.current;
    if (map && window.google) {
      // Just set the marker without any automatic positioning
      setSelectMarker(marker);
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
          onLoad={(map) => {
            mapRef.current = map;
          }}
          options={{
            styles: customMapStyle,
            streetViewControl: false,
            zoomControl: true,
            mapTypeControl: false,
            fullscreenControl: false,
            clickableIcons: false,
            gestureHandling: 'greedy',
            minZoom: 3,
            maxZoom: 20
          }}
          onClick={() => setSelectMarker(null)}
        >
          {libraries.map((lib) => (
            <Marker
              key={lib.id}
              position={lib.position}
              title={lib.name}
              onClick={() => handleMarkerClick(lib)}
              options={{
                optimized: false,
                clickable: true,
                animation: googleMapsLoaded && window.google ? window.google.maps.Animation.DROP : null
              }}
            />
          ))}

          {selectMarker && googleMapsLoaded && (
            <InfoWindow
              position={selectMarker.position}
              onCloseClick={() => setSelectMarker(null)}
              options={{
                pixelOffset: new window.google.maps.Size(0, -35),
                maxWidth: 240,
                disableAutoPan: false, // Let Google Maps only adjust if InfoWindow would be cut off
                zIndex: 10
              }}
            >
              <div className="flex flex-col w-full p-2 relative pb-12">
                <h3 className="text-lg font-bold mb-2">{selectMarker.name}</h3>
                
                {selectMarker.description && (
                  <p className="text-sm mb-2">{selectMarker.description}</p>
                )}
                
                {selectMarker.address && (
                  <p className="text-sm mb-2"><span className="font-semibold">Address:</span> {selectMarker.address}</p>
                )}
                
                {selectMarker.hours && (
                  <div className="text-sm mb-4">
                    <p className="mb-1">
                      <span className="font-semibold">Hours:</span> {selectMarker.hours.open} 
                      {selectMarker.hours.close ? ` - ${selectMarker.hours.close}` : ""}
                    </p>
                    <p><span className="font-semibold">Open:</span> {selectMarker.hours.days.join(", ")}</p>
                  </div>
                )}
                
                <button 
                  onClick={handleReviewButton}
                  className="absolute bottom-2 left-0 right-0 mx-3 p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                >
                  {existingReview ? "Edit Review" : "Add User Review"}
                </button>
              </div>
            </InfoWindow>
          )}
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
    </div>
  );
};

export default MapComponent;
