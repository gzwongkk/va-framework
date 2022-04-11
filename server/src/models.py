import os
import json
import pandas as pd

PATH_DATA_FOLDER = '../data/'
PATH_DATA_FILE = 'DatasaurusDozen.csv'


class Model:
    def __init__(self):
        self.DATA_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), PATH_DATA_FOLDER)

        self.data = pd.read_csv(os.path.join(self.DATA_FOLDER, PATH_DATA_FILE), index_col=False)
        self.data.to_json('DatasaurusDozen.json', orient="records", force_ascii=False)
        self.data = self.data.to_json(orient="records", force_ascii=False)

        # try:
        #     with open(os.path.join(self.DATA_FOLDER, PATH_DATA_FILE), 'r') as file:
        #         self.data = json.load(file)
        # except:
        #     print(f'could not open: {PATH_DATA_FILE}')

    def get_data(self):
        return self.data

    def save_data(self, post_data):
        self.data = post_data
        return "Success"
