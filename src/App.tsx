import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Period = 'today' | 'tomorrow' | 'thisYear' | 'nextYear'

type FortuneLevel = '大吉' | '吉' | '中吉' | '小吉' | '凶'

type Fortune = {
  level: FortuneLevel
  message: string
  color: string
  keyword: string
}

type ZodiacSign =
  | '牡羊座'
  | '牡牛座'
  | '双子座'
  | '蟹座'
  | '獅子座'
  | '乙女座'
  | '天秤座'
  | '蠍座'
  | '射手座'
  | '山羊座'
  | '水瓶座'
  | '魚座'

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

const periodLabelMap: Record<Period, string> = {
  today: '今日',
  tomorrow: '明日',
  thisYear: '今年',
  nextYear: '来年',
}

const periodOptions: { value: Period; label: string; subtitle: string }[] = [
  { value: 'today', label: '今日', subtitle: 'いま、この瞬間の流れ' },
  { value: 'tomorrow', label: '明日', subtitle: '一歩先のヒント' },
  { value: 'thisYear', label: '今年', subtitle: '1年を通したテーマ' },
  { value: 'nextYear', label: '来年', subtitle: '次のステージの予感' },
]

const zodiacTraits: Record<
  ZodiacSign,
  { element: '火' | '地' | '風' | '水'; keyword: string }
> = {
  牡羊座: { element: '火', keyword: 'はじまり・直感' },
  牡牛座: { element: '地', keyword: '安心・豊かさ' },
  双子座: { element: '風', keyword: '会話・好奇心' },
  蟹座: { element: '水', keyword: '共感・ぬくもり' },
  獅子座: { element: '火', keyword: '自己表現・情熱' },
  乙女座: { element: '地', keyword: '整える力・誠実さ' },
  天秤座: { element: '風', keyword: '調和・バランス' },
  蠍座: { element: '水', keyword: '深いつながり・集中' },
  射手座: { element: '火', keyword: '冒険・学び' },
  山羊座: { element: '地', keyword: '目標・責任感' },
  水瓶座: { element: '風', keyword: 'ひらめき・自由' },
  魚座: { element: '水', keyword: 'やさしさ・想像力' },
}

// 数秘術のライフパスナンバー（1〜9）ごとの簡易的な性質
const lifePathTraits: Record<
  number,
  { keyword: string; message: string }
> = {
  1: {
    keyword: 'はじまり・リーダー気質',
    message:
      '自ら決めて一歩踏み出すことで運が開ける数字です。迷うよりも、まずは小さく動いてみることが鍵になります。',
  },
  2: {
    keyword: '調和・サポート',
    message:
      '人との関わりの中で力を発揮する数字です。ひとりで抱え込まず、信頼できる人と気持ちを分かち合うことで流れが整います。',
  },
  3: {
    keyword: '表現・楽しさ',
    message:
      'アイデアや感性を外に出すほど運が巡りやすい数字です。好きなこと・楽しいことを遠慮せず取り入れてみましょう。',
  },
  4: {
    keyword: '安定・基盤づくり',
    message:
      '土台を固めることに向いた数字です。生活リズムや環境を整えるほど、安心して次のステップに進めるタイミングになります。',
  },
  5: {
    keyword: '変化・自由',
    message:
      '環境の変化や新しい出会いを通じて成長する数字です。同じ場所にとどまるよりも、小さな冒険を受け入れてみると良さそうです。',
  },
  6: {
    keyword: '愛情・ケア',
    message:
      '身近な人や自分自身を大切にすると運が整う数字です。完璧でなくてよいので、「ほどよい優しさ」を意識してみてください。',
  },
  7: {
    keyword: '探求・内省',
    message:
      'ひとりの時間の中で答えを見つけやすい数字です。情報を追いかけすぎず、静かな時間に自分の本音を聞いてみましょう。',
  },
  8: {
    keyword: '結果・達成',
    message:
      'これまでの行動が現実の形になりやすい数字です。数字や成果を意識しつつも、長期的なバランスも忘れずに進めていきましょう。',
  },
  9: {
    keyword: '完了・手放し',
    message:
      '一区切りつけることで新しい流れが入りやすい数字です。抱えすぎているものがあれば、「いま手放せるものはどれか」を見直してみてください。',
  },
}

