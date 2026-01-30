# 每日經文快速開始指南 🎯

這是一個簡單的指南，幫助你在 iOS 和 Mac 上設置每日經文顯示。

## 🚀 最簡單的方法（推薦）

### 方法一：iOS Shortcuts + 通知（5分鐘設置）

**優點**：設置簡單，每天自動推送通知

**步驟**：

1. **部署 API**（如果還沒部署）
   ```bash
   # 確保你的 Next.js 應用已部署
   # API 端點: https://your-domain.com/api/daily-verse
   ```

2. **創建 Shortcut**
   - 打開「捷徑」App
   - 點擊「+」創建新捷徑
   - 添加以下動作：
     ```
     1. 「取得網頁內容」
        URL: https://your-domain.com/api/daily-verse
        方法: GET
     
     2. 「從輸入取得 JSON」
        鍵: formatted
     
     3. 「顯示通知」
        標題: 今日經文
        內容: (上一步的結果)
     ```

3. **設置自動化**
   - 「捷徑」→ 「自動化」→ 「+」
   - 選擇「特定時間」→ 每天 00:01
   - 添加動作：運行剛才創建的 Shortcut
   - **關閉「執行前先詢問」**

完成！每天會自動收到經文通知。

---

### 方法二：iOS 鎖定畫面圖片（10分鐘設置）

**優點**：每次解鎖都能看到經文

**步驟**：

1. **創建生成圖片的 Shortcut**
   ```
   1. 「取得網頁內容」
      URL: https://your-domain.com/api/daily-verse
   
   2. 「從輸入取得 JSON」
      取得: reference 和 text
   
   3. 「文字」
      內容: {reference}\n\n{text}
   
   4. 「製作圖片」
      背景: 深色漸層或圖片
      文字: (上一步的文字)
      字體: 24pt，白色
      尺寸: 1080x1920 (iPhone 尺寸)
   
   5. 「儲存到相簿」
      相簿: 每日經文
   
   6. 「設定鎖定畫面」
      選擇剛才的圖片
   ```

2. **設置自動化**（同上）

---

### 方法三：Mac 桌面圖片（10分鐘設置）

**優點**：工作時隨時看到經文

**步驟**：

1. **創建 Shortcut**（與 iOS 類似，但尺寸改為 Mac 解析度）
   ```
   1. 取得每日經文
   2. 製作圖片（Mac 尺寸，如 2560x1440）
   3. 設定桌面圖片
   ```

2. **設置自動化**
   - 「系統設定」→ 「隱私權與安全性」→ 「自動化」
   - 創建每天運行的自動化

---

## 📱 其他方法

### 方法四：使用 Scriptable（iOS，需要技術背景）

1. 安裝 Scriptable App
2. 創建 Widget 腳本
3. 從 API 獲取經文並顯示

### 方法五：使用 Widgetsmith（iOS，付費 App）

1. 安裝 Widgetsmith
2. 創建文字 Widget
3. 使用 Shortcut 更新 Widget 內容

---

## 🔧 API 使用說明

### 端點

```
GET /api/daily-verse
```

### 參數

- `date` (可選): `YYYY-MM-DD`，預設今天
- `version` (可選): 聖經版本，預設 `unv`（和合本）
- `simplified` (可選): `1` 為簡體，預設繁體

### 範例

```bash
# 今天的經文
curl https://your-domain.com/api/daily-verse

# 特定日期
curl https://your-domain.com/api/daily-verse?date=2024-01-01

# 簡體中文
curl https://your-domain.com/api/daily-verse?simplified=1
```

### 回應格式

```json
{
  "date": "2024-01-01",
  "reference": "約翰福音 3:16",
  "text": "神愛世人，甚至將他的獨生子賜給他們...",
  "formatted": "約翰福音 3:16\n\n神愛世人..."
}
```

---

## ⚙️ 自定義設置

### 修改經文列表

編輯 `app/api/daily-verse/route.ts`，修改 `dailyVerses` 數組。

### 修改圖片樣式

在 Shortcut 的「製作圖片」動作中調整：
- 背景顏色/圖片
- 文字顏色和字體
- 圖片尺寸

### 修改通知時間

在自動化設置中修改觸發時間。

---

## ❓ 常見問題

### Q: Shortcut 無法運行？

**A**: 檢查：
1. API URL 是否正確
2. 網路連接是否正常
3. JSON 解析是否正確（確認 API 返回格式）

### Q: 鎖定畫面不更新？

**A**: 
1. 確認 Shortcut 有「設定鎖定畫面」權限
2. 檢查自動化是否關閉了「執行前先詢問」
3. 嘗試手動運行 Shortcut

### Q: 如何測試 API？

**A**: 
```bash
# 在瀏覽器打開
https://your-domain.com/api/daily-verse

# 或使用 curl
curl https://your-domain.com/api/daily-verse
```

### Q: 可以同時設置多個設備嗎？

**A**: 可以！每個設備都需要單獨設置 Shortcut 和自動化。

---

## 📝 完整文檔

詳細設置說明請參考：[DAILY_VERSE_SETUP.md](./DAILY_VERSE_SETUP.md)

---

## 🎨 進階技巧

### 添加背景圖片

在「製作圖片」動作中，選擇「從相簿選擇」作為背景。

### 添加日期顯示

在文字中加入日期變數：
```
{date}\n\n{reference}\n\n{text}
```

### 多語言支持

API 支持 `simplified=1` 參數獲取簡體中文版本。

---

## 🆘 需要幫助？

1. 檢查 API 是否正常運行
2. 確認 Shortcut 動作順序正確
3. 檢查自動化設置
4. 查看 [完整設置指南](./DAILY_VERSE_SETUP.md)
