import React from "react";
import MapComponent from "./myMap";

const Dashboard = () => {
    return(
        <div className="w-screen h-screen overflow-hidden">
            <MapComponent/>
        </div>
    );
};

export default Dashboard;