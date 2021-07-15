import React, { useState, useReducer, useEffect } from "react";
import { withRouter } from "react-router";
import { Tabs } from 'antd';
import { ArrowLeftOutlined} from "@ant-design/icons";
import "./index.scss";

const { TabPane } = Tabs;
const initialNumber = {
    visitNumber: 9,
    weekNumber: 26
}

const CATEGORY_LABS = 'Labs';
const CATEGORY_PHYSICAL_EXAMINATION = 'Physical Examination';
const CATEGORY_PROCEDURES = 'Procedures';
const CATEGORY_QUESTIONNAIRES = 'Questionnaires';
const CATEGORY_STUDY_PROCEDURES = 'Study Procedures';

const ScenarioDetails = (props: any) => {
  const [record, setRecord] = useState(props.record || {});
  const [scenario, setScenario] = useState({});

  // inclusion criteria data for EditTable
  let [demographicsTableData, setDemographicsTableData] = useState([])
  let [interventionTableData, setInterventionTableData] = useState([])
  let [medConditionTableData, setMedConditionTableData] = useState([])
  let [labTestTableData, setLabTestTableData] = useState([])

  // exclusion criteria data for EditTable
  let [excluDemographicsTableData, setExcluDemographicsTableData] = useState([])
  let [excluInterventionTableData, setExcluInterventionTableData] = useState([])
  let [excluMedConditionTableData, setExcluMedConditionTableData] = useState([])
  let [excluLabTestTableData, setExcluLabTestTableData] = useState([])

  //Addedd data 
  let [addedLabs, setAddedLabs] = useState([])
  let [addedExamination, setAddedExamination] = useState([])
  let [addedQuestionnaires, setAddedQuestionnaires] = useState([])
  let [addedProcedures, setAddedProcedures] = useState([])
  let [addedStudyProcedures, setAddedStudyProcedures] = useState([])

  const [numbers, setNumbers] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    { ...initialNumber }
  );
  const [weeks, setWeeks] = useState([])

  useEffect(() => {
    const scenario = props.record.scenarios.find((e) => e['scenario_id'] === props.scenarioId)
    const eventsConfigure = scenario['Schedule of Events']

    if(scenario != undefined){
        setScenario(scenario)
        if(scenario['Inclusion Criteria'].Demographics !== undefined 
            && scenario['Inclusion Criteria'].Demographics.Entities !== undefined){
            setDemographicsTableData(scenario['Inclusion Criteria'].Demographics.Entities)
            setInterventionTableData(scenario['Inclusion Criteria'].Intervention.Entities)
            setMedConditionTableData(scenario['Inclusion Criteria']['Medical Condition'].Entities)
            setLabTestTableData(scenario['Inclusion Criteria']['Lab / Test'].Entities)
            
            setExcluDemographicsTableData(scenario['Exclusion Criteria'].Demographics.Entities)
            setExcluInterventionTableData(scenario['Exclusion Criteria']['Medical Condition'].Entities)
            setExcluMedConditionTableData(scenario['Exclusion Criteria'].Intervention.Entities)
            setExcluLabTestTableData(scenario['Exclusion Criteria']['Lab / Test'].Entities)
        }
    }

    if(eventsConfigure != undefined && eventsConfigure.Labs != undefined){
        setNumbers({
          ['visitNumber']: eventsConfigure.Visits,
          ['weekNumber']: eventsConfigure.Weeks[eventsConfigure.Weeks.length -1]
        });
        setWeeks(eventsConfigure.Weeks)
        
        setAddedLabs(eventsConfigure[CATEGORY_LABS].entities)
        setAddedExamination(eventsConfigure[CATEGORY_PHYSICAL_EXAMINATION].entities)
        setAddedQuestionnaires(eventsConfigure[CATEGORY_QUESTIONNAIRES].entities)
        setAddedProcedures(eventsConfigure[CATEGORY_PROCEDURES].entities)
        setAddedStudyProcedures(eventsConfigure[CATEGORY_STUDY_PROCEDURES].entities)
      } 
  },[props.record, props.scenarioId]);
  
  return (
    <>
        <div className="trial-detail-container">
            <div className="scenario-info">
                <span className="go-back" onClick={props.handleBack}><ArrowLeftOutlined />&nbsp;BACK</span>
                <span className="scenario-type">{scenario['scenario_type']}&nbsp;:&nbsp;{scenario['scenario_name']}</span>
                <span className="scenario-desc">{scenario['scenario_description']}</span>
            </div>
            <div className="info">
                <div className="info-row">
                <div className="scenario-section">
                    <span className="section-title">Protocol Amendment Rate</span>
                    <span className="section-value">{scenario["protocol_amendment_rate"]}</span>
                    <span className={`section-level ${scenario["protocol_amendment_rate_state"]}`}>{scenario["protocol_amendment_rate_state"]}</span>
                </div>
                <div className="scenario-section">
                    <span className="section-title">Screen Failure Rate</span>
                    <span className="section-value">{scenario["screen_failure_rate"]}</span>
                    <span className={`section-level ${scenario["screen_failure_rate_state"]}`}>{scenario["screen_failure_rate_state"]}</span>
                </div>
                <div className="scenario-section">
                    <span className="section-title">Patient Burden</span>
                    <span className="section-value">{scenario["patient_burden"]}</span>
                    <span className={`section-level ${scenario["patient_burden_state"]}`}>{scenario["patient_burden_state"]}</span>
                </div>
                <div className="scenario-section">
                    <span className="section-title">Cost</span>
                    <span className="section-value">{scenario["cost"]}</span>
                    <span className={`section-level ${scenario["cost_state"]}`}>{scenario["cost_state"]}</span>
                </div>
                </div>
            </div>
        </div>
        <div className="rationale-info">
            <span className="title">Rationale</span>
            <span className="content">{scenario['rationale']}</span>
        </div>
        <Tabs defaultActiveKey="1" centered>
            <TabPane tab="INCLUSION / EXCLUSION CRITERIA" key="1">
                INCLUSION / EXCLUSION CRITERIA
            </TabPane>
            <TabPane tab="SCHEDULE OF EVENTS" key="2">
                INCLUSION / EXCLUSION CRITERIA
            </TabPane>
        </Tabs>
    </>
  );
};

export default withRouter(ScenarioDetails);
