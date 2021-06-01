import React, { useState, useEffect } from "react";
import { withRouter } from "react-router";
import { Radio, Checkbox, Button,Menu, Dropdown,message } from "antd";
import { SaveOutlined, DownOutlined, DownloadOutlined, CloseOutlined } from "@ant-design/icons";
import { jsPDF } from "jspdf";
import { connect } from "react-redux";
import { saveSvgAsPng } from "save-svg-as-png";
import { submitText } from '../../utils/ajax-proxy';
import SectionText from "../../components/SectionsText";
import Extraction from "../../components/Extraction";
import * as fileActions from "../../actions/file.js";
// import testData from "../../components/Extraction/text.json";



import "./index.scss";

const completeDocument = "includeAllText"
export const sectionOptions = [
  { label: "PROTOCOL TITLE", value: "protocolTitle" },
  { label: "BRIEF SUMMARY", value: "briefSummary" },
  {
    label: "OBJECTIVES, ENDPOINTS, ESTIMANDS",
    value: "objectivesEndpointsEstimands",
  },
  { label: "INCLUSION / EXCLUSION CRITERIA", value: "inclusionCriteria" },
  { label: "SCHEDULE OF ACTIVITIES", value: "scheduleActivities" },
];

const exportOptions = ["JSON", "PDF"]


