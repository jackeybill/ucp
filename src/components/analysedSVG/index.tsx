import React from 'react'
import './styles.scss'


const formatStr = (s: string) => {
  return s
    ? s.slice(0,1).toUpperCase() + s.slice(1, s.length).toLowerCase().split("_").join(" ")
    : ''
}

const flattenAttributeIntoEntities = (inputData: any, result?: any, parentId?: number) => {
  if (!result) {
    result = []
  }
  for (let i=0; i<inputData.length; i++) {
    const element = inputData[i]
    if (parentId) {
      element.parentId = parentId
    }
    result.push(element)
    if (element.Attributes && element.Attributes.length >= 1) {
      flattenAttributeIntoEntities(element.Attributes, result, element.Id)
    }
  }
  return result
}

// const removeBoldSign = (str1: any) => {
//   str1.replace('. \\n<b>Objectives', '<b>Objectives')
//   while (str1.indexOf('<b>') !== -1) {
//     str1 = str1.replace('<b>', '');
//   }
//   while (str1.indexOf('</b>') !== -1) {
//     str1 = str1.replace('</b>', '');
//   }
//   return str1
// }

export interface SvgComponentProps {
  entityData: any;
  content: any;
  activeSection: string;
}
 
export interface SvgComponentState {
  
}
 
class SvgComponent extends React.Component<SvgComponentProps, SvgComponentState> {
  constructor(props: SvgComponentProps) {
    super(props);
    this.state = {

    };
  }
  componentDidMount() {
    this.refresh()
  }
  
  componentDidUpdate(prevProps: SvgComponentProps, newProps: any) {
    this.refresh()
    console.log( this.props)
  }

