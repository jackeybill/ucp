import React, { useState, useEffect, useRef } from "react";
import { withRouter } from "react-router";
import { Tabs, Input, Select, message, Button, Tooltip } from "antd";
import {
  EyeOutlined,
  ApartmentOutlined,
  UserAddOutlined,
  SearchOutlined,
  CheckCircleFilled,
  CheckCircleTwoTone
} from "@ant-design/icons";
import { connect } from "react-redux";
import * as fileActions from "../../actions/file.js";
import { saveText } from "../../utils/ajax-proxy";
import { formatWord } from "../TextWithEntity";
import {
  sectionOptions,
  initSelectedSections,
} from "../../pages/ProtocolSection";
import SvgComponent from "../analysedSVG";
import SuccessIcon from "../../assets/success.svg";
import WarnIcon from "../../assets/warn.svg";
import TextWithEntity from "../TextWithEntity";
import "./index.scss";

interface markIF {
  id: string;
  type: string;
  text: string;
  category: string;
  children: Array<any>;
}
const { TabPane } = Tabs;
const { Option } = Select;
const entityOptions = ["Entities", "ICD-10-CM", "RxNorm", "MedDRA"];
const headData = ["Screening",	"Treatment Period", "Post Treatment", "Early Termination","Follow-Ups"]
const categoryType = ["LABS", "PHYSICAL_EXAMINATION", "PROCEDURES", "STUDY_PROCEDURES", "QUESTIONNAIRES", "ACTIVITY"]
 // filter the [object] matched the table cell
 const soaEntity = (iten, soaResult) => {
  return soaResult.filter(function(currentValue, index, arr){
    return currentValue.key === iten;
  })
}

// className for searching result
const matchWord = (iten, searchTxt) => {
  return iten
  .toLowerCase()
  .indexOf(searchTxt.toLowerCase()) > -1
  ? "matched-word"
  : ""
}

