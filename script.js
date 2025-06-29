// script.js

document.addEventListener("DOMContentLoaded", function () {
  // 1. 画面の要素を取得
  const input = document.getElementById("qrText");
  const generateButton = document.getElementById("generateBtn");
  const qrResult = document.getElementById("qrResult");
  const downloadButton = document.getElementById("downloadBtn");

  // 現在表示中のQRコード画像のURL（ダウンロード用）
  let currentQRImageUrl = null;

  // 2. ボタンがクリックされたときの処理
  generateButton.addEventListener("click", async function () {
    const text = input.value.trim();

    // 入力チェック
    if (!text) {
      alert("テキストを入力してください。");
      return;
    }

    // ボタンを無効化（連続クリック防止）
    generateButton.disabled = true;
    generateButton.textContent = "生成中...";

    try {
      // 3. APIにPOSTリクエストを送信
      const response = await fetch("http://localhost:5000/api/qrcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text }),
      });

      if (!response.ok) {
        // エラーレスポンスの場合
        const errorData = await response.json();
        throw new Error(errorData.error || "QRコードの生成に失敗しました。");
      }

      // 4. レスポンスをblob（画像データ）として取得
      const blob = await response.blob();

      // 5. 画像を表示
      displayQRCode(blob);
    } catch (error) {
      console.error("QRコード生成エラー:", error);
      alert("エラー: " + error.message);
    } finally {
      // ボタンを元に戻す
      generateButton.disabled = false;
      generateButton.textContent = "QRコード生成";
    }
  });

  // QRコード画像を表示する関数
  function displayQRCode(blob) {
    // 既存の画像URLがあれば解放
    if (currentQRImageUrl) {
      URL.revokeObjectURL(currentQRImageUrl);
    }

    // 新しい画像URLを作成
    currentQRImageUrl = URL.createObjectURL(blob);

    // QRコード表示エリアをクリア
    qrResult.innerHTML = "";

    // 新しい画像要素を作成
    const img = document.createElement("img");
    img.src = currentQRImageUrl;
    img.alt = "Generated QR Code";
    img.style.maxWidth = "100%";
    img.style.maxHeight = "100%";

    // 画像を表示エリアに追加
    qrResult.appendChild(img);

    // ダウンロードボタンを有効化
    downloadButton.disabled = false;
  }

  // 6. ダウンロードボタンの処理
  downloadButton.addEventListener("click", function () {
    if (currentQRImageUrl) {
      // 仮想のaタグを作成してダウンロード
      const a = document.createElement("a");
      a.href = currentQRImageUrl;
      a.download = "qrcode.png"; // 保存時のファイル名
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert("QRコードが生成されていません！");
    }
  });

  // Enterキーでも生成できるようにする
  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      generateButton.click();
    }
  });
});