  refresh = () : void  => {
    const OFFSET_HEAD_TAIL = 8
    const svgNode: any = document.getElementById("svg-viewport")
    const verticalConnLineNodeList = svgNode!.getElementsByClassName("conn_line vertical")
    const svgLeftPadding = 30 + verticalConnLineNodeList.length * 12
    const svgLines = document.getElementsByClassName("svg_line")
    let y = 32
    let width = 400
    let height = 600
    const offsetX = (document.getElementById("svg-viewport")?.getBoundingClientRect().left || 0) + svgLeftPadding;

    for (let i=0; i<svgLines.length; i++) {
      // line
      const lineNode: any = svgLines[i]
      lineNode.setAttribute("transform", `translate(${svgLeftPadding}, 0)`)

      let x = 10  // x-axis of the text's outside wrapper
      let xText = 10 // x-axis of the text

      const textChunkNodeList = lineNode.getElementsByClassName("svg_text_chunk")
      for(let j=0; j<textChunkNodeList.length||0; j++) {
        const textChunkNode: any = textChunkNodeList[j]
        textChunkNode.setAttribute("transform", `translate(${textChunkNode.classList.contains("entity") ? x : xText})`)

        let textBoxWidth = 0
        if (textChunkNode.children[0] && textChunkNode.children[0].tagName === "text") {
          textBoxWidth = textChunkNode.children[0].getBBox().width
        }
        
        xText = x + textBoxWidth + 5
        x += textChunkNode.getBBox().width + 5
        
        for(let k=0; k<textChunkNode.children.length; k++) {
          const c = textChunkNode.children[k]
          if (c.tagName === "line") {
            c.setAttribute("x2", textBoxWidth-1.375+"")
          }
        }
      }

      const arrowHeadNodeList = lineNode.getElementsByClassName("arrowhead")
      let topY = -38
      for(let j=0; j<arrowHeadNodeList.length; j++) {
        topY = topY - 10
        const headArrowNode = arrowHeadNodeList[j]

        const { headId, tailId } = headArrowNode.dataset
        const headTextChunkNode = lineNode.querySelector(`#text_id_${headId}`)
        const tailTextChunkNode = lineNode.querySelector(`#text_id_${tailId}`)
        const headTextCenterX = headTextChunkNode.getBoundingClientRect().left + headTextChunkNode.getBoundingClientRect().width / 2 - offsetX - OFFSET_HEAD_TAIL
        headArrowNode.setAttribute('d', `M${headTextCenterX-3.5},-20L${headTextCenterX},-13L${headTextCenterX+3.5},-20`)
        headArrowNode.setAttribute('style', 'stroke: rgb(116, 184, 220); fill: rgb(116, 184, 220); stroke-width: 1; stroke-linejoin: miter; cursor: default;')

        const headLineNode = headArrowNode.nextElementSibling
        headLineNode.setAttribute('x1', headTextCenterX)
        headLineNode.setAttribute('x2', headTextCenterX)
        headLineNode.setAttribute('y1', -14)
        headLineNode.setAttribute('y2', topY+12)
        headLineNode.setAttribute('style', 'stroke: rgb(116, 184, 220); stroke-width: 1; cursor: default;')

        const headJointCurveNode = headLineNode.nextElementSibling
        headJointCurveNode.setAttribute(
          'd',
          headJointCurveNode.classList.contains('left-circle')
            ? `M${headTextCenterX},${topY+12}A12,12,0,0,1,${headTextCenterX+12},${topY}`
            : `M${headTextCenterX-12},${topY}A12,12,0,0,1,${headTextCenterX},${topY+12}`
        )
        headJointCurveNode.setAttribute('style', 'stroke: rgb(116, 184, 220); fill: none; stroke-width: 1; cursor: default;')   

        const connLineNode = headJointCurveNode.nextElementSibling
        connLineNode.setAttribute('style', 'stroke: rgb(116, 184, 220); stroke-width: 1; cursor: default;')

        // additional span-row relation's arrow arrow
        if (headArrowNode.classList.contains('cross_row_relation')) {
          connLineNode.setAttribute('d', `M12,${topY}L${headTextCenterX - 12},${topY}`)
          connLineNode.setAttribute('y', topY)
          continue
        }
        const tailTextCenterX = tailTextChunkNode.getBoundingClientRect().left + tailTextChunkNode.getBoundingClientRect().width / 2 - offsetX + OFFSET_HEAD_TAIL
        connLineNode.setAttribute(
          'd',
          headTextCenterX < tailTextCenterX
            ? `M${headTextCenterX+12},${topY}L${tailTextCenterX-12},${topY}`
            : `M${tailTextCenterX+12},${topY}L${headTextCenterX-12},${topY}`
        )
        
        const rectNode = connLineNode.nextElementSibling
        const relationLabelNode = rectNode.nextElementSibling
        relationLabelNode.firstElementChild.setAttribute('href', `#${connLineNode.id}`)
        rectNode.setAttribute('y', topY-6)
        rectNode.setAttribute('x', (headTextCenterX + tailTextCenterX) / 2 - relationLabelNode.getBBox().width / 2 - 1)
        rectNode.setAttribute('width', relationLabelNode.getBBox().width + 2)
        rectNode.setAttribute('height', 10)
        rectNode.setAttribute('fill', '#fafafa')
        rectNode.setAttribute('stroke', '#fafafa')

        const tailJointCurveNode = relationLabelNode.nextElementSibling
        // tailJointCurveNode.setAttribute('d', `M${tailJointCurveNode.classList.contains('left-circle')?(tailTextCenterX-12):(tailTextCenterX+12)},${topY}A12,12,0,0,1,${tailTextCenterX},${-26 - j * 10}`)
        tailJointCurveNode.setAttribute(
          'd',
          tailJointCurveNode.classList.contains('left-circle')
            ? `M${tailTextCenterX-12},${topY}A12,12,0,0,1,${tailTextCenterX},${topY+12}`
            : `M${tailTextCenterX},${topY+12}A12,12,0,0,1,${tailTextCenterX+12},${topY}`
        )
        tailJointCurveNode.setAttribute('style', 'stroke: rgb(116, 184, 220); fill: none; stroke-width: 1; cursor: default;')

        const tailLineNode = tailJointCurveNode.nextElementSibling
        tailLineNode.setAttribute('x1', tailTextCenterX)
        tailLineNode.setAttribute('x2', tailTextCenterX)
        tailLineNode.setAttribute('y1', -14)
        tailLineNode.setAttribute('y2', topY+12)
        tailLineNode.setAttribute('style', 'stroke: rgb(116, 184, 220); stroke-width: 1; cursor: default;')

        const tailArrowNode = tailLineNode.nextElementSibling
        tailArrowNode.setAttribute('d', `M${tailTextCenterX-3.5},-13L${tailTextCenterX},-20L${tailTextCenterX+3.5},-13`)
        tailArrowNode.setAttribute('style', 'stroke: rgb(116, 184, 220); fill: rgb(116, 184, 220); stroke-width: 1; stroke-linejoin: miter; cursor: default;')

      }

      // additional span-row relation's arrow tail
      const crossArrowTailNodeList = lineNode.getElementsByClassName("arrowtail cross_row_relation")
      crossArrowTailNodeList.length >= 1 && console.log(666666, crossArrowTailNodeList)
      for(let j=0; j<crossArrowTailNodeList.length; j++) {
        topY = topY - 10
        const crossArrowTailNode = crossArrowTailNodeList[j]
        const { headId, tailId } = crossArrowTailNode.dataset
        const tailTextChunkNode = lineNode.querySelector(`#text_id_${tailId}`)
        const textCenterX = tailTextChunkNode.getBoundingClientRect().left + tailTextChunkNode.getBoundingClientRect().width / 2 - offsetX
        crossArrowTailNode.setAttribute('d', `M${textCenterX-3.5},-13L${textCenterX},-20L${textCenterX+3.5},-13`)
        crossArrowTailNode.setAttribute('style', 'stroke: rgb(116, 184, 220); fill: rgb(116, 184, 220); stroke-width: 1; stroke-linejoin: miter; cursor: default;')

        const headLineNode = crossArrowTailNode.nextElementSibling
        headLineNode.setAttribute('x1', textCenterX)
        headLineNode.setAttribute('x2', textCenterX)
        headLineNode.setAttribute('y1', -14)
        headLineNode.setAttribute('y2', topY+12)
        headLineNode.setAttribute('style', 'stroke: rgb(116, 184, 220); stroke-width: 1; cursor: default;')

        const headJointCurveNode = headLineNode.nextElementSibling
        headJointCurveNode.setAttribute(
          'd',
          headJointCurveNode.classList.contains('left-circle')
            ? `M${textCenterX},${-26 - j * 10}A12,12,0,0,1,${textCenterX+12},${topY}`
            : `M${textCenterX-12},${topY}A12,12,0,0,1,${textCenterX},${topY+12}`
        )
        headJointCurveNode.setAttribute('style', 'stroke: rgb(116, 184, 220); fill: none; stroke-width: 1; cursor: default;')

        const connLineNode = headJointCurveNode.nextElementSibling
        connLineNode.setAttribute('style', 'stroke: rgb(116, 184, 220); stroke-width: 1; cursor: default;')
        connLineNode.setAttribute('d', `M12,${topY}L${textCenterX - 12},${topY}`)
        connLineNode.setAttribute('y', topY)
      }

      y += (30 + lineNode.getBBox().height)
      if (crossArrowTailNodeList.length >= 1 || lineNode.getElementsByClassName("arrowhead cross_row_relation").length >= 1) {
        y = y + 30
      }
      lineNode.setAttribute("transform", `translate(${svgLeftPadding}, ${y-22})`)
      lineNode.setAttribute("y", y)
      
      width = x > width ? x : width
      height = y > height ? y : height
      
    }


    // draw vertical relationship lines
    for (let i=0; i<verticalConnLineNodeList.length; i++) {
      const verticalConnLineNode = verticalConnLineNodeList[i]
      const { tailId, headId } = verticalConnLineNode.dataset
      const tailConnLineNode: any = document.getElementById(`relation_tail_horizontal_line_${tailId}_${headId}`)
      const headConnLineNode: any = document.getElementById(`relation_head_horizontal_line_${tailId}_${headId}`)
      const tailRowNode: any = tailConnLineNode!.parentElement
      const headRowNode: any = headConnLineNode!.parentElement
      const tailY = Number(tailRowNode!.getAttribute('y')) + Number(tailConnLineNode!.getAttribute('y'))-22
      const headY = Number(headRowNode!.getAttribute('y')) + Number(headConnLineNode!.getAttribute('y'))-22
      const y1 = Math.min(tailY, headY)
      const y2 = Math.max(tailY, headY)
      const x = svgLeftPadding - 6 - 12 * i

      verticalConnLineNode.setAttribute('d', `M${x},${y2-12}L${x},${y1+12}`)
      verticalConnLineNode.setAttribute('style', 'stroke: rgb(116, 184, 220); stroke-width: 1; cursor: default;')

      const connLineNode1 = verticalConnLineNode.nextElementSibling
      connLineNode1.setAttribute('y1', y1)
      connLineNode1.setAttribute('y2', y1)
      connLineNode1.setAttribute('x1', x+12)
      connLineNode1.setAttribute('x2', x+12*(i+1)+6)
      connLineNode1.setAttribute('style', 'stroke: rgb(116, 184, 220); stroke-width: 1; cursor: default;')

      const connLineNode2 = connLineNode1.nextElementSibling
      connLineNode2.setAttribute('y1', y2)
      connLineNode2.setAttribute('y2', y2)
      connLineNode2.setAttribute('x1', x+12)
      connLineNode2.setAttribute('x2', x+12*(i+1)+6)
      connLineNode2.setAttribute('style', 'stroke: rgb(116, 184, 220); stroke-width: 1; cursor: default;')

      const jointNode1 = connLineNode2.nextElementSibling
      jointNode1.setAttribute('d',`M${x},${y1+12}A12,12,0,0,1,${x+12},${y1}`)
      jointNode1.setAttribute('style', 'stroke: rgb(116, 184, 220); fill: none; stroke-width: 1; cursor: default;')

      const jointNode2 = jointNode1.nextElementSibling
      jointNode2.setAttribute('d',`M${x+12},${y2}A12,12,0,0,1,${x},${y2-12}`)
      jointNode2.setAttribute('style', 'stroke: rgb(116, 184, 220); fill: none; stroke-width: 1; cursor: default;')

      const rectNode = jointNode2.nextElementSibling
      const relationLabelNode = rectNode.nextElementSibling
      relationLabelNode.firstElementChild.setAttribute('href', `#${verticalConnLineNode.id}`)
      rectNode.setAttribute('y', (y1+y2)/2 - relationLabelNode.getBBox().height/2 -1 )
      rectNode.setAttribute('x', x - 6)
      rectNode.setAttribute('width', 10)
      rectNode.setAttribute('height', relationLabelNode.getBBox().height + 2)
      rectNode.setAttribute('fill', '#fafafa')
      rectNode.setAttribute('stroke', '#fafafa')
    }
    svgNode!.setAttribute("width", width.toString())
    svgNode!.setAttribute("height", height.toString())
  }

