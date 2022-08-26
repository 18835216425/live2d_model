/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

/**
 * 4x4の行列
 *
 * 4x4行列の便利クラス。
 */
export class CubismMatrix44 {
  /**
   * コンストラクタ
   */
  public constructor() {
    this._tr = new Float32Array(16); // 4 * 4のサイズ
    this.loadIdentity();
  }

  /**
   * 对收到的两个矩阵进行乘法运算。
   *
   * @param a 行列a
   * @param b 行列b
   * @return 乗算結果の行列
   */
  public static multiply(
    a: Float32Array,
    b: Float32Array,
    dst: Float32Array
  ): void {
    const c: Float32Array = new Float32Array([
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ]);

    const n = 4;

    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < n; ++j) {
        for (let k = 0; k < n; ++k) {
          c[j + i * 4] += a[k + i * 4] * b[j + k * 4];
        }
      }
    }

    for (let i = 0; i < 16; ++i) {
      dst[i] = c[i];
    }
  }

  /**
   * 初始化为单位矩阵
   */
  public loadIdentity(): void {
    const c: Float32Array = new Float32Array([
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0
    ]);

    this.setMatrix(c);
  }

  /**
   * 行列を設定
   *
   * @param tr 由16个浮点表示的4x4矩阵
   */
  public setMatrix(tr: Float32Array): void {
    for (let i = 0; i < 16; ++i) {
      this._tr[i] = tr[i];
    }
  }

  /**
   * 行列を浮動小数点数の配列で取得
   *
   * @return 16個の浮動小数点数で表される4x4の行列
   */
  public getArray(): Float32Array {
    return this._tr;
  }

  /**
   * X軸の拡大率を取得
   * @return X軸の拡大率
   */
  public getScaleX(): number {
    return this._tr[0];
  }

  /**
   * Y軸の拡大率を取得する
   *
   * @return Y軸の拡大率
   */
  public getScaleY(): number {
    return this._tr[5];
  }

  /**
   * X軸の移動量を取得
   * @return X軸の移動量
   */
  public getTranslateX(): number {
    return this._tr[12];
  }

  /**
   * Y軸の移動量を取得
   * @return Y軸の移動量
   */
  public getTranslateY(): number {
    return this._tr[13];
  }

  /**
   * X軸の値を現在の行列で計算
   *
   * @param src X軸の値
   * @return 現在の行列で計算されたX軸の値
   */
  public transformX(src: number): number {
    return this._tr[0] * src + this._tr[12];
  }

  /**
   * Y軸の値を現在の行列で計算
   *
   * @param src Y軸の値
   * @return 現在の行列で計算されたY軸の値
   */
  public transformY(src: number): number {
    return this._tr[5] * src + this._tr[13];
  }

  /**
   * X軸の値を現在の行列で逆計算
   */
  public invertTransformX(src: number): number {
    return (src - this._tr[12]) / this._tr[0];
  }

  /**
   * Y軸の値を現在の行列で逆計算
   */
  public invertTransformY(src: number): number {
    return (src - this._tr[13]) / this._tr[5];
  }

  /**
   * 以当前矩阵的位置为起点移动
   *
   * 以当前矩阵的位置为起点相对移动
   *
   * @param x X軸の移動量
   * @param y Y軸の移動量
   */
  public translateRelative(x: number, y: number): void {
    const tr1: Float32Array = new Float32Array([
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      x,
      y,
      0.0,
      1.0
    ]);

    CubismMatrix44.multiply(tr1, this._tr, this._tr);
  }

  /**
   * 現在の行列の位置を移動
   *
   * 現在の行列の位置を指定した位置へ移動する
   *
   * @param x X軸の移動量
   * @param y y軸の移動量
   */
  public translate(x: number, y: number): void {
    this._tr[12] = x;
    this._tr[13] = y;
  }

  /**
   * 現在の行列のX軸の位置を指定した位置へ移動する
   *
   * @param x X軸の移動量
   */
  public translateX(x: number): void {
    this._tr[12] = x;
  }

  /**
   * 現在の行列のY軸の位置を指定した位置へ移動する
   *
   * @param y Y軸の移動量
   */
  public translateY(y: number): void {
    this._tr[13] = y;
  }

  /**
   * 相对设置当前矩阵的放大率
   *
   * @param x X軸の拡大率
   * @param y Y軸の拡大率
   */
  public scaleRelative(x: number, y: number): void {
    const tr1: Float32Array = new Float32Array([
      x,
      0.0,
      0.0,
      0.0,
      0.0,
      y,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0
    ]);

    CubismMatrix44.multiply(tr1, this._tr, this._tr);
  }

  /**
   * 将当前矩阵的缩放比例设置为指定的缩放比例
   *
   * @param x X軸の拡大率
   * @param y Y軸の拡大率
   */
  public scale(x: number, y: number): void {
    this._tr[0] = x;
    this._tr[5] = y;
  }

  /**
   * 現在の行列に行列を乗算
   *
   * @param m 行列
   */
  public multiplyByMatrix(m: CubismMatrix44): void {
    CubismMatrix44.multiply(m.getArray(), this._tr, this._tr);
  }

  /**
   * オブジェクトのコピーを生成する
   */
  public clone(): CubismMatrix44 {
    const cloneMatrix: CubismMatrix44 = new CubismMatrix44();

    for (let i = 0; i < this._tr.length; i++) {
      cloneMatrix._tr[i] = this._tr[i];
    }

    return cloneMatrix;
  }

  protected _tr: Float32Array; // 4x4行列データ
}

// Namespace definition for compatibility.
import * as $ from './cubismmatrix44';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMatrix44 = $.CubismMatrix44;
  export type CubismMatrix44 = $.CubismMatrix44;
}
