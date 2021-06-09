import React from "react";
import { sectionOptions } from "../../pages/ProtocolSection";
import "./index.scss";

interface SectionTextIF {
  protocolSection?: string;
  sections?: any;
  fileReader?: any;
}

export const exceptionLabel = "INCLUSION / EXCLUSION CRITERIA";

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
            let inclusionTxt;
            let exclusionTxt;
            const displayTitle = sectionOptions.find((e) => e.value == s);
            const sectionTxt =
              props.fileReader.file[key][s].length > 0
                ? props.fileReader.file[key][s][0].content
                : "";
            if (displayTitle && displayTitle.label == exceptionLabel) {
              inclusionTxt = props.fileReader.file[key]["inclusionCriteria"][0].content
              exclusionTxt = props.fileReader.file[key]["exclusionCriteria"][0].content
            }
            return (
              <div className="section-item" key={s}>
                <div className="section-title">
                  {displayTitle && displayTitle.label}
                </div>
                <div className="section-content">
                  {displayTitle && displayTitle.label == exceptionLabel ? (
                    <>
                      <div className="inclusion-txt">{inclusionTxt}</div>
                      <div><pre>{exclusionTxt}</pre> </div>
                    </>
                  ) : (
                    <> <pre>{sectionTxt}</pre></>
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
