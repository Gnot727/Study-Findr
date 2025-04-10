import React, {useState} from "react";
import "./Sidebar.css";


const Sidebar = () => {
        const [collapsed, setCollapsed] = useState(false);
        const toggleSidebar = () => {
            setCollapsed(!collapsed);
        };
    
        return (
            <>
                <div className="toggle-button" onClick={toggleSidebar}>
                    {collapsed ? "→" : "←"}
                </div>
    
                <div className={`sidebar ${collapsed ? "collapsed" : "open"}`}>
                    {/* Sidebar Content */}
                    <div className="sidebar-content">
                        <h1>Sidebar Contents</h1>
                        <div className="sidebar-section">
                            <h3>Productive Spots</h3>
                            <ul>
                                <li>Option 1</li>
                                <li>Option 2</li>
                                <li>Option 3</li>
                            </ul>
                        </div>

                        <div className="sidebar-section">
                            <h3>Quiet Spots</h3>
                            <ul>
                                <li>Option 1</li>
                                <li>Option 2</li>
                                <li>Option 3</li>
                            </ul>
                        </div>

                        <div className="sidebar-section">
                            <h3>Popular Spots</h3>
                            <ul>
                                <li>Option 1</li>
                                <li>Option 2</li>
                                <li>Option 3</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </>
        );
    };
    
export default Sidebar;