import { createApp } from "vue";
import App from "./App.vue";
// import Antd from 'ant-design-vue';
import { Row, Col, Button } from "ant-design-vue";
import "ant-design-vue/dist/antd.css";
import { pinia } from "./store/index";

const app = createApp(App);
app.config.productionTip = false;

app
  // .use(Antd)
  .use(Row)
  .use(Col)
  .use(Button)
  .use(pinia)
  .mount("#app");
