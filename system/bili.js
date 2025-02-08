import fs from 'fs'
import fetch from "node-fetch"
import {QR,render,yaml} from "#xiaokeli"
import moment from 'moment'
import crypto from 'node:crypto'
import md5 from 'md5'

//暂时只写了b站视频类，其他类如：文章类，直播类啥的。我懒，暂时不想搞,以后再氵。。。
let path='./plugins/xiaokeli/config/config.yaml'
let path_='./plugins/xiaokeli/config/bili_group.yaml'
let headers={
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
    'Referer': 'https://www.bilibili.com/'
    }
let Download=false
class bili {
//扫码登录
async sm(e) {
    let url='https://passport.bilibili.com/x/passport-login/web/qrcode/generate'
    let res
    try{
    res=await (await fetch(url,{method: "get",headers})).json()
    }catch(e){
    logger.error('二维码请求失败')
    }
    if(res?.code!=0) return false
    let qrcode_url=res.data.url
    let qrcode_key=res.data.qrcode_key
    let img = segment.image((await QR.toDataURL(qrcode_url)).replace("data:image/png;base64,", "base64://"))
    let re = await e.reply(['请在120秒内使用bilibili扫码登录',img],true,{ recallMsg: 120 })
    //扫码状态
    let zt=false,s_ing
    let ck,e_
  if (e.isGroup) {
    e_ = e.group;
  } else {
    e_ = e.friend;
  }
    await sleep(5000)
    for (let n=1;n<150;n++) {
        await sleep(1000)
        res = await fetch("https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key="+qrcode_key, {
          method: "get",
          headers
        })
      let data=(await res.json()).data
   if(data.code==86090&&zt==false) {
       s_ing = await e.reply('二维码已被扫，请确定登录！')
        e_.recallMsg(re.message_id)
        zt=true
        }
    if(data.code==86038){
        e.reply('b站登录二维码已失效!',true)
        return true
        }
        
     if(data.code==0){
        let refresh_token=data.refresh_token
        ck=res.headers.get('set-cookie')
        ck=await this.b_(ck)
        e_.recallMsg(s_ing.message_id)
        res = await this.xx(ck)
       const csrf=ck.match('bili_jct=([\\w]+);')[1]
         getBiliTicket(csrf)
        await yaml.set(path,'bili_ck',ck)
        await yaml.set(path,'refresh_token',refresh_token)
        e.reply([
          `B站登录成功🍀\n`,
          segment.image(res.face),
          `\n账号：${res.uname}
          \n用户等级：Lv.${res.level_info.current_level}
          \n硬币：${res.money}`
          ])
        return true
        }
      }
    await e.reply('b站登录二维码已失效,请重新获取！')
    return true
}

//子评论
async reply_(e,n,msg_id){
 if(!fs.existsSync(`./plugins/xiaokeli/temp/bili/${msg_id}.json`)) return false
 let data=JSON.parse(fs.readFileSync(`./plugins/xiaokeli/temp/bili/${msg_id}.json`,'utf-8'))
 if(!n) n=1
 if(!data.pls[n-1]) return e.reply('序号不对哟~')
  data.pls[n-1]['ppath']=data.ppath
  let img=await render('bilibili/reply',data.pls[n-1],{e,pct:2.4,ret:false})
  let pic={
  n:n,
  msg_id:msg_id
  }
  let re=await e.reply(img)
  await redis.set(`xiaokeli:bili:${re.time}`,JSON.stringify(pic), { EX: 600 })
  return true
}


//下载子评论图片
async tu(e,msg_time){
let data=await redis.get(`xiaokeli:bili:${msg_time}`)
if(!data) return e.reply("缓存数据过期~")
data=JSON.parse(data)
let msg_id=data.msg_id
let n=data.n
n--
 if(!fs.existsSync(`./plugins/xiaokeli/temp/bili/${msg_id}.json`)) return e.reply("缓存数据过期！")
data=JSON.parse(fs.readFileSync(`./plugins/xiaokeli/temp/bili/${msg_id}.json`,'utf-8'))
let pic=data.pls[n].pic
if(!pic.length) return false
let msg=[]
pic.map((img)=>{
msg.push(segment.image(img))
})
e.reply(msg)
return true
}


//主页
async video(e,bv,_pl_){
  let data=await this.sp_(e,bv)
  if(!data) return false
  /*
  bv: bvid
 分p数：videos
  原创?：copyright(1原创，2转载)
  封面：pic
  标题: title
  标签：desc
  用户上传时间戳：ctime
  稿件发布时间戳：pubdate
  稿件总时长(秒)：duration
  up主：owner{
     id:mid
    名字：name
    头像: face
  }
  视频状态数：stat{
    播放量：view
	  弹幕数：danmaku
	  评论：reply
	  收藏：favorite
	  分享：share
	  点赞：like
	  投币：coin
  }
  获取第一个分p视频的cid用于获取在线观看人数
  pages[0].cid
  */
  let online=await this.online(data.pages[0].cid,bv)
  
  /*获取up主信息
    粉丝数量：fans
    等级：level_info.current_level
    是否关注: is_gz
   lv.6是否有小闪电：is_senior_member:0 or 1
  */
  let up_data=await this.up_xx(false,data.owner.mid)
  /*
  判断视频是否点赞，投币，收藏       like,coins,favoured
  */
  let san=await this.san_(bv)
  
  let list_num=(await yaml.get(path)).list_num || 15
  let pls=(await this.pl(bv)).slice(0,list_num)
  
  let plsl=zh(data.stat.reply)
  if(_pl_){
   plsl=Number(plsl)+1
  //重复就删除
   for(let i in pls){
   if(pls[i].rpid==_pl_.rpid){
   pls.splice(i, 1)
   plsl--
   break
   }
   }
   pls=[_pl_,...pls]
  }
  data={
    // 'p': data.videos,
    'bv':data.bvid,
    // 'copyright': data.copyright,
    'pic': data.pic,
    'title': data.title,
    'desc': data.desc,
    // 'ctime':moment(new Date(data.ctime*1000)).format("YY-MM-DD HH:mm"),
    'pubdate':moment(new Date(data.pubdate*1000)).format("YY-MM-DD HH:mm"),
    'time': formatSeconds(data.duration),
    'name': data.owner.name,
    'tx': data.owner.face,
    'up_id':data.owner.mid,
    'fans': zh(up_data.fans),
    'is_gz': up_data.is_gz,
    'lv': up_data.level_info.current_level,
    'lv_6': up_data.is_senior_member,
    'online': online,
    'pls': pls,
    'view': zh(data.stat.view),
    'danmaku': zh(data.stat.danmaku),
    'reply': plsl,
    'favorite': zh(data.stat.favorite),
    'share': zh(data.stat.share),
    'like': zh(data.stat.like),
    'coin': zh(data.stat.coin),
    'is_like': san.like,
    'is_coin':san.coins,
    'is_sc': san.favoured,
    'ppath': process.cwd()+'/plugins/xiaokeli/resources/bilibili/'
  }
  let img=await render('bilibili/video',data,{e,pct:2.4,ret:false})
 let re=await e.reply(img)
 await this.temp()
 fs.writeFileSync(`./plugins/xiaokeli/temp/bili/${re.time}.json`, JSON.stringify(data), 'utf-8')
 return true
}

//获取视频基础信息
async sp_(e,bv){
let ck=await this.getck()
if(!ck) return false
  headers=await this.getheaders(ck)
  let url=`https://api.bilibili.com/x/web-interface/wbi/view?bvid=${bv}`
  let res = await fetch(url, { method: "get", headers }).then(res => res.json())
  if(res.code == 62012) return logger.mark('稿件仅UP主自己可见')
  if(res.code != 0){ 
    await this.Check(e,ck)
    return logger.error(res.message)
  }
  return res.data
}

//视频是否点赞,投币，收藏
async san_(bv){
  let ck=await this.getck()
  if(!ck) return false
  headers=await this.getheaders(ck)
  let url=`https://api.bilibili.com/x/web-interface/archive/has/like?bvid=${bv}`
  let res = await fetch(url, { method: "get", headers }).then(res => res.json())
    if(res.code != 0){ 
    await this.Check(e,ck)
    return logger.error(res.message)
  }
   let like,coins,favoured
   if(res.data==1) like=true
   url=`https://api.bilibili.com/x/web-interface/archive/coins?bvid=${bv}`
   res = await fetch(url, { method: "get", headers }).then(res => res.json())
   if(res.data.multiply != 0) coins=true
   url=`https://api.bilibili.com/x/v2/fav/video/favoured?aid=${bv}`
    res = await fetch(url, { method: "get", headers }).then(res => res.json())
    favoured=res.data.favoured
    return {like,coins,favoured}
}




//获取在线观看人数
async online(cid,bv){
  let ck=await this.getck()
if(!ck) return false
  headers=await this.getheaders(ck)
  let url=`https://api.bilibili.com/x/player/online/total?bvid=${bv}&cid=${cid}`
  let res = await fetch(url, { method: "get", headers }).then(res => res.json())
  if(res.code != 0){ 
    await this.Check(e,ck)
    return logger.error(res.message)
  }
  return res.data.total
}

//获取评论区
async pl(bv,type=1){
    let ck=await this.getck()
if(!ck) return false
    headers=await this.getheaders(ck)
    let url=`https://api.bilibili.com/x/v2/reply?oid=${bv}&type=${type}&sort=1&nohot=0&ps=20&pn=1`
    let res = await fetch(url, { method: "get", headers }).then(res => res.json())
    let data=res.data.replies
    //if(res.code == 12002) data='评论区已经关闭'
    if(res.code != 0) {
     await this.Check(e,ck)
     return logger.mark('b站评论区获取失败')
    }
    data=await this.getpl(data)
    //置顶评论
    if(res.data.upper?.top){
      let top=[]
      top.push(res.data.upper.top)
      top=await this.getpl(top)
      data=[...top,...data]
      data[0]['zhiding']=true
    }
    let n=0
    data.map((v)=>{
    n++
    v['xh']=n
    })
    return data
  }





//给视频点赞,取消点赞,投币,收藏
async dz(e,bv){
  let ck=await this.getck()
if(!ck) return false
  headers=await this.getheaders(ck)
  headers.Accept='application/x-www-form-urlencoded'
  let csrf=ck.match('bili_jct=([\\w]+);')[1]
  let like=1//默认是点赞
  if( e.msg=='取消点赞') like=2
  let url=`https://api.bilibili.com/x/web-interface/archive/like?csrf=${csrf}&bvid=${bv}&like=${like}`
  let n
  if(e.msg.includes('投币')){
    n = await (/\d+/).exec(e.msg)
    if(!n) n=2
    url=`https://api.bilibili.com/x/web-interface/coin/add?bvid=${bv}&multiply=${n}&select_like=1&csrf=${csrf}`
    like=3
  }
  if(e.msg.includes('收藏')){
  let aid=(await this.sp_(e,bv)).aid//bv号转成aid
  let media_id=await this.media_id()//拿收藏夹id
  url=`https://api.bilibili.com/x/v3/fav/resource/deal?rid=${aid}&type=2&add_media_ids=${media_id}&csrf=${csrf}`
  like=4
  if(e.msg.includes('取消')){
  url=`https://api.bilibili.com/x/v3/fav/resource/deal?rid=${aid}&type=2&del_media_ids=${media_id}&csrf=${csrf}`
  like=5
  }
  }
  if(e.msg=='三连'){
    let aid=(await this.sp_(e,bv)).aid//bv号转成aid
  url=`https://api.bilibili.com/x/web-interface/archive/like/triple?&aid=${aid}&csrf=${csrf}`
  like=6
  }
  let res = await fetch(url, { method: "post", headers }).then(res => res.json())
  if(res.code==0) {
  e.reply(`[bilibili]${like==1 ? '点赞' : like==2 ? '取消点赞' : like==3 ? '点赞+投币('+n+'个)' : like==4 ? '收藏' : like==5 ? '取消收藏' : '三连'}成功！`)
  return this.video(e,bv)
  }
  if(res.code==65006&&like==1) return e.reply('[bilibili]这个视频已经点过赞了哟~')
  if(res.code==65004&&like==2) return e.reply('[bilibili]取消点赞失败，可能没点过赞呢~')
  if(like==3&&res.code==-104) return e.reply('˃̣̣̥᷄⌓˂̣̣̥᷅穷得叮当响，我已经没有硬币了！')
  if(like==3&&res.code==34005) return e.reply('超过投币上限，应该可以已经投过币了哟~')
  //另一个接口https://api.bilibili.com/medialist/gateway/coll/resource/deal
  // if((like==4||like==5)&&res.code != 0){
  // switch (res.code) {
  // case 11201:
    // return e.reply('该视频已经收藏过了！')
  // case 11202:
    // return e.reply('该视频已经没有收藏过！')
  // case 11203:
    // return e.reply('这个收藏夹达到收藏上限，请换个收藏夹吧')
 // }
// }
  if([-111,-101,-403].includes(res.code)) return e.reply('b站ck可能过期，请重新登录或刷新ck')
  if(res.code != 0) return logger.error('code:'+res.code,res.message)
}


//关注，取消关注，拉黑，取消拉黑
async user(e,id,bv){
  let ck=await this.getck()
if(!ck) return false
  headers=await this.getheaders(ck)
  headers.Accept='application/x-www-form-urlencoded'
  let csrf=ck.match('bili_jct=([\\w]+);')[1]
  let n = 1
 switch (e.msg) {
  case '取消关注':
    n=2
    break
  case '拉黑':
    n=5
    break
  case '取消拉黑':
    n=6
 }
 const url=`https://api.bilibili.com/x/relation/modify?fid=${id}&act=${n}&re_src=14&csrf=${csrf}`
   let res = await fetch(url, { method: "post", headers }).then(res => res.json())
   let msg
 switch (res.code) {
  case  0:
    msg='[bilibili]'+e.msg+'成功'
    break
  case 22002:
    msg='因对方隐私设置，还不能关注'
    break
  case 22003:
    msg='关注失败了，这家伙在黑名单里！'
    break
  case 22014:
    msg='已经关注过了哟~'
    break
  case 22120:
    msg='这家伙本来就在黑名单里！！！'
    break
  default:
    logger.error('code：'+res.code,res.message)
 }
   if(res.code==0&&/关注/.test(e.msg)){
   e.reply(msg)
   return this.video(e,bv)
   }
   if(msg) return e.reply(msg)
}




//发评论
async bili_reply(e,bv){
  let ck=await this.getck()
if(!ck) return false
  headers=await this.getheaders(ck)
  headers.Accept='application/x-www-form-urlencoded'
  let csrf=ck.match('bili_jct=([\\w]+);')[1]
  let msg=e.msg.replace('评论','')
  let url=`https://api.bilibili.com/x/v2/reply/add?type=1&oid=${bv}&message=${msg}&csrf=${csrf}`
  let res = await fetch(url, { method: "post", headers }).then(res => res.json())
  switch (res.code) {
    case 0:
    /*
  头像
  名称
  评论时间
  地址
  等级
  是否有lv6闪电
  评论文本
  */
  //有时候会卡评论，所以直接照着写一个放在开头
  let _pl_={}
  _pl_['rpid']=res.data.reply.rpid
  _pl_['tx']=res.data.reply.member.avatar
  _pl_['name']=res.data.reply.member.uname
  _pl_['time']='1秒前'
  _pl_['sex']=res.data.reply.member.sex
  _pl_['ip']=res.data.reply.reply_control.location
  _pl_['lv']=res.data.reply.member.level_info.current_level
  _pl_['lv_6']=res.data.reply.member.is_senior_member
   if(res.data.reply.content.emote){
    for (let u in res.data.reply.content.emote) {
      res.data.reply.content.emote[u]=res.data.reply.content.emote[u].url
    }}
  _pl_['em']=res.data.reply.content.emote || ''
   if(_pl_.em){
     let bqs=res.data.reply.content.message.match(/\[(.*?)\]/g)
       bqs.map((bq)=>{
      if(Object.keys(_pl_.em).includes(bq)){
      res.data.reply.content.message=res.data.reply.content.message.replace(bq,`,${_pl_.em[bq]},`)
             }
          })
       }
   _pl_['msg']=res.data.reply.content.message.split(',')
      e.reply(`[bilibili]评论〖${msg}〗成功！`)
      this.video(e,bv,_pl_)
      break
    case 12025:
      e.reply('[bilibili]评论的字数太多了！！！')
      break
   case 12002:
   case 12052:
   case 12003:
     e.reply('[bilibili]评论区已经关闭！')
     break
   case -101:
   case -111:
   case -403:
     e.reply('[bilibili]ck可能失效，请重新登录或刷新ck')
     break
    default:
      logger.error('code:'+res.code,res.message)
  }
  return
}

//处理评论信息
getpl(data){
  let pls=[]
  if(data.length!=0){
  //由评论点赞数从高到低重新排序
  data=data.sort(compare('like'))
  data.map((v)=>{
    let pl={}
    //rpid
    pl['rpid']=v.rpid
    //名称
    pl['name']=v.member.uname
    //性别
    pl['sex']=v.member.sex
    //头像
    pl['tx']=v.member.avatar
    //等级
    pl['lv']=v.member.level_info.current_level
    //lv.6是否有小闪电
    pl['lv_6']=v.member.is_senior_member
    //点赞数量
    pl['num']=zh(v.like)
    //xx条回复
    pl['reply_num']=v.reply_control.sub_reply_entry_text
    //评论时间
    pl['time']=v.reply_control.time_desc.replace('发布','')
    //评论时的ip属地
    pl['ip']=v.reply_control.location
    //评论图片(arr)
    let pic=[]
    if(v.content.pictures?.length){
    v.content.pictures.map((p)=>{
      pic.push(p.img_src)
    })}
    pl['pic']=pic
    //评论表情
    if(v.content.emote){
    for (let u in v.content.emote) {
      v.content.emote[u]=v.content.emote[u].url
    }}
    pl['em']=v.content.emote || ''
      if(pl.em){
     let bqs=v.content.message.match(/\[(.*?)\]/g)
       bqs.map((bq)=>{
      if(Object.keys(pl.em).includes(bq)){
      v.content.message=v.content.message.replace(bq,`,${pl.em[bq]},`)
             }
          })
       }
    //评论文本
    pl['msg']=v.content.message.split(',')
    if(pic.length){
    // pic.map((c)=>{
    pl.msg.push(" [图片]")
    // })
    }
    //评论回复(子评论)
    let zpl=[]
    v.replies.map((hf)=>{
      let re={}
      re['rpid']=hf.rpid
      re['name']=hf.member.uname
      re['sex']=hf.member.sex
      re['tx']=hf.member.avatar
      re['lv']=hf.member.level_info.current_level
      re['lv_6']=hf.member.is_senior_member
      re['num']=zh(hf.like)
      re['time']=hf.reply_control.time_desc.replace('发布','')
      re['ip']=hf.reply_control.location
     if(hf.content.emote){
     for (let l in hf.content.emote) {
      hf.content.emote[l]=hf.content.emote[l].url
     }}
      re['em']=hf.content.emote || ''
      if(re.em){
     let bqs_=hf.content.message.match(/\[(.*?)\]/g)
       bqs_.map((bq_)=>{
      if(Object.keys(re.em).includes(bq_)){
      hf.content.message=hf.content.message.replace(bq_,`,${re.em[bq_]},`)
             }
          })
       }
      re['msg']=hf.content.message.split(',')
      zpl.push(re)
    })
    pl['reply']=zpl
    pls.push(pl)
  })
  }
  return pls
}



//拿收藏夹id
async media_id(){
  let n=(await yaml.get(path)).mlid_n || 1
  let ck=await this.getck()
if(!ck) return false
  let mid = (await this.xx(ck)).mid//用户id
  headers=await this.getheaders(ck)
  let url=`https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=${mid}`
  let res=await (await fetch(url,{method: "get",headers})).json()
  if(res.code!=0) return logger.error('code：'+res.code,res.message)
  const id=res.data.list[n-1].id
  return id
}

//下载视频
async Download(e,bv){
if(Download) return e.reply('有其他视频在下载中，请等待！',true)
const  n = await (/\d+/).exec(e.msg) || 0
const cid=await this.player(bv,n)
// const qn= (await yaml.get(path)).qn==0 ? 80 : (await yaml.get(path)).qn==1 ? 112 : 116
const qn=80
let url=`https://api.bilibili.com/x/player/wbi/playurl?bvid=${bv}&cid=${cid}&qn=${qn}&fnval=1&fourk=0&platform=html5&high_quality=1`
 let ck=await this.getck()
if(!ck) return false
 headers=await this.getheaders(ck)
let res = await (await fetch(url,{ method: "get", headers })).json()
if(res.code!=0) return logger.error(res.message)
if(res.data.durl[0].size>31457280) return e.reply('视频大于30MB,下不了一点！！！')
url=res.data.durl[0].url
Download=true
e.reply('开始下载bilibili视频，请稍等！',true,{recallMsg:60})
const data = Buffer.from(await (await fetch(url)).arrayBuffer())
const v_path='./plugins/xiaokeli/temp/bili/temp.mp4'
fs.writeFileSync(v_path,data)
await e.reply(segment.video(v_path))
Download=false
}


//获取视频cid
async player(bv,n=0){
const url=`https://api.bilibili.com/x/player/pagelist?bvid=${bv}`
let res = await fetch(url, { method: "get"}).then(res => res.json())
// if(res.data.length>1) logger.mark('这个视频有分p')
return res.data[n].cid
}



//查询投稿视频
async tougao(mid){
  let ck=await this.getck()
if(!ck) return false
  headers=await this.getheaders(ck)
  const params={
  mid:mid
  }
  let query=await WBI(headers,params)
let url='https://api.bilibili.com/x/space/wbi/arc/search?'+query
let res =await (await fetch(url, { method: "get",headers})).json()
if(res.code !=0) return logger.error(res.code,':',res.message)
let data=res.data.list.vlist[0]
//最新视频时间戳
const time=data.created
//bv号
const bv=data.bvid
//封面
const pic=data.pic
//标题
const title=data.title
return {time,bv,pic,title}
}




//推送设置
async tuis(e,mid,group_id){
let data=await yaml.get(path_) || {}
let up=await this.up_xx(e,mid)
if(!up) return false
mid=mid.toString()
const msg=[segment.image(up.face),'\nup名字：',up.name,'\n']
if(e.msg.includes('取消')||e.msg.includes('关闭')||e.msg.includes('删除')){
if(!data[mid]||data[mid].indexOf(group_id)==-1) return e.reply([...msg,'\n本群没有添加过该up主的视频推送！'])
await yaml.del(path_,mid,group_id)
return e.reply([...msg,'\n取消该up主的视频推送成功！'])
}else{
if(!data[mid]) await yaml.set(path_,mid,[])
if(data[mid]&&data[mid].indexOf(group_id)!=-1) return e.reply([...msg,'\n本群已经添加了该up主的视频推送'])
await yaml.add(path_,mid,group_id)
return e.reply([...msg,'\n添加该up主的视频推送成功！'])
}
}



//通过mid找up主的信息
async up_xx(e,mid){
let url='https://api.bilibili.com/x/web-interface/card?mid='+mid
let ck=await this.getck()
if(!ck) return false
  headers=await this.getheaders(ck)
    let res = await fetch(url, { method: "get", headers }).then(res => res.json())
   if(res.code!=0&&e) {
   e.reply('up主的信息没找到，可能是uid不对。。。') 
   return false
   }
 res.data.card['is_gz']=res.data.following//是否关注
 return res.data.card
}









//登录信息
async xx(ck){
         headers=await this.getheaders(ck)
        //登录基本信息
        let res
       try {
        res = await (await fetch('https://api.bilibili.com/x/web-interface/nav',{
          method: "get",
          headers
        })).json()
       } catch (err) {
         logger.error(err)
       }
        if(res?.code != 0) return false
        return res.data
      }
      
