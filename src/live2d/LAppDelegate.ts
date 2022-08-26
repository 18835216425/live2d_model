import { CubismFramework, Option, LogLevel } from '../framework/live2dcubismframework'
/**
 * 应用程序类
 * 负责初始化框架
 */
export class LAppDelegate {

  static s_instance: LAppDelegate //内部实例
  _cubismOption: Option // Option

  constructor() {
    this._cubismOption = new Option()
  }

  /**
   * 返回类的实例（单个）
   * 如果未生成实例，则在内部生成实例。
   *
   * @return 类实例
   */
  public static getInstance(): LAppDelegate {
    if (this.s_instance == null) {
      this.s_instance = new LAppDelegate()
    }
    return this.s_instance
  }

  /**
   * 释放一个类的实例（单个）。
   */
  public static releaseInstance(): void {
    if (LAppDelegate.s_instance != null) {
      LAppDelegate.s_instance.release()
    }
    LAppDelegate.s_instance = null
  }

  /**
   * 释放
   */
  public release(): void {
    CubismFramework.dispose()
  }

  /**
   * 初始化APP
   */
  public initialize(): void {
    // 设置 cubism
    this._cubismOption.logFunction = (message) => {
      console.log(message)
    }
    this._cubismOption.loggingLevel = LogLevel.LogLevel_Verbose

    CubismFramework.startUp(this._cubismOption)
    // 初始化 cubism
    CubismFramework.initialize()
  }
}