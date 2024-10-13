import fetch from 'node-fetch'
import common from '../../../lib/common/common.js'
import lodash from 'lodash'
import fs from 'fs'
import {yaml} from '#xiaokeli'
import schedule from 'node-schedule'

//区分一下时间段，重点中午12点，晚上8点，其余时间10分钟一次
let cron = '0 1/10 0,1,2,3,4,5,6,7,8,9,10,11,13,14,15,16,17,18,19,21,22,23 * * ?'
//每隔 2 分钟, 从一小时内的第 0.5 分钟开始, 在 12:00~12:59:59 和 20:00~20:59:59
let cron1 = '30 0/2 12,20 * * ? '
schedule.scheduleJob(cron, () => {
    vid()
})
schedule.scheduleJob(cron1, () => {
    vid()
})
//手动触发，只回复当前聊天
export class video extends plugin{
  constructor(e){
  super({
  name: '[小可莉]米哈游最新视频',
  dsc: '',
  event: 'message',
  priority: 1,
  rule: [
    {
      reg: '#最新视频$',
      fnc: 'video',
    },
    ]})
    
  }
  
async video(e) {
  await redis.set(`xiaokeli_vid:0`,123)
  await redis.set(`xiaokeli_vid:1`,123)
  await redis.set(`xiaokeli_vid:2`,123)
  vid(e,true)
  }
}

async function vid(e,thise=false) {
  let groups=(await yaml.get('./plugins/xiaokeli/config/config.yaml')).groups
  if(!groups.length && !thise) return true
  //原神，星铁，绝区零
  let urls = ['https://bbs-api.miyoushe.com/post/wapi/userPost?size=10&uid=75276539','https://bbs-api.miyoushe.com/post/wapi/userPost?size=10&uid=288909600','https://bbs-api.miyoushe.com/post/wapi/userPost?size=10&uid=152039148']
  //啊～量有点多
  let list,p,size,time,subject,content,img,vid_url,res,vod_list,url,name,ti,msgs=[],names='',path
  //遍历3游戏官号
  for (let i = 0;i<urls.length;i++) {
  let msg={}
  msg.nickname= Bot.nickname
  msg.user_id= Bot.uin
  //游戏名字
  name= i==0 ? '原神' : i==1 ? '崩坏星穹铁道' : '绝区零'
  url = urls[i]
  res = await fetch(url).then(res => res.json())
  list=res.data.list
  //遍历最新发的10个帖子
  for (let n in list) {
    vod_list = list[n].vod_list[0]?.resolutions
    ti = await redis.get(`xiaokeli_vid:${i}`)
  //发布是否为视频
  if (vod_list) {
    if(!ti){
      await redis.set(`xiaokeli_vid:${i}`,time)
      logger.info(`初始化${name}最新视频记录`)
      break
    }
   //发布时间戳10位
  time=list[n].post.created_at
    if(ti>=time) break
    await redis.set(`xiaokeli_vid:${i}`,time)
    //地址
    vid_url=vod_list[vod_list.length-1].url
    //画质
    p=vod_list[vod_list.length-1].label
    //大小
    size='约'+Math.ceil(Number(vod_list[vod_list.length-1].size)/1024/1024)+'MB'
    
    // 转换时间戳为年月日时分秒
    const date = new Date(time*1000)
    // const year = date.getFullYear()
    const month = (date.getMonth()+1).toString().padStart(2, '0') // 月份加1后补0
    const day = date.getDate().toString().padStart(2, '0') // 日期补0
    const hours = date.getHours().toString().padStart(2, '0') // 小时补0
    const minutes = date.getMinutes().toString().padStart(2, '0') // 分钟补0
    // const seconds = date.getSeconds().toString().padStart(2, '0') // 秒补0
    // 拼接成年月日时分秒
    time = `${month}月${day}号 ${hours}:${minutes}`
    
    //标题
    subject=list[n].post.subject
    //内容
    content=JSON.parse(list[n].post.structured_content)[0].insert
    //封面
    img=list[n].post.cover
    //老米这地址被QQ卡了，只能下载下来，再发了
    if(img.includes('https://upload-bbs.miyoushe.com/')){
    path=`./plugins/xiaokeli/temp/${name}视频封面.jpg`
    await common.downFile(img+'?x-oss-process=image//resize,p_30', path)
    }
    img=segment.image(path)
    //我们合体(˃ ⌑ ˂
    msg.message=[`游戏：${name}\n\n标题：${subject}\n\n发布时间：${time}\n\n画质大小：${p}  ${size}\n\n封面：\n`,img,`\n\n视频链接(点击即可观看)：${vid_url}\n\n内容：\n${content}`]
    msgs.push(msg)
    names=names+name+' '
    break
  }else{
    continue
  }
  }
  }
 if (msgs.length) {
  let msg = await Bot.makeForwardMsg(msgs)
    // msg=await common.makeForwardMsg(e, msg,`小可莉发现了新视频，一起来看看吧！\n这次的游戏有：${names}`)
    msg.data.meta.detail.news=[]
    //合并消息的外层文案
    let text={
      // 'text':`小可莉发现了新视频，一起来看看吧！\n这次的游戏有：${names}`
      'text':`发现了新视频，一起来看看吧！\n这次的游戏有：${names}`
    }
    msg.data.meta.detail.news.push(text)
   if (thise) {
   e.reply(msg)
   return true
   } else {
   for (let group of groups) {
     Bot.pickGroup(group).sendMsg(msg)
      //多个群，随机延迟10~20秒发送
      await common.sleep(lodash.random(10000, 20000))
    }
   }
 }
  
}


