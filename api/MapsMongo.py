from pymongo import MongoClient

client = MongoClient("mongodb+srv://JavierM333:Nd9WiQZjuf2gbkv@studyfindr.n8ss9.mongodb.net/studyfindr")
db = client["places_db"]
collection = db["cafes"]

# remove fields from all documents
collection.update_many({}, {
    "$unset": {
        "scope": "",
        "types": "",
        "opening_hours.open_now": ""
    }
})
