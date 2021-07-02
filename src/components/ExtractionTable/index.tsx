import React, { useState, useEffect, useRef } from "react";
import { withRouter } from "react-router";
import { Tabs, Input, Select, message } from "antd";
import {
  EyeOutlined,
  ApartmentOutlined,
  UserAddOutlined,
  SearchOutlined,
  CheckCircleFilled,
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
  const soaSummary = file[key][activeSection][0].soaSummary && file[key][activeSection][0].soaSummary || {};

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
    setContent(file[key][activeSection][0].table);
    setLabels(file[key][activeSection][0].comprehendMedical[entity]&&file[key][activeSection][0].comprehendMedical[entity].label);
    setWordsCollection(
      file[key][activeSection][0].comprehendMedical[entity]&&file[key][activeSection][0].comprehendMedical[entity].label
    );
    setSoaResult(file[key][activeSection][0].soaResult&&file[key][activeSection][0].soaResult)
    const paramBody = {
      [key]: {
        [activeSection]: [
          {
            comprehendMedical: {
              [entity]: {
                label: labels,
              },
            },
          },
        ],
      },
    };
    props.readFile({
      updatedSection: paramBody,
    });
  }, [activeSection, entity, labels]);

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

  // filter the [object] matched the table cell
  const soaEntity = (iten) => {
    return soaResult.filter(function(currentValue, index, arr){
      return currentValue.key === iten;
    })
  }

  const matchWord = (iten) => {
    return iten
    .toLowerCase()
    .indexOf(searchTxt.toLowerCase()) > -1
    ? "matched-word"
    : ""
  }

  const renderPlainText = (iten) => {
    return (
      <span className={`key-word ${
        searchTxt && matchWord(iten)} `}>
        {iten}
      </span>
    )
  }

  const renderMarkText = (iten) => {
    return (
      <mark>
        <span className={`key-word ${soaEntity(iten)[0].category} ${searchTxt && matchWord(soaEntity(iten)[0].key)}`}>
          {soaEntity(iten)[0].key}
        </span>
        <span className={`cate-label ${searchTxt && matchWord(soaEntity(iten)[0].value)}`}>
            {`${soaEntity(iten)[0].category?formatWord(soaEntity(iten)[0].category):"Schedule of activity"} (${soaEntity(iten)[0].value})`}
        </span>
      </mark>
    )
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
  const handleEntityChange = (value) => {
    setEntity(value);

    props.updateCurrentEntity(value);
  };

  const handleChange = (value) => {
    setCurrentLabel(value);
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

  const handleSaveContent = async (
    id,
    currentScore,
    currentLabel,
    wordsCollection,
    updateWordsCollection,
    saveParamsObj
  ) => {
    const targetIdx = wordsCollection.findIndex((w) => w.id == id);
    if (targetIdx == -1) return;
    if (!currentLabel) return;
    const tempWordsCollection = wordsCollection.slice(0);
    tempWordsCollection[targetIdx].category = currentLabel;
    tempWordsCollection[targetIdx].score = currentScore;
    updateWordsCollection(tempWordsCollection);

    const markCollection = tempWordsCollection.filter((w) => w.type == "mark");
    const { hashKey, entity, activeSection, path } = saveParamsObj;

    const paramBody = {
      [hashKey]: {
        [activeSection]: [
          {
            comprehendMedical: {
              [entity]: {
                // label: markCollection,
                label: tempWordsCollection,
              },
            },
          },
        ],
      },
    };

    const saveRes = await saveText(paramBody, path);
    const prevFile = props.fileReader.file[hashKey];

    let temFile = props.fileReader.file;
    temFile[hashKey][activeSection][0].comprehendMedical[entity].label =
      tempWordsCollection;

    if (saveRes.statusCode == "200") {
      message.success("Save successfully");
      props.readFile({
        updatedSection: paramBody,
        file: temFile,
      });
    }
  };

  return (
    <div className="extraction-content">
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
                                      soaEntity(iten).length && soaEntity(iten)[0].category === activeType || activeType === ""?(
                                        soaEntity(iten).length?(
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
                                      soaEntity(iten).length && soaEntity(iten)[0].category === activeType || activeType === ""?
                                      (
                                        soaEntity(iten).length?
                                        (
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
