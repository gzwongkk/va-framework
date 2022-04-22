import os
import json
from syslog import syslog
import pandas as pd

PATH_DATA_FOLDER = '../data/'
PATH_DATA_FILE_DATASAURUS = 'DatasaurusDozen.csv'
PATH_DATA_FILE_NETFLIX = 'netflix_titles.csv'


class Model:
    def __init__(self):
        self.DATA_FOLDER = os.path.join(os.path.dirname(
            os.path.abspath(__file__)), PATH_DATA_FOLDER)

        # load the netflix dataset
        try:
            self.data = pd.read_csv(os.path.join(
                self.DATA_FOLDER, PATH_DATA_FILE_NETFLIX))
        except:
            print(f'could not open: {PATH_DATA_FILE_NETFLIX}')

        # load the datasaurus dataset
        try:
            with open(os.path.join(self.DATA_FOLDER, PATH_DATA_FILE_DATASAURUS), 'r') as file:
                self.datasaurus = json.load(file)
        except:
            print(f'could not open: {PATH_DATA_FILE_DATASAURUS}')

    # The following methods all target netflix dataset
    def get_data(self):
        return self.data.to_json(orient='records', force_ascii=False)

    def get_data_by_type(self, dtype):
        return self.data.query('type == @dtype').to_json(orient='records', force_ascii=False)

    def get_distribution(self, dtype, outName):
        if dtype not in self.data:
            return ''
        _dist = self.data[[dtype, 'show_id']].groupby(
            dtype).count().reset_index()
        _dist.columns = [outName, 'count']
        return _dist.to_json(orient='records', force_ascii=False)

    def get_unique_distribution(self, dtype, outName):
        if dtype not in self.data:
            return ''
        _dist = self.data[[dtype, 'show_id']].copy()
        _dist[dtype] = _dist[dtype].str.split(', ')
        _dist = _dist.explode(dtype).reset_index(drop=True)
        _dist = _dist.groupby(dtype).count().reset_index()
        _dist.columns = [outName, 'count']
        return _dist.to_json(orient='records', force_ascii=False)

    def get_items_by_actor(self, actor):
        return self.data[self.data.cast.str.contains(actor, na=False)].to_json(orient='records', force_ascii=False)

    def save_data(self, post_data):
        self.data = post_data
        return 'Success'