 //ck拼接buvid     
async b_(ck){
     headers=await this.getheaders(ck)
    //buvid3 4
      let res
       try {
        res = await (await fetch('https://api.bilibili.com/x/frontend/finger/spi',{
          method: "get",
          headers
        })).json()
       } catch (err) {
         logger.error(err)
       }
        if(res?.code != 0) return false
        let buvid3=res.data.b_3
        let buvid4=res.data.b_4
        ck=`buvid3=${buvid3};buvid4=${buvid4};`+ck
        ck=ck.replace(/\n/g,'')
        return ck
  }
 //获取ck
 async getck(){
    let ck=(await yaml.get(path)).bili_ck
    if(!ck){ 
    logger.mark('未配置b站ck，请发送：小可莉b站登录')
    return false
    }
    const bili_ticket=await redis.get('xiaokeli_bili_ticket')
    if(bili_ticket) {
    ck=`bili_ticket=${bili_ticket};`+ck
    }else{
    let csrf=ck.match('bili_jct=([\\w]+);')[1]
    getBiliTicket(csrf)
    }
    return ck
  }
  
 //简单查下？
 async Check(e,ck){
   let check=await this.xx(ck)
   if(!check) {
   logger.mark('B站ck可能已失效！')
   if (!e.isMaster) return false
   e.reply('B站ck可能已失效，请重新登录或刷新ck！')
   return false
   }
   return true
  }
  
