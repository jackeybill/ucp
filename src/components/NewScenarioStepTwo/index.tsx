import React, { useState, useReducer, useEffect} from 'react';
import {Input, Button, Select, Tooltip, Collapse} from "antd";
import {getSummaryDefaultList} from "../../utils/ajax-proxy";
import { withRouter } from 'react-router';
import "./index.scss";

import CriteriaOption from "../CriteriaOption";
import CustomChart from "../CustomChart";

const { TextArea } = Input;
const { Panel } = Collapse;

const step1 = 'Scenario';
const step2 = 'Criteria';
const step3 = 'Schedule';

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
                <div className="header-section"><span>{header}({count == 0? 0:count})</span></div>
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
    const [criteriaStatus, setCriteriaStatus] = useState("Inclusion");
    const [rollHeight, setRollHeight] = useState(true)
    const [inclusionCriteria, setInclusionCriteria] = useState([])
    const [exclusionCriteria, setExclusionCriteria] = useState([])

const next = (step) =>{
    setCurrentAddStep(step)
}

const handleOptionSelect = (item, activeType, id, key) =>{
    console.log('id: ' + id + ', key: ' + key + ', selected: ' + activeType)
    switch(id){
        case 0:
            var index = demographicsElements.indexOf(item)
            if(activeType == 1){
                if(index < 0){
                    demographicsElements.push(item)
                }
            } else {
                if(index >= 0){
                    demographicsElements.splice(item,1)
                }
            }
            break;
        case 1:
            var index = medConditionElements.indexOf(item)
            if(activeType == 1){
                if(index < 0){
                    medConditionElements.push(item)
                }
            } else {
                if(index >= 0){
                    medConditionElements.splice(item,1)
                }
            }
            break;
        case 2:
            var index = interventionElements.indexOf(item)
            if(activeType == 1){
                if(index < 0){
                    interventionElements.push(item)
                }
            } else {
                if(index >= 0){
                    interventionElements.splice(item,1)
                }
            }
            break;
        default:
            var index = labTestElements.indexOf(item)
            if(activeType == 1){
                if(index < 0){
                    labTestElements.push(item)
                    console.log(labTestElements.length)
                }
            } else {
                if(index >= 0){
                    labTestElements.splice(item,1)
                    console.log(labTestElements.length)
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
            setInclusionCriteria(response[0].InclusionCriteria)
            setExclusionCriteria(response[1].ExclusionCriteria)

            const criteria = response[0].InclusionCriteria
            
            for(var i = 0; i < criteria.length; i ++){
                if(getCatorgoryIndex(i, criteria) == 0){
                    setMedCondition(criteria[i]['Medical Condition'])
                    medConditionElements = criteria[i]['Medical Condition'].filter((d) => {
                        return d.Count  == 1;
                    });
                    console.log(medConditionElements)
                } else if(getCatorgoryIndex(i, criteria) == 1){ 
                    setDemographics(criteria[i]['Demographics'])
                    demographicsElements = criteria[i]['Demographics'].filter((d) => {
                        return d.Count  == 1;
                    });
                } else if(getCatorgoryIndex(i, criteria) == 2){
                    setLabTest(criteria[i]['Lab/Test'])
                    labTestElements = criteria[i]['Lab/Test'].filter((d) => {
                        return d.Count  == 1;
                    });
                } else if(getCatorgoryIndex(i, criteria) == 3){
                    setIntervention(criteria[i]['Intervention'])
                    interventionElements = criteria[i]['Intervention'].filter((d) => {
                        return d.Count  == 1;
                    });
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

    

    return (
        <div className="trial-portfolio-container">
        <div> 
            <div className="upper step-item">
                <div className="action-part">
                    <div className="status-filter">
                        <div className={`in-progress item ${criteriaStatus == "Inclusion" ? "active" : ""}`}
                            onClick={() => setCriteriaStatus("Inclusion")}>
                            <span className="status">Inclusion Criteria</span>
                        </div>
                        <div className={`in-progress item ${criteriaStatus == "Exclusion" ? "active" : ""}`}
                            onClick={() => setCriteriaStatus("Exclusion")}>
                            <span className="status">Exclusion Criteria</span>
                        </div>
                        <div className={`in-progress item ${criteriaStatus == "Enrollment" ? "active" : ""}`}
                            onClick={() => setCriteriaStatus("Enrollment")}>
                            <span className="status">Enrollment Feasibility</span>
                        </div>
                        
                    </div>
                </div>
                <div className="export-part">
                    <Select defaultValue="EXPORT AS"></Select>
                </div>

                {criteriaStatus == 'Inclusion' ? (
                <div className="main-container">
                    <div className="left-container">
                        <div className="item"><span>Inclusion Criteria Library</span></div>
                        <hr/>
                        <div className="item">
                            <div className="tip-1"><span>Select / Unselect criteria to add to Trial</span></div>
                            <div className="tip-2">
                                <span>CRITERIA FREQUENCY</span>
                                <div>ICON</div>
                            </div>
                        </div>

                        <div className="content-outer">
                        <div className="content-over">
                            <div className="item box">
                                <span>Demographics</span><br/>
                                {demographics.map((demographic, idx) => {
                                    return(
                                        <CriteriaOption demographic={demographic} index={0} idx={idx} handleOptionSelect={handleOptionSelect}></CriteriaOption>
                                    )
                                })}
                            </div>

                            <div className="item box">
                                <span>Medical Condition</span><br/>
                                {medCondition.map((medCon, idx) => {
                                    return(
                                        <CriteriaOption demographic={medCon} index={1} idx={idx} handleOptionSelect={handleOptionSelect}></CriteriaOption>
                                    )
                                })}
                            </div>

                            <div className="item box">
                                <span>Intervention</span><br/>
                                {intervention.map((intervent, idx) => {
                                    return(
                                        <CriteriaOption demographic={intervent} index={2} idx={idx} handleOptionSelect={handleOptionSelect}></CriteriaOption>
                                    )
                                })}
                            </div>

                            <div className="item box">
                                <span>Lab / Test</span><br/>
                                {labTest.map((lib, idx) => {
                                    return(
                                        <CriteriaOption demographic={lib} index={3} idx={idx} handleOptionSelect={handleOptionSelect}></CriteriaOption>
                                    )
                                })}
                            </div>
                        </div>
                        </div>
                        <div className="updateTrial"><Button className="update-btn">UPDATE MY TRIAL</Button></div>
                        
                        
                    </div>
                    <div className="right-container">
                        <h4>Add Inclusion Criteria</h4>
                        <span className="tip1-desc">Use the historical trial library on the left to build the I/E criteria for your scenario.</span>
                        <div className="option-item">
                            <div>
                            <Collapse defaultActiveKey={null} onChange={callback} expandIconPosition="right">
                                <Panel header={panelHeader()} key="1">
                                    <div className="chart-container">
                                        <div  className="label"><span>Click on each metrics to filter</span></div>
                                        <CustomChart option={amendmentRateoption} height={120}></CustomChart>
                                    </div>
                                    <div className="chart-container  box">
                                        <div className="label"><span>Click on each metrics to filter</span></div>
                                        <CustomChart option={screenFaliureOption} height={120}></CustomChart>
                                    </div>
                                </Panel>
                            </Collapse>
                            </div>
                            <div className="impact-summary">
                                <span>Inclusion Criteria</span>
                                <Button type="primary">Save</Button>
                            </div>

                            <div className="content-outer">
                            <div className={`collapse-inner ${rollHeight == true? 'taller' : ''}`}>
                            <div className="criteria-list">
                                <div className="list-columns">
                                    <div className="col-item">Eligibility Criteria</div>
                                    <div className="col-item">Values</div>
                                    <div className="col-item">Timeframe</div>
                                </div>
                            </div>
                            <div className="sectionPanel">
                            <Collapse defaultActiveKey={null} onChange={callback} expandIconPosition="left">
                                <Panel header={panelHeaderSection("Demographics", 0)} key="2">
                                    <p>test</p>
                                </Panel>
                                <Panel header={panelHeaderSection("Medical Condition", 0)} key="3">
                                    <p>test</p>
                                </Panel>
                                <Panel header={panelHeaderSection("Intervention", 0)} key="4">
                                    <p>test</p>
                                </Panel>
                                <Panel header={panelHeaderSection("Lab / Test", 0)} key="5">
                                    <p>test</p>
                                </Panel>
                            </Collapse>
                            </div>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
                ) : criteriaStatus == 'Exclusion' ? (
                    <CustomChart option={amendmentRateoption} height={120}></CustomChart>
                ) : (
                    <span>Enrollment</span>
                )}
                
            </div>
            
        </div>
        <div className="action-footer">
                    <Button type="primary" onClick={()=>next(step2)}>NEXT</Button>
                    {/* <Button className="view-btn" onClick={()=>props.history.push('/trials')}>CANCEL</Button> */}
                </div>
    </div>    
    )
    
}


export default withRouter(NewScenarioStepTwo);