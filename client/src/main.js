import { createApp } from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
// import { Button, Row, Col } from 'ant-design-vue';

const app = createApp(App);
app.config.productionTip = false;

app.use(Antd);
// app.use(Button).use(Row).use(Col);

app.mount('#app')
