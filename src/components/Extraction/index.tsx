import React, { useState, useEffect, useRef } from "react";
import { withRouter } from "react-router";
import { Tabs, Input, Select, message } from "antd";
import {
  EyeOutlined,
  ApartmentOutlined,
  UserAddOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { connect } from "react-redux";
import * as fileActions from "../../actions/file.js";
import { saveText } from "../../utils/ajax-proxy";
import { formatWord } from '../TextWithEntity';
import {
  sectionOptions,
  initSelectedSections,
} from "../../pages/ProtocolSection";
import SvgComponent from "../../components/analysedSVG";
import SuccessIcon from "../../assets/success.svg";
import WarnIcon from "../../assets/warn.svg";
import TextWithEntity from "../../components/TextWithEntity";
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

const Extraction = (props: any, ref) => {
  if (!props.fileReader.file.txt) {
    window.location.href = window.location.origin + "/overview";
  }
  const initEntity = entityOptions[0];
  const { activeSection } = props;
  const file = props.fileReader.file;

  const key = file.keyName || Object.keys(file)[0] || [];
  let initContent = file[key][activeSection][0].content;

  const path = file["result_url"];
  const [entity, setEntity] = useState(initEntity);
  const [wordsCollection, setWordsCollection] = useState([]);
  const [currentLabel, setCurrentLabel] = useState("");
  const [activeType, setActiveType] = useState("");
  const [searchTxt, setSearchTxt] = useState("");
  const [activeTabKey, setActiveTabKey] = useState(
    props.fileReader.activeTabKey
  );
  let [content, setContent] = useState(initContent);
  const [entityTypes, setEntityTypes] = useState([]);

  const initLabels =
    file[key][activeSection][0].comprehendMedical[entity].label;
  const initSvgEntity = file[key][activeSection][0].comprehendMedical[entity];
  const [svgEntity, setSvgEntity] = useState(initSvgEntity);
  const [labels, setLabels] = useState(initLabels);
  const entities =
    file[key][activeSection][0].comprehendMedical[entity].Entities;

  const firstMarkId = initLabels && initLabels.length > 0 && initLabels[0].id;
  const summary = file[key][activeSection][0].comprehendMedical[entity].Summary;

  useEffect(() => {

    const getAllEntityTypes = (obj, sections, entity) => {
      const summaryCollection = [];
      sections.forEach((k) => {
        entity.forEach((en) => {
          obj[k][0] &&
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
    setContent(file[key][activeSection][0].content);
    setLabels(file[key][activeSection][0].comprehendMedical[entity].label);

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
    
    // setWordsCollection(tmpWords);
    setWordsCollection(labels);
    props.updateCurrentEntity(entity);
    setSvgEntity(file[key][activeSection][0].comprehendMedical[entity]);
  }, [entity, activeSection, labels, activeTabKey]);

  const getDisplayTitle = (s) => {
    let displayTitle;
    const target = sectionOptions.find((e) => e.value == s);
    displayTitle = target.label;
    return displayTitle;
  };

  const updateWordsCollection = (words) => {
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
    props.readFile({ activeTabKey: key });
  }

  const handleSaveContent = async (
    id,
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
                label:tempWordsCollection              },
            },
          },
        ],
      },
    };

    const saveRes = await saveText(paramBody, path);
    props.readFile({
      updatedSection: paramBody,
    });

    if (saveRes.statusCode == "200") {
      message.success("Save successfully");
      props.readFile({
        updatedSection: paramBody,
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
              <Select
                value={entity}
                style={{ width: 120 }}
                onChange={handleEntityChange}
              >
                {entityOptions.map((i) => {
                  return (
                    <Option value={i} key={i}>
                      {i}
                    </Option>
                  );
                })}
              </Select>
            </div>
            <div className="summary">
              <p>
                Entity types identified in the text below. Select on an entity
                type to filter the document.
              </p>
              <div className="entity-types filterable">
                <div
                  className={`type-item ALL ${
                    activeType == "" ? "active" : ""
                  }`}
                  key="all"
                  onClick={() => onChangeActiveType("")}
                >
                  All
                </div>
                {Object.entries(summary).map((s:any) => {            
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
              </div>
            </div>
            <TextWithEntity
              key="1"
              summary={summary}
              wordsCollection={wordsCollection}
              activeType={activeType}
              searchTxt={searchTxt}
              onChangeActiveType={onChangeActiveType}
              currentLabel={currentLabel}
              handleChange={handleChange}
              entityTypes={entityTypes}
              firstMarkId={firstMarkId}
              path={path}
              showConfidence={false}
              entity={entity}
            />
          </div>
        </TabPane>
        <TabPane
          tab={
            <span>
              <ApartmentOutlined />
              ENTITY RELATIONSHIPS
            </span>
          }
          key="ENTITY RELATIONSHIPS"
        >
          <div className="entity-relatioship">
            <div className="header">
              <span className="section-name">
                {activeSection == "includeAllText"
                  ? "ALL RELATIONSHIP"
                  : getDisplayTitle(activeSection)}
              </span>
            </div>
            <div className="summary">
              <p>Relationships identfied in this section</p>
              <div className="relation-pair">
                {file[key][activeSection][0].RelationshipSummary &&
                  file[key][activeSection][0].RelationshipSummary.map(
                    (pair:any, idx:number) => {
                      return (
                        <span className="pair-item" key={idx}>
                          {`${formatWord(Object.keys(pair)[0]) }-${formatWord(Object.values(pair)[0]) }`}
                          &nbsp;(<span>{pair.count}</span>)
                        </span>
                      );
                    }
                  )}
              </div>
            </div>
            <div className="content" id="svg-content">           
              {/* <canvas width="500" height="500" id="canvas"></canvas> */}
              <SvgComponent
                entityData={svgEntity}
                content={content}
                activeSection={activeSection}
              />
            </div>
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
            <div className="legend">
              <span className="legend-item">
                <img src={SuccessIcon} alt="" />
                &ge; 80% confidence
              </span>
              <span className="legend-item">
                <img src={WarnIcon} alt="" />
                &lt; 80% confidence
              </span>
            </div>
            <TextWithEntity
              key="2"
              summary={summary}
              hashKey={key}
              entity={entity}
              wordsCollection={wordsCollection}
              activeType={activeType}
              searchTxt={searchTxt}
              onChangeActiveType={onChangeActiveType}
              currentLabel={currentLabel}
              handleChange={handleChange}
              entityTypes={entityTypes}
              showTooltip={true}
              showConfidence={true}
              handleSaveContent={handleSaveContent}
              updateWordsCollection={updateWordsCollection}
              activeSection={activeSection}
              path={path}
            />
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
)(withRouter(Extraction));
