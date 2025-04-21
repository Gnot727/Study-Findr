import requests
import time
import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables from .env file
load_dotenv()

def search_nearby_cafes(api_key, location, radius=1000, keyword=None, open_now=None, page_token=None):
    """
    Searches for cafes within a specified radius of a given location.
    
    Args:
        api_key (str): Google Maps API key
        location (str): Latitude/longitude in the format "lat,lng"
        radius (int): Search radius in meters
        keyword (str, optional): Additional keyword to filter results
        open_now (bool, optional): Whether to return only cafes that are open now
        page_token (str, optional): Token for the next page of results
    
    Returns:
        dict: Response from Google Places API containing cafe information
    """
    base_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    
    if page_token:
        params = {
            "pagetoken": page_token,
            "key": api_key
        }
    else:
        params = {
            "location": location,
            "radius": radius,
            "type": "cafe",
            "key": api_key
        }
        
        if keyword:
            params["keyword"] = keyword
        
        if open_now is not None:
            params["open_now"] = "true" if open_now else "false"
    
    response = requests.get(base_url, params=params)
    return response.json()

def get_all_cafes(api_key, location, radius=1500, keyword=None, open_now=None, max_results=None):
    """
    Retrieves all cafes within specified radius by handling pagination.
    
    Args:
        api_key (str): Google Maps API key
        location (str): Latitude/longitude in the format "lat,lng"
        radius (int): Search radius in meters
        keyword (str, optional): Additional keyword to filter results
        open_now (bool, optional): Whether to return only cafes that are open now
        max_results (int, optional): Maximum number of results to return
    
    Returns:
        list: All cafe results from all pages up to max_results
    """
    all_cafes = []
    response = search_nearby_cafes(api_key, location, radius, keyword, open_now)
    
    # Add results from first page
    if "results" in response:
        all_cafes.extend(response["results"])
    
    # Handle pagination
    while "next_page_token" in response:
        # Check if we've reached the maximum number of results
        if max_results and len(all_cafes) >= max_results:
            all_cafes = all_cafes[:max_results]
            break
        
        # Google API requires a short delay before using next_page_token
        time.sleep(2)
        
        page_token = response["next_page_token"]
        response = search_nearby_cafes(api_key, location, radius, keyword, open_now, page_token)
        
        if "results" in response:
            all_cafes.extend(response["results"])
    
    # Final check for max_results
    if max_results and len(all_cafes) > max_results:
        all_cafes = all_cafes[:max_results]
    
    return all_cafes

def save_cafes_to_mongodb(cafes_data):
    """
    Saves cafe data to MongoDB.
    
    Args:
        cafes_data (list): List of cafe dictionaries from Google Places API
        
    Returns:
        tuple: (success status, message)
    """
    try:
        # Connect to MongoDB using URI from environment variable
        mongo_uri = os.getenv('MONGO_URI')
        if not mongo_uri:
            return False, "MongoDB URI not found in environment variables"
        
        # Connect to the database
        client = MongoClient(mongo_uri)
        places_db = client['places_db']
        cafes_collection = places_db['cafes']
        
        # Insert or update each cafe
        insert_count = 0
        update_count = 0
        
        for cafe in cafes_data:
            # Use place_id as a unique identifier if available
            if 'place_id' in cafe:
                # Check if this cafe already exists
                existing_cafe = cafes_collection.find_one({"place_id": cafe["place_id"]})
                
                if existing_cafe:
                    # Update existing cafe
                    cafes_collection.update_one(
                        {"place_id": cafe["place_id"]},
                        {"$set": cafe}
                    )
                    update_count += 1
                else:
                    # Insert new cafe
                    cafes_collection.insert_one(cafe)
                    insert_count += 1
            else:
                # No place_id, use name and location as identifier
                if 'name' in cafe and 'geometry' in cafe and 'location' in cafe['geometry']:
                    existing_cafe = cafes_collection.find_one({
                        "name": cafe["name"],
                        "geometry.location.lat": cafe["geometry"]["location"]["lat"],
                        "geometry.location.lng": cafe["geometry"]["location"]["lng"]
                    })
                    
                    if existing_cafe:
                        # Update existing cafe
                        cafes_collection.update_one(
                            {
                                "name": cafe["name"],
                                "geometry.location.lat": cafe["geometry"]["location"]["lat"],
                                "geometry.location.lng": cafe["geometry"]["location"]["lng"]
                            },
                            {"$set": cafe}
                        )
                        update_count += 1
                    else:
                        # Insert new cafe
                        cafes_collection.insert_one(cafe)
                        insert_count += 1
                else:
                    # Cannot identify cafe uniquely, just insert
                    cafes_collection.insert_one(cafe)
                    insert_count += 1
        
        return True, f"Successfully processed {len(cafes_data)} cafes. Inserted: {insert_count}, Updated: {update_count}"
        
    except Exception as e:
        return False, f"Error saving cafes to MongoDB: {str(e)}"

def fetch_and_store_cafes(api_key, location, radius=5000):
    """
    Fetches cafes from Google Places API and stores them in MongoDB.
    
    Args:
        api_key (str): Google Maps API key
        location (str): Latitude/longitude in the format "lat,lng" or list of such coordinates
        radius (int): Search radius in meters (max 50000, but results limited to 60 places per location)
        
    Returns:
        dict: Status and result of the operation
    """
    try:
        total_cafes = []
        total_processed = 0
        
        # Define locations to search in Gainesville area if a single point is provided
        # This ensures better coverage of the entire city
        if isinstance(location, str) and location == "29.6456,-82.3519":  # Default Gainesville location
            locations = [
                "29.6456,-82.3519",  # Downtown Gainesville
                "29.6785,-82.3572",  # UF campus area
                "29.6158,-82.3747",  # Southwest Gainesville
                "29.6677,-82.3365",  # Northwest Gainesville
                "29.6394,-82.3066"   # East Gainesville
            ]
        elif isinstance(location, list):
            locations = location
        else:
            locations = [location]
        
        for loc in locations:
            print(f"Searching cafes near {loc} with radius {radius}m")
            
            # Get cafes from Google Places API for this location
            cafes_data = get_all_cafes(api_key, loc, radius)
            if cafes_data:
                total_cafes.extend(cafes_data)
                print(f"Found {len(cafes_data)} cafes at location {loc}")
            
            # Avoid rate limits
            if len(locations) > 1:
                time.sleep(2)
        
        # Remove duplicates based on place_id
        seen_place_ids = set()
        unique_cafes = []
        
        for cafe in total_cafes:
            if 'place_id' in cafe and cafe['place_id'] not in seen_place_ids:
                seen_place_ids.add(cafe['place_id'])
                unique_cafes.append(cafe)
        
        print(f"Total unique cafes found: {len(unique_cafes)}")
        
        if not unique_cafes:
            return {
                "success": False,
                "message": "No cafes found from Google Places API"
            }
        
        # Save cafes to MongoDB
        success, message = save_cafes_to_mongodb(unique_cafes)
        
        return {
            "success": success,
            "message": message,
            "cafe_count": len(unique_cafes)
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Error fetching and storing cafes: {str(e)}"
        }

# Example usage
if __name__ == "__main__":
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    location = "29.6456,-82.3519"  # Gainesville, FL
    
    result = fetch_and_store_cafes(api_key, location)
    print(result["message"])
    if result["success"]:
        print(f"Total cafes processed: {result['cafe_count']}")