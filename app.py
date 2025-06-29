# app.py

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import qrcode
import io

app = Flask(__name__)
CORS(app)  # フロントエンドからのリクエストを許可

@app.route('/api/qrcode', methods=['POST'])
def generate_qrcode():
    """
    QRコード生成API
    POSTリクエストでテキストを受け取り、QRコード画像を返す
    """
    # JSON形式でデータを受け取る
    data = request.get_json()
    
    # 入力チェック
    if not data or "text" not in data:
        return jsonify({"error": "テキストが必要です"}), 400
    
    text = data["text"]
    
    # 空文字や長すぎるテキストのチェック
    if not text.strip():
        return jsonify({"error": "有効なテキストを入力してください"}), 400
    
    if len(text) > 500:
        return jsonify({"error": "テキストは500文字以内で入力してください"}), 400
    
    try:
        # QRコード画像を生成
        qr = qrcode.QRCode(
            version=1,  # QRコードのサイズ（1～40）
            error_correction=qrcode.constants.ERROR_CORRECT_M,  # 誤り訂正レベル
            box_size=10,  # 1ブロックのピクセルサイズ
            border=4      # 枠の幅
        )
        qr.add_data(text)
        qr.make(fit=True)
        
        # 画像を作成
        img = qr.make_image(fill_color="black", back_color="white")
        
        # メモリ上に画像を保存
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        
        # 画像をHTTPレスポンスとして返す
        return send_file(buf, mimetype='image/png')
        
    except Exception as e:
        return jsonify({"error": "QRコード生成中にエラーが発生しました"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    サーバーの動作確認用エンドポイント
    """
    return jsonify({"status": "OK", "message": "QRコード生成APIサーバーが動作中です"})

if __name__ == '__main__':
    print("QRコード生成APIサーバーを起動中...")
    print("サーバーURL: http://localhost:5000")
    print("API エンドポイント: http://localhost:5000/api/qrcode")
    app.run(debug=True, host='0.0.0.0', port=5000)