const ProtocolSection = (props: any) => {
  if (!props.fileReader.file.txt) props.history.push("/overview");
  const activeTabKey = props.fileReader.activeTabKey
  const fileName =
    (props.fileReader.file.s3_url &&
      props.fileReader.file.s3_url.split("/").slice(-1)) ||
    "";
   
  const [protocolSection, setProtocolSection] = useState(completeDocument);
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState("");
  const [format, setFormat] = useState("Export as")
  const [entity, setEntity] = useState('')

   useEffect(() => {
    if (props.location.pathname == "/extraction") {
      setProtocolSection(completeDocument)
    }
    
   }, [props.location.pathname])
  
  const updateCurrentEntity = (e) => {
    setEntity(e) 
  }


  const pdfExport = (e,fileName,sourceElement) => { 
    const pdf = new jsPDF({ orientation: "landscape",unit:'px'})
    pdf.html(sourceElement, { html2canvas: { scale:0.5 } }).then(() => {
      pdf.save(fileName);
    });
  }

  const jsonExport = async(jsonData,filename) => {
      const json = JSON.stringify(jsonData);
      const blob = new Blob([json], { type: "application/json" });
      const href = await URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = fileName + ".json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  const changeFormat = (e) => {
    setFormat(e.key)
    if (e.key == 'PDF' && activeTabKey != "ENTITY RELATIONSHIPS") {
      const source = document.getElementById("pdf-content");
      pdfExport(e,fileName, source)
    }
    if (e.key == 'PDF' && activeTabKey == "ENTITY RELATIONSHIPS") {
      saveSvgAsPng(
        document.getElementById("svg-viewport"),
        fileName + ".png"
      );
    }
    if (e.key == 'JSON') {
      const file = props.fileReader.file
      const key = file.keyName || Object.keys(file)[0] || []
      const jsonData = activeSection ? file[key][activeSection][0].comprehendMedical[entity].Entities : file[key]["includeAllText"][0].comprehendMedical[entity].Entities
      jsonExport(jsonData,fileName)
    }
  }
  const exportMenu = () => {
    return (
      <Menu onClick={changeFormat}>
        {
          exportOptions.map(e => {
            return <Menu.Item key={e} >{ e}</Menu.Item>
          })
        }
      </Menu>
    )}
 
  const onChange = (checkedValues) => {
    if (checkedValues) {
      setProtocolSection("sections");
    }
    setSections(checkedValues);
  };
  const onHandleActiveSection = (s) => {
    setProtocolSection("sections")
    setActiveSection(s);
  };

  const onRadioChange = (e) => {
    setProtocolSection(e.target.value);
    if (e.target.value == completeDocument
      && props.location.pathname == "/protocol-sections") {
      setSections([]);
    }
  };
  function handleButtonClick(e) {
    if (format == 'PDF') {
      const source = activeTabKey == "ENTITY RELATIONSHIPS"?document.getElementById("svg-viewport"): document.getElementById("pdf-content");
      pdfExport(e,fileName,source)
    }
    if (format  == 'JSON') {
      const file = props.fileReader.file
      const key = file.keyName || Object.keys(file)[0] || []
      const jsonData = activeSection? file[key][activeSection][0].comprehendMedical[entity].Entities : file[key]["includeAllText"][0].comprehendMedical[entity].Entities  
      jsonExport(jsonData,fileName)
    }
}

  const handleSubmit = async () => {
    console.log(props.fileReader)
    const path = props.fileReader.file['result_url']
    const parambody = props.fileReader.updatedSection
  const saveRes = await submitText(parambody, path);
  if (saveRes.statusCode == "200") {
    message.success('Submit successfully')
  }
};

  console.log( protocolSection == completeDocument ? completeDocument : activeSection ? activeSection : sections[0])

  return (
    <div className="protocol-section">
      <div className="section-header">
        <span className="file-name">{fileName}</span>    
          {
            props.location.pathname == "/protocol-sections"? (  
              <div className="extract-btn">
                 <span className="cancel-btn"  onClick={() => props.history.push("/overview")}>Cancel</span>
                <Button
                  type="primary"
                  onClick={() => props.history.push("/extraction")}
                >
                  Begin Entity Extraction
                </Button>
               </div>
          ) : (
              <>
                <div className="extract-btn">
                  <Dropdown.Button overlay={exportMenu} icon={<DownOutlined />} onClick={handleButtonClick}  >
                    <DownloadOutlined />{format}
                  </Dropdown.Button>
                  {
                    activeTabKey=="VALIDATION"?( <Button
                    type="primary"
                    onClick={handleSubmit}
                  >
                    <SaveOutlined />Validate and Submit
                  </Button>):null
                  }
                 
                 
                </div>
                 <div className="back-btn" onClick={()=>props.history.push("/overview")}>
                    <CloseOutlined />
                  </div>
                </>
            )
          }
       
      </div>
      <div className="section-body">
        <div className="sidebar">
          <p>PROTOCOL SECTIONS</p>
          <span>Choose entity recognition to extract.</span>
          <div className="doc-radio">
            <Radio
              value={completeDocument}
              onChange={onRadioChange}
              checked={protocolSection == completeDocument}
            >
              Complete Document
            </Radio>
            <br />
            <span className="ins-tip">Instruction here</span>
          </div>
          <div className="section-selection">
            <Radio
              value="sections"
              onChange={onRadioChange}
              checked={protocolSection == "sections"}
            >
              Selected Sections
            </Radio>
            <br />
            <span className="ins-tip">Instruction here</span>
            {props.location.pathname == "/protocol-sections" && (
              <Checkbox.Group
                className="sections-checkbox"
                options={sectionOptions}
                onChange={onChange}
                value={sections}
              />
            )}
            {props.location.pathname == "/extraction" && (
              <div className="selected-section-list">
                {sections.length >0 && sections.map((s,idx) => {
                  return (
                    <div
                      key={s}
                      className={`setion-li ${
                        s == activeSection ? "active" : ""
                      }`}
                      onClick={() => onHandleActiveSection(s)}
                    >
                      {idx+1}. &nbsp;{sectionOptions.filter((i) => i.value == s)[0].label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="main-content">
          {props.location.pathname == "/protocol-sections" && (
            <SectionText
              protocolSection={protocolSection}
              sections={ protocolSection!= completeDocument? sections:[completeDocument] }
              fileReader={props.fileReader}
            />
          )}
          {props.location.pathname == "/extraction" &&
            <Extraction
            updateCurrentEntity={updateCurrentEntity}
            activeSection={protocolSection == completeDocument ? completeDocument : activeSection ? activeSection : sections[0]} />
          }
        </div>
      </div>
    </div>
  );
};

{/* <Extraction activeSection={protocolSection == completeDocument ? completeDocument : activeSection ? activeSection : sections[0]} /> */}

const mapDispatchToProps = (dispatch) => ({
  readFile: (val) => dispatch(fileActions.fileReader(val)),
});

const mapStateToProps = (state) => ({
  fileReader: state.fileReducer,
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(ProtocolSection));
