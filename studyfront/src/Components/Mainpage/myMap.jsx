import React, { useState } from "react";
import {
  GoogleMap,
  InfoWindow,
  LoadScript,
  Marker,
} from "@react-google-maps/api";
import "./myMap.css"; // Fix the import path with a relative path
import bookmarkComponent from "./bookmarks.tsx";
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

  const bounds = {
    north: 29.675,
    south: 29.613,
    west: -82.394,
    east: -82.315,
  };

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

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <LoadScript googleMapsApiKey={ApiKey}>
        <GoogleMap
          mapContainerStyle={mapStyles}
          zoom={15}
          center={defaultCenter}
          options={{
            styles: customMapStyle,
            restriction: {
              latLngBounds: bounds,
              strictBounds: false,
            },
            streetViewControl: false,
            zoomControl: false, // Hide zoom controls
            mapTypeControl: false, // Hide map type controls
            fullscreenControl: false, // Hide fullscreen control
          }}
        >
          {libraries.map((lib) => (
            <Marker
              key={lib.id}
              position={lib.position}
              title={lib.name}
              onClick={() => setSelectMarker(lib)}
            />
          ))}

          {selectMarker && (
            <InfoWindow
              position={selectMarker.position}
              onCloseClick={() => setSelectMarker(null)}
            >
              <div className="flex flex-col w-64 p-3 relative pb-12">
                <h3 className="text-lg font-bold mb-2">{selectMarker.name}</h3>
                
                {selectMarker.description && (
                  <p className="text-sm mb-2">{selectMarker.description}</p>
                )}
                
                {selectMarker.address && (
                  <p className="text-sm mb-2"><span className="font-semibold">Address:</span> {selectMarker.address}</p>
                )}
                
                {selectMarker.hours && (
                  <div className="text-sm mb-2">
                    <p className="mb-1">
                      <span className="font-semibold">Hours:</span> {selectMarker.hours.open} 
                      {selectMarker.hours.close ? ` - ${selectMarker.hours.close}` : ""}
                    </p>
                    <p><span className="font-semibold">Open:</span> {selectMarker.hours.days.join(", ")}</p>
                  </div>
                )}
                
                {/* Button positioned at bottom with proper spacing */}
                <button 
                  className="absolute bottom-2 left-0 right-0 mx-3 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Add Details
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
    </div>
  );
};

export default MapComponent;
