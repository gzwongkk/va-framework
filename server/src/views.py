from src import app
from flask import request
import simplejson


def json_dumps(data):
    return simplejson.dumps(data, ensure_ascii=False, ignore_nan=True)


@app.route('/get')
def get():
    return json_dumps("Get")


@app.route('/post', methods=['POST'])
def post():
    post_data = request.data.decode()
    if post_data != "":
        post_data = simplejson.loads(post_data)
    return json_dumps(post_data)