# Bible Query Detection Test Cases

## 测试用例

### ✅ 应该被检测为搜索查询的关键字

1. **单字查询**
   - `愛` → type: "search", keyword: "愛"
   - `福音` → type: "search", keyword: "福音"
   - `信心` → type: "search", keyword: "信心"
   - `禱告` → type: "search", keyword: "禱告"

2. **带空格的查询**
   - `什麼是愛` → type: "search", keyword: "什麼是愛"
   - `聖經關於愛` → type: "search", keyword: "聖經關於愛"
   - `福音是什麼` → type: "search", keyword: "福音是什麼"

3. **英文关键字**
   - `love` → type: "search", keyword: "love"
   - `gospel` → type: "search", keyword: "gospel"
   - `faith` → type: "search", keyword: "faith"

### ✅ 应该被检测为经文查询

1. **完整经文引用**
   - `約翰福音 3:16` → type: "verse", book: "約翰福音", chapter: 3, verse: "16"
   - `John 3:16` → type: "verse", book: "John", chapter: 3, verse: "16"
   - `創世記 1:1` → type: "verse", book: "創世記", chapter: 1, verse: "1"

2. **章节查询**
   - `約翰福音 3` → type: "chapter", book: "約翰福音", chapter: 3
   - `創世記 1` → type: "chapter", book: "創世記", chapter: 1

### ✅ 应该被检测为搜索查询（带搜索动词）

1. **中文搜索格式**
   - `搜尋 愛` → type: "search", keyword: "愛"
   - `查找 福音` → type: "search", keyword: "福音"
   - `查詢 信心` → type: "search", keyword: "信心"
   - `聖經關於 愛` → type: "search", keyword: "愛"

2. **英文搜索格式**
   - `search for love` → type: "search", keyword: "love"
   - `what does the bible say about faith` → type: "search", keyword: "faith"

### ❌ 不应该被检测为 Bible 查询

1. **普通对话**
   - `你好` → type: null
   - `今天天氣很好` → type: null
   - `幫我寫程式碼` → type: null

2. **长文本（>200字符）**
   - 长篇文章 → type: null

## 支持的 Bible 主题关键字

### 爱和关系
- 愛, love, 愛人, 愛神, 愛心, 慈愛, 仁愛

### 信心和救恩
- 信心, faith, 信, 救恩, salvation, 拯救

### 福音和传道
- 福音, gospel, 傳福音, evangelism

### 祷告和敬拜
- 禱告, prayer, 祈禱, 敬拜, worship

### 罪和赦免
- 罪, sin, 赦免, forgiveness, 饒恕

### 恩典和怜悯
- 恩典, grace, 憐憫, mercy

### 希望和平安
- 希望, hope, 盼望, 平安, peace

### 神和耶稣
- 神, god, 上帝, 耶穌, jesus, 基督, christ

### 圣灵
- 聖靈, holy spirit, spirit

### 其他常见主题
- 真理, truth, 生命, life, 死亡, death
- 復活, resurrection, 天國, kingdom, 天堂, heaven
- 地獄, hell, 審判, judgment, 審判日
