import React, { useState, useEffect, useReducer} from 'react';
import jsPDF from "jspdf";
import html2canvas from 'html2canvas'
import FileSaver from 'file-saver'
import {Button, Collapse, Slider, Dropdown,Menu, Modal, Row, Col, Tabs, Tooltip, Spin, message, Steps} from "antd";
import {getSummaryDefaultList, addScenario, getSimilarhistoricalTrialById, getStudy} from "../../utils/ajax-proxy";
import {withRouter } from 'react-router';
import {LeftOutlined, HistoryOutlined, CloseOutlined, EditFilled, DownOutlined,DownloadOutlined, CaretRightOutlined} from "@ant-design/icons";
import ReactECharts from 'echarts-for-react';
import "./index.scss";

import CriteriaOption from "../../components/CriteriaOption";
import EditTable from "../../components/EditTable";
import SelectableTable from "../../components/SelectableTable";
import ScheduleEvents from "../../components/ScheduleEvents";


const { Panel } = Collapse;
const { TabPane } = Tabs;
const { Step } = Steps;

const frequencyFilter = [80, 100]
const inActiveChartColors = ['#514c4a', '#65615f', '#86817f', '#a59e9b']
const activeChartColors = ['#d04a02', '#ed7738', '#ed9d72', '#f5b795']


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

