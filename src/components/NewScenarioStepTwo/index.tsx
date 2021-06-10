import React, { useState, useEffect} from 'react';
import jsPDF from "jspdf";
// import "jspdf-autotable";
import html2canvas from 'html2canvas'
import FileSaver from 'file-saver'
import {Button, Collapse, Divider, Slider, Dropdown,Menu, Modal, Table, Row, Col, Tabs, Tooltip} from "antd";
import {getSummaryDefaultList, addScenario, listStudy} from "../../utils/ajax-proxy";
import {withRouter } from 'react-router';
import {HistoryOutlined, CloseOutlined, EditFilled, DownOutlined,DownloadOutlined} from "@ant-design/icons";
import "./index.scss";

import CriteriaOption from "../CriteriaOption";
import CustomChart from "../CustomChart";
import EditTable from "../../components/EditTable";
import SelectableTable from "../../components/SelectableTable";

const { Panel } = Collapse;
const { TabPane } = Tabs;

const step1 = 'Scenario';
const step2 = 'Criteria';
const step3 = 'Schedule';
const frequencyFilter = [2, 10]

let demographicsElements = [];
let interventionElements = [];
let medConditionElements = [];
let labTestElements = [];

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

const NewScenarioStepTwo = (props) => {
    const [defaultActiveTabKey, setDefaultActiveTabKey] = useState<string>('1')
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
    const [showHistorical, setShowHistorical] = useState(false)
    const [historicalTrialdata, setHistoricalTrialdata] = useState([])
    const [protocolRateData, setProtocolRateData] = useState(defaultChartValue)
    const [screenRateData, setScreenRateData] = useState(defaultChartValue)
    const [therapeutic_Amend_Avg, setTherapeutic_Amend_Avg] = useState('Therapeutic Area Average - 0%')
    const [therapeutic_Screen_Avg, setTherapeutic_Screen_Avg] = useState('Therapeutic Area Average - 0%')

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

    const resp = await addScenario(props.record);
    console.log(props.record)
    if (resp.statusCode == 200) {
      var currentScenario = resp.body.scenarios[resp.body.scenarios.length - 1]
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
      }

      if(activeKey.indexOf("1") < 0){
        setRollHeight(false)
        setActiveKey(['1'])
      }
    }
}

