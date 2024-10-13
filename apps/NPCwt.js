import fs from 'fs'
import {yaml} from '#xiaokeli'
import common from '../../../lib/common/common.js'

export class Npcwt extends plugin{
  constructor(e){
  super({
  name: '[小可莉]原神npc委托成就',
  dsc: '',
  event: 'message',
  priority: 1234,
  rule: [
    {
      reg: '',
      fnc: 'wt',
      log: false
    }
    ]})
    
  }
  async wt(e){
    if(!e.msg) return false
    let kg=await yaml.get('./plugins/xiaokeli/config/config.yaml')
    if(kg.wt){
      //必须带#
      if(!e.msg.includes('#')) return false
    }
    let name=e.msg.replace(/#|＃|？|。|,|，|·|!|！|—|《|》|…|「|」|『|』|、|\.|\?/g, '').trim()
    let data=JSON.parse(fs.readFileSync('./plugins/xiaokeli/system/default/NPCwt.json','utf-8'))
    let name_,msg
    data.map((v)=>{
     name_=v.name.replace(/#|＃|？|。|,|，|·|!|！|—|《|》|…|「|」|『|』|、|\.|\?/g, '').trim()
      if(name==name_){
        if(v.miaosu){
        msg=`委托名：${v.name}\n地区：${v.diqu}\n\n成就名：${v.cj}\n\n重点描述：\n${v.miaosu}\n\n影月月：${v.yueyue}`
        msg=common.makeForwardMsg(e,msg,`成就：${v.cj}`)
        }else{
        msg=`${v.diqu}委托，${v.cj}`
        }
      return e.reply(msg)
       }
    })
    return false
  }

  
}
