import fs from 'node:fs'
import yaml from './system/yaml.js'
var paths=['./plugins/xiaokeli/config/','./plugins/xiaokeli/temp/']

if (!global.core) {
  try {
    global.core = (await import("oicq")).core
  } catch (err) {}
}
paths.map((path)=>{          
if (!fs.existsSync(path)) {
  fs.mkdirSync(path)
}})
let _path='./plugins/xiaokeli/config/config.yaml'
if (!fs.existsSync(_path)) {
fs.cpSync('./plugins/xiaokeli/system/default/config.yaml',_path)
logger.info('[小可莉]配置文件初始化')
}
let cfg=yaml.get(_path)
let def_cfg=yaml.get('./plugins/xiaokeli/system/default/config.yaml')

if(Object.keys(cfg).length!= Object.keys(def_cfg).length){
fs.cpSync('./plugins/xiaokeli/system/default/config.yaml',_path)
logger.info('[小可莉]重载配置文件')
for(let v in cfg){
yaml.set(_path,v,cfg[v])
}
}

if (!global.segment) {
  global.segment = (await import("oicq")).segment
}

const files = fs.readdirSync('./plugins/xiaokeli/apps').filter(file => file.endsWith('.js'))

let ret = []

logger.info('------(´-﹏-`；)------')
logger.info('\x1B[36m小可莉插件正在载入...\x1B[0m')
logger.info('------------------------')

files.forEach((file) => {
  ret.push(import(`./apps/${file}`))
})

ret = await Promise.allSettled(ret)

let apps = {}
for (let i in files) {
  let name = files[i].replace('.js', '')

  if (ret[i].status != 'fulfilled') {
    logger.error(`载入插件错误：${logger.red(name)}`)
    logger.error(ret[i].reason)
    continue
  }
  apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}
export { apps }
