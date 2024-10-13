import fs from 'fs'
import YAML from 'yaml'

class yaml {

get(path){
let read
try{
read = fs.readFileSync(path, 'utf-8');
}catch(err){
logger.error(err)
return false
}
return YAML.parse(read)
}


set(path,keyname,value){
let read
try{
read = fs.readFileSync(path, 'utf-8');
}catch(err){
logger.error(err)
return false
}
let D=YAML.parseDocument(read)
try {
D.setIn(keyname.split('.'),value)
fs.writeFileSync(path,YAML.stringify(D),"utf-8");
}catch(err){
logger.error(err)
return false
}
}

add(path,keyname,value) {
let du
try{
du = fs.readFileSync(path, 'utf-8');
}catch(err){
logger.error(err)
return false
}
let dd=YAML.parse(du)
//避免手改yaml时，忘加[]
if(!Array.isArray(dd[keyname])) {
  let arr=[]
  arr.push(dd[keyname])
  dd[keyname]=arr
  du=YAML.stringify(dd)
}
let D=YAML.parseDocument(du)
try {
D.addIn(keyname.split('.'),value)
fs.writeFileSync(path,YAML.stringify(D),"utf-8");
}catch(err){
logger.error(err)
return false
}
}

del(path,keyname,value){
let read
try{
read = fs.readFileSync(path, 'utf-8');
}catch(err){
logger.error(err)
return false
}
let D=YAML.parse(read)
try {
//非[]，清掉后成空[]
if(!Array.isArray(D[keyname])) {
  let arr=[]
  arr.push(D[keyname])
  D[keyname]=arr
}
if(D[keyname].indexOf(value)!== -1){
D[keyname].splice(D[keyname].indexOf(value), 1)
logger.info('del is ok')
this.set(path,keyname,D[keyname])
}
}catch(err){
logger.error(err)
return false
}
}


}
  
  
export default new yaml()