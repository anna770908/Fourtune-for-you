# App.tsx コード解説（初心者向け）

このファイルは、**占いアプリのメイン部分**です。名前と生年月日を入力すると、運勢を表示します。

---

## 📚 目次

1. [全体の流れ](#全体の流れ)
2. [1行目〜3行目：必要なものを読み込む](#1行目3行目必要なものを読み込む)
3. [4行目〜41行目：データの「型」を定義する](#4行目41行目データの型を定義する)
4. [43行目〜73行目：定数データ（変えない情報）](#43行目73行目定数データ変えない情報)
5. [75行目〜177行目：占いのデータベース](#75行目177行目占いのデータベース)
6. [179行目〜237行目：計算する関数たち](#179行目237行目計算する関数たち)
7. [239行目〜357行目：占い結果を作る関数](#239行目357行目占い結果を作る関数)
8. [359行目〜559行目：画面を表示する部分](#359行目559行目画面を表示する部分)

---

## 全体の流れ

このアプリは、以下の順番で動きます：

1. **ユーザーが入力** → 名前と生年月日を入力
2. **計算する** → 入力から星座・数秘・名前エネルギーを計算
3. **結果を表示** → 占い結果を画面に表示

---

## 1行目〜3行目：必要なものを読み込む

```typescript
import { useMemo, useState } from 'react'
import './App.css'
```

### 説明

- **`import`** = 他のファイルやライブラリから機能を持ってくる
- **`useMemo`** = 計算結果を覚えておく（同じ計算を何度もやらないようにする）
- **`useState`** = 入力欄の値などを「状態」として覚えておく
- **`'./App.css'`** = 同じフォルダにある `App.css`（スタイル）を読み込む

**例え話**：料理をする前に、冷蔵庫から材料を取り出すようなものです。

---

## 4行目〜41行目：データの「型」を定義する

TypeScriptでは、**「この変数にはどんな種類のデータが入るか」**を事前に決めます。これを「型定義」といいます。

### 4行目：期間の型

```typescript
type Period = 'today' | 'tomorrow' | 'thisYear' | 'nextYear'
```

- `Period` という型は、`'today'`（今日）、`'tomorrow'`（明日）、`'thisYear'`（今年）、`'nextYear'`（来年）の**4つだけ**を許す
- これ以外の文字列を入れるとエラーになる（間違いを防げる）

### 6行目：運勢レベルの型

```typescript
type FortuneLevel = '大吉' | '吉' | '中吉' | '小吉' | '凶'
```

- 運勢は「大吉」「吉」「中吉」「小吉」「凶」の**5種類だけ**

### 8行目〜13行目：運勢オブジェクトの型

```typescript
type Fortune = {
  level: FortuneLevel
  message: string
  color: string
  keyword: string
}
```

- `Fortune` は、以下の4つの情報を持つ「オブジェクト」の型
  - `level`：運勢レベル（上で定義した `FortuneLevel`）
  - `message`：メッセージ（文字列）
  - `color`：色（文字列、例：`'#f97373'`）
  - `keyword`：キーワード（文字列）

**例え話**：「運勢カード」の設計図のようなものです。カードには「レベル」「メッセージ」「色」「キーワード」が書かれている、と決めています。

### 15行目〜27行目：星座の型

```typescript
type ZodiacSign =
  | '牡羊座'
  | '牡牛座'
  | '双子座'
  // ... 全部で12個
```

- 12星座の名前だけを許す型

### 29行目〜41行目：占い結果全体の型

```typescript
type FortuneResult = {
  level: FortuneLevel
  message: string
  color: string
  keyword: string
  zodiac: ZodiacSign
  zodiacKeyword: string
  periodLabel: string
  lifePathNumber: number | null
  lifePathKeyword: string
  nameEnergyNumber: number | null
  nameEnergyKeyword: string
}
```

- 最終的に表示する占い結果の型
- `number | null` = 数字か、何もない（null）かのどちらか

---

## 43行目〜73行目：定数データ（変えない情報）

### 43行目〜48行目：期間の日本語ラベル

```typescript
const periodLabelMap: Record<Period, string> = {
  today: '今日',
  tomorrow: '明日',
  thisYear: '今年',
  nextYear: '来年',
}
```

- `Record<Period, string>` = 「期間（Period）をキーにして、文字列（string）を値にする」辞書型
- 例：`periodLabelMap['today']` を参照すると `'今日'` が返る

### 50行目〜55行目：期間選択ボタンのデータ

```typescript
const periodOptions: { value: Period; label: string; subtitle: string }[] = [
  { value: 'today', label: '今日', subtitle: 'いま、この瞬間の流れ' },
  // ...
]
```

- 画面に表示する期間ボタンの情報を配列で定義
- 各要素は `value`（内部で使う値）、`label`（表示名）、`subtitle`（サブタイトル）を持つ

### 57行目〜73行目：星座の性質データ

```typescript
const zodiacTraits: Record<
  ZodiacSign,
  { element: '火' | '地' | '風' | '水'; keyword: string }
> = {
  牡羊座: { element: '火', keyword: 'はじまり・直感' },
  牡牛座: { element: '地', keyword: '安心・豊かさ' },
  // ...
}
```

- 各星座に「四元素（火・地・風・水）」と「キーワード」を割り当てた辞書
- 例：`zodiacTraits['牡羊座']` を参照すると `{ element: '火', keyword: 'はじまり・直感' }` が返る

---

## 75行目〜177行目：占いのデータベース

### 75行目〜125行目：ライフパスナンバーの性質

```typescript
const lifePathTraits: Record<
  number,
  { keyword: string; message: string }
> = {
  1: {
    keyword: 'はじまり・リーダー気質',
    message: '自ら決めて一歩踏み出すことで運が開ける数字です。...',
  },
  // 2〜9も同様
}
```

- 数秘術のライフパスナンバー（1〜9）ごとに、キーワードとメッセージを定義
- 例：ライフパスが `1` なら、`lifePathTraits[1]` でその性質を取得できる

### 128行目〜177行目：名前のエネルギー番号の性質

```typescript
const nameEnergyTraits: Record<
  number,
  { keyword: string; message: string }
> = {
  1: {
    keyword: '切り開く力',
    message: '自分の意志を通す場面で強さが出やすい名前です。...',
  },
  // 2〜9も同様
}
```

- 名前から算出したエネルギー番号（1〜9）ごとに、キーワードとメッセージを定義

---

## 179行目〜237行目：計算する関数たち

### 179行目〜190行目：数字根を計算する関数

```typescript
const calcDigitRoot = (value: number): number => {
  let n = Math.abs(value)
  while (n > 9) {
    let sum = 0
    const digits = String(n)
    for (let i = 0; i < digits.length; i += 1) {
      sum += Number(digits[i])
    }
    n = sum
  }
  return n === 0 ? 1 : n
}
```

**何をする関数か**：
- 数字を1桁になるまで足し続ける（例：`123` → `1+2+3=6`、`56` → `5+6=11` → `1+1=2`）

**詳しい説明**：
1. `Math.abs(value)` = 負の数なら正の数に変換（例：`-5` → `5`）
2. `while (n > 9)` = `n` が9より大きい間、繰り返す
3. `String(n)` = 数字を文字列に変換（例：`123` → `"123"`）
4. `digits[i]` = 文字列の `i` 番目の文字を取得（例：`"123"[0]` = `"1"`）
5. `Number(digits[i])` = 文字を数字に変換（例：`"1"` → `1`）
6. 各桁を足し合わせる
7. 結果が1桁になるまで繰り返す

**例**：
- 入力：`123` → `1+2+3=6` → 返り値：`6`
- 入力：`56` → `5+6=11` → `1+1=2` → 返り値：`2`

### 193行目〜202行目：ライフパスナンバーを算出

```typescript
const getLifePathNumber = (birthday: string): number | null => {
  if (!birthday) return null
  const digits = birthday.replace(/[^0-9]/g, '')
  if (!digits) return null
  const total = digits
    .split('')
    .map((d) => Number(d))
    .reduce((acc, cur) => acc + cur, 0)
  return calcDigitRoot(total)
}
```

**何をする関数か**：
- 生年月日（例：`"1995-09-08"`）から、ライフパスナンバー（1〜9）を計算する

**詳しい説明**：
1. `if (!birthday) return null` = 生年月日が空なら `null` を返す
2. `birthday.replace(/[^0-9]/g, '')` = 数字以外の文字を削除（例：`"1995-09-08"` → `"19950908"`）
3. `digits.split('')` = 文字列を1文字ずつに分割（例：`"19950908"` → `["1","9","9","5","0","9","0","8"]`）
4. `.map((d) => Number(d))` = 各文字を数字に変換（例：`["1","9",...]` → `[1,9,9,5,0,9,0,8]`）
5. `.reduce((acc, cur) => acc + cur, 0)` = 全部足し合わせる（例：`1+9+9+5+0+9+0+8=41`）
6. `calcDigitRoot(41)` = `4+1=5` → 返り値：`5`

**例**：
- 入力：`"1995-09-08"` → `1+9+9+5+0+9+0+8=41` → `4+1=5` → 返り値：`5`

### 206行目〜214行目：名前のエネルギー番号を算出

```typescript
const getNameEnergyNumber = (name: string): number | null => {
  const trimmed = name.trim()
  if (!trimmed) return null
  let total = 0
  for (let i = 0; i < trimmed.length; i += 1) {
    total += trimmed.charCodeAt(i)
  }
  return calcDigitRoot(total)
}
```

**何をする関数か**：
- 名前の各文字を数値化して合計し、数字根を計算する（簡易的な「画数エネルギー」）

**詳しい説明**：
1. `name.trim()` = 前後の空白を削除（例：`"  山田  "` → `"山田"`）
2. `trimmed.charCodeAt(i)` = `i` 番目の文字の文字コード（Unicode）を取得
   - 例：`"山".charCodeAt(0)` = `23665`（「山」の文字コード）
3. 全部足し合わせる
4. `calcDigitRoot(total)` で1桁にする

**例**：
- 入力：`"山田"` → `"山"` のコード + `"田"` のコード = 大きな数字 → 数字根を計算 → 返り値：`1〜9` のいずれか

### 216行目〜237行目：生年月日から星座を算出

```typescript
const getZodiacFromBirthday = (birthday: string): ZodiacSign | null => {
  if (!birthday) return null
  const date = new Date(birthday)
  const month = date.getMonth() + 1
  const day = date.getDate()

  // 西洋12星座（日本で一般的な区切り）に基づく
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return '牡羊座'
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return '牡牛座'
  // ... 全部で12個の条件分岐
}
```

**何をする関数か**：
- 生年月日から、12星座のどれかを判定する

**詳しい説明**：
1. `new Date(birthday)` = 文字列を日付オブジェクトに変換（例：`"1995-09-08"` → 日付オブジェクト）
2. `date.getMonth() + 1` = 月を取得（0始まりなので +1、例：8月なら `8`）
3. `date.getDate()` = 日を取得（例：8日なら `8`）
4. 月と日の組み合わせで星座を判定
   - 例：3月21日〜4月19日 → `'牡羊座'`
   - 例：9月8日 → `'乙女座'`（8月23日〜9月22日の範囲）

**例**：
- 入力：`"1995-09-08"` → 9月8日 → 返り値：`'乙女座'`

---

## 239行目〜357行目：占い結果を作る関数

### 239行目〜251行目：入力からシード（種）を作る

```typescript
const createSeedFromInput = (
  name: string,
  birthday: string,
  period: Period,
): number => {
  const base = `${name.trim()}|${birthday}|${period}`
  let hash = 0
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 31 + base.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(hash)
}
```

**何をする関数か**：
- 名前・生年月日・期間を組み合わせて、**毎回同じ結果になる数値**（シード）を作る

**詳しい説明**：
1. `${name.trim()}|${birthday}|${period}` = 文字列を結合（例：`"山田|1995-09-08|today"`）
2. ハッシュ関数で数値化（簡単なハッシュアルゴリズム）
   - `hash * 31 + base.charCodeAt(i)` = 各文字のコードを加算しながら31倍していく
   - `& 0xffffffff` = 32ビット整数に制限（オーバーフロー防止）
3. `Math.abs(hash)` = 負の数なら正の数に変換

**なぜ必要か**：
- 同じ名前・生年月日・期間なら、**必ず同じ占い結果**になるようにするため

### 253行目〜284行目：基本運勢テーブル

```typescript
const fortuneTable: Fortune[] = [
  {
    level: '大吉',
    keyword: 'はじまり',
    color: '#f97373',
    message: '新しいことを始めるのにぴったりな一日。...',
  },
  // 全部で5種類
]
```

- 5種類の基本運勢を配列で定義
- 後で、シードからこの配列のインデックスを選んで使う

### 286行目〜357行目：占い結果を組み立てる関数

```typescript
const pickFortune = (
  name: string,
  birthday: string,
  period: Period,
): FortuneResult | null => {
  // 1. 入力チェック
  if (!name.trim() || !birthday) return null

  // 2. 星座を取得
  const zodiac = getZodiacFromBirthday(birthday)
  if (!zodiac) return null

  // 3. シードを作って、基本運勢を選ぶ
  const seed = createSeedFromInput(name, birthday, period)
  const index = seed % fortuneTable.length
  const base = fortuneTable[index]

  // 4. 星座の性質を取得
  const trait = zodiacTraits[zodiac]
  const periodLabel = periodLabelMap[period]

  // 5. ライフパスと名前エネルギーを計算
  const lifePathNumber = getLifePathNumber(birthday)
  const nameEnergyNumber = getNameEnergyNumber(name)

  // 6. それぞれの性質データを取得
  const lifeTrait =
    (lifePathNumber && lifePathTraits[lifePathNumber]) || lifePathTraits[5]
  const nameTrait =
    (nameEnergyNumber && nameEnergyTraits[nameEnergyNumber]) ||
    nameEnergyTraits[5]

  // 7. キーワードを組み合わせ
  const combinedKeyword = `${base.keyword} × ${trait.keyword} × ${lifeTrait.keyword}`

  // 8. 「今年」の前半（1〜5月）かどうかを判定
  const now = new Date()
  const month = now.getMonth() + 1
  const isEarlyYear = period === 'thisYear' && month >= 1 && month <= 5

  // 9. 前半なら補正メッセージを追加
  const earlyYearMessage = isEarlyYear
    ? '特に1〜5月ごろまでは、無理にスピードを上げるよりも...'
    : ''

  // 10. 前半なら運勢レベルを少し下げる
  let adjustedLevel = base.level
  if (isEarlyYear) {
    if (adjustedLevel === '大吉') {
      adjustedLevel = '中吉'
    } else if (adjustedLevel === '吉') {
      adjustedLevel = '小吉'
    }
  }

  // 11. 最終メッセージを組み立て
  const message = [
    `${periodLabel}の${zodiac}のあなたは、「${trait.keyword}」の流れが少し強まりやすいタイミングです。`,
    `生年月日からみたライフパスナンバーは「${lifePathNumber ?? '―'}」。${lifeTrait.message}`,
    `お名前の画数エネルギー番号は「${nameEnergyNumber ?? '―'}」。${nameTrait.message}`,
    earlyYearMessage,
    base.message,
  ].join(' ')

  // 12. 結果オブジェクトを返す
  return {
    level: adjustedLevel,
    color: base.color,
    keyword: combinedKeyword,
    message,
    zodiac,
    zodiacKeyword: trait.keyword,
    periodLabel,
    lifePathNumber: lifePathNumber ?? null,
    lifePathKeyword: lifeTrait.keyword,
    nameEnergyNumber: nameEnergyNumber ?? null,
    nameEnergyKeyword: nameTrait.keyword,
  }
}
```

**何をする関数か**：
- 名前・生年月日・期間から、**完全な占い結果オブジェクト**を作る

**詳しい説明**：

1. **入力チェック**：名前や生年月日が空なら `null` を返す
2. **星座を取得**：`getZodiacFromBirthday` で星座を計算
3. **基本運勢を選ぶ**：
   - `seed % fortuneTable.length` = シードを5で割った余り（0〜4）で、5種類の運勢から1つ選ぶ
   - 例：`seed = 123` → `123 % 5 = 3` → `fortuneTable[3]` を選ぶ
4. **各種データを取得**：星座の性質、期間ラベル、ライフパス、名前エネルギーを計算
5. **キーワードを組み合わせ**：例：`"はじまり × 整える力・誠実さ × はじまり・リーダー気質"`
6. **今年の前半かどうかを判定**：現在の月が1〜5月で、期間が「今年」なら `true`
7. **補正を加える**：前半なら運勢レベルを下げ、補正メッセージを追加
8. **メッセージを組み立て**：複数の文章を `join(' ')` で結合
9. **結果オブジェクトを返す**：すべての情報を含む `FortuneResult` を返す

---

## 359行目〜559行目：画面を表示する部分

### 359行目〜365行目：状態（state）を定義

```typescript
function App() {
  const [name, setName] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [period, setPeriod] = useState<Period>('today')
  const [touched, setTouched] = useState(false)
```

**説明**：
- `useState` = Reactの「状態管理」機能
- `[name, setName]` = `name`（現在の値）と `setName`（値を変更する関数）のペア
- 初期値は空文字列（`''`）や `false`

**例**：
- `name = "山田"` → `setName("花子")` を呼ぶと → `name` が `"花子"` に変わる
- 値が変わると、Reactが自動的に画面を再描画する

### 367行目〜372行目：生年月日を1つの文字列にまとめる

```typescript
const birthday = useMemo(() => {
  if (!birthYear || !birthMonth || !birthDay) return ''
  const mm = birthMonth.toString().padStart(2, '0')
  const dd = birthDay.toString().padStart(2, '0')
  return `${birthYear}-${mm}-${dd}`
}, [birthYear, birthMonth, birthDay])
```

**説明**：
- `useMemo` = 計算結果を覚えておく（`birthYear`、`birthMonth`、`birthDay` が変わったときだけ再計算）
- `padStart(2, '0')` = 2桁になるまで前に `'0'` を追加（例：`"9"` → `"09"`）
- 例：`birthYear="1995"`, `birthMonth="9"`, `birthDay="8"` → `"1995-09-08"`

### 374行目〜377行目：占い結果を計算

```typescript
const fortune = useMemo(
  () => pickFortune(name, birthday, period),
  [name, birthday, period],
)
```

**説明**：
- `name`、`birthday`、`period` が変わったときだけ、`pickFortune` を実行して占い結果を再計算
- 結果は `fortune` に保存される（`null` の可能性もある）

### 379行目〜384行目：フォーム送信時の処理

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  setTouched(true)
}

const showResult = touched && fortune
```

**説明**：
- `e.preventDefault()` = フォームのデフォルト動作（ページリロード）をキャンセル
- `setTouched(true)` = 「送信ボタンを押した」という状態にする
- `showResult` = `touched` が `true` で、かつ `fortune` が存在するときだけ `true`

### 386行目〜559行目：JSX（画面の構造）

```typescript
return (
  <div className="app-root">
    <div className="app-gradient" />
    <main className="app-shell">
      {/* ... */}
    </main>
  </div>
)
```

**説明**：
- `return` = この関数が返す値（画面の構造）
- JSX = HTMLに似た構文で、Reactコンポーネントを書く
- `className` = HTMLの `class` 属性（Reactでは `className` を使う）

#### 390行目〜402行目：ヘッダー部分

```typescript
<header className="app-header">
  <p className="app-badge">FORTUNE for YOU</p>
  <h1 className="app-title">
    あなただけの
    <span className="app-title-emphasis"> 星座ベース占い </span>
  </h1>
  <p className="app-subtitle">
    生年月日から西洋12星座の性質をベースに、...
  </p>
</header>
```

- タイトルと説明文を表示

#### 405行目〜513行目：フォーム部分

```typescript
<form className="fortune-form" onSubmit={handleSubmit}>
  {/* 期間選択ボタン */}
  <div className="period-section">
    <span className="period-section-label">みる期間</span>
    <div className="period-toggle">
      {periodOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`period-pill${period === option.value ? ' is-active' : ''}`}
          onClick={() => setPeriod(option.value)}
        >
          <span className="period-pill-label">{option.label}</span>
          <span className="period-pill-subtitle">{option.subtitle}</span>
        </button>
      ))}
    </div>
  </div>

  {/* 名前入力 */}
  <div className="form-row">
    <label className="form-field">
      <span className="form-label">お名前</span>
      <input
        type="text"
        placeholder="例）山田 花子"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="form-input"
      />
    </label>
  </div>

  {/* 生年月日選択 */}
  <div className="form-row">
    <label className="form-field">
      <span className="form-label">生年月日</span>
      <div className="birthday-row">
        {/* 年 */}
        <div className="birthday-segment">
          <select
            className="form-select"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
          >
            <option value="" disabled>西暦</option>
            {Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - 10 - i).map((year) => (
              <option key={year} value={year}>{year}年</option>
            ))}
          </select>
        </div>
        {/* 月・日も同様 */}
      </div>
    </label>
  </div>

  {/* 送信ボタン */}
  <button
    type="submit"
    className="fortune-button"
    disabled={!name.trim() || !birthday}
  >
    今の運勢をみる
  </button>
</form>
```

**詳しい説明**：

1. **期間選択ボタン**：
   - `periodOptions.map(...)` = 配列の各要素をボタンに変換
   - `onClick={() => setPeriod(option.value)}` = クリックで期間を変更
   - `period === option.value ? ' is-active' : ''` = 選択中なら `is-active` クラスを追加

2. **名前入力**：
   - `value={name}` = 入力欄の値は `name` 状態と連動
   - `onChange={(e) => setName(e.target.value)}` = 入力が変わるたびに `name` を更新

3. **生年月日選択**：
   - `Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - 10 - i)` = 現在の年から10年前まで、70年分の年の配列を作る
   - `.map((year) => ...)` = 各年を `<option>` タグに変換

4. **送信ボタン**：
   - `disabled={!name.trim() || !birthday}` = 名前が空、または生年月日が未入力なら無効化

#### 515行目〜548行目：結果表示部分

```typescript
<section className="fortune-panel">
  {showResult ? (
    <div className="fortune-card">
      <p className="fortune-name">
        {name} さんの{fortune.periodLabel}の運勢
      </p>
      <p className="fortune-level" style={{ color: fortune.color }}>
        {fortune.level}
      </p>
      <p className="fortune-keyword">Keyword：{fortune.keyword}</p>
      {/* ... その他の情報 */}
    </div>
  ) : (
    <div className="fortune-placeholder">
      <p>まだ結果はひみつです。</p>
      <p>お名前と生年月日を入力して、「今の運勢をみる」を押してください。</p>
    </div>
  )}
</section>
```

**説明**：
- `{showResult ? ... : ...}` = 三項演算子（条件分岐）
  - `showResult` が `true` なら結果カードを表示
  - `false` ならプレースホルダーを表示
- `{name}` = JSX内で変数を表示（例：`name = "山田"` なら画面に「山田」と表示）
- `style={{ color: fortune.color }}` = インラインスタイルで色を指定

---

## まとめ

このコードは、以下の流れで動いています：

1. **ユーザーが入力** → `useState` で状態を更新
2. **計算** → `useMemo` で占い結果を計算
3. **表示** → JSXで画面に表示

**重要なポイント**：
- **型定義** = データの種類を事前に決める（TypeScriptの強み）
- **状態管理** = `useState` で入力値を覚えておく
- **再計算の最適化** = `useMemo` で無駄な計算を避ける
- **JSX** = HTMLに似た構文で画面を書く

初心者の方は、まず「状態（state）が変わる → 画面が再描画される」という流れを理解すると、Reactの全体像が見えてきます！




