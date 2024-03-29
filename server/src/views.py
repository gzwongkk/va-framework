from src import app
from src.models import Model
from flask import request
import json

# initialize the model
model = Model()
print("================================================================")


@app.route('/get')
def _get():
    return "Get"


@app.route('/get_data')
def _get_data():
    return model.get_data()

@app.route('/get_movies')
def _get_movies():
    return model.get_data_by_type(type="Movie")

@app.route('/get_tv_shows')
def _get_tv_shows():
    return model.get_data_by_type(type="TV Show")

@app.route('/get_year_distribution')
def _get_year_distribution():
    return model.get_distribution('release_year')

@app.route('/get_director_distribution')
def _get_director_distribution():
    return model.get_distribution('director')

@app.route('/get_country_distribution')
def _get_country_distribution():
    return model.get_unique_distribution('country')

@app.route('/get_genre_distribution')
def _get_genre_distribution():
    return model.get_unique_distribution('listed_in')

@app.route('/get_bill_burr')
def _get_items_by_actor():
    return model.get_items_by_actor('Bill Burr')


@app.route('/get_data_by_year', methods=['POST'])
def _get_items_by_year():
    post_data = request.data.decode()
    if post_data == "":
        return ""
    post_data = json.loads(post_data)
    return model.get_items_by_year(post_data)
