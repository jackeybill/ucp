import React, { useState, useReducer, useEffect} from 'react';
import {Input, Button, Select, Tooltip, Collapse, Divider, Modal, Slider, Table,Dropdown,Menu} from "antd";
import {getSummaryDefaultList, addScenario} from "../../utils/ajax-proxy";
import { withRouter } from 'react-router';
import {HistoryOutlined, CloseOutlined, EditFilled, CaretRightOutlined, PlusCircleOutlined, DownOutlined,DownloadOutlined} from "@ant-design/icons";
import "./index.scss";

import CriteriaOption from "../CriteriaOption";
import CustomChart from "../CustomChart";
import EditTable from "../../components/EditTable";

const { TextArea } = Input;
const { Panel } = Collapse;

const step1 = 'Scenario';
const step2 = 'Criteria';
const step3 = 'Schedule';
const frequencyFilter = [50, 60]

const rates = [];
let demographicsElements = [];
let interventionElements = [];
let medConditionElements = [];
let labTestElements = [];

const selected = "true";

const DataArr = [
    { 
      name: 'XXX',
      value: 1 ,
     },
     { 
       name: 'XXX',
      value: 2 ,
      },
]

const columns = [
    {
      title: 'Eligibility Criteria',
      dataIndex: 'Eligibility Criteria',
      width: '30%',
      editable: false,
    },
    {
      title: 'Values',
      dataIndex: 'Values',
    },
    {
      title: 'Timeframe',
      dataIndex: 'Timeframe',
    }]

const panelHeader = () => {
    return (
        <div className="trial-panelHeader">
            <div>
                <div className="bar-desc"><span>Predicated Impact</span></div>
                <div className="item-desc"><div className="bar-item item1"></div><span>Labs / Tests</span></div>
                <div className="item-desc"><span className="bar-item item2"></span><span>Intervention</span></div>
                <div className="item-desc"><span className="bar-item item3"></span><span>Demographics</span></div>
                <div className="item-desc"><span className="bar-item item4"></span><span>Medical</span></div>
            </div>
        </div>
    );
};

const panelHeaderSection = (header, count) => {
    return (
        <div className="trial-panelHeader">
            <div>
                <div className="header-section"><span>{header}({count == 0? 0:count})</span>
                <PlusCircleOutlined className="right-icon"/></div>
            </div>
        </div>
    );
};

const panelContent = (rates) => {
    return (
        <div className="trial-panelBody">
        <div>
            <span className="key">Trial Title</span><br/>
            <span className="value"> test</span>
        </div>
        </div>
    );
};

const NewScenarioStepTwo = (props) => {
    const [currentAddStep, setCurrentAddStep] = useState(step1)
    const [demographics, setDemographics] = useState([]);
    const [intervention, setIntervention] = useState([]);
    const [medCondition, setMedCondition] = useState([]);
    const [labTest, setLabTest] = useState([]);
    const [originDemographics, setOriginDemographics] = useState([]);
    const [originIntervention, setOriginIntervention] = useState([]);
    const [originMedCondition, setOriginMedCondition] = useState([]);
    const [originLabTest, setOriginLabTest] = useState([]);
    const [criteriaStatus, setCriteriaStatus] = useState("Inclusion");
    const [rollHeight, setRollHeight] = useState(true)
    // const [inclusionCriteria, setInclusionCriteria] = useState([])
    // const [exclusionCriteria, setExclusionCriteria] = useState([])
    const [visible, setVisible] = useState(false);
    const [minValue, setMinValue] = useState(frequencyFilter[0]);
    const [maxValue, setMaxValue] = useState(frequencyFilter[1]);
    const [defaultActiveKey, setDefaultActiveKey] = useState([])
    const [activeKey, setActiveKey] = useState([])
    const [collapsible, setCollapsible] = useState(true)

const next = (step) =>{
    setCurrentAddStep(step)
}

const saveInclusionCriteria = async () => {

    var inclusion = {
        "Demographics": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": demographicsElements
        },
        "Medical Condition": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": medConditionElements
        },
        "Intervention": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": interventionElements
        },
        "Lab / Test": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": labTestElements
        }
    }
    props.record.scenarios[props.record.scenarios.length-1]["Inclusion Criteria"] = inclusion
    // console.log(props.record.scenarios)

    //TODO to release to command for SIT
    const resp = await addScenario(props.record);
    if (resp.statusCode == 200) {
      if(activeKey.indexOf("1") < 0){
        setRollHeight(false)
        setActiveKey(['1'])
      }
    }
}

