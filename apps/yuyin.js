import gsCfg from '../../genshin/model/gsCfg.js'
import cfg from'../../../lib/config/config.js'
import fs from 'fs'
import { uploadRecord,yyjson,yaml,render,mys } from '#xiaokeli'
const path = process.cwd();

export class jsyy extends plugin {
  constructor () {
    super({
      name: '[小可莉]角色语音',
      dsc: '',
      event: 'message',
      priority: 15,
      rule: [{
          reg: '^#*(开启|关闭)?超清语音(开启|关闭)?$',
          fnc: 'kg'
        },{
          reg: '^(#|\\*)?(星铁|原神)?(.*)语音(列表)?$',
          fnc: 'yylb'
        },{
          reg: '',
          fnc: 'fsyy',
          log: false
        }
      ]
    })
  }

async check(){
let kg=await yaml.get(path+'/plugins/xiaokeli/config/config.yaml')
return kg
}

async tu(e,table,name,background){
let kg=await this.check()
let data={
 pluResPath: `${path}/plugins/xiaokeli/resources/`,
 name,
 table,
 background,
 kg:kg.voice
}
let img = await render('yytable/table',data,{e,pct:3.6})
if(img) return img
}  
  
  
async kg (e){
if(e.msg && e.msg.length>7){
     return false
  }
if (!e.isMaster) return false
if(e.msg.includes('开')){
await yaml.set(path+'/plugins/xiaokeli/config/config.yaml','voice',true)
await e.reply('已开启超清语音，⚠️pc端QQ无法听取超清语音')
}else{
await yaml.set(path+'/plugins/xiaokeli/config/config.yaml','voice',false)
await e.reply('已关闭超清语音🍃')
}
return true
}



async yylb(e){
let name=e.msg.replace(/#|\*|星铁|原神|语音|列表/g,'')
let name2
let def=true
let sr_id
//星铁主角系列处理  
if(name.includes('星')){
name2=name.replace(/星/g,'')
 switch (name2) {
    case '物理': 
    case '物主': 
    case '毁灭': 
      sr_id=3128
      break
    case '火主':
    case '存护':
      sr_id=3127
      break
    case '虚数':
    case '同谐':
    case '':
      sr_id=872
      break
    }
}
if(name.includes('穹')){
name2=name.replace(/穹/g,'')
 switch (name2) {
    case '物理': 
    case '物主': 
    case '毁灭': 
      sr_id=3124
      break
    case '火主':
    case '存护':
      sr_id=3123
      break
    case '虚数':
    case '同谐':
    case '':
      sr_id=411
      break
    }
}
//处理三月七
if(name.includes('三月七')||name.includes('3月7')){
name2=name.replace(/三月七|3月7/g,'')
if(name2){
 switch (name2) {
    case '虚数': 
    case '巡猎': 
    case '仙舟': 
      sr_id=3121
      break
    }
   }
}



//调用小可莉原神别名
let gsnames=yaml.get('./plugins/xiaokeli/system/default/gs_js_names.yaml','utf-8')
   for (let i in Object.values(gsnames)) {
      if(Object.values(gsnames)[i].includes(name)) {
        name=Object.keys(gsnames)[i]
        break
      }
   }
//先查原神
let gs_id=(await mys.data(name)).id
let list=false
let img=false
let isSr=false
let data,yy,table
let background=path+'/plugins/xiaokeli/resources/yytable/bg0.png'
if(['4074','4073'].includes(gs_id)) background=path+'/plugins/xiaokeli/resources/yytable/bg.png'
if(gs_id) {
list=await yyjson.gs_download(gs_id)
if(!(list?.length>1)) return e.reply('暂时没有该角色语音💔')
table=list[0].table
img=await this.tu(e,table,name,background)
def=false
}

//非原神查星铁
 //调用喵崽别名
if(def){
if(!sr_id){
let _name = gsCfg.getRole(name)
if(_name.name != undefined & _name.name != "主角"){
      name = _name.name
}
sr_id=(await mys.data(name,'js',true)).id
}
if(sr_id){
let sr=await yyjson.sr_download(sr_id)
if(!sr?.table?.length) return e.reply('暂时没有该角色语音💔')
table=sr.table
yy=sr.sr_yy
background=path+'/plugins/xiaokeli/resources/yytable/sr.png'
img= await this.tu(e,table,name,background)
isSr=true
}
}

if(!isSr){
data={name,isSr,list}
}else{
data={name,isSr,table,yy}
}

if(img){
let kg=await this.check()
let time=kg.time
if(time==0||time>120) time=121

let f
if(time==121){
f=await e.reply(img)
}else{
f=await e.reply(img,false,{ recallMsg:time })
}

await redis.set(`xiaokeli_yy:${f.time}`,JSON.stringify(data),{EX: time })
return true
}
return false
}





async fsyy (e) {
  if (!e.source)  return false
  // if (Number(e.source.user_id) !== Bot.uin)   return false
  // if (!/^\[图片]$/.test(e.source.message)) return false
  let source
  if (e.isGroup) {
          source = (await e.group.getChatHistory(e.source ?.seq, 1)).pop()
        }else{
          source = (await e.friend.getChatHistory((e.source ?.time + 1), 1)).pop()
    }
  if (source.message.length!=1&&source.message[0].type!='image')  return false
  if(e.msg && e.msg.length>5) return false
  let xh=await (/\d+/).exec(e.msg)
  if(!xh) return false
  let n=xh-1
  let type
  if(/日语|日文/.test(e.msg)){
  type='日语'
  }else if(/汉语|中文|华语/.test(e.msg)){
  type='汉语'
  }else if(/外语|英语|英文/.test(e.msg)){
  type='英语'
  }else if(/韩语|韩文/.test(e.msg)){
  type='韩语'
  }else if(/^([0-9]|[0-9][0-9]|[1][0-9][0-9])$/.test(e.msg)){
  type='汉语'
  }else{ return false}
 
    
let data =await redis.get(`xiaokeli_yy:${source.time}`)
  if(!data) return false
  data=await JSON.parse(data)
  let name=data.name
  let isSr=data.isSr
  let list=data.list
  let table=data.table
  let yy=data.yy
  if(isSr) {
  let x
  switch (type) {
    case '汉语': {
      x=0
      break
    }
    case '英语': {
      x=1
      break
    }
    case '日语': {
      x=2
      break
    }
    case '韩语': {
      x=3
      break
    }
    default:
      return false
    }
  yy=yy[x][n]
  yy=yy.replace(/sourcesrc=|><\/audio><\/div>/g,'')
  }else{
  for(let v of list){
  if(v.tab_name==type){
  table=v.table
  break
    }
  }
 if(!table[n]) return e.reply('喂喂喂！你这序号不对吧🤔',true)
 yy=table[n].audio_url
 }
 if(!table[n]) return e.reply('喂喂喂！你这序号不对吧🤔',true)
  let kg=await this.check()
  if(table[n].content=='？？？') return logger.error('[小可莉]相关语言暂未公布')
   logger.mark(`\x1B[36m${yy}\x1B[0m`)
   //由于高版本QQ的私聊可能无法听取普通语音，所以在没开超清语音时，私聊bot发的语音采取低音质处理,至少我没有放弃私聊，好的该继续摆烂了
   let vo
   if(e.isGroup){
    if(kg.voice) vo=await uploadRecord(yy,0,false)
           else   vo=segment.record(yy)
   }else{
      vo=await uploadRecord(yy,0,!kg.voice)
   }
    await e.reply(`[简述]:${table[n].name}\n[内容]:${table[n].content.replace(/\n| /g,'')}`)
    e.reply(vo)
    return true;
  }




}


