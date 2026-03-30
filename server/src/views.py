from pydantic import BaseModel

from src import app
from src.models import Model

# initialize the model
model = Model()
print("================================================================")


class YearFilter(BaseModel):
    year: int


@app.get('/get')
def _get():
    return 'Get'


@app.get('/get_data')
def _get_data():
    return model.get_data()


@app.get('/get_movies')
def _get_movies():
    return model.get_data_by_type(dtype='Movie')


@app.get('/get_tv_shows')
def _get_tv_shows():
    return model.get_data_by_type(dtype='TV Show')


@app.get('/get_year_distribution')
def _get_year_distribution():
    return model.get_distribution('release_year')


@app.get('/get_director_distribution')
def _get_director_distribution():
    return model.get_distribution('director')


@app.get('/get_country_distribution')
def _get_country_distribution():
    return model.get_unique_distribution('country')


@app.get('/get_genre_distribution')
def _get_genre_distribution():
    return model.get_unique_distribution('listed_in')


@app.get('/get_bill_burr')
def _get_items_by_actor():
    return model.get_items_by_actor('Bill Burr')


@app.post('/get_data_by_year')
def _get_items_by_year(payload: YearFilter):
    return model.get_items_by_year(payload.model_dump())
