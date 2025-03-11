import React from 'react';
import {createRoot} from 'react-dom/client';
import {APIProvider, Map} from '@vis.gl/react-google-maps';


//npm install "@vis.gl/react-google-maps"
//npm install "@googlemaps/markerclusterer"

const MapComponent = () => {
    //console.log(process.env);
    const googleAPI = process.env.REACT_APP_GOOGLE_MAPS_API_KEY

    return(
    <APIProvider apikey ={googleAPI}>
        <Map
        center={{ lat: 29.6516, lng: -82.3248 }}
        zoom={14}
        style={{ width: "100%", height: "500px" }}
        gestureHandling="greedy"
    >
        </Map>
    </APIProvider>

);
};

export default MapComponent;
