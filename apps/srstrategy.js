import gsCfg from '../../genshin/model/gsCfg.js'
import {yaml} from '#xiaokeli'
import common from '../../../lib/common/common.js'
import fetch from 'node-fetch'
import _ from 'lodash'
import fs from 'fs'
import schedule from 'node-schedule'

let u = 'https://bbs-api.mihoyo.com/post/wapi/getPostFullInCollection?order_type=2&collection_id='
let path='./plugins/xiaokeli/resources/srstrategy'

let url_
export class srstrategy extends plugin {
  constructor () {
    super({
      name: '[小可莉]星铁攻略图',
      dsc: '星铁攻略图',
      event: 'message',
      priority: -99,
      rule: [
        {
          reg: '^(#|\\*)?(星铁)?更新\\S+攻略(图)?$',
          fnc: 'up'
        },
        {
          reg: '^(#|\\*)?(星铁)?\\S+攻略(图)?$',
          fnc: 'strategy'
        }
      ]
    })
     /** 定时任务 */
    this.task = {
      //每天夜晚4点20自动更新全部星铁攻略图,(￢_￢)
      cron:`0 20 4 * * ?`,
      name: "[小可莉]更新星铁所有角色的攻略图",
      fnc: () => this.sch(),
      log: true,
    };
  }
/** 初始化创建配置文件 */
  async init () {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path)
    }
/** 初始化子目录 */
    for (let subId of [0, 1, 2]) {
      let path_ = path + '/' + subId
      if (!fs.existsSync(path_)) {
        fs.mkdirSync(path_)
      }
    }
  }
  
  
  
