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
import { formatWord } from "../TextWithEntity";
import {
  sectionOptions,
  initSelectedSections,
} from "../../pages/ProtocolSection";
import SvgComponent from "../../components/analysedSVG";
import SuccessIcon from "../../assets/success.svg";
import WarnIcon from "../../assets/warn.svg";
import TextWithEntity from "../../components/TextWithEntity";
import TableTextWithEntity from "../../components/TableTextWithEntity";
import {ENDPOINT_SECTION} from "../../pages/ProtocolSection";
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
// const entityOptions = ["Entities", "ICD-10-CM", "RxNorm", "MedDRA","Omop","Snomed"];
const entityOptions = ["Entities", "ICD-10-CM", "RxNorm","Omop","Snomed"];



export function isTable(file,key,activeSection){
  return file[key][activeSection][0].tableResult&&file[key][activeSection][0].tableResult.length>0?true:false
}

const Extraction = (props: any, ref) => {
  // need this to refresh page
  if (!props.fileReader.file.txt) {
    window.location.href = window.location.origin + "/overview";
  }
  const initEntity = entityOptions[0];
  const allEntity = "Entities";
  const { activeSection } = props;
  const file = props.fileReader.file;

  const key = file.keyName || Object.keys(file)[0] || [];
  let initContent = file[key][activeSection][0].content;
  const path = file["result_url"];

  let tableResult,otherTableResult = []
  if(activeSection==ENDPOINT_SECTION && isTable(file,key,activeSection)){
    tableResult=file[key][activeSection][0].tableResult
    // otherTableResult = file[key][activeSection][0].otherTableResult
  }

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
    file[key][activeSection][0].comprehendMedical["Entities"];
  const [svgEntity, setSvgEntity] = useState(initSvgEntity);

  const initLabels =
  file[key][activeSection][0].comprehendMedical[entity]&&file[key][activeSection][0].comprehendMedical[entity].label || {};
  const [labels, setLabels] = useState(initLabels); // labels and wordsColelction are same now
  const [wordsCollection, setWordsCollection] = useState(initLabels);
  // const entities =
  //   file[key][activeSection][0].comprehendMedical[entity].Entities || {};
  const firstMarkId = initLabels && initLabels.length > 0 && initLabels[0].id;
  let summary
  if(activeSection==ENDPOINT_SECTION && isTable(file,key,activeSection)){
    summary=file[key][activeSection][0].totalSummary[entity]
  }else{
    summary = file[key][activeSection][0].comprehendMedical[entity]&&file[key][activeSection][0].comprehendMedical[entity].Summary || {};  
  }

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
      const flatKeys=Array.from(new Set(keys.flat()))
      //remove Adverse Event, add Test Value, Test Unit
      const ADVERSE_EVENT="ADVERSE_EVENT"
      const TEST_VALUE="TEST_VALUE"
      const TEST_UNIT="TEST_UNIT"
      const adIndex = flatKeys.findIndex( e=> e.toUpperCase()===ADVERSE_EVENT)
      if(adIndex >-1) flatKeys.splice(adIndex,1)    
      if(flatKeys.findIndex(e=> e.toUpperCase()===TEST_VALUE)<0) flatKeys.push(TEST_VALUE)
      if(flatKeys.findIndex(e=> e.toUpperCase()===TEST_UNIT)<0) flatKeys.push(TEST_UNIT)
      return flatKeys;
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
    setLabels(file[key][activeSection][0].comprehendMedical[entity]&&file[key][activeSection][0].comprehendMedical[entity].label);
    setWordsCollection(
      file[key][activeSection][0].comprehendMedical[entity]&&file[key][activeSection][0].comprehendMedical[entity].label
    );
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
  }

  const handleSaveContent = async (
    id,
    currentScore,
    currentLabel,
    wordsCollection,
    updateWordsCollection,
    saveParamsObj,
    tableBody,   
    tableBodyColumnIndex,
    tableBodyRowIndex
  ) => {
    const targetIdx = wordsCollection.findIndex((w) => w.id == id);
    if (targetIdx == -1) return;
    if (!currentLabel) return;
    const tempWordsCollection = wordsCollection.slice(0);
    tempWordsCollection[targetIdx].category = currentLabel;
    setCurrentLabel("")
    tempWordsCollection[targetIdx].score = currentScore;
    updateWordsCollection(tempWordsCollection);

    const markCollection = tempWordsCollection.filter((w) => w.type == "mark");
    const { hashKey, entity, activeSection, path } = saveParamsObj;
    let paramBody,updatedData

    if(activeSection==ENDPOINT_SECTION && isTable(file,key,activeSection)){
      updatedData = file 
      updatedData[hashKey][activeSection][0].tableResult[tableBodyRowIndex+1][tableBodyColumnIndex].comprehendMedical[entity].label=tempWordsCollection    

      paramBody = {
        [hashKey]: {
          [activeSection]: [
            {
              tableResult: updatedData
            },
          ],
        },
      };


    }else{
      updatedData = file
      file[hashKey][activeSection][0].comprehendMedical[entity].label = tempWordsCollection;

      paramBody = {
        [hashKey]: {
          [activeSection]: [
            {
              comprehendMedical: {
                [entity]: {
                  label: tempWordsCollection,
                },
              },
            },
          ],
        },
      };
    }
    // const saveRes = await saveText(paramBody, path);

    // if (saveRes.statusCode == "200") {
      // message.success("Save successfully");
      props.readFile({
        updatedSection: paramBody,
        file: updatedData,
      });
    // }
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
                {Object.entries(summary) &&
                  Object.entries(summary).map((s: any) => {
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
                  {

                  }
              </div>
            </div>
            {(!wordsCollection || wordsCollection.length==0) && activeSection!=ENDPOINT_SECTION&& <div className="raw-content"> {content} </div>}           
            {
            (activeSection!=ENDPOINT_SECTION || (activeSection==ENDPOINT_SECTION&&!isTable(file,key,activeSection))) && (
               <TextWithEntity
               key="1"
               summary={summary}
               wordsCollection={wordsCollection}
               activeType={activeType}
               activeSection={activeSection}
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
            )} 
           {  activeSection==ENDPOINT_SECTION && isTable(file,key,activeSection)&& (
              <TableTextWithEntity
               secondaryDataSource = {file[key][activeSection][0].otherTableResult||[]}
               dataSource={file[key][activeSection][0].tableResult}
               key="1"
               summary={summary}
               wordsCollection={wordsCollection}
               activeType={activeType}
               activeSection={activeSection}
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
            )}
          </div>
        </TabPane>
        {
          !(activeSection==ENDPOINT_SECTION&&isTable(file,key,activeSection))&& activeSection !== "objectivesEndpointsEstimands"&&(
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
              {!file[key][activeSection][0].RelationshipSummary ||
              file[key][activeSection][0].RelationshipSummary.length == 0 ? (
                <div>
                  There are no entity relationships identified in this section.
                </div>
              ) : (
                <>
                  <p>Relationships identfied in this section</p>
                  <div className="relation-pair">
                    {file[key][activeSection][0].RelationshipSummary &&
                      file[key][activeSection][0].RelationshipSummary.map(
                        (pair: any, idx: number) => {
                          return (
                            <span className="pair-item" key={idx}>
                              {`${formatWord(
                                Object.keys(pair)[0]
                              )}-${formatWord(Object.values(pair)[0])}`}
                              &nbsp;(<span>{pair.count}</span>)
                            </span>
                          );
                        }
                      )}
                  </div>
                </>
              )}
            </div>
            <div className="content" id="svg-content">
              <SvgComponent
                entityData={svgEntity}
                content={content}
                activeSection={activeSection}
              />
            </div>
          </div>
        </TabPane>
          )
        }
        
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
            <div id="validation-content">          
            {(!wordsCollection || wordsCollection.length==0) && activeSection!=ENDPOINT_SECTION &&  <div className="raw-content"> {content} </div>}           
            {(activeSection!=ENDPOINT_SECTION || (activeSection==ENDPOINT_SECTION&&!isTable(file,key,activeSection))) && (
               <TextWithEntity
               key="2"
               hashKey={key}
               entity={allEntity}
               summary={summary}
               wordsCollection={wordsCollection}
               activeType=""
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
            )}
           {activeSection==ENDPOINT_SECTION && isTable(file,key,activeSection)&&(
              <TableTextWithEntity
              key="2"
              secondaryDataSource = {file[key][activeSection][0].otherTableResult||[]}
              dataSource={file[key][activeSection][0].tableResult}
              hashKey={key}
              entity={allEntity}
              summary={summary}
              wordsCollection={wordsCollection}
              activeType=""
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
            )}
          </div>
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
