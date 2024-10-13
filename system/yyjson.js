import fetch from 'node-fetch'

class yyjson {
  
async gs_download(id){
let url=`https://api-takumi-static.mihoyo.com/hoyowiki/genshin/wapi/entry_page?app_sn=ys_obc&entry_page_id=${id}`
let data =await (await fetch(url)).json()
let name =data.data.page.name
let n=14
if(name=='旅行者（空）'||name=='旅行者（荧）'){
n=10
}
data=data.data.page.modules[n].components[0].data
data=JSON.parse(data)
let list=data.list
return list
}

async sr_download(id){
let url=`https://api-static.mihoyo.com/common/blackboard/sr_wiki/v1/content/info?app_sn=sr_wiki&content_id=${id}`
  let SRdata  =await (await fetch(url)).json()
   // SRdata.data.content.contents[0].text
  SRdata=SRdata.data.content.contents
  let data=false
  let s
  for(let i of SRdata){
  s = i.text.replace(/[ ]|[\r\n]|\"/g,"");
  data = s.match(/<lidata-target=voiceTab.attrdata-index=(\d)class=obc-tmpl__switch-item>(.*?)<\/li>/g)
   if(data){
    break
   }
   }
 if(!data) return logger.error('该角色的语音还没有人上传，过几天再试试吧~')
 let  conent=[]
 let  name = data[0].match(/__voice-content>(.*?)<\/span>/g)
 let table=[]
 let v=0
 let k=0
for (let i of name){
i=i.replace(/__voice-content>|<\/span>/g,'')
table[v]={}
table[v]['name']=i
v++
if(v==name.length/2) break
}
k=v
let name_= data[4].match(/__voice-content>(.*?)<\/span>/g)
for (let i of name_){
i=i.replace(/__voice-content>|<\/span>/g,'')
table[v]={}
table[v]['name']=i
v++
if(v==k+(name_.length/2)) break
}
v=0
let content=data[0].match(/__voice-bottom>(.*?)<\/td><\/tr>/g)
for (let i of content){
i=i.replace(/__voice-bottom>|<\/td><\/tr>/g,'')
table[v]['content']=i
v++
}
let content_=data[4].match(/__voice-bottom>(.*?)<\/td><\/tr>/g)
for (let i of content_){
i=i.replace(/__voice-bottom>|<\/td><\/tr>/g,'')
table[v]['content']=i
v++
}
let sr_yy=[]
let n
for(let i=0;i<4;i++){
sr_yy[i]=data[i].match(/sourcesrc=https:\/\/act-upload.mihoyo.com\/sr-wiki\/(.*?)wav><\/audio><\/div>/g)
sr_yy[i].splice(k-1, k)
n=i+4
sr_yy[i]=sr_yy[i].concat(data[n].match(/sourcesrc=https:\/\/act-upload.mihoyo.com\/sr-wiki\/(.*?)wav><\/audio><\/div>/g))
}
let sr={
table,sr_yy
}
return sr
}





}

  
  
export default new yyjson()