/* 更新攻略 */
async up (e) {
let kg=await yaml.get('./plugins/xiaokeli/config/config.yaml')
if(!kg.srstrategy) return false
let name=e.msg.replace(/\*|#|星铁|更新|攻略|图/g,'')
if(name=='全部'||name=='所有') return this.sch(e)
 if(['物主','物理开拓者','毁灭开拓者','存护开拓者','同谐开拓者','火主','同谐主','巡猎三月七','仙舟三月七','存护三月七','三月七','乱破'].includes(name)){
//不处理
 }else{
 let _name = gsCfg.getRole(name)
if(_name.game=='sr'&&_name.name != undefined){
   name = _name.name
}else{
return false
}
}
let name_
//特殊处理
if(name=='丹恒•饮月') name='饮月'
if(name=='阮•梅') name='阮'
if(name=='托帕&账账') name='托帕'
let imgs=[]
//紫喵Azunya
let url=u+'2145977'
name_=await this.mz(name)
let tu = path+'/0/'+name_+'.jpg'
if(await this.getData(name_,url)){
  e.reply('正在更新该角色攻略，请稍等…')
logger.mark(`[小可莉]下载${name_}攻略1`)
  imgs.push(segment.image(tu))
}else{
logger.mark(`[小可莉]没有${name_}攻略1,作者大大还没有制作`)
}



//小橙子阿
url=u+'1998643'
name_=await this.mz(name,1)
tu = path+'/1/'+name_+'.jpg'
if(await this.getData(name_,url,1,60)){
logger.mark(`[小可莉]下载${name_}攻略2`)
 imgs.push(segment.image(tu))
}else{
logger.mark(`[小可莉]没有${name_}攻略2,作者大大还没有制作`)
}


// HoYo青枫
url=u+'1998324'
name_=await this.mz(name,2)
tu = path+'/2/'+name_+'.jpg'
if(await this.getData(name_,url,2)){
logger.mark(`[小可莉]下载${name_}攻略3`)
  imgs.push(segment.image(tu))
}else{
logger.mark(`[小可莉]没有${name_}攻略3,作者大大还没有制作`)
}



if(!imgs.length) return e.reply(`暂时没有发现${name}的攻略`)
e.reply(imgs)
}





//获取攻略
async strategy (e) {
let kg=await yaml.get('./plugins/xiaokeli/config/config.yaml')
 if(!kg.srstrategy) return false
 let name=e.msg.replace(/\*|#|星铁|攻略|图/g,'')
if(['物主','物理开拓者','毁灭开拓者','存护开拓者','同谐开拓者','火主','同谐主','巡猎三月七','仙舟三月七','存护三月七','乱破'].includes(name)){
 //不处理
 }else{
 let _name = gsCfg.getRole(name)
if(_name.game=='sr'&&_name.name != undefined){
   name = _name.name
}else{
return false
}
}
this.msg_=true
let name_
//特殊处理
if(name=='丹恒•饮月') name='饮月'
if(name=='阮•梅') name='阮'
if(name=='托帕&账账') name='托帕'
let imgs=[]

//紫喵Azunya
let url=u+'2145977'
name_=await this.mz(name)
let tu = path+'/0/'+name_+'.jpg'
if(fs.existsSync(tu)){
   imgs.push(segment.image(tu))
}else{
if(await this.getData(name_,url,false,20,e)){
logger.mark(`[小可莉]下载${name_}攻略1`)
imgs.push(segment.image(tu))
}
}

//小橙子阿
url=u+'1998643'
name_=await this.mz(name,1)
tu = path+'/1/'+name_+'.jpg'
if(fs.existsSync(tu)){
  imgs.push(segment.image(tu))
}else{
if(await this.getData(name_,url,1,60,e)){
logger.mark(`[小可莉]下载${name_}攻略2`)
imgs.push(segment.image(tu))
}
}

// HoYo青枫
url=u+'1998324'
name_=await this.mz(name,2)
tu = path+'/2/'+name_+'.jpg'
if(fs.existsSync(tu)){
   imgs.push(segment.image(tu))
}else{
if(await this.getData(name_,url,2,20,e)){
logger.mark(`[小可莉]下载${name_}攻略3`)
  imgs.push(segment.image(tu))
}
}

this.msg_=false
if(!imgs.length) return e.reply(`暂时没有发现${name}的攻略`)
await e.reply(imgs)
return true
}



/** 获取并下载图片 */
async getData (name,url,x=false,q_=20,e) {
    let response = await fetch(url)
    let  res = await response.json()
    res=res.data.posts
    let imgs=[]
    let sfPath=path+'/0/'+name+'.jpg'
    for(let val of res){
    if(val.post.subject.includes(name)){
    //小橙子阿,取前三个
    if(x==1){
      sfPath=path+'/1/'+name+'.jpg'
      let list=[]
      for (let n in val.image_list) {
        if(n<4) list.push(val.image_list[n])
      }
    val.image_list=list
    }
    if(x==2){
      sfPath=path+'/2/'+name+'.jpg'
    }
    imgs.push(_.maxBy(val.image_list, (v) => v.height).url)
    }
    }
    
    if(!imgs.length) return false
    let num,img,imgs_=[]
   //多个攻略,取最新的
    for(let i =0;i<imgs.length;i++){
    imgs_[i]=imgs[i].match(/https:\/\/upload-bbs.miyoushe.com\/upload\/(\d+)\/(\d+)\/(\d+)\//g).toString().replace(/https:\/\/upload-bbs.miyoushe.com\/upload|\//g,'')
    if(i==0){
    num=imgs_[0]
    img=imgs[0]
    }
    if(num<imgs_[i]){
    num=imgs_[i]
    img=imgs[i]
    }
    }
    if(this.msg_){
      e.reply('首次获取该角色攻略图需要下载资源,正在下载中,请稍等一下！', true, { recallMsg: 60 })
      this.msg_=false
    }
    //降低质量下载，保护内存，人人有责(●'◡'●)
    await common.downFile(img+`?x-oss-process=image//resize,s_1800/quality,q_${q_}/auto-orient,0/interlace,1/format,jpg`, sfPath)
    return true
 }
 
 
 
//更新全部攻略
async sch(e){
let kg=await yaml.get('./plugins/xiaokeli/config/config.yaml')
if(!kg.srstrategy) return false
let js = fs.readFileSync('./plugins/miao-plugin/resources/meta-sr/character/data.json','utf-8')
js=await JSON.parse(js)
let names=[]
for(let v in js){
names.push(js[v].name)
}
logger.mark(`\x1B[36m[小可莉]更新星铁所有角色攻略图\x1B[0m`)
if(e) e.reply('开始更新星铁所有角色攻略图')
names.push('火主','物主','同谐主')
for(let i of names){
if(i=='丹恒•饮月') i='饮月'
if(i=='阮•梅') i='阮'
if(i=='托帕&账账') i='托帕'
let i_
//紫喵Azunya
url_=u+'2145977'
i_=this.mz(i)
await this.getData(i_,url_)
//小橙子阿
url_=u+'1998643'
i_=this.mz(i,1)
await this.getData(i_,url_,1,60)
//HoYo青枫
url_=u+'1998324'
i_=this.mz(i,2)
await this.getData(i_,url_,2)
}
if(e) e.reply('星铁所有角色攻略图,更新完毕！！！')
logger.mark(`\x1B[36m[小可莉]更新星铁攻略图,更新完毕\x1B[0m`)
return false
}



//特殊名字处理
mz(name,x=0){
if(x==0){
if(['物主','物理开拓者','毁灭开拓者'].includes(name)) name='物主'
if(['存护开拓者','火主'].includes(name)) name='火主'
if(['同谐开拓者','同谐主'].includes(name)) name='同谐主'
if(['巡猎三月七','仙舟三月七','三月七·巡猎'].includes(name)) name='三月七·巡猎'
if(['存护三月七','三月七'].includes(name)) name='无处不在的三月七'
}
if(x==1){
if(['物主','物理开拓者','毁灭开拓者'].includes(name)) name='毁灭开拓者'
if(['存护开拓者','火主'].includes(name)) name='存护开拓者'
if(['同谐开拓者','同谐主'].includes(name)) name='同谐开拓者'
if(['巡猎三月七','仙舟三月七','三月七·巡猎'].includes(name)) name='三月七·巡猎'
if(['存护三月七','三月七'].includes(name)) name='三月七'
}
if(x==2){
if(['物主','物理开拓者','毁灭开拓者'].includes(name)) name='开拓者-毁灭'
if(['存护开拓者','火主'].includes(name)) name='开拓者-存护'
if(['同谐开拓者','同谐主'].includes(name)) name='开拓者-同谐'
if(['巡猎三月七','仙舟三月七','三月七·巡猎'].includes(name)) name='三月七-巡猎'
if(['存护三月七','三月七'].includes(name)) name='无处不在的三月七'
}
return name
}




}
