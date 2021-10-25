import React, { useState, useEffect, useReducer} from 'react';
import jsPDF from "jspdf";
import 'jspdf-autotable';
import FileSaver from 'file-saver';
import {Button, Collapse, Slider, Dropdown,Menu, Modal, Row, Col, Tabs, Tooltip, Spin, message, Steps,Drawer} from "antd";
import {getSummaryDefaultList, updateStudy, getSimilarhistoricalTrialById, getStudy, getSummaryListByNctId, getCriteriaLibByNctId, getSOAResource, getIEResource, getAverage} from "../../utils/ajax-proxy";
import {withRouter } from 'react-router';
import {LeftOutlined, HistoryOutlined, CloseOutlined, EditFilled, DownOutlined,DownloadOutlined, CaretRightOutlined, LoadingOutlined, ArrowRightOutlined} from "@ant-design/icons";
import ReactECharts from 'echarts-for-react';
import "./index.scss";

import CriteriaOption from "../../components/CriteriaOption";
import EditTable from "../../components/EditTable";
import SelectableTable from "../../components/SelectableTable";
import ScheduleEvents from "../../components/ScheduleEvents";


const { Panel } = Collapse;
const { TabPane } = Tabs;
const { Step } = Steps;

const frequencyFilter = [5, 100]
const inActiveChartColors = ['#DADADA', '#DADADA', '#DADADA', '#DADADA']
const activeChartColors = ['#E53500', '#F27A26', '#F5924D', '#FBD0B3']
const simliarTrialStudyStartDate = { dateFrom: 1990, dateTo: 2020}


const panelHeader = () => {
    return (
        <div className="trial-panelHeader">
            <div>
                <div className="bar-desc"><span>Impact</span></div>
                <div className="item-desc"><div className="bar-item item1"></div><span>Labs / Tests</span></div>
                <div className="item-desc"><span className="bar-item item2"></span><span>Intervention</span></div>
                <div className="item-desc"><span className="bar-item item3"></span><span>Demographics</span></div>
                <div className="item-desc"><span className="bar-item item4"></span><span>Medical Condition</span></div>
            </div>
        </div>
    );
};

const defaultChartValue = [
  {value: 0, name: 'Labs / Tests'},
  {value: 0, name: 'Intervention'},
  {value: 0, name: 'Demographics'},
  {value: 0, name: 'Medical Condition'}
]

const initialTrial = {
    scenarios:[]
}
const initialScenario = {
    scenario_id: "",
    scenario_name: "",
    scenario_description: "",
    protocol_amendment_rate: "",
    screen_failure_rate: "",
    patient_burden: "",
    cost: "",
    "Inclusion Criteria": {},
    "Exclusion Criteria": {},
    "Enrollment Feasibility": {},
    "Schedule of Events": {}
};

let resultdata = [80, 100, 200, 250, 300, 400, 475, 500];
let femaleFreq = [20, 24, 25, 30, 35, 49, 52, 55];
let raceFreq = [5, 8, 9, 10, 15, 20, 24, 25];

const CATEGORY_LABS = 'Labs';
const CATEGORY_PHYSICAL_EXAMINATION = 'Physical Examination';
const CATEGORY_PROCEDURES = 'Procedures';
const CATEGORY_QUESTIONNAIRES = 'Questionnaires';
const CATEGORY_STUDY_PROCEDURES = 'Study Procedures';

const visitDimensionalScore = [
  {Dimension: 'AnxietyInducing', Value: 5},
  {Dimension: 'HospitalDependent', Value: 25},
  {Dimension: 'PhysicallyInvasive', Value: 10},
  {Dimension: 'BloodDraw', Value: 15},
  {Dimension: 'Sedation', Value: 35},
  {Dimension: 'Injection', Value: 15},
  {Dimension: 'Urine', Value: 5},
  {Dimension: 'RequireFasting', Value: 7},
  {Dimension: 'LongerThanTwoHours', Value: 20},
  {Dimension: 'Questionnaire', Value: 5}
]

