//npm install "@react-google-maps/api"

import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const MapComponent = () => {
  const mapStyles = {
    height: '850px',
    width: '100%',
  };

  const defaultCenter = {
    lat: 29.6456, // Default latitude
    lng: -82.3519,  // Default longitude
  };
  const MarstonLib ={
    lat: 29.6479572,
    lng: -82.3439199,
  };

  const libWest = {
    lat:29.6508246,
    lng:-82.3417565,
  };
  const smathersLib = {
    lat:29.6515513,
    lng:-82.34281469999999,
  }

  const libraries = [
    {id: 1, position: MarstonLib, name: "Marston Library"},
    {id: 2, position: libWest, name: "Library West"},
    {id: 3, position: smathersLib, name: "Smathers Library"},
  ]

  const customMapStyle =[
    {featureType: "poi",
    elementType: "labels",
    stylers: [{visibility: "off"}]
    },
  ];

  return (
    <LoadScript googleMapsApiKey="AIzaSyDZxU-53zEwtvAwvacTlNUdaceBIycwAus">
      <GoogleMap mapContainerStyle={mapStyles} zoom={15} center={defaultCenter} options={{styles: customMapStyle}}>
        {libraries.map(lib => (
            <Marker key={lib.id} position={lib.position} title={lib.name} />
        ))}
        
      </GoogleMap>
    </LoadScript>
  );
};

export default MapComponent;