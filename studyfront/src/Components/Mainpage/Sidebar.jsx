import React, { useState, useEffect, useRef } from "react";
import "./Sidebar.css";
import {
  FaBook,
  FaCoffee,
  FaMapMarkerAlt,
  FaBookmark,
  FaVolumeDown,
  FaStar,
  FaUser,
  FaWifi,
  FaChair,
} from "react-icons/fa";
import ProfileSettingsModal from "./ProfileSettingsModal";

// Updated location categories - replaced "Productive Study" with "Convenience Study"
const locationCategories = [
  "All Locations",
  "Libraries",
  "Cafes",
  "Favorites",
  "Popular Study",
  "Quiet Study",
  "Convenience Study",
];

function LocationTypes({
  activeCategory,
  setActiveCategory,
  onCategoryChange,
}) {
  return (
    <div className="overflow-x-auto mb-2">
      <ul className="inline-flex flex-nowrap gap-2 min-w-full m-4">
        {locationCategories.map((category) => (
          <button
            className={`p-2 rounded whitespace-nowrap flex-shrink-0 ${
              activeCategory === category
                ? "bg-blue-700 text-white"
                : "bg-white text-black hover:bg-gray-200"
            }`}
            key={category}
            onClick={() => {
              setActiveCategory(category);
              // Notify parent of category change to close InfoWindow
              if (onCategoryChange) onCategoryChange(category);
            }}
          >
            {category}
          </button>
        ))}
      </ul>
    </div>
  );
}

// Get category icon based on category type
const getCategoryIcon = (category) => {
  switch (category) {
    case "Quiet Study":
      return <FaVolumeDown className="text-green-600" size={20} />;
    case "Favorites":
      return <FaBookmark className="text-purple-600" size={20} />;
    case "Popular Study":
      return <FaStar className="text-yellow-600" size={20} />;
    case "Libraries":
      return <FaBook className="text-blue-600" size={20} />;
    case "Cafes":
      return <FaCoffee className="text-brown-600" size={20} />;
    case "Convenience Study":
      return <FaChair className="text-indigo-600" size={20} />;
    default:
      return <FaMapMarkerAlt className="text-red-600" size={20} />;
  }
};

