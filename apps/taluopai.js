import fetch from 'node-fetch'
import moment from 'moment'
import {yaml} from '#xiaokeli'
import common from'../../../lib/common/common.js'

export class tpl extends plugin {
  constructor() {
    super({
      name: '[小可莉]塔罗牌',
      dsc: '',
      event: 'message',
      priority: 15,
      rule: [{
          reg: '^#*(塔罗牌|tlp)$',
          fnc: 'tlp'
            }
      ]
    })
  }
  async tlp(e) {
    let kg=await yaml.get('./plugins/xiaokeli/config/config.yaml')
    if(!kg.tlp) return false
    var max = kg.tlpcs
    let num = await redis.get(`xiaokeli:tlp:${e.user_id}`)
    if (num && num == max) return e.reply('你今日塔罗牌获取次数已达上限，明天再来吧', true)
    let url = 'http://api.tangdouz.com/tarot.php?&return=json'
    let data = await (await fetch(url)).json()
    if (!data.img) return logger.error('[小可莉]塔罗牌接口出错')
    let img = data.img.replace(/\\/g, '')
    await e.reply("开始洗牌.....",false,{recallMsg:3})
  await common.sleep(3010)
    await e.reply([`${data.position=='逆位'?  '哎呀~':'噔噔~'}，是〖${data.position}〗的塔罗牌：\n`,
		data.name, `(${data.namen})\n`,
		`基本牌意：${data.content}\n`, segment.image(img)],true)
    let dateTime = 'YYYY-MM-DD 00:00:00'
    var time = moment(Date.now()).add('days', 1).format(dateTime)
    var new_date = (new Date(time).getTime() - new Date().getTime()) / 1000
    if (!num) {
      await redis.set(`xiaokeli:tlp:${e.user_id}`, 1, { EX: parseInt(new_date) })
    } else {
      num++
      await redis.set(`xiaokeli:tlp:${e.user_id}`, Number(num), { EX: parseInt(new_date) })
    }
  }
}