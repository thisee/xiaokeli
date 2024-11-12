import fs from 'fs'
import fetch from "node-fetch"
import moment from "moment"
import common from '../../../lib/common/common.js'
import lodash from 'lodash'
import {bili,yaml} from '#xiaokeli'


let path='./plugins/xiaokeli/config/bili_group.yaml'

if (!fs.existsSync(path)){
fs.writeFileSync(path,'')
}
export class bilibili_tui extends plugin{
  constructor(e){
  super({
  name: '[小可莉]bili_推送',
  dsc: '',
  event: 'message.group',
  priority: -119,
  rule: [
    {
      reg: '^#*(小可莉)?(添加|开启|取消|删除|关闭)(b站|B站|哔哩哔哩|bili|bilibili)推送(\\d+)$',
      fnc: 'b',
    },
    {
      reg: '^#*解(析)?$',
      fnc: 'jx',
    },
    {
      reg: '^#*(小可莉)?(b站|B站|哔哩哔哩|bili|bilibili)(视频)?推送列表$',
      fnc: 'lb',
    }
    ]})
   this.task = {
				cron: "30 */5 * * * *", //每5分钟跑一次
				name: "[小可莉]bilibili任务",
				fnc: () => this.ccc(),
				log: false
      }
  }


async b(e){
   if(!await this.Check()) return false
 //主人权限，群主权限，管理员权限，推送在当前群聊
    if (!e.member.is_admin && !e.member.is_owner && !e.isMaster) {
    return false
    }
  let mid= await (/\d+/).exec(e.msg)
  if(!mid) return false
  return bili.tuis(e,mid,e.group_id)
}

async jx(e){
  if (!e.source)  return false
  if(!await this.Check()) return false
  let source = (await e.group.getChatHistory(e.source ?.seq, 1)).pop()
  let msg=source.raw_message,bv,url
  if(msg.includes('https://b23.tv/')){
  url=msg.match('https://b23.tv/([\\w]+)')
  url=url[0]
  bv=await this.getbv(url)
   if(!bv) return false
   return bili.video(e,bv)
  }
  if(msg.includes('https://www.bilibili.com/video/')){
   bv=msg.match('https://www.bilibili.com/video/([\\w]+)')
   if(!bv) return false
   bv=bv[1]
   return bili.video(e,bv)
  }
  if(msg.includes('https://m.bilibili.com/video/')){
   bv=msg.match('https://m.bilibili.com/video/([\\w]+)')
   if(!bv) return false
   bv=bv[1]
   return bili.video(e,bv)
  }
}

async getbv(url){
   let res=await fetch(url)
   if(res.status!=200) return false
   url=res.url
   let bv=url.match('https://www.bilibili.com/video/([\\w]+)')
   if(!bv) return false
   bv=bv[1]
   return bv
}


async ccc(){
if(!await this.Check()) return false
let mids=await yaml.get(path)
if(!mids) return false
for(let mid in mids){
if(!mids[mid].length) continue
let groups=mids[mid]
const id=Number(mid)
let data=await bili.tougao(id)

const time=data.time
const bv=data.bv

const old_time=mids[`${id}_time`]
if(!old_time) await yaml.set(path,`${id}_time`,time)
if(old_time<time){
yaml.set(path,`${id}_time`,time)
const up=await bili.up_xx(false,id)
if(!up) continue
const msg=[segment.image(up.face),'\nup主名字：',up.name,'\n\n最新视频：https://www.bilibili.com/video/',bv,'/','\n',segment.image(data.pic),'\n发稿时间：',moment(new Date(time*1000)).format("MM-DD HH:mm"),'\n标题：',data.title]
   for (let group of groups) {
Bot.pickGroup(group).sendMsg(msg)
await common.sleep(lodash.random(10000, 20000))
}
}
}
}

async lb(e){
if(!await this.Check()) return false
let mids=await yaml.get(path)
if(!mids) return e.reply('本群当前没有up视频推送任务')
let msgs=[]
for(let mid in mids){
if(!mids[mid].length) continue
let groups=mids[mid]
let msg
for (let g of groups){
if(g==e.group_id) {
const up=await bili.up_xx(false,Number(mid))
if(!up) continue
msg=[segment.image(up.face),'\nup主名字：',up.name]
msgs.push(msg)
}
}
}
if(!msgs.length) return e.reply('本群当前没有up视频推送任务')
msgs=await common.makeForwardMsg(e, msgs,'本群b站视频推送up列表')
e.reply(msgs)
return 
}

async Check(){
const bilibili = (await yaml.get('./plugins/xiaokeli/config/config.yaml')).bilibili
return bilibili
}


}