<template>
  <div class="index-back">
    <live2d-home></live2d-home>
  </div>
</template>

<script>
import Live2dHome from '@/components/home/Live2dHome.vue'
export default {
  components: {
    'live2d-home': Live2dHome
  }
}
</script>

<style scoped>
.index-back {
  display: flex;
  width: 100%;
  height: 100%;
  background-image: url('@/assets/back_class_normal.png');
  background-size: 100%;
}
</style>