  getheaders(ck){
    headers['Cookie']=ck
    return headers
  }
  
  temp(){
  if (!fs.existsSync('./plugins/xiaokeli/temp/')) {
  fs.mkdirSync('./plugins/xiaokeli/temp/')
    }
  if (!fs.existsSync('./plugins/xiaokeli/temp/bili/')) {
     fs.mkdirSync('./plugins/xiaokeli/temp/bili/')
    }
  }
  
  //刷新ck(一通乱写，也不知道有没有用。。。)
async sx_ck(e,qz=false){
  let ck=await this.getck()
if(!ck) return false
  headers=await this.getheaders(ck)
  let csrf=ck.match('bili_jct=([\\w]+);')[1]
  let refresh_token=(await yaml.get(path)).refresh_token
  //检查是否需要刷新ck
  let url='https://passport.bilibili.com/x/passport-login/web/cookie/info?csrf='+csrf
  let res
   try {
      res = await (await fetch(url,{
          method: "get",
          headers
        })).json()
       } catch (err) {
         logger.error(err)
       }
   if(res.code!=0) return logger.error(res.message)
   if(!res.data.refresh&&!qz) return e.reply('当前b站ck，无需刷新！如有问题，请重新b站登录或者发送：强制更新b站ck')
   let timestamp=res.data.timestamp
   //通过返回的时间戳算出签名
   const correspondPath=await getCorrespondPath(timestamp)
   //获取refresh_csrf
   url=`https://www.bilibili.com/correspond/1/${correspondPath}`
   res = await (await fetch(url,{method: "get",headers})).text()
   const refresh_csrf=res.match('id="1-name">([\\w]+)</div>')[1]
   //刷新ck
   url=`https://passport.bilibili.com/x/passport-login/web/cookie/refresh?csrf=${csrf}&source=main_web&refresh_csrf=${refresh_csrf}&refresh_token=${refresh_token}`
   headers.Accept='application/x-www-form-urlencoded'
   res=await fetch(url,{method: "post",headers})
   let data=(await res.json()).data
   //新ck处理
   ck=res.headers.get('set-cookie')
   ck=await this.b_(ck)
   let new_refresh_token=data.refresh_token
   csrf=ck.match('bili_jct=([\\w]+);')[1]
   headers=await this.getheaders(ck)
   headers.Accept='application/x-www-form-urlencoded'
   //确认刷新(让旧的刷新口令失效)
   url=`https://passport.bilibili.com/x/passport-login/web/confirm/refresh?csrf=${csrf}&refresh_token=${refresh_token}`
   fetch(url,{method: "post",headers})
    //保存ck和刷新口令
   res = await this.xx(ck)
   getBiliTicket(csrf)
   await yaml.set(path,'bili_ck',ck)
   await yaml.set(path,'refresh_token',new_refresh_token)
   e.reply([
          `B站刷新ck成功🍀\n`,
          segment.image(res.face),
          `\n账号：${res.uname}
          \n用户等级：Lv.${res.level_info.current_level}
          \n硬币：${res.money}`
          ])
  }
  
