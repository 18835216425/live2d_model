<template>
  <el-collapse accordion v-model="activeName">
    <el-collapse-item name="1">
      <template slot="title">
        <span class="options-title">模型参数</span>
      </template>
      <div class="options">
        <span>X坐标</span>
        <el-slider v-model="modelX" @input="translateX" :show-tooltip="false"></el-slider>
      </div>
      <div class="options">
        <span>Y坐标</span>
        <el-slider v-model="modelY" @input="translateY" :show-tooltip="false"></el-slider>
      </div>
      <div class="options">
        <span>缩放比例</span>
        <el-slider v-model="scale" @input="translateScale" :show-tooltip="false"></el-slider>
      </div>
    </el-collapse-item>
    <el-collapse-item name="2">
      <template slot="title">
        <span class="options-title">表情与动作</span>
      </template>
      <span v-for="(item, i) in motions" :key="i">
        <el-button class="btn-moutions" :disabled="motionState" type="primary" plain @click="startMotion(item)">{{ item }}</el-button>
      </span>
    </el-collapse-item>
    <el-collapse-item name="3">
      <template slot="title">
        <span class="options-title">其他选项</span>
      </template>
      <div class="options">
        <el-switch v-model="mouseState" inactive-text="视角跟随鼠标" @change="changeMouseState"> </el-switch>
      </div>
      <div class="options">
        <el-switch v-model="voiceState" inactive-text="唇形匹配" @change="voiceStateChange"> </el-switch>
      </div>
      <div class="options">
        <el-button :disabled="canvasMedia" type="primary" plain @click="onStrat">开始录像</el-button>
        <el-button :disabled="!canvasMedia" type="primary" plain @click="onSave">结束录像</el-button>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script>
import * as live2d from '@/live2d/Live2d.ts'
import { createNamespacedHelpers } from 'vuex'
const { mapGetters, mapMutations } = createNamespacedHelpers('live2d')
export default {
  data: function () {
    return {
      activeName: '1',
      modelX: 50,
      modelY: 50,
      scale: 0,
      // 动作加载状态
      motionState: false,
      // 鼠标跟随
      mouseState: true,
      // 唇形匹配
      voiceState: false,
      audioContext: null,
      voiceStream: null,
      // 音频处理对象
      scriptProcessor: null,
      // 麦克风对象
      mediaStreamSource: null
    }
  },
  computed: {
    ...mapGetters(['motions', 'canvasMedia'])
  },
  methods: {
    translateX: function (x) {
      live2d.modelTranslateX(x * 0.04 - 2.0)
    },
    translateY: function (y) {
      live2d.modelTranslateY(y * 0.04 - 2.0)
    },
    translateScale: function (scale) {
      live2d.modelScale(scale * 0.05 + 1)
    },
    startMotion: function (motion) {
      this.motionState = true
      live2d.modelMotions(motion, () => {
        this.motionState = false
      })
    },
    ...mapMutations(['changeMouseState', 'setCanvasMedia']),
    // 开始录制
    onStrat: function () {
      this.$message({
        message: '开始录制'
      })
      this.setCanvasMedia(true)
    },
    // 结束录制
    onSave: function () {
      this.$message({
        message: '录制结束，请等待文件下载',
        type: 'success'
      })
      this.setCanvasMedia(false)
    },
    voiceStateChange: function () {
      if (this.voiceState) {
        this.setModelVoice()
      } else {
        this.stopVoiceStream()
      }
    },
    // 唇形匹配
    setModelVoice: function () {
      this.audioContext = new AudioContext()
      // 音频解析
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          this.voiceStream = stream
          // 将麦克风的声音输入这个对象
          this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream)
          // 创建一个音频分析对象，采样的缓冲区大小为4096，输入和输出都是单声道
          this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1)
          // 将该分析对象与麦克风音频进行连接
          this.mediaStreamSource.connect(this.scriptProcessor)
          // 此举无甚效果，仅仅是因为解决 Chrome 自身的 bug
          this.scriptProcessor.connect(this.audioContext.destination)
          // 开始处理音频
          this.scriptProcessor.addEventListener('audioprocess', this.audioProcess)
        })
        .catch((err) => {
          console.log(err.name + ': ' + err.message)
        })
    },
    stopVoiceStream: function () {
      this.voiceStream.getAudioTracks().forEach((track) => {
        track.stop()
      })
      this.voiceStream = null
      this.scriptProcessor.removeEventListener('audioprocess', this.audioProcess)
      this.scriptProcessor = null
      this.mediaStreamSource = null
      this.audioContext = null
      live2d.setVoice(0)
    },
    audioProcess: function (e) {
      // 获得缓冲区的输入音频，转换为包含了PCM通道数据的32位浮点数组
      let buffer = e.inputBuffer.getChannelData(0)
      // 获取缓冲区中最大的音量值
      let maxVal = Math.max.apply(Math, buffer)
      // 设置音量值
      // console.log(maxVal)
      live2d.setVoice(maxVal)
    }
  }
}
</script>

<style scoped>
.el-collapse {
  width: 300px;
  height: 100%;
  /* overflow: auto; */
  padding: 10px;
  border: 0;
}
.el-slider {
  margin: 0 15px;
}
.btn-moutions {
  margin: 5px;
}
.options {
  margin-top: 10px;
  padding-left: 10px;
}
.options-title {
  font-size: 16px;
}
</style>