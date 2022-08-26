<template>
  <div class="model-back">
    <live2d-canvas></live2d-canvas>
    <live2d-tool></live2d-tool>
  </div>
</template>

<script>
import Live2dCanvas from '@/components/live2d/Live2dCanvas.vue'
import Live2dTool from '@/components/live2d/Live2dTool.vue'
export default {
  components: {
    'live2d-canvas': Live2dCanvas,
    'live2d-tool': Live2dTool
  }
}
</script>

<style scoped>
.model-back {
  display: flex;
}
</style>