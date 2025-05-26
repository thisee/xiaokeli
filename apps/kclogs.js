import {yaml} from '#xiaokeli'
import gsCfg from '../../genshin/model/gsCfg.js'
const path = './plugins/xiaokeli/system/default/gslogs.yaml'
import common from '../../../lib/common/common.js'

export class kclogs extends plugin {
  constructor() {
    super({
      name: '[小可莉]卡池历史',
      dsc: '',
      event: 'message',
      priority: -99,
      rule: [{
          reg: '^#*(.*)卡池$',
          fnc: 'gslogs'
              }, {
          reg: '^#*(原神)?卡池(剩余|剩下)?时间$',
          fnc: 'time'
        }
      ]
    })
  }
  async gslogs(e) {
    let type = e.msg.replace(/#|卡池/g, '').trim()
    if (!type.includes('.')) {
      let name = gsCfg.getRole(type)
      if (name.name != undefined && name.name != "主角") {
        type = name.name
      }else{
        var wqnames=await yaml.get('./plugins/xiaokeli/system/default/wqname.yaml')
        for(let wqname in wqnames){
          for(let wq of wqnames[wqname]){
            if(wq==type) type = wqname
          }
        }
      }
    }
    let msg = []
    //特殊处理1.3版本
    if (type == '1.3上半' || type == '1.3下半') {
      var type2 = type + '②'
      let a = await this.getmsg(type2)
      var type1 = type + '①'
      let b = await this.getmsg(type1)
      msg = a.concat(b)
    } else {
      msg = await this.getmsg(type)
    }
    if (msg.length) return e.reply(msg)
    return false
  }

  async time(e) {
    let data = await yaml.get(path)
    let date_list = Object.keys(data.date)
    let _date = date_list[0]
    let type = _date.match('【(.*)】')[1]
    let msg
    msg = await this.getmsg(type)
    //计算时间
    let time = _date.split('~')[1]
    let ptime = new Date().getTime()
    let ftime = new Date(time).getTime()
    let datec = ftime - ptime
    var dayDiff = Math.floor(datec / (24 * 3600 * 1000))+1; //计算出相差天数
    let days = '卡池剩余时间：' + dayDiff + "天 "
    if(dayDiff=='0') days = '该卡池即将结束'
    msg.push(days)
    e.reply(msg)
  }

  async getmsg(type) {
    let data = await yaml.get(path)
    let date_list = Object.keys(data.date)
    let ver=Object.keys(data.ver)
    let date_name = []
    date_list.map((val) => {
      date_name.push(val.match('【(.*)】')[1])
    })
    let n
    let list
    let name
    let imgname
    let wq_hc = []
    let msg = []
    
    
    
    
    //判断[[x.x上半/下半],[4-5].[0-8]]
    for (var val of date_name) {
      n = date_name.indexOf(val)
      list = data.imgs[`【${val}】`]
      if (val == type || String(val.match(/[4-5]\.[0-8]/g)) == type) {
        msg.push(date_list[n])
        for (var img of list) {
          msg.push(segment.image(img))
        }
      }
    }
    if (msg.length) return msg
    
    
    
    //判断[1-3].[0-8]
    for (var val of ver){
     let tu
      if (val == type) {
        tu=data.ver[type]
        
   //QQ不支持发https://upload-bbs.miyoushe.com/
    if(tu?.includes('https://upload-bbs.miyoushe.com/')){
    let tupath=`./plugins/xiaokeli/temp/[1-3].[0-8]卡池.jpg`
    await common.downFile(tu, tupath)
    msg.push(segment.image(tupath))
    }else{
    msg.push(segment.image(tu))
    }
    
      }else if(val+'.0'==type){
      type=type.replace(/.0/g, '')
        tu=data.ver[type]
        
    //QQ不支持发https://upload-bbs.miyoushe.com/
    if(tu?.includes('https://upload-bbs.miyoushe.com/')){
    let tupath=`./plugins/xiaokeli/temp/[1-3].[0-8]卡池.jpg`
    await common.downFile(tu, tupath)
    msg.push(segment.image(tupath))
    }else{
    msg.push(segment.image(tu))
    }
    
      }
    }
    if (msg.length) return msg
    
    
    
    
    
    //判断xx角色卡池,xx武器卡池
    for (var val of date_list) {
      n = date_list.indexOf(val)
      imgname = val.match('【(.*)】')[0]
      list = data.imgs[imgname]
      name = data.date[val]
      name.map((value, i) => {
      //判断武器池或者混池
        if (value.includes(',')) {
        wq_hc = value.split(',')
         for (var v of wq_hc) {
          if(v==type) {
           msg.push(date_list[n])
          msg.push(segment.image(list[i]))
          break
           }
          }
        }
      //xx角色池
        if (value == type) {
          msg.push(date_list[n])
          msg.push(segment.image(list[i]))
        }
      })
    }
    return msg
  }
}