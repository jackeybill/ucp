import React from "react";
import { sectionOptions } from "../../pages/ProtocolSection";
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
            let inclusionTxt;
            let exclusionTxt;
            let tableTxt;
            const displayTitle = sectionOptions.find((e) => e.value == s);
            const sectionTxt =
              props.fileReader.file[key][s].length > 0
                ? props.fileReader.file[key][s][0].content
                : "";
            // if (displayTitle && displayTitle.label == exceptionLabel) {
            //   inclusionTxt = props.fileReader.file[key]["inclusionCriteria"][0].content
            //   exclusionTxt = props.fileReader.file[key]["exclusionCriteria"][0].content
            // }
            // Mock data
            if (displayTitle && displayTitle.label == "SCHEDULE OF ACTIVITIES") {
              tableTxt = "<table><tr><th>Protocol Activity</th><th>Screen/</th><th></th><th></th><th></th><th></th><th>Treatment</th><th>Period</th><th></th><th></th><th>Post</th><th>Treatment</th></tr><tr><td></td><td>Baselinel (<28 days)</td><td></td><td>Cycle 1</td><td>Only</td><td>(Days 1</td><td>-21)</td><td>Cycle 2</td><td>and Subsequent (Days 1-21)</td><td>Cycles</td><td>End of Treatment</td><td>Follow-Up23</td></tr><tr><td></td><td></td><td>Day 1</td><td>Day 2</td><td>Day 4</td><td>Day 8</td><td>Day 15</td><td>Day 1</td><td>Day 8</td><td>Day 15</td><td></td><td></td></tr><tr><td>Visit Window (Days)</td><td></td><td></td><td></td><td>1</td><td>1</td><td>+2</td><td>2</td><td>+2</td><td>+2</td><td></td><td></td></tr><tr><td>Informed consent</td><td>X</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Tumor history</td><td>X</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Medical history</td><td>X</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Complete Physical Examination 5 including skin examination</td><td>X</td><td>X</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>X</td><td></td></tr><tr><td>Abbreviated Physical Examination including skin examination</td><td></td><td></td><td></td><td>X</td><td></td><td>X</td><td>X</td><td>X</td><td>X</td><td></td><td></td></tr><tr><td>Baseline signs and symptoms</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Height</td><td>X</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Weight</td><td>X</td><td>X</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>X</td><td></td></tr><tr><td>Vital signs</td><td>X</td><td>X</td><td></td><td>X</td><td></td><td>X</td><td>X</td><td>X</td><td>X</td><td>X</td><td>X</td></tr><tr><td>ECOG Performance status</td><td>X</td><td>X</td><td></td><td></td><td></td><td></td><td>X</td><td></td><td></td><td>X</td><td>X</td></tr><tr><td>12-Lead ECG</td><td>X</td><td>X</td><td></td><td></td><td></td><td></td><td>X</td><td>X</td><td></td><td>X</td><td></td></tr><tr><td>Laboratory</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Hematology</td><td>X</td><td></td><td></td><td>X</td><td></td><td>X</td><td>X</td><td>X</td><td>X</td><td>X</td><td></td></tr><tr><td>Blood Chemistry</td><td>X</td><td></td><td></td><td>X</td><td></td><td></td><td>X</td><td>X</td><td>X</td><td>X</td><td></td></tr><tr><td>Coagulation</td><td>X</td><td></td><td></td><td></td><td></td><td></td><td>X</td><td></td><td></td><td>X</td><td></td></tr><tr><td>Urinalysis\u00b9</td><td>X</td><td></td><td></td><td></td><td></td><td></td><td>X</td><td></td><td></td><td>X</td><td></td></tr><tr><td>Pregnancy test</td><td>X</td><td>X</td><td></td><td></td><td></td><td></td><td>X</td><td></td><td></td><td>X</td><td></td></tr><tr><td>Registration</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Study treatment</td><td></td><td></td><td></td><td></td><td></td><td></td><td>X</td><td></td><td></td><td></td><td></td></tr><tr><td>CT or MRI scan or equivalent</td><td>X</td><td></td><td></td><td></td><td></td><td></td><td>X (every 6 weeks)</td><td></td><td></td><td>X</td><td></td></tr><tr><td>CCI</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>CCI</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>CC</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>Adverse Events</td><td>X</td><td>X</td><td>X</td><td>X</td><td>X</td><td>X</td><td>X</td><td>X</td><td>X</td><td>X</td><td>X</td></tr><tr><td>Concomitant medications and non drug supportive interventions\u00b2</td><td>X</td><td>X</td><td>X</td><td>X</td><td>X</td><td>X</td><td>X</td><td>X</td><td>X</td><td>X</td><td>X</td></tr></table>"
            }
            function createMarkup() {
              return {__html: tableTxt};
            }
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
                    <div dangerouslySetInnerHTML={createMarkup()} className="content-table" />
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