// Individual location card component
const LocationCard = ({ location, children }) => {
  const getLocationIcon = () => {
    if (
      location.type?.toLowerCase() === "library" ||
      location.sourceType === "library"
    ) {
      return <FaBook className="text-blue-600" size={20} />;
    } else if (
      location.description?.toLowerCase().includes("cafe") ||
      location.description?.toLowerCase().includes("coffee")
    ) {
      return <FaCoffee className="text-brown-600" size={20} />;
    }
    return <FaMapMarkerAlt className="text-red-600" size={20} />;
  };

  return (
    <div className="location-card mb-4 bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2">{getLocationIcon()}</span>
          <h4 className="font-bold text-gray-800">{location.name}</h4>
        </div>
        {location.rating && (
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
            {location.rating}/5
          </span>
        )}
      </div>

      <div className="p-3 text-sm">
        {location.description && (
          <p className="text-gray-600 mb-2">{location.description}</p>
        )}

        {location.address && (
          <div className="mb-2">
            <span className="font-semibold">Address: </span>
            <span className="text-gray-700">{location.address}</span>
          </div>
        )}

        {location.hours && (
          <div className="mb-2">
            <div className="font-semibold mb-1">Hours:</div>
            <div className="pl-2 text-gray-700">
              {location.hours.open && (
                <div>
                  Open: {location.hours.open}
                  {location.hours.close && ` - ${location.hours.close}`}
                </div>
              )}
              {location.hours.days && location.hours.days.length > 0 && (
                <div className="text-xs text-gray-600">
                  {location.hours.days.join(", ")}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {children && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-sm">
          {children}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({
  libraries = [],
  mongoLocations = [],
  onFilterChange,
  onSelectLocation,
  selectedLocation,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All Locations");
  const [allLocations, setAllLocations] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [bookmarkedLocations, setBookmarkedLocations] = useState([]);
  const [locationReviews, setLocationReviews] = useState({});
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  // Add ref to store locations we've already fetched reviews for
  const fetchedReviewsRef = useRef(new Set());

  // Get user info on component mount
  useEffect(() => {
    // Get user email from localStorage or your auth system
    const userEmail =
      localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail");
    setCurrentUserEmail(userEmail);

    // If we have a user email, fetch their profile info
    if (userEmail) {
      fetchUserProfile(userEmail);
      // Fetch bookmarks for this user
      fetchUserBookmarks(userEmail);
    }
  }, []);

  // Fetch user bookmarks
  const fetchUserBookmarks = async (userEmail) => {
    setIsLoadingBookmarks(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/get_bookmarks?user_email=${userEmail}`
      );

      if (res.ok) {
        const data = await res.json();
        if (data.bookmarks && Array.isArray(data.bookmarks)) {
          console.log("Bookmarks fetched:", data.bookmarks);
          setBookmarkedLocations(data.bookmarks);
        }
      }
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    } finally {
      setIsLoadingBookmarks(false);
    }
  };

  const fetchUserProfile = async (userEmail) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/get_user?email=${userEmail}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.user.profile_picture) {
          setProfilePictureUrl(data.user.profile_picture);
        }
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  // Refresh profile picture when modal is closed
  const handleSettingsModalClose = () => {
    setShowSettingsModal(false);
    if (currentUserEmail) {
      fetchUserProfile(currentUserEmail);
    }
  };

  // Combine locations when libraries or mongoLocations change
  useEffect(() => {
    const combined = [
      ...libraries.map((lib) => ({
        ...lib,
        sourceType: "library",
      })),
      ...mongoLocations.map((loc) => ({
        ...loc,
        sourceType: "mongo",
      })),
    ];
    setAllLocations(combined);
  }, [libraries, mongoLocations]);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Handle category change
  const handleCategoryChange = (newCategory) => {
    // Close any open marker by setting selected location to null
    if (onSelectLocation) {
      onSelectLocation(null);
    }

    // No need to call setActiveCategory here as it's already set in the LocationTypes component
  };

  // Filter locations based on active category
  const getFilteredLocations = () => {
    if (activeCategory === "All Locations") {
      return allLocations;
    }

    if (activeCategory === "Libraries") {
      return allLocations.filter(
        (loc) =>
          loc.type?.toLowerCase() === "library" || loc.sourceType === "library"
      );
    }

    if (activeCategory === "Cafes") {
      // Show all cafe locations
      return allLocations.filter(
        (loc) =>
          loc.type?.toLowerCase() === "cafe" ||
          loc.description?.toLowerCase().includes("cafe") ||
          loc.description?.toLowerCase().includes("coffee")
      );
    }

    // Favorites - show bookmarked locations
    if (activeCategory === "Favorites") {
      if (isLoadingBookmarks) {
        return [
          { id: "loading", name: "Loading bookmarks...", isLoading: true },
        ];
      }

      // Get all bookmarked places by matching IDs
      // Extract IDs from various possible bookmark formats
      const bookmarkedIds = bookmarkedLocations
        .map((b) => {
          if (b.place_id) return b.place_id;
          if (b._id) return b._id;
          if (b.id) return b.id;
          return null;
        })
        .filter((id) => id !== null);

      console.log("Filtered bookmarkedIds:", bookmarkedIds);

      const favoriteLocations = allLocations.filter(
        (loc) =>
          bookmarkedIds.includes(loc.id) ||
          bookmarkedIds.includes(loc.place_id) ||
          (loc._id && bookmarkedIds.includes(loc._id))
      );

      console.log("Found favorite locations:", favoriteLocations.length);
      return favoriteLocations;
    }

    // Popular Study - top 15 places with highest overall ratings
    if (activeCategory === "Popular Study") {
      if (isLoadingReviews) {
        return [
          {
            id: "loading",
            name: "Loading popular study spots...",
            isLoading: true,
          },
        ];
      }

      // Create a copy of locations with reviews data
      const locationsWithReviews = allLocations
        .filter((loc) => locationReviews[loc.id]?.overall !== undefined) // Only include locations with reviews
        .map((loc) => ({
          ...loc,
          overallRating: locationReviews[loc.id]?.overall || 0,
        }))
        .sort((a, b) => b.overallRating - a.overallRating) // Sort by overall rating, highest first
        .slice(0, 15); // Take top 15

      return locationsWithReviews;
    }

    // Quiet Study - top 15 places with quietness rating over 3.0
    if (activeCategory === "Quiet Study") {
      if (isLoadingReviews) {
        return [
          {
            id: "loading",
            name: "Loading quiet study spots...",
            isLoading: true,
          },
        ];
      }

      // Create a copy of locations with reviews data, filtering for quietness
      const quietLocations = allLocations
        .filter((loc) => (locationReviews[loc.id]?.quietness || 0) >= 3.0) // Only include locations with quietness ≥ 3.0
        .map((loc) => ({
          ...loc,
          quietnessRating: locationReviews[loc.id]?.quietness || 0,
        }))
        .sort((a, b) => b.quietnessRating - a.quietnessRating) // Sort by quietness, quietest first
        .slice(0, 15); // Take top 15

      return quietLocations;
    }

    // Convenience Study (formerly Productive Study) - places with good seating and internet
    if (activeCategory === "Convenience Study") {
      if (isLoadingReviews) {
        return [
          {
            id: "loading",
            name: "Loading convenience study spots...",
            isLoading: true,
          },
        ];
      }

      // Create a copy of locations with reviews data, filtering for good seating AND good internet
      const convenienceLocations = allLocations
        .filter(
          (loc) =>
            (locationReviews[loc.id]?.seating || 0) >= 3.5 && // Only include locations with good seating
            (locationReviews[loc.id]?.internet || 0) >= 3.5 // AND good internet
        )
        .map((loc) => ({
          ...loc,
          convenienceRating:
            ((locationReviews[loc.id]?.seating || 0) +
              (locationReviews[loc.id]?.internet || 0)) /
            2,
        }))
        .sort((a, b) => b.convenienceRating - a.convenienceRating) // Sort by convenience rating, best first
        .slice(0, 15); // Take top 15

      return convenienceLocations;
    }

    return allLocations;
  };

  const filteredLocations = getFilteredLocations();

  // Notify parent of current filtered locations
  useEffect(() => {
    if (onFilterChange) onFilterChange(filteredLocations);
  }, [filteredLocations, onFilterChange]);

  // Instead of fetching all reviews for all locations, we'll fetch on demand
  // Remove the original useEffect that was calling fetchAllLocationReviews

  // Replace with a function that fetches reviews for a specific location
  const fetchLocationReview = async (locationId) => {
    // Skip if we've already fetched this location's reviews
    if (fetchedReviewsRef.current.has(locationId)) {
      return;
    }

    setIsLoadingReviews(true);
    try {
      console.log(`Fetching reviews for location ID: ${locationId}`);

      const res = await fetch(
        `http://localhost:5000/api/get_location_reviews?location_id=${locationId}`
      );

      if (res.ok) {
        const data = await res.json();
        console.log(`Reviews data for ID ${locationId}:`, data);

        if (data.reviews && data.reviews.length > 0) {
          // Calculate averages
          const quietnessSum = data.reviews.reduce(
            (sum, review) => sum + (review.quietness || 0),
            0
          );
          const seatingSum = data.reviews.reduce(
            (sum, review) => sum + (review.seating || 0),
            0
          );
          const vibesSum = data.reviews.reduce(
            (sum, review) => sum + (review.vibes || 0),
            0
          );
          const crowdednessSum = data.reviews.reduce(
            (sum, review) => sum + (review.crowdedness || 0),
            0
          );
          const internetSum = data.reviews.reduce(
            (sum, review) => sum + (review.internet || 0),
            0
          );

          const count = data.reviews.length;

          // Update reviews while preserving existing ones
          setLocationReviews((prevReviews) => {
            const updatedReviews = {
              ...prevReviews,
              [locationId]: {
                quietness: quietnessSum / count,
                seating: seatingSum / count,
                vibes: vibesSum / count,
                crowdedness: crowdednessSum / count,
                internet: internetSum / count,
                count: count,
                overall:
                  (quietnessSum + seatingSum + vibesSum + internetSum) /
                  (4 * count),
              },
            };
            console.log(
              `Updated reviews for ${locationId}:`,
              updatedReviews[locationId]
            );
            return updatedReviews;
          });

          // Mark as fetched
          fetchedReviewsRef.current.add(locationId);
        }
      }
    } catch (err) {
      console.error(`Error fetching reviews for ${locationId}:`, err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Make sure we have review data whenever a rating‑based category is selected
  useEffect(() => {
    if (
      ["Popular Study", "Quiet Study", "Convenience Study"].includes(
        activeCategory
      )
    ) {
      // If we don't yet have any filtered locations (because ratings are missing),
      // fall back to *all* locations so we can fetch their reviews.
      const candidateLocations =
        filteredLocations.length > 0 ? filteredLocations : allLocations;

      const locationsToFetch = candidateLocations.filter(
        (loc) => !fetchedReviewsRef.current.has(loc.id)
      );

      locationsToFetch.forEach((loc) => fetchLocationReview(loc.id));
    }
  }, [filteredLocations, allLocations, activeCategory]);

  // When a location is selected, fetch its reviews if we don't have them yet
  useEffect(() => {
    if (selectedLocation && !fetchedReviewsRef.current.has(selectedLocation)) {
      fetchLocationReview(selectedLocation);
    }
  }, [selectedLocation]);

  // Listen for review updates from the map component
  useEffect(() => {
    const handleReviewsUpdated = (event) => {
      const { locationId } = event.detail;
      if (locationId) {
        console.log(
          `Sidebar received reviewsUpdated event for location ${locationId}`
        );
        // Re-fetch reviews for this location to update category data
        fetchLocationReview(locationId);

        // Remove from fetched list to ensure it's refreshed
        fetchedReviewsRef.current.delete(locationId);
      }
    };

    window.addEventListener("reviewsUpdated", handleReviewsUpdated);

    return () => {
      window.removeEventListener("reviewsUpdated", handleReviewsUpdated);
    };
  }, []);

  return (
    <>
      <div
        className={`toggle-button z-30 ${collapsed ? "with-background" : ""}`}
        onClick={toggleSidebar}
      >
        {collapsed ? "→" : "←"}
      </div>

      <div className={`sidebar z-20 ${collapsed ? "collapsed" : "open"}`}>
        {/* Sticky header */}
        <div className="sidebar-header z-20 font-bold">
          {/* Profile picture and settings */}
          <div className="absolute flex top-[-4px] right-[-4px]">
            {currentUserEmail && (
              <div
                onClick={() => setShowSettingsModal(true)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer overflow-hidden flex items-center justify-center transition-transform hover:scale-110"
                title="Profile Settings"
              >
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUser size={18} className="text-gray-500" />
                )}
              </div>
            )}
          </div>
          <div className="flex justify-between items-center size-sm">
            <h1>Study Locations</h1>
          </div>
          <LocationTypes
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {/* Scrollable content */}
        <div className="sidebar-scrollable-content">
          <div className="category-header">
            <div className="flex items-center gap-2">
              {getCategoryIcon(activeCategory)}
              <h3 className="ml-2">{activeCategory}</h3>
            </div>
            <div className="location-count">
              {filteredLocations.length}{" "}
              {filteredLocations.length === 1 ? "location" : "locations"}
            </div>
          </div>

          {filteredLocations.length > 0 ? (
            <div className="location-list p-2">
              {filteredLocations.map((location) => {
                if (location.isLoading) {
                  return (
                    <div
                      key={location.id}
                      className="location-card mb-4 bg-white rounded-lg shadow-md overflow-hidden p-4 flex justify-center items-center"
                    >
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                      <span className="text-gray-500">{location.name}</span>
                    </div>
                  );
                }

                if (location.isComingSoon) {
                  return (
                    <div
                      key={location.id}
                      className="location-card mb-4 bg-white rounded-lg shadow-md overflow-hidden p-4 text-center"
                    >
                      <span className="text-gray-500 italic">
                        {location.name}
                      </span>
                    </div>
                  );
                }

                // Show additional rating info based on category
                let additionalInfo = null;
                if (
                  activeCategory === "Quiet Study" &&
                  locationReviews[location.id]
                ) {
                  additionalInfo = (
                    <div className="mt-2 bg-green-50 p-2 rounded text-sm">
                      <span className="font-semibold">Quietness rating:</span>{" "}
                      {locationReviews[location.id].quietness.toFixed(1)}/5
                    </div>
                  );
                } else if (
                  activeCategory === "Popular Study" &&
                  locationReviews[location.id]
                ) {
                  additionalInfo = (
                    <div className="mt-2 bg-yellow-50 p-2 rounded text-sm">
                      <span className="font-semibold">Overall rating:</span>{" "}
                      {locationReviews[location.id].overall.toFixed(1)}/5
                    </div>
                  );
                } else if (
                  activeCategory === "Convenience Study" &&
                  locationReviews[location.id]
                ) {
                  additionalInfo = (
                    <div className="mt-2 bg-indigo-50 p-2 rounded text-sm flex flex-col gap-1">
                      <div className="flex items-center">
                        <FaChair className="mr-1 text-indigo-600" size={12} />
                        <span className="font-semibold">Seating:</span>{" "}
                        {locationReviews[location.id].seating.toFixed(1)}/5
                      </div>
                      <div className="flex items-center">
                        <FaWifi className="mr-1 text-indigo-600" size={12} />
                        <span className="font-semibold">Internet:</span>{" "}
                        {locationReviews[location.id].internet.toFixed(1)}/5
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={location.id}
                    onClick={() => onSelectLocation(location.id)}
                    className="cursor-pointer"
                  >
                    <LocationCard location={location}>
                      {additionalInfo}
                    </LocationCard>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-locations-message">
              <p>No {activeCategory.toLowerCase()} found</p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        show={showSettingsModal}
        onClose={handleSettingsModalClose}
        currentUserEmail={currentUserEmail}
        setProfilePictureUrl={setProfilePictureUrl}
      />
    </>
  );
};

export default Sidebar;
