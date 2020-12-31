# framework-flask-vue
A framework using flask as backend and vue.js as frontend, powered by vue-cli. 
The framework comes with demos to show typical frontend-backend communication, as well as vue components interaction.
It also comes with two examples featuring the configuration of D3 and Echarts.

![image](https://github.com/gzwongkk/framework-flask-vue/blob/master/README.png)


## Server
The server employs Flask to provide web services. 
All codes below should be run under the "server" folder.

### Server Setup
This project is created using Python 3.8.5. It is recommended to use virtualenv to build the project. 
For example, 
``` 
# Create a new virtualenv named "framework"
$ python -m venv framework

# Activate the virtualenv (OS X & Linux)
$ source framework/bin/activate

# Activate the virtualenv (Windows)
$ framework\Scripts\activate

# Deactivate the virtualenv
$ deactivate
```
For this project, we will be installing flask and jupyter lab to facilitate development. Install the dependencies using:
```
# Install the specified dependencies
$ pip install -r requirements.txt

# Export your own dependencies
$ pip freeze > requirements.txt
```

### Server activation
The default address for the server is http://127.0.0.1:5000/
```
$ python run.py
```


## Client
The client services are provided by Vue 3. 
All codes below should be run under the "client" folder.

### Client Setup
The packages are handled by npm, and specified in the package.json.
```
$ npm install
```

### Client activation
The client is served at http://localhost:8080/.
Notice that the framework supports hot-reloads, so that the changes on DOM are applied automatically and do not require reloads.
```
# Compiles and hot-reloads for development
$ npm run serve

# Compiles and minifies for production
$ npm run build
```