// 名前から簡易的な「画数エネルギー番号」を出す（実際の辞書画数とは異なるモデル）
const nameEnergyTraits: Record<
  number,
  { keyword: string; message: string }
> = {
  1: {
    keyword: '切り開く力',
    message:
      '自分の意志を通す場面で強さが出やすい名前です。遠慮しすぎず、必要な場面でははっきり伝えることが吉となります。',
  },
  2: {
    keyword: '受けとめる力',
    message:
      '相手の気持ちを汲み取る感性を持つ名前です。ただし抱え込みすぎには注意。境界線を引く意識も大切になります。',
  },
  3: {
    keyword: '華やかさ',
    message:
      '場の空気を明るくする性質を帯びた名前です。少しだけ自分を表に出すことで、良縁を引き寄せやすくなります。',
  },
  4: {
    keyword: '粘り強さ',
    message:
      'コツコツ継続する力が宿りやすい名前です。すぐに結果を求めすぎず、小さな積み重ねを大事にすると安定していきます。',
  },
  5: {
    keyword: '柔軟さ',
    message:
      '変化にしなやかに対応できる名前です。予定通りにいかないときこそ、「別の選択肢もあり」と視野を広げてみてください。',
  },
  6: {
    keyword: '面倒見の良さ',
    message:
      '人のために動くことで運を受け取りやすい名前です。ただし自己犠牲にならないよう、自分のケアも同じくらい大切に。',
  },
  7: {
    keyword: '洞察力',
    message:
      '物事の本質を見抜こうとする力が宿る名前です。ひとり静かに考える時間を確保すると、直感が冴えやすくなります。',
  },
  8: {
    keyword: '現実を動かす力',
    message:
      '行動力と成果を結びつけやすい名前です。具体的な目標や数字を決めることで、運の流れが読みやすくなります。',
  },
  9: {
    keyword: '包み込む力',
    message:
      '広い受容性を持つ名前です。人や状況を丸ごと受けとめやすい一方で、自分の限界もきちんと知っておくと、心が軽くなります。',
  },
}

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

// 生年月日（YYYY-MM-DD）からライフパスナンバーを算出する簡易モデル
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

// 名前の「画数エネルギー番号」を算出する簡易モデル
// 実際の漢字の画数ではなく、文字コードをもとにしたエネルギーのイメージ値です。
const getNameEnergyNumber = (name: string): number | null => {
  const trimmed = name.trim()
  if (!trimmed) return null
  let total = 0
  for (let i = 0; i < trimmed.length; i += 1) {
    total += trimmed.charCodeAt(i)
  }
  return calcDigitRoot(total)
}

const getZodiacFromBirthday = (birthday: string): ZodiacSign | null => {
  if (!birthday) return null
  const date = new Date(birthday)
  const month = date.getMonth() + 1
  const day = date.getDate()

  // 西洋12星座（日本で一般的な区切り）に基づく
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return '牡羊座'
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return '牡牛座'
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return '双子座'
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return '蟹座'
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return '獅子座'
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return '乙女座'
  if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return '天秤座'
  if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return '蠍座'
  if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return '射手座'
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return '山羊座'
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return '水瓶座'
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return '魚座'

  return null
}

// 生年月日と名前と期間から、毎回同じ結果が出るように数値化
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

const fortuneTable: Fortune[] = [
  {
    level: '大吉',
    keyword: 'はじまり',
    color: '#f97373',
    message: '新しいことを始めるのにぴったりな一日。小さな一歩が、思わぬチャンスにつながりそう。',
  },
  {
    level: '吉',
    keyword: '調和',
    color: '#fb923c',
    message: 'あなたの優しさが周りにひろがる日。人とのつながりを大切にすると、運気がふんわり上昇。',
  },
  {
    level: '中吉',
    keyword: '集中',
    color: '#22c55e',
    message: 'やるべきことに静かに集中できそう。丁寧に積み重ねた時間が、自信を育ててくれます。',
  },
  {
    level: '小吉',
    keyword: '余白',
    color: '#38bdf8',
    message: '少しゆっくりめのリズムが心地よい日。がんばりすぎず、自分を甘やかす時間も大切に。',
  },
  {
    level: '凶',
    keyword: 'リセット',
    color: '#a855f7',
    message: 'うまくいかないことがあっても、今日は「リセットの日」。深呼吸をして、心のスペースを空けてみて。',
  },
]

