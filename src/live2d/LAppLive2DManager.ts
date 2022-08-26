import { CubismMatrix44 } from '../framework/math/cubismmatrix44'
import { CubismViewMatrix } from '../framework/math/cubismviewmatrix'
import { LAppModel } from './LAppModel'
import { LAppTextureManager } from './LAppTextureManager'
import { TextureInfo } from './LAppTextureManager'
import { LAppSprite } from './LAppSprite'

/**
 * 管理模型、对应webgl的类
 */
export class LAppLive2DManager {
  static s_instance: LAppLive2DManager
  _canvas: HTMLCanvasElement
  _gl: WebGLRenderingContext
  // 着色器标识
  _programId: WebGLProgram
  // 纹理管理器
  _textureManager: LAppTextureManager
  _frameBuffer: WebGLFramebuffer

  _deviceToScreen: CubismMatrix44 // 从设备到屏幕的矩阵
  _viewMatrix: CubismViewMatrix // viewMatrix
  _model: LAppModel // 模型
  _back: LAppSprite // 背景图像
  s_currentFrame: number
  s_lastFrame: number
  s_deltaTime: number

  constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
    LAppLive2DManager.s_instance = this
    this._canvas = canvas
    this._gl = gl
    this._textureManager = new LAppTextureManager(this._gl)
    this._frameBuffer = this._gl.getParameter(WebGLRenderingContext.FRAMEBUFFER_BINDING)
    this._deviceToScreen = new CubismMatrix44()
    this._viewMatrix = new CubismViewMatrix()
    this._model = new LAppModel(this._gl, this._textureManager)
    this._back = null
    this.s_currentFrame = 0.0
    this.s_lastFrame = 0.0
    this.s_deltaTime = 0.0
  }

  /**
   * 初始化manager
   */
  public initialize(): void {
    const { width, height } = this._canvas
    // 设置屏幕范围和缩放比例
    this._viewMatrix.setScreenRect(-1.0, 1.0, -1.0, 1.0)
    this._viewMatrix.scale(1.0, 1.0)
    this._deviceToScreen.scale(1.0, 1.0)
    this._deviceToScreen.scaleRelative(2.0 / width, -2.0 / height)
    // 坐标移动
    this._deviceToScreen.translateRelative(-width * 0.5, -height * 0.5)
    // 图像初始化
    this.initializeSprite()
  }

  /**
   * 进行图像的初始化
   */
  public initializeSprite(): void {
    // 背景画像初期化
    let imageName = 'back_class_normal.png'

    const initBackGroundTexture = (textureInfo: TextureInfo): void => {
      const x: number = this._canvas.width * 0.5;
      const y: number = this._canvas.height * 0.5;

      const fwidth = this._canvas.width;
      const fheight = this._canvas.height;
      this._back = new LAppSprite(x, y, fwidth, fheight, textureInfo.id)
    };

    this._textureManager.createTextureFromPngFile(
      './' + imageName,
      false,
      initBackGroundTexture
    );

    this.updateTime()

    if (this._programId == null) {
      this._programId = this.createShader()
    }
  }

  /**
   * 注册着色器。
   */
  public createShader(): WebGLProgram {
    const vertexShaderId = this._gl.createShader(WebGLRenderingContext.VERTEX_SHADER)

    if (vertexShaderId == null) {
      console.error('failed to create vertexShader')
      return null
    }

    const vertexShader: string =
      'precision mediump float;' +
      'attribute vec3 position;' +
      'attribute vec2 uv;' +
      'varying vec2 vuv;' +
      'void main(void)' +
      '{' +
      '   gl_Position = vec4(position, 1.0);' +
      '   vuv = uv;' +
      '}'

    this._gl.shaderSource(vertexShaderId, vertexShader)
    this._gl.compileShader(vertexShaderId)

    const fragmentShaderId = this._gl.createShader(WebGLRenderingContext.FRAGMENT_SHADER)

    if (fragmentShaderId == null) {
      console.error('failed to create fragmentShader')
      return null
    }

    const fragmentShader: string =
      'precision mediump float;' +
      'varying vec2 vuv;' +
      'uniform sampler2D texture;' +
      'void main(void)' +
      '{' +
      '   gl_FragColor = texture2D(texture, vuv);' +
      '}'

    this._gl.shaderSource(fragmentShaderId, fragmentShader)
    this._gl.compileShader(fragmentShaderId)

    const programId = this._gl.createProgram()
    this._gl.attachShader(programId, vertexShaderId)
    this._gl.attachShader(programId, fragmentShaderId)

    this._gl.deleteShader(vertexShaderId)
    this._gl.deleteShader(fragmentShaderId)

    this._gl.linkProgram(programId)

    this._gl.useProgram(programId)

    return programId
  }

  /**
   * 执行处理
   */
  public run(): void {
    // 主循环
    const loop = (): void => {
      if (!this._gl) {
        return
      }
      // 时间更新
      this.updateTime()
      // 画面初始化
      this._gl.clearColor(0.0, 0.0, 0.0, 1.0);
      // 启用深度测试
      this._gl.enable(WebGLRenderingContext.DEPTH_TEST);
      // 附近的物体会掩盖远处的物体
      this._gl.depthFunc(WebGLRenderingContext.LEQUAL);
      // 清除颜色缓冲区和深度缓冲区
      this._gl.clear(WebGLRenderingContext.COLOR_BUFFER_BIT | WebGLRenderingContext.DEPTH_BUFFER_BIT);
      this._gl.clearDepth(1.0);
      // 透明设置
      this._gl.enable(WebGLRenderingContext.BLEND);
      this._gl.blendFunc(WebGLRenderingContext.SRC_ALPHA, WebGLRenderingContext.ONE_MINUS_SRC_ALPHA);
      // 绘图更新
      this._gl.useProgram(this._programId)

      if (this._back) {
        this._back.render(this._programId, this._canvas, this._gl)
      }
      this._gl.flush()

      this.onUpdate()

      // 循环的递归调用
      requestAnimationFrame(loop);
    };
    loop();
  }

  /**
   * 拖动屏幕时的操作
   *
   * @param x 画面のX座標
   * @param y 画面のY座標
   */
  public onDrag(x: number, y: number): void {
    const model: LAppModel = this._model
    if (model) {
      model.setDragging(x, y);
    }
  }

  /**
   * 更新屏幕时的处理
   * 进行模型的更新处理及描绘处理
   */
  public onUpdate(): void {
    const { width, height } = this._canvas

    const projection: CubismMatrix44 = new CubismMatrix44();
    const model: LAppModel = this._model

    if (model.getModel()) {
      if (model.getModel().getCanvasWidth() > 1.0 && width < height) {
        // 在纵向窗口中显示横向较长的模型时，根据模型的横向尺寸计算scale
        model.getModelMatrix().setWidth(2.0);
        projection.scale(1.0, width / height);
      } else {
        projection.scale(height / width, 1.0);
      }

      // 必要があればここで乗算
      if (this._viewMatrix != null) {
        projection.multiplyByMatrix(this._viewMatrix);
      }
    }

    model.update(this.s_deltaTime);
    model.draw(this._canvas, projection, this._frameBuffer);
  }

  public getDeltaTime(): number {
    return this.s_deltaTime;
  }

  public updateTime(): void {
    this.s_currentFrame = Date.now();
    this.s_deltaTime = (this.s_currentFrame - this.s_lastFrame) / 1000;
    this.s_lastFrame = this.s_currentFrame;
  }

  public release(): void {
    this._viewMatrix = null;
    this._deviceToScreen = null;

    this._gl.deleteProgram(this._programId);
    this._gl = null
    this._programId = null
  }

  public transformViewX(deviceX: number): number {
    const screenX: number = this._deviceToScreen.transformX(deviceX);
    return this._viewMatrix.invertTransformX(screenX);
  }

  public transformViewY(deviceY: number): number {
    const screenY: number = this._deviceToScreen.transformY(deviceY);
    return this._viewMatrix.invertTransformY(screenY);
  }
}