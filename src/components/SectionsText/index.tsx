import React from "react";
import { sectionOptions } from "../../pages/ProtocolSection";
import { CheckCircleFilled } from '@ant-design/icons'
import {ENDPOINT_SECTION,SCHEDULE_OF_ACTIVITIES} from "../../pages/ProtocolSection"
import TableTextWithEntity from "../../components/TableTextWithEntity";
import "./index.scss";

interface SectionTextIF {
  protocolSection?: string;
  sections?: any;
  fileReader?: any;
  file?:any;
  entity?:any
}

interface EndpointParagraphIF{
  name:string;
  text:string;
  type:string;
}

const SectionText = (props: SectionTextIF) => {
  const { protocolSection, sections, entity } = props;
  console.log( props)
  const key =
        props.fileReader.file.keyName ||
        Object.keys(props.fileReader.file)[0];
  return (
    <div className="section-text-container">
      {protocolSection == "includeAllText" ? (
        <div className="section-item">
          <div className="section-title">
            Complete Document
           </div>
        <div
          className="text"
          dangerouslySetInnerHTML={{ __html: `<pre>${props.fileReader.file[key]['includeAllText'][0].content}</pre>` }}
        ></div>
        </div> 
      ) : (
        <div>
          {sections.map((s) => {
            const displayTitle = sectionOptions.find((e) => e.value == s);
            const sectionTxt =
            props.fileReader.file[key][s] && (props.fileReader.file[key][s].length > 0 && props.fileReader.file[key][s][0].content.toString() !== "[object Object]"? props.fileReader.file[key][s][0].content
                : "")  
            const tableTxt =
            props.fileReader.file[key][s] && (props.fileReader.file[key][s].length > 0 && props.fileReader.file[key][s][0].content.toString() !== "[object Object]" && displayTitle.label == "SCHEDULE OF ACTIVITIES"? props.fileReader.file[key][s][0].table
                : "")                
            return (
              <div className="section-item" key={s}>
                <div className="section-title">
                  {displayTitle && displayTitle.label}
                </div>
                <div className="section-content">
                  {displayTitle && displayTitle.label == "SCHEDULE OF ACTIVITIES" &&Array.isArray(tableTxt)&& (
                    <pre>
                      <div className="content-table">
                        <table>
                          <tbody>
                            {
                                tableTxt.map((item, index) => {
                                  return (
                                    index < 1? (
                                      <tr>
                                      {
                                        item.map((iten, indey) => {
                                          return (
                                            <td>
                                              <span style={{display:"inline-block",width: "80px"}}>
                                                {iten}
                                              </span>
                                            </td>
                                          )
                                        })
                                      }
                                    </tr>
                                    ):(
                                      <tr>
                                      {
                                        item.map((iten, indey) => {
                                          return (
                                            indey < 1? (
                                              <td>
                                                <span style={{display:"inline-block",width: "180px", textAlign:"left"}}>
                                                  {iten}
                                                </span>
                                              </td>
                                            ) :(
                                              iten.startsWith("X")||iten==="(X)" ? (
                                                <td>
                                                  <CheckCircleFilled/>
                                                  {/* {iten.substr(1)} */}
                                                </td>
                                              ) : (
                                                iten.toString().length > 68? (
                                                  <td>
                                                    <span style={{display:"inline-block",width: "400px", textAlign:"left"}}>
                                                      {iten}
                                                    </span>
                                                  </td>
                                                ):(
                                                  indey === tableTxt[index].length-1?(
                                                    <td style={{textAlign:"left"}}>
                                                      <span >
                                                        {iten}
                                                      </span>
                                                    </td>
                                                  ):(
                                                    <td >
                                                      <span >
                                                        {iten}
                                                      </span>
                                                    </td>
                                                  )
                                                )
                                              )
                                            )
                                          )
                                        })
                                      }
                                    </tr>
                                    )
                                  )
                                })
                            }
                          </tbody>
                        </table>
                      </div>
                    </pre>
                  )}
                  {
                    s==ENDPOINT_SECTION&&props.file[key][s][0].tableResult&& (
                      <TableTextWithEntity
                      dataSource={props.file[key][s][0].tableResult}
                      showPlainText={true}
                      entity={entity}
                    />     
                    )
                  }
                  {
                    s==ENDPOINT_SECTION&&props.file[key][s][0].raw && !props.file[key][s][0].tableResult&& (
                      <div className="endpoint-raw-content">
                          {
                            props.file[key][s][0].raw && Object.values(props.file[key][s][0].raw.content).map((paragraph:EndpointParagraphIF,idx:number)=>{
                              console.log( paragraph.text)
                              const formattedText = paragraph.text&&paragraph.text.replace("\n",`<br/>&nbsp;&nbsp;&nbsp;&nbsp;<i class="my_symble">&#8226</i>&nbsp;&nbsp;`) || ""                          
                              return(  
                                <div className={paragraph.type==="heading"?"heading":"body"} key={idx}> 
                                  <div className="paragraph-name">{paragraph.name}</div>
                                  <div className="paragraph-text" dangerouslySetInnerHTML={{__html:formattedText}}></div>                                
                                </div>
                              )
                            })
                          }
                          </div>
                    )
                  }
                  {
                    s!==ENDPOINT_SECTION && s!==SCHEDULE_OF_ACTIVITIES && (<pre> <div>{sectionTxt}</div></pre>)
                  }
                  
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SectionText;
