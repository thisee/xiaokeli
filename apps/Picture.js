import common from '../../../lib/common/common.js'
export class guoqi extends plugin{
  constructor(e){
  super({
  name: '[小可莉]过期图片重发',
  dsc: '',
  event: 'message',
  priority: 1234,
  rule: [
    {
      reg: '^#?(过期|链接|大小)$',
      fnc: 'lj',
    },
    ]})
    
  }
  
async lj(e,gq=false) {
  let imageMessages = []
  let source
   if (e.source) {
      if (e.group?.getChatHistory) {
        // 支持at图片添加，以及支持后发送
        source = (await e.group.getChatHistory(e.source?.seq, 1)).pop()
      } else if (e.friend?.getChatHistory) {
        source = (await e.friend.getChatHistory((e.source?.time + 1), 1)).pop()
      }
    }
    if (source) {
      for (let val of source.message) {
        if (val.type === 'image') {
          imageMessages.push(val)
        }
        }
     }else{
       return false
     }
  
  if (imageMessages.length <= 0) {
    e.reply('消息中未找到图片...')
    return true
  }
  if(e.msg.includes('过期')) gq=true
  let msg = []
  let target
  if (e.isGroup) {
    target = e.group;
  } else {
    target = e.friend;
  }
  if(gq){
    for (let img of imageMessages) {
     msg.push(segment.image(img.url))
     }
     await e.reply(msg)
     await sleep(200);
     target.recallMsg(source.message_id)
     await sleep(200);
     target.recallMsg(e.message_id)
     return true
  }
  for (let i in imageMessages) {
    let index=Number(i)+1
    msg.push([`图片[${index}]：\n${imageMessages[i].url}\n大小:${Math.ceil(imageMessages[i].size/10000)/100}MB\n`,segment.image(imageMessages[i].url)])
  }
  msg=await common.makeForwardMsg(e, msg,'图片链接')
  e.reply(msg)
  return
  }
  
  
  
}

function sleep(ms) {//咋瓦鲁多函数，单位毫秒
  return new Promise((resolve) => setTimeout(resolve, ms));
}