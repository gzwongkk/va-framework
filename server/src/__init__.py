from flask import Flask
from flask_cors import CORS
from flask_pymongo import PyMongo


app = Flask(__name__)
CORS(app)
app.config["MONGO_URI"] = "mongodb://localhost:27017/"
mongo = PyMongo(app)

from src import views