const ScenarioPage = (props) => {
    //Common cons
    const [trialTitle, setTrialTitle] = useState('')
    const [trialRecord, setTrialRecord] = useReducer(
        (state, newState) => ({ ...state, ...newState }),
        { ...initialTrial }
    );
    const [scenario, setScenario] = useReducer(
        (state, newState) => ({ ...state, ...newState }),
        { ...initialScenario }
    );

    const [scenarioId, setScenarioId] = useState('')
    const [editFlag, setEditFlag] = useState(false)
    const [avgFileKey, setAvgFileKey] = useState('')
    const [scenarioType, setScenarioType] = useState('')
    const [activeEnrollmentTabKey, setActiveEnrollmentTabKey] = useState('1')
    const [activeTabKey, setActiveTabKey] = useState('1')
    const [processStep, setProcessStep] = useState(0)
    const [submitType, setSubmitType] = useState(0)
    const [similarHistoricalTrials, setSimilarHistoricalTrials] = useState([])
    const [spinning, setSpinning] = useState(false)
    const [showChartLabel, setShowChartLabel] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)

    const [showHistorical, setShowHistorical] = useState(false)
    const [historicalTrialdata, setHistoricalTrialdata] = useState([])
    const [freqColor, setFreqColor] = useState('#EF7A57')
    const [freqFontColor, setFreqFontColor] = useState('#fff')
    const [totalData, setTotalData] = useState([])
    const [freqData, setFreqdata] = useState([])
    const [chartTitle, setChartTitle] = useState('Patients Eligible - 80K(16% of Dataset)')
    const [visibleSOA, setVisibleSOA] = useState(false)
    const [soaResource, setSOAResource] = useState([])
    const [ieResource, setIEResource] = useState('')
    const [avgResource, setAvgResource] = useState(false)
    const [inclusionResourceAvg, setInclusionResourceAvg] = useState([])
    const [exclusionResourceAvg, setExclusionResourceAvg] = useState([])

    //------------------------INCLUSION CRITERIA CONST START-----------------------------
    //Original libs for filter purpose
    const [originDemographics, setOriginDemographics] = useState([])
    const [originIntervention, setOriginIntervention] = useState([])
    const [originMedCondition, setOriginMedCondition] = useState([])
    const [originLabTest, setOriginLabTest] = useState([])

    //Filtered libs for display and selection purpose
    const [demographics, setDemographics] = useState([])
    const [intervention, setIntervention] = useState([])
    const [medCondition, setMedCondition] = useState([])
    const [labTest, setLabTest] = useState([])
    
    //For inclusion chart data display
    const [protocolRateData, setProtocolRateData] = useState(defaultChartValue)
    const [screenRateData, setScreenRateData] = useState(defaultChartValue)
    const [therapeutic_Amend_Avg, setTherapeutic_Amend_Avg] = useState('')
    const [therapeutic_Screen_Avg, setTherapeutic_Screen_Avg] = useState('')
    const [impactColors, setImpactColors] = useState(inActiveChartColors)
    const [amend_avg_rate, setAmend_avg_rate] = useState('')
    const [screen_avg_rate, setScreen_avg_rate] = useState('')

    const [rollHeight, setRollHeight] = useState(true)            // Control editTable scroll height
    const [visible, setVisible] = useState(false)                 // Control libs filter slider bar display or not
    const [minValue, setMinValue] = useState(frequencyFilter[0])  //Slider bar minimon value
    const [maxValue, setMaxValue] = useState(frequencyFilter[1])  //Slider bar maximom value
    const [defaultActiveKey, setDefaultActiveKey] = useState([])  //default expanded collapse for edittable
    const [activeKey, setActiveKey] = useState([])                //To control chart collapse expanding
    const [collapsible, setCollapsible] = useState(true)// Set collapse can be click to collapse/expand or not
    const [criteriaLib, setCriteriaLib] = useState(6)
  
    //To store the selected inclusion criteria libs
   let [demographicsElements, setDemographicsElements] = useState([])
   let [interventionElements , setInterventionElements ] = useState([])
   let [medConditionElements, setMedConditionElements] = useState([])
   let [labTestElements, setLabTestElements] = useState([])
  
    // inclusion criteria data for EditTable
  let [demographicsTableData, setDemographicsTableData] = useState([])
  let [interventionTableData, setInterventionTableData] = useState([])
  let [medConditionTableData, setMedConditionTableData] = useState([])
  let [labTestTableData, setLabTestTableData] = useState([])
    //------------------------INCLUSION CRITERIA CONST END-----------------------------

    //------------------------EXCLUSION CRITERIA CONST START-----------------------------
    //Original libs for filter purpose
    const [originExcluDemographics, setOriginExcluDemographics] = useState([])
    const [originExcluIntervention, setOriginExcluIntervention] = useState([])
    const [originExcluMedCondition, setOriginExcluMedCondition] = useState([])
    const [originExcluLabTest, setOriginExcluLabTest] = useState([])

    //Filtered libs for display and selection purpose
    const [excluDemographics, setExcluDemographics] = useState([])
    const [excluMedCondition, setExcluMedCondition] = useState([])
    const [excluIntervention, setExcluIntervention] = useState([])
    const [excluLabTest, setExcluLabTest] = useState([])
    
    //For exclusion chart data display
    const [excluProtocolRateData, setExcluProtocolRateData] = useState(defaultChartValue)
    const [excluScreenRateData, setExcluScreenRateData] = useState(defaultChartValue)
    const [exclu_Therapeutic_Amend_Avg, setExcluTherapeutic_Amend_Avg] = useState('Therapeutic Area Average - 40%')
    const [exclu_Therapeutic_Screen_Avg, setExcluTherapeutic_Screen_Avg] = useState('Therapeutic Area Average - 35%')
    const [excluImpactColors, setExcluImpactColors] = useState(inActiveChartColors)
    const [excluAmend_avg_rate, setExcluAmend_avg_rate] = useState('')
    const [excluScreen_avg_rate, setExcluScreen_avg_rate] = useState('')

    const [excluRollHeight, setExcluRollHeight] = useState(true)            // Control editTable scroll height
    const [excluVisible, setExcluVisible] = useState(false);                // Control libs filter slider bar display or not
    const [excluMinValue, setExcluMinValue] = useState(frequencyFilter[0])  //Slider bar minimon value
    const [excluMaxValue, setExcluMaxValue] = useState(frequencyFilter[1])  //Slider bar maximom value
    const [excluDefaultActiveKey, setExcluDefaultActiveKey] = useState([])  //default expanded collapse for edittable
    const [excluActiveKey, setExcluActiveKey] = useState([])                //To control chart collapse expanding
    const [excluCollapsible, setExcluCollapsible] = useState(true)          // Set collapse can be click to collapse/expand or not
    const [excluCriteriaLib, setExcluCriteriaLib] = useState(6)

    //To store the selected exclusion criteria libs
    let [excluDemographicsElements, setExcluDemographicsElements] = useState([])
    let [excluMedConditionElements , setExcluMedConditionElements ] = useState([])
    let [excluInterventionElements, setExcluInterventionElements] = useState([])
    let [excluLabTestElements, setExcluLabTestElements] = useState([])
  
    // exclusion criteria data for EditTable
  let [excluDemographicsTableData, setExcluDemographicsTableData] = useState([])
  let [excluInterventionTableData, setExcluInterventionTableData] = useState([])
  let [excluMedConditionTableData, setExcluMedConditionTableData] = useState([])
  let [excluLabTestTableData, setExcluLabTestTableData] = useState([])
    //------------------------EXCLUSION CRITERIA CONST END-----------------------------
  
    const getTrialById = async () => {
      const resp = await getStudy(props.location.state.trial_id);
      console.log("getlist",resp);
      
      if(resp.statusCode == 200){
          const tempRecord = JSON.parse(JSON.stringify(resp.body))
          setTrialRecord(tempRecord)
          setTrialTitle(tempRecord['trial_alias'])
          if(tempRecord.similarHistoricalTrials !== undefined){
            setSimilarHistoricalTrials(tempRecord.similarHistoricalTrials)
          }
          
          const tempScenarioId = props.location.state.scenarioId
          const tempEditFlag = props.location.state.editFlag
          const tempScenarioType = props.location.state.scenarioType
          const tempScenario = tempRecord.scenarios.find( i=> i['scenario_id'] == tempScenarioId)
          setScenarioId(tempScenarioId)
          setEditFlag(tempEditFlag)
          setScenarioType(tempScenarioType)
          setScenario(tempScenario)

          console.log('edit scenario for: ' +  tempScenarioId + ': ' +  tempEditFlag)

          if(tempEditFlag && tempScenario['Inclusion Criteria'].Demographics !== undefined
            && tempScenario['Inclusion Criteria'].Demographics.Entities !== undefined){
              demographicsElements = tempScenario['Inclusion Criteria'].Demographics.Entities
              interventionElements = tempScenario['Inclusion Criteria'].Intervention.Entities
              medConditionElements = tempScenario['Inclusion Criteria']['Medical Condition'].Entities
              labTestElements = tempScenario['Inclusion Criteria']['Lab / Test'].Entities
              
              excluDemographicsElements = tempScenario['Exclusion Criteria'].Demographics.Entities
              excluMedConditionElements = tempScenario['Exclusion Criteria']['Medical Condition'].Entities
              excluInterventionElements = tempScenario['Exclusion Criteria'].Intervention.Entities
              excluLabTestElements = tempScenario['Exclusion Criteria']['Lab / Test'].Entities

              //Get inclusion chart info
              var inclu = tempScenario["Inclusion Criteria"]
              
              setProtocolRateData([
                  {value: formatNumber(inclu['Lab / Test'].protocol_amendment_rate), name: 'Labs / Tests'},
                  {value: formatNumber(inclu.Intervention.protocol_amendment_rate), name: 'Intervention'},
                  {value: formatNumber(inclu.Demographics.protocol_amendment_rate), name: 'Demographics'},
                  {value: formatNumber(inclu['Medical Condition'].protocol_amendment_rate), name: 'Medical Condition'}
              ])
              setScreenRateData([
                  {value: formatNumber(inclu['Lab / Test'].screen_failure_rate), name: 'Labs / Tests'},
                  {value: formatNumber(inclu.Intervention.screen_failure_rate), name: 'Intervention'},
                  {value: formatNumber(inclu.Demographics.screen_failure_rate), name: 'Demographics'},
                  {value: formatNumber(inclu['Medical Condition'].screen_failure_rate), name: 'Medical Condition'}
              ])
      
              var tempScoreA = ''
              var tempScoreB = ''
                  
                  var score = formatNumber(tempScenario.protocol_amendment_rate)
                  if(score <= 33){
                    tempScoreA = '{p|' + tempScenario.protocol_amendment_rate + '}\n{good|GOOD}'
                  } else if(score > 33  && score <= 67){
                    tempScoreA = '{p|' + tempScenario.protocol_amendment_rate + '}\n{fair|FAIR}'
                  } else if(score > 67){
                    tempScoreA = '{p|' + tempScenario.protocol_amendment_rate + '}\n{poor|POOR}'
                  }

                  var scoreB = formatNumber(tempScenario.screen_failure_rate)
                  if(scoreB <= 33){
                    tempScoreB = '{p|' + tempScenario.screen_failure_rate + '}\n{good|GOOD}'
                  } else if(scoreB > 33  && scoreB <= 67){
                    tempScoreB = '{p|' + tempScenario.screen_failure_rate + '}\n{fair|FAIR}'
                  } else if(scoreB > 67){
                    tempScoreB = '{p|' + tempScenario.screen_failure_rate + '}\n{poor|POOR}'
                  }

                  setAmend_avg_rate(tempScoreA)
                  setScreen_avg_rate(tempScoreB)

              //Get exclusion chart info
              var exclu = tempScenario["Exclusion Criteria"]
              
              setExcluProtocolRateData([
                  {value: formatNumber(exclu['Lab / Test'].protocol_amendment_rate), name: 'Labs / Tests'},
                  {value: formatNumber(exclu.Intervention.protocol_amendment_rate), name: 'Intervention'},
                  {value: formatNumber(exclu.Demographics.protocol_amendment_rate), name: 'Demographics'},
                  {value: formatNumber(exclu['Medical Condition'].protocol_amendment_rate), name: 'Medical Condition'}
              ])
              setExcluScreenRateData([
                  {value: formatNumber(exclu['Lab / Test'].screen_failure_rate), name: 'Labs / Tests'},
                  {value: formatNumber(exclu.Intervention.screen_failure_rate), name: 'Intervention'},
                  {value: formatNumber(exclu.Demographics.screen_failure_rate), name: 'Demographics'},
                  {value: formatNumber(exclu['Medical Condition'].screen_failure_rate), name: 'Medical Condition'}
              ])
      
                  setExcluAmend_avg_rate(tempScoreA)
                  setExcluScreen_avg_rate(tempScoreB)

              setShowChartLabel(true)
              setImpactColors(activeChartColors)
              setExcluImpactColors(activeChartColors)
          }
          
          if(tempRecord['Therapeutic Area Average']){
            setTherapeutic_Amend_Avg('Therapeutic Area Average - ' + tempRecord['Therapeutic Area Average'].protocol_amendment_rate)
            setTherapeutic_Screen_Avg('Therapeutic Area Average - ' + tempRecord['Therapeutic Area Average'].screen_failure_rate)
            setExcluTherapeutic_Amend_Avg('Therapeutic Area Average - ' + tempRecord['Therapeutic Area Average'].protocol_amendment_rate)
            setExcluTherapeutic_Screen_Avg('Therapeutic Area Average - ' + tempRecord['Therapeutic Area Average'].screen_failure_rate)
          }
          
          if(tempEditFlag){
              updateTrial(1)
              updateTrial(2)
          }
      }
  };
    useEffect(() => {
      let tempData = [];
      for(let i = 0, l = resultdata.length; i < l; i++){
          var num = resultdata[i] + 100;
          tempData.push({'total': resultdata[i]+'K', 'value':num});
      }
      setTotalData(tempData)

      if(props.location.state.trial_id == undefined || props.location.state.trial_id == ''){
        props.history.push({pathname: '/trials'})
      } else {
       
        getTrialById();
      }
    }, []);

    useEffect(() => {

        const summaryDefaultList = async () => {
          const nctIdList = props.location.state.similarHistoricalTrials
          console.log("nctIdList",nctIdList);
          
          var resp
          // if(nctIdList != undefined && nctIdList instanceof Array && nctIdList.length > 0){
            console.log("input",props.location.state.similarHistoricalTrials);
            resp = await getCriteriaLibByNctId(props.location.state.similarHistoricalTrials);
            // console.log("criteria",resp);
          // } else {
          //   resp = await getSummaryDefaultList();
          //   console.log("default",resp);
          // }
          setPageLoading(false)
            if (resp.statusCode == 200) {
                setAvgFileKey(resp.csvKey)
                // const response = JSON.parse(resp.body)
                const response = resp.body
                console.log("criteria result: ", response);
                const inclusionCriteria = response[0].InclusionCriteria
                for(var i = 0; i < inclusionCriteria.length; i ++){
                    var incluIndex = getCatorgoryIndex(i, inclusionCriteria)
                    if(incluIndex == 0){
                        setOriginMedCondition(inclusionCriteria[i]['Medical Condition'])
                        setMedCondition(inclusionCriteria[i]['Medical Condition'].filter((d) => {
                            return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
                        }))
                    } else if(incluIndex == 1){ 
                        setOriginDemographics(inclusionCriteria[i]['Demographics'])
                        setDemographics(inclusionCriteria[i]['Demographics'].filter((d) => {
                            return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
                        }))
                    } else if(incluIndex == 2){
                        setOriginLabTest(inclusionCriteria[i]['Lab/Test'])
                        setLabTest(inclusionCriteria[i]['Lab/Test'].filter((d) => {
                            return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
                        }))
                    } else if(incluIndex == 3){
                        setOriginIntervention(inclusionCriteria[i]['Intervention'])
                        setIntervention(inclusionCriteria[i]['Intervention'].filter((d) => {
                            return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
                        }))
                    }
                }

                const exclusionCriteria = response[1].ExclusionCriteria
                for(var i = 0; i < exclusionCriteria.length; i ++){
                    var excluIndex = getCatorgoryIndex(i, exclusionCriteria)
                    if(excluIndex == 0){
                        setOriginExcluMedCondition(exclusionCriteria[i]['Medical Condition'])
                        setExcluMedCondition(exclusionCriteria[i]['Medical Condition'].filter((d) => {
                            return d.Frequency * 100 >= excluMinValue && d.Frequency * 100 <= excluMaxValue;
                        }))
                    } else if(excluIndex == 1){ 
                        setOriginExcluDemographics(exclusionCriteria[i]['Demographics'])
                        setExcluDemographics(exclusionCriteria[i]['Demographics'].filter((d) => {
                            return d.Frequency * 100 >= excluMinValue && d.Frequency * 100 <= excluMaxValue;
                        }))
                    } else if(excluIndex == 2){
                        setOriginExcluLabTest(exclusionCriteria[i]['Lab/Test'])
                        setExcluLabTest(exclusionCriteria[i]['Lab/Test'].filter((d) => {
                            return d.Frequency * 100 >= excluMinValue && d.Frequency * 100 <= excluMaxValue;
                        }))
                    } else if(excluIndex == 3){
                        setOriginExcluIntervention(exclusionCriteria[i]['Intervention'])
                        setExcluIntervention(exclusionCriteria[i]['Intervention'].filter((d) => {
                            return d.Frequency * 100 >= excluMinValue && d.Frequency * 100 <= excluMaxValue;
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
      } else if(list[index]['Intervention'] != undefined){
          return 3;
      }
    }


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
    }
    
    const getExcluFrequency = (value) => {
      setExcluMinValue(value[0])
      setExcluMaxValue(value[1])
    
      setExcluMedCondition(originExcluMedCondition.filter((d) => {
          return d.Frequency * 100 >= value[0] && d.Frequency * 100 <= value[1];
      }))
      setExcluDemographics(originExcluDemographics.filter((d) => {
          return d.Frequency * 100 >= value[0] && d.Frequency * 100 <= value[1];
      }))
      setExcluLabTest(originExcluLabTest.filter((d) => {
          return d.Frequency * 100 >= value[0] && d.Frequency * 100 <= value[1];
      }))
      setExcluIntervention(originExcluIntervention.filter((d) => {
          return d.Frequency * 100 >= value[0] && d.Frequency * 100 <= value[1];
      }))
    }

    const handleOptionSelect = (item, activeType, id, key) =>{
      switch(id){
        case 0:
          var index = demographicsElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
          if(activeType == 1){
            if(index < 0){
              var newItem = {
                "Eligibility Criteria": item.Text,
                "Values": item.Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(item),
                "Timeframe": item.Text.trim().toUpperCase() === 'INSULIN' ? formatValue(item) : "-",
                "Frequency":item.Frequency
              }
              demographicsElements.push(newItem)
            }
          } else {
            if(index >= 0){
              demographicsElements.splice(index, 1)         
            }
          }
          break;
        case 1:
          var index = medConditionElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
          if(activeType == 1){
            if(index < 0){
              var newItem = {
                "Eligibility Criteria": item.Text,
                "Values": item.Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(item),
                "Timeframe": item.Text.trim().toUpperCase() === 'INSULIN' ? formatValue(item) : "-",
                "Frequency":item.Frequency
              }
              medConditionElements.push(newItem)
            }
          } else {
            if(index >= 0){
              medConditionElements.splice(index, 1)
            }
          }
          break;
        case 2:
          var index = interventionElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
          if(activeType == 1){
            if(index < 0){
              var newItem = {
                "Eligibility Criteria": item.Text,
                "Values": item.Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(item),
                "Timeframe": item.Text.trim().toUpperCase() === 'INSULIN' ? formatValue(item) : "-",
                "Frequency":item.Frequency
              }
              interventionElements.push(newItem)           
            }
          } else {
            if(index >= 0){
              interventionElements.splice(index, 1)             
            }
          }
          break;
        default:
          var index = labTestElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
          if(activeType == 1){
            if(index < 0){
              var newItem = {
                "Eligibility Criteria": item.Text,
                "Values": item.Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(item),
                "Timeframe": item.Text.trim().toUpperCase() === 'INSULIN' ? formatValue(item) : "-",
                "Frequency":item.Frequency
              }
              labTestElements.push(newItem)
            }
          } else {
            if(index >= 0){
              labTestElements.splice(index, 1)
            }
          }
          break;
      }
    }

    function formatValue(item){
      console.log(item.Text, item.Value);
      
      var tempStr
      if(item.Value === ''){
        tempStr = '-'
      } else if (item.Value.avg_value != '' && item.Value.avg_value != 0) {
        tempStr = Number(item.Value.avg_value.toString().match(/^\d+(?:\.\d{0,2})?/)) + " " + item.Value.units
      } else if (item.Value.avg_lower == 0 && item.Value.avg_upper != 0) {
        tempStr = "< "+ Number(item.Value.avg_upper.toString().match(/^\d+(?:\.\d{0,2})?/))+ " " + item.Value.units
      } else if (item.Value.avg_lower != 0 && item.Value.avg_upper == 0) {
        tempStr = "> "+ Number(item.Value.avg_lower.toString().match(/^\d+(?:\.\d{0,2})?/))+ " " + item.Value.units
      } else if (item.Value.avg_lower != 0 && item.Value.avg_upper != 0) {
        if (Number(item.Value.avg_lower) == Number(item.Value.avg_upper)){
          tempStr = Number(item.Value.avg_upper.toString().match(/^\d+(?:\.\d{0,2})?/)) + " " + item.Value.units
        } else {
          tempStr = Number(item.Value.avg_lower.toString().match(/^\d+(?:\.\d{0,2})?/))+ " - " + Number(item.Value.avg_upper.toString().match(/^\d+(?:\.\d{0,2})?/)) + " " + item.Value.units
        }
      } else{
        tempStr = '-'
      }
      return tempStr
    }

    const handleExcluOptionSelect = (item, activeType, id, key) =>{
      switch(id){
        case 0:
          var index = excluDemographicsElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
          if(activeType == 1){
            if(index < 0){
              var newItem = {
                "Eligibility Criteria": item.Text,
                // "Values": formatValue(item),
                // "Timeframe": "-",
                "Values": item.Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(item),
                "Timeframe": item.Text.trim().toUpperCase() === 'INSULIN' ? formatValue(item) : "-",
                "Frequency":item.Frequency
              }
              excluDemographicsElements.push(newItem)
            }
          } else {
            if(index >= 0){
              excluDemographicsElements.splice(index,1)
            }
          }
          break;
        case 1:
          var index = excluMedConditionElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
          if(activeType == 1){
            if(index < 0){
              var newItem = {
                "Eligibility Criteria": item.Text,
                // "Values": formatValue(item),
                // "Timeframe": "-",
                "Values": item.Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(item),
                "Timeframe": item.Text.trim().toUpperCase() === 'INSULIN' ? formatValue(item) : "-",
                "Frequency":item.Frequency
              }
              excluMedConditionElements.push(newItem)
            }
          } else {
            if(index >= 0){
              excluMedConditionElements.splice(index,1)
            }
          }
          break;
        case 2:
          var index = excluInterventionElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
          if(activeType == 1){
            if(index < 0){
              var newItem = {
                "Eligibility Criteria": item.Text,
                // "Values": formatValue(item),
                // "Timeframe": "-",
                "Values": item.Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(item),
                "Timeframe": item.Text.trim().toUpperCase() === 'INSULIN' ? formatValue(item) : "-",
                "Frequency":item.Frequency
              }
              excluInterventionElements.push(newItem)
            }
          } else {
            if(index >= 0){
              excluInterventionElements.splice(index,1)
            }
          }
          break;
        default:
          var index = excluLabTestElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
          if(activeType == 1){
            if(index < 0){
              var newItem = {
                "Eligibility Criteria": item.Text,
                // "Values": formatValue(item),
                // "Timeframe": "-",
                "Values": item.Text.trim().toUpperCase() === 'INSULIN' ? '-' : formatValue(item),
                "Timeframe": item.Text.trim().toUpperCase() === 'INSULIN' ? formatValue(item) : "-",
                "Frequency":item.Frequency
              }
              excluLabTestElements.push(newItem)
            }
          } else {
            if(index >= 0){
              excluLabTestElements.splice(index,1)
          }
        }
        break;
      }
    }

  const updateTrial = (type: number) => {
      if (type == 1) {//Inclusion
        
        let demographicsElementsTmp = demographicsElements.map((item,index) =>{
          return Object.assign(item,{Key:(index + 1) + ''})
        })
        let demographicsTableDataTmp = demographicsElementsTmp.filter(d => {
          return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
        })
        setDemographicsElements(demographicsElementsTmp)
        setDemographicsTableData(demographicsTableDataTmp.map((item, id) =>{
          item.Key = (id + 1) + ''
          return item
        }))
        console.log("demographicsElementsTmp",demographicsElementsTmp);
        

        let medConditionElementsTmp = medConditionElements.map((item,index) =>{
          return Object.assign(item,{Key:(index + 1) + ''})
        })
        let medConditionTableDataTmp = medConditionElementsTmp.filter(d => {
          return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
        })
        setMedConditionElements(medConditionElementsTmp)
        setMedConditionTableData(medConditionTableDataTmp.map((item, id) =>{
          item.Key = demographicsTableDataTmp.length + (id + 1) + ''
          return item
        }))
        console.log("medConditionElementsTmp",medConditionElementsTmp);
        

         let interventionElementsTmp = interventionElements.map((item,index) =>{
          return Object.assign(item,{Key:(index + 1) + ''})
        })
         let interventionTableDataTmp = interventionElementsTmp.filter(d => {
          return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
        }) 
        setInterventionElements(interventionElementsTmp)
        setInterventionTableData(interventionTableDataTmp.map((item, id) =>{
          item.Key = demographicsTableDataTmp.length + medConditionTableDataTmp.length + (id + 1) + ''        
          return item
        }))
        console.log("interventionElementsTmp",interventionElementsTmp);
        
       
        let labTestElementsTmp = labTestElements.map((item,index) =>{
          return Object.assign(item,{Key:(index + 1) + ''})
        })
        let labTestTableDataTmp = labTestElementsTmp.filter(d => {
          return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
        }) 
        setLabTestElements(labTestElementsTmp)
        setLabTestTableData(labTestTableDataTmp.map((item, id) =>{
          item.Key = demographicsTableDataTmp.length + medConditionTableDataTmp.length + interventionTableDataTmp.length+(id + 1) + ''
          return item
        }))
        console.log("labTestElementsTmp",labTestElementsTmp);
        

        setCollapsible(false)
        setDefaultActiveKey(['2', '3', '4', '5'])

        setRollHeight(false)
        setActiveKey(['1'])
        
      } else if (type == 2) {//Exclusion


        let excluDemographicsElementsTmp = excluDemographicsElements.map((item,index) =>{
          return Object.assign(item,{Key:(index + 1) + ''})
        })
        let excluDemographicsTableDataTmp = excluDemographicsElementsTmp.filter(d => {
          return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
        })
        setExcluDemographicsElements(excluDemographicsElementsTmp )
        setExcluDemographicsTableData(excluDemographicsTableDataTmp.map((item, id) =>{
          item.Key = (id + 1) + ''
          return item
        }))


         
        let excluMedConditionElementsTmp = excluMedConditionElements.map((item,index) =>{
          return Object.assign(item,{Key:(index + 1) + ''})
        })
         let excluMedConditionTableDataTmp = excluMedConditionElementsTmp.filter(d => {
          return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
        }) 

        setExcluMedConditionElements(excluMedConditionElementsTmp )
        setExcluMedConditionTableData(excluMedConditionTableDataTmp.map((item, id) =>{
          item.Key = excluDemographicsTableDataTmp.length + (id + 1) + ''
          return item
        }))


        let excluInterventionElementsTmp = excluInterventionElements.map((item,index) =>{
          return Object.assign(item,{Key:(index + 1) + ''})
        })
         let excluInterventionTableDataTmp = excluInterventionElementsTmp.filter(d => {
          return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
         })
        setExcluInterventionElements(excluInterventionElementsTmp )
        setExcluInterventionTableData(excluInterventionTableDataTmp.map((item, id) =>{
          item.Key = excluDemographicsTableDataTmp.length + excluMedConditionTableDataTmp.length + (id + 1) + ''
          return item
        }))


        let excluLabTestElementsTmp = excluLabTestElements.map((item,index) =>{
          return Object.assign(item,{Key:(index + 1) + ''})
        })
         let excluLabTestTableDataTmp = excluLabTestElementsTmp.filter(d => {
          return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
         })
        setExcluLabTestElements(excluLabTestElementsTmp )
        setExcluLabTestTableData(excluLabTestTableDataTmp.map((item, id) =>{
          item.Key = excluDemographicsTableDataTmp.length + excluMedConditionTableDataTmp.length + excluInterventionTableDataTmp.length + (id + 1) + ''
          return item
        }))


        setExcluCollapsible(false)
        setExcluDefaultActiveKey(['2','3','4','5'])

        setExcluRollHeight(false)
        setExcluActiveKey(['1'])
      }

    
  }


    function callback(key) {
      if(key.indexOf("1") < 0){
        setRollHeight(true)
      } else {
        setRollHeight(false)
      }
      setActiveKey(key)
    }

    function excluCallback(key) {
      if(key.indexOf("1") < 0){
        setExcluRollHeight(true)
      } else {
        setExcluRollHeight(false)
      }
      setExcluActiveKey(key)
    }

    const amendmentRateoption = {
      title : {
        text: 'Protocol Amendment Rate',
        subtext: therapeutic_Amend_Avg,
        x:'left',
        y:'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333'
        },
        subtextStyle: {
            fontSize: 14,
            fontWeight: 'normal',
            color: '#999'
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
            show: true,
            position: 'center',
            formatter: function () {
              if(showChartLabel){
                return amend_avg_rate
              } else {
                return ''
              }
            },
            emphasis: '',
            rich: {
              p: {
                color: '#848484',
                fontSize: 20,
                backgroundColor: "white"
              },
              good: {
                color: '#00A947',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              },
              fair: {
                color: '#0084A9',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              },
              poor: {
                color: '#c33232',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              }
            }
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
          color: impactColors,
          data: protocolRateData
        }
      ]
    };
  
    const screenFailureOption = {
      title : {
        text: 'Screen Failure Rate',
        subtext: therapeutic_Screen_Avg,
        x:'left',
        y:'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333'
        },
        subtextStyle: {
          fontSize: 14,
          fontWeight: 'normal',
          color: '#999'
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
            show: true,
            position: 'center',
            formatter: function () {
              if(showChartLabel){
                return screen_avg_rate
              } else {
                return ''
              }
            },
            emphasis: '',
            rich: {
              p: {
                color: '#848484',
                fontSize: 20,
                backgroundColor: "white"
              },
              good: {
                color: '#00A947',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              },
              fair: {
                color: '#0084A9',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              },
              poor: {
                color: '#c33232',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              }
            }
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
          color: impactColors,
          data: screenRateData
        }
      ]
    };
  
    const excluAmendmentRateoption = {
      title : {
        text: 'Protocol Amendment Rate',
        subtext: exclu_Therapeutic_Amend_Avg,
        x:'left',
        y:'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333'
        },
        subtextStyle: {
          fontSize: 14,
          fontWeight: 'normal',
          color: '#999'
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
              show: true,
              position: 'center',
              formatter: function () {
                if(showChartLabel){
                  return excluAmend_avg_rate
                } else {
                  return ''
                }
              },
              emphasis: '',
              rich: {
                p: {
                  color: '#848484',
                  fontSize: 20,
                  backgroundColor: "white"
                },
                good: {
                  color: '#00A947',
                  fontSize: 12,
                  fontWeight:'bold',
                  backgroundColor: "white"
                },
                fair: {
                  color: '#0084A9',
                  fontSize: 12,
                  fontWeight:'bold',
                  backgroundColor: "white"
                },
                poor: {
                  color: '#c33232',
                  fontSize: 12,
                  fontWeight:'bold',
                  backgroundColor: "white"
                }
              }
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
            color: excluImpactColors,
            data: excluProtocolRateData
        }
      ]
    };
  
    const excluScreenFailureOption = {
      title : {
        text: 'Screen Failure Rate',
        subtext: exclu_Therapeutic_Screen_Avg,
        x:'left',
        y:'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333'
        },
        subtextStyle: {
            fontSize: 14,
            fontWeight: 'normal',
            color: '#999'
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
            show: true,
            position: 'center',
            formatter: function () {
              if(showChartLabel){
                return excluScreen_avg_rate
              } else {
                return ''
              }
            },
            emphasis: '',
            rich: {
              p: {
                color: '#848484',
                fontSize: 20,
                backgroundColor: "white"
              },
              good: {
                color: '#00A947',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              },
              fair: {
                color: '#0084A9',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              },
              poor: {
                color: '#c33232',
                fontSize: 12,
                fontWeight:'bold',
                backgroundColor: "white"
              }
            }
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
          color: excluImpactColors,
          data: excluScreenRateData
        }
      ]
    };

    const raceOption = {
      legend: {
        x:'40%',
        y:'10%',
        orient: 'vertical',
        itemHeight: 7,
        textStyle: {
          fontSize: 9
        },
        formatter: function(name) {
          let data = raceOption.series[0].data;
          let total = 0;
          let tarValue = 0;
          for (let i = 0, l = data.length; i < l; i++) {
              total += data[i].value;
              if (data[i].name == name) {
                  tarValue = data[i].value;
              }
          }
          let p = (tarValue / total * 100).toFixed(2);
          return name + ' - ' + p + '%';
        },
        data: ['Caucasian','Hispanic','Asian','African American']
      },
      series: [{
        type: 'pie',
        center: ['20%', '45%'],
        radius: ['30%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
        },
        color:['#F27A26', '#F5924D', '#FBD6BD', '#FDECE0'],
        data: [
          {value: 75, name: 'Caucasian'},
          {value: 12, name: 'Hispanic'},
          {value: 8, name: 'Asian'},
          {value: 5, name: 'African American'}
        ]
      }]
    };

    const resultOption = {
      title : {
        text: chartTitle,
        x:'40%',
        y:'top',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      grid: {
          left: '3%',
          right: '4%',
          top: '8%',
          bottom: '3%',
          containLabel: true
      },
      xAxis: {
          type: 'value',
          axisLabel: {
              show: false
          },
          splitLine:{
              show:false
          },
          axisLine: {
            show: false
          },
          axisTick: {
              show: false
          },
      },
      yAxis: {
          type: 'category',
          axisLine: {
              show: false
          },
          axisTick: {
              show: false
          },
          data: [
          'HbA1c - ≧ 7.0% and ≦ 9.0%',    
          'Fasting C-peptide - ≧ 0.8 ng/mL', 
          'TSH - Normal or clinically euthyroid', 
          'Meformin - Stable dose', 
          'Type 2 Diabetes', 
          'Stable body weight - Not charged by more than 5%', 
          'Gender - Men or nonpregnant women', 
          'Age - >18']
      },
      series: [{
              name: 'Direct',
              type: 'bar',
              stack: 'total',
              color: freqColor,
              label: {
                  show: true,
                  formatter: function(p) {
                      return p.data.freq+'%'
                  },
                  position: 'insideRight',
                  color: freqFontColor
              },
              data: freqData
          }, {
              name: 'total',
              type: 'bar',
              stack: 'total',
              barWidth:'20px',
              color: '#E84F22',
              label: {
                  show: true,
                  formatter: function(p) {
                      return p.data.total
                  },
                  position: 'insideRight'
              },
              data: totalData
          }
      ]
  };

  const switchTabkey = (key) =>{
    setActiveEnrollmentTabKey(key)
    if(key === '1'){
      setChartTitle('Patients Eligible - 80K(16% of Dataset)')
      let tempData = [];
      for(let i = 0, l = resultdata.length; i < l; i++){
          var num = resultdata[i] + 100;
          tempData.push({'total': resultdata[i]+'K', 'value':num});
      }
      setTotalData(tempData)
      setFreqdata([])
    } else if(key === '2'){
      setChartTitle('Female patients eligible - 20%')
      setFreqColor('#EF7A57')
      setFreqFontColor('#fff')

      let tempData = [];
      for(let i = 0, l = resultdata.length; i < l; i++){
          var num = resultdata[i] * (100 - femaleFreq[i]) / 100;
          tempData.push({'total': resultdata[i]+'K', 'value':num});
      }
      setTotalData(tempData)

      let tempData2 = [];
      for(let i = 0, l = resultdata.length; i < l; i++){
          var num = resultdata[i] * femaleFreq[i] / 100;
          tempData2.push({'freq': femaleFreq[i], 'value' : num+100});
      }
      setFreqdata(tempData2)
    } else {
      setChartTitle('Race & Ethnicity - Afican American - 5%')
      setFreqColor('#FDECE0')
      setFreqFontColor('#333')

      let tempData = [];
      for(let i = 0, l = resultdata.length; i < l; i++){
          var num = resultdata[i] * (100 - raceFreq[i]) / 100;
          tempData.push({'total': resultdata[i]+'K', 'value':num});
      }
      setTotalData(tempData)

      let tempData2 = [];
      for(let i = 0, l = resultdata.length; i < l; i++){
          var num = resultdata[i] * raceFreq[i] / 100;
          tempData2.push({'freq': raceFreq[i], 'value' : num+100});
      }
      setFreqdata(tempData2)
    }
  }
    
    const handleCancel = () => {
      setShowHistorical(false)
      setVisibleSOA(false)
    }

    const showSOAModal = async () => {
      setVisibleSOA(true)
      searchHistoricalTrials()
    }

    const searchHistoricalTrials = async () => {
      setShowHistorical(true)
      if(historicalTrialdata.length == 0){
        setSpinning(true)
        const resp = await getSimilarhistoricalTrialById(similarHistoricalTrials);
        if (resp.statusCode == 200) {
          setSpinning(false)

          const filteredData =  JSON.parse(resp.body).filter((d) => {
            const date = d['start_date'].split('-')[0]
            return (
              date >= simliarTrialStudyStartDate.dateFrom && date<= simliarTrialStudyStartDate.dateTo
            );
          });
          setHistoricalTrialdata(filteredData)
        }
      }
    }

    const handleExport = (fileType) => {
      switch(fileType){
        case 'csv':
          csvExport();
          break;
        case 'pdf':
          pdfMake()
          break;
        default: break;
      }
    }

    const csvExport = async () => {
      let str='';

      //Get Inclusion Criteria Data
      str += 'Inclusion Criteria';
      str += '\n' + 'Category' + ',' + 'S/No.' + ',' + 'Eligibility Criteria' + ',' + 'Values' + ',' 
          + 'Timeframe' + ',' + 'Condition Or Exception';
      var serialNum = 0
      str += getCSVContent('Demographics', demographicsElements, serialNum)
      serialNum += demographicsElements.length
      str += getCSVContent('Medical Condition', medConditionElements, serialNum)
      serialNum += medConditionElements.length
      str += getCSVContent('Intervention', interventionElements, serialNum)
      serialNum += interventionElements.length
      str += getCSVContent('Lab / Test', labTestElements, serialNum)

      //Get Exclusion Criteria Data
      str += '\n\n\n' + 'Exclusion Criteria';
      str += '\n' + 'Category' + ',' + 'S/No.' + ',' + 'Eligibility Criteria' + ',' + 'Values' + ',' 
          + 'Timeframe' + ',' + 'Condition Or Exception';
      serialNum = 0
      str += getCSVContent('Demographics', excluDemographicsElements, serialNum)
      serialNum += excluDemographicsElements.length
      str += getCSVContent('Medical Condition', excluMedConditionElements, serialNum)
      serialNum += excluMedConditionElements.length
      str += getCSVContent('Intervention', excluInterventionElements, serialNum)
      serialNum += excluInterventionElements.length
      str += getCSVContent('Lab / Test', excluLabTestElements, serialNum)
  
      let exportContent = "\uFEFF";
      let blob = new Blob([exportContent + str], {
        type: "text/plain;charset=utf-8"
      });
  
      const date = Date().split(" ");
      const dateStr = date[1] + '_' + date[2] + '_' + date[3] + '_' + date[4];
      FileSaver.saveAs(blob, `Inclusion_Exclusion_Criteria_${dateStr}.csv`);
    };
  
    function getCSVContent(category, elements, serialNum){
      let str='';
      for(const a in elements) {
        serialNum = serialNum + 1
        str += '\n'+ category + ',' + serialNum + ',' + elements[a]['Eligibility Criteria'] + ',' 
          + elements[a].Values + ',' + elements[a].Timeframe + ',' 
          + (elements[a]['Condition Or Exception'] == undefined ? '': elements[a]['Condition Or Exception'])
        if(elements[a].Children != undefined && elements[a].Children.length > 0){
          const subCriteria = elements[a].Children
          var subSerialNum;
          for(const aa in subCriteria){
            subSerialNum = serialNum + subCriteria[aa].Key.charAt((subCriteria[aa].Key.length-1))
            str += '\n' + category + ',' + subSerialNum + ',' + subCriteria[aa]['Eligibility Criteria'] 
            + ',' + subCriteria[aa].Values + ',' + subCriteria[aa].Timeframe
          }
        }
      }
    
      return str;
    }

    const updateInclusionCriteria = (newData, index) => {
      switch(index){
        case 2: 
          setDemographicsElements(newData)
          break;
        case 3:      
          setMedConditionElements(newData)      
          break;
        case 4:
          setInterventionElements(newData)
          break;
        default:
          setLabTestElements(newData)         
      }
    }

    const updateExclusionCriteria = (newData, index) => {
      switch(index){
        case 2: 
         
          setExcluDemographicsElements(newData)
          break;
        case 3:
         
          setExcluMedConditionElements(newData)
          break;
        case 4:
         
          setExcluDemographicsElements(newData)
          break;
        default:
          
          setExcluLabTestElements(newData)
      }
    }

    function keepUpdatedTrialInfo () {
      //Keep criteria before goes to schedule of Events
      let newScenario = trialRecord.scenarios.find( i=> i['scenario_id'] == scenarioId)

        var newInclusion = {
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

        var newExclusion = {
          "Demographics": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluDemographicsElements
          },
          "Medical Condition": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluMedConditionElements
          },
          "Intervention": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluInterventionElements
          },
          "Lab / Test": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluLabTestElements
          }
        }

      if(newScenario["Inclusion Criteria"].Demographics === undefined){
        newScenario["Inclusion Criteria"] = newInclusion
        newScenario["Exclusion Criteria"] = newExclusion
      } else {
        newScenario["Inclusion Criteria"].Demographics.Entities = demographicsElements
        newScenario["Inclusion Criteria"]['Medical Condition'].Entities = medConditionElements
        newScenario["Inclusion Criteria"].Intervention.Entities = interventionElements
        newScenario["Inclusion Criteria"]['Lab / Test'].Entities = labTestElements

        newScenario["Exclusion Criteria"].Demographics.Entities = excluDemographicsElements
        newScenario["Exclusion Criteria"]['Medical Condition'].Entities = excluMedConditionElements
        newScenario["Exclusion Criteria"].Intervention.Entities = excluInterventionElements
        newScenario["Exclusion Criteria"]['Lab / Test'].Entities = excluLabTestElements
      }

      const newScenarioList = trialRecord.scenarios.map((item, id) =>{
        if(item['scenario_id'] == scenarioId){
            return newScenario
        } else {
            return item
        }
      })

      let newTrial = trialRecord
      newTrial.scenarios = newScenarioList

      setTrialRecord(newTrial)
    }
    const saveCriteria = async () => {
      setPageLoading(true)
      let newScenario = trialRecord.scenarios.find( i=> i['scenario_id'] == scenarioId)

        var newInclusion = {
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

        var newExclusion = {
          "Demographics": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluDemographicsElements
          },
          "Medical Condition": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluMedConditionElements
          },
          "Intervention": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluInterventionElements
          },
          "Lab / Test": {
            "protocol_amendment_rate": '',
            "patient_burden": '',
            "Entities": excluLabTestElements
          }
        }
      if(newScenario["Inclusion Criteria"].Demographics === undefined){
        newScenario["Inclusion Criteria"] = newInclusion
        newScenario["Exclusion Criteria"] = newExclusion
      } else {
        newScenario["Inclusion Criteria"].Demographics.Entities = demographicsElements
        newScenario["Inclusion Criteria"]['Medical Condition'].Entities = medConditionElements
        newScenario["Inclusion Criteria"].Intervention.Entities = interventionElements
        newScenario["Inclusion Criteria"]['Lab / Test'].Entities = labTestElements

        newScenario["Exclusion Criteria"].Demographics.Entities = excluDemographicsElements
        newScenario["Exclusion Criteria"]['Medical Condition'].Entities = excluMedConditionElements
        newScenario["Exclusion Criteria"].Intervention.Entities = excluInterventionElements
        newScenario["Exclusion Criteria"]['Lab / Test'].Entities = excluLabTestElements
      }

      const newScenarioList = trialRecord.scenarios.map((item, id) =>{
        if(item['scenario_id'] == scenarioId){
          //If go back from SOA and SOA got edited, re-calculate SOA results for save changes
          if(item['Schedule of Events'].Finished != undefined && !item['Schedule of Events'].Finished){
            return reCalculateSOA(newScenario, item['Schedule of Events'])
          } else {
            return newScenario
          }
        } else {
            return item
        }
      })

      let newTrial = trialRecord
      newTrial.scenarios = newScenarioList

      setTrialRecord(newTrial)

      setImpactColors(activeChartColors)
      setExcluImpactColors(activeChartColors)
      //Update record
      const resp = await updateStudy(newTrial);
      setPageLoading(false)
      if (resp.statusCode == 200) {
        var currentScenario = resp.body.scenarios.find( i=> i['scenario_id'] == scenarioId)

        //Get inclusion chart info
        var inclu = currentScenario["Inclusion Criteria"]
        
        setProtocolRateData([
          {value: formatNumber(inclu['Lab / Test'].protocol_amendment_rate), name: 'Labs / Tests'},
          {value: formatNumber(inclu.Intervention.protocol_amendment_rate), name: 'Intervention'},
          {value: formatNumber(inclu.Demographics.protocol_amendment_rate), name: 'Demographics'},
          {value: formatNumber(inclu['Medical Condition'].protocol_amendment_rate), name: 'Medical Condition'}
        ])
        setScreenRateData([
          {value: formatNumber(inclu['Lab / Test'].screen_failure_rate), name: 'Labs / Tests'},
          {value: formatNumber(inclu.Intervention.screen_failure_rate), name: 'Intervention'},
          {value: formatNumber(inclu.Demographics.screen_failure_rate), name: 'Demographics'},
          {value: formatNumber(inclu['Medical Condition'].screen_failure_rate), name: 'Medical Condition'}
        ])
  
        var tempScoreA = ''
        var tempScoreB = ''

          var score = formatNumber(currentScenario.protocol_amendment_rate)
          if(score <= 33){
            tempScoreA = '{p|' + currentScenario.protocol_amendment_rate + '}\n{good|GOOD}'
          } else if(score > 33  && score <= 67){
            tempScoreA = '{p|' + currentScenario.protocol_amendment_rate + '}\n{fair|FAIR}'
          } else if(score > 67){
            tempScoreA = '{p|' + currentScenario.protocol_amendment_rate + '}\n{poor|POOR}'
          }

          var scoreB = formatNumber(currentScenario.screen_failure_rate)
          if(scoreB <= 33){
            tempScoreB = '{p|' + currentScenario.screen_failure_rate + '}\n{good|GOOD}'
          } else if(scoreB > 33  && scoreB <= 67){
            tempScoreB = '{p|' + currentScenario.screen_failure_rate + '}\n{fair|FAIR}'
          } else if(scoreB > 67){
            tempScoreB = '{p|' + currentScenario.screen_failure_rate + '}\n{poor|POOR}'
          }

          setAmend_avg_rate(tempScoreA)
          setScreen_avg_rate(tempScoreB)

        //Get exclusion chart info
        var exclu = currentScenario["Exclusion Criteria"]
        
        setExcluProtocolRateData([
          {value: formatNumber(exclu['Lab / Test'].protocol_amendment_rate), name: 'Labs / Tests'},
          {value: formatNumber(exclu.Intervention.protocol_amendment_rate), name: 'Intervention'},
          {value: formatNumber(exclu.Demographics.protocol_amendment_rate), name: 'Demographics'},
          {value: formatNumber(exclu['Medical Condition'].protocol_amendment_rate), name: 'Medical Condition'}
        ])
        setExcluScreenRateData([
          {value: formatNumber(exclu['Lab / Test'].screen_failure_rate), name: 'Labs / Tests'},
          {value: formatNumber(exclu.Intervention.screen_failure_rate), name: 'Intervention'},
          {value: formatNumber(exclu.Demographics.screen_failure_rate), name: 'Demographics'},
          {value: formatNumber(exclu['Medical Condition'].screen_failure_rate), name: 'Medical Condition'}
        ])
          setExcluAmend_avg_rate(tempScoreA)
          setExcluScreen_avg_rate(tempScoreB)
        if(currentScenario['Therapeutic Area Average']){
          setTherapeutic_Amend_Avg('Therapeutic Area Average - ' + currentScenario['Therapeutic Area Average'].protocol_amendment_rate)
          setTherapeutic_Screen_Avg('Therapeutic Area Average - ' + currentScenario['Therapeutic Area Average'].screen_failure_rate)
          setExcluTherapeutic_Amend_Avg('Therapeutic Area Average - ' + currentScenario['Therapeutic Area Average'].protocol_amendment_rate)
          setExcluTherapeutic_Screen_Avg('Therapeutic Area Average - ' + currentScenario['Therapeutic Area Average'].screen_failure_rate)
        }
  
        setShowChartLabel(true)
        message.success("Save successfully");
      }
    }

    function formatNumber (str){
      if(str == undefined || str == ''){
        return 0
      } else {
        return Number(str.substr(0, str.lastIndexOf('%')))
      }
    }

    const reCalculateSOA = (specificScenario, scheduleOfEvents) =>{
      let burdenMatrixList = []
      let tempBurdenXAxis = []
      for(var i =0; i< scheduleOfEvents.Visits; i ++){
        burdenMatrixList.push([0,0,0,0,0,0,0,0,0,0])
        tempBurdenXAxis.push((i+1)+'')
      }

      let labeTotalCost = 0
      for(const a in scheduleOfEvents[CATEGORY_LABS].entities) {
        labeTotalCost += Number(scheduleOfEvents[CATEGORY_LABS].entities[a]['Dummy Cost']) * scheduleOfEvents[CATEGORY_LABS].entities[a].totalVisit
        if(scheduleOfEvents[CATEGORY_LABS].entities[a].condition.length > 0){
          for(let b = 0; b < scheduleOfEvents[CATEGORY_LABS].entities[a].condition.length; b ++){
            if(scheduleOfEvents[CATEGORY_LABS].entities[a].condition[b].checked){
              let tempBurdenMatrix = []
              burdenMatrixList[b].map((item, idx) =>{
                tempBurdenMatrix.push(item + scheduleOfEvents[CATEGORY_LABS].entities[a].soaWeights[idx])
              })
              burdenMatrixList.splice(b, 1, tempBurdenMatrix)
            }
          }
        }
      }

      let examinationTotalCost = 0
      for(const a in scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities) {
        examinationTotalCost += Number(scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a]['Dummy Cost']) * scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].totalVisit
        if(scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].condition.length > 0){
          for(let b = 0; b < scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].condition.length; b ++){
            if(scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].condition[b].checked){
              let tempBurdenMatrix = []
              burdenMatrixList[b].map((item, idx) =>{
                tempBurdenMatrix.push(item + scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].soaWeights[idx])
              })
              burdenMatrixList.splice(b, 1, tempBurdenMatrix)
            }
          }
        }
      }

      let proceduresTotalCost = 0
      for(const a in scheduleOfEvents[CATEGORY_PROCEDURES].entities) {
        proceduresTotalCost += Number(scheduleOfEvents[CATEGORY_PROCEDURES].entities[a]['Dummy Cost']) * scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].totalVisit
        if(scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].condition.length > 0){
          for(let b = 0; b < scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].condition.length; b ++){
            if(scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].condition[b].checked){
              let tempBurdenMatrix = []
              burdenMatrixList[b].map((item, idx) =>{
                tempBurdenMatrix.push(item + scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].soaWeights[idx])
              })
              burdenMatrixList.splice(b, 1, tempBurdenMatrix)
            }
          }
        }
      }

      let questionairesTotalCost = 0
      for(const a in scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities) {
        questionairesTotalCost += Number(scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a]['Dummy Cost']) * scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].totalVisit
        if(scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].condition.length > 0){
          for(let b = 0; b < scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].condition.length; b ++){
            if(scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].condition[b].checked){
              let tempBurdenMatrix = []
              burdenMatrixList[b].map((item, idx) =>{
                tempBurdenMatrix.push(item + scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].soaWeights[idx])
              })
              burdenMatrixList.splice(b, 1, tempBurdenMatrix)
            }
          }
        }
      }

      let studyTotalCost = 0
      for(const a in scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities) {
        studyTotalCost += Number(scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a]['Dummy Cost']) * scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].totalVisit
        if(scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].condition.length > 0){
          for(let b = 0; b < scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].condition.length; b ++){
            if(scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].condition[b].checked){
              let tempBurdenMatrix = []
              burdenMatrixList[b].map((item, idx) =>{
                tempBurdenMatrix.push(item + scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].soaWeights[idx])
              })
              burdenMatrixList.splice(b, 1, tempBurdenMatrix)
            }
          }
        }
      }

      let tempBurdenData = []
      let patient_burden = 0
      for(const m in burdenMatrixList){
        const visitMatrix = burdenMatrixList[m].map((max) => {
          return max > 0 ? 1 : 0
        })
        const excessMatrix = burdenMatrixList[m].map((max) => {
          return max - 1 >= 0 ? max - 1 : 0
        })

        let currentVisitScore = 0
        for(const c in visitMatrix){
          currentVisitScore += visitMatrix[c] * visitDimensionalScore[c].Value + excessMatrix[c]
        }
        tempBurdenData.push(currentVisitScore)
        patient_burden += currentVisitScore
      }

      let patient_burden_rate = 'GOOD'
      if (patient_burden > 0 && patient_burden <= 400) {
        patient_burden_rate = 'GOOD'
      } else if (patient_burden > 400 && patient_burden <= 600) {
        patient_burden_rate = 'FAIR'
      } else if (patient_burden > 600){
        patient_burden_rate = 'POOR'
      }

      let tempCostData = [
        {value: labeTotalCost, name: CATEGORY_LABS},
        {value: examinationTotalCost, name: CATEGORY_PHYSICAL_EXAMINATION},
        {value: proceduresTotalCost, name: CATEGORY_PROCEDURES},
        {value: questionairesTotalCost, name: CATEGORY_QUESTIONNAIRES},
        {value: studyTotalCost, name: CATEGORY_STUDY_PROCEDURES}
      ]

      let totalCost = labeTotalCost + examinationTotalCost + proceduresTotalCost + questionairesTotalCost + studyTotalCost

      let costBreakdown = ''
      if(totalCost < 12826){
        costBreakdown = 'GOOD'
      } else if(totalCost < 15650){
        costBreakdown = 'FAIR'
      } else {
        costBreakdown = 'POOR'
      }

      specificScenario['Schedule of Events'] = Object.assign(scheduleOfEvents,{
        'TotalCost': '' + formatCostAvg(totalCost, 1000),
        'CostRate': costBreakdown,
        'CostData': tempCostData,
        'BurdenData': tempBurdenData,
        'BurdenXAxis': tempBurdenXAxis,
        'Finished': true,
        'patient_burden': patient_burden,
        'patient_burden_rate': patient_burden_rate
      })
      return specificScenario
    }
    function roundFun(value, n) {
        return Math.round(value*Math.pow(10,n))/Math.pow(10,n);
    }
  
    function formatCostAvg(totalCost, divisor){
      if(totalCost === 0){
        return 0
      } else {
        let avg = Math.ceil(totalCost/divisor*1000)
        return roundFun(avg/1000, 2)
      }
    }

    const pdfMake = async () =>{
      const pdf = new jsPDF('p', 'pt');
      const tableColumn = ['Category', 'S/No.', 'Eligibility Criteria', 'Values', 'Timeframe','Condition Or Exception'];

      var serialNum = 0
      var tableRows = formatColumns('Demographics', demographicsElements, serialNum)
      serialNum += demographicsElements.length
      tableRows = tableRows.concat(formatColumns('Medical Condition', medConditionElements, serialNum))
      serialNum += medConditionElements.length
      tableRows = tableRows.concat(formatColumns('Intervention', interventionElements, serialNum))
      serialNum += interventionElements.length
      tableRows = tableRows.concat(formatColumns('Lab / Test', labTestElements, serialNum))

      serialNum = 0
      var serialNum = 0
      var excluTableRows = formatColumns('Demographics', excluDemographicsElements, serialNum)
      serialNum += excluDemographicsElements.length
      excluTableRows = excluTableRows.concat(formatColumns('Medical Condition', excluMedConditionElements, serialNum))
      serialNum += excluMedConditionElements.length
      excluTableRows = excluTableRows.concat(formatColumns('Intervention', excluInterventionElements, serialNum))
      serialNum += excluInterventionElements.length
      excluTableRows = excluTableRows.concat(formatColumns('Lab / Test', excluLabTestElements, serialNum))

      pdf.text("Inclusion Criteria", 14, 20);
      pdf['autoTable']({
        columns: tableColumn,
        body: tableRows
      });

      pdf.addPage()
      pdf.text("Exclusion Criteria", 14, 20);
      pdf['autoTable']({
        columns: tableColumn,
        body: excluTableRows
      });

      const date = Date().split(" ");
      const dateStr = date[1] + '_' + date[2] + '_' + date[3] + '_' + date[4];
      pdf.save(`Inclusion_Criteria_${dateStr}.pdf`);
    };

    function formatColumns(catogory, list, serialNo){
      var tempColumn = []
      for(const a in list) {
        serialNo ++
        const item = [catogory, serialNo, list[a]['Eligibility Criteria'], list[a]['Values'], list[a]['Timeframe'], 
                      list[a]['Condition Or Exception'] == undefined ? '': list[a]['Condition Or Exception']]
        tempColumn.push(item)
        if(list[a]['Children'] != undefined && list[a]['Children'].length > 0){
          const subCriteria = list[a]['Children']
          var subSerialNum;
          for(const aa in subCriteria){
            subSerialNum = serialNo + subCriteria[aa].Key.charAt((subCriteria[aa].Key.length-1))
            const subItem = [catogory, subSerialNum, subCriteria[aa]['Eligibility Criteria'], 
                              subCriteria[aa]['Values'], subCriteria[aa]['Timeframe'], '']
            tempColumn.push(subItem)
          }
        }
      }
      return tempColumn
    }
  
  useEffect(() => {
    updateTableData()
   
  }, [demographicsElements, medConditionElements, interventionElements, labTestElements])

  useEffect(() => {
    updateExcluTableData()
  }, [excluDemographicsElements, excluMedConditionElements, excluInterventionElements, excluLabTestElements])


  
  
  const updateTableData = () => {

    let demographicsTmp = demographicsElements.map((e,idx) => {
      e.Key = (idx + 1) + ''
      return e     
    })
    setDemographicsTableData(demographicsTmp)

    let medConditionTmp = medConditionElements.map((e,idx) => {
      e.Key = demographicsTmp.length + (idx + 1) + ''
        return e
    })    
    setMedConditionTableData(medConditionTmp)
  
    let interventionTmp =  interventionElements.map((e,idx) => {
      e.Key = demographicsTmp.length + medConditionTmp.length + (idx + 1) + ''
        return e
    })    
    setInterventionTableData(interventionTmp)

    let labTestTmp =  labTestElements.map((e,idx) => {
      e.Key = demographicsTmp.length + medConditionTmp.length + interventionTmp.length + (idx + 1) + ''
        return e
    })
    setLabTestTableData(labTestTmp)   
  }

  const updateExcluTableData = () => {

    let demographicsTmp = excluDemographicsElements.map((e,idx) => {
      e.Key = (idx + 1) + ''
      return e     
    })
    setExcluDemographicsTableData(demographicsTmp)

    let medConditionTmp = excluMedConditionElements.map((e,idx) => {
      e.Key = demographicsTmp.length + (idx + 1) + ''
        return e
    })    
    setExcluMedConditionTableData(medConditionTmp)
  
    let interventionTmp =  excluInterventionElements.map((e,idx) => {
      e.Key = demographicsTmp.length + medConditionTmp.length + (idx + 1) + ''
        return e
    })    
    setExcluInterventionTableData(interventionTmp)

    let labTestTmp =  excluLabTestElements.map((e,idx) => {
      e.Key = demographicsTmp.length + medConditionTmp.length + interventionTmp.length + (idx + 1) + ''
        return e
    })
    setExcluLabTestTableData(labTestTmp)   
  }

  const changeActiveTabKey = (activeKey) => {
    setActiveTabKey(activeKey)
    if(activeKey === '3'){
      keepUpdatedTrialInfo()
    }
  }

  const onInclusionChartClick = (e) =>{
    if(e.name === 'Medical Condition'){
      setDefaultActiveKey(['3'])
    } else if(e.name === 'Labs / Tests'){
      setDefaultActiveKey(['5'])
    } else if(e.name === 'Intervention'){
      setDefaultActiveKey(['4'])
    } else if(e.name === 'Demographics'){
      setDefaultActiveKey(['2'])
    }
  }

  const onExclusionChartClick = (e) =>{
    if(e.name === 'Medical Condition'){
      setExcluDefaultActiveKey(['3'])
    } else if(e.name === 'Labs / Tests'){
      setExcluDefaultActiveKey(['5'])
    } else if(e.name === 'Intervention'){
      setExcluDefaultActiveKey(['4'])
    } else if(e.name === 'Demographics'){
      setExcluDefaultActiveKey(['2'])
    }
  }

  const handleGoBack = (scheduleOfEvents) =>{
    let newScenario = trialRecord.scenarios.find( i=> i['scenario_id'] == scenarioId)
    newScenario['Schedule of Events'] = scheduleOfEvents
    const newScenarioList = trialRecord.scenarios.map((item, id) =>{
      if(item['scenario_id'] == scenarioId){
          return newScenario
      } else {
          return item
      }
    })
    let newTrial = trialRecord
    newTrial.scenarios = newScenarioList
    setTrialRecord(newTrial)
    setProcessStep(0)
    setSubmitType(0)
  }

  const downloadSOA = async () => {
    let tempResource = []
    if(soaResource.length == 0){
      setSpinning(true)
      const resp = await getSOAResource(similarHistoricalTrials);
      if (resp.statusCode == 200) {
        setSpinning(false)
        setSOAResource(JSON.parse(resp.body).soaItemList)
        tempResource = JSON.parse(resp.body).soaItemList
      }
    } else {
      tempResource = soaResource
    }

    //export
    let str = 'SOA';
    str += '\n' + 'NCT ID' + ',' + 'Category' + ',' + 'Raw Activity' + ',' + 'Standardized'
    for(const id in tempResource){
      str += '\n' + tempResource[id].nctID + ',"' + tempResource[id].category +  '","' + tempResource[id].raw + '","' 
        + tempResource[id].standardized + '"'
    }

    let exportContent = "\uFEFF";
    let blob = new Blob([exportContent + str], {
      type: "text/plain;charset=utf-8"
    });

    const date = Date().split(" ");
    const dateStr = date[1] + '_' + date[2] + '_' + date[3] + '_' + date[4];
    FileSaver.saveAs(blob, `SOA_Resource_${dateStr}.csv`);
  }

  const downloadIE = async () => {
    if(ieResource == ''){
      setSpinning(true)
      const resp = await getIEResource(similarHistoricalTrials);
      if (resp.statusCode == 200) {
        var num = resp.body.lastIndexOf('/')+1
        let fileName = resp.body.substr(num)

        downloadFile(fileName)
      }
    } else {
      downloadFile(ieResource)
    }

    function downloadFile(fileName) {
      window.open('https://iso-data-zone.s3.us-east-2.amazonaws.com/iso-service-dev/summary/'+fileName, '_blank')
      setSpinning(false)
      setIEResource(fileName)
    }
  }

  const downloadAverage = async () => {
    var num = avgFileKey.lastIndexOf('/')+1
    let fileName = avgFileKey.substr(num)
    window.open('https://iso-data-zone.s3.us-east-2.amazonaws.com/iso-service-dev/summary/'+fileName, '_blank')
    // let tempInclusionResourceAvg = []
    // let tempExclusionResourceAvg = []
    // if(!avgResource){
    //   setSpinning(true)
    //   const resp = await getAverage(similarHistoricalTrials);
    //   if (resp.statusCode == 200) {
    //     setSpinning(false)
    //     setAvgResource(true)
    //     setInclusionResourceAvg(JSON.parse(resp.body).inResult)
    //     setExclusionResourceAvg(JSON.parse(resp.body).exResult)
    //     tempInclusionResourceAvg = JSON.parse(resp.body).inResult
    //     tempExclusionResourceAvg = JSON.parse(resp.body).exResult
    //   }
    // } else {
    //   tempInclusionResourceAvg = inclusionResourceAvg
    //   tempExclusionResourceAvg = exclusionResourceAvg
    // }

    // //export
    // let str = 'I/E' + ','  + 'NCT ID' + ','+ 'Category' + ',' + 'Raw Entity' + ',' + 'Standardized Entity' + ',' + 'Snomed' + ',' + 'Average Value' + ',' + 'Average Lower Limit' + ',' + 'Average Upper Limit' + ',' + 'Units'
    // for(const standardized in tempInclusionResourceAvg){
    //   for(const criteria in tempInclusionResourceAvg[standardized]){
    //     str += '\n' + 'INCLUSION' + ',"' 
    //                 + tempInclusionResourceAvg[standardized][criteria].nct + '","'
    //                 + tempInclusionResourceAvg[standardized][criteria].category + '","' 
    //                 + tempInclusionResourceAvg[standardized][criteria].raw + '","' 
    //                 + tempInclusionResourceAvg[standardized][criteria].standardized + '","' 
    //                 + tempInclusionResourceAvg[standardized][criteria].snomed + '","' 
    //                 + (tempInclusionResourceAvg[standardized][criteria].avg_value === 0?"":tempInclusionResourceAvg[standardized][criteria].avg_value) + '","'
    //                 + (tempInclusionResourceAvg[standardized][criteria].avg_lower === 0? "":tempInclusionResourceAvg[standardized][criteria].avg_lower) + '","' 
    //                 + (tempInclusionResourceAvg[standardized][criteria].avg_upper ===0?"":tempInclusionResourceAvg[standardized][criteria].avg_upper)  + '","'
    //                 + tempInclusionResourceAvg[standardized][criteria].units + '"'
    //   }
    // }
    // for(const standardized in tempExclusionResourceAvg){
    //   for(const criteria in tempExclusionResourceAvg[standardized]){
    //     str += '\n' + 'EXCLUSION' + ',"' 
    //     + tempExclusionResourceAvg[standardized][criteria].nct + '","' 
    //     + tempExclusionResourceAvg[standardized][criteria].category + '","' 
    //     + tempExclusionResourceAvg[standardized][criteria].raw + '","'
    //     + tempExclusionResourceAvg[standardized][criteria].standardized + '","' 
    //     + tempExclusionResourceAvg[standardized][criteria].snomed + '","' 
    //     + (tempExclusionResourceAvg[standardized][criteria].avg_value === 0? "":tempExclusionResourceAvg[standardized][criteria].avg_value) + '","' 
    //     + (tempExclusionResourceAvg[standardized][criteria].avg_lower === 0?"":tempExclusionResourceAvg[standardized][criteria].avg_lower) + '","'
    //     + (tempExclusionResourceAvg[standardized][criteria].avg_upper===0?"":tempExclusionResourceAvg[standardized][criteria].avg_upper) + '","'
    //     + tempExclusionResourceAvg[standardized][criteria].units +  '"'
    //   }
    // }

    // let exportContent = "\uFEFF";
    // let blob = new Blob([exportContent + str], {
    //   type: "text/plain;charset=utf-8"
    // });

    // const date = Date().split(" ");
    // const dateStr = date[1] + '_' + date[2] + '_' + date[3] + '_' + date[4];
    // FileSaver.saveAs(blob, `IE_Average_${dateStr}.csv`);
  }

    return (
    <div className="scenario-container">
      <Spin spinning={pageLoading} indicator={<LoadingOutlined style={{ color: "#ca4a04",fontSize: 24 }}/>}>
      <div>
        <Row className="process-container">
            <Col span={2} className="center">
                <div className="action-title" onClick={()=>props.history.push({pathname: '/trials', state: {trial_id: props.location.state.trial_id}})}>
                    <LeftOutlined /> &nbsp;Trial Page
                </div>
            </Col>
            <Col span={4} className="scenario-header center">
              <Row>
              <Col span={24}>
                <Row className="item-translate">
                    <Col flex="auto">{trialTitle}&nbsp;:&nbsp;{scenarioType}</Col>
                </Row>
                <Row className="item-translate">
                    <Col flex="auto" className="name">{scenario['scenario_name']}</Col>
                </Row>
                </Col>
                </Row>
            </Col>
            <Col span={8} className="center" style={{paddingLeft: '10px'}}>
                <Steps progressDot current={processStep} size="small" >
                    <Step title="Add Inclusion / Exclusion Criteria"/>
                    <Step title="Add Schedule of Events"/>
                </Steps>
            </Col>
            <Col span={10} className={`center ${ collapsible ? "none-click" : "" }`} >
                {activeTabKey === '1'?(
                    <>
                        <Button type="primary" className="step-btn" onClick={() => setActiveTabKey('2')}>
                            NEXT:EXCLUSION CRITERIA
                        </Button>
                    </>
                ):(activeTabKey === '2'?(
                    <>
                        <Button type="primary" className="step-btn" onClick={() => changeActiveTabKey('3')}>
                            NEXT:ENROLLMENT FEASIBILITY
                        </Button>
                        <Button className="view-btn step-btn" onClick={() => setActiveTabKey('1')}>
                            PREV:INCLUSION CRITERIA
                        </Button>
                    </>
                ):(processStep === 0?(

                    <>
                        <Button type="primary" className="step-btn" onClick={() => setProcessStep(1)}>
                            NEXT:ADD SCHEDULE OF EVENTS
                        </Button>
                        <Button className="view-btn step-btn" onClick={() => setActiveTabKey('2')}>
                            PREV:EXCLUSION CRITERIA
                        </Button>
                    </>
                ):(
                    <>
                        <Button type="primary" className="step-btn"  onClick={()=> setSubmitType(2)}>
                            SAVE AND FINISH LATER
                        </Button>
                        <Button className="view-btn step-btn" onClick={() => setSubmitType(1)}>
                            PREV:ENROLLMENT FEASIBILITY
                        </Button>
                    </>
                )))}
            </Col>
            
        </Row>
      </div>
      {processStep === 0 ? (
      <div className="ie-container">
        <div className="export-container">
          <Row>
            <Col span={17}>
              <div style={{ bottom: '0',height: '50px' }}></div>
            </Col>
            <Col span={7} style={{paddingRight: '20px'}}>
              <Dropdown.Button style={{zIndex: 1}}
                overlay={
                  <Menu>
                    <Menu.Item key="pdf" onClick={() => handleExport('pdf')}>PDF</Menu.Item>
                    <Menu.Item key="csv" onClick={() => handleExport('csv')}>CSV</Menu.Item>
                  </Menu>
                }
                icon={<DownOutlined />}>
                <DownloadOutlined />
                EXPORT AS
              </Dropdown.Button>
            </Col>
          </Row>
        </div>
        <div className="tab-container">
          <div className={`side-toolbar ${criteriaLib > 0 || activeTabKey != "1" ? 'hidden' : ''}`} onClick={()=> setCriteriaLib(6)}>
            <div className="panel-label">Inclusion Criteria Library</div>
            <div className="icon">&nbsp;<ArrowRightOutlined />&nbsp;</div>
          </div>
          <div className={`side-toolbar ${excluCriteriaLib > 0 || activeTabKey != "2" ? 'hidden' : ''}`} onClick={()=> setExcluCriteriaLib(6)}>
            <div className="panel-label">Exclusion Criteria Library</div>
            <div className="icon">&nbsp;<ArrowRightOutlined />&nbsp;</div>
          </div>
          <Tabs onChange={changeActiveTabKey} activeKey={activeTabKey} centered>
            <TabPane tab="Inclusion Criteria" key="1">
              <Row>
                <Col span={criteriaLib} style={{backgroundColor: '#F8F8F8'}}>
                  <Row style={{backgroundColor: '#F8F8F8'}}>
                    <Col span={24}>
                      <div className="item-header">
                        <span>Inclusion Criteria Library</span>
                        <Tooltip title={'Collapse Inclusion Criteria Library'}>
                          <CloseOutlined className="right-icon" onClick={() => setCriteriaLib(0)}></CloseOutlined>
                          </Tooltip>
                        <Tooltip title={'View Historical Trial List'}>
                          <HistoryOutlined className="right-icon" onClick={searchHistoricalTrials}></HistoryOutlined>
                        </Tooltip>
                      </div>
                    </Col>
                  </Row>
                  <Row style={{borderBottom:'10px solid #F8F8F8'}}>
                    <Col flex="none">
                      <div style={{ padding: '0 10px' }}></div>
                    </Col>
                    <Col className="left-section">
                      <Row className="head-row" style={{alignItems: 'center', marginBottom: '10px'}}>
                        <Col span={16}>
                          <div className="item-option">
                            <span>Select criteria to add to Trial</span>
                          </div>
                        </Col>
                        <Col span={8} style={{textAlign:'right'}}>
                          <Row>
                          <Col span={24}><span className="frequency">CRITERIA FREQUENCY</span></Col>
                          </Row>
                          <Row style={{width:'100%'}}>
                          <Col span={24}>
                            <div id="freqModal" ref={null} onClick={() => setVisible(true)}>
                              <span className="label">
                                {minValue}%-{maxValue}%
                              </span>
                              <EditFilled className={`${visible ? 'active' : ''}`}/>
                            </div>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                      
                      {visible ? (
                      <div className="freqSection">
                        <div className="title">
                          {/* <span>Set Frequency</span> */}
                          <CloseOutlined
                            className="right-icon"
                            onClick={() => setVisible(false)}
                          ></CloseOutlined>
                        </div>
                        <br/>
                        <div className="content">
                          <span>Criteria Frequency</span>
                          <span style={{ float: "right", fontWeight: 'bold' }}>
                            {minValue}% - {maxValue}%
                          </span>
                        </div>
                        <Slider
                          range={{ draggableTrack: true }}
                          defaultValue={[minValue, maxValue]}
                          tipFormatter={formatter}
                          onAfterChange={getFrequency}
                        />
                      </div>
                      ) : (
                      <></>
                      )}
                      <Row>
                        <Col span={24}>
                          <div className="content-outer">
                            <div className="content-over">
                              <div className="library box">
                                <span>Demographics</span>
                                <br />
                                {demographics.map((demographic, idx) => {                              
                                  return (
                                    <CriteriaOption
                                      selectedEle = {demographicsElements}
                                      minValue={minValue}
                                      maxValue={maxValue}
                                      key={`demographic_${idx}`}
                                      demographic={demographic}
                                      index={0}
                                      idx={idx}
                                      handleOptionSelect={handleOptionSelect}
                                    ></CriteriaOption>
                                  );
                                })}
                              </div>

                              <div className="library box">
                                <span>Medical Condition</span>
                                <br />
                                {medCondition.map((medCon, idx) => {
                                  return (
                                    <CriteriaOption
                                      selectedEle = {medConditionElements}
                                      minValue={minValue}
                                      maxValue={maxValue}
                                      key={`medCon_${idx}`}
                                      demographic={medCon}
                                      index={1}
                                      idx={idx}
                                      handleOptionSelect={handleOptionSelect}
                                    ></CriteriaOption>
                                  );
                                })}
                              </div>

                              <div className="library box">
                                <span>Intervention</span>
                                <br />
                                {intervention.map((intervent, idx) => {
                                   
                                  return (
                                    <CriteriaOption
                                      selectedEle = {interventionElements}
                                      minValue={minValue}
                                      maxValue={maxValue}
                                      key={`intervent_${idx}`}
                                      demographic={intervent}
                                      index={2}
                                      idx={idx}
                                      handleOptionSelect={handleOptionSelect}
                                    ></CriteriaOption>
                                  );
                                })}
                              </div>

                              <div className="library box lastOne">
                                <span>Lab / Test</span>
                                <br />
                                {labTest.map((lib, idx) => {
                                 
                                  return (
                                    <CriteriaOption
                                      selectedEle = {labTestElements}
                                      minValue={minValue}
                                      maxValue={maxValue}
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
                        </Col>
                      </Row>
                    </Col>
                    <Col flex="none">
                      <div style={{ padding: '0 10px' }}></div>
                    </Col>
                  </Row>
                  <Row style={{backgroundColor: '#fff'}}>
                    <Col span={24}>
                      <div className="updateTrial">
                        <Button className="update-btn" onClick={() => updateTrial(1)}>
                          UPDATE MY TRIAL
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Col>
                <Col span={24 - criteriaLib} className={`${ collapsible ? "none-click" : "" } main-content-right`}>
                  <Row style={{ paddingTop: '10px' }}>
                    <Col flex="none">
                      <div style={{ padding: '0 10px' }}></div>
                    </Col>
                    <Col flex="auto">
                      <Row>
                        <Col span={24}><span className="tab-title">Add Inclusion Criteria</span></Col>
                      </Row>
                      <Row>
                        <Col span={24}>
                        <span className="tip1-desc">
                          Use the historical trial library on the left to build the
                          I/E criteria for your scenario.
                        </span>
                        </Col>
                      </Row>
                      <Row>
                        <Col span={24}>
                        <div className="option-item">
                          <div className="collapse-section-wrapper">
                            <Collapse activeKey={activeKey} onChange={callback} expandIconPosition="right" >
                              <Panel header={panelHeader()} key="1" forceRender={false} >
                                <div className="chart-container">
                                  <div className="label">
                                    <span>Click on each metric to filter</span>
                                  </div>
                                  <ReactECharts
                                    option={amendmentRateoption}
                                    style={{ height: 120}}
                                    onEvents={{'click': onInclusionChartClick}}/>
                                </div>
                                <div className="chart-container  box">
                                  <div className="label">
                                    <span>Click on each metric to filter</span>
                                  </div>
                                  <ReactECharts
                                    option={screenFailureOption}
                                    style={{ height: 120}}
                                    onEvents={{'click': onInclusionChartClick}}/>
                                </div>
                              </Panel>
                            </Collapse>
                          </div>
                        </div>
                        </Col>
                      </Row>
                      <Row className="impact-summary-wrapper">
                        <Col span={24}>
                          <div className="impact-summary">
                            <span>Inclusion Criteria</span>
                            {activeTabKey === '3'? (
                                <></>
                              ) : (
                                <Button type="primary" onClick={saveCriteria} style={{zIndex: 1}}>
                                  Save
                                </Button>
                              )}
                          </div>
                          </Col>
                      </Row>
                      <Row>
                        <Col span={24} >
                          <div className="collapse-container">
                          <div className="content-outer">
                            <div id="inclusion-criteria" 
                              className={`collapse-inner ${rollHeight == true ? "taller" : ""} ${collapsible == true ? "collapsed" : ""}`}>
                              <div className="criteria-list">
                                <div className="list-columns">
                                  <Row>
                                    <Col span={3}><div className="col-item">S/No.</div></Col>
                                    <Col span={7}><div className="col-item">Eligibility Criteria</div></Col>
                                    <Col span={7}><div className="col-item">Values</div></Col>
                                    <Col span={7}><div className="col-item">Timeframe</div></Col>
                                  </Row>
                                </div>
                              </div>
                              <div className="sectionPanel">
                                  <EditTable updateCriteria={updateInclusionCriteria} tableIndex={2}                                
                                    data={demographicsTableData}
                                    defaultActiveKey={defaultActiveKey}
                                    collapsible={collapsible} panelHeader={"Demographics"} updateTrial={() => updateTrial(1)}                                  
                                  />
                                  <EditTable updateCriteria={updateInclusionCriteria} tableIndex={3}
                                    data={medConditionTableData}
                                    defaultActiveKey={defaultActiveKey}
                                    collapsible={collapsible} panelHeader={"Medical Condition"} updateTrial={() => updateTrial(1)}                               
                                  />
                              <EditTable updateCriteria={updateInclusionCriteria} tableIndex={4} 
                                    data={interventionTableData}                                  
                                    defaultActiveKey={defaultActiveKey}
                                    collapsible={collapsible} panelHeader={"Intervention"} updateTrial={() => updateTrial(1)}                                   
                                  />
                              <EditTable updateCriteria={updateInclusionCriteria} tableIndex={5} 
                                    data={labTestTableData}
                                    defaultActiveKey={defaultActiveKey}
                                    collapsible={collapsible} panelHeader={"Lab / Test"} updateTrial={() => updateTrial(1)}/>
                              </div>
                            </div>
                          </div>
                          </div>
                        </Col>
                      </Row>
                    </Col>
                    <Col flex="none">
                      <div style={{ padding: '0 10px' }}></div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </TabPane>
            <TabPane tab="Exclusion Criteria" key="2" disabled={collapsible}>
              <Row>
                <Col span={excluCriteriaLib} style={{backgroundColor: '#F8F8F8'}}>
                  <Row style={{backgroundColor: '#F8F8F8'}}>
                    <Col span={24}>
                      <div className="item-header">
                        <span>Exclusion Criteria Library</span>
                        <Tooltip title={'Collapse Exclusion Criteria Library'}>
                          <CloseOutlined className="right-icon" onClick={() => setExcluCriteriaLib(0)}></CloseOutlined>
                        </Tooltip>
                        <Tooltip title={'View Historical Trial List'}>
                          <HistoryOutlined className="right-icon" onClick={searchHistoricalTrials}></HistoryOutlined>
                        </Tooltip>
                      </div>
                    </Col>
                  </Row>
                  <Row style={{borderBottom:'10px solid #F8F8F8'}}>
                    <Col flex="none">
                      <div style={{ padding: '0 10px' }}></div>
                    </Col>
                    <Col className="left-section">
                      <Row className="head-row" style={{alignItems: 'center', marginBottom: '10px'}}>
                        <Col span={16}>
                          <div className="item-option">
                            <span className="tip">Select criteria to add to Trial</span>
                          </div>
                        </Col>
                        <Col span={8} style={{textAlign:'right'}}>
                          <Row>
                          <Col span={24}><span className="frequency">CRITERIA FREQUENCY</span></Col>
                          </Row>
                          <Row style={{width:'100%'}}>
                          <Col span={24}>
                            <div id="freqModal" ref={null} onClick={() => setExcluVisible(true)}>
                              <span className="label">
                                {excluMinValue}%-{excluMaxValue}%
                              </span>
                              <EditFilled className={`${excluVisible ? 'active' : ''}`}/>
                            </div>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                      
                      {excluVisible ? (
                      <div className="freqSection">
                        <div className="title">
                          {/* <span>Set Frequency</span> */}
                          <CloseOutlined
                            className="right-icon"
                            onClick={() => setExcluVisible(false)}
                          ></CloseOutlined>
                        </div>
                        <br/>
                        <div className="content">
                          <span>Criteria Frequency</span>
                          <span style={{ float: "right", fontWeight: 'bold' }}>
                            {excluMinValue}% - {excluMaxValue}%
                          </span>
                        </div>
                        <Slider
                          range={{ draggableTrack: true }}
                          defaultValue={[excluMinValue, excluMaxValue]}
                          tipFormatter={formatter}
                          onAfterChange={getExcluFrequency}
                        />
                      </div>
                      ) : (
                      <></>
                      )}
                      <Row>
                        <Col span={24}>
                          <div className="content-outer">
                            <div className="content-over">
                              <div className="library box">
                                <span>Demographics</span>
                                <br />
                                {excluDemographics.map((demographic, idx) => {
                                  const activeType = excluDemographicsElements.find(e=> e['Eligibility Criteria']==demographic.Text) ?1:0
                                  return (
                                    <CriteriaOption
                                      selectedEle = {excluDemographicsElements}
                                      minValue={minValue}
                                      maxValue={maxValue}
                                      key={`demographic_${idx}`}
                                      demographic={demographic}
                                      index={0}
                                      idx={idx}
                                      handleOptionSelect={handleExcluOptionSelect}
                                    ></CriteriaOption>
                                  );
                                })}
                              </div>

                              <div className="library box">
                                <span>Medical Condition</span>
                                <br />
                                {excluMedCondition.map((medCon, idx) => {
                                 
                                  return (
                                    <CriteriaOption
                                      selectedEle = {excluMedConditionElements}
                                      minValue={minValue}
                                      maxValue={maxValue}
                                      key={`medCon_${idx}`}
                                      demographic={medCon}
                                      index={1}
                                      idx={idx}
                                      handleOptionSelect={handleExcluOptionSelect}
                                    ></CriteriaOption>
                                  );
                                })}
                              </div>

                               <div className="library box">
                                <span>Intervention</span>
                                <br />
                                {excluIntervention.map((intervent, idx) => {
                                  
                                  return (
                                    <CriteriaOption
                                      selectedEle = {excluInterventionElements}
                                      minValue={minValue}
                                      maxValue={maxValue}
                                      key={`intervent_${idx}`}
                                      demographic={intervent}
                                      index={2}
                                      idx={idx}
                                      handleOptionSelect={handleExcluOptionSelect}
                                    ></CriteriaOption>
                                  );
                                })}
                              </div> 

                              <div className="library box lastOne">
                                <span>Lab / Test</span>
                                <br />
                                {excluLabTest.map((lib, idx) => {
                                  
                                  return (
                                    <CriteriaOption
                                     selectedEle = {excluLabTestElements}
                                      minValue={minValue}
                                      maxValue={maxValue}
                                      key={`lib_${idx}`}
                                      demographic={lib}
                                      index={3}
                                      idx={idx}
                                      handleOptionSelect={handleExcluOptionSelect}
                                    ></CriteriaOption>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Col>
                    <Col flex="none">
                      <div style={{ padding: '0 10px' }}></div>
                    </Col>
                  </Row>
                  <Row style={{backgroundColor: '#fff'}}>
                    <Col span={24}>
                      <div className="updateTrial">
                        <Button className="update-btn" onClick={() => updateTrial(2)}>
                          UPDATE MY TRIAL
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Col>
                <Col span={24 - excluCriteriaLib} className={`${ excluCollapsible ? "none-click" : "" } main-content-right`}>
                  <Row style={{ paddingTop: '10px' }}>
                    <Col flex="none">
                      <div style={{ padding: '0 10px' }}></div>
                    </Col>
                    <Col flex="auto">
                      <Row>
                        <Col span={24}><span className="tab-title">Add Exclusion Criteria</span></Col>
                      </Row>
                      <Row>
                        <Col span={24}>
                        <span className="tip1-desc">
                          Use the historical trial library on the left to build the
                          I/E criteria for your scenario.
                        </span>
                        </Col>
                      </Row>
                      <Row>
                        <Col span={24}>
                        <div className="option-item">
                          <div>
                            <Collapse activeKey={excluActiveKey} onChange={excluCallback} expandIconPosition="right" >
                              <Panel header={panelHeader()} key="1" forceRender={false} >
                                <div className="chart-container">
                                  <div className="label">
                                    <span>Click on each metric to filter</span>
                                  </div>
                                  <ReactECharts
                                    option={excluAmendmentRateoption}
                                    style={{ height: 120}}
                                    onEvents={{'click': onExclusionChartClick}}/>
                                </div>
                                <div className="chart-container  box">
                                  <div className="label">
                                    <span>Click on each metric to filter</span>
                                  </div>
                                  <ReactECharts
                                    option={excluScreenFailureOption}
                                    style={{ height: 120}}
                                    onEvents={{'click': onExclusionChartClick}}/>
                                </div>
                              </Panel>
                            </Collapse>
                          </div>
                        </div>
                        </Col>
                      </Row>
                      <Row className="impact-summary-wrapper"> 
                        <Col span={24}>
                          <div className="impact-summary">
                            <span>Exclusion Criteria</span>
                            {activeTabKey === '3'? (
                              <></>
                            ) : (
                              <Button type="primary" onClick={saveCriteria} style={{zIndex: 1}}>
                                Save
                              </Button>
                            )}
                          </div>
                          </Col>
                      </Row>
                      <Row>
                        <Col span={24} >
                          <div className="collapse-container">
                          <div className="content-outer">
                            <div id="inclusion-criteria" 
                              className={`collapse-inner ${excluRollHeight == true ? "taller" : ""} ${excluCollapsible == true ? "collapsed" : ""}`}>
                              <div className="criteria-list">
                                <div className="list-columns">
                                  <Row>
                                    <Col span={3}><div className="col-item">S/No.</div></Col>
                                    <Col span={7}><div className="col-item">Eligibility Criteria</div></Col>
                                    <Col span={7}><div className="col-item">Values</div></Col>
                                    <Col span={7}><div className="col-item">Timeframe</div></Col>
                                  </Row>
                                </div>
                              </div>
                              <div className="sectionPanel">
                              <EditTable updateCriteria={updateExclusionCriteria} tableIndex={2} 
                                      data={excluDemographicsTableData} defaultActiveKey={excluDefaultActiveKey}
                                      collapsible={excluCollapsible} panelHeader={"Demographics"}/>
                              <EditTable updateCriteria={updateExclusionCriteria} tableIndex={3} 
                                      data={excluMedConditionTableData} defaultActiveKey={excluDefaultActiveKey}
                                      collapsible={excluCollapsible} panelHeader={"Medical Condition"}/>
                              <EditTable updateCriteria={updateExclusionCriteria} tableIndex={4} 
                                      data={excluInterventionTableData} defaultActiveKey={excluDefaultActiveKey}
                                      collapsible={excluCollapsible} panelHeader={"Intervention"}/>
                              <EditTable updateCriteria={updateExclusionCriteria} tableIndex={5} 
                                      data={excluLabTestTableData} defaultActiveKey={excluDefaultActiveKey}
                                      collapsible={excluCollapsible} panelHeader={"Lab / Test"}/>
                              </div>
                            </div>
                          </div>
                          </div>
                        </Col>
                      </Row>
                    </Col>
                    <Col flex="none">
                      <div style={{ padding: '0 10px' }}></div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </TabPane>
            <TabPane tab="Enrollment Feasibility" key="3" disabled={collapsible}>
            <Row>
                <Col span={5}>
                </Col>
                <Col span={14}>
                  <Row style={{ paddingTop: '10px' }}>
                    <Col flex="none">
                      <div style={{ padding: '0 10px' }}></div>
                    </Col>
                    <Col flex="auto" className="enrollment-right-section">
                      <Row>
                        <Col span={24}><span className="tab-title">Enrollment Feasibility</span></Col>
                      </Row>
                      <Row>
                        <Col span={24}>
                        <span className="tip1-desc">
                          View the impact of selected inclusion exclusion criteria on propspective patient enrollment.
                        </span>
                        </Col>
                      </Row>
                      <Row style={{paddingTop: 20}}>
                        <Col span={24}>
                          <span className="chart-title">My Protocol</span>
                        </Col>
                      </Row>
                      <Row className="enroll-tab">
                        <Col span={7} className={`chart-tab ${activeEnrollmentTabKey === '1' ? 'active' : ''}`} onClick={() => switchTabkey('1')}>
                          <Row><Col className="tab-item">
                            <Row className="tab-desc">Patients Eligible&nbsp;
                              {activeEnrollmentTabKey === '1'?(<CaretRightOutlined />):(<></>)}</Row>
                            <Row className="sub-tab-title">80K</Row>
                            <Row className="tab-desc">16% of Dataset</Row>
                          </Col></Row>
                        </Col>
                        <Col span={1}></Col>
                        <Col span={7} className={`chart-tab ${activeEnrollmentTabKey === '2' ? 'active' : ''}`} onClick={() => switchTabkey('2')}>
                          <Row><Col className="tab-item" span={24}>
                            <Row className="tab-desc">Female patients eligible&nbsp;
                                {activeEnrollmentTabKey === '2'?(<CaretRightOutlined />):(<></>)}</Row>
                            <Row className="sub-tab-title">20%</Row>
                          </Col></Row>
                        </Col>
                        <Col span={1}></Col>
                        <Col span={8} className={`chart-tab ${activeEnrollmentTabKey === '3' ? 'active' : ''}`} onClick={() => switchTabkey('3')}>
                          <Row><Col className="tab-item chart" span={24}>
                            <Row className="tab-desc">Race & Ethnicity&nbsp;
                                {activeEnrollmentTabKey === '3'?(<CaretRightOutlined />):(<></>)}</Row>
                            <Row><Col span={24}><ReactECharts option={raceOption} style={{ height: 100}}></ReactECharts></Col></Row>
                          </Col></Row>
                        </Col>
                      </Row>
                      <Row>
                        <Col span={24} className="result-chart">
                          <ReactECharts option={resultOption} style={{ height: 350}}></ReactECharts>
                        </Col>
                      </Row>
                    </Col>
                    <Col flex="none">
                      <div style={{ padding: '0 10px' }}></div>
                    </Col>
                  </Row>
                </Col>
                <Col span={5}></Col>
              </Row>
            </TabPane>
          </Tabs>
        </div>
      </div>

      ) : (
              <div className="ie-container"><ScheduleEvents record={trialRecord} submitType={submitType} scenarioId={scenarioId} handleGoBack={handleGoBack} history={props.history} setVisibleSOA={showSOAModal} getTrialById={getTrialById}/></div>
      )}
      </Spin>
      <Drawer title="Historical Trial List" placement="right" onClose={handleCancel} visible={showHistorical}>
        <Spin spinning={spinning} indicator={<LoadingOutlined style={{ color: "#ca4a04",fontSize: 24 }}/>} >
        <Row>
            <Col span={24} style={{paddingBottom: '10px'}}>
              {visibleSOA ? (
                <Button type="primary" onClick={downloadSOA} style={{float: 'right'}}>VIEW SOURCE</Button>
              ) : (
                <>
                  <Button type="primary" onClick={downloadIE} style={{float: 'right'}}>VIEW SOURCE</Button>
                  <Button onClick={downloadAverage} style={{float: 'right', marginRight: '15px', color: '#ca4a04'}}><span style={{color: '#ca4a04'}}>VIEW AVERAGE</span></Button>
                </>
              )}
            </Col>
        </Row>
        <Row>
            <Col span={24}><SelectableTable dataList={historicalTrialdata} /></Col>
        </Row>
        </Spin>
      </Drawer>
    </div>
      
    );
    
}


export default withRouter(ScenarioPage);