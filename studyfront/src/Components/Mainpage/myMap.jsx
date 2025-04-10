import React, { useState, useEffect, useRef } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import "./myMap.css";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { FaMapMarkerAlt, FaBook, FaCoffee } from "react-icons/fa";

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
          onLoad={(map) => {
            mapRef.current = map;
          }}
          options={{
            styles: mapStyling,
            restriction: {
              latLngBounds: bounds,
              strictBounds: false,
            },
            streetViewControl: false,
            fullscreenControl: false,
          }}
        >
          {/* Display libraries */}
          {libraries.map((lib) => (
            <CustomMarker
              key={lib.id}
              position={lib.position}
              title={lib.name}
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
            />
          ))}

          {selectMarker && (
            <InfoWindow
              position={selectMarker.position}
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
                  <div className="text-sm mb-2">
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
                >
                  Add Details
                </button>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}

export default MapComponent;
