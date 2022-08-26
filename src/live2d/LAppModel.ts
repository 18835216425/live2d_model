import { CubismUserModel } from "../framework/model/cubismusermodel"
import { CubismMatrix44 } from "../framework/math/cubismmatrix44"
import { CubismFramework } from '../framework/live2dcubismframework'
import { ICubismModelSetting } from '../framework/icubismmodelsetting'
import { CubismIdHandle } from '../framework/id/cubismid'
import { CubismDefaultParameterId } from '../framework/cubismdefaultparameterid'
import { CubismModelSettingJson } from '../framework/cubismmodelsettingjson'
import { csmVector } from '../framework/type/csmvector'
import { csmMap } from '../framework/type/csmmap'
import { CubismEyeBlink } from '../framework/effect/cubismeyeblink'
import { BreathParameterData, CubismBreath } from '../framework/effect/cubismbreath'
import { CubismMotion } from '../framework/motion/cubismmotion'
import { ACubismMotion, FinishedMotionCallback } from '../framework/motion/acubismmotion'
import {
  CubismMotionQueueEntryHandle,
  InvalidMotionQueueEntryHandleValue
} from '../framework/motion/cubismmotionqueuemanager'
import { TextureInfo } from "./LAppTextureManager"
import { LAppTextureManager } from "./LAppTextureManager"


export class LAppModel extends CubismUserModel {
  // _canvas: HTMLCanvasElement
  _gl: WebGLRenderingContext

  // _programId: WebGLProgram // 着色器标识

  _textureManager: LAppTextureManager // 纹理管理器

  _modelPath: string

  _modelSetting: ICubismModelSetting // 模型设置信息
  _userTimeSeconds: number // 增量时间累计值[秒]

  _eyeBlinkIds: csmVector<CubismIdHandle> // 为模型设置的瞬时功能参数ID
  _lipSyncIds: csmVector<CubismIdHandle> // 为模型设置的唇同步功能参数标识

  _motions: csmMap<string, ACubismMotion> // 导入的运动列表
  _expressions: csmMap<string, ACubismMotion> // 导入的表情列表

  _idParamAngleX: CubismIdHandle // 参数标识：参数角度X
  _idParamAngleY: CubismIdHandle // 参数标识：参数角度Y
  _idParamAngleZ: CubismIdHandle // 参数标识：参数角度Z
  _idParamEyeBallX: CubismIdHandle // パラメータID: ParamEyeBallX
  _idParamEyeBallY: CubismIdHandle // パラメータID: ParamEyeBAllY
  _idParamBodyAngleX: CubismIdHandle // パラメータID: ParamBodyAngleX

  _state: boolean = false

  _expressionCount: number // 表情数据计数
  _textureCount: number // 纹理计数
  _motionCount: number // 运动数据计数
  _allMotionCount: number // 运动总数

  _maxVoice: number