const pickFortune = (
  name: string,
  birthday: string,
  period: Period,
): FortuneResult | null => {
  if (!name.trim() || !birthday) return null

  const zodiac = getZodiacFromBirthday(birthday)
  if (!zodiac) return null

  const seed = createSeedFromInput(name, birthday, period)
  const index = seed % fortuneTable.length
  const base = fortuneTable[index]

  const trait = zodiacTraits[zodiac]
  const periodLabel = periodLabelMap[period]

  const lifePathNumber = getLifePathNumber(birthday)
  const nameEnergyNumber = getNameEnergyNumber(name)

  const lifeTrait =
    (lifePathNumber && lifePathTraits[lifePathNumber]) || lifePathTraits[5]
  const nameTrait =
    (nameEnergyNumber && nameEnergyTraits[nameEnergyNumber]) ||
    nameEnergyTraits[5]

  const combinedKeyword = `${base.keyword} × ${trait.keyword} × ${lifeTrait.keyword}`

  // 「今年」の運勢では、特に1〜5月ごろをやや慎重めに読む補正を加える
  const now = new Date()
  const month = now.getMonth() + 1
  const isEarlyYear = period === 'thisYear' && month >= 1 && month <= 5

  const earlyYearMessage = isEarlyYear
    ? '特に1〜5月ごろまでは、無理にスピードを上げるよりも、足元を整える意識を持つと流れが安定しやすいタイミングです。前半は「準備と調整」、後半に向けてじっくり整えていくつもりで動いてみてください。'
    : ''

  let adjustedLevel = base.level
  if (isEarlyYear) {
    if (adjustedLevel === '大吉') {
      adjustedLevel = '中吉'
    } else if (adjustedLevel === '吉') {
      adjustedLevel = '小吉'
    }
  }

  const message = [
    `${periodLabel}の${zodiac}のあなたは、「${trait.keyword}」の流れが少し強まりやすいタイミングです。`,
    `生年月日からみたライフパスナンバーは「${
      lifePathNumber ?? '―'
    }」。${lifeTrait.message}`,
    `お名前の画数エネルギー番号は「${
      nameEnergyNumber ?? '―'
    }」。${nameTrait.message}`,
    earlyYearMessage,
    base.message,
  ].join(' ')

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

function App() {
  // localStorageから初期値を復元（初回マウント時のみ）
  const [name, setName] = useState(() => {
    const saved = localStorage.getItem('fortune-name')
    return saved ?? ''
  })
  const [birthYear, setBirthYear] = useState(() => {
    const saved = localStorage.getItem('fortune-birthYear')
    return saved ?? ''
  })
  const [birthMonth, setBirthMonth] = useState(() => {
    const saved = localStorage.getItem('fortune-birthMonth')
    return saved ?? ''
  })
  const [birthDay, setBirthDay] = useState(() => {
    const saved = localStorage.getItem('fortune-birthDay')
    return saved ?? ''
  })
  const [period, setPeriod] = useState<Period>(() => {
    const saved = localStorage.getItem('fortune-period') as Period | null
    return saved && ['today', 'tomorrow', 'thisYear', 'nextYear'].includes(saved)
      ? saved
      : 'today'
  })
  const [touched, setTouched] = useState(() => {
    const saved = localStorage.getItem('fortune-touched')
    return saved === 'true'
  })

  // 値が変更されたときにlocalStorageに保存
  useEffect(() => {
    if (name) {
      localStorage.setItem('fortune-name', name)
    } else {
      localStorage.removeItem('fortune-name')
    }
  }, [name])

  useEffect(() => {
    if (birthYear) {
      localStorage.setItem('fortune-birthYear', birthYear)
    } else {
      localStorage.removeItem('fortune-birthYear')
    }
  }, [birthYear])

  useEffect(() => {
    if (birthMonth) {
      localStorage.setItem('fortune-birthMonth', birthMonth)
    } else {
      localStorage.removeItem('fortune-birthMonth')
    }
  }, [birthMonth])

  useEffect(() => {
    if (birthDay) {
      localStorage.setItem('fortune-birthDay', birthDay)
    } else {
      localStorage.removeItem('fortune-birthDay')
    }
  }, [birthDay])

  useEffect(() => {
    localStorage.setItem('fortune-period', period)
  }, [period])

  useEffect(() => {
    localStorage.setItem('fortune-touched', String(touched))
  }, [touched])

  const birthday = useMemo(() => {
    if (!birthYear || !birthMonth || !birthDay) return ''
    const mm = birthMonth.toString().padStart(2, '0')
    const dd = birthDay.toString().padStart(2, '0')
    return `${birthYear}-${mm}-${dd}`
  }, [birthYear, birthMonth, birthDay])

  const fortune = useMemo(
    () => pickFortune(name, birthday, period),
    [name, birthday, period],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
  }

  const showResult = touched && fortune

  return (
    <div className="app-root">
      <div className="app-gradient" />
      <main className="app-shell">
        <header className="app-header">
          <p className="app-badge">FORTUNE for YOU</p>
          <h1 className="app-title">
            <span className="app-title-emphasis"> 星座ベース占い </span>
          </h1>
          <p className="app-subtitle">
            生年月日から西洋12星座の性質をベースに、
            いま・少し先・この1年の流れをやさしく言葉にします。
            <br />
            科学的な予言ではなく、気分転換のヒントとしてお楽しみください。
          </p>
        </header>

        <section className="app-content">
          <form className="fortune-form" onSubmit={handleSubmit}>
            <div className="period-section" aria-label="占う期間を選択">
              <span className="period-section-label">みる期間</span>
              <div className="period-toggle">
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`period-pill${
                      period === option.value ? ' is-active' : ''
                    }`}
                    onClick={() => setPeriod(option.value)}
                  >
                    <span className="period-pill-label">{option.label}</span>
                    <span className="period-pill-subtitle">
                      {option.subtitle}
                    </span>
                  </button>
                ))}
              </div>
            </div>

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

            <div className="form-row">
              <label className="form-field">
                <span className="form-label">生年月日</span>
                <div className="birthday-row">
                  <div className="birthday-segment">
                    <select
                      className="form-select"
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                    >
                      <option value="" disabled>
                        西暦
                      </option>
                      {Array.from(
                        { length: 70 },
                        (_, i) => new Date().getFullYear() - 10 - i,
                      ).map((year) => (
                        <option key={year} value={year}>
                          {year}年
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="birthday-segment">
                    <select
                      className="form-select"
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                    >
                      <option value="" disabled>
                        月
                      </option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
                        (month) => (
                          <option key={month} value={month}>
                            {month}月
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div className="birthday-segment">
                    <select
                      className="form-select"
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                    >
                      <option value="" disabled>
                        日
                      </option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(
                        (day) => (
                          <option key={day} value={day}>
                            {day}日
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </label>
            </div>

            <button
              type="submit"
              className="fortune-button"
              disabled={!name.trim() || !birthday}
            >
              今の運勢をみる
            </button>
            <p className="helper-text">
              ※ 入力内容はどこにも送信されません。あなたの端末の中だけで占います。
            </p>
          </form>

          <section className="fortune-panel">
            {showResult ? (
              <div className="fortune-card">
                <p className="fortune-name">
                  {name} さんの{fortune.periodLabel}の運勢
                </p>
                <p
                  className="fortune-level"
                  style={{ color: fortune.color }}
                >
                  {fortune.level}
                </p>
                <p className="fortune-keyword">Keyword：{fortune.keyword}</p>
                <p className="fortune-zodiac">
                  星座：{fortune.zodiac}（テーマ：{fortune.zodiacKeyword}）
                </p>
                <p className="fortune-detail">
                  ライフパスナンバー：
                  {fortune.lifePathNumber ?? '―'}（{fortune.lifePathKeyword}）
                </p>
                <p className="fortune-detail">
                  名前の画数エネルギー：
                  {fortune.nameEnergyNumber ?? '―'}（
                  {fortune.nameEnergyKeyword}）
                </p>
                <p className="fortune-message">{fortune.message}</p>
              </div>
            ) : (
              <div className="fortune-placeholder">
                <p>まだ結果はひみつです。</p>
                <p>お名前と生年月日を入力して、「今の運勢をみる」を押してください。</p>
              </div>
            )}
          </section>
        </section>

        <footer className="app-footer">
          <p>今日が、すこしだけやさしい一日になりますように。</p>
        </footer>
      </main>
    </div>
  )
}

export default App