const handleOptionSelect = (item, activeType, id, key) =>{
    switch(id){
        case 0:

            var index = demographicsElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
            if(activeType == 1){
                if(index < 0){
                    var newItem = {
                        "Eligibility Criteria": item.Text,
                        "Values": "-",
                        "Timeframe": "-"
                    }
                    demographicsElements.push(newItem)
                }
            } else {
                if(index >= 0){
                    demographicsElements.splice(index,1)
                }
            }
            break;
        case 1:
            var index = medConditionElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
            if(activeType == 1){
                if(index < 0){
                    var newItem = {
                        "Eligibility Criteria": item.Text,
                        "Values": "-",
                        "Timeframe": "-"
                    }
                    medConditionElements.push(newItem)
                }
            } else {
                if(index >= 0){
                    medConditionElements.splice(index,1)
                }
            }
            break;
        case 2:
            var index = interventionElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
            if(activeType == 1){
                if(index < 0){
                    var newItem = {
                        "Eligibility Criteria": item.Text,
                        "Values": "-",
                        "Timeframe": "-"
                    }
                    interventionElements.push(newItem)
                }
            } else {
                if(index >= 0){
                    interventionElements.splice(index,1)
                }
            }
            break;
        default:
            var index = labTestElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
            if(activeType == 1){
                if(index < 0){
                    var newItem = {
                        "Eligibility Criteria": item.Text,
                        "Values": "-",
                        "Timeframe": "-"
                    }
                    labTestElements.push(newItem)
                }
            } else {
                if(index >= 0){
                    labTestElements.splice(index,1)
                }
            }
            break;
    }
}

useEffect(() => {
    const summaryDefaultList = async () => {
        const resp = await getSummaryDefaultList();

        if (resp.statusCode == 200) {
            const response = JSON.parse(resp.body)
            // setInclusionCriteria(response[0].InclusionCriteria)
            // setExclusionCriteria(response[1].ExclusionCriteria)

            const criteria = response[0].InclusionCriteria
            
            for(var i = 0; i < criteria.length; i ++){
                if(getCatorgoryIndex(i, criteria) == 0){
                    setOriginMedCondition(criteria[i]['Medical Condition'])
                    setMedCondition(criteria[i]['Medical Condition'].filter((d) => {
                        return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
                    }))
                } else if(getCatorgoryIndex(i, criteria) == 1){ 
                    setOriginDemographics(criteria[i]['Demographics'])
                    setDemographics(criteria[i]['Demographics'].filter((d) => {
                        return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
                    }))
                } else if(getCatorgoryIndex(i, criteria) == 2){
                    setOriginLabTest(criteria[i]['Lab/Test'])
                    setLabTest(criteria[i]['Lab/Test'].filter((d) => {
                        return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
                    }))
                } else if(getCatorgoryIndex(i, criteria) == 3){
                    setOriginIntervention(criteria[i]['Intervention'])
                    setIntervention(criteria[i]['Intervention'].filter((d) => {
                        return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
                    }))
                }
            }
        }
    };
    summaryDefaultList();
}, []);

function getCatorgoryIndex(index, list){
    if(list[index]['Medical Condition'] != undefined){
        return 0;
    } else if(list[index]['Demographics'] != undefined){
        return 1;
    } else if(list[index]['Lab/Test'] != undefined){
        return 2;
    } else {
        return 3;
    }
}

function callback(key) {
    if(key.indexOf("1") < 0){
        setRollHeight(true)
    } else {
        setRollHeight(false)
    }
    setDefaultActiveKey(key)
    setActiveKey(key)
}

