import React, { useState, useEffect } from "react";
import MapComponent from "./myMap";
import Sidebar from "./Sidebar";

const Dashboard = () => {
  // State to store all locations
  const [libraries, setLibraries] = useState([]);
  const [mongoLocations, setMongoLocations] = useState([]);

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

  // Fetch MongoDB locations when component mounts
  useEffect(() => {
    fetchMongoLocations();
  }, []);

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <Sidebar libraries={libraries} mongoLocations={mongoLocations} />

      <div className="flex-grow">
        <MapComponent
          libraries={libraries}
          mongoLocations={mongoLocations}
          setLibraries={setLibraries}
          setMongoLocations={setMongoLocations}
        />
      </div>
    </div>
  );
};

export default Dashboard;
