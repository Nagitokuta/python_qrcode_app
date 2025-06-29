document.addEventListener("DOMContentLoaded", function () {
  // DOM要素の取得
  const input = document.getElementById("qrText");
  const generateButton = document.getElementById("generateBtn");
  const qrResult = document.getElementById("qrResult");
  const downloadButton = document.getElementById("downloadBtn");

  // 現在表示中のQRコード画像のURL（ダウンロード用）
  let currentQRImageUrl = null;
  let currentQRText = "";

  // QRコード生成処理
  generateButton.addEventListener("click", async function () {
    const text = input.value.trim();

    // 入力チェック
    if (!text) {
      showMessage("テキストを入力してください。", "error");
      return;
    }

    // ボタンを無効化（連続クリック防止）
    setGenerateButtonState(true);

    try {
      // APIにPOSTリクエストを送信
      const response = await fetch("http://localhost:5000/api/qrcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "QRコードの生成に失敗しました。");
      }

      // レスポンスをblob（画像データ）として取得
      const blob = await response.blob();

      // 画像を表示
      displayQRCode(blob, text);
      showMessage("QRコードを生成しました！", "success");
    } catch (error) {
      console.error("QRコード生成エラー:", error);
      showMessage("エラー: " + error.message, "error");
    } finally {
      // ボタンを元に戻す
      setGenerateButtonState(false);
    }
  });

  // QRコード画像を表示する関数
  function displayQRCode(blob, text) {
    // 既存の画像URLがあれば解放
    if (currentQRImageUrl) {
      URL.revokeObjectURL(currentQRImageUrl);
    }

    // 新しい画像URLを作成
    currentQRImageUrl = URL.createObjectURL(blob);
    currentQRText = text;

    // QRコード表示エリアをクリア
    qrResult.innerHTML = "";

    // 新しい画像要素を作成
    const img = document.createElement("img");
    img.src = currentQRImageUrl;
    img.alt = "Generated QR Code";
    img.style.maxWidth = "100%";
    img.style.maxHeight = "100%";
    img.style.borderRadius = "4px";

    // 画像を表示エリアに追加
    qrResult.appendChild(img);

    // ダウンロードボタンを有効化
    downloadButton.disabled = false;
    downloadButton.innerHTML = "📥 ダウンロード";
  }

  // 改良されたダウンロード機能
  downloadButton.addEventListener("click", function () {
    if (!currentQRImageUrl) {
      showMessage("QRコードが生成されていません！", "error");
      return;
    }

    try {
      // ダウンロード中の表示
      downloadButton.innerHTML = "⏳ ダウンロード中...";
      downloadButton.disabled = true;

      // ファイル名を動的生成
      const fileName = generateFileName(currentQRText);

      // 仮想のaタグを作成してダウンロード
      const a = document.createElement("a");
      a.href = currentQRImageUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // ダウンロード完了のフィードバック
      setTimeout(() => {
        downloadButton.innerHTML = "✅ ダウンロード完了";
        showMessage(`ファイル "${fileName}" をダウンロードしました`, "success");

        // 2秒後に元に戻す
        setTimeout(() => {
          downloadButton.innerHTML = "📥 ダウンロード";
          downloadButton.disabled = false;
        }, 2000);
      }, 500);
    } catch (error) {
      console.error("ダウンロードエラー:", error);
      showMessage("ダウンロードに失敗しました", "error");
      downloadButton.innerHTML = "📥 ダウンロード";
      downloadButton.disabled = false;
    }
  });

  // ファイル名生成関数
  function generateFileName(text) {
    // 現在の日時を取得
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\..+/, "")
      .replace("T", "_");

    // テキストの最初の10文字を安全なファイル名に変換
    const safeText = text
      .substring(0, 10)
      .replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    return `qr_${safeText}_${timestamp}.png`;
  }

  // 生成ボタンの状態管理
  function setGenerateButtonState(isLoading) {
    if (isLoading) {
      generateButton.disabled = true;
      generateButton.innerHTML = "⏳ 生成中...";
    } else {
      generateButton.disabled = false;
      generateButton.innerHTML = "QRコード生成";
    }
  }

  // メッセージ表示機能
  function showMessage(message, type = "info") {
    // 既存のメッセージを削除
    const existingMessage = document.querySelector(".message");
    if (existingMessage) {
      existingMessage.remove();
    }

    // 新しいメッセージ要素を作成
    const messageDiv = document.createElement("div");
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;

    // コンテナの最上部に挿入
    const container = document.querySelector(".container");
    container.insertBefore(messageDiv, container.firstChild);

    // 3秒後に自動削除
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 3000);
  }

  // Enterキーでも生成できるようにする
  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !generateButton.disabled) {
      generateButton.click();
    }
  });

  // 入力欄のリアルタイム検証
  input.addEventListener("input", function () {
    const text = input.value.trim();
    if (text.length > 500) {
      showMessage("テキストは500文字以内で入力してください", "warning");
    }
  });
});
// メモリリーク防止のためのクリーンアップ
window.addEventListener("beforeunload", function () {
  if (currentQRImageUrl) {
    URL.revokeObjectURL(currentQRImageUrl);
  }
});

// 画像の遅延読み込み対応
function displayQRCode(blob, text) {
  // 既存の画像URLがあれば解放
  if (currentQRImageUrl) {
    URL.revokeObjectURL(currentQRImageUrl);
  }

  // 新しい画像URLを作成
  currentQRImageUrl = URL.createObjectURL(blob);
  currentQRText = text;

  // QRコード表示エリアをクリア
  qrResult.innerHTML = "";

  // 新しい画像要素を作成
  const img = document.createElement("img");
  img.src = currentQRImageUrl;
  img.alt = `QRコード: ${text.substring(0, 50)}${
    text.length > 50 ? "..." : ""
  }`;
  img.style.maxWidth = "100%";
  img.style.maxHeight = "100%";
  img.style.borderRadius = "4px";
  img.loading = "lazy"; // 遅延読み込み

  // 画像読み込み完了時の処理
  img.onload = function () {
    // ARIAラベルを更新
    qrResult.setAttribute(
      "aria-label",
      `QRコード画像が生成されました: ${text}`
    );
  };

  // 画像を表示エリアに追加
  qrResult.appendChild(img);

  // ダウンロードボタンを有効化
  downloadButton.disabled = false;
  downloadButton.innerHTML = "📥 ダウンロード";
}
