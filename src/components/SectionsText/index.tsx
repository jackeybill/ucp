import React from "react";
import { sectionOptions } from "../../pages/ProtocolSection";
import { CheckCircleFilled, CheckCircleOutlined, CheckCircleTwoTone} from '@ant-design/icons'
import "./index.scss";

interface SectionTextIF {
  protocolSection?: string;
  sections?: any;
  fileReader?: any;
}

// export const exceptionLabel = "INCLUSION / EXCLUSION CRITERIA";

const SectionText = (props: SectionTextIF) => {
  const { protocolSection, sections } = props;
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
            // let inclusionTxt;
            // let exclusionTxt;
            // let tableTxt;
            const displayTitle = sectionOptions.find((e) => e.value == s);
            const sectionTxt =
              props.fileReader.file[key][s].length > 0
                ? props.fileReader.file[key][s][0].content
                : "";
            // if (displayTitle && displayTitle.label == exceptionLabel) {
            //   inclusionTxt = props.fileReader.file[key]["inclusionCriteria"][0].content
            //   exclusionTxt = props.fileReader.file[key]["exclusionCriteria"][0].content
            // }
            if (displayTitle && displayTitle.label == "SCHEDULE OF ACTIVITIES") {
              console.log(sectionTxt);
              // tableTxt = sectionTxt
            }
            // function createMarkup() {
            //   return {__html: tableTxt};
            // }
            return (
              <div className="section-item" key={s}>
                <div className="section-title">
                  {displayTitle && displayTitle.label}
                </div>
                <div className="section-content">
                  {displayTitle && displayTitle.label == "SCHEDULE OF ACTIVITIES" ? (
                    // <>
                    //   <div className="inclusion-txt">{inclusionTxt}</div>
                    //   <div><pre>{exclusionTxt}</pre> </div>
                    // </>
                    // <div dangerouslySetInnerHTML={createMarkup()} className="content-table" />
                    <pre>
                      <div className="content-table">
                        <table>
                          <tbody>
                            {
                              sectionTxt.map((item, index) => {
                                return (
                                  index < 2? (
                                    <tr>
                                    {
                                      item.map((iten, indey) => {
                                        return (
                                          <td>{iten}</td>
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
                                            <td>{iten}</td>
                                          ) :(
                                            iten.startsWith("X") ? (
                                              <td>
                                                <CheckCircleFilled/>
                                                {/* {iten.substr(1)} */}
                                              </td>
                                            ) : (
                                              <td>{iten}</td>
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
                  ) : (
                    <pre> <pre>{sectionTxt}</pre></pre>
                  )}
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
