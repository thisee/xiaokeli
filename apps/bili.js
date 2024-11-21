import fs from 'fs'
import {bili,yaml} from '#xiaokeli'
import fetch from "node-fetch"

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
      reg: '^#*(小可莉)?(强制)?刷新(b站|B站|哔哩哔哩|bili|bilibili)ck$',
      fnc: 'sx',
    },
    {
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

async b(e){
  if(!e.msg) return false
  if(!await this.Check()) return false
  let msg,url,data,res,bv,user_id
  //卡片分享
  if(e.raw_message=='[json消息]'){
  bv=await this.json_bv(e.msg)
  if(!bv) return false
  return bili.video(e,bv)
  }
  //链接
  if(e.msg.includes('https://b23.tv/')){
  url=e.msg.match('https://b23.tv/([\\w]+)')
  url=url[0]
  bv=await this.getbv(url)
   if(!bv) return false
   return bili.video(e,bv)
  }
  if(e.msg.includes('https://www.bilibili.com/video/')){
   bv=e.msg.match('https://www.bilibili.com/video/([\\w]+)')
   if(!bv) return false
   bv=bv[1]
   return bili.video(e,bv)
  }
  if(e.msg.includes('https://m.bilibili.com/video/')){
   bv=e.msg.match('https://m.bilibili.com/video/([\\w]+)')
   if(!bv) return false
   bv=bv[1]
   return bili.video(e,bv)
  }
  //回复bot
  if (!e.source)  return false
  //展开评论区
  let source
  if (e.isGroup) {
          source = (await e.group.getChatHistory(e.source ?.seq, 1)).pop()
        }else{
          source = (await e.friend.getChatHistory((e.source ?.time + 1), 1)).pop()
    }
  if (source.message.length!=1&&(source.message[0]?.type!='image'||source.message[0]?.type!='json'))  return false

  if(source.message[0].type=='image'){
  
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
   user_id=data.up_id
   if(!bv) return false
   
  }else if(source.message[0].type=='json'){
  msg=source.message[0].data
  bv=await this.json_bv(msg)
  if(!bv) return false
  }
  
  if(['下载视频','视频下载'].includes(e.msg)) return bili.Download(e,bv)
  
  if(['点赞','赞','取消点赞','点赞取消','取消赞','赞取消'].includes(e.msg)) return bili.dz(e,bv)
  //去(#)
  msg=e.msg.replace(/#|b站|B站|哔哩哔哩|bili|bilibili/g, '')
  if(['添加推送','取消推送','关闭推送','开启推送','删除推送'].includes(msg)&&e.isGroup){
  //主人权限，群主权限，管理员权限，推送在当前群聊
    if (!e.member.is_admin && !e.member.is_owner && !e.isMaster) {
    return false
    }
   if(!user_id) user_id=(await bili.sp_(e,bv)).owner.mid
   return bili.tuis(e,user_id,e.group_id)
  }
  //主动解析卡片(emmm...一般都自动解析了)
  if(['解析','解'].includes(e.msg)&&source.message[0].type=='json') return bili.video(e,bv)
  
  
  //下面的全要主人权限
  if (!e.isMaster) return false
  
  if(['投币','投币1','投币2','收藏','取消收藏','三连'].includes(e.msg)) return bili.dz(e,bv)
  
  if(['关注','取消关注','拉黑','取消拉黑'].includes(e.msg)){
  if(!user_id) user_id=(await bili.sp_(e,bv)).owner.mid
  return bili.user(e,user_id)
  }
  
  if(e.msg.substring(0, 2)=='评论') return bili.bili_reply(e,bv)
  
  return false
}


async getbv(url){
   let res=await fetch(url)
   if(res.status!=200) return false
   url=res.url
   let bv=url.match('https://www.bilibili.com/video/(.*?)/')
   if(!bv) return false
   bv=bv[1]
   return bv
}

async json_bv(msg){
msg=JSON.parse(msg)
  if(msg.meta?.detail_1?.qqdocurl?.includes('b23.tv')||msg.meta?.news?.jumpUrl?.includes('b23.tv')){
 let url=msg.meta?.detail_1?.qqdocurl || msg.meta?.news?.jumpUrl
   let bv=await this.getbv(url)
   if(!bv) return false
   return bv
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
  if(e.msg.includes('强制')) return bili.sx_ck(e,true)
  return bili.sx_ck(e)
}

async Check(){
const bilibili = (await yaml.get('./plugins/xiaokeli/config/config.yaml')).bilibili
return bilibili
}






}