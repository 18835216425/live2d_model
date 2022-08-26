import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { Collapse, CollapseItem, Slider, Button, Switch } from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import './css/common.css'
import { Message } from 'element-ui'
Vue.prototype.$message = Message

Vue.config.productionTip = false

Vue.use(Collapse)
Vue.use(CollapseItem)
Vue.use(Slider)
Vue.use(Button)
Vue.use(Switch)
// Vue.use(Link)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app') 
