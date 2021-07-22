import React, { useState, useEffect, useRef } from "react";
import { withRouter } from "react-router";
import { Radio, Checkbox, Button, Menu, Dropdown, message,Modal } from "antd";
import {
  SaveOutlined,
  DownOutlined,
  DownloadOutlined,
  CloseOutlined,
  LeftOutlined
} from "@ant-design/icons";
import { saveAs } from "file-saver";
import domtoimage from "dom-to-image-more";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { CSVLink, CSVDownload } from "react-csv";
import "svg2pdf.js";
import { connect } from "react-redux";
import { saveSvgAsPng } from "save-svg-as-png";
import { submitText } from "../../utils/ajax-proxy";
import SectionText from "../../components/SectionsText";
import Extraction from "../../components/Extraction";
import ExtractionTable from "../../components/ExtractionTable";
import * as fileActions from "../../actions/file.js";
import "./index.scss";

const baseUrl ="https://ucp-docs.s3.us-west-2.amazonaws.com/iso-service-dev/RawDocuments/"


const completeDocument = "includeAllText";

export const sectionOptions = [
  { label: "PROTOCOL TITLE", value: "protocolTitle" },
  { label: "BRIEF SUMMARY", value: "briefSummary" },
  { label: "INCLUSION CRITERIA", value: "inclusionCriteria" },
  { label: "EXCLUSION CRITERIA", value: "exclusionCriteria" },
  { label: "SCHEDULE OF ACTIVITIES", value: "scheduleActivities" },
  // {
  //   label: "OBJECTIVES, ENDPOINTS, ESTIMANDS",
  //   value: "objectivesEndpointsEstimands",
  // },
];
export const initSelectedSections = sectionOptions.map((s) => {
  return s.value;
});

const defaultExportOptions = ["JSON", "PNG", "CSV"];
const relationshipExportOptions = ["JSON", "PNG"];

const showStatusCircle = (text) => {
  if(text.toLowerCase().includes("complete")) {
    return <span className="status_circle complete_status"></span>
  } else if(text.toLowerCase().includes("progress")) {
    return <span className="status_circle inprogress_status"></span>
  } else {
    return <span className="status_circle"></span>
  }
}

