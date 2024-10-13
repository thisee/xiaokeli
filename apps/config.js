import {yaml} from '#xiaokeli'
import common from '../../../lib/common/common.js'

let xx ='小可莉设置'
let path='./plugins/xiaokeli/config/config.yaml'
export class pz extends plugin {
  constructor() {
    super({
      name: '[小可莉]配置',
      dsc: '',
      event: 'message',
      priority: 15,
      rule: [{
          reg: `^#*${xx}$`,
          fnc: 'f1',
          permission: 'master'
              },{
          reg: `^#*${xx}塔罗牌(开启|关闭)$`,
          fnc: 'f2',
          permission: 'master'
              },{
          reg: `^#*${xx}塔罗牌(每日)?次数(\\d+)$`,
          fnc: 'f3',
          permission: 'master'
              },{
          reg: `^#*(${xx})?语音列表(撤回)?时间(\\d+)$`,
          fnc: 'f4',
          permission: 'master'
          },{
          reg: `^#*${xx}星铁攻略(图)?(开启|关闭)$`,
          fnc: 'f5',
          permission: 'master'
          },{
          reg: `^#*(小可莉)?(设置)?(添加|删除)播报群(号)?(.*)$`,
          fnc: 'f6',
          permission: 'master'
          }, {
          reg: '^#*(小可莉设置)?(开启|关闭)(查)?委托前缀$',
          fnc: 'f7',
         },
      ]
    })
  }
  async f1(e) {
     this.sz(e)
     }

  async f2(e) {
   if(e.msg.includes('开')){
     await yaml.set(path,'tlp',true)
   }else{
     await yaml.set(path,'tlp',false)
   }
   this.sz(e)
  }
  
async f3(e) {
  let cs =e.msg.replace(/#|小可莉设置塔罗牌|次数|每日/g,'')
  await yaml.set(path,'tlpcs',Number(cs))
  this.sz(e)
}

async f4(e){
  let time=e.msg.replace(/#|小可莉设置|语音列表|时间|撤回/g,'')
  await yaml.set(path,'time',Number(time))
  this.sz(e)
}

async f5(e){
  if(e.msg.includes('开')){
     await yaml.set(path,'srstrategy',true)
   }else{
     await yaml.set(path,'srstrategy',false)
   }
  this.sz(e)
}

async f6(e){
let group_id=await (/\d+/).exec(e.msg)
if(!group_id){
if(!e.isGroup) return e.reply('不是，你的群号呢？')
group_id=e.group_id
}
group_id=Number(group_id)
let groups=(await yaml.get(path)).groups
if(e.msg.includes('添加')){
 try{
       Bot.pickGroup(group_id, true)
}catch(err){
       e.reply(`o(´^｀)o我可不在这个群里\n${group_id}`)
       return false
}
     if(groups.includes(group_id)) return e.reply('这个群已经在播报群列表中了哟~', true)
     await yaml.add(path,'groups',group_id)
}else{  
     if(!groups.includes(group_id)) return e.reply('这个群不在播报群列表中呀！！！', true)
     await yaml.del(path,'groups',group_id)
}
  this.sz(e)
}

async f7(e) {
  if(e.msg.includes('开')){
     await yaml.set(path,'wt',true)
   }else{
     await yaml.set(path,'wt',false)
   }
  this.sz(e)
 }



async sz(e){
  let data = await yaml.get(path)
  let msg=[`--------小可莉设置状态--------\n塔罗牌：${data.tlp? '已开启' :'已关闭'}\n塔罗牌每日次数：${data.tlpcs}次\n语音列表撤回时间：${data.time}秒\n星铁攻略：${data.srstrategy? '已开启' :'已关闭'}\n查委托必须带#前缀：${data.wt? '已开启' :'已关闭'}\n米哈游视频播报群号：\n`]
  for (let group of data.groups) {
    msg.push(segment.image(`https://p.qlogo.cn/gh/${group}/${group}/100`),'\n',Bot.pickGroup(group, true).info.group_name,group.toString())
  }
  let msg_='--------设置指令列表--------\n①塔罗牌：\n小可莉设置塔罗牌开启\n小可莉设置塔罗牌关闭\n\n②塔罗牌每日次数：\n小可莉设置塔罗牌次数(+数字)\n\n③语音列表撤回时间：\n语音列表时间(+数字,只能取1～120)\n\n④星铁攻略：\n小可莉设置星铁攻略开启\n小可莉设置星铁攻略关闭\n\n⑤查委托是否必须带#前缀：\n开启委托前缀\n关闭委托前缀\n\n⑥米哈游视频播报群号：\n添加播报群(+群号)\n删除播报群(+群号)'
  msg=[msg,msg_]
  msg=await common.makeForwardMsg(e, msg,'小可莉设置')
  return e.reply(msg)
}

}