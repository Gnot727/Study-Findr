import React, {useState} from 'react';
import { GoogleMap, InfoWindow, LoadScript, Marker } from '@react-google-maps/api';
//npm install "@react-google-maps/api"


const MapComponent = () => {
  const mapStyles = {
    
    height: '850px',
    width: '100%',
  };

  const defaultCenter = {
    lat: 29.6456, // Default latitude
     lng: -82.3519,  // Default longitude
   };
  const libWest = {
    
    lat:29.6515513,
    lng:-82.34281469999999,
  };
  const smathersLib = {
    lat:29.6508246,
    lng:-82.3417565,
  }
  const MarstonLib ={
    lat: 29.6479572,
    lng: -82.3439199,
  };
  const libraries = [
    {id: 1, position: MarstonLib, name: "Marston Library"},
    {id: 2, position: libWest, name: "Library West"},
    {id: 3, position: smathersLib, name: "Smathers Library"},
  ]
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
      stylers: [{ visibility: "off" }]
    }
  ];
  const ApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  const [selectMarker, setSelectMarker] = useState(null);

  return (
    <LoadScript googleMapsApiKey={ApiKey}>
      <GoogleMap 
        mapContainerStyle={mapStyles} 
        zoom={15} 
        center={defaultCenter} 
        options={{ styles: customMapStyle,
            restriction: {
                latLngBounds: bounds,
                strictBounds: false,
            }
        }} // Make sure this is correctly passed
      >
        {libraries.map(lib => (
          <Marker key={lib.id}
           position={lib.position} 
           title={lib.name} 
           onClick={ () => setSelectMarker(lib)}/>
        ))}
        {selectMarker && (
            <InfoWindow position={selectMarker.position} 
            onCloseClick={ () => setSelectMarker(null)}
            >
            <div>
            <h3>{selectMarker.name}</h3>
            </div>
            </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default MapComponent;