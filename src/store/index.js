import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
  },
  getters: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    live2d: {
      namespaced: true,
      state: {
        // 运动列表
        motions: [],
        // 是否鼠标跟随
        mouseState: true,
        // 录制状态
        canvasMedia: false
      },
      getters: {
        motions: function (state) {
          return state.motions
        },
        mouseState: function (state) {
          return state.mouseState
        },
        canvasMedia: function (state) {
          return state.canvasMedia
        }
      },
      mutations: {
        setMotions: function (state, payload) {
          state.motions = payload
        },
        changeMouseState: function (state, payload) {
          state.mouseState = payload
        },
        setCanvasMedia: function (state, payload) {
          state.canvasMedia = payload
        }
      },
      actions: {

      }
    }
  }
})
