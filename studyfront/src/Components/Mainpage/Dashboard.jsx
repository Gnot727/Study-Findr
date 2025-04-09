import React, {useState} from "react";
import MapComponent from "./myMap";
import Sidebar from "./Sidebar";

const Dashboard = () => {
    return (
        <div className="flex w-screen h-screen overflow-hidden">
            <Sidebar />

            <div className="flex-grow">
                <MapComponent />
            </div>
        </div>
    );
};

export default Dashboard;