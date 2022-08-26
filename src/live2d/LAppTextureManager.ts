import { csmVector, iterator } from '../framework/type/csmvector'

export class LAppTextureManager {

  _textures: csmVector<TextureInfo>
  _gl: WebGLRenderingContext

  constructor(gl: WebGLRenderingContext) {
    this._textures = new csmVector<TextureInfo>()
    this._gl = gl
  }

  /**
   * 图像读取
   *
   * @param fileName 読み込む画像ファイルパス名
   * @param usePremultiply Premult処理を有効にするか
   * @return 画像情報、読み込み失敗時はnullを返す
   */
  public createTextureFromPngFile(
    fileName: string,
    usePremultiply: boolean,
    callback: (textureInfo: TextureInfo) => void
  ): void {
    for (
      let ite: iterator<TextureInfo> = this._textures.begin();
      ite.notEqual(this._textures.end());
      ite.preIncrement()
    ) {
      if (
        ite.ptr().fileName == fileName &&
        ite.ptr().usePremultply == usePremultiply
      ) {
        ite.ptr().img = new Image();
        ite.ptr().img.onload = (): void => callback(ite.ptr());
        ite.ptr().img.src = fileName;
        return;
      }
    }

    // データのオンロードをトリガーにする
    const img = new Image();
    img.onload = (): void => {
      // テクスチャオブジェクトの作成
      const tex: WebGLTexture = this._gl.createTexture();

      // テクスチャを選択
      this._gl.bindTexture(WebGLRenderingContext.TEXTURE_2D, tex);

      // テクスチャにピクセルを書き込む
      this._gl.texParameteri(
        WebGLRenderingContext.TEXTURE_2D,
        WebGLRenderingContext.TEXTURE_MIN_FILTER,
        WebGLRenderingContext.LINEAR_MIPMAP_LINEAR
      );
      this._gl.texParameteri(WebGLRenderingContext.TEXTURE_2D, WebGLRenderingContext.TEXTURE_MAG_FILTER, WebGLRenderingContext.LINEAR);

      // Premult処理を行わせる
      if (usePremultiply) {
        this._gl.pixelStorei(WebGLRenderingContext.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
      }

      // テクスチャにピクセルを書き込む
      this._gl.texImage2D(WebGLRenderingContext.TEXTURE_2D, 0, WebGLRenderingContext.RGBA, WebGLRenderingContext.RGBA, WebGLRenderingContext.UNSIGNED_BYTE, img);

      // ミップマップを生成
      this._gl.generateMipmap(WebGLRenderingContext.TEXTURE_2D);

      // テクスチャをバインド
      this._gl.bindTexture(WebGLRenderingContext.TEXTURE_2D, null);

      const textureInfo: TextureInfo = new TextureInfo();
      if (textureInfo != null) {
        textureInfo.fileName = fileName;
        textureInfo.width = img.width;
        textureInfo.height = img.height;
        textureInfo.id = tex;
        textureInfo.img = img;
        textureInfo.usePremultply = usePremultiply;
        this._textures.pushBack(textureInfo);
      }

      callback(textureInfo);
    };
    img.src = fileName;
  }

}

/**
 * 画像情報構造体
 */
export class TextureInfo {
  img: HTMLImageElement; // 画像
  id: WebGLTexture = null; // テクスチャ
  width = 0; // 横幅
  height = 0; // 高さ
  usePremultply: boolean; // Premult処理を有効にするか
  fileName: string; // ファイル名
}