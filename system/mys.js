import fetch from 'node-fetch'

class mys{
//图鉴
async  tujian(isSr=false){
  let url='https://api-takumi-static.mihoyo.com/common/blackboard/ys_obc/v1/home/content/list?app_sn=ys_obc&channel_id=189'
  if(isSr) url='https://api-static.mihoyo.com/common/blackboard/sr_wiki/v1/home/content/list?app_sn=sr_wiki&channel_id=17'
    let res = await fetch(url).then(res => res.json())
    if(!res) {
      logger.error('米游社访问失败')
      return false
    }
    let children=res.data.list[0].children
    let data={}
    children.map((va)=>{
      if(va.name=='角色') data['js_list']=va.list
      if(va.name=='武器') data['wq_list']=va.list
      if(va.name=='圣遗物') data['syw_list']=va.list
      if(va.name=='光锥') data['gz_list']=va.list
      if(va.name=='遗器') data['yq_list']=va.list
    })
    return data
}
/*
原神
js,wq,syw 角色,武器,圣遗物 默认js
获取角色特有id,图标,星级,元素,武器类型
获取武器特有id,图标,星级,武器类型
获取圣遗物特有id,图标
传name回一个，不传name回全部(包括名字)

星铁
js,gz,yq 角色,光锥,遗器
获取角色id,图标,星级,属性,命途
获取武器id,图标,星级,命途
获取遗器id,图标
*/
async data(name='',type='js',isSr=false){
    let data = await this.tujian(isSr)
    if(!data) return false
    let list = data.js_list
  switch (type) {
    case 'wq': 
      list=data.wq_list
      break
    case 'syw': 
      list=data.syw_list
      break
    case 'gz':
      list=data.gz_list
      break
    case 'yq':
      list=data.yq_list
    }
    let text
  if(name){
    let id,icon,ji,yuansu,wuqi,shux,mingtu
    for (let va of list) {
      id=va.content_id
      icon=va.icon
    if(type!='syw'){
      text=JSON.parse(va.ext)
      text=text.c_25 || text.c_5 || text.c_19 || text.c_18
      text=text.filter.text
     if(type!='wq'){
      for (let s of text) {
        if(s.includes('星级')) ji=s.replace(/星级\//,'')
        if(s.includes('元素')&&name!='旅行者（荧）'&&name!='旅行者（空）') yuansu=s.replace(/元素\//,'')
        if(s.includes('武器')) wuqi=s.replace(/武器\//, '')
        if(s.includes('属性')) shux=s.replace(/属性\//, '')
        if(s.includes('命途')) mingtu=s.replace(/命途\//, '')
      }}else{
        for (let s of text) {
        if(s.includes('武器星级')) ji=s.replace(/武器星级\//,'')
        if(s.includes('武器类型')) wuqi=s.replace(/武器类型\//, '')
       }
      }
      }
      
      if(va.title.replace(/ /g,'')==name) return { id,icon,ji,yuansu,wuqi,shux,mingtu}
    }
    return false
  }else{
    let names=[],ids=[],icons=[],jis=[],yuansus=[],wuqis=[],shuxs=[],mingtus=[]
    for (let n in list) {
      names.push(list[n].title.replace(/ /g,''))
      ids.push(list[n].content_id)
      icons.push(list[n].icon)
    if(type!='syw'){
      text=JSON.parse(list[n].ext)
      text=text.c_25 || text.c_5 || text.c_19 || text.c_18
      text=text.filter.text
    if(type!='wq'){
      for (let s of text) {
        if(s.includes('星级')) jis.push(s.replace(/星级\//,''))
        if(s.includes('元素')&&name!='旅行者（荧）'&&name!='旅行者（空）') yuansus.push(s.replace(/元素\//,''))
        if(s.includes('武器')) wuqis.push(s.replace(/武器\//, ''))
        if(s.includes('属性')) shuxs.push(s.replace(/属性\//, ''))
        if(s.includes('命途')) mingtus.push(s.replace(/命途\//, ''))
       }
      }else{
         for (let s of text) {
        if(s.includes('武器星级')) jis.push(s.replace(/武器星级\//,''))
        if(s.includes('武器类型')) wuqis.push(s.replace(/武器类型\//, ''))
       }
      }
    }
    
    }
    return { names,ids,icons,jis,yuansus,wuqis,shuxs,mingtus}
   }
}
//获取详细信息
async detail(id,isSr=false){
  let url=`https://api-takumi-static.mihoyo.com/hoyowiki/genshin/wapi/entry_page?app_sn=ys_obc&entry_page_id=${id}`
  if(isSr) url=`https://api-static.mihoyo.com/common/blackboard/sr_wiki/v1/content/info?app_sn=sr_wiki&content_id=${id}`
  let res = await fetch(url).then(res => res.json())
  if(!res) {
      logger.error('米游社访问失败')
      return false
    }
  return res.data
}


}
export default new mys()