const ExtractionTable = (props: any, ref) => {
  if (!props.fileReader.file.txt) {
    window.location.href = window.location.origin + "/overview";
  }
  const initEntity = entityOptions[0];
  const allEntity = "Entities";
  const { activeSection } = props;
  const file = props.fileReader.file;

  const key = file.keyName || Object.keys(file)[0] || [];
  let initContent = file[key][activeSection][0].table;

  const path = file["result_url"];
  const [entity, setEntity] = useState(initEntity);
  const [currentLabel, setCurrentLabel] = useState("");
  const [activeType, setActiveType] = useState("");
  // const [iconType, setIconType] = useState("X");
  const [searchTxt, setSearchTxt] = useState("");
  const [activeTabKey, setActiveTabKey] = useState(
    props.fileReader.activeTabKey
  );
  let [content, setContent] = useState(initContent);
  const [entityTypes, setEntityTypes] = useState([]);

  // const allWordsCollection = file[key][activeSection][0].comprehendMedical["Entities"].label
  // const allSummary = file[key][activeSection][0].comprehendMedical["Entities"].Summary;

  const initSvgEntity =
  file[key][activeSection][0].comprehendMedical && file[key][activeSection][0].comprehendMedical["Entities"];
  const [svgEntity, setSvgEntity] = useState(initSvgEntity);

  const initLabels =
  file[key][activeSection][0].comprehendMedical[entity] && file[key][activeSection][0].comprehendMedical[entity].label || {};
  const [labels, setLabels] = useState(initLabels); // labels and wordsColelction are same now
  const [wordsCollection, setWordsCollection] = useState(initLabels);
  const entities =
  file[key][activeSection][0].comprehendMedical[entity] && file[key][activeSection][0].comprehendMedical[entity].Entities || {};
  const firstMarkId = initLabels && initLabels.length > 0 && initLabels[0].id;
  const summary = file[key][activeSection][0].comprehendMedical[entity] && file[key][activeSection][0].comprehendMedical[entity].Summary || {};

  const initSoaResult = file[key][activeSection][0].soaResult || [];
  const [soaResult, setSoaResult] = useState(initSoaResult);
  const initSoaSummary = file[key][activeSection][0].soaSummary && file[key][activeSection][0].soaSummary || {};
  const [soaSummary, setSoaSummary] = useState(initSoaSummary);
  const xPos = file[key][activeSection][0].xPos && file[key][activeSection][0].xPos - 1 || 2;
  const [currentScore, setCurrentScore] = useState(1)
  const [currentId, setCurrentId] = useState(null)
  const saveParamsObj = {
    key,
    entity,
    activeSection,
    path,
  };


  useEffect(() => {
    const getAllEntityTypes = (obj, sections, entity) => {
      const summaryCollection = [];
      sections.forEach((k) => {
        entity.forEach((en) => {
          obj[k][0] && obj[k][0].comprehendMedical[en]&&
            summaryCollection.push(obj[k][0].comprehendMedical[en].Summary);
        });
      });
      const keys = [];
      summaryCollection.forEach((s) => {
        if (s && Object.keys(s).length > 0) keys.push(Object.keys(s));
      });
      return Array.from(new Set(keys.flat()));
    };

    if (file[key]) {
      let entities = getAllEntityTypes(
        file[key],
        initSelectedSections,
        entityOptions
      );
      setEntityTypes(entities);
    }
  }, [file[key]]);

  useEffect(() => {
    setActiveType("");
    // setContent(file[key][activeSection][0].table);
    setLabels(file[key][activeSection][0].comprehendMedical[entity]&&file[key][activeSection][0].comprehendMedical[entity].label);
    setWordsCollection(
      file[key][activeSection][0].comprehendMedical[entity]&&file[key][activeSection][0].comprehendMedical[entity].label
    );
    setSoaResult(file[key][activeSection][0].soaResult&&file[key][activeSection][0].soaResult)
    setSoaSummary(file[key][activeSection][0].soaSummary && file[key][activeSection][0].soaSummary)
    const paramBody = {
      [key]: {
        [activeSection]: [
          {
            soaResult: soaResult,
            table:content,
          },
        ],
      },
    };
    props.readFile({
      updatedSection: paramBody,
    });
  }, [activeSection, entity, labels ,content, file[key][activeSection][0].soaSummary]);

  useEffect(() => {
    props.updateCurrentEntity(entity);
  }, []);

  useEffect(() => {
    // const tmpWords = content.split(" ").map((w, idx) => {
    //   const wObj = {
    //     id: idx,
    //     type: "span",
    //     text: w,
    //   };
    //   return wObj;
    // });

    // labels &&
    //   labels.forEach((l) => {
    //     if (l.children && l.children.length > 0) {
    //       const startId = l.children[0].id;
    //       tmpWords.splice(startId, l.children.length, l);
    //     }
    //   });

    setWordsCollection(labels);
    props.updateCurrentEntity(entity);
    setSvgEntity(file[key][activeSection][0].comprehendMedical["Entities"]);
    setActiveTabKey(props.fileReader.activeTabKey)
  }, [entity, activeSection, labels, activeTabKey,props.fileReader.activeTabKey, props.fileReader.file]);

  // The table cell without underlining
  const renderPlainText = (iten) => {
    return (
      <span className={`key-word ${searchTxt && matchWord(iten, searchTxt)}`}>
        {iten}
      </span>
    )
  }

  // The table cell underlined
  const renderMarkText = (iten) => {
    return (
      <mark>
        <span className={`key-word ${soaEntity(iten, soaResult)[0].category} ${searchTxt && matchWord(soaEntity(iten, soaResult)[0].key, searchTxt)}`}>
          {soaEntity(iten, soaResult)[0].key}
        </span>
        <span className={`cate-label ${searchTxt && matchWord(soaEntity(iten, soaResult)[0].value, searchTxt)}`}>
            {`${soaEntity(iten, soaResult)[0].category?formatWord(soaEntity(iten, soaResult)[0].category):""} ${soaEntity(iten, soaResult)[0].value?("("+soaEntity(iten, soaResult)[0].value+")"):""}`}
        </span>
      </mark>
    )
  }

  const renderTooltipTitle = (
    word,
    currentId,
    currentScore,
    currentLabel,
    onCategoryChange,
    categoryType,
    wordsCollection,
    updateWordsCollection,
    saveParamsObj,
    handleSaveContent,
    readFile,
    fileReader,
    entity
  ) => {
    const id = word.key;
    let text = word.key
    
    return (
      <div className="mark-tooltip-container">
        <div className="highlighted-text">
          {text}
        </div>
        <div className="score">
          Confidence Score:
          {
            <span className="suc">100%</span>
          }
        </div>
        <div className="type-selector">
          Change Entity Type
          <Select
            value={word.category}
            style={{ width: 200 }}
            onChange={(v)=>onCategoryChange(id,v)}
          >
            {categoryType.map((i,idx) => {
              return (
                <Option value={i} key={i}>
                  {formatWord(i)}
                </Option>
              );
            })}
          </Select>
          <br />
          <span
            className="remove-btn"
            onClick={(e) =>
              hanldeRemoveCategory(id, wordsCollection, updateWordsCollection, saveParamsObj,readFile,fileReader)
            }
          >
            Remove Entity
          </span>
        </div>
        <div className="bottom">
          <Button
            type="primary"
            onClick={() =>
              handleSaveContent(
                id,
                currentScore,
                currentLabel,
                wordsCollection,
                updateWordsCollection,
                saveParamsObj
              )
            }
          >
            Save
          </Button>
        </div>
      </div>
    );
  };
  
  const hanldeRemoveCategory = async(mid, wordsCollection, updateWordsCollection,saveParamsObj,readFile,fileReader) => {
   
    // const tempWordsCollection = wordsCollection.slice(0);
    // const startWordIdx = tempWordsCollection.findIndex((wObj) => {
    //   return wObj.type == "mark" && wObj.id == mid;
    // });
    // const targetWordObj = tempWordsCollection[startWordIdx];
    // const childrenItem = targetWordObj.children;
    // tempWordsCollection.splice(startWordIdx, 1, ...childrenItem);
    // updateWordsCollection(tempWordsCollection);
    // const markCollection = tempWordsCollection.filter((w) => w.type == "mark");
    // const { hashKey, entity, activeSection, path } = saveParamsObj;
       
    const newArr = soaResult.filter((item, index, arr)=> {
      return item.key !== mid 
    })
    setSoaResult(newArr)

    const paramBody = {
      [key]: {
        [activeSection]: [
          {
          soaResult: newArr,
          table:content,
          },
        ],
      },
    };
    console.log("paramBody:",paramBody);
    console.log("path:",path);
    const saveRes = await saveText(paramBody, path);
     readFile({
        updatedSection: paramBody,
      });
    if (saveRes.statusCode == "200") {
      let temFile = fileReader.file
      temFile[key][activeSection][0].soaResult = newArr
      temFile[key][activeSection][0].table = content

        message.success("Remove successfully");
        readFile({
          updatedSection: paramBody,
          file:temFile
        });
      }
  };

  const handleSaveContent = async (
    id,
    currentScore,
    currentLabel,
    wordsCollection,
    updateWordsCollection,
    saveParamsObj
  ) => {
    // console.log(soaResult);
    
    // const targetIdx = wordsCollection.findIndex((w) => w.id == id);
    // if (targetIdx == -1) return;
    // if (!currentLabel) return;
    // const tempWordsCollection = wordsCollection.slice(0);
    // tempWordsCollection[targetIdx].category = currentLabel;
    // tempWordsCollection[targetIdx].score = currentScore;
    // updateWordsCollection(tempWordsCollection);

    // const markCollection = tempWordsCollection.filter((w) => w.type == "mark");
    // const { hashKey, entity, activeSection, path } = saveParamsObj;

    const paramBody = {
      [key]: {
        [activeSection]: [
          {
          soaResult: soaResult,
          table:content,
          },
        ],
      },
    };

    console.log("paramBody:",paramBody);
    console.log("path:",path);
    const saveRes = await saveText(paramBody, path);
    // const prevFile = props.fileReader.file[key];

    let temFile = props.fileReader.file;
    temFile[key][activeSection][0].soaResult = soaResult
    temFile[key][activeSection][0].table = content

    if (saveRes.statusCode == "200") {
      message.success("Save successfully");
      props.readFile({
        updatedSection: paramBody,
        file: temFile,
      });
    }
  };

  const handleAddUnderline = (iten) => {
    const newRes = [...soaResult, {key: iten, value: "", category: ""}]
    console.log(newRes);
    setSoaResult(newRes)
  }

  const getDisplayTitle = (s) => {
    let displayTitle;
    const target = sectionOptions.find((e) => e.value == s);
    displayTitle = target.label;
    return displayTitle;
  };

  const updateWordsCollection = (words) => {
    // setLabels(words)
    setWordsCollection(words);
  };

  const onChangeActiveType = (value) => {
    setActiveType(value);
  };
  const onChangeIconType = (value, index, indey) => {
    if(value==="X"){
      const newContent = [...content]
      newContent[index][indey]="" 
      setContent(newContent)
    } else {
      const newContent = [...content]
      newContent[index][indey]="X" 
      setContent(newContent)
    }
  };
  // change the category
  const onCategoryChange = (id,v) => {
    setCurrentId(id)
    setCurrentScore(1)
    setCurrentLabel(v);
    const newArr = soaResult.map((item, index, arr)=> {
        if(item.key === id) {
           return {...item, category:v}
        } else {
          return item
        }
    })
    setSoaResult(newArr)
  };

  // The table cell with select options
  const handleHeadChange = (value, index, indey) => {
    console.log(value, index, indey);
    const newContent = [...content]
      newContent[index][indey]=value
      setContent(newContent)
  };

  const handleEntityChange = (value) => {
    setEntity(value);

    props.updateCurrentEntity(value);
  };

  const onTextChange = (e) => {
    setSearchTxt(e.target.value);
  };

  function callback(key) {
    setSearchTxt("");
    setActiveTabKey(key);
    if (key !== "ENTITY RECOGNITION") {
      setEntity("Entities");
    }
    props.readFile({ activeTabKey: key });
    setActiveType("")
  }

  return (
    <div className="extraction-content-table">
      <Tabs
        defaultActiveKey="ENTITY RECOGNITION"
        onChange={callback}
        activeKey={activeTabKey}
      >
        <TabPane
          tab={
            <span>
              <EyeOutlined />
              ENTITY RECOGNITION
            </span>
          }
          key="ENTITY RECOGNITION"
        >
          <div className="entity-recognition">
            <div className="header">
              <span className="section-name">
                {activeSection == "includeAllText"
                  ? "COMPLETE DOCUMENT"
                  : getDisplayTitle(activeSection)}
              </span>
              <Input
                placeholder="Search keywords"
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                onChange={onTextChange}
                value={searchTxt}
              />
            </div>
            <div className="summary">
              <p>
                Entity types identified in the text below. Select on an entity
                type to filter the document.
              </p>
              <div className="entity-types filterable">
                {file[key][activeSection][0].soaSummary?(
                  <>
                    <div
                  className={`type-item ALL ${
                    activeType == "" ? "active" : ""
                  }`}
                  key="all"
                  onClick={() => onChangeActiveType("")}
                >
                  All
                </div>
                {Object.entries(soaSummary) &&
                  Object.entries(soaSummary).map((s: any) => {
                    return (
                      <div
                        className={`type-item ${s[0]} ${
                          s[0] == activeType ? "active" : ""
                        }`}
                        key={s[0]}
                        onClick={() => onChangeActiveType(s[0])}
                      >
                        {formatWord(s[0])}&nbsp;(<span>{s[1]}</span>)
                      </div>
                    );
                  })}
                  </>
                ):
                (<div className="type-item-activity">
                Schedule of Activities&nbsp;<span>({soaResult&&soaResult.length})</span>
                </div>)}
              </div>
            </div>
            {Array.isArray(content) ? (
              <div className="content-table-extraction">
                <div className="content-table-title">Schedule of Activities:</div>
                <div className="content-table-content">
                <table>
                  <tbody>
                    {
                        content.map((item, index) => {
                          return (
                            index < 1? (
                              <tr>
                              {
                                item.map((iten, indey) => {
                                  return (
                                    <td>
                                      {renderPlainText(iten)}
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
                                      soaEntity(iten, soaResult).length && soaEntity(iten, soaResult)[0].category === activeType || activeType === ""?(
                                        soaEntity(iten, soaResult).length?(
                                        <td>
                                         {renderMarkText(iten)}
                                        </td>
                                        ):(
                                          <td>
                                            {renderPlainText(iten)}
                                          </td>
                                        )
                                      ):
                                      (
                                        <td>
                                          {renderPlainText(iten)}
                                        </td>
                                      )
                                    ) :(
                                      iten.startsWith("X") ? (
                                        <td>
                                          <CheckCircleFilled/>
                                          {/* {iten.substr(1)} */}
                                        </td>
                                      ) : (
                                        <td>
                                          {renderPlainText(iten)}
                                        </td>
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
              </div>
            ) : (
              <div className="raw-content"> {content} </div>
            )}
          </div>
        </TabPane> 
        <TabPane
          tab={
            <span>
              <UserAddOutlined />
              VALIDATION
            </span>
          }
          key="VALIDATION"
        >
          <div className="entity-validation">
            <div className="header">
              <span className="section-name">
                {activeSection == "includeAllText"
                  ? "COMPLETE DOCUMENT"
                  : getDisplayTitle(activeSection)}
              </span>
              <Input
                placeholder="Search keywords"
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                onChange={onTextChange}
                value={searchTxt}
              />
            </div>
            <div className="summary">
              <p>
                Entity types identified in the text below. Select on an entity
                type to filter the document.
              </p>
              <div className="entity-types filterable">
                {file[key][activeSection][0].soaSummary?(
                  <>
                    <div
                  className={`type-item ALL ${
                    activeType == "" ? "active" : ""
                  }`}
                  key="all"
                  onClick={() => onChangeActiveType("")}
                >
                  All
                </div>
                {Object.entries(soaSummary) &&
                  Object.entries(soaSummary).map((s: any) => {
                    return (
                      <div
                        className={`type-item ${s[0]} ${
                          s[0] == activeType ? "active" : ""
                        }`}
                        key={s[0]}
                        onClick={() => onChangeActiveType(s[0])}
                      >
                        {formatWord(s[0])}&nbsp;(<span>{s[1]}</span>)
                      </div>
                    );
                  })}
                  </>
                ):
                (<div className="type-item-activity">
                Schedule of Activities&nbsp;<span>({soaResult&&soaResult.length})</span>
                </div>)}
              </div>
            </div>
            {Array.isArray(content) ? (
              <div className="content-table-extraction">
                <div className="content-table-title">Schedule of Activities:</div>
                <div className="content-table-content">
                <table>
                  <tbody>
                    {
                        content.map((item, index, arr) => {
                          return (
                            index < 1? (
                              <tr>
                              {
                                item.map((iten, indey) => {
                                  return (
                                    <td>
                                      <Select className={`table_head key-word ${searchTxt && matchWord(iten, searchTxt)}`} style={{ width: 140 }} value={iten} bordered={false} onChange={(val)=>{handleHeadChange(val, index, indey)}}>
                                        {headData.map(head => (
                                          <Option key={head} value={head}>{head}</Option>
                                        ))}
                                      </Select>
                                    </td>
                                  )
                                })
                              }
                            </tr>
                            ):(
                              index < xPos? (
                              <tr>
                              {
                                item.map((iten, indey) => {
                                  return (
                                    indey < 1? (
                                      soaEntity(iten, soaResult).length && soaEntity(iten, soaResult)[0].category === activeType || activeType === ""?
                                      (
                                        soaEntity(iten, soaResult).length?
                                        (
                                          <td>
                                            <Tooltip     
                                            key={iten}
                                            className="entity-concept"
                                            placement="right"
                                            title={renderTooltipTitle(
                                              soaEntity(iten, soaResult)[0],
                                              currentId,
                                              currentScore,
                                              currentLabel,
                                              onCategoryChange,
                                              categoryType,
                                              wordsCollection,
                                              updateWordsCollection,
                                              saveParamsObj,
                                              handleSaveContent,
                                              props.readFile,
                                              props.fileReader,
                                              entity
                                              )}
                                            >
                                                {renderMarkText(iten)}
                                            </Tooltip>
                                          </td>
                                        ):(
                                          <td onClick={()=>{handleAddUnderline(iten)}}>
                                            {renderPlainText(iten)}
                                          </td>
                                        )
                                      ):
                                      (
                                        <td onClick={()=>{handleAddUnderline(iten)}}>
                                          {renderPlainText(iten)}
                                        </td>
                                      )
                                    ):(
                                      iten.startsWith("X") ? (
                                        <td>
                                          <CheckCircleFilled/>
                                          {/* {iten.substr(1)} */}
                                        </td>
                                      ) : (
                                        <td>
                                          {renderPlainText(iten)}
                                        </td>
                                      )
                                    )
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
                                      soaEntity(iten, soaResult).length && soaEntity(iten, soaResult)[0].category === activeType || activeType === ""?
                                      (
                                        soaEntity(iten, soaResult).length?
                                        (
                                            <td>
                                              <Tooltip     
                                                key={iten}
                                                className="entity-concept"
                                                placement="right"
                                                title={renderTooltipTitle(
                                                  soaEntity(iten, soaResult)[0],
                                                  currentId,
                                                  currentScore,
                                                  currentLabel,
                                                  onCategoryChange,
                                                  categoryType,
                                                  wordsCollection,
                                                  updateWordsCollection,
                                                  saveParamsObj,
                                                  handleSaveContent,
                                                  props.readFile,
                                                  props.fileReader,
                                                  entity
                                                )}
                                              >
                                                  {renderMarkText(iten)}
                                              </Tooltip>
                                            </td>
                                        ):(
                                          <td onClick={()=>{handleAddUnderline(iten)}}>
                                            {renderPlainText(iten)}
                                          </td>
                                        )
                                      ):
                                      (
                                        <td onClick={()=>{handleAddUnderline(iten)}}>
                                          {renderPlainText(iten)}
                                        </td>
                                      )
                                    ):(
                                      iten.startsWith("X") ? (
                                        <td onClick={()=>{onChangeIconType("X", index, indey)}} style={{cursor:"pointer"}}>
                                          <CheckCircleFilled/>
                                          {/* {iten.substr(1)} */}
                                        </td>
                                      ) : (
                                        iten === ""? (
                                          <td onClick={()=>{onChangeIconType("", index, indey)}} style={{cursor:"pointer"}}>
                                            <CheckCircleTwoTone twoToneColor="#ddd" />
                                          </td>
                                        ):(
                                          <td>
                                            {renderPlainText(iten)}
                                          </td>
                                        )
                                      )
                                    )
                                  )
                                })
                              }
                            </tr>
                             )
                            )
                          )
                        })
                    }
                  </tbody>
                </table>
                </div>
              </div>
            ) : (
              <div className="raw-content"> {content} </div>
            )}
          </div>
        </TabPane>
      </Tabs>
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
)(withRouter(ExtractionTable));
