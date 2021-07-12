import React, { useState, useReducer, useEffect } from "react";
import {Table, Collapse, Slider, Dropdown,Menu, Modal, Row, Col, InputNumber, Tooltip, Button, Spin, message} from "antd";
import {ArrowRightOutlined, CloseOutlined, EditFilled, MinusOutlined, PlusOutlined, DownOutlined, DownloadOutlined} from "@ant-design/icons";
import {getStandardEvents, updateStudy} from "../../utils/ajax-proxy";
import ReactECharts from 'echarts-for-react';
import "./index.scss";
import EventList from '../EventList';
import FileSaver from 'file-saver';

const { Panel } = Collapse;

const iChartColors = ['#514c4a', '#65615f', '#86817f', '#a59e9b', '#d2cbc8']
const aChartColors = ['#d04a02', '#ed7738', '#ed9d72', '#f5b795', '#f5ddcf']

const CATEGORY_LABS = 'Labs';
const CATEGORY_PHYSICAL_EXAMINATION = 'Physical Examination';
const CATEGORY_PROCEDURES = 'Procedures';
const CATEGORY_QUESTIONNAIRES = 'Questionnaires';
const CATEGORY_STUDY_PROCEDURES = 'Study Procedures';

const defaultCostValue = [
  {value: 0, name: CATEGORY_LABS},
  {value: 0, name: CATEGORY_PHYSICAL_EXAMINATION},
  {value: 0, name: CATEGORY_PROCEDURES},
  {value: 0, name: CATEGORY_QUESTIONNAIRES},
  {value: 0, name: CATEGORY_STUDY_PROCEDURES}
]

const defaultBurdenValue = [0, 0, 0, 0, 0, 0, 0, 0, 0]

const initialNumber = {
  visitNumber: 9,
  weekNumber: 26
}

