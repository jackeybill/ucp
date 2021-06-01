import React, { useState, useEffect } from "react";
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
import { sectionOptions } from "../../pages/ProtocolSection";
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
const combinedSection = ["inclusionCriteria", "inclusionCriteria"];
const { TabPane } = Tabs;
const { Option } = Select;
const entityOptions = ["Entities", "ICD-10-CM", "RxNorm", "meddra"];

const Extraction = (props: any) => {
  if (!props.fileReader.file.txt) {
    // props.history.push("/overview");
  }
  const initEntity = entityOptions[0];
  const { activeSection } = props;
  const file = props.fileReader.file;
  const key = file.keyName || Object.keys(file)[0] || [];
  const path = file["result_url"];
  const [entity, setEntity] = useState(initEntity);
  const [wordsCollection, setWordsCollection] = useState([]);
  const [currentLabel, setCurrentLabel] = useState("");
  const [activeType, setActiveType] = useState("");
  const [searchTxt, setSearchTxt] = useState("");
  const [activeTabKey, setActiveTabKey] = useState(
    props.fileReader.activeTabKey
  );

  const entities =
    file[key][activeSection][0].comprehendMedical[entity].Entities;
  const svgEntity = file[key][activeSection][0].comprehendMedical[entity];
  const initLabels =
    file[key][activeSection][0].comprehendMedical[entity].label;
  const firstMarkId = initLabels && initLabels[0].id;
  const content = file[key][activeSection][0].content;
  const summary = file[key][activeSection][0].comprehendMedical[entity].Summary;
  const entityTypes = Object.keys(summary);

  useEffect(() => {
    const tmpWords = content.split(" ").map((w, idx) => {
      const wObj = {
        id: idx,
        type: "span",
        text: w,
      };
      return wObj;
    });
    initLabels &&
      initLabels.forEach((l) => {
        if (l.children.length > 0) {
          const startId = l.children[0].id;
          tmpWords.splice(startId - 1, l.children.length, l);
        }
      });
    setWordsCollection(tmpWords);
    props.updateCurrentEntity(entity);
  }, [entity]);

  const getDisplayTitle = (s) => {
    let displayTitle;
    if (combinedSection.indexOf(s) > -1) {
      displayTitle = "INCLUSION / EXCLUSION CRITERIA";
    }
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
                label: markCollection,
              },
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
              <div className="entity-types">
                {Object.entries(summary).map((s) => {
                  return (
                    <div
                      className={`type-item ${s[0]} ${
                        s[0] == activeType ? "active" : ""
                      }`}
                      key={s[0]}
                      onClick={() => onChangeActiveType(s[0])}
                    >
                      {s[0]}&nbsp;(<span>{s[1]}</span>)
                    </div>
                  );
                })}
              </div>
            </div>
            <TextWithEntity
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
              <div className="entity-types">
                {Object.entries(summary).map((s) => {
                  return (
                    <div
                      className={`type-item ${s[0]} ${
                        s[0] == activeType ? "active" : ""
                      }`}
                      key={s[0]}
                    >
                      {s[0]}&nbsp;(<span>{s[1]}</span>)
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="content" id="svg-content">
              <SvgComponent entityData={svgEntity} content={content} />
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
