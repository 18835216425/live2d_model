import { LAppDelegate } from './LAppDelegate'
import { LAppLive2DManager } from './LAppLive2DManager'

// app初始化
export function appInit(): void {
  LAppDelegate.getInstance().initialize()
}
// app销毁
export function appDestory(): void {
  LAppDelegate.releaseInstance()
}
// manger初始化
export function mangerInit(canvas: HTMLCanvasElement, width, height): void {
  canvas.width = width
  canvas.height = height
  let gl: WebGLRenderingContext = webglInit(canvas)
  if (!gl) return
  let manger = new LAppLive2DManager(canvas, gl)
  manger.initialize()
}
// manger销毁
export function mangerDestory(): void {
  LAppLive2DManager.s_instance.release()
}
// manger鼠标事件
// this._canvas.onmousedown = (e: MouseEvent) => {
//   const viewX: number = this.transformViewX(e.pageX);
//   const viewY: number = this.transformViewY(e.pageY);
//   console.log(viewX.toFixed(2), viewY.toFixed(2))
// }
export function mouseMove(pageX: number, pageY: number): void {
  // const viewX: number = LAppLive2DManager.s_instance.transformViewX(pageX)
  // const viewY: number = LAppLive2DManager.s_instance.transformViewY(pageY)
  // LAppLive2DManager.s_instance.onDrag(viewX, viewY)
  LAppLive2DManager.s_instance.onDrag(pageX, pageY)
}
// this._canvas.onmousemove = (e: MouseEvent) => {
//   const viewX: number = this.transformViewX(e.pageX);
//   const viewY: number = this.transformViewY(e.pageY);
//   this.onDrag(viewX, viewY)
// }

// 加载模型
export function loadModel(modelPath: string, modelName: string): Array<string> {
  let motions: Array<string> = []
  LAppLive2DManager.s_instance._model.loadAssets(modelPath, modelName, (name: string) => {
    motions.push(name)
  })
  LAppLive2DManager.s_instance.run()
  return motions
}
// webgl初始化
function webglInit(canvas: HTMLCanvasElement): WebGLRenderingContext {
  // @ts-ignore
  let gl: WebGLRenderingContext = canvas.getContext('webgl') || canvas.getContext
  if (!gl) {
    console.error('Cannot initialize WebGL. This browser does not support.')
    return null
  }
  // 透明设置
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  return gl
}
// 模型X轴移动
export function modelTranslateX(x: number): void {
  LAppLive2DManager.s_instance._viewMatrix.translateX(x)
}
// 模型Y轴移动
export function modelTranslateY(y: number): void {
  LAppLive2DManager.s_instance._viewMatrix.translateY(y)
}
// 模型缩放
export function modelScale(scale: number): void {
  LAppLive2DManager.s_instance._viewMatrix.scale(scale, scale)
}
// 播放动画
export function modelMotions(motionStr: string, callback: Function): void {
  let info: Array<string> = motionStr.split('_')
  LAppLive2DManager.s_instance._model.startMotion(info[0], parseInt(info[1]), 1, () => {
    console.log('Motion Finished')
    callback()
  })
}
// 设置音量值
export function setVoice(maxVoice: number): void {
  LAppLive2DManager.s_instance._model._maxVoice = maxVoice
}