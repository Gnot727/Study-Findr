import React, { useState, useEffect } from "react";
import "./StudyPopup.css";

const StudyPopup = ({ userEmail }) => {
  const [goal, setGoal] = useState(0);
  const [current, setCurrent] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [displayTime, setDisplayTime] = useState("00:00:00");

  const fetchHours = async () => {
    try {
      const goalRes = await fetch(`/api/get_weekly_goal?email=${userEmail}`);
      const currentRes = await fetch(`/api/get_current_hours?email=${userEmail}`);

      const goalData = await goalRes.json();
      const currentData = await currentRes.json();

      if (goalRes.ok) setGoal(goalData.weekly_goal_hours  0);
      if (currentRes.ok) {
        setCurrent(currentData.current_weekly_hours || 0);
        setDisplayTime(convertToHMS(currentData.current_weekly_hours || 0));
      }
    } catch (err) {
      console.error("Error fetching hours:", err);
    }
  };

  const convertToHMS = (decimalHours) => {
    const totalSeconds = Math.floor(decimalHours * 3600);
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const secs = String(totalSeconds % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  const handleGoalChange = async () => {
    const newGoal = prompt("Enter your new weekly goal (hours):", goal);
    if (!newGoal || isNaN(newGoal)) return;

    try {
      const res = await fetch("/api/update_weekly_goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, weekly_goal_hours: parseInt(newGoal) }),
      });

      if (res.ok) setGoal(parseInt(newGoal));
    } catch (err) {
      console.error("Failed to update goal:", err);
    }
  };

  const handleStartStop = async () => {
    if (isTracking) {
      const elapsed = (Date.now() - startTime) / (1000 * 60 * 60);
      const updated = parseFloat((current + elapsed).toFixed(5));

      try {
        const res = await fetch("/api/update_current_hours", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail, current_weekly_hours: updated }),
        });

        if (res.ok) {
          setCurrent(updated);
          setDisplayTime(convertToHMS(updated));
          setIsTracking(false);
          setStartTime(null);
        }
      } catch (err) {
        console.error("Error updating current hours:", err);
      }
    } else {
      setStartTime(Date.now());
      setIsTracking(true);
    }
  };

  const handleReset = async () => {
    const confirmReset = window.confirm("Reset your weekly hours?");
    if (!confirmReset) return;

    try {
      const res = await fetch("/api/reset_current_hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      if (res.ok) {
        setCurrent(0);
        setDisplayTime("00:00:00");
      }
    } catch (err) {
      console.error("Failed to reset hours:", err);
    }
  };

  useEffect(() => {
    fetchHours();
  }, [userEmail]);

  useEffect(() => {
    let interval;
    if (isTracking) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / (1000 * 60 * 60);
        const updated = current + elapsed;
        setDisplayTime(convertToHMS(updated));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const progress = goal ? Math.min((current / goal) * 100, 100) : 0;

  return (
    <div className="study-popup-container">
      <div className="study-popup-progress" onClick={() => setShowPopup(!showPopup)}>
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        <span>{`${Math.round(progress)}%`}</span>
      </div>

      {showPopup && (
        <div className="study-popup">
          <h3>Study Tracker</h3>
          <p><strong>Goal:</strong> {goal} hrs</p>
          <p><strong>Current:</strong> {displayTime}</p>

          <button onClick={handleStartStop}>
            {isTracking ? "Stop" : "Start"} Timer
          </button>
          <button className="change-goal" onClick={handleGoalChange}>
            Change Goal
          </button>
          <button className="reset-btn" onClick={handleReset}>
            Reset Week
          </button>
        </div>
      )}
    </div>
  );
};

export default StudyPopup;