const amendmentRateoption = {
    title : {
      text: 'Protocol Amendment Rate',
      subtext: 'Therapeutic Area Average - 40%',
        x:'left',
        y:'center',
        textStyle: {
            fontSize: 14,
            fontWeight: 'bold'
        },
        subtextStyle: {
            fontSize: 12,
            fontWeight: 'normal'
        }
    },

    tooltip: {
        trigger: 'item',
        formatter: '{b} - {d}%',
        extraCssText:'background:#757373;color:white;font-size:8px'
    },
    series: [
        {
            type: 'pie',
            center: ['80%', '50%'],
            radius: ['50%', '80%'],
            avoidLabelOverlap: false,
            label: {
                show: false,
                position: 'center',
                formatter: '{c}%'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: '12',
                    fontWeight: 'bold'
                }
            },
            labelLine: {
                show: true
            },
            color:['#0001ff', '#578be2', '#80aacc', '#ddd'],
            data: [
                {value: 45, name: 'Labs / Tests'},
                {value: 26, name: 'Intervention'},
                {value: 5, name: 'Demographics'},
                {value: 24, name: 'Medical'}
            ]
        }
    ]
};

const screenFaliureOption = {
    title : {
      text: 'Screen Faliure Rate',
      subtext: 'Therapeutic Area Average - 20%',
      x:'left',
      y:'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 'bold'
      },
      subtextStyle: {
        fontSize: 12,
        fontWeight: 'normal'
      }
    },

    tooltip: {
        trigger: 'item',
        formatter: '{b} - {d}%',
        extraCssText:'background:#757373;color:white;font-size:8px'
    },
    series: [
        {
            type: 'pie',
            center: ['80%', '50%'],
            radius: ['50%', '80%'],
            avoidLabelOverlap: false,
            label: {
                show: false,
                position: 'center',
                formatter: '{c}%'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: '12',
                    fontWeight: 'bold'
                }
            },
            labelLine: {
                show: true
            },
            color:['#0001ff', '#578be2', '#80aacc', '#ddd'],
            data: [
                {value: 45, name: 'Labs / Tests'},
                {value: 26, name: 'Intervention'},
                {value: 5, name: 'Demographics'},
                {value: 24, name: 'Medical'}
            ]
        }
    ]
};

const formatter = (value) => {
    return value+'%'
}

const getFrequency = (value) => {
    setMinValue(value[0])
    setMaxValue(value[1])

    setMedCondition(originMedCondition.filter((d) => {
        return d.Frequency * 100 >= value[0] && d.Frequency * 100 <= value[1];
    }))
    setDemographics(originDemographics.filter((d) => {
        return d.Frequency * 100 >= value[0] && d.Frequency * 100 <= value[1];
    }))
    setLabTest(originLabTest.filter((d) => {
        return d.Frequency * 100 >= value[0] && d.Frequency * 100 <= value[1];
    }))
    setIntervention(originIntervention.filter((d) => {
        return d.Frequency * 100 >= value[0] && d.Frequency * 100 <= value[1];
    }))

    medConditionElements = []
    demographicsElements = []
    labTestElements = []
    interventionElements = []
}

const updateTrial = () => {
    setCollapsible(false)
    setDefaultActiveKey(['2','3','4','5'])
}