const ScheduleEvents = (props) => {

  const [hiddeTags, setHiddeTags] = useState(true)
  const [showConfigure, setShowConfigure] = useState(false)
  const [eventLib, setEventLib] = useState(6)
  const [activeCollapse, setActiveCollapse] = useState(['1'])
  const [numbers, setNumbers] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    { ...initialNumber }
  );
  const [weeks, setWeeks] = useState([])

  //Cost Per Patient Chart
  const [patientChartColor, setPatientChartColor] = useState(iChartColors)
  const [costData, setCostData] = useState(defaultCostValue)
  const [costSubTitle, setCostSubTitle] = useState('')
  const [showPatientLabel, setShowPatientLabel] = useState(false)
  const [patientRate, setPatientRate] = useState('{p|$9.4K}\n{good|GOOD}')

  //Patirnt Burden Chart
  const [burdenData, setBurdenData] = useState(defaultBurdenValue)
  const [burdenSubTitle, setBurdenSubTitle] = useState('')
  const [burdenXAxis, setBurdenXAxis] = useState(['1', '2', '3', '4', '5', '6', '7', '8', '9'])
  const [showTooltip, setShowTooltip] = useState(false)

  //Event Libs
  //Original data from backend
  const [orgLabs, setOrgLabs] = useState([])
  const [orgExamination, setOrgExamination] = useState([])
  const [orgProcedures, setOrgProcedures] = useState([])
  const [orgQuestionnaires, setOrgQuestionnaires] = useState([])
  const [orgStudyProcedures, setOrgStudyProcedures] = useState([])

  //Filtered data based on the frequency and original data
  let [filteredLabs, setFilteredLabs] = useState([])
  let [filteredExamination, setFilteredExamination] = useState([])
  let [filteredQuestionnaires, setFilteredQuestionnaires] = useState([])
  let [filteredProcedures, setFilteredProcedures] = useState([])
  let [filteredStudyProcedures, setFilteredStudyProcedures] = useState([])

  //Addedd data 
  let [addedLabs, setAddedLabs] = useState([])
  let [addedExamination, setAddedExamination] = useState([])
  let [addedQuestionnaires, setAddedQuestionnaires] = useState([])
  let [addedProcedures, setAddedProcedures] = useState([])
  let [addedStudyProcedures, setAddedStudyProcedures] = useState([])

  const onStepVisit = (value: number, info: { offset: number, type: 'up' | 'down' }) => {
    setNumbers({
      ['visitNumber']: value
    });
  }

  const onStepWeek = (value: number, info: { offset: number, type: 'up' | 'down' }) => {
    setNumbers({
      ['weekNumber']: value
    });
  }

  function excluCallback(key) {
  }

  useEffect(() => {
    console.log(props.record)

    //Verify if this is the first time to set Events
    const scenario = props.record.scenarios.find(s=> s['scenario_id'] === props.scenarioId)
    const eventsConfigure = scenario['Schedule of Events']
    if(eventsConfigure != undefined && eventsConfigure.Labs != undefined){
      setHiddeTags(false)
    } else {
      setShowConfigure(true)
    }
    const getStandardEventsLib = async () => {
      var resp = await getStandardEvents();

      if (resp.statusCode == 200) {
          const response = JSON.parse(resp.body)
          console.log(response)

          setOrgLabs(response[CATEGORY_LABS])
          setOrgExamination(response[CATEGORY_PHYSICAL_EXAMINATION])
          setOrgProcedures(response[CATEGORY_PROCEDURES])
          setOrgQuestionnaires(response[CATEGORY_QUESTIONNAIRES])
          setOrgStudyProcedures(response[CATEGORY_STUDY_PROCEDURES])

          //Init previous configure
          if(eventsConfigure != undefined && eventsConfigure.Labs != undefined){
            setNumbers({
              ['visitNumber']: eventsConfigure.Visits,
              ['weekNumber']: eventsConfigure.Weeks[eventsConfigure.Weeks.length -1]
            });
            setWeeks(eventsConfigure.Weeks)
            setPatientChartColor(aChartColors)
            setShowPatientLabel(true)

            setAddedLabs(eventsConfigure[CATEGORY_LABS].entities)
            setAddedExamination(eventsConfigure[CATEGORY_PHYSICAL_EXAMINATION].entities)
            setAddedQuestionnaires(eventsConfigure[CATEGORY_QUESTIONNAIRES].entities)
            setAddedProcedures(eventsConfigure[CATEGORY_PROCEDURES].entities)
            setAddedStudyProcedures(eventsConfigure[CATEGORY_STUDY_PROCEDURES].entities)
            
            setPatientRate('{p|$'+ eventsConfigure.TotalCost +'K}\n{'+eventsConfigure.CostRate + '|' + eventsConfigure.CostRate + '}')
            setCostData(eventsConfigure.CostData)
            setCostSubTitle('Average from Similar Historical \nTrials - $' + eventsConfigure.CostAvg + 'K / Patient')
            setBurdenData(eventsConfigure.BurdenData)
            setBurdenXAxis(eventsConfigure.BurdenXAxis)
            setBurdenSubTitle('Average from similar Historical \nTrials - ' + eventsConfigure.BurdenAvg)
            setShowTooltip(true)

            setFilteredLabs(response[CATEGORY_LABS].filter((d) => {
              var index = eventsConfigure[CATEGORY_LABS].entities.findIndex((domain) => d['Standard Event'] === domain['Standard Event']);
              if(index > -1){
                return Object.assign(d, {
                  selected: true, 
                  condition: eventsConfigure[CATEGORY_LABS].entities[index].condition, 
                  totalVisit: eventsConfigure[CATEGORY_LABS].entities[index].totalVisit})
              } else {
                return Object.assign(d, {selected: false, condition: [], totalVisit: 0})
              }
            }))
            setFilteredExamination(response[CATEGORY_PHYSICAL_EXAMINATION].filter((d) => {
              var index = eventsConfigure[CATEGORY_PHYSICAL_EXAMINATION].entities.findIndex((domain) => d['Standard Event'] === domain['Standard Event']);
              if(index > -1){
                return Object.assign(d, {
                  selected: true, 
                  condition: eventsConfigure[CATEGORY_PHYSICAL_EXAMINATION].entities[index].condition, 
                  totalVisit: eventsConfigure[CATEGORY_PHYSICAL_EXAMINATION].entities[index].totalVisit})
              } else {
                return Object.assign(d, {selected: false, condition: [], totalVisit: 0})
              }
            }))
            setFilteredProcedures(response[CATEGORY_PROCEDURES].filter((d) => {
              var index = eventsConfigure[CATEGORY_PROCEDURES].entities.findIndex((domain) => d['Standard Event'] === domain['Standard Event']);
              if(index > -1){
                return Object.assign(d, {
                  selected: true, 
                  condition: eventsConfigure[CATEGORY_PROCEDURES].entities[index].condition, 
                  totalVisit: eventsConfigure[CATEGORY_PROCEDURES].entities[index].totalVisit})
              } else {
                return Object.assign(d, {selected: false, condition: [], totalVisit: 0})
              }
            }))
            setFilteredQuestionnaires(response[CATEGORY_QUESTIONNAIRES].filter((d) => {
              var index = eventsConfigure[CATEGORY_QUESTIONNAIRES].entities.findIndex((domain) => d['Standard Event'] === domain['Standard Event']);
              if(index > -1){
                return Object.assign(d, {
                  selected: true, 
                  condition: eventsConfigure[CATEGORY_QUESTIONNAIRES].entities[index].condition, 
                  totalVisit: eventsConfigure[CATEGORY_QUESTIONNAIRES].entities[index].totalVisit})
              } else {
                return Object.assign(d, {selected: false, condition: [], totalVisit: 0})
              }
            }))
            setFilteredStudyProcedures(response[CATEGORY_STUDY_PROCEDURES].filter((d) => {
              var index = eventsConfigure[CATEGORY_STUDY_PROCEDURES].entities.findIndex((domain) => d['Standard Event'] === domain['Standard Event']);
              if(index > -1){
                return Object.assign(d, {
                  selected: true, 
                  condition: eventsConfigure[CATEGORY_STUDY_PROCEDURES].entities[index].condition, 
                  totalVisit: eventsConfigure[CATEGORY_STUDY_PROCEDURES].entities[index].totalVisit})
              } else {
                return Object.assign(d, {selected: false, condition: [], totalVisit: 0})
              }
            }))
          } else {
            setFilteredLabs(response[CATEGORY_LABS].filter((d) => {
              return Object.assign(d, {selected: false, condition: [], totalVisit: 0})
            }))
            setFilteredExamination(response[CATEGORY_PHYSICAL_EXAMINATION].filter((d) => {
              return Object.assign(d, {selected: false, condition: [], totalVisit: 0})
            }))
            setFilteredProcedures(response[CATEGORY_PROCEDURES].filter((d) => {
              return Object.assign(d, {selected: false, condition: [], totalVisit: 0})
            }))
            setFilteredQuestionnaires(response[CATEGORY_QUESTIONNAIRES].filter((d) => {
              return Object.assign(d, {selected: false, condition: [], totalVisit: 0})
            }))
            setFilteredStudyProcedures(response[CATEGORY_STUDY_PROCEDURES].filter((d) => {
              return Object.assign(d, {selected: false, condition: [], totalVisit: 0})
            }))
          }
      }
    };
    getStandardEventsLib();
  }, []);

  const panelHeader = () => {
    return (
        <div className="event-panelHeader">
            <div>
                <div style={{fontWeight: 'bold', fontSize: '16px'}}><span>Impact</span></div>
            </div>
        </div>
    );
  };

  const eventLibHeader = (name, count, key) => {
    return (
      <Row className="section-header">
        <Col span={23}><span>{name}</span><span className="count-span">{count}</span></Col>
        <Col span={1}>{activeCollapse.indexOf(key) >= 0 ?(<MinusOutlined />):(<PlusOutlined />)}</Col>
      </Row>
    );
  };

  const burdenOption = {
    title : {
      text: 'Patient Burden',
      subtext: burdenSubTitle,
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
      show: showTooltip,
      trigger: 'axis',
      axisPointer: {
          type: 'shadow'
      }
    },
    grid: {
        left: '50%',
        right: '4%',
        top: '5%',
        bottom: '10%',
        containLabel: true
    },
    legend: {
        data: ['Patient Burden']
    },
    xAxis: [
        {
          type: 'category',
          name: 'Visit Number',
          data: burdenXAxis,
          nameLocation: "middle", 
          nameRotate: 0, nameGap: 20,
          axisTick: {
              alignWithLabel: true
          }
        }
    ],
    yAxis: [
        { type: 'value', name:'Patient Burden', 
        nameRotate: 90, nameGap: 40, nameLocation: "middle", 
        axisLine: { lineStyle: { color: '#333' } }, 
        axisLabel : { formatter : function(value) { return value; } }, }
    ],
    series: [
        {
            name: 'Patient Burder',
            type: 'bar',
            barWidth: '60%',
            color:'#ed7738',
            data: burdenData
        }
    ]
  };

  const costOption = {
    title : {
      text: 'Cost Per Patient',
      subtext: costSubTitle,
      x:'left',
      y:'top',
      textStyle: {
        fontSize: 14,
        fontWeight: 'bold'
      },
      subtextStyle: {
        fontSize: 12,
        fontWeight: 'normal'
      }
    },
    legend: {
      x:'left',
      y:'50/%',
      orient: 'vertical',
      itemHeight: 7,
      textStyle: {
        fontSize: 10
      },
      data: [CATEGORY_LABS, CATEGORY_PHYSICAL_EXAMINATION, CATEGORY_PROCEDURES, CATEGORY_QUESTIONNAIRES, CATEGORY_STUDY_PROCEDURES]
    },
    tooltip: {
      show: showTooltip,
      trigger: 'item',
      formatter: '{b} - ${c}',
      extraCssText:'background:#757373;color:white;font-size:8px'
    },
    series: [
      {
        type: 'pie',
        center: ['70%', '50%'],
        radius: ['50%', '80%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'center',
          formatter: function () {
            if(showPatientLabel){
              return patientRate
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
            GOOD: {
              color: 'green',
              fontSize: 8,
              fontWeight:'bold',
              backgroundColor: "white"
            },
            FAIR: {
              color: 'gray',
              fontSize: 8,
              fontWeight:'bold',
              backgroundColor: "white"
            },
            POOR: {
              color: '#c33232',
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
        color: patientChartColor,
        data: costData
      }
    ]
  };

  const handleEventChange = (event, newFlag) =>{
    switch (event.Categories.trim()) {
      case CATEGORY_LABS:     
        const tmpLabs = addedLabs.slice(0);
        if(newFlag){
          tmpLabs.push(event)
        } else {
          let index = addedLabs.findIndex((d) => d['Standard Event'] == event['Standard Event'])
          if(index > -1){
            tmpLabs.splice(index, 1, event)
          }
        }
        setAddedLabs(tmpLabs)
        break;
      
      case CATEGORY_PHYSICAL_EXAMINATION:    
        const tmpExamination = addedExamination.slice(0);
        if(newFlag){
          tmpExamination.push(event)
        } else {
          let index = addedExamination.findIndex((d) => d['Standard Event'] == event['Standard Event'])
          if(index > -1){
            tmpExamination.splice(index, 1, event)
          }
        }
        setAddedExamination(tmpExamination)
        break;
      
      case CATEGORY_PROCEDURES:       
        const tmpProcedures = addedProcedures.slice(0);
        if(newFlag){
          tmpProcedures.push(event)
        } else {
          let index = addedProcedures.findIndex((d) => d['Standard Event'] == event['Standard Event'])
          if(index > -1){
            tmpProcedures.splice(index, 1, event)
          }
        }
        setAddedProcedures(tmpProcedures)
        break;
      
       case CATEGORY_QUESTIONNAIRES:       
        const tmpQuestionnaires = addedQuestionnaires.slice(0);
        if(newFlag){
          tmpQuestionnaires.push(event)
        } else {
          let index = addedQuestionnaires.findIndex((d) => d['Standard Event'] == event['Standard Event'])
          if(index > -1){
            tmpQuestionnaires.splice(index, 1, event)
          }
        }
        setAddedQuestionnaires(tmpQuestionnaires)
        break;
      
       case CATEGORY_STUDY_PROCEDURES: 
       const tmpStudyProcedures = addedStudyProcedures.slice(0);
        if(newFlag){
          tmpStudyProcedures.push(event)
        } else {
          let index = addedStudyProcedures.findIndex((d) => d['Standard Event'] == event['Standard Event'])
          if(index > -1){
            tmpStudyProcedures.splice(index, 1, event)
          }
        }
        setAddedStudyProcedures(tmpStudyProcedures)
        break;
      
      default: break;
    }
  }

  const saveEvents = async (scheduleOfEvents) =>{
    console.log("save action")
    setPatientChartColor(aChartColors)
    setShowPatientLabel(true)
    setWeeks(scheduleOfEvents.Weeks)

    let tempBurdenData = []
    let tempBurdenXAxis = []
    for(var i =0; i< numbers.visitNumber; i ++){
      tempBurdenData.push(0)
      tempBurdenXAxis.push((i+1)+'')
    }

    for(const a in scheduleOfEvents[CATEGORY_LABS].entities) {
      if(scheduleOfEvents[CATEGORY_LABS].entities[a].condition.length > 0){
        for(let b = 0; b < scheduleOfEvents[CATEGORY_LABS].entities[a].condition.length; b ++){
          if(scheduleOfEvents[CATEGORY_LABS].entities[a].condition[b].checked){
            tempBurdenData[b] = tempBurdenData[b] + Number(scheduleOfEvents[CATEGORY_LABS].entities[a]['Dummy Cost'])
          }
        }
      }
    }

    for(const a in scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities) {
      if(scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].condition.length > 0){
        for(let b = 0; b < scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].condition.length; b ++){
          if(scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a].condition[b].checked){
            tempBurdenData[b] = tempBurdenData[b] + Number(scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].entities[a]['Dummy Cost'])
          }
        }
      }
    }

    for(const a in scheduleOfEvents[CATEGORY_PROCEDURES].entities) {
      if(scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].condition.length > 0){
        for(let b = 0; b < scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].condition.length; b ++){
          if(scheduleOfEvents[CATEGORY_PROCEDURES].entities[a].condition[b].checked){
            tempBurdenData[b] = tempBurdenData[b] + Number(scheduleOfEvents[CATEGORY_PROCEDURES].entities[a]['Dummy Cost'])
          }
        }
      }
    }

    for(const a in scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities) {
      if(scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].condition.length > 0){
        for(let b = 0; b < scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].condition.length; b ++){
          if(scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a].condition[b].checked){
            tempBurdenData[b] = tempBurdenData[b] + Number(scheduleOfEvents[CATEGORY_QUESTIONNAIRES].entities[a]['Dummy Cost'])
          }
        }
      }
    }

    for(const a in scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities) {
      if(scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].condition.length > 0){
        for(let b = 0; b < scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].condition.length; b ++){
          if(scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a].condition[b].checked){
            tempBurdenData[b] = tempBurdenData[b] + Number(scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].entities[a]['Dummy Cost'])
          }
        }
      }
    }

    let tempCostData = [
      {value: scheduleOfEvents[CATEGORY_LABS].totalCost, name: CATEGORY_LABS},
      {value: scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].totalCost, name: CATEGORY_PHYSICAL_EXAMINATION},
      {value: scheduleOfEvents[CATEGORY_PROCEDURES].totalCost, name: CATEGORY_PROCEDURES},
      {value: scheduleOfEvents[CATEGORY_QUESTIONNAIRES].totalCost, name: CATEGORY_QUESTIONNAIRES},
      {value: scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].totalCost, name: CATEGORY_STUDY_PROCEDURES}
    ]

    let totalCost = scheduleOfEvents[CATEGORY_LABS].totalCost + scheduleOfEvents[CATEGORY_PHYSICAL_EXAMINATION].totalCost
       + scheduleOfEvents[CATEGORY_PROCEDURES].totalCost + scheduleOfEvents[CATEGORY_QUESTIONNAIRES].totalCost
       + scheduleOfEvents[CATEGORY_STUDY_PROCEDURES].totalCost

    let costBreakdown = ''
    if(totalCost < 12826){
      costBreakdown = 'GOOD'
    } else if(totalCost < 15650){
      costBreakdown = 'FAIR'
    } else {
      costBreakdown = 'POOR'
    }
    setPatientRate('{p|$'+ formatCostAvg(totalCost, 1000) +'K}\n{' +costBreakdown+ '|' + costBreakdown + '}')
    setCostData(tempCostData)
    setCostSubTitle('Average from Similar Historical \nTrials - $' + formatCostAvg(totalCost, 5000) + 'K / Patient')
    setBurdenData(tempBurdenData)
    setBurdenXAxis(tempBurdenXAxis)
    setBurdenSubTitle('Average from similar Historical \nTrials - ' + formatBurdenAvg(totalCost, numbers.visitNumber))
    setShowTooltip(true)

    let newScenario = props.record.scenarios.find( i=> i['scenario_id'] == props.scenarioId)
    newScenario['Schedule of Events'] = Object.assign(scheduleOfEvents,{
      'TotalCost': formatCostAvg(totalCost, 1000),
      'CostRate': costBreakdown,
      'CostData': tempCostData,
      'CostAvg': formatCostAvg(totalCost, 5000),
      'BurdenData': tempBurdenData,
      'BurdenXAxis': tempBurdenXAxis,
      'BurdenAvg': formatBurdenAvg(totalCost, numbers.visitNumber)
    })

    const newScenarioList = props.record.scenarios.map((item, id) =>{
      if(item['scenario_id'] == props.scenarioId){
          return newScenario
      } else {
          return item
      }
    })

    let newTrial = props.record
    newTrial.scenarios = newScenarioList

    const resp = await updateStudy(newTrial)
    if (resp.statusCode == 200) {
      message.success('Save successfully')
    }
  }

  function formatCostAvg(totalCost, divisor){
    if(totalCost === 0){
      return 0
    } else {
      let avg = Math.ceil(totalCost/divisor*1000)
      return avg/1000
    }
  }
  function formatBurdenAvg(totalCost, divisor){
    if(totalCost === 0){
      return 0
    } else {
      let avg = Math.ceil(totalCost/divisor*100)
      return avg/100
    }
  }

  const callback = (key) => {
    setActiveCollapse(key)
  }

  const columns = [{
    title: 'Standard Event',
    dataIndex: 'Standard Event',
    key: 'Standard Event',
    width: '70%'
  }, {
    title: 'selected',
    dataIndex: 'selected',
    key: 'selected',
    width: '30%',
    render: (_, item) => {
      return item.selected ? (
        <div className="remove"><span onClick={(e)=> handleEvent(item)}>Remove</span></div>
      ) : (
        <div className="add"><span onClick={(e)=> handleEvent(item)}>Add</span></div>
      );
    }
  }]

  const handleEvent = (item) => {
    switch(item.Categories.trim()){
      case "Labs": 
        let index = filteredLabs.findIndex((d) => item['Standard Event'] == d['Standard Event'])
        const newData = [...filteredLabs]
        const newSelectedData = [...addedLabs]

        if(item.selected){
          newData.splice(index, 1, { ...item, ...{selected: false}});
          let selectedIndex = addedLabs.findIndex((d) => item['Standard Event'] == d['Standard Event'])
          newSelectedData.splice(selectedIndex, 1)
        } else {
          newData.splice(index, 1, { ...item, ...{selected: true}});
          newSelectedData.push(Object.assign(item, {selected: true}))
        }
        setFilteredLabs(newData)
        setAddedLabs(newSelectedData)
        break;

      case "Physical Examination": 
        let index2 = filteredExamination.findIndex((d) => item['Standard Event'] == d['Standard Event'])
        const newData2 = [...filteredExamination]
        const newSelectedData2 = [...addedExamination]

        if(item.selected){
          newData2.splice(index2, 1, { ...item, ...{selected: false}});
          let selectedIndex = addedExamination.findIndex((d) => item['Standard Event'] == d['Standard Event'])
          newSelectedData2.splice(selectedIndex, 1)
        } else {
          newData2.splice(index2, 1, { ...item, ...{selected: true}});
          newSelectedData2.push(Object.assign(item, {selected: true}))
        }
        setFilteredExamination(newData2)
        setAddedExamination(newSelectedData2)
        break;

      case "Procedures": 
        let index3 = filteredProcedures.findIndex((d) => item['Standard Event'] == d['Standard Event'])
        const newData3 = [...filteredProcedures]
        const newSelectedData3 = [...addedProcedures]

        if(item.selected){
          newData3.splice(index3, 1, { ...item, ...{selected: false}});
          let selectedIndex = addedProcedures.findIndex((d) => item['Standard Event'] == d['Standard Event'])
          newSelectedData3.splice(selectedIndex, 1)
        } else {
          newData3.splice(index3, 1, { ...item, ...{selected: true}});
          newSelectedData3.push(Object.assign(item, {selected: true}))
        }
        setFilteredProcedures(newData3)
        setAddedProcedures(newSelectedData3)
        break;

      case "Questionnaires": 
        let index4 = filteredQuestionnaires.findIndex((d) => item['Standard Event'] == d['Standard Event'])
        const newData4 = [...filteredQuestionnaires]
        const newSelectedData4 = [...addedQuestionnaires]

        if(item.selected){
          newData4.splice(index4, 1, { ...item, ...{selected: false}});
          let selectedIndex = addedQuestionnaires.findIndex((d) => item['Standard Event'] == d['Standard Event'])
          newSelectedData4.splice(selectedIndex, 1)
        } else {
          newData4.splice(index4, 1, { ...item, ...{selected: true}});
          newSelectedData4.push(Object.assign(item, {selected: true}))
        }
        setFilteredQuestionnaires(newData4)
        setAddedQuestionnaires(newSelectedData4)
        break;
      case "Study Procedures": 
        let index5 = filteredStudyProcedures.findIndex((d) => item['Standard Event'] == d['Standard Event'])
        const newData5 = [...filteredStudyProcedures]
        const newSelectedData5 = [...addedStudyProcedures]

        if(item.selected){
          newData5.splice(index5, 1, { ...item, ...{selected: false}});
          let selectedIndex = addedStudyProcedures.findIndex((d) => item['Standard Event'] == d['Standard Event'])
          newSelectedData5.splice(selectedIndex, 1)
        } else {
          newData5.splice(index5, 1, { ...item, ...{selected: true}});
          newSelectedData5.push(Object.assign(item, {selected: true}))
        }
        setFilteredStudyProcedures(newData5)
        setAddedStudyProcedures(newSelectedData5)
        break;
      default: break;
    }
  }

  const showConfigureModal = () =>{
    setShowConfigure(true)
  }

  const handleOk = () => {
    setShowConfigure(false)
    setHiddeTags(false)

    let tempBurdenXAxis = []
    for(var i =0; i< numbers.visitNumber; i ++){
      tempBurdenXAxis.push((i+1)+'')
    }
    setBurdenXAxis(tempBurdenXAxis)
  }

  const exportEvent = () =>{
    let str='Schedule of Events\n' + ',' + ',' + 'Visit'
    for(let i = 1; i <= numbers.visitNumber; i ++){
      str += ',' + i
    }

    str += '\n' + ',' + ',' + 'Week'
    for(let w = 0; w < weeks.length; w ++){
      str += ',' + weeks[w]
    }

    str += '\n' + ',' + ',' + 'Burden'
    for(let b = 0; b < burdenData.length; b ++){
      str += ',' + burdenData[b]
    }

    str += '\n' + 'Category' + ',Activity' + ',Cost'
    
    str += getEventContent(CATEGORY_LABS, addedLabs)
    str += getEventContent(CATEGORY_PHYSICAL_EXAMINATION, addedExamination)
    str += getEventContent(CATEGORY_PROCEDURES, addedProcedures)
    str += getEventContent(CATEGORY_QUESTIONNAIRES, addedQuestionnaires)
    str += getEventContent(CATEGORY_STUDY_PROCEDURES, addedStudyProcedures)

    let exportContent = "\uFEFF";
      let blob = new Blob([exportContent + str], {
        type: "text/plain;charset=utf-8"
      });
  
      const date = Date().split(" ");
      const dateStr = date[1] + '_' + date[2] + '_' + date[3] + '_' + date[4];
      FileSaver.saveAs(blob, `SoA_${dateStr}.csv`);
  }

  function getEventContent(catrgory, events) {
    console.log(catrgory)
    let subStr = ''
    for(const event in events){
      console.log(event)
      subStr += '\n' + catrgory + ',"' + events[event]['Standard Event'] + '",' + events[event]['Dummy Cost']
      if(events[event]['condition'].length > 0){
        for(const idx in events[event]['condition']){
          console.log(idx)
          subStr += ',' + (events[event]['condition'][idx].checked ? 'x' : '')
        }
      }
    }
    return subStr
  }

  return (
    <div className="tab-container">
      <div className={`side-toolbar ${eventLib > 0 ? 'hidden' : ''}`} onClick={()=> setEventLib(6)}>
        <div className="panel-label">Event Library</div>
        <div className="icon">&nbsp;<ArrowRightOutlined />&nbsp;</div>
      </div>
      <Row>
        <Col span={eventLib} className="event-left-container">
          <Row style={{backgroundColor: '#f3f3f3'}}>
            <Col span={24}>
              <div className="item-header">
                <Row>
                  <Col span={21}>
                    <span>Event Library</span>
                  </Col>
                  <Col span={3}>
                  <Tooltip title={'Collapse Event Library'}>
                    <CloseOutlined className="right-icon" onClick={() => setEventLib(0)}></CloseOutlined>
                  </Tooltip>
                  </Col>
                </Row>
                
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
                    <span>Select / Unselect events from library</span>
                  </div>
                </Col>
                <Col span={8} style={{textAlign:'right', paddingRight:'10px', fontSize:'14px'}}>
                  <Row>
                  <Col span={24}><span>EVENT FREQUENCY</span></Col>
                  </Row>
                  <Row style={{width:'100%'}}>
                  <Col span={24}>
                    <div id="freqModal" ref={null}>
                      <span className="label">
                        80%-100%
                      </span>
                      <EditFilled />
                    </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                <Collapse className="eventLib" collapsible="header" onChange={callback} activeKey={activeCollapse}>
                  <Panel showArrow={false} header={eventLibHeader(CATEGORY_LABS, filteredLabs.length, "1")} key="1">
                    <Table dataSource={filteredLabs} columns={columns} pagination={false} showHeader={false} 
                      locale={{emptyText: ''}} rowKey={record => record['Standard Event']}/>
                  </Panel>
                </Collapse>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                <Collapse className="eventLib" collapsible="header" onChange={callback} activeKey={activeCollapse}>
                  <Panel showArrow={false} header={eventLibHeader(CATEGORY_PHYSICAL_EXAMINATION, filteredExamination.length, "2")} key="2">
                    <Table dataSource={filteredExamination} columns={columns} pagination={false} showHeader={false} 
                      locale={{emptyText: ''}} rowKey={record => record['Standard Event']}/>
                  </Panel>
                </Collapse>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                <Collapse className="eventLib" collapsible="header" onChange={callback} activeKey={activeCollapse}>
                  <Panel showArrow={false} header={eventLibHeader(CATEGORY_PROCEDURES, filteredProcedures.length, "3")} key="3">
                    <Table dataSource={filteredProcedures} columns={columns} pagination={false} showHeader={false} 
                      locale={{emptyText: ''}} rowKey={record => record['Standard Event']}/>
                  </Panel>
                </Collapse>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                <Collapse className="eventLib" collapsible="header" onChange={callback} activeKey={activeCollapse}>
                  <Panel showArrow={false} header={eventLibHeader(CATEGORY_QUESTIONNAIRES, filteredQuestionnaires.length, "4")} key="4">
                    <Table dataSource={filteredQuestionnaires} columns={columns} pagination={false} showHeader={false} 
                      locale={{emptyText: ''}} rowKey={record => record['Standard Event']}/>
                  </Panel>
                </Collapse>
                </Col>
              </Row>
              <Row className="event-section">
                <Col span={24}>
                <Collapse className="eventLib" collapsible="header" onChange={callback} activeKey={activeCollapse}>
                  <Panel showArrow={false} header={eventLibHeader(CATEGORY_STUDY_PROCEDURES, filteredStudyProcedures.length, "5")} key="5">
                    <Table dataSource={filteredStudyProcedures} columns={columns} pagination={false} showHeader={false} 
                      locale={{emptyText: ''}} rowKey={record => record['Standard Event']}/>
                  </Panel>
                </Collapse>
                </Col>
              </Row>
            </Col>
            <Col flex="none">
              <div style={{ padding: '0 10px' }}></div>
            </Col>
          </Row>
        </Col>
        <Col span={24 - eventLib} className="event-right-container">
          <div style={{ padding: '10px 20px 0px 20px' }}>
            <Row>
              <Col span={24}><span className="title">Schedule of Events</span></Col>
            </Row>
            <Spin spinning={showConfigure}>
            <Row>
              <Col span={11}>
                <span className="tip1-desc">
                  Use the historical event library on the left to build the Schedule of Events.
                </span>
              </Col>
              <Col span={4} className={`${hiddeTags ? 'hidde' : ''}`}>
                <span className="tip1-desc none-click">
                Number of Visits <InputNumber size="small" value={numbers.visitNumber} />
                </span>
              </Col>
              <Col span={6} className={`center ${hiddeTags ? 'hidde' : ''}`}>
                <span className="tip1-desc center none-click">
                  Number of Weeks <InputNumber size="small" value={numbers.weekNumber} />&nbsp;
                </span>
                <EditFilled className="edit-icon" onClick={showConfigureModal}/>
              </Col>
              <Col span={3} className={`${hiddeTags ? 'hidde' : ''}`}>
                <Dropdown.Button style={{zIndex: 1}} size="small"
                  overlay={
                    <Menu>
                      <Menu.Item key="csv" onClick={exportEvent}>CSV</Menu.Item>
                    </Menu>
                  }
                  icon={<DownOutlined />}>
                  <DownloadOutlined />
                  EXPORT AS
                </Dropdown.Button>
              </Col>

              <Col span={24} className={`${hiddeTags ? 'hidde' : ''}`}>
              <Collapse defaultActiveKey={['1']} onChange={excluCallback} expandIconPosition="right" className="event-chart">
                <Panel header={panelHeader()} key="1">
                  <Row>
                    <Col span={12}>
                      <ReactECharts option={costOption} style={{ height: 140}}/>
                      <div style={{paddingLeft: '50%'}}>
                        <span>Click on each metrics to filter</span>
                      </div>
                    </Col>
                    <Col span={12}>
                      <ReactECharts option={burdenOption} style={{ height: 150}}/>
                    </Col>
                  </Row>
                </Panel>
              </Collapse>
              </Col>

              <Col span={24} style={{height: '25px'}}></Col>

              <Col span={24}>
                <div className="event-dashboard-container">
                    <EventList
                      saveEvents={saveEvents}
                      handleEventChange={handleEventChange}
                      numbers={numbers}
                      labs={addedLabs}
                      examination={addedExamination}
                      procedures={addedProcedures}
                      questionnaire={addedQuestionnaires}
                      studyProcedures={addedStudyProcedures}
                    />
                </div>
              </Col>
            </Row>
            </Spin>
        </div>
        </Col>
      </Row>

      <Modal visible={showConfigure} title="" closable={false} mask={false}
        footer={null} style={{ left: '12%', top:200 }} centered={false} > 
        <Row style={{justifyContent: 'center'}}>
         <span style={{fontSize: 16, fontWeight: 'bold'}}>Configure Schedule Of Events Table</span>
        </Row>
        <br/>
        <Row style={{justifyContent: 'center'}}>
         <span >Aliquam faucibus, odio nec commodo aliquam, neque felis placerat dui, a porta ante lectus dapibus</span>
        </Row>
        <br/>
        <Row className="modal-filed">
          <Col span={12} className="label"><span>Number of Visits</span></Col>
          <Col span={12} className="input-number"><InputNumber min={1} step={1} onStep={onStepVisit} value={numbers.visitNumber} /></Col>
        </Row>
        <Row className="modal-filed">
          <Col span={12} className="label"><span>Number of Weeks</span></Col>
          <Col span={12} className="input-number"><InputNumber min={1} step={1} onStep={onStepWeek} value={numbers.weekNumber} /></Col>
        </Row>
        <Row style={{justifyContent: 'center', paddingTop: '20px'}}>
          <Button type="primary" className="step-btn" onClick={handleOk}>CREATE</Button>
        </Row>
      </Modal>
    </div>
  );
};

export default ScheduleEvents;
