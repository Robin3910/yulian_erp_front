export const emojiList = [
  { name: '[笑掉牙]', file: 'xiaodiaoya.png' },
  { name: '[可爱]', file: 'keai.png' },
  { name: '[冷酷]', file: 'lengku.png' },
  { name: '[闭嘴]', file: 'bizui.png' },
  { name: '[生气]', file: 'shengqi.png' },
  { name: '[惊恐]', file: 'jingkong.png' },
  { name: '[瞌睡]', file: 'keshui.png' },
  { name: '[大笑]', file: 'daxiao.png' },
  { name: '[爱心]', file: 'aixin.png' },
  { name: '[坏笑]', file: 'huaixiao.png' },
  { name: '[飞吻]', file: 'feiwen.png' },
  { name: '[疑问]', file: 'yiwen.png' },
  { name: '[开心]', file: 'kaixin.png' },
  { name: '[发呆]', file: 'fadai.png' },
  { name: '[流泪]', file: 'liulei.png' },
  { name: '[汗颜]', file: 'hanyan.png' },
  { name: '[惊悚]', file: 'jingshu.png' },
  { name: '[困~]', file: 'kun.png' },
  { name: '[心碎]', file: 'xinsui.png' },
  { name: '[天使]', file: 'tianshi.png' },
  { name: '[晕]', file: 'yun.png' },
  { name: '[啊]', file: 'a.png' },
  { name: '[愤怒]', file: 'fennu.png' },
  { name: '[睡着]', file: 'shuizhuo.png' },
  { name: '[面无表情]', file: 'mianwubiaoqing.png' },
  { name: '[难过]', file: 'nanguo.png' },
  { name: '[犯困]', file: 'fankun.png' },
  { name: '[好吃]', file: 'haochi.png' },
  { name: '[呕吐]', file: 'outu.png' },
  { name: '[龇牙]', file: 'ziya.png' },
  { name: '[懵比]', file: 'mengbi.png' },
  { name: '[白眼]', file: 'baiyan.png' },
  { name: '[饿死]', file: 'esi.png' },
  { name: '[凶]', file: 'xiong.png' },
  { name: '[感冒]', file: 'ganmao.png' },
  { name: '[流汗]', file: 'liuhan.png' },
  { name: '[笑哭]', file: 'xiaoku.png' },
  { name: '[流口水]', file: 'liukoushui.png' },
  { name: '[尴尬]', file: 'ganga.png' },
  { name: '[惊讶]', file: 'jingya.png' },
  { name: '[大惊]', file: 'dajing.png' },
  { name: '[不好意思]', file: 'buhaoyisi.png' },
  { name: '[大闹]', file: 'danao.png' },
  { name: '[不可思议]', file: 'bukesiyi.png' },
  { name: '[爱你]', file: 'aini.png' },
  { name: '[红心]', file: 'hongxin.png' },
  { name: '[点赞]', file: 'dianzan.png' },
  { name: '[恶魔]', file: 'emo.png' }
]

export interface Emoji {
  name: string
  url: string
}

export const emojiPage = {}
emojiList.forEach((item, index) => {
  if (!emojiPage[Math.floor(index / 30) + 1]) {
    emojiPage[Math.floor(index / 30) + 1] = []
  }
  emojiPage[Math.floor(index / 30) + 1].push(item)
})

// 后端上传地址
const staticUrl = import.meta.env.VITE_STATIC_URL
// 后缀
const suffix = '/static/img/chat/emoji/'

// 处理表情
export function replaceEmoji(data: string) {
  let newData = data
  if (typeof newData !== 'object') {
    const reg = /\[(.+?)\]/g // [] 中括号
    const zhEmojiName = newData.match(reg)
    if (zhEmojiName) {
      zhEmojiName.forEach((item) => {
        const emojiFile = selEmojiFile(item)
        newData = newData.replace(
          item,
          `<img class="chat-img" style="width: 24px;height: 24px;margin: 0 3px;" src="${
            staticUrl + suffix + emojiFile
          }"/>`
        )
      })
    }
  }
  return newData
}

// 获得所有表情
export function getEmojiList(): Emoji[] {
  return emojiList.map((item) => ({
    url: staticUrl + suffix + item.file,
    name: item.name
  })) as Emoji[]
}

function selEmojiFile(name: string) {
  for (const index in emojiList) {
    if (emojiList[index].name === name) {
      return emojiList[index].file
    }
  }
  return false
}
