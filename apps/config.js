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
          reg: `^#*${xx}(塔罗牌|自动更新|自动视频|星铁攻略(图)?|b站|B站|哔哩哔哩|bili|bilibili)?(开启|关闭)((查)?委托前缀)?$`,
          fnc: 'f2',
          permission: 'master'
              },{
          reg: `^#*${xx}塔罗牌(每日)?次数(\\d+)$`,
          fnc: 'f3',
          permission: 'master'
            },{
          reg: `^#*(小可莉)?(设置)?(添加|删除)播报群(号)?(.*)$`,
          fnc: 'f6',
          permission: 'master'
          },{
          reg: '^#*(开启|关闭)(查)?委托前缀$',
          fnc: 'f7',
          permission: 'master'
          }
         // {
          // reg: `^#*${xx}面板(cd|CD)(.*)$`,
          // fnc: 'f8',
          // permission: 'master'
         // }
      ]
    })
  }
  async f1(e) {
     this.sz(e)
     }

  async f2(e) {
  let type=e.msg.replace(/#|小可莉|设置/g,'')
  let k
  if(/塔罗牌/.test(type)) k='tlp'
  else if(/星铁攻略/.test(type)) k='srstrategy'
  else if(/委托前缀/.test(type)) k='wt'
  else if(/b站|B站|哔哩哔哩|bili|bilibili/.test(type)) k='bilibili'
  else if(/自动更新/.test(type)) k='update'
  else if(/自动视频/.test(type)) k='dow'
  if(!k) return false
   if(e.msg.includes('开')){
     await yaml.set(path,k,true)
   }else{
     await yaml.set(path,k,false)
   }
   this.sz(e)
  }
  
async f3(e) {
  let cs =e.msg.replace(/#|小可莉设置塔罗牌|次数|每日/g,'')
  await yaml.set(path,'tlpcs',Number(cs))
  this.sz(e)
}

// async f4(e){
  // let time=e.msg.replace(/#|小可莉设置|语音列表|时间|撤回/g,'')
  // await yaml.set(path,'time',Number(time))
  // this.sz(e)
// }


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

// async f8(e){
// let cd=await (/\d+/).exec(e.msg)
// await yaml.set(path,'mbCD',Number(cd))
// this.sz(e)
// }


 
 
 
async sz(e){
  let data = await yaml.get(path)
  let msg=[`--------小可莉设置状态--------\n塔罗牌：${data.tlp? '已开启' :'已关闭'}\n塔罗牌每日次数：${data.tlpcs}次\n星铁攻略：${data.srstrategy ? '已开启' :'已关闭'}\n查委托必须带#前缀：${data.wt ? '已开启' :'已关闭'}\nb站相关功能：${data.bilibili ? '已开启' :'已关闭'}\nb站视频小于30MB时自动下载：${data.dow ? '已开启' :'已关闭'}\n凌晨3:30自动更新xiaokeli：${data.update ? '已开启' :'已关闭'}\n米哈游视频播报群号：\n`]
  for (let group of data.groups) {
  try{
    Bot.pickGroup(group, true)
    }
    catch(err){
    await yaml.del(path,'groups',group)
    logger.info(`检测到群号${group}已失效，已经自动删除`)
    continue
   }
   let gname=Bot.pickGroup(group, true).info?.group_name || Bot.pickGroup(group, true).name
   msg.push(segment.image(`https://p.qlogo.cn/gh/${group}/${group}/100`),'\n',gname,group.toString())
  }
  let msg_='--------设置指令列表--------\n①塔罗牌：\n小可莉设置塔罗牌开启\n小可莉设置塔罗牌关闭\n\n②塔罗牌每日次数：\n小可莉设置塔罗牌次数(+数字)\n\n③星铁攻略：\n小可莉设置星铁攻略开启\n小可莉设置星铁攻略关闭\n\n④查委托是否必须带#前缀：\n开启委托前缀\n关闭委托前缀\n\n⑤b站相关功能：\n小可莉设置b站开启\n小可莉设置b站关闭\n\n⑥b站视频小于30MB时自动下载：\n小可莉设置自动视频开启\n小可莉设置自动视频关闭\n\n⑦小可莉自动更新：\n小可莉设置自动更新开启\n小可莉设置自动更新关闭\n\n⑧米哈游视频播报群号：\n添加播报群(+群号)\n删除播报群(+群号)'
  msg=[msg,msg_]
  msg=await common.makeForwardMsg(e, msg,'小可莉设置')
  return e.reply(msg)
}

}