  constructor(gl: WebGLRenderingContext, textureManager: LAppTextureManager) {
    super()

    this._gl = gl
    this._textureManager = textureManager

    this._debugMode = true
    this._modelSetting = null
    this._userTimeSeconds = 0.0

    this._eyeBlinkIds = new csmVector<CubismIdHandle>()
    this._lipSyncIds = new csmVector<CubismIdHandle>()

    this._motions = new csmMap<string, ACubismMotion>()
    this._expressions = new csmMap<string, ACubismMotion>()

    this._idParamAngleX = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamAngleX
    )
    this._idParamAngleY = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamAngleY
    )
    this._idParamAngleZ = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamAngleZ
    )
    this._idParamEyeBallX = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamEyeBallX
    )
    this._idParamEyeBallY = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamEyeBallY
    )
    this._idParamBodyAngleX = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamBodyAngleX
    )

    this._expressionCount = 0
    this._textureCount = 0
    this._motionCount = 0
    this._allMotionCount = 0

    this._maxVoice = 0
  }

  // 根据model3.json所在的目录和文件路径生成模型
  public loadAssets(dir: string, fileName: string, callback: Function): void {
    this._modelPath = dir
    fetch(`${this._modelPath}${fileName}`)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        const setting: ICubismModelSetting = new CubismModelSettingJson(arrayBuffer, arrayBuffer.byteLength)
        // 保存结果
        this.setupModel(setting, callback)
      })
  }


  // 根据model3.json的描述，进行模型生成、运动、物理运算等组件生成。
  private setupModel(setting: ICubismModelSetting, callback: Function): void {
    this._updating = true
    this._initialized = false
    this._modelSetting = setting
    // CubismModel
    if (this._modelSetting.getModelFileName() != '') {
      console.log('[MODEL]CubismModel is complete.')
      const modelFileName = this._modelSetting.getModelFileName()
      fetch(`${this._modelPath}${modelFileName}`)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          this.loadModel(arrayBuffer)
          // callback
          loadCubismExpression()
        })
    } else {
      console.log('[MODEL]Model data does not exist.')
    }

    // Expression
    const loadCubismExpression = (): void => {
      if (this._modelSetting.getExpressionCount() > 0) {
        console.log('[MODEL]Expression is complete.')
        const count: number = this._modelSetting.getExpressionCount()
        for (let i = 0; i < count; i++) {
          const expressionName = this._modelSetting.getExpressionName(i)
          const expressionFileName = this._modelSetting.getExpressionFileName(i)
          fetch(`${this._modelPath}${expressionFileName}`)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
              const motion: ACubismMotion = this.loadExpression(arrayBuffer, arrayBuffer.byteLength, expressionName)
              if (this._expressions.getValue(expressionName) != null) {
                ACubismMotion.delete(this._expressions.getValue(expressionName))
                this._expressions.setValue(expressionName, null)
              }
              this._expressions.setValue(expressionName, motion)
              this._expressionCount++
              if (this._expressionCount >= count) {
                // callback
                loadCubismPhysics()
              }
            })
        }
      } else {
        console.log('[MODEL]Model has no expression.')
        // callback
        loadCubismPhysics()
      }
    }

    // Physics
    const loadCubismPhysics = (): void => {
      if (this._modelSetting.getPhysicsFileName() != '') {
        console.log('[MODEL]Physics is complete.')
        const physicsFileName = this._modelSetting.getPhysicsFileName()
        fetch(`${this._modelPath}${physicsFileName}`)
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => {
            this.loadPhysics(arrayBuffer, arrayBuffer.byteLength)
            // callback
            loadCubismPose()
          })
      } else {
        console.log('[MODEL]Model has no physics.')
        // callback
        loadCubismPose()
      }
    }

    // Pose
    const loadCubismPose = (): void => {
      if (this._modelSetting.getPoseFileName() != '') {
        console.log('[MODEL]Pose is complete.')
        const poseFileName = this._modelSetting.getPoseFileName()
        fetch(`${this._modelPath}${poseFileName}`)
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => {
            this.loadPose(arrayBuffer, arrayBuffer.byteLength)
            // callback
            setupEyeBlink()
          })
      } else {
        console.log('[MODEL]Model has no pose.')
        // callback
        setupEyeBlink()
      }
    }

    // EyeBlink
    const setupEyeBlink = (): void => {
      if (this._modelSetting.getEyeBlinkParameterCount() > 0) {
        console.log('[MODEL]EyeBlink is complete.')
        this._eyeBlink = CubismEyeBlink.create(this._modelSetting)
      }
      // callback
      setupBreath()
    }

    // Breath
    const setupBreath = (): void => {
      console.log('[MODEL]Breath is complete.')
      this._breath = CubismBreath.create()

      const breathParameters: csmVector<BreathParameterData> = new csmVector()
      breathParameters.pushBack(
        new BreathParameterData(this._idParamAngleX, 0.0, 15.0, 6.5345, 0.5)
      )
      breathParameters.pushBack(
        new BreathParameterData(this._idParamAngleY, 0.0, 8.0, 3.5345, 0.5)
      )
      breathParameters.pushBack(
        new BreathParameterData(this._idParamAngleZ, 0.0, 10.0, 5.5345, 0.5)
      )
      breathParameters.pushBack(
        new BreathParameterData(this._idParamBodyAngleX, 0.0, 4.0, 15.5345, 0.5)
      )
      breathParameters.pushBack(
        new BreathParameterData(
          CubismFramework.getIdManager().getId(
            CubismDefaultParameterId.ParamBreath
          ),
          0.5,
          0.5,
          3.2345,
          1
        )
      )

      this._breath.setParameters(breathParameters)
      // callback
      loadUserData()
    }

    // UserData
    const loadUserData = (): void => {
      if (this._modelSetting.getUserDataFile() != '') {
        console.log('[MODEL]UserData is complete.')
        const userDataFile = this._modelSetting.getUserDataFile()
        fetch(`${this._modelPath}${userDataFile}`)
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => {
            this.loadUserData(arrayBuffer, arrayBuffer.byteLength)
            // callback
            setupEyeBlinkIds()
          })
      } else {
        console.log('[MODEL]Model has no userdata.')
        // callback
        setupEyeBlinkIds()
      }
    }

    // EyeBlinkIds
    const setupEyeBlinkIds = (): void => {
      console.log('[MODEL]EyeBlinkIds is complete.')
      const eyeBlinkIdCount: number = this._modelSetting.getEyeBlinkParameterCount()

      for (let i = 0; i < eyeBlinkIdCount; ++i) {
        this._eyeBlinkIds.pushBack(
          this._modelSetting.getEyeBlinkParameterId(i)
        )
      }
      // callback
      setupLipSyncIds()
    }

    // LipSyncIds
    const setupLipSyncIds = (): void => {
      console.log('[MODEL]LipSyncIds is complete.')
      const lipSyncIdCount = this._modelSetting.getLipSyncParameterCount()

      for (let i = 0; i < lipSyncIdCount; ++i) {
        this._lipSyncIds.pushBack(this._modelSetting.getLipSyncParameterId(i))
      }
      // callback
      setupLayout()
    }

    // Layout
    const setupLayout = (): void => {
      console.log('[MODEL]Layout is complete.')
      const layout: csmMap<string, number> = new csmMap<string, number>()
      this._modelSetting.getLayoutMap(layout)
      this._modelMatrix.setupFromLayout(layout)
      // callback
      loadCubismMotion()
    }

    // Motion
    const loadCubismMotion = (): void => {
      console.log('[MODEL]Motion is complete.')
      this._model.saveParameters()
      this._allMotionCount = 0
      this._motionCount = 0
      const group: string[] = []
      const motionGroupCount: number = this._modelSetting.getMotionGroupCount()

      // 求运动总数
      for (let i = 0; i < motionGroupCount; i++) {
        group[i] = this._modelSetting.getMotionGroupName(i)
        this._allMotionCount += this._modelSetting.getMotionCount(group[i])
      }
      // 导入运动
      for (let i = 0; i < motionGroupCount; i++) {
        this.preLoadMotionGroup(group[i], callback)
      }
      // 无动作
      if (motionGroupCount == 0) {
        // 停止所有运动
        this._motionManager.stopAllMotions()
        this._updating = false
        this._initialized = true

        this.createRenderer()
        this.setupTextures()
        this.getRenderer().startUp(this._gl)
      }
    }
  }

  public preLoadMotionGroup(group: string, callback: Function): void {
    for (let i = 0; i < this._modelSetting.getMotionCount(group); i++) {
      const motionFileName = this._modelSetting.getMotionFileName(group, i)

      // ex) idle_0
      const name = `${group}_${i}`
      if (this._debugMode) {
        console.log(`[APP]load motion: ${motionFileName} => [${name}]`)
      }

      // 收集信息
      callback(name)

      fetch(`${this._modelPath}${motionFileName}`)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          const tmpMotion: CubismMotion = this.loadMotion(
            arrayBuffer,
            arrayBuffer.byteLength,
            name
          )

          let fadeTime = this._modelSetting.getMotionFadeInTimeValue(group, i)
          if (fadeTime >= 0.0) {
            tmpMotion.setFadeInTime(fadeTime)
          }

          fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, i)
          if (fadeTime >= 0.0) {
            tmpMotion.setFadeOutTime(fadeTime)
          }
          tmpMotion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds)

          if (this._motions.getValue(name) != null) {
            ACubismMotion.delete(this._motions.getValue(name))
          }

          this._motions.setValue(name, tmpMotion)

          this._motionCount++
          if (this._motionCount >= this._allMotionCount) {

            // 停止所有运动
            this._motionManager.stopAllMotions()

            this._updating = false
            this._initialized = true

            this.createRenderer()
            this.setupTextures()
            this.getRenderer().startUp(this._gl)
          }
        })
    }
    console.log('[MODEL]MotionGroup is complete.')
  }

  //  将纹理加载到纹理单元
  private setupTextures(): void {
    // 用于纹理导入
    const textureCount: number = this._modelSetting.getTextureCount()
    for (let modelTextureNumber = 0; modelTextureNumber < textureCount; modelTextureNumber++) {
      // 如果纹理名称为空字符，则跳过加载绑定过程
      if (this._modelSetting.getTextureFileName(modelTextureNumber) == '') {
        console.log('getTextureFileName null')
        continue
      }
      // WebGL将纹理加载到纹理单元
      let texturePath = this._modelSetting.getTextureFileName(modelTextureNumber)
      texturePath = this._modelPath + texturePath
      // 加载完成时调用的回调函数
      const onLoad = (textureInfo: TextureInfo): void => {
        this.getRenderer().bindTexture(modelTextureNumber, textureInfo.id)
        this._textureCount++
        if (this._textureCount >= textureCount) {
          this._state = true
        }
      }
      // 装入
      this._textureManager.createTextureFromPngFile(texturePath, true, onLoad)
      this.getRenderer().setIsPremultipliedAlpha(true)
    }
  }

  // 更新
  public update(deltaTime: number): void {
    if (!this._model) return;
    // 和动画播放时间周期有关.
    const deltaTimeSeconds: number = deltaTime
    this._userTimeSeconds += deltaTimeSeconds;

    this._dragManager.update(deltaTimeSeconds);
    this._dragX = this._dragManager.getX();
    this._dragY = this._dragManager.getY();

    // 是否通过运动进行参数更新
    let motionUpdated = false;
    // 加载上次保存的状态
    this._model.loadParameters();
    if (!this._motionManager.isFinished()) {
      // 更新运动
      motionUpdated = this._motionManager.updateMotion(this._model, deltaTimeSeconds);
    }
    // 保存状态
    this._model.saveParameters();

    // 眨眼
    if (!motionUpdated) {
      if (this._eyeBlink != null) {
        this._eyeBlink.updateParameters(this._model, deltaTimeSeconds);
      }
    }

    if (this._expressionManager != null) {
      this._expressionManager.updateMotion(this._model, deltaTimeSeconds); // 通过表情更新参数
    }

    //通过拖动调整脸部朝向
    this._model.addParameterValueById(this._idParamAngleX, this._dragX * 30);
    this._model.addParameterValueById(this._idParamAngleY, this._dragY * 30);
    this._model.addParameterValueById(
      this._idParamAngleZ,
      this._dragX * this._dragY * -30
    );

    // 通过拖动调整身体方向
    this._model.addParameterValueById(
      this._idParamBodyAngleX,
      this._dragX * 10
    )

    // 通过拖动调整眼睛方向
    this._model.addParameterValueById(this._idParamEyeBallX, this._dragX); // -1から1の値を加える
    this._model.addParameterValueById(this._idParamEyeBallY, this._dragY);

    // 呼吸
    if (this._breath != null) {
      this._breath.updateParameters(this._model, deltaTimeSeconds);
    }

    // 物理演算の設定
    if (this._physics != null) {
      this._physics.evaluate(this._model, deltaTimeSeconds);
    }

    // 设置唇同步
    if (this._lipsync) {
      // 当实时进行唇部同步时，从系统获取音量，并在0到1的范围内输入值
      for (let i = 0; i < this._lipSyncIds.getSize(); ++i) {
        this._model.addParameterValueById(this._lipSyncIds.at(i), this._maxVoice, 0.8);
      }
    }

    // 姿势设置
    if (this._pose != null) {
      this._pose.updateParameters(this._model, deltaTimeSeconds);
    }
    this._model.update();
  }

  // 绘制模型的过程。传递要绘制模型的空间的视图投影矩阵。
  public draw(canvas: HTMLCanvasElement, matrix: CubismMatrix44, frameBuffer: WebGLFramebuffer): void {
    if (this._model == null) {
      return;
    }

    // 各读取结束后
    if (this._state) {
      matrix.multiplyByMatrix(this._modelMatrix);
      this.getRenderer().setMvpMatrix(matrix);

      this.doDraw(canvas, frameBuffer);
    }
  }


  public doDraw(canvas: HTMLCanvasElement, frameBuffer: WebGLFramebuffer): void {
    if (this._model == null) return;
    // 传递画布大小
    const viewport: number[] = [0, 0, canvas.width, canvas.height]

    this.getRenderer().setRenderState(frameBuffer, viewport)
    this.getRenderer().drawModel();
  }

  public hitTest(hitArenaName: string, x: number, y: number): boolean {
    // 透明时无判定
    if (this._opacity < 1) {
      return false;
    }

    const count: number = this._modelSetting.getHitAreasCount();
    for (let i = 0; i < count; i++) {
      if (this._modelSetting.getHitAreaName(i) == hitArenaName) {
        const drawId: CubismIdHandle = this._modelSetting.getHitAreaId(i);
        return this.isHit(drawId, x, y);
      }
    }

    return false;
  }


  /**
* 开始播放由参数指定的运动
* @param group モーショングループ名
* @param no グループ内の番号
* @param priority 優先度
* @param onFinishedMotionHandler モーション再生終了時に呼び出されるコールバック関数
* @return 開始したモーションの識別番号を返す。個別のモーションが終了したか否かを判定するisFinished()の引数で使用する。開始できない時は[-1]
*/
  public startMotion(
    group: string,
    no: number,
    priority: number,
    onFinishedMotionHandler?: FinishedMotionCallback
  ): CubismMotionQueueEntryHandle {
    if (priority == 3) {
      this._motionManager.setReservePriority(priority);
    } else if (!this._motionManager.reserveMotion(priority)) {
      if (this._debugMode) {
        console.log("[APP]can't start motion.");
      }
      return InvalidMotionQueueEntryHandleValue;
    }

    const motionFileName = this._modelSetting.getMotionFileName(group, no);
    // console.log('--------------------------------')
    // ex) idle_0
    const name = `${group}_${no}`;
    let motion: CubismMotion = this._motions.getValue(name) as CubismMotion;
    let autoDelete = false;

    if (motion == null) {
      fetch(`${this._modelPath}${motionFileName}`)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          motion = this.loadMotion(
            arrayBuffer,
            arrayBuffer.byteLength,
            null,
            onFinishedMotionHandler
          );
          let fadeTime: number = this._modelSetting.getMotionFadeInTimeValue(
            group,
            no
          );

          if (fadeTime >= 0.0) {
            motion.setFadeInTime(fadeTime);
          }

          fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, no);
          if (fadeTime >= 0.0) {
            motion.setFadeOutTime(fadeTime);
          }

          motion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);
          autoDelete = true; // 終了時にメモリから削除
        });
    } else {
      motion.setFinishedMotionHandler(onFinishedMotionHandler);
    }

    if (this._debugMode) {
      console.log(`[APP]start motion: [${group}_${no}]`);
    }
    return this._motionManager.startMotionPriority(motion, autoDelete, priority);
  }

}