  //删除ck
  async sc_ck(e){
   let ck=await this.getck()
   if(!ck) return false
  let res = await this.xx(ck)
  await yaml.set(path,'bili_ck','')
  await yaml.set(path,'refresh_token','')
  e.reply(`B站账号：${res.uname}\n删除完成`)
  }
  //账号
  async zhanghao(e){
  let ck=await this.getck()
  if(!ck) return false
  let res = await this.xx(ck)
  e.reply([
          segment.image(res.face),
          `\n账号：${res.uname}
          \nuid：${res.mid}
          \n用户等级：Lv.${res.level_info.current_level}
          \n硬币：${res.money}`
          ])
  }
  
  
  
  
}
export default new bili()

// 排序
function compare(property) {
  return function (a, b) {
    var value1 = a[property];
    var value2 = b[property];
    return value2 - value1;
  }
}

function sleep(ms) {//咋瓦鲁多函数，单位毫秒
  return new Promise((resolve) => setTimeout(resolve, ms));
}

//换算数字
function zh(sz){
  if(sz>10000&&sz<100000000){
    let j =Math.round(((sz/10000)-Math.floor(sz/10000))*10000)
    if(1000>j&&j>100){
    j='0'+j
    }else if(j<100&&j>10){
    j='00'+j
    }else if(j<10&j>0){
    j='000'+j
    }else if(j==0){
    j='0000'
    }
    sz=Math.floor(sz/10000)+','+j
  }else if(sz>100000000){
    let z = Math.round(Math.floor(((sz/100000000)-Math.floor(sz/100000000))*10000))
    if(1000>z&&z>100){
    z='0'+z
    }else if(z<100&&z>10){
    z='00'+z
    }else if(z<10&z>0){
    z='000'+z
    }else if(z==0){
    z='0000'
    }
    let x =Math.round(((sz/10000)-Math.floor(sz/10000))*10000)
    if(1000>x&&x>100){
    x='0'+x
    }else if(x<100&&x>10){
    x='00'+x
    }else if(x<10&x>0){
    x='000'+x
    }else if(x==0){
    x='0000'
    }
    sz=Math.floor(sz/100000000)+','+z+','+x
  }
  return sz
}