const updateIclusionCriteria = (newData, index) => {
    switch(index){
        case 1: 
            demographicsElements = newData
            break;
        case 2:
            medConditionElements = newData
            break;
        case 3:
            interventionElements = newData
            break;
        default:
            labTestElements = newData
    }
}
const jsonExport = async (jsonData, filename) => {
    const json = JSON.stringify(jsonData);
    const blob = new Blob([json], { type: "application/json" });
    const href = await URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = filename + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
    
const handleExport = () => {
    //to do    
    // jsonExport(jsonData, fname);
}

    

    return (
      <div className="trial-portfolio-container">
        <div>
          <div className="upper step-item">
            <div className="action-part">
              <div className="status-filter">
                <div
                  className={`in-progress item ${
                    criteriaStatus == "Inclusion" ? "active" : ""
                  }`}
                  onClick={() => setCriteriaStatus("Inclusion")}
                >
                  <span className="status">Inclusion Criteria</span>
                </div>
                <div
                  className={`in-progress item ${
                    criteriaStatus == "Exclusion" ? "active" : ""
                  }`}
                  onClick={() => setCriteriaStatus("Exclusion")}
                >
                  <span className="status">Exclusion Criteria</span>
                </div>
                <div
                  className={`in-progress item ${
                    criteriaStatus == "Enrollment" ? "active" : ""
                  }`}
                  onClick={() => setCriteriaStatus("Enrollment")}
                >
                  <span className="status">Enrollment Feasibility</span>
                </div>
              </div>
            </div>
            <div className="export-part">
              <Dropdown.Button
                overlay={
                  <Menu>
                    <Menu.Item key="json">JSON</Menu.Item>
                  </Menu>
                }
                icon={<DownOutlined />}
                onClick={handleExport}
              >
                <DownloadOutlined />
                EXPORT AS
              </Dropdown.Button>
            </div>

            {criteriaStatus == "Inclusion" ? (
              <div className="main-container">
                <div className="left-container">
                  <div className="item">
                    <span>Inclusion Criteria Library</span>
                    <CloseOutlined className="right-icon"></CloseOutlined>
                    <HistoryOutlined className="right-icon"></HistoryOutlined>
                  </div>
                  <Divider
                    style={{
                      borderWidth: 2,
                      borderColor: "#c4bfbf",
                      marginTop: 5,
                      marginBottom: 5,
                    }}
                  />
                  <div className="item">
                    <div className="tip-1">
                      <span>Select / Unselect criteria to add to Trial</span>
                    </div>
                    <div className="tip-2">
                      <span className="label">CRITERIA FREQUENCY</span>
                      <br />
                      <div
                        id="freqModal"
                        ref={null}
                        onClick={() => setVisible(true)}
                      >
                        <span className="label">
                          {minValue}%-{maxValue}%
                        </span>
                        <EditFilled />
                      </div>
                    </div>
                  </div>
                  {visible ? (
                    <div className="freqSection">
                      <div className="title">
                        <span>Set Frequency</span>
                        <CloseOutlined
                          className="right-icon"
                          onClick={() => setVisible(false)}
                        ></CloseOutlined>
                      </div>
                      <div className="content">
                        <span>Criteria Frequency</span>
                        <span style={{ float: "right" }}>
                          {minValue}% - {maxValue}%
                        </span>
                      </div>
                      <Slider
                        range={{ draggableTrack: true }}
                        defaultValue={[frequencyFilter[0], frequencyFilter[1]]}
                        tipFormatter={formatter}
                        onAfterChange={getFrequency}
                      />
                    </div>
                  ) : (
                    <></>
                  )}
                  <div className="content-outer">
                    <div className="content-over">
                      <div className="item box">
                        <span>Demographics</span>
                        <br />
                        {demographics.map((demographic, idx) => {
                          return (
                            <CriteriaOption
                              key={`demographic_${idx}`}
                              demographic={demographic}
                              index={0}
                              idx={idx}
                              handleOptionSelect={handleOptionSelect}
                            ></CriteriaOption>
                          );
                        })}
                      </div>

                      <div className="item box">
                        <span>Medical Condition</span>
                        <br />
                        {medCondition.map((medCon, idx) => {
                          return (
                            <CriteriaOption
                              key={`medCon_${idx}`}
                              demographic={medCon}
                              index={1}
                              idx={idx}
                              handleOptionSelect={handleOptionSelect}
                            ></CriteriaOption>
                          );
                        })}
                      </div>

                      <div className="item box">
                        <span>Intervention</span>
                        <br />
                        {intervention.map((intervent, idx) => {
                          return (
                            <CriteriaOption
                              key={`intervent_${idx}`}
                              demographic={intervent}
                              index={2}
                              idx={idx}
                              handleOptionSelect={handleOptionSelect}
                            ></CriteriaOption>
                          );
                        })}
                      </div>

                      <div className="item box">
                        <span>Lab / Test</span>
                        <br />
                        {labTest.map((lib, idx) => {
                          return (
                            <CriteriaOption
                              key={`lib_${idx}`}
                              demographic={lib}
                              index={3}
                              idx={idx}
                              handleOptionSelect={handleOptionSelect}
                            ></CriteriaOption>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="updateTrial">
                    <Button className="update-btn" onClick={updateTrial}>
                      UPDATE MY TRIAL
                    </Button>
                  </div>
                </div>
                <div
                  className={`right-container ${
                    collapsible ? "none-click" : ""
                  }`}
                >
                  <h4>Add Inclusion Criteria</h4>
                  <span className="tip1-desc">
                    Use the historical trial library on the left to build the
                    I/E criteria for your scenario.
                  </span>
                  <div className="option-item">
                    <div>
                      <Collapse
                        activeKey={activeKey}
                        onChange={callback}
                        expandIconPosition="right"
                      >
                        <Panel
                          header={panelHeader()}
                          key="1"
                          forceRender={false}
                        >
                          <div className="chart-container">
                            <div className="label">
                              <span>Click on each metrics to filter</span>
                            </div>
                            <CustomChart
                              option={amendmentRateoption}
                              height={120}
                            ></CustomChart>
                          </div>
                          <div className="chart-container  box">
                            <div className="label">
                              <span>Click on each metrics to filter</span>
                            </div>
                            <CustomChart
                              option={screenFaliureOption}
                              height={120}
                            ></CustomChart>
                          </div>
                        </Panel>
                      </Collapse>
                    </div>
                    <div className="impact-summary">
                      <span>Inclusion Criteria</span>
                      <Button type="primary" onClick={saveInclusionCriteria}>
                        Save
                      </Button>
                    </div>

                    <div className="content-outer">
                      <div
                        className={`collapse-inner ${
                          rollHeight == true ? "taller" : ""
                        }`}
                      >
                        <div className="criteria-list">
                          <div className="list-columns">
                            <div className="col-item">Eligibility Criteria</div>
                            <div className="col-item">Values</div>
                            <div className="col-item">Timeframe</div>
                          </div>
                        </div>
                        <div className="sectionPanel">
                          <Collapse
                            activeKey={defaultActiveKey}
                            onChange={callback}
                            expandIconPosition="left"
                            expandIcon={({ isActive }) => (
                              <CaretRightOutlined rotate={isActive ? 90 : 0} />
                            )}
                          >
                            <Panel
                              header={panelHeaderSection(
                                "Demographics",
                                collapsible ? 0 : demographicsElements.length
                              )}
                              key="2"
                              forceRender={false}
                            >
                              <EditTable
                                updateIclusionCriteria={updateIclusionCriteria}
                                tableIndex={1}
                                data={demographicsElements}
                              />
                            </Panel>
                            <Panel
                              header={panelHeaderSection(
                                "Medical Condition",
                                collapsible ? 0 : medConditionElements.length
                              )}
                              key="3"
                              forceRender={false}
                            >
                              <EditTable
                                updateIclusionCriteria={updateIclusionCriteria}
                                tableIndex={2}
                                data={medConditionElements}
                              />
                            </Panel>
                            <Panel
                              header={panelHeaderSection(
                                "Intervention",
                                collapsible ? 0 : interventionElements.length
                              )}
                              key="4"
                              forceRender={false}
                            >
                              <EditTable
                                updateIclusionCriteria={updateIclusionCriteria}
                                tableIndex={3}
                                data={interventionElements}
                              />
                            </Panel>
                            <Panel
                              header={panelHeaderSection(
                                "Lab / Test",
                                collapsible ? 0 : labTestElements.length
                              )}
                              key="5"
                              forceRender={false}
                            >
                              <EditTable
                                updateIclusionCriteria={updateIclusionCriteria}
                                tableIndex={4}
                                data={labTestElements}
                              />
                            </Panel>
                          </Collapse>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : criteriaStatus == "Exclusion" ? (
              <CustomChart
                option={amendmentRateoption}
                height={120}
              ></CustomChart>
            ) : (
              <span>Enrollment</span>
            )}
          </div>
        </div>
        <div className="action-footer">
          <Button type="primary" onClick={() => next(step2)}>
            NEXT
          </Button>
        </div>
      </div>
    );
    
}


export default withRouter(NewScenarioStepTwo);