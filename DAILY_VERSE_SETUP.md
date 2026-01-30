# 每日經文設置指南

本指南提供多種方法在 iOS 和 Mac 上顯示每日經文。

## 方法一：使用 Shortcuts（推薦）

### iOS 設置步驟

#### 1. 創建獲取每日經文的 Shortcut

1. 打開「捷徑」App
2. 點擊右上角「+」創建新捷徑
3. 添加以下動作：

```
1. 「取得網頁內容」
   - URL: https://your-domain.com/api/daily-verse
   - 方法: GET

2. 「從輸入取得 JSON」
   - 鍵: text

3. 「設定變數」
   - 變數名稱: verseText
   - 值: (JSON 的 text 欄位)

4. 「設定變數」
   - 變數名稱: verseRef
   - 值: (JSON 的 reference 欄位)

5. 「文字」
   - 內容: 「{verseRef}\n\n{verseText}」

6. 「顯示通知」
   - 標題: 今日經文
   - 內容: (上一步的文字)
```

#### 2. 設置自動化（每天更新）

1. 打開「捷徑」App → 「自動化」
2. 點擊「+」→ 「創建個人自動化」
3. 選擇「特定時間」
   - 時間: 每天 00:01（或你想要的時間）
4. 添加動作：
   - 運行剛才創建的捷徑
5. 關閉「執行前先詢問」

#### 3. 在鎖定畫面顯示（iOS 16+）

**選項 A：使用鎖定畫面 Widget**

1. 長按鎖定畫面 → 自訂
2. 添加 Widget → 選擇「文字」Widget
3. 在 Shortcut 中添加「設定鎖定畫面」動作：
   - 使用「文字」Widget 顯示經文

**選項 B：使用照片 Widget**

1. 創建一個 Shortcut 生成帶有經文的圖片
2. 將圖片保存到相簿
3. 設置鎖定畫面使用該圖片

**生成經文圖片的 Shortcut：**

```
1. 取得每日經文（使用上面的 API）
2. 「製作圖片」
   - 背景: 選擇你喜歡的顏色或圖片
   - 文字: {verseRef}\n\n{verseText}
   - 字體大小: 24
   - 文字顏色: 白色
   - 對齊: 置中

3. 「儲存到相簿」
   - 相簿: 每日經文

4. 「設定鎖定畫面」
   - 選擇剛才保存的圖片
```

### Mac 設置步驟

#### 1. 創建 Shortcut（與 iOS 類似）

1. 打開「捷徑」App（macOS Monterey+）
2. 創建新捷徑，添加以下動作：

```
1. 「取得網頁內容」
   - URL: https://your-domain.com/api/daily-verse
   - 方法: GET

2. 「從輸入取得 JSON」
   - 鍵: formatted

3. 「顯示通知」
   - 標題: 今日經文
   - 內容: (JSON 的 formatted 欄位)
```

#### 2. 設置桌面顯示

**選項 A：使用桌面 Widget（macOS Sonoma+）**

1. 右鍵點擊桌面 → 「編輯 Widget」
2. 添加「文字」Widget
3. 創建一個 Shortcut 更新 Widget 內容

**選項 B：使用桌面圖片**

創建一個 Shortcut 生成帶有經文的桌面圖片：

```
1. 取得每日經文
2. 「製作圖片」
   - 尺寸: 你的螢幕解析度
   - 背景: 深色或圖片
   - 文字: {formatted}
   - 字體: 大號
   - 位置: 置中

3. 「設定桌面圖片」
   - 選擇生成的圖片
```

#### 3. 設置自動化

1. 打開「系統設定」→ 「隱私權與安全性」→ 「自動化」
2. 創建新的自動化：
   - 觸發: 每天特定時間（如 00:01）
   - 動作: 運行 Shortcut

---

## 方法二：使用 Widget（更簡單，但需要開發）

### iOS Widget

需要創建一個 iOS Widget Extension：

1. 在 Xcode 中創建 Widget Extension
2. 使用 WidgetKit 顯示經文
3. 定期從 API 獲取數據

### Mac Widget

macOS Sonoma+ 支持桌面 Widget，可以創建類似的 Widget。

---

## 方法三：使用第三方 App

### 推薦 App：

1. **Scriptable** (iOS)
   - 可以運行 JavaScript 腳本
   - 支持 Widget
   - 可以從 API 獲取並顯示經文

2. **Widgetsmith** (iOS)
   - 自定義 Widget
   - 可以顯示文字內容

---

## API 端點說明

### 端點

```
GET /api/daily-verse
```

### 參數

- `date` (可選): 日期格式 YYYY-MM-DD，預設為今天
- `version` (可選): 聖經版本，預設為 "unv"（和合本）
- `simplified` (可選): 是否簡體中文，預設為 false

### 範例請求

```bash
# 獲取今天的經文
curl https://your-domain.com/api/daily-verse

# 獲取特定日期的經文
curl https://your-domain.com/api/daily-verse?date=2024-01-01

# 獲取簡體中文版本
curl https://your-domain.com/api/daily-verse?simplified=1
```

### 回應格式

```json
{
  "date": "2024-01-01",
  "dayOfYear": 1,
  "reference": "約翰福音 3:16",
  "referenceEng": "John 3:16",
  "text": "神愛世人，甚至將他的獨生子賜給他們，叫一切信他的，不至滅亡，反得永生。",
  "version": "unv",
  "formatted": "約翰福音 3:16\n\n神愛世人，甚至將他的獨生子賜給他們，叫一切信他的，不至滅亡，反得永生。",
  "formattedEng": "John 3:16\n\nFor God so loved the world..."
}
```

---

## 快速開始（最簡單的方法）

### iOS 鎖定畫面

1. 複製以下 Shortcut URL（需要先部署 API）：
   ```
   https://www.icloud.com/shortcuts/YOUR_SHORTCUT_ID
   ```

2. 在 Safari 中打開，添加到捷徑

3. 設置自動化每天運行

### Mac 桌面

1. 創建 Shortcut 生成桌面圖片
2. 設置每天自動運行
3. 自動更新桌面圖片

---

## 注意事項

1. **API 部署**: 需要先部署你的 Next.js 應用，確保 API 端點可訪問
2. **網路連接**: Shortcuts 需要網路連接才能獲取經文
3. **自動化權限**: 確保給予 Shortcuts 必要的權限（通知、照片、鎖定畫面等）
4. **電池**: 自動化可能會影響電池續航，建議設置在充電時運行

---

## 進階自定義

### 自定義經文列表

編輯 `/app/api/daily-verse/route.ts` 中的 `dailyVerses` 數組，添加你喜歡的經文。

### 自定義格式

修改 API 回應中的 `formatted` 欄位格式，例如添加日期、主題等。

### 添加圖片背景

可以在 Shortcut 中使用「製作圖片」動作，添加背景圖片或漸層。

---

## 故障排除

### Shortcut 無法運行

- 檢查網路連接
- 確認 API URL 正確
- 檢查 JSON 解析是否正確

### 鎖定畫面不更新

- 確認 Shortcut 有「設定鎖定畫面」權限
- 檢查自動化是否正確設置
- 嘗試手動運行 Shortcut

### Mac 桌面不更新

- 確認 Shortcut 有「設定桌面圖片」權限
- 檢查自動化設置
- 確認圖片格式正確

---

## 支援

如有問題，請檢查：
1. API 端點是否正常運行
2. Shortcut 動作順序是否正確
3. 自動化設置是否正確
