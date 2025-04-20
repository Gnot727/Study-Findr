import React, { useState, useEffect } from "react";
import MapComponent from "./myMap";
import Sidebar from "./Sidebar";

const Dashboard = () => {
  // State to store all locations
  const [libraries, setLibraries] = useState([]);
  const [mongoLocations, setMongoLocations] = useState([]);
  // State to receive filtered locations from Sidebar
  const [filteredLocations, setFilteredLocations] = useState([]);
  // Track selected location ID
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Hardcoded libraries data - same as in MapComponent
  useEffect(() => {
    const libData = [
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
    setLibraries(libData);
  }, []);

  // Function to fetch cafe locations from MongoDB
  const fetchCafeLocations = async () => {
    try {
      // Use the same endpoint that works in myMap.jsx
      const possibleEndpoints = [
        "http://localhost:5000/api/cafes",
        "http://localhost:5000/api/get_cafes",
        "/api/cafes",
        "/api/get_cafes",
      ];

      let response = null;
      let data = null;

      // Try each endpoint until one works
      for (const endpoint of possibleEndpoints) {
        try {
          const resp = await fetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (resp.ok) {
            response = resp;
            break;
          }
        } catch (err) {
          // Continue to next endpoint
        }
      }

      if (response) {
        data = await response.json();

        // Extract the cafes from the response
        let cafes = data.cafes || data.places || data.results || data;

        // Handle case where the data might be a single cafe object
        if (cafes && !Array.isArray(cafes)) {
          if (cafes.cafes && Array.isArray(cafes.cafes)) {
            cafes = cafes.cafes;
          } else if (cafes._id) {
            // It's a single object, convert to array
            cafes = [cafes];
          } else {
            // Try to find any array in the data
            for (const key in data) {
              if (Array.isArray(data[key]) && data[key].length > 0) {
                cafes = data[key];
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

          // Name to lowercase for checking
          const name = (place.name || "").toLowerCase();

          // Check if the name contains any of the study-friendly cafe terms
          const isStudyFriendlyCafe = studyFriendlyCafes.some((cafe) =>
            name.includes(cafe)
          );

          return isStudyFriendlyCafe || place.isStudySpot;
        };

        // Format the locations from MongoDB - using the same format as in myMap.jsx
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
            lat = 29.6516; // Default to UF area
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
            lng = -82.3248; // Default to UF area
          }

          // Determine location type based on the icon URL or name
          let locationType = "cafe"; // Default for this fetch

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
            description: place.types ? place.types.join(", ") : "Coffee Shop",
            address: place.vicinity || place.address,
            rating: rating,
            price_level: priceLevel,
            photos: place.photos,
            type: "cafe", // Explicitly set type to cafe
            place_id: place.place_id,
            originalIcon: place.icon,
            isStudySpot: true, // We'll assume all cafes are study spots for the sidebar
            sourceType: "mongo", // Mark as coming from MongoDB
          };
        });

        // Filter out locations with invalid coordinates
        const validLocations = formattedLocations.filter((loc) => {
          return !isNaN(loc.position.lat) && !isNaN(loc.position.lng);
        });

        // Update the state with validated cafe locations
        setMongoLocations(validLocations);
        console.log("Loaded cafes for sidebar:", validLocations.length);
      } else {
        console.error("Failed to fetch cafe data from any endpoint");
      }
    } catch (error) {
      console.error("Error fetching cafe locations:", error);
    }
  };

  // Fetch MongoDB locations when component mounts
  useEffect(() => {
    fetchCafeLocations();
  }, []);

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <Sidebar
        libraries={libraries}
        mongoLocations={mongoLocations}
        onFilterChange={setFilteredLocations}
        onSelectLocation={setSelectedLocation}
      />

      <div className="flex-grow">
        <MapComponent
          // Only render markers for the filtered locations
          filteredLocations={filteredLocations}
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
        />
      </div>
    </div>
  );
};

export default Dashboard;
