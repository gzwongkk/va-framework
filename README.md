# va-framework

This framework is designed for jump-starting a single-page Visual Analytics(VA) system.
While many VA systems are designed for specific applications, their workflow often share similar data processing methods.
Several demos show typical frontend-backend communication, view components' interaction, and visualization rendering.
VA-framework employs Python's _Flask_ server as the backend and Javascript's _Vue_ as the frontend.
It facilitates fast development with hot-reloads (_Vite_), UI components (_Ant design_), state management (_Pinia_), and type inference (_TypeScript_).

<!-- ![image](https://github.com/gzwongkk/framework-flask-vue/blob/master/README.png) -->

## Featured demo list
### Beginner/Migration guide
- [x] A side-by-side comparison of the [Composition API demo](./client/src/components/D3BarComposition.vue) and the [Options API demo](./client/src/components/D3BarOptions.vue) with *D3.js*.
- [x] A simple comprehensive [MVVM demo](./client/src/components/Datasaurus.vue) of *Composition API*, *TypeScript*, *Pinia*, and *v-for SVG rendering*.
- [x] A quick [legend component demo](./client/src/components/DatasaurusLegend.vue) with simple props and emits in *Composition API*, *TypeScript*, and *v-for SVG rendering*.
### MVC demo
- [ ] A basic ad-hoc data processing pipeline [demo](./server/src/models.py) (Model in MVC) with *Pandas*.
- [x] An API deisgn [demo](./client/src/stores/netflix.ts) for data transmission (Controller in MVC) with *Pinia*, *Axios*, and *Flask*.
- [x] A simple demo of bundling the UI components into separate components, such as [buttons](./client/src/components/D3BarButton.vue) and [tooltip](./client/src/components/NetflixDistBarTooltip.vue), with *Ant Design Vue* and *Composition API* for higher reusability and readability.
- [x] A table with tags and tooltips [demo](./client/src/components/NetflixTable.vue) to provide detailed data.
- [x] A basic layout for visual analytics system

### Planned implementation list
- [ ] Graph data
- [ ] Spatio-temporal data
- [ ] [Composition and Configuration Patterns in Multiple-View Visualizations](https://ieeexplore.ieee.org/abstract/document/9222323)
- [ ] [The periphery plots](https://gotz.web.unc.edu/research-project/periphery-plots/)

## Run the framework

### Server

The server employs Flask to provide web services.
All codes below should be run under the "server" folder.
For the first time user, please install the requirements in the _requirements.txt_.
This project is built using Python 3.8.5.
Using a version below 3.7 might encounter errors regarding the use of f-string.
The default address for the server is <http://127.0.0.1:5000/>.

```
python run.py
```

### Client

The client services are provided by Vue 3 and many other packages.
All codes below should be run under the "client" folder.
The packages are handled by npm, and specified in the package.json.
For the first time user, please install the dependencies in the _package.json_ with `npm install`.
The client is served at <http://localhost:3000/>.

```
# Compiles for development
$ npm run dev

# Compiles for production
$ npm run build
```