//  秒数转化为时分秒
function formatSeconds(value) {
  //  秒
  let second = parseInt(value)
  //  分
  let minute = 0
  //  小时
  let hour = 0
  //  天
  //  let day = 0
  //  如果秒数大于60，将秒数转换成整数
  if (second > 60) {
    //  获取分钟，除以60取整数，得到整数分钟
    minute = parseInt(second / 60)
    //  获取秒数，秒数取佘，得到整数秒数
    second = parseInt(second % 60)
    //  如果分钟大于60，将分钟转换成小时
    if (minute > 60) {
      //  获取小时，获取分钟除以60，得到整数小时
      hour = parseInt(minute / 60)
      //  获取小时后取佘的分，获取分钟除以60取佘的分
      minute = parseInt(minute % 60)
      //  如果小时大于24，将小时转换成天
      //  if (hour > 23) {
      //    //  获取天数，获取小时除以24，得到整天数
      //    day = parseInt(hour / 24)
      //    //  获取天数后取余的小时，获取小时除以24取余的小时
      //    hour = parseInt(hour % 24)
      //  }
    }
  }

  let result = '' + parseInt(second) + '秒'
  if (minute > 0) {
    result = '' + parseInt(minute) + '分' + result
  }
  if (hour > 0) {
    result = '' + parseInt(hour) + '小时' + result
  }
  //  if (day > 0) {
  //    result = '' + parseInt(day) + '天' + result
  //  }
  return result
}

