import fs from 'fs'
import {bili,yaml} from '#xiaokeli'
import fetch from "node-fetch"
import { Version } from '../../miao-plugin/components/index.js'


export class bilibili extends plugin{
  constructor(e){
  super({
  name: '[小可莉]bili',
  dsc: '',
  event: 'message',
  priority: -120,
  rule: [
    {
      reg: '^#*(小可莉)?清(空|除)(b站|B站|哔哩哔哩|bili|bilibili)缓存$',
      fnc: 'ggg',
      permission: 'master',
    },
    {
      reg: '^#*(小可莉)?(强制刷新|刷新|删除)(b站|B站|哔哩哔哩|bili|bilibili)ck$',
      fnc: 'sx',
    },{
      reg: '^#*(小可莉)?(查看)*(我的)*(b站|B站|哔哩哔哩|bili|bilibili)账号$',
      fnc: 'zh',
    },{
      reg: '^#*(小可莉)?(b站|B站|哔哩哔哩|bili|bilibili)(扫码)?登(录|路|陆)$',
      fnc: 'sm',
    },{
      reg: '',
      fnc: 'b',
      log: false
    }
    ]})
   this.task = {
				cron: "0 0 4 * * *", //Cron表达式，(秒 分 时 日 月 星期)
				name: "[小可莉]清空bilibili缓存",
				fnc: () => this.ggg(),
      }
  }

async sm(e){
  if(!await this.Check()) return false
 if (!e.isMaster) return false
  return bili.sm(e)
}

async zh(e){
  if(!await this.Check()) return false
 if (!e.isMaster) return false
return bili.zhanghao(e)
}

async b(e){
  if(!e.msg) return false
  if(!await this.Check()) return false
  let msg,url,data,res,bv,user_id,id,dt_id,pl_id,pl_type
  //卡片分享
  if(e.raw_message=='[json消息]'||e.message[0]?.type=='json'){
  id=await this.json_bv(e.msg)
  if(!id) return false
  if(id.bv){
  return bili.video(e,id.bv,false,true,true)
  }
  if(id.dt_id){
  //动态解析
  return bili.dt(id.dt_id,e)
  }
  }
  //链接
  if(e.msg.includes('https://b23.tv/')){
  url=e.msg.match('https://b23.tv/([\\w]+)')
  url=url[0]
  id=await this.getbv(url)
  if(!id) return false
  if(id.bv){
   return bili.video(e,id.bv,false,true)
  }
  if(id.dt_id){
  //动态解析
  return bili.dt(id.dt_id,e)
  }
  }
  if(e.msg.includes('https://www.bilibili.com/video/')){
   bv=e.msg.match('https://www.bilibili.com/video/([\\w]+)')
   if(!bv) return false
   bv=bv[1]
   return bili.video(e,bv,false,true)
  }
  if(e.msg.includes('https://m.bilibili.com/video/')){
   bv=e.msg.match('https://m.bilibili.com/video/([\\w]+)')
   if(!bv) return false
   bv=bv[1]
   return bili.video(e,bv,false,true)
  }
  if(e.msg.includes('https://www.bilibili.com/opus/')){
   dt_id=e.msg.match('https://www.bilibili.com/opus/([\\w]+)')
   if(!dt_id) return false
   dt_id=dt_id[1]
   return bili.dt(dt_id,e)
  }
  if(e.msg.includes('https://m.bilibili.com/opus/')){
   dt_id=e.msg.match('https://m.bilibili.com/opus/([\\w]+)')
   if(!dt_id) return false
   dt_id=dt_id[1]
   return bili.dt(dt_id,e)
  }
  //引用回复
  if (!e.source)  return false

  let source
  if (e.isGroup) {
          source = (await e.group.getChatHistory(e.source ?.seq, 1)).pop()
        }else{
          source = (await e.friend.getChatHistory((e.source ?.time + 1), 1)).pop()
    }
  // if (source.message.length!=1&&(source.message[0]?.type!='image'||source.message[0]?.type!='json'))  return false
  
if(Version.name=='TRSS-Yunzai'&&source.message[0]?.type=='json') {
  if (source.message.length!=2) return false
  }else{
  if (source.message.length!=1) return false
  }
  
  if(source.message[0]?.type!='image'&&source.message[0]?.type!='json') return false
  
  if(source.message[0].type=='image'){
  //展开评论区
   if(e.msg.includes('展开')){
  let n = await (/\d+/).exec(e.msg)
  return bili.reply_(e,n,source.time)
  }
  
  if(['获取图片','下载图片','图片'].includes(e.msg)) return bili.tu(e,source.time)
  
  try{
   data=JSON.parse(fs.readFileSync(`./plugins/xiaokeli/temp/bili/${source.time}.json`,'utf-8'))
   }catch(err){
   return false
   }
   bv=data.bv
   if(['下载封面','封面下载','获取封面','封面'].includes(e.msg) && bv) return bili.fm(e,source.time)
   dt_id=data.dt_id
   pl_id=data.pl_id
   pl_type=data.pl_type
   user_id=data.up_id || data.uid
   if(!bv && !dt_id) return false

  }else if(source.message[0].type=='json'){
  msg=source.message[0].data
  id=await this.json_bv(msg)
  if(!id) return false
  bv=id.bv
  dt_id=id.dt_id
  if(['下载封面','封面下载','获取封面','封面'].includes(e.msg) && bv) return bili.fm(e,false,bv)
  }
  

  if(['下载视频','视频下载','获取视频'].includes(e.msg) && bv) return bili.Download(e,bv)
  
  if(['点赞','赞','取消点赞','点赞取消','取消赞','赞取消'].includes(e.msg) && bv) return bili.dz(e,bv)
  //去(#)
  msg=e.msg.replace(/#|b站|B站|哔哩哔哩|bili|bilibili/g, '')

  if(['添加推送','取消推送','关闭推送','开启推送','删除推送'].includes(msg)&&e.isGroup&&bv){
  //主人权限，群主权限，管理员权限，推送在当前群聊
    if (!e.member.is_admin && !e.member.is_owner && !e.isMaster) {
    return false
    }
   if(!user_id) user_id=(await bili.sp_(e,bv)).owner.mid
   return bili.tuis(e,user_id,e.group_id)
  }
  
  //获取简介
  if(e.msg=='简介'&& bv) return bili.jj(e,source.time)
  
  //主动解析卡片(emmm...一般都自动解析了)
  if(['解析','解'].includes(e.msg)&&source.message[0].type=='json') {
    if(bv) return bili.video(e,bv)
    if(dt_id) return  bili.dt(id.dt_id,e)
  }
  
  //下面的全要主人权限
  if (!e.isMaster) return false
  
  if(['投币','投币1','投币2','收藏','取消收藏','三连'].includes(e.msg) && bv) return bili.dz(e,bv)
  
  if(['关注','取消关注','拉黑','取消拉黑'].includes(e.msg)){
  if(!user_id) {
    if(bv) user_id=(await bili.sp_(e,bv)).owner.mid
    if(dt_id) user_id=await bili.dt_mid(dt_id)
  }
  if(!user_id) return false
  return bili.user(e,user_id,bv || dt_id, bv ? true : false)
  }
  
  if(e.msg.substring(0, 2)=='评论') {
    if(bv) return bili.bili_reply(e,bv)
    if(pl_id && pl_type && dt_id) return bili.bili_reply(e,pl_id,pl_type,dt_id)
    if(dt_id && !pl_id && !pl_type){
      let pl=await bili.dt_mid(dt_id,true)
      if(!pl) return false
      pl_id=pl.pl_id
      pl_type=pl.pl_type
      return bili.bili_reply(e,pl_id,pl_type,dt_id)
    }
  }
  return false
}


async getbv(url){
   let res=await fetch(url)
   if(res.status!=200) return false
   url=res.url
   let id=url.match('https://www.bilibili.com/opus/([\\w]+)')
   if(id) id=id[1]
   let bv=url.match('https://www.bilibili.com/video/([\\w]+)')
   if(bv) bv=bv[1]
   if(!id && !bv) return false
   return {bv:bv,dt_id:id}
}

async json_bv(msg){
msg=JSON.parse(msg)
  if(msg.meta?.detail_1?.qqdocurl?.includes('b23.tv')||msg.meta?.news?.jumpUrl?.includes('b23.tv')){
 let url=msg.meta?.detail_1?.qqdocurl || msg.meta?.news?.jumpUrl
   let id=await this.getbv(url)
   if(!id) return false
   return id
  }
}

//清空缓存
async ggg(e){
if(!await this.Check()) return false
try{
fs.rmSync('./plugins/xiaokeli/temp/bili/',{ recursive: true })
}catch(err){
return logger.error('删除文件失败：'+err)
}
if(e) return e.reply('已清空bilibili缓存')
}

async sx(e){
 if(!await this.Check()) return false
   if (!e.isMaster) return false
  if(e.msg.includes('刷新')){
  if(e.msg.includes('强制')) return bili.sx_ck(e,true)
  return bili.sx_ck(e)
  }else{
  return bili.sc_ck(e)
  }
}

async Check(){
const bilibili = (await yaml.get('./plugins/xiaokeli/config/config.yaml')).bilibili
return bilibili
}






}