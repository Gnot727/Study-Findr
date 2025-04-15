import React, { useState, useRef, useEffect } from 'react';
import { FaUser, FaCamera, FaTimes } from 'react-icons/fa';

function ProfileSettingsModal({ show, onClose, currentUserEmail, setProfilePictureUrl }) {
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef(null);
  
  // Fetch user data on component mount
  useEffect(() => {
    if (show && currentUserEmail) {
      fetchUserData();
    }
  }, [show, currentUserEmail]);
  
  const fetchUserData = async () => {
    if (!currentUserEmail) return;
    
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/get_user?email=${currentUserEmail}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const data = await res.json();
      
      if (data.user) {
        setUsername(data.user.username || '');
        
        // If user has a profile picture, set it
        if (data.user.profile_picture) {
          setPreviewUrl(data.user.profile_picture);
        }
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load user data. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUserEmail) {
      setError("You must be logged in to update your profile.");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const formData = new FormData();
      formData.append('email', currentUserEmail);
      formData.append('username', username);
      
      if (profilePicture) {
        formData.append('profile_picture', profilePicture);
      }
      
      const res = await fetch('http://localhost:5000/api/update_profile', {
        method: 'POST',
        body: formData  // No Content-Type header - browser sets it with boundary
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.errors?.general || 'Failed to update profile');
      }
      
      const data = await res.json();
      setSuccess(true);
      
      // Update preview URL if the server returns an updated URL
      if (data.user && data.user.profile_picture) {
        setPreviewUrl(data.user.profile_picture);
        // Update the parent component's state with the new profile picture URL
        if (setProfilePictureUrl) {
          setProfilePictureUrl(data.user.profile_picture);
        }
      }
      
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[400px] max-w-[95vw]">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800">Profile Settings</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-5 flex flex-col items-center justify-center">
            <div 
              className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-3 relative flex items-center justify-center"
              onClick={triggerFileInput}
            >
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUser size={40} className="text-gray-400" />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all flex items-center justify-center">
                <FaCamera className="text-white opacity-0 hover:opacity-100" size={24} />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button 
              type="button"
              onClick={triggerFileInput}
              className="text-blue-500 text-sm hover:underline"
            >
              {previewUrl ? "Change Profile Picture" : "Upload Profile Picture"}
            </button>
          </div>
          
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your username"
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              Profile updated successfully!
            </div>
          )}
          
          <div className="flex justify-end border-t pt-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="mr-3 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileSettingsModal; 