const defaultChartValue = [
  {value: 0, name: 'Labs / Tests'},
  {value: 0, name: 'Intervention'},
  {value: 0, name: 'Demographics'},
  {value: 0, name: 'Medical'}
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

const ScenarioPage = (props) => {
    //Common cons
    const [trialRecord, setTrialRecord] = useReducer(
        (state, newState) => ({ ...state, ...newState }),
        { ...initialTrial }
    );
    const [scenario, setScenario] = useReducer(
        (state, newState) => ({ ...state, ...newState }),
        { ...initialScenario }
    );

    const [scenarioId, setScenarioId] = useState('')
    // const [scenario, setScenario] = useState({})
    const [editFlag, setEditFlag] = useState(false)
    const [scenarioType, setScenarioType] = useState('')
    const [activeEnrollmentTabKey, setActiveEnrollmentTabKey] = useState('1')
    const [activeTabKey, setActiveTabKey] = useState('1')
    const [processStep, setProcessStep] = useState(0)
    const [similarHistoricalTrials, setSimilarHistoricalTrials] = useState([])
    const [spinning, setSpinning] = useState(false)
    const [showChartLabel, setShowChartLabel] = useState(false)

    const [showHistorical, setShowHistorical] = useState(false)
    const [historicalTrialdata, setHistoricalTrialdata] = useState([])
    const [freqColor, setFreqColor] = useState('#ed7738')
    const [totalData, setTotalData] = useState([])
    const [freqData, setFreqdata] = useState([])
    const [chartTitle, setChartTitle] = useState('Patients Eligible - 80K(16% of Dataset)')

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
    const [therapeutic_Amend_Avg, setTherapeutic_Amend_Avg] = useState('Therapeutic Area Average - 0%')
    const [therapeutic_Screen_Avg, setTherapeutic_Screen_Avg] = useState('Therapeutic Area Average - 0%')
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
    const [exclu_Therapeutic_Amend_Avg, setExcluTherapeutic_Amend_Avg] = useState('Therapeutic Area Average - 0%')
    const [exclu_Therapeutic_Screen_Avg, setExcluTherapeutic_Screen_Avg] = useState('Therapeutic Area Average - 0%')
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
        const getTrialById = async () => {
            const resp = await getStudy(props.location.state.trial_id);
            if(resp.statusCode == 200){
                const tempRecord = resp.body
                setTrialRecord(tempRecord)
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
                        {value: formatNumber(inclu['Medical Condition'].protocol_amendment_rate), name: 'Medical'}
                    ])
                    setScreenRateData([
                        {value: formatNumber(inclu['Lab / Test'].screen_failure_rate), name: 'Labs / Tests'},
                        {value: formatNumber(inclu.Intervention.screen_failure_rate), name: 'Intervention'},
                        {value: formatNumber(inclu.Demographics.screen_failure_rate), name: 'Demographics'},
                        {value: formatNumber(inclu['Medical Condition'].screen_failure_rate), name: 'Medical'}
                    ])
            
                    if(tempRecord['Therapeutic Area Average']){
                        setTherapeutic_Amend_Avg('Therapeutic Area Average - ' + tempRecord['Therapeutic Area Average'].protocol_amendment_rate)
                        setTherapeutic_Screen_Avg('Therapeutic Area Average - ' + tempRecord['Therapeutic Area Average'].screen_failure_rate)
                        setAmend_avg_rate(tempRecord['Therapeutic Area Average'].protocol_amendment_rate)
                        setScreen_avg_rate(tempRecord['Therapeutic Area Average'].screen_failure_rate)
                    }

                    //Get exclusion chart info
                    var exclu = tempScenario["Exclusion Criteria"]
                    
                    setExcluProtocolRateData([
                        {value: formatNumber(exclu['Lab / Test'].protocol_amendment_rate), name: 'Labs / Tests'},
                        {value: formatNumber(exclu.Intervention.protocol_amendment_rate), name: 'Intervention'},
                        {value: formatNumber(exclu.Demographics.protocol_amendment_rate), name: 'Demographics'},
                        {value: formatNumber(exclu['Medical Condition'].protocol_amendment_rate), name: 'Medical'}
                    ])
                    setExcluScreenRateData([
                        {value: formatNumber(exclu['Lab / Test'].screen_failure_rate), name: 'Labs / Tests'},
                        {value: formatNumber(exclu.Intervention.screen_failure_rate), name: 'Intervention'},
                        {value: formatNumber(exclu.Demographics.screen_failure_rate), name: 'Demographics'},
                        {value: formatNumber(exclu['Medical Condition'].screen_failure_rate), name: 'Medical'}
                    ])
            
                    if(tempRecord['Therapeutic Area Average']){
                        setExcluTherapeutic_Amend_Avg('Therapeutic Area Average - ' + tempRecord['Therapeutic Area Average'].protocol_amendment_rate)
                        setExcluTherapeutic_Screen_Avg('Therapeutic Area Average - ' + tempRecord['Therapeutic Area Average'].screen_failure_rate)
                        setExcluAmend_avg_rate(tempRecord['Therapeutic Area Average'].protocol_amendment_rate)
                        setExcluScreen_avg_rate(tempRecord['Therapeutic Area Average'].screen_failure_rate)
                    }

                    setShowChartLabel(true)
                }
                
                if(tempEditFlag){
                    updateTrial(1)
                    updateTrial(2)
                }
            }
        };
        getTrialById();
      }
    }, []);

    useEffect(() => {
        const summaryDefaultList = async () => {
            const resp = await getSummaryDefaultList();
    
            if (resp.statusCode == 200) {
                const response = JSON.parse(resp.body)
                console.log(response)
    
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
                "Values": formatValue(item),
                "Timeframe": "-",
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
                "Values": formatValue(item),
                "Timeframe": "-",
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
                "Values": formatValue(item),
                "Timeframe": "-",
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
                "Values": formatValue(item),
                "Timeframe": "-",
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
      var tempStr
      if(item.Value === ''){
        tempStr = '-'
      } else {
        var value = item.Value
        if(value.length !== undefined){
          var minValue = value[0]
          var maxValue = value[1]
          // data type: Number 
          if(minValue === Number(minValue)){
            if(minValue >= 0){
              tempStr = '>=' + formatNum(minValue)
              if(maxValue >= 0){
                tempStr += ' and <=' + formatNum(maxValue)
              }
            } else if(maxValue >= 0){
              tempStr = '<=' + formatNum(maxValue)
            } else {
              tempStr = value.toString()
            }
          } else{
            if(minValue != ''){
              tempStr = '>=' + minValue
              if(maxValue != ''){
                tempStr += ' and <=' + maxValue
              }
            } else if(maxValue != ''){
              tempStr = '<=' + maxValue
            } else {
              tempStr = value.toString()
            }
          }
          
        } else {
          tempStr = formatNum(value)
        }
      }
      return tempStr
    }

    function formatNum(value){
      var str = value.toString()
      var id = str.lastIndexOf('.')
      if(id > -1){
        str = str.substr(0, id)
      }
      return str
    }

    const handleExcluOptionSelect = (item, activeType, id, key) =>{
      switch(id){
        case 0:
          var index = excluDemographicsElements.findIndex((domain) => item.Text == domain['Eligibility Criteria']);
          if(activeType == 1){
            if(index < 0){
              var newItem = {
                "Eligibility Criteria": item.Text,
                "Values": formatValue(item),
                "Timeframe": "-",
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
                "Values": formatValue(item),
                "Timeframe": "-",
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
                "Values": formatValue(item),
                "Timeframe": "-",
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
                "Values": formatValue(item),
                "Timeframe": "-",
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
            show: true,
            position: 'center',
            formatter: function () {
              if(showChartLabel){
                return '{p|' + amend_avg_rate + '}\n{nm|GOOD}'
              } else {
                return ''
              }
            },
            emphasis: '',
            rich: {
              p: {
                color: '#aba9a9',
                fontSize: 16,
                backgroundColor: "white"
              },
              nm: {
                color: 'green',
                fontSize: 8,
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
            show: true,
            position: 'center',
            formatter: function () {
              if(showChartLabel){
                return '{p|' + screen_avg_rate + '}\n{nm|GOOD}'
              } else {
                return ''
              }
            },
            emphasis: '',
            rich: {
              p: {
                color: '#aba9a9',
                fontSize: 16,
                backgroundColor: "white"
              },
              nm: {
                color: 'green',
                fontSize: 8,
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
              show: true,
              position: 'center',
              formatter: function () {
                if(showChartLabel){
                  return '{p|' + excluAmend_avg_rate + '}\n{nm|GOOD}'
                } else {
                  return ''
                }
              },
              emphasis: '',
              rich: {
                p: {
                  color: '#aba9a9',
                  fontSize: 16,
                  backgroundColor: "white"
                },
                nm: {
                  color: 'green',
                  fontSize: 8,
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
            show: true,
            position: 'center',
            formatter: function () {
              if(showChartLabel){
                return '{p|' + excluScreen_avg_rate + '}\n{nm|GOOD}'
              } else {
                return ''
              }
            },
            emphasis: '',
            rich: {
              p: {
                color: '#aba9a9',
                fontSize: 16,
                backgroundColor: "white"
              },
              nm: {
                color: 'green',
                fontSize: 8,
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
        data: ['Caucasian','Hispanic','Asian','Afican American']
      },
      series: [{
        type: 'pie',
        center: ['20%', '45%'],
        radius: ['30%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
        },
        color:['#d04a02', '#ed7738', '#ed9d72', '#f5b795'],
        data: [
          {value: 75, name: 'Caucasian'},
          {value: 12, name: 'Hispanic'},
          {value: 8, name: 'Asian'},
          {value: 5, name: 'Afican American'}
        ]
      }]
    };

    const resultOption = {
      title : {
        text: chartTitle,
        x:'45%',
        y:'top',
        textStyle: {
          fontSize: 14,
          fontWeight: 'bold'
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
          'HbA1c - >= 7.0% and <= 9.0%',    
          'Fasting C-peptide - >= 0.8 ng/mL', 
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
                  position: 'insideRight'
              },
              data: freqData
          }, {
              name: 'total',
              type: 'bar',
              stack: 'total',
              barWidth:'20px',
              color: '#fa4203',
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
      setFreqColor('#ed7738')

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
      setFreqColor('#f5b795')

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
  
    const handleOk = () => {
      setShowHistorical(false)
    }
    
    const handleCancel = () => {
      setShowHistorical(false)
    }

    const searchHistoricalTrials = async () => {
      setShowHistorical(true)
      if(historicalTrialdata.length == 0){
        setSpinning(true)
        const resp = await getSimilarhistoricalTrialById(similarHistoricalTrials);
        if (resp.statusCode == 200) {
          setSpinning(false)
          setHistoricalTrialdata(JSON.parse(resp.body))
        }
      }
    }

    const handleExport = (fileType) => {
      console.log("export josn file:")
      switch(fileType){
        case 'csv':
          csvExport();
          break;
        case 'pdf':
          pdfMake()
          break;
        default:
          jsonExport(trialRecord, "Scenario");
      }
    }

    const csvExport = async () => {
      let str='';

      //Get Inclusion Criteria Data
      str += 'Inclusion Criteria';
      str += '\n' + 'Caregory' + ',' + 'S/No.' + ',' + 'Eligibility Criteria' + ',' + 'Values' + ',' 
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
      str += '\n' + 'Caregory' + ',' + 'S/No.' + ',' + 'Eligibility Criteria' + ',' + 'Values' + ',' 
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

    const saveCriteria = async () => {
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

      setImpactColors(activeChartColors)
      setExcluImpactColors(activeChartColors)
      //Update record
      const resp = await addScenario(newTrial);
      console.log(newTrial)
      if (resp.statusCode == 200) {
        var currentScenario = resp.body.scenarios.find( i=> i['scenario_id'] == scenarioId)

        //Get inclusion chart info
        var inclu = currentScenario["Inclusion Criteria"]
        
        setProtocolRateData([
          {value: formatNumber(inclu['Lab / Test'].protocol_amendment_rate), name: 'Labs / Tests'},
          {value: formatNumber(inclu.Intervention.protocol_amendment_rate), name: 'Intervention'},
          {value: formatNumber(inclu.Demographics.protocol_amendment_rate), name: 'Demographics'},
          {value: formatNumber(inclu['Medical Condition'].protocol_amendment_rate), name: 'Medical'}
        ])
        setScreenRateData([
          {value: formatNumber(inclu['Lab / Test'].screen_failure_rate), name: 'Labs / Tests'},
          {value: formatNumber(inclu.Intervention.screen_failure_rate), name: 'Intervention'},
          {value: formatNumber(inclu.Demographics.screen_failure_rate), name: 'Demographics'},
          {value: formatNumber(inclu['Medical Condition'].screen_failure_rate), name: 'Medical'}
        ])
  
        if(resp.body['Therapeutic Area Average']){
          setTherapeutic_Amend_Avg('Therapeutic Area Average - ' + resp.body['Therapeutic Area Average'].protocol_amendment_rate)
          setTherapeutic_Screen_Avg('Therapeutic Area Average - ' + resp.body['Therapeutic Area Average'].screen_failure_rate)
          setAmend_avg_rate(resp.body['Therapeutic Area Average'].protocol_amendment_rate)
          setScreen_avg_rate(resp.body['Therapeutic Area Average'].screen_failure_rate)
        }

        //Get exclusion chart info
        var exclu = currentScenario["Exclusion Criteria"]
        
        setExcluProtocolRateData([
          {value: formatNumber(exclu['Lab / Test'].protocol_amendment_rate), name: 'Labs / Tests'},
          {value: formatNumber(exclu.Intervention.protocol_amendment_rate), name: 'Intervention'},
          {value: formatNumber(exclu.Demographics.protocol_amendment_rate), name: 'Demographics'},
          {value: formatNumber(exclu['Medical Condition'].protocol_amendment_rate), name: 'Medical'}
        ])
        setExcluScreenRateData([
          {value: formatNumber(exclu['Lab / Test'].screen_failure_rate), name: 'Labs / Tests'},
          {value: formatNumber(exclu.Intervention.screen_failure_rate), name: 'Intervention'},
          {value: formatNumber(exclu.Demographics.screen_failure_rate), name: 'Demographics'},
          {value: formatNumber(exclu['Medical Condition'].screen_failure_rate), name: 'Medical'}
        ])
  
        if(resp.body['Therapeutic Area Average']){
          setExcluTherapeutic_Amend_Avg('Therapeutic Area Average - ' + resp.body['Therapeutic Area Average'].protocol_amendment_rate)
          setExcluTherapeutic_Screen_Avg('Therapeutic Area Average - ' + resp.body['Therapeutic Area Average'].screen_failure_rate)
          setExcluAmend_avg_rate(resp.body['Therapeutic Area Average'].protocol_amendment_rate)
          setExcluScreen_avg_rate(resp.body['Therapeutic Area Average'].screen_failure_rate)
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

    // const option = [{
    //   Name:'Age',
    //   Count: '500',
    //   Desc:'85%',
    //   SubDesc: '(52% Female / 48% Male)',
    //   span: 24
    // },{
    //   Name:'Gender',
    //   Count: '450',
    //   Desc:'75%',
    //   SubDesc: '',
    //   span: 22
    // },{
    //   Name:'Stable body weight',
    //   Count: '370',
    //   Desc:'55%',
    //   SubDesc: '',
    //   span: 20
    // },{
    //   Name:'Type 2 Diabetes',
    //   Count: '260',
    //   Desc:'45%',
    //   SubDesc: '',
    //   span: 18
    // },{
    //   Name:'Metformin',
    //   Count: '120',
    //   Desc:'25%',
    //   SubDesc: '29%',
    //   span: 16
    // },{
    //   Name:'Insulin',
    //   Count: '120',
    //   Desc:'25%',
    //   SubDesc: '',
    //   span: 16
    // },{
    //   Name:'TSH',
    //   Count: '100',
    //   Desc:'22%',
    //   SubDesc: '',
    //   span: 15
    // },{
    //   Name:'Fasting C peptide',
    //   Count: '90',
    //   Desc:'20%',
    //   SubDesc: '',
    //   span: 14
    // },{
    //   Name:'HbA1c',
    //   Count: '70',
    //   Desc:'15%',
    //   SubDesc: '',
    //   span: 12
    // }]


  //--------------------------------------------

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
    console.log("export josn file:" +filename)
};

const pdfMake = async () =>{
  var element = document.getElementById("inclusion-criteria");
  var w = element.offsetWidth;
  var h = element.offsetWidth;
  var offsetTop = element.offsetTop;
  var offsetLeft = element.offsetLeft;
  var canvas = document.createElement("canvas");
  var abs = 0;
  var win_i =  document.body.clientWidth;
  var win_o = window.innerWidth;
  if (win_o > win_i) {
      abs = (win_o - win_i) / 2;
  }
  canvas.width = w * 2;
  canvas.height = h * 2;
  var context = canvas.getContext("2d");
  context.scale(2, 2);
  context.translate(-offsetLeft - abs, -offsetTop);


    html2canvas(element,{
        allowTaint: true,
        scale: 2
    }).then(function (canvas) {
      const pdf = new jsPDF("portrait", 'pt', 'a4');
      const tableColumn = ["Predicated Impact", "Labs / Tests", "Intervention", "Demographics", "Medical"];

      const tableRows = [];
      const rate1 = ['Protocol Amendenment Rate', '45%', '26%', '4%', '24%']
      const rate2 = ['Screen Failure Rate', '45%', '26%', '4%', '24%']
      tableRows.push(rate1);
      tableRows.push(rate2);
      // pdf.table(5,2,[],[],[           ])
      // pdf.autoTable(tableColumn, tableRows, { startY: 40 });
      pdf.text("Predicated Impact", 14, 35);
      pdf.text("Inclusion Criteria", 14, 140);

        var contentWidth = canvas.width;
        var contentHeight = canvas.height;
        var pageHeight = contentWidth / 592.28 * 841.89;
        var leftHeight = contentHeight;
        var position = 0;
        var imgWidth = 595.28-70;
        var imgHeight = 592.28 / contentWidth * contentHeight;

        var pageData = canvas.toDataURL('image/jpeg', 1.0);

        if (leftHeight < pageHeight) {
            pdf.addImage(pageData, 'JPEG', 35, 150, imgWidth, imgHeight);
        } else {
            while (leftHeight > 0) {
                pdf.addImage(pageData, 'JPEG', 35, position, imgWidth, imgHeight)
                leftHeight -= pageHeight;
                position -= 841.89;
                if (leftHeight > 0) {
                    pdf.addPage();
                }
            }
        }

        const date = Date().split(" ");
        console.log(date)
        const dateStr = date[1] + '_' + date[2] + '_' + date[3] + '_' + date[4];
        pdf.save(`Inclusion_Criteria_${dateStr}.pdf`);
    });
};
  
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
    console.log(activeKey)
  }

  const onInclusionChartClick = (e) =>{
    if(e.name === 'Medical'){
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
    if(e.name === 'Medical'){
      setExcluDefaultActiveKey(['3'])
    } else if(e.name === 'Labs / Tests'){
      setExcluDefaultActiveKey(['5'])
    } else if(e.name === 'Intervention'){
      setExcluDefaultActiveKey(['4'])
    } else if(e.name === 'Demographics'){
      setExcluDefaultActiveKey(['2'])
    }
  }
  
    return (
    <div className="scenario-container">
      <div>
        <Row className="process-container">
            <Col span={2} style={{borderRight: '1.5px solid #c4bfbf'}}>
                <div className="action-title" onClick={()=>props.history.push('/trials')}>
                    <span><LeftOutlined /> Trial Page</span>
                </div>
            </Col>
            <Col span={4} style={{maxHeight: '32px'}}>
              <Row>
              <Col span={24}>
                <Row className="item-translate">
                    <Col flex="10px"></Col>
                    <Col flex="auto"><span style={{fontSize: '15px'}}>Albiglutide: {scenarioType}</span></Col>
                </Row>
                <Row className="item-translate">
                    
                    <Col flex="10px"></Col>
                    <Col flex="auto" style={{fontSize: '15px', fontWeight: 'bold'}}>{scenario['scenario_name']}</Col>
                </Row>
                </Col>
                </Row>
            </Col>
            <Col span={1} style={{borderLeft: '1.5px solid #c4bfbf'}}/>
            <Col span={8}>
                <Steps progressDot current={processStep} size="small" >
                    <Step title="Add Inclusion / Exclusion Criteria"/>
                    <Step title="Add Schedule of Events"/>
                </Steps>
            </Col>
            <Col span={9} className={`${ collapsible ? "none-click" : "" }`}>
                {activeTabKey === '1'?(
                    <>
                        <Button type="primary" className="step-btn" onClick={() => setActiveTabKey('2')}>
                            NEXT:EXCLUSION CRITERIA
                        </Button>
                    </>
                ):(activeTabKey === '2'?(
                    <>
                        <Button type="primary" className="step-btn" onClick={() => setActiveTabKey('3')}>
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
                        <Button type="primary" className="step-btn" >
                            SUBMIT
                        </Button>
                        <Button type="primary" className="step-btn" >
                            SAVE AND FINISH LATER
                        </Button>
                        <Button className="view-btn step-btn" onClick={() => setProcessStep(0)}>
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
            <Col span={7}>
              <Dropdown.Button style={{zIndex: 1}}
                overlay={
                  <Menu>
                    <Menu.Item key="json" onClick={() => handleExport('json')}>JSON</Menu.Item>
                    <Menu.Item key="pdf" onClick={() => handleExport('pdf')}>PDF</Menu.Item>
                    <Menu.Item key="csv" onClick={() => handleExport('csv')}>CSV</Menu.Item>
                  </Menu>
                }
                icon={<DownOutlined />}>
                <DownloadOutlined />
                EXPORT AS
              </Dropdown.Button>
              {activeTabKey === '3'? (
                <></>
              ) : (
                <Button type="primary" onClick={saveCriteria} style={{zIndex: 1, marginTop: '8px', marginRight: '20px'}}>
                  Save
                </Button>
              )}
            </Col>
          </Row>
        </div>
        <div className="tab-container">
          <Tabs onChange={changeActiveTabKey} activeKey={activeTabKey} centered>
            <TabPane tab="Inclusion Criteria" key="1">
              <Row>
                <Col span={6} style={{backgroundColor: '#f3f3f3'}}>
                  <Row style={{backgroundColor: '#f3f3f3'}}>
                    <Col span={24}>
                      <div className="item-header">
                        <span>Inclusion Criteria Library</span>
                        <CloseOutlined className="right-icon"></CloseOutlined>
                        <Tooltip title={'View Historical Trial List'}>
                          <HistoryOutlined className="right-icon" onClick={searchHistoricalTrials}></HistoryOutlined>
                        </Tooltip>
                      </div>
                    </Col>
                  </Row>
                  <Row style={{borderBottom:'10px solid #f3f3f3'}}>
                    <Col flex="none">
                      <div style={{ padding: '0 10px' }}></div>
                    </Col>
                    <Col className="left-section">
                      <Row style={{alignItems: 'center', marginBottom: '10px'}}>
                        <Col span={16}>
                          <div className="item-option">
                            <span>Select / Unselect criteria to add to Trial</span>
                          </div>
                        </Col>
                        <Col span={8} style={{textAlign:'right'}}>
                          <Row>
                          <Col span={24}><span>CRITERIA FREQUENCY</span></Col>
                          </Row>
                          <Row style={{width:'100%'}}>
                          <Col span={24}>
                            <div id="freqModal" ref={null} onClick={() => setVisible(true)}>
                              <span className="label">
                                {minValue}%-{maxValue}%
                              </span>
                              <EditFilled />
                            </div>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                      
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
                <Col span={18} className={`${ collapsible ? "none-click" : "" }`}>
                  <Row style={{ paddingTop: '10px' }}>
                    <Col flex="none">
                      <div style={{ padding: '0 10px' }}></div>
                    </Col>
                    <Col flex="auto">
                      <Row>
                        <Col span={24}><h4>Add Inclusion Criteria</h4></Col>
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
                            <Collapse activeKey={activeKey} onChange={callback} expandIconPosition="right" >
                              <Panel header={panelHeader()} key="1" forceRender={false} >
                                <div className="chart-container">
                                  <div className="label">
                                    <span>Click on each metrics to filter</span>
                                  </div>
                                  <ReactECharts
                                    option={amendmentRateoption}
                                    style={{ height: 120}}
                                    onEvents={{'click': onInclusionChartClick}}/>
                                </div>
                                <div className="chart-container  box">
                                  <div className="label">
                                    <span>Click on each metrics to filter</span>
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
                      <Row>
                        <Col span={24}>
                          <div className="impact-summary">
                            <span>Inclusion Criteria</span>
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
                <Col span={6} style={{backgroundColor: '#f3f3f3'}}>
                  <Row style={{backgroundColor: '#f3f3f3'}}>
                    <Col span={24}>
                      <div className="item-header">
                        <span>Exclusion Criteria Library</span>
                        <CloseOutlined className="right-icon"></CloseOutlined>
                        <Tooltip title={'View Historical Trial List'}>
                          <HistoryOutlined className="right-icon" onClick={searchHistoricalTrials}></HistoryOutlined>
                        </Tooltip>
                      </div>
                    </Col>
                  </Row>
                  <Row style={{borderBottom:'10px solid #f3f3f3'}}>
                    <Col flex="none">
                      <div style={{ padding: '0 10px' }}></div>
                    </Col>
                    <Col className="left-section">
                      <Row style={{alignItems: 'center', marginBottom: '10px'}}>
                        <Col span={16}>
                          <div className="item-option">
                            <span>Select / Unselect criteria to add to Trial</span>
                          </div>
                        </Col>
                        <Col span={8} style={{textAlign:'right'}}>
                          <Row>
                          <Col span={24}><span>CRITERIA FREQUENCY</span></Col>
                          </Row>
                          <Row style={{width:'100%'}}>
                          <Col span={24}>
                            <div id="freqModal" ref={null} onClick={() => setExcluVisible(true)}>
                              <span className="label">
                                {excluMinValue}%-{excluMaxValue}%
                              </span>
                              <EditFilled />
                            </div>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                      
                      {excluVisible ? (
                      <div className="freqSection">
                        <div className="title">
                          <span>Set Frequency</span>
                          <CloseOutlined
                            className="right-icon"
                            onClick={() => setExcluVisible(false)}
                          ></CloseOutlined>
                        </div>
                        <div className="content">
                          <span>Criteria Frequency</span>
                          <span style={{ float: "right" }}>
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
                <Col span={18} className={`${ excluCollapsible ? "none-click" : "" }`}>
                  <Row style={{ paddingTop: '10px' }}>
                    <Col flex="none">
                      <div style={{ padding: '0 10px' }}></div>
                    </Col>
                    <Col flex="auto">
                      <Row>
                        <Col span={24}><h4>Add Exclusion Criteria</h4></Col>
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
                                    <span>Click on each metrics to filter</span>
                                  </div>
                                  <ReactECharts
                                    option={excluAmendmentRateoption}
                                    style={{ height: 120}}
                                    onEvents={{'click': onExclusionChartClick}}/>
                                </div>
                                <div className="chart-container  box">
                                  <div className="label">
                                    <span>Click on each metrics to filter</span>
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
                      <Row>
                        <Col span={24}>
                          <div className="impact-summary">
                            <span>Exclusion Criteria</span>
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
                  {/* <Row style={{backgroundColor: '#f3f3f3'}}>
                    <Col span={24}>
                      <div style={{padding: '5px 15px'}}>
                        <span style={{fontSize: '16px', fontWeight: 500}}>My Protocol</span>
                      </div>
                    </Col>
                  </Row>
                  <Row style={{borderBottom:'10px solid #f3f3f3'}}>
                    <Col flex="none">
                      <div style={{ padding: '0 10px' }}></div>
                    </Col>
                    <Col className="enrollment-left-section">
                      <Row className="check-header">
                        <Col span={24}><Checkbox onChange={null} defaultChecked={true} >Demographic</Checkbox></Col>
                      </Row>
                      <Row className="list-item">
                        <Col span={5}><span>Age</span></Col>
                        <Col span={6}><Input defaultValue=">18" /></Col>
                      </Row>
                      <Row className="list-item">
                        <Col span={5}><span>Gender</span></Col>
                        <Col span={18}><Input defaultValue="Men or nonpregnant women" /></Col>
                      </Row>
                      <Row className="list-item">
                        <Col span={9}><span>Stable body weight</span></Col>
                        <Col span={14}><Input defaultValue="Not charged by more than 5%" /></Col>
                      </Row>
                      <Row className="check-header">
                        <Col span={24}><Checkbox onChange={null} defaultChecked={true} >Medical Condition</Checkbox></Col>
                      </Row>
                      <Row className="list-item">
                        <Col span={10}><span>Type 2 Diabetes</span></Col>
                      </Row>
                      <Row className="check-header">
                        <Col span={24}><Checkbox onChange={null} defaultChecked={true} >Intervention</Checkbox></Col>
                      </Row>
                      <Row className="list-item">
                        <Col span={6}><span>Meformin</span></Col>
                        <Col span={6}><Input defaultValue="Stable" /></Col>
                      </Row>
                      <Row className="check-header">
                        <Col span={24}><Checkbox onChange={null} defaultChecked={true} >Lab / Test</Checkbox></Col>
                      </Row>
                      <Row className="list-item">
                        <Col span={3}><span>TSH</span></Col>
                        <Col span={20}><Input defaultValue="Normal or clinically euthyroid" /></Col>
                      </Row>
                      <Row className="list-item">
                        <Col span={10}><span>Fasting C-peptide</span></Col>
                        <Col span={8}><Input defaultValue="&ge;0.8 ng/mL" /></Col>
                      </Row>
                      <Row className="list-item">
                        <Col span={5}><span>HbA1c</span></Col>
                        <Col span={12}><Input defaultValue="&ge;7.0% and &le;9.0%" /></Col>
                      </Row>
                    </Col>
                    <Col flex="none">
                      <div style={{ padding: '0 10px' }}></div>
                    </Col>
                  </Row> */}
                </Col>
                <Col span={14}>
                  <Row style={{ paddingTop: '10px' }}>
                    <Col flex="none">
                      <div style={{ padding: '0 10px' }}></div>
                    </Col>
                    <Col flex="auto" className="enrollment-right-section">
                      <Row>
                        <Col span={24}><h4>Enrollment Feasibility</h4></Col>
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
                      {/* <Row>
                        <Col span={24}>
                          <div className="content-outer">
                            <div className="enrollment-item">
                              {option.map((item, index) => {
                                return (
                                  <div key={index}>
                                  {index == 0 ? (
                                    <div className="first-item">
                                      <Row className="title-box">
                                        <Col span={18} className="name-box"><span>{item.Name}</span></Col>
                                        <Col span={6} className="count-box"><span>{item.Count}K</span></Col>
                                      </Row>
                                      <Row>
                                        <Col span={item.span} className="item-bar"></Col>
                                      </Row>
                                      <Row>
                                        <Col span={option[index+1].span} className="content-box">
                                          <Row>
                                            <Col flex="50px" className="desc-box"><span>{item.Desc}</span></Col>
                                            <Col flex="auto" className="subdesc-box"><span>{item.SubDesc}</span></Col>
                                          </Row>
                                          <br/>
                                          <Row className="title-box">
                                            <Col span={18} className="name-box"><span>{option[index+1].Name}</span></Col>
                                            <Col span={6} className="count-box"><span>{option[index+1].Count}K</span></Col>
                                          </Row>
                                        </Col>
                                        <Col span={item.span-option[index+1].span} className="triangle-topleft"></Col>
                                      </Row>
                                    </div>
                                  ):(index != option.length -1?(
                                    <div className="normal-item">
                                      <Row>
                                        <Col span={item.span} className="item-bar"></Col>
                                      </Row>
                                      <Row>
                                        <Col span={option[index+1].span} className="content-box">
                                          <Row>
                                            <Col flex="100px" className="desc-box"><span>{item.Desc}</span></Col>
                                            <Col flex="auto" className="subdesc-box"><span>{item.SubDesc}</span></Col>
                                          </Row>
                                          <br/>
                                          <Row className="title-box">
                                            <Col span={18} className="name-box"><span>{option[index+1].Name}</span></Col>
                                            <Col span={6} className="count-box"><span>{option[index+1].Count}K</span></Col>
                                          </Row>
                                        </Col>
                                        <Col span={item.span - option[index+1].span} className="triangle-topleft"></Col>
                                      </Row>
                                    </div>
                                  ):(
                                    <Row>
                                        <Col span={item.span} className="item-bar"></Col>
                                      </Row>
                                  ))}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </Col>
                      </Row> */}
                      <Row className="enroll-tab">
                        <Col span={7} className={`chart-tab ${activeEnrollmentTabKey === '1' ? 'active' : ''}`} onClick={() => switchTabkey('1')}>
                          <Row><Col className="tab-item">
                            <Row className="tab-desc">Patients Eligible&nbsp;
                              {activeEnrollmentTabKey === '1'?(<CaretRightOutlined />):(<></>)}</Row>
                            <Row className="tab-title">80K</Row>
                            <Row className="tab-desc">16% of Dataset</Row>
                          </Col></Row>
                        </Col>
                        <Col span={1}></Col>
                        <Col span={7} className={`chart-tab ${activeEnrollmentTabKey === '2' ? 'active' : ''}`} onClick={() => switchTabkey('2')}>
                          <Row><Col className="tab-item" span={24}>
                            <Row className="tab-desc">Female patients eligible&nbsp;
                                {activeEnrollmentTabKey === '2'?(<CaretRightOutlined />):(<></>)}</Row>
                            <Row className="tab-title">20%</Row>
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
        <div className="ie-container"><ScheduleEvents/></div>
      )}
      <Modal visible={showHistorical} title="Historical Trial List" onOk={handleOk} onCancel={handleCancel}
        footer={null} style={{ left: '20%', top:50 }} centered={false} width={200} > 
        <Row>
          <Spin spinning={spinning}>
            <Col span={24}><SelectableTable dataList={historicalTrialdata} /></Col>
          </Spin>
        </Row>
      </Modal>
    </div>
      
    );
    
}


export default withRouter(ScenarioPage);