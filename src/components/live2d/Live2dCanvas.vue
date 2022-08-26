<template>
  <div class="canvas-mask">
    <canvas ref="live2d"></canvas>
    <div ref="mask" class="mask"></div>
  </div>
</template>

<script>
import * as live2d from '@/live2d/Live2d.ts'
import { createNamespacedHelpers } from 'vuex'
const { mapGetters, mapMutations } = createNamespacedHelpers('live2d')
export default {
  data: function () {
    return {
      // 每帧数据流
      allChunks: [],
      // 媒体对象
      recorder: null
    }
  },
  watch: {
    mouseState: function () {
      this.mouseStateChange()
    },
    canvasMedia: function (newValue) {
      // 开始录制
      if (newValue) {
        this.live2dMediaStream()
      } else {
        // 生成视频
        this.live2dDowload()
      }
    }
  },
  computed: {
    ...mapGetters(['mouseState', 'canvasMedia'])
  },
  methods: {
    ...mapMutations(['setMotions']),
    mouseStateChange: function () {
      if (this.mouseState) {
        this.$refs.mask.addEventListener('mousemove', this.live2dMouseMove)
      } else {
        this.$refs.mask.removeEventListener('mousemove', this.live2dMouseMove)
      }
    },
    live2dMouseMove: function (e) {
      let x = this.$refs.mask.clientWidth / 2
      let y = this.$refs.mask.clientHeight / 2
      live2d.mouseMove((e.pageX - x) / x, (y - e.pageY) / y)
    },
    live2dDowload: function () {
      console.log('xiazai')
      this.recorder.removeEventListener('dataavailable', this.addStream)
      this.recorder.stop()
      this.recorder = null
      this.allChunks = new Blob(this.allChunks)
      let link = document.createElement('a')
      link.style.display = 'none'
      //  const downloadUrl = window.URL.createObjectURL(blobObj)
      let downloadUrl = window.URL.createObjectURL(this.allChunks)
      link.href = downloadUrl
      link.download = 'live2d.webm'
      document.body.appendChild(link)
      link.click()
      link.remove()
      this.allChunks = []
    },
    live2dMediaStream: function () {
      console.log('luzhi')
      let canvas = this.$refs.live2d
      let stream = canvas.captureStream(60)
      this.recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })
      this.recorder.addEventListener('dataavailable', this.addStream)
      this.recorder.start(10)
    },
    // 保存流
    addStream: function (e) {
      this.allChunks.push(e.data)
    }
  },
  created: function () {
    live2d.appInit()
  },
  mounted: function () {
    live2d.mangerInit(this.$refs.live2d, window.innerWidth - 300, window.innerHeight)
    // this.motions = live2d.loadModel('./Hiyori/', 'Hiyori.model3.json')
    let motions = live2d.loadModel('./Hiyori/', 'Hiyori.model3.json')
    // this.$store.commit('live2d/setMotions', motions)
    this.setMotions(motions)
    this.mouseStateChange()
  },
  beforeDestroy: function () {
    live2d.appDestory()
    live2d.mangerDestory()
  }
}
</script>

<style scoped>
.canvas-mask {
  position: relative;
}
.mask {
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* background-color: antiquewhite; */
  border: 10px solid #409eff;
}
</style>