const ProtocolSection = (props: any) => {
  if (!props.fileReader.file.txt)
    window.location.href = window.location.origin + "/overview";

  const activeTabKey = props.fileReader.activeTabKey;
  const fileName =
    (props.fileReader.file.s3_url &&
      props.fileReader.file.s3_url.split("/").slice(-1)[0]) ||
    "";
  const fname = fileName && fileName.split(".")[0];

  const file = props.fileReader.file;
  const key = file.keyName || Object.keys(file)[0] || "";

  const protocolStatus = props.location.state && props.location.state.status;
  const protocolTitleText = props.location.state && props.location.state.title;

  const [entities, setEntities] = useState([]);
  const [protocolSection, setProtocolSection] = useState("sections");
  const [sections, setSections] = useState(initSelectedSections);
  const [activeSection, setActiveSection] = useState("");
  const [format, setFormat] = useState("Export as");
  const [entity, setEntity] = useState("");
  const [formatOptions, setFormatOptions] = useState(defaultExportOptions);
  const [checkedSections, setCheckSections] = useState(initSelectedSections);
  const [pageNum, setPageNum] = useState(1)
  const [filePath, setFilePath] = useState("")
  const[isModalVisible,setIsModalVisible] = useState(false)
  
  useEffect(() => {
    if (props.fileReader.activeTabKey == "ENTITY RELATIONSHIPS") {
      setFormatOptions(relationshipExportOptions);
      setSections(checkedSections.filter( function(currentValue){
        return currentValue !== "scheduleActivities"
      } ))
    } else {
      setFormatOptions(defaultExportOptions);
      setSections(checkedSections)
    }
  }, [props.fileReader.activeTabKey]);

  useEffect(() => {
    if (props.location.pathname == "/extraction") {
      setProtocolSection("sections");
      setActiveSection(sections[0]);
    }
  }, [props.location.pathname]);

  useEffect(() => {
    if (props.location.pathname == "/extraction") {
      if (entity && activeSection && file[key][activeSection][0] && file[key][activeSection][0].comprehendMedical[entity]) {
        setEntities(file[key][activeSection][0] && file[key][activeSection][0].comprehendMedical[entity].Entities)
      } else if (entity && activeSection && file[key][activeSection][0] && file[key][activeSection][0].table) {
        setEntities(file[key][activeSection][0] && file[key][activeSection][0].table)
      }
      setPageNum(file[key][activeSection][0].pageNo )
    }
    
  }, [activeSection]);

  useEffect( ()=>{
    setFilePath(`${baseUrl}${fileName}#page=${pageNum}`)
  },[pageNum,fileName])
  const iframeStr = '<iframe src='+filePath+'></iframe>'; 
  
  const onIframe = ()=>{
    return  {__html: iframeStr}
  }

  const updateCurrentEntity = (e) => {
    setEntity(e);
  };

  const pdfExport = (e, fileName, sourceElement) => {
    // const width = sourceElement.clientWidth
    // const height = sourceElement.clientHeight
    // const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [height, width] });
    // pdf.autoPrint();
    // pdf.html(sourceElement, { html2canvas: { scale: 1,backgroundColor:'#ffffff', width,height}}).then(() => {
    //   pdf.save(fileName + ".pdf");
    // });

    var node = sourceElement;
    domtoimage
      .toPng(node)
      .then(function (dataUrl) {
        var img = new Image();
        img.src = dataUrl;
      })
      .catch(function (error) {
        console.error("oops, something went wrong!", error);
      });

    domtoimage.toBlob(sourceElement).then(function (blob) {
      saveAs(blob, fileName);
    }).catch(function (error) {
      console.error("oops, something went wrong!", error);
    });
  };

  const svgExport = () => {
    saveSvgAsPng(document.getElementById("svg-viewport"), fname + ".png", {
      backgroundColor: "#ffffff",
    });
  };

  const jsonExport = async (jsonData, filename) => {
    const json = JSON.stringify(jsonData);
    const blob = new Blob([json], { type: "application/json" });
    const href = await URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = fname + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const changeFormat = (e) => {
    setFormat(e.key);
    if (e.key == "PNG" && activeTabKey != "ENTITY RELATIONSHIPS") {
      const source = document.getElementById("pdf-content");
      pdfExport(e, fname, source);
    }
    if (e.key == "PNG" && activeTabKey == "ENTITY RELATIONSHIPS") {
      const source = document.getElementById("svg-viewport");
      svgExport();
    }
    if (e.key == "JSON") {
      const file = props.fileReader.file;
      const key = file.keyName || Object.keys(file)[0] || [];
      const jsonData = activeSection
        ? (activeSection === "scheduleActivities"&&file[key][activeSection][0]? file[key][activeSection][0].table : file[key][activeSection][0].comprehendMedical[entity].Entities)
        : file[key]["includeAllText"][0].comprehendMedical[entity].Entities;
      jsonExport(jsonData, fname);
    }
  };

  const exportMenu = () => {
    return (
      <Menu onClick={changeFormat}>
        {formatOptions.map((e) => {
          return e == "CSV" ? (
            <Menu.Item key={e}>
              <CSVLink
                data={entities ? entities : []}
                filename={fname + ".csv"}
              >
                CSV
              </CSVLink>
            </Menu.Item>
          ) : (
            <Menu.Item key={e}>{e}</Menu.Item>
          );
        })}
      </Menu>
    );
  };

  const onChange = (checkedValues) => {
    if (checkedValues) {
      setProtocolSection("sections");
    }
    setSections(checkedValues);  
    setCheckSections(checkedValues)  
  };

  const onHandleActiveSection = (s) => {
    setProtocolSection("sections");
    setActiveSection(s);   
  };

  const onRadioChange = (e) => {
    setProtocolSection(e.target.value);
    if (
      e.target.value == completeDocument &&
      props.location.pathname == "/protocol-sections"
    ) {
      setSections([]);
    }
    if (e.target.value == "sections") setSections(initSelectedSections);
  };

  function handleButtonClick(e) {
    if (format == "PNG") {
      if (activeTabKey == "ENTITY RELATIONSHIPS") {
        const source = document.getElementById("svg-viewport");
        svgExport();
      } else {
        const source = document.getElementById("pdf-content");
        pdfExport(e, fname, source);
      }
    }
    if (format == "JSON") {
      const file = props.fileReader.file;
      const key = file.keyName || Object.keys(file)[0] || [];
      const jsonData = activeSection
      ? (activeSection === "scheduleActivities"? file[key][activeSection][0].table : file[key][activeSection][0].comprehendMedical[entity].Entities)
      : file[key]["includeAllText"][0].comprehendMedical[entity].Entities;
      jsonExport(jsonData, fileName);
    }
  }

  const handleBeginExtraction = () => {
    props.history.push({
      pathname: "/extraction",
      state: {
        status: protocolStatus,
        title: protocolTitleText
      }
    })
    props.readFile({ activeTabKey: "ENTITY RECOGNITION" })
  }

  const handleSubmit = async () => {
    const path = props.fileReader.file["result_url"];
    const parambody = props.fileReader.updatedSection;
    const saveRes = await submitText(parambody, path);
    console.log("parambody:",parambody);
    console.log("path:",path);
    
    if (saveRes.statusCode == "200") {
      message.success("Submit successfully");
      setTimeout(() => {
        props.history.push("/overview");
      }, 2000);
    }
  };


  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <div className="protocol-section">
      <div className="section-header">
        <span className="file-name">
          {props.location.pathname === "/protocol-sections" && <span className="title_protocol_text_plain">{protocolTitleText}</span>}
          {props.location.pathname !== "/protocol-sections" &&
          protocolSection != completeDocument && (
              <span className="protocol-wrapper">
                <span
                className="back-btn"
                onClick={() => {props.history.push("/overview");props.readFile({ activeTabKey: "ENTITY RECOGNITION" })
              }}
                >
                  <LeftOutlined /> 
                  <i>Home</i>
                </span>
                <span className="title_protocol_text">{protocolTitleText}</span>
                <span className="title_status_icon">
                  {showStatusCircle(protocolStatus)}
                  {protocolStatus}
                </span>
              </span>
          )}
        </span>
        {props.location.pathname != "/protocol-sections" &&
          protocolSection != completeDocument && (
            <>
              <div className="extract-btn">
                <Dropdown.Button
                  overlay={exportMenu}
                  icon={<DownOutlined />}
                  onClick={handleButtonClick}
                >
                  {format == "CSV" ? (
                    <>
                      <DownloadOutlined />
                      <CSVLink
                        data={entities ? entities : []}
                        filename={fname + ".csv"}
                      >
                        CSV
                      </CSVLink>
                    </>
                  ) : (
                    <>
                      {" "}
                      <DownloadOutlined />
                      {format}
                    </>
                  )}
                </Dropdown.Button>
              </div>
            </>
          )}
      </div>
      <div className="section-body">
        {
          props.location.pathname == "/extraction" && <div className="section-header-bar">
            {
              activeSection=="scheduleActivities" && <Button type="primary"  onClick={()=>setIsModalVisible(true)}>View Source</Button> 
            }
          </div>
        }
        <div className="sidebar">
          {
            props.location.pathname == "/extraction" && <p className="extraction_p">PROTOCOL SECTIONS</p>
          }
          {
            props.location.pathname == "/protocol-sections" && <p className="normal_p">PROTOCOL SECTIONS</p>
          }
          {
            props.location.pathname == "/protocol-sections" &&props.fileReader.activeTabKey=="ENTITY RECOGNITION" && <span className="section-tip">Choose a section to begin entity extraction.</span>
          }
          {
            props.location.pathname == "/extraction" &&props.fileReader.activeTabKey=="ENTITY RECOGNITION" && <span className="section-tip">Choose a section to view entity extraction.</span>
          }
          {
            props.location.pathname == "/extraction" &&props.fileReader.activeTabKey=="ENTITY RELATIONSHIPS" && <span className="section-tip">Choose a section to view entity relationships.</span>
          }
          {
            props.location.pathname == "/extraction" && props.fileReader.activeTabKey=="VALIDATION" && <span className="section-tip">Choose a section to validate.</span>
          }
         
          {props.location.pathname == "/protocol-sections" && (
            <div className="doc-radio">
              <Radio
                value={completeDocument}
                onChange={onRadioChange}
                checked={protocolSection == completeDocument}
              >
                Complete Document
              </Radio>
              <br />
            </div>
          )}

          <div className="section-selection">
            <Radio
              value="sections"
              onChange={onRadioChange}
              checked={protocolSection == "sections"}
            >
              Key Sections
            </Radio>
            <br />
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
                {sections.length > 0 &&
                  sections.map((s, idx) => {
                    return (
                      <div
                        key={s}
                        className={`setion-li ${
                          s == activeSection ? "active" : ""
                        }`}
                        onClick={() => onHandleActiveSection(s)}
                      >
                        {idx + 1}. &nbsp;
                        {sectionOptions.filter((i) => i.value == s)[0].label}
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
              sections={
                protocolSection != completeDocument
                  ? sections
                  : [completeDocument]
              }
              fileReader={props.fileReader}
            />
          )}
          {props.location.pathname === "/extraction" && activeSection !== "scheduleActivities"&& checkedSections[0]!== "scheduleActivities" &&(
            <>
              <Extraction
                updateCurrentEntity={updateCurrentEntity}
                activeSection={activeSection ? activeSection : sections[0]}
              />
            </>
          )}
          {props.location.pathname === "/extraction" && (activeSection === "scheduleActivities"|| checkedSections[0]=== "scheduleActivities")&& (file[key]["scheduleActivities"]&&file[key]["scheduleActivities"][0]&&file[key]["scheduleActivities"][0].table&&file[key]["scheduleActivities"][0].table!=={}&&file[key]["scheduleActivities"][0].table[0])&&(
            <>
              <ExtractionTable
                updateCurrentEntity={updateCurrentEntity}
                activeSection={activeSection ? activeSection : sections[0]}
              />
            </>
          )}
        </div>
      </div>
      <div className="section-footer">
      {props.location.pathname == "/protocol-sections" &&
          protocolSection != completeDocument && (
            <div className="extract-btn">
              <Button
                className="cancel-btn"
                onClick={() => props.history.push("/overview")}
              >
                CANCEL
              </Button>
              <Button
                className="beginExtract-btn"
                type="primary"
                onClick={handleBeginExtraction}
              >
                BEGIN ENTITY EXTRACTION
              </Button>
            </div>
          )}
       {props.location.pathname == "/extraction" &&
          protocolSection != completeDocument && (
            <div className="extraction_operation_btn">
              {activeTabKey == "ENTITY RECOGNITION" && (
                <Button
                className="previous-btn"
                >
                </Button>
              )}
              {activeTabKey == "ENTITY RELATIONSHIPS" && (
                <Button
                className="previous-btn"
                onClick={() => props.readFile({ activeTabKey: "ENTITY RECOGNITION" })}  
                >
                  PREV: ENTITY RECOGNITION
                </Button>
              )}
              {activeTabKey == "VALIDATION" && activeSection !== "scheduleActivities" &&(
                <Button
                className="previous-btn"
                onClick={() => props.readFile({ activeTabKey: "ENTITY RELATIONSHIPS" })} 
                >
                  PREV: ENTITY RELATIONSHIPS
                </Button>
              )}
              {activeTabKey == "VALIDATION" && activeSection === "scheduleActivities" &&(
               <Button
               className="previous-btn"
               onClick={() => props.readFile({ activeTabKey: "ENTITY RECOGNITION" })}  
               >
                 PREV: ENTITY RECOGNITION
               </Button>
              )}
             <div className="right_area">
                {activeTabKey == "ENTITY RECOGNITION" && activeSection !== "scheduleActivities" &&(
                   <Button
                    className="next-btn"
                    onClick={() => props.readFile({ activeTabKey: "ENTITY RELATIONSHIPS" })} 
                  >
                    NEXT: ENTITY RELATIONSHIPS
                  </Button>
                )}
                {activeTabKey == "ENTITY RECOGNITION" && activeSection === "scheduleActivities" &&(
                   <Button
                   className="next-btn"
                   onClick={() => props.readFile({ activeTabKey: "VALIDATION" })} 
                 >
                   NEXT: VALIDATION
                 </Button>
                )}
                {activeTabKey == "ENTITY RELATIONSHIPS" && (
                      <Button
                      className="next-btn"
                      onClick={() => props.readFile({ activeTabKey: "VALIDATION" })} 
                    >
                      NEXT: VALIDATION
                    </Button>
                )}
                {activeTabKey == "VALIDATION" && (
                      <Button
                      className="next-btn"
                      >
                      </Button>
                )}
                {activeTabKey == "VALIDATION" ? (
                  <Button type="primary" className="validation-btn" onClick={handleSubmit}>
                    <SaveOutlined />
                    Submit
                  </Button>
                ) : (
                  <Button type="primary" className="validation-btn" onClick={handleSubmit}>
                    <SaveOutlined />
                    Validate and Submit
                  </Button>
                )}
             </div>
            </div>
          )}
      </div>

      <Modal title={protocolTitleText} wrapClassName="file-source-modal" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        <div className="iframe-wrapper" dangerouslySetInnerHTML={ onIframe() } />
      </Modal>
    </div>
  );
};

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