function formatNumber (str){
  if(str == undefined || str == ''){
    return 0
  } else {
    return Number(str.substr(0, str.lastIndexOf('%')))
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

    setDefaultActiveKey([''])
}

useEffect(() => {
    const summaryDefaultList = async () => {
        const resp = await getSummaryDefaultList();

        if (resp.statusCode == 200) {
            const response = JSON.parse(resp.body)
            console.log(response)
            // setInclusionCriteria(response[0].InclusionCriteria)
            // setExclusionCriteria(response[1].ExclusionCriteria)

            const inclusionCriteria = response[0].InclusionCriteria
            
            for(var i = 0; i < inclusionCriteria.length; i ++){
                if(getCatorgoryIndex(i, inclusionCriteria) == 0){
                    setOriginMedCondition(inclusionCriteria[i]['Medical Condition'])
                    setMedCondition(inclusionCriteria[i]['Medical Condition'].filter((d) => {
                        return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
                    }))
                } else if(getCatorgoryIndex(i, inclusionCriteria) == 1){ 
                    setOriginDemographics(inclusionCriteria[i]['Demographics'])
                    setDemographics(inclusionCriteria[i]['Demographics'].filter((d) => {
                        return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
                    }))
                } else if(getCatorgoryIndex(i, inclusionCriteria) == 2){
                    setOriginLabTest(inclusionCriteria[i]['Lab/Test'])
                    setLabTest(inclusionCriteria[i]['Lab/Test'].filter((d) => {
                        return d.Frequency * 100 >= minValue && d.Frequency * 100 <= maxValue;
                    }))
                } else if(getCatorgoryIndex(i, inclusionCriteria) == 3){
                    setOriginIntervention(inclusionCriteria[i]['Intervention'])
                    setIntervention(inclusionCriteria[i]['Intervention'].filter((d) => {
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
    } else if(list[index]['Intervention'] != undefined){
        return 3;
    }
}

function callback(key) {
    if(key.indexOf("1") < 0){
        setRollHeight(true)
    } else {
        setRollHeight(false)
    }
    // setDefaultActiveKey(key)
    setActiveKey(key)
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
            data: screenRateData
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
        case 2: 
            demographicsElements = newData
            console.log(demographicsElements)
            break;
        case 3:
            medConditionElements = newData
            console.log(medConditionElements)
            break;
        case 4:
            interventionElements = newData
            console.log(interventionElements)
            break;
        default:
            labTestElements = newData
            console.log(labTestElements)
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
    console.log("export josn file:" +filename)
};

const csvExport = async () => {
    let str='';
    str += 'Eligibility Criteria' + ',' + 'Values' + ',' + 'Timeframe' + ',' + 'Condition Or Exception';
  
    str += '\n'+'Demographics(' +demographicsElements.length+')'
    for(const a in demographicsElements) {
      str += '\n' + demographicsElements[a]['Eligibility Criteria'] + ',' + demographicsElements[a].Values + 
        ',' + demographicsElements[a].Timeframe + ',' + demographicsElements[a]['Condition Or Exception']
      if(demographicsElements[a].subCriteria != undefined){
        const subCriteria = demographicsElements[a].subCriteria
        for(const aa in subCriteria){
          str += '\n' + '----' + subCriteria[aa].subCriteria[aa]['Eligibility Criteria'] + ',' + subCriteria[aa].Values + 
          ',' + subCriteria[aa].Timeframe
        }
      }
    }

    str += '\n\n'+'Medical Condition(' +medConditionElements.length+')'
    for(const b in medConditionElements) {
      str += '\n' + medConditionElements[b]['Eligibility Criteria'] + ',' + medConditionElements[b].Values + 
        ',' + medConditionElements[b].Timeframe + ',' + medConditionElements[b]['Condition Or Exception']
      if(medConditionElements[b].subCriteria != undefined){
        const subCriteria = medConditionElements[b].subCriteria
        for(const aa in subCriteria){
          str += '\n' + '----' + subCriteria[aa].subCriteria[aa]['Eligibility Criteria'] + ',' + subCriteria[aa].Values + 
          ',' + subCriteria[aa].Timeframe
        }
      }
    }

    str += '\n\n'+'Intervention(' +interventionElements.length+')'
    for(const c in interventionElements) {
      str += '\n' + interventionElements[c]['Eligibility Criteria'] + ',' + interventionElements[c].Values + 
        ',' + interventionElements[c].Timeframe + ',' + interventionElements[c]['Condition Or Exception']
      if(interventionElements[c].subCriteria != undefined){
        const subCriteria = interventionElements[c].subCriteria
        for(const aa in subCriteria){
          str += '\n' + '----' + subCriteria[aa].subCriteria[aa]['Eligibility Criteria'] + ',' + subCriteria[aa].Values + 
          ',' + subCriteria[aa].Timeframe
        }
      }
    }

    str += '\n\n'+'Lab / Test(' +labTestElements.length+')'
    for(const d in labTestElements) {
      str += '\n' + labTestElements[d]['Eligibility Criteria'] + ',' + labTestElements[d].Values + 
        ',' + labTestElements[d].Timeframe + ',' + labTestElements[d]['Condition Or Exception']
      if(labTestElements[d].subCriteria != undefined){
        const subCriteria = labTestElements[d].subCriteria
        for(const aa in subCriteria){
          str += '\n' + '----' + subCriteria[aa].subCriteria[aa]['Eligibility Criteria'] + ',' + subCriteria[aa].Values + 
          ',' + subCriteria[aa].Timeframe
        }
      }
    }

    let exportContent = "\uFEFF";
    let blob = new Blob([exportContent + str], {
      type: "text/plain;charset=utf-8"
    });

    const date = Date().split(" ");
    const dateStr = date[1] + '_' + date[2] + '_' + date[3] + '_' + date[4];
    FileSaver.saveAs(blob, `Inclusion_Criteria_${dateStr}.csv`);
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
        jsonExport(props.record, "Scenario");
    }
    
}

const searchHistoricalTrials = async () => {
    if(historicalTrialdata.length == 0){
    const resp = await listStudy();
    if (resp.statusCode == 200) {
      setHistoricalTrialdata(JSON.parse(resp.body))
      setShowHistorical(true)
    }
  } else {
    setShowHistorical(true)
  }
  
}

const handleOk = () => {
  setShowHistorical(false)
}

const handleCancel = () => {
  setShowHistorical(false)
}

    

    return (
      <div className="ie-container">
        <div className="export-container">
          <Row>
            <Col span={21}>
              <div style={{ bottom: '0',height: '50px' }}></div>
            </Col>
            <Col span={3}>
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
            </Col>
          </Row>
        </div>
        <div className="tab-container">
          <Tabs defaultActiveKey={defaultActiveTabKey} centered>
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
                        <Button className="update-btn" onClick={updateTrial}>
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
                                    option={screenFailureOption}
                                    height={120}
                                  ></CustomChart>
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
                            <Button type="primary" onClick={saveInclusionCriteria}>
                              Save
                            </Button>
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
                                  <div className="col-item">Eligibility Criteria</div>
                                  <div className="col-item">Values</div>
                                  <div className="col-item">Timeframe</div>
                                </div>
                              </div>
                              <div className="sectionPanel">
                              <EditTable updateIclusionCriteria={updateIclusionCriteria} tableIndex={2} 
                                      data={demographicsElements} defaultActiveKey={defaultActiveKey}
                                      collapsible={collapsible} panelHeader={"Demographics"}/>
                              <EditTable updateIclusionCriteria={updateIclusionCriteria} tableIndex={3} 
                                      data={medConditionElements} defaultActiveKey={defaultActiveKey}
                                      collapsible={collapsible} panelHeader={"Medical Condition"}/>
                              <EditTable updateIclusionCriteria={updateIclusionCriteria} tableIndex={4} 
                                      data={interventionElements} defaultActiveKey={defaultActiveKey}
                                      collapsible={collapsible} panelHeader={"Intervention"}/>
                              <EditTable updateIclusionCriteria={updateIclusionCriteria} tableIndex={5} 
                                      data={labTestElements} defaultActiveKey={defaultActiveKey}
                                      collapsible={collapsible} panelHeader={"Lab / Test"}/>
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
            <TabPane tab="Exclusion Criteria" key="2">
              Content of Tab Pane 2
            </TabPane>
            <TabPane tab="Enrollment Feasibility" key="3">
              Content of Tab Pane 3
            </TabPane>
          </Tabs>
        </div>

        <Modal visible={showHistorical} title="Historical Trial List" onOk={handleOk} onCancel={handleCancel}
          footer={null} style={{ left: '20%', top:50 }} centered={false} width={200} > 
          <Row>
              <Col span={24}><SelectableTable dataList={historicalTrialdata} /></Col>
          </Row>
        </Modal>
      </div>
      
    );
    
}


export default withRouter(NewScenarioStepTwo);