  render() {
    const svgRawData = []
    this.props.entityData.forEach((item, index)=> {
      svgRawData.push({entityData:item,content:this.props.content[index],activeSection:this.props.activeSection})
    })

    const svgData = []

    const getSvgData = (content, entities) => {
      const lines = []
      const entityLocation: any = {} // key: entity id;  value: line index
      const pendingEntities: any = [] // need to draw arrow tail
      const verticalRelations: Array<any> = []
  
      entities = entities.sort((e1: any, e2: any) => (e1.BeginOffset - e2.BeginOffset || e1.EndOffset - e2.EndOffset))
      let pos = 0
      let scanedEntitiesIndex = 0
  
      const findNextIncludingEntity = (last: number) => {
        let entity = entities[scanedEntitiesIndex]
        if (entity && entity.EndOffset <= last) {
          scanedEntitiesIndex++
          return entity
        }
        return null
      }
      const getSvgLine = (last: number) => {
        // deal with content[pos, cur]
        const gList = []
        let cur = pos
        const addedEntities: Array<any> = []
  
        let nextEntity = findNextIncludingEntity(last)
        while(nextEntity) {
          if(cur < nextEntity.BeginOffset) {
            gList.push(
              <g className="svg_text_chunk gap" data-start-offset={cur} data-end-offset={nextEntity.BeginOffset} style={{display:'inline-block',padding:'0 2px'}}>
                <text startOffset={cur-pos}>&nbsp;&nbsp;&nbsp;{content.slice(cur, nextEntity.BeginOffset)}&nbsp;&nbsp;&nbsp;</text>
                
              </g>
            )
            cur = nextEntity.BeginOffset
          } else {
            if (addedEntities.findIndex(e => e.Id === nextEntity.Id) === -1) {
              // Add entity text
              let color = "#1e8900" 
              if (nextEntity.Type.toLowerCase().includes('name')) {
                color = "#df3312"
              } else if (nextEntity.Type.toLowerCase().includes('time')) {
                color = "#CE6DBD"
              }
              if (nextEntity.SubChild) {
                let subColor = "#1e8900"
              
                 gList.push(
                  <g key={nextEntity.Id} className="svg_text_chunk entity"  style={{paddingLeft:2}}>
                    <text id={`text_id_${nextEntity.Id}`} className="entity_text_chunk" data-start-offset={nextEntity.BeginOffset} data-end-offset={nextEntity.EndOffset}>&nbsp;&nbsp;&nbsp;{nextEntity.Text}&nbsp;&nbsp;&nbsp;</text> 
                    <line strokeWidth="3" strokeLinecap="round" x1={2} y1={6} x2={3} y2={6} style={{ stroke: color }} data-start-offset={nextEntity.BeginOffset} data-end-offset={nextEntity.EndOffset}/>               
                     {
                       nextEntity.SubChild.map((c, idx) => {
                         const pxRatio = 7.6
                          if (c.Type.toLowerCase().includes('name')) {
                            subColor = "#0a69A0";
                          }else if (c.Type.toLowerCase().includes('time')) {
                            subColor = "#D64CCC";
                          }
                          return (
                            <g key={c.Id} data-start-offset={c.BeginOffset} data-end-offset={c.EndOffset}>
                             <line strokeWidth="3" strokeLinecap="round" x1={`${(Math.abs(c.BeginOffset - nextEntity.BeginOffset-1))*pxRatio}px`} y1={10} x2={`${(c.EndOffset - nextEntity.BeginOffset)*pxRatio}px`}y2={10} style={{ stroke: subColor }} />                   
                             <circle fill={subColor} cx="3" cy={20 + 10 * (idx + 1)} r="3"></circle>
                             <text fill="dimgrey" className="entity_label_text entity_label" x={9} y={20+10*(idx+1)} dy="0.35em" >&nbsp;&nbsp;&nbsp;{`${formatStr(c.Type)} (${c.Text})` }&nbsp;&nbsp;&nbsp;</text>                                         
                          </g>
                         )
                       })
                    }
                    <circle fill={color} cx="3" cy="20" r="3"></circle>             
                    <text fill="dimgrey" className="entity_label_text entity_label" x={9} y={20} dy="0.35em" >&nbsp;&nbsp;&nbsp;{`${formatStr(nextEntity.Type)} (${nextEntity.Text})` }&nbsp;&nbsp;&nbsp;</text>                     
                  </g>
              )            
              } else {
                 gList.push(
                  <g key={nextEntity.Id} className="svg_text_chunk entity" data-start-offset={nextEntity.BeginOffset} data-end-offset={nextEntity.EndOffset} style={{paddingLeft:2}}>
                    <text id={`text_id_${nextEntity.Id}`} className="entity_text_chunk" data-start-offset={nextEntity.BeginOffset} data-end-offset={nextEntity.EndOffset}>&nbsp;&nbsp;&nbsp;{nextEntity.Text}&nbsp;&nbsp;&nbsp;</text>                            
                    <line strokeWidth="3" strokeLinecap="round" x1={2} y1={6} x2={3} y2={6} style={{ stroke: color }} />              
                    <circle fill={color} cx="3" cy="15" r="3"></circle>              
                    <text fill="dimgrey" className="entity_label_text entity_label" x={9} y={15} dy="0.35em" >&nbsp;&nbsp;&nbsp;{`${formatStr(nextEntity.Type)} (${nextEntity.Text})` }&nbsp;&nbsp;&nbsp;</text>                     
                  </g>
              )           
              }         
              addedEntities.push(nextEntity)
              entityLocation[nextEntity.Id] = lines.length
            }
  
            cur = nextEntity.EndOffset
            nextEntity = findNextIncludingEntity(last)
          }
        }
        
        
        if (cur < last) {
          gList.push(
            <g className={`svg_text_chunk gap`} data-start-offset={cur} data-end-offset={last} style={{display:'inline-block',padding:'0 2px'}}>
              <text>&nbsp;&nbsp;&nbsp;{content.slice(cur, last)}&nbsp;&nbsp;&nbsp;</text>        
            </g>
          )
          cur = last
        }
        addedEntities
        .filter(item => item.Attributes)
        .forEach((item, idx) => {
          for (let i=0; i<item.Attributes.length; i++) {
            const childEntity = item.Attributes[i]
            // if relationship is in the same line
            if (addedEntities.findIndex(e => e.Id === childEntity.Id) >= 0) {
              // Add relationship arrow
              gList.push(<path className={`arrowhead relation_id_${childEntity.Id}_${item.Id}`} data-head-id={item.Id} data-tail-id={childEntity.Id}/>)
              gList.push(<line className={`head_line relation_id_${childEntity.Id}_${item.Id}`} data-head-id={item.Id} data-tail-id={childEntity.Id} />)
              gList.push(<path className={`joint_curve ${childEntity.BeginOffset > item.BeginOffset ? 'left-circle' : ''} relation_id_${childEntity.Id}_${item.Id}`} data-head-id={item.Id} data-tail-id={childEntity.Id} />)
              gList.push(<path className={`conn_line relation_id_${childEntity.Id}_${item.Id}`} data-head-id={item.Id} data-tail-id={childEntity.Id} id={`relation_id_${childEntity.Id}_${item.Id}`}/>)
              gList.push(<rect className="text_rect" style={{strokeWidth: 1, cursor: "default"}} />)
              gList.push(
                <text dy="3" className="relation_label" style={{fill: "dimgrey", display: "block", strokeWidth: 1, cursor: "default"}}>
                  <textPath startOffset="50%" className="relation_label_text" style={{textAnchor: "middle",fontSize:'9pt'}}>{formatStr(childEntity.RelationshipType)}</textPath>
                </text>
              )
              gList.push(<path className={`joint_curve ${childEntity.BeginOffset > item.BeginOffset ? 'left-circle' : ''} relation_id_${childEntity.Id}_${item.Id}`} data-head-id={item.Id} data-tail-id={childEntity.Id} />)
              gList.push(<line className={`tail_line relation_id_${childEntity.Id}_${item.Id}`} data-head-id={item.Id} data-tail-id={childEntity.Id} />)
              gList.push(<path className={`arrowtail relation_id_${childEntity.Id}_${item.Id}`} data-head-id={item.Id} data-tail-id={childEntity.Id} />)
            } else {
              // Relationship across different rows
              gList.push(<path className={`arrowhead cross_row_relation relation_id_${childEntity.Id}_${item.Id}`} data-head-id={item.Id} data-tail-id={childEntity.Id}/>)
              gList.push(<line className={`head_line relation_id_${childEntity.Id}_${item.Id}`} data-head-id={item.Id} data-tail-id={childEntity.Id} />)
              gList.push(<path className={`joint_curve relation_id_${childEntity.Id}_${item.Id}`} data-head-id={item.Id} data-tail-id={childEntity.Id} />)
              gList.push(<path className={`conn_line horizontal relation_id_${childEntity.Id}_${item.Id}`} data-head-id={item.Id} data-tail-id={childEntity.Id} id={`relation_head_horizontal_line_${childEntity.Id}_${item.Id}`}/>)
              verticalRelations.push(<path className={`conn_line vertical relation_id_${childEntity.Id}_${item.Id}`} data-head-id={item.Id} data-tail-id={childEntity.Id} id={`relation_id_${childEntity.Id}_${item.Id}`}/>)
              verticalRelations.push(<line className={`conn_line horizontal relation_id_${childEntity.Id}_${item.Id}`}/>)
              verticalRelations.push(<line className={`conn_line horizontal relation_id_${childEntity.Id}_${item.Id}`}/>)
              verticalRelations.push(<path className={`joint_curve left_circle relation_id_${childEntity.Id}_${item.Id}`}/>)
              verticalRelations.push(<path className={`joint_curve relation_id_${childEntity.Id}_${item.Id}`}/>)
              verticalRelations.push(<rect className={`text_rect`}/>)
              verticalRelations.push(
                <text dy="3" className="relation_label" style={{fill: "dimgrey", display: "block", strokeWidth: 1, cursor: "default"}}>
                  <textPath startOffset="50%" className="relation_label_text" style={{textAnchor: "middle",fontSize:'9pt'}}>{formatStr(childEntity.RelationshipType)}</textPath>
                </text>
              )
              // Record the entities which need to draw arrowtail
              pendingEntities.push(childEntity)
            }
          }
        })
        
        pos = cur
        return gList
      }
  
      let enterBreakIndex = content.indexOf('\n')
      // when there is only one paragraph
      if (enterBreakIndex == -1) {
         lines.push(getSvgLine(content.length))
      }
      
      while (enterBreakIndex !== -1) {
        lines.push(getSvgLine(enterBreakIndex))
        enterBreakIndex = content.indexOf('\n', enterBreakIndex + 1)
      }
  
      for (let childEntity of pendingEntities) {
        const lineNo = entityLocation[childEntity.Id]
        const tempLineChildren = lines[lineNo]
        tempLineChildren.push(<path className={`arrowtail cross_row_relation relation_id_${childEntity.Id}_${childEntity.parentId}`} data-head-id={childEntity.parentId} data-tail-id={childEntity.Id}/>)
        tempLineChildren.push(<line className={`head_line relation_id_${childEntity.Id}_${childEntity.parentId}`} data-head-id={childEntity.parentId} data-tail-id={childEntity.Id} />)
        tempLineChildren.push(<path className={`joint_curve relation_id_${childEntity.Id}_${childEntity.parentId}`} data-head-id={childEntity.parentId} data-tail-id={childEntity.Id} />)
        tempLineChildren.push(<path className={`conn_line horizontal relation_id_${childEntity.Id}_${childEntity.parentId}`} data-head-id={childEntity.parentId} data-tail-id={childEntity.Id} id={`relation_tail_horizontal_line_${childEntity.Id}_${childEntity.parentId}`}/>)
      }

      svgData.push({lines,verticalRelations})
    }

    svgRawData.map((item, index)=> {
      let content = item.content + '\n'
      let entities = item.entityData&&item.entityData.Entities?flattenAttributeIntoEntities(item.entityData.Entities||[]):[]
      getSvgData(content, entities)
    })
    
    return (
      <div>
        <div id="svg-wrapper" className="svg-view-container" style={{overflow: "scroll", maxWidth: '100%', background: "#fafafa"}}>
          <svg viewBox="0 0" id="svg-viewport" overflow="scroll" style={{ position: "relative", display: "block" }}>        
            { this.props.entityData.length<2?(svgData.slice(0,1).map((item, index)=>{
              return(
                <>
                {item.lines.map((line, idx) => <g key={`line-${idx}`} className="svg_line" style={{ display: 'inline-block' }}>{line}</g>)}
                {item.verticalRelations}
                <g key={`line-space`} className="svg_line" style={{ display: 'inline-block' }}></g>
              </>
              )
            })):(svgData.slice(1).map((item, index)=>{
              return(
                <>
                {item.lines.map((line, idx) => <g key={`line-${idx}`} className="svg_line" style={{ display: 'inline-block' }}>{line}</g>)}
                {item.verticalRelations}
                <g key={`line-space`} className="svg_line" style={{ display: 'inline-block' }}></g>
              </>
              )
            }))}
          </svg>
        </div>
      </div>
    )
  }
}
 
export default SvgComponent;

