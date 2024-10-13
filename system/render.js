async function render(path,data_,cfg){
  let tplFile=process.cwd()+'/plugins/xiaokeli/resources/'+path+'.html'
  let {e}=cfg
   if (!e.runtime) {
      logger.error('未找到e.runtime')
    }
  return e.runtime.render('小可莉',path, data_,{
      retType:cfg.ret ? 'default' : 'base64',
      beforeRender ({ data }) { 
      return{
        sys: {scale:`style=transform:scale(${cfg.pct})`},
        ...data_,
       tplFile:tplFile,
       saveId:path.split('/')[path.split('/').length-1]
          }
      }
  })
}
export default render