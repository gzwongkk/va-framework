from src import app
from src.models import Model
from flask import request
import json

# initialize the model
model = Model()
print("================================================================")


@app.route('/get')
def _get():
    return json.dumps("Get", ensure_ascii=False)


@app.route('/get_data')
def _get_data():
    return json.dumps(model.get_data(), ensure_ascii=False)


@app.route('/post', methods=['POST'])
def _post():
    post_data = request.data.decode()
    if post_data == "":
        return
    post_data = json.loads(post_data)
    return model.set_data(post_data)
