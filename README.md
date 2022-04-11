# framework-flask-vue

> This project is migrating towards Vue3 and Pinia.
>
> More examples and reusable components are on the TODO list.

A framework using flask as backend and vue.js as frontend, powered by vite.
The framework comes with demos to show typical frontend-backend communication, as well as vue components interaction.

<!-- ![image](https://github.com/gzwongkk/framework-flask-vue/blob/master/README.png) -->

## Server

The server employs Flask to provide web services.
All codes below should be run under the "server" folder.

### Server Setup

This project is created using Python 3.8.5.
The default address for the server is <http://127.0.0.1:5000/>

```
python run.py
```

## Client

The client services are provided by Vue 3.
All codes below should be run under the "client" folder.

### Client Setup

The packages are handled by npm, and specified in the package.json.

```
npm install
```

### Client activation

The client is served at <http://localhost:3000/>.
Notice that the framework supports hot-reloads, so that the changes on DOM are applied automatically and do not require reloads.

```
# Compiles and hot-reloads for development
$ npm run dev

# Compiles and minifies for production
$ npm run build
```
