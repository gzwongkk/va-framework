# framework-flask-vue
A framework using flask as backend and vue.js as frontend, powered by vue-cli

## Server setup
The server employs Flask to provide web services. 
All codes below should be run under the "server" folder.

This project is created using Python 3.8.2. It is recommended to use virtualenv to build the project. 
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
$ pip freeze > requirement.txt
```

## Client setup
The client services are provided by Vue-cli. 
All codes below should be run under the "client" folder.
```
$ npm install
```


```
# Compiles and hot-reloads for development
$ npm run serve

# Compiles and minifies for production
$ npm run build
```
