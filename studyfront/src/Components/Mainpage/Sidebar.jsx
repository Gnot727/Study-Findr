import React, { useState, useEffect } from "react";
import "./Sidebar.css";
import {
  FaBook,
  FaCoffee,
  FaMapMarkerAlt,
  FaUsers,
  FaVolumeDown,
  FaStar,
  FaUser,
} from "react-icons/fa";
import ProfileSettingsModal from "./ProfileSettingsModal";

// Restore the original location categories
const locationCategories = [
  "All Locations",
  "Libraries",
  "Cafes",
  "Quiet Study",
  "Productive Study",
  "Popular Study",
  "Group Study",
];

function LocationTypes({ activeCategory, setActiveCategory }) {
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
            onClick={() => setActiveCategory(category)}
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
    case "Group Study":
      return <FaUsers className="text-purple-600" size={20} />;
    case "Popular Study":
      return <FaStar className="text-yellow-600" size={20} />;
    case "Libraries":
      return <FaBook className="text-blue-600" size={20} />;
    case "Cafes":
      return <FaCoffee className="text-brown-600" size={20} />;
    default:
      return <FaMapMarkerAlt className="text-red-600" size={20} />;
  }
};

// Individual location card component
const LocationCard = ({ location }) => {
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
    <div className="location-card mb-4 bg-white rounded-lg shadow-md overflow-hidden">
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
    </div>
  );
};

const Sidebar = ({ libraries = [], mongoLocations = [] }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All Locations");
  const [allLocations, setAllLocations] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);

  // Get user info on component mount
  useEffect(() => {
    // Get user email from localStorage or your auth system
    const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
    setCurrentUserEmail(userEmail);
    
    // If we have a user email, fetch their profile info
    if (userEmail) {
      fetchUserProfile(userEmail);
    }
  }, []);
  
  const fetchUserProfile = async (userEmail) => {
    try {
      const res = await fetch(`http://localhost:5000/api/get_user?email=${userEmail}`);
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
      return allLocations.filter(
        (loc) =>
          loc.description?.toLowerCase().includes("cafe") ||
          loc.description?.toLowerCase().includes("coffee")
      );
    }

    // For future implementation: these filters will need proper data
    // Currently showing all locations for these categories
    if (
      activeCategory === "Quiet Study" ||
      activeCategory === "Productive Study" ||
      activeCategory === "Popular Study" ||
      activeCategory === "Group Study"
    ) {
      // In the future, implement specific filtering based on properties
      // For now, return all locations
      return allLocations;
    }

    return allLocations;
  };

  const filteredLocations = getFilteredLocations();

  return (
    <>
      <div
        className={`toggle-button ${collapsed ? "with-background" : ""}`}
        onClick={toggleSidebar}
      >
        {collapsed ? "→" : "←"}
      </div>

      <div className={`sidebar ${collapsed ? "collapsed" : "open"}`}>
        {/* Sticky header */}
        <div className="sidebar-header font-bold">
          <div className="flex justify-between items-center mb-2 px-4 pt-4">
            <div className="flex items-center">
              {currentUserEmail && (
                <div 
                  onClick={() => setShowSettingsModal(true)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full mr-3 cursor-pointer overflow-hidden flex items-center justify-center transition-transform hover:scale-110"
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
              <h1>Study Locations</h1>
            </div>
          </div>
          <LocationTypes
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </div>

        {/* Scrollable content */}
        <div className="sidebar-scrollable-content">
          <div className="category-header">
            <div className="flex items-center">
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
              {filteredLocations.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))}
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