//	使用当前毫秒时间戳生成的签名
async function getCorrespondPath(timestamp) {
  const publicKey = await crypto.subtle.importKey(
  "jwk",
  {
    kty: "RSA",
    n: "y4HdjgJHBlbaBN04VERG4qNBIFHP6a3GozCl75AihQloSWCXC5HDNgyinEnhaQ_4-gaMud_GF50elYXLlCToR9se9Z8z433U3KjM-3Yx7ptKkmQNAMggQwAVKgq3zYAoidNEWuxpkY_mAitTSRLnsJW-NCTa0bqBFF6Wm1MxgfE",
    e: "AQAB",
  },
  { name: "RSA-OAEP", hash: "SHA-256" },
  true,
  ["encrypt"],
)
  const data = new TextEncoder().encode(`refresh_${timestamp}`);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, data))
  return encrypted.reduce((str, c) => str + c.toString(16).padStart(2, "0"), "")
}



//生成BiliTicket，拼接上ck，可降低风控概率
function hmacSha256(key, message) {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(message);
    return hmac.digest('hex');
}
async function getBiliTicket(csrf) {
    const ts = Math.floor(Date.now() / 1000);
    const hexSign = hmacSha256('XgwSnGZ1p', `ts${ts}`);
    const url = 'https://api.bilibili.com/bapis/bilibili.api.ticket.v1.Ticket/GenWebTicket';
    const params = new URLSearchParams({
        key_id: 'ec02',
        hexsign: hexSign,
        'context[ts]': ts,
        csrf: csrf || ''
    });
    try {
        const response = await fetch(`${url}?${params.toString()}`, {
            method: 'POST',
            headers
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        await redis.set('xiaokeli_bili_ticket',data.data.ticket, { EX: 259200})
        return logger.mark('生成并保存BiliTicket成功！')
    } catch (e) {
        throw error;
    }
}



// 为请求参数进行 wbi 签名
function encWbi(params, img_key, sub_key) {
  const mixinKeyEncTab = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
  33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
  61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
  36, 20, 34, 44, 52
]

// 对 imgKey 和 subKey 进行字符顺序打乱编码
const getMixinKey = (orig) => mixinKeyEncTab.map(n => orig[n]).join('').slice(0, 32)

  const mixin_key = getMixinKey(img_key + sub_key),
    curr_time = Math.round(Date.now() / 1000),
    chr_filter = /[!'()*]/g

  Object.assign(params, { wts: curr_time }) // 添加 wts 字段
  // 按照 key 重排参数
  const query = Object
    .keys(params)
    .sort()
    .map(key => {
      // 过滤 value 中的 "!'()*" 字符
      const value = params[key].toString().replace(chr_filter, '')
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    })
    .join('&')

  const wbi_sign = md5(query + mixin_key) // 计算 w_rid

  return query + '&w_rid=' + wbi_sign
}

// 获取最新的 img_key 和 sub_key
async function getWbiKeys(headers) {
  const res = await fetch('https://api.bilibili.com/x/web-interface/nav', {
    headers
  })
  const { data: { wbi_img: { img_url, sub_url } } } = await res.json()

  return {
    img_key: img_url.slice(
      img_url.lastIndexOf('/') + 1,
      img_url.lastIndexOf('.')
    ),
    sub_key: sub_url.slice(
      sub_url.lastIndexOf('/') + 1,
      sub_url.lastIndexOf('.')
    )
  }
}

async function WBI(headers,params) {
  const web_keys = await getWbiKeys(headers)
  let  img_key = web_keys.img_key,
    sub_key = web_keys.sub_key
  const query = encWbi(params, img_key, sub_key)
  return query
}
