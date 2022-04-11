import React, { useState, useEffect } from "react";
import { withRouter } from "react-router";
import {  Spin, Statistic, Modal, Button, Select  } from "antd";
import { connect } from "react-redux";
import * as fileActions from "../../actions/file.js";
import { LoadingOutlined } from '@ant-design/icons';
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import moment from 'moment';
import geoJson from "../../assets/world.json"

import { getSummaryChart } from "../../utils/ajax-proxy";
import "./index.scss";

const { Option } = Select;

const ChartPage = (props: any) => {
  const [chartData, setChartData] = useState({aragements:{study_phase:[]},study_indication: [], study_date:{phases: [], data: []},study_locaiton:[],study_phase:[],study_sponsor:{phases: [], data: []},study_sponsor_top10:{phases: [], data: []},study_status:[],study_type:[],total_document:{count:0},total_sponsor:{count:0},total_study:{count: 0, date: ""}});
  const [loading, setLoading] = useState(false)
  const [sponsorSeriesData, setSponsorSeriesData] = useState([])
  const [sponsorSeriesDataTopTen, setSponsorSeriesDataTopTen] = useState([])
  const [dateSeriesData, setDateSeriesData] = useState([])

  const [visible, setVisible] = useState(false);
  const [sponsorVisible, setSponsorVisible] = useState(false);

  const [phase, setPhase] = useState("All");
  const [area, setArea] = useState("All");

  echarts.registerMap("world", (geoJson) as any);


  const Therapeutic_Area_Map = [
    "All",
    "Endocrinology",
    // "Breast Ptosis",
    // "Portosystemic Collateral Veins",
    // "Cerebral Cavernous Hemangioma",
    // "Impacted Stones",
    // "Laparoscopic Gastric Banding",
    // "Respiratory Infection Other",
    // "Prostatectomy",
    // "Stable Angina (SA)",
    // "Cervical Lymphadenopathy",
    // "Neoplasms/Therapy",
    // "Obese Patients With Prostate Cancer Disease",
    // "Spinal Degenerative Disorder",
    // "OVCA",
    // "Viral Infections After HSCT",
    // "Peripheral Post-surgical Neuropathic Pain",
    // "Degenerative; Dementia",
    // "Diabetes Mellitus in Pregnancy",
    // "Malignant Primary Brain Tumors",
    // "Stable (MSS) Colon Cancer",
    // "Sentinel Lymph Node Biopsy",
    // "Invasive Mycosis",
    // "Laryngeal Cancer Stage III",
    // "Neuromuscular Blockade Reversal Agent",
    // "Cost Per Patient Rate",
    // "Determination of Death",
    // "Brainstem Glioma, Pediatric",
    // "Procedural Skill Competency",
    // "Invasive Cancer",
    ]

  const raw_phase = ["All",...chartData.aragements.study_phase]
  const phase_options = raw_phase||["All"]

  const lightBlueColor = [
    "#004992",
    "#005DBB",
    "#0682FF",
    "#168AFF",
    "#2692FF",
    "#379AFF",
    "#47A2FF",
    "#57ABFF",
    "#68B3FF",
    "#78BBFF",
    "#88C3FF",
    "#99CBFF",
    "#A9D3FF",
    "#B9DCFE",
    "#EAF4FF",
    // "#2564DF",
    // "#399DEF",
    // "#58ADF2",
    // "#B5DBF8",
    // "#E1F1FD"
  ]

  const lightBlueColorTopTen = [
    "#004992",
    "#0682FF",
    "#2692FF",
    "#47A2FF",
    "#68B3FF",
    "#88C3FF",
    "#99CBFF",
    "#A9D3FF",
    "#B9DCFE",
    "#EAF4FF",
  ]

  const studyPhaseColor = [
  // "#1192E8",
  // "#33B1FF",
  // "#82CFFF",
  // "#BAE6FF",
  // "#E5F6FF"
    "#0682FF",
    "#2692FF",
    "#47A2FF",
    "#68B3FF",
    "#88C3FF",
    "#B9DCFE",
    "#EAF4FF",
  ]

  const studyTypeColor = [
    "#009D9A",
    "#08BDBA",
    "#3DDBD9",
    "#9EF0F0",
    "#D9FBFB"
  ]

  const darkBlueColor = [
    "#1162B4",
    "#6090C2",
    "#89AACB",
    "#C0D3E5",
    "#E1F1FD"
  ]

  const locationColor = [
    // "#1162B4",
    // "#6090C2",
    // "#89AACB",
    // "#5D86E2",
    // "#80C4F5",
    // "#B5DBF8",
    // "#C0D3E5",
    // "#E1F1FD"
    "#491D8B",
    "#6929C4",
    "#8A3FFC",
    "#A56EFF",
    "#BE95FF",
    "#D4BBFF",
    "#E8DAFF",
    "#F6F2FF",
    // "#ECECEC",
  ]

  const PurpleColor = [
    "#544F95",
    "#6E6AA2",
    "#8885AF",
    "#A4A2BE",
    "#BFBECC"
  ]

  const sponsorPhaseColor = [
    // "#1192E8",
    // "#33B1FF",
    // "#82CFFF",
    // "#BAE6FF",
    // "#E5F6FF",
    "#0682FF",
    "#2692FF",
    "#47A2FF",
    "#68B3FF",
    "#88C3FF",
    "#B9DCFE",
    "#EAF4FF",
  ]

  const dummay_chart_data = {
    total_study: {
      count: 217440,
      date: '2022-3-7 8:8:8',
    },
    total_sponsor: {
      count: 20345,
    },
    total_document: {
      count: 18123,
    },
    study_indication: [
      { value: 3500, name: "Type 2 Diabetes" },
      { value: 1500, name: "Alzheimer's" },
      { value: 1500, name: "Obesity" },
      { value: 1500, name: "NASH" },
      { value: 2000, name: "Oncology" }
    ],
    study_phase: [
      { value: 260, name: "Phase 0" },
      { value: 320, name: "Phase 1" },
      { value: 240, name: "Phase 2" },
      { value: 100, name: "Phase 3" },
      { value: 90, name: "Phase 4" },
    ],
    study_type: [
      { value: 3200, name: "Observational" },
      { value: 2400, name: "Interventional" },
      { value: 1000, name: "Patient Regist..." },
    ],
    study_sponsor:{
      phases:['Eli Lily', 'Mayo clinic', 'GSK', 'Merck', 'Pfizer', 'Astra Zeneca'],
      data: [ {
        name: 'Phase 0',
        data: [320, 302, 301, 334, 390, 330]
      },
      {
        name: 'Phase 1',
        data: [120, 132, 101, 134, 90, 230]
      },
      {
        name: 'Phase 2',
        data: [220, 182, 191, 234, 290, 330]
      },
      {
        name: 'Phase 3',
        data: [150, 212, 201, 154, 190, 330]
      },]
    },
    study_locaiton:[
      { name: 'Alabama', value: 4822023 },
      { name: 'Alaska', value: 731449 },
      { name: 'Arizona', value: 6553255 },
      { name: 'Arkansas', value: 2949131 },
      { name: 'Louisiana', value: 4601893 },
      { name: 'Maine', value: 1329192 },
      { name: 'Maryland', value: 5884563 }],
    study_status: [
      { value: 260, name: "Not yet recruiting" },
      { value: 320, name: "Recruiting" },
      { value: 240, name: "Completed" },
      { value: 100, name: "Active" },
      { value: 90, name: "Withheld" },
    ],
    study_date: {
      phases:['2015', '2016', '2017', '2018', '2019', '2020'],
      data: [ {
        name: 'Phase 0',
        data: [320, 302, 301, 334, 390, 330]
      },
      {
        name: 'Phase 1',
        data: [120, 132, 101, 134, 90, 230]
      },
      {
        name: 'Phase 2',
        data: [220, 182, 191, 234, 290, 330]
      },
      {
        name: 'Phase 3',
        data: [150, 212, 201, 154, 190, 330]
      },]
    }
  }

  useEffect(() => {
    fetchData('','');
  }, []);

  const fetchData = async (therapeutic_area,study_phase) => {
    setLoading(true)
    const resp = await getSummaryChart(therapeutic_area,study_phase);
    setLoading(false)
    console.log(resp);
    if (resp.study_indication.length > 0) {
      setChartData(resp);

      let tempSponsorSeries = resp.study_sponsor.data.map((item, index, arr)=>{
        return  {
          name: Object.keys(item)[0],
          type: 'bar',
          stack: 'total',
          label: {
            show: false
          },
          emphasis: {
            focus: 'series'
          },
          data: Object.values(item)[0],
          barMaxWidth: 24,
        }
      })
      setSponsorSeriesData(tempSponsorSeries)

      if(resp.study_sponsor_top10){
        let tempSponsorSeriesTopTen = resp.study_sponsor_top10.data.map((item, index, arr)=>{
          return  {
            name: Object.keys(item)[0],
            type: 'bar',
            stack: 'total',
            label: {
              show: false
            },
            emphasis: {
              focus: 'series'
            },
            data: Object.values(item)[0],
            barMaxWidth: 24,
          }
        })
        setSponsorSeriesDataTopTen(tempSponsorSeriesTopTen)
      } else {
        setSponsorSeriesDataTopTen(tempSponsorSeries)
      }

      let totalNum = []
      for (let i=0; i < resp.study_date.phases.length; i++) {
        let sum = 0  
        resp.study_date.data.forEach((item,index,arr)=>{          
          sum = sum + Object.values(item)[0][i]
        })
        totalNum[i] = sum
      } 
      
      let tempDateSeries = resp.study_date.data.map((item, index, arr)=>{
        let dateLength = resp.study_date.data.length
        if (index < dateLength - 1) {
          return  {
            name: Object.keys(item)[0],
            type: 'bar',
            stack: 'total',
            label: {
              show: false
            },
            emphasis: {
              focus: 'series'
            },
            data: Object.values(item)[0],
            barMaxWidth:12,
            borderRadius: [10, 10, 0, 0],
          }
        } else {
          return {
            name:  Object.keys(item)[0],
            type: 'bar',
            stack: 'total',
            label: {
              show: true, 
              position: 'top',
              formatter: function (params) {
                return totalNum[params.dataIndex]
              },
              textStyle: { color: '#000' }
            },
            emphasis: {
              focus: 'series'
            },
            data: Object.values(item)[0],
            barMaxWidth:12,
            borderRadius: [10, 10, 0, 0],
          }
        }
        
      })
      setDateSeriesData(tempDateSeries)
    }
  };

  const handlePhaseChange = (value) => {
    setPhase(value);
    console.log(value);
    if(value==='All'){
      fetchData('','')
    } else {
      fetchData('', value)
    }
  };
  const handleAreaChange = (value) => {
    setArea(value);
    console.log(value);
  };

  const indicationOption = {
    legend: {
      show: false,
      top: '5%',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter:function(data){
        return `${data.name}: `+`${data.percent.toFixed(1)}%`
      },
    },
    series: [
      {
        type: 'pie',
        emphasis: {
          scaleSize: 1,
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold'
          }
        },
        radius: ['40%', '80%'],
        center: ['45%', '60%'],
        avoidLabelOverlap: true,
        color:lightBlueColor,
        labelLine: {
          lineStyle: {color:'#999999'},
          length: 0,
          length2: 40,
        },
        label:{
          alignTo: 'labelLine',
          formatter:function(data){
            return `{a|${data.name}}`+'\n'+ `{b|${data.percent.toFixed(1)}%}`
          },
          rich: {
              a: {
                  color: '#2D2D2D',
              },
              b: {
                  color:'#9E9E9E'
              }
          }
        },
        data: chartData.study_indication
      }
    ]
  };

  const indicationOptionForTen = {
    legend: {
      show: false,
      top: '5%',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter:function(data){
        return `${data.name}: `+`${data.percent.toFixed(1)}%`
      },
    },
    series: [
      {
        type: 'pie',
        emphasis: {
          scaleSize: 1,
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold'
          }
        },
        radius: ['40%', '80%'],
        center: ['45%', '60%'],
        avoidLabelOverlap: true,
        color:lightBlueColorTopTen,
        labelLine: {
          lineStyle: {color:'#999999'},
          length: 0,
          length2: 40,
        },
        label:{
          alignTo: 'labelLine',
          formatter:function(data){
            return `{a|${data.name}}`+'\n'+ `{b|${data.percent.toFixed(1)}%}`
          },
          rich: {
              a: {
                  color: '#2D2D2D',
              },
              b: {
                  color:'#9E9E9E'
              }
          }
        },
        data: chartData.study_indication.sort((a,b)=>{
          return b.value -a.value
        }).slice(0,10)
      }
    ]
  };

  const phaseOption = {
    legend: {
      top: '10%',
      left: '55%',
      orient: 'vertical',
      itemHeight:12,
      itemWidth:12,
      selectedMode:false,
      icon:'rect'
    },
    tooltip: {
      trigger: 'item',
      formatter:function(data){
        return `${data.name}: `+`${data.percent.toFixed(0)}%`
      }
    },
    series: [
      {
        type: 'pie',
        emphasis: {
          scaleSize: 1,
        },
        radius: ['30%', '50%'],
        center: ['25%', '30%'],
        avoidLabelOverlap: false,
        color:studyPhaseColor,
        labelLine: {
          show: false
        },
        label: {
          position: 'inner',
          fontSize: 10,
          formatter:function(data){
            return `${data.percent.toFixed(0)}%`
          },
        },
        data: chartData.study_phase
      }
    ]
  };
  const typeOption = {
    legend: {
      top: '10%',
      left: '55%',
      orient: 'vertical',
      itemHeight:12,
      itemWidth:12,
      selectedMode:false,
      icon:'rect'
    },
    tooltip: {
      trigger: 'item',
      formatter:function(data){
        return `${data.name}: `+`${data.percent.toFixed(0)}%`
      }
    },
    series: [
      {
        type: 'pie',
        emphasis: {
          scaleSize: 1,
        },
        radius: ['30%', '50%'],
        center: ['25%', '30%'],
        avoidLabelOverlap: false,
        color:studyTypeColor,
        labelLine: {
          show: false
        },
        label: {
          position: 'inner',
          fontSize: 10,
          formatter:function(data){
            return `${data.percent.toFixed(0)}%`
          },
        },
        data: chartData.study_type
      }
    ]
  };
  const statusOption = {
    legend: {
      top: '30%',
      left: '65%',
      orient: 'vertical',
      itemHeight:12,
      itemWidth:12,
      selectedMode:false,
      icon:'rect'
    },
    tooltip: {
      trigger: 'item',
      formatter:function(data){
        return `${data.name}: `+`${data.percent.toFixed(0)}%`
      }
    },
    series: [
      {
        type: 'pie',
        emphasis: {
          scaleSize: 1,
        },
        radius: ['45%', '70%'],
        center: ['30%', '50%'],
        avoidLabelOverlap: false,
        color:PurpleColor,
        labelLine: {
          show: false
        },
        label: {
          position: 'inner',
          fontSize: 12,
          formatter:function(data){
            return `${data.percent.toFixed(0)}%`
          },
        },
        data: chartData.study_status
      }
    ]
  };

  const sponsorOption = {
    title: {
      subtext: 'Phases',
      subtextStyle: {
        color: '#2D2D2D'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        // Use axis to trigger tooltip
        type: 'shadow'
      }
    },
    color:sponsorPhaseColor,
    legend: {
      top: 10,
      left: 50,
      itemHeight:12,
      itemWidth:12,
      selectedMode:false,
      icon:'rect'
    },
    grid: {
      left: '3%',
      right: '4%',
      // bottom: '3%',
      height: 7000,
      containLabel: true
    },
    xAxis: [{
      type: 'value'
    }],
    yAxis: [{
      type: 'category',
      data: chartData.study_sponsor.phases,
      axisLabel: {
        width: 150,
        overflow: "truncate"
      }
    }],
    series: sponsorSeriesData
  };

  const sponsorOptionForTen = {
    title: {
      subtext: 'Phases',
      subtextStyle: {
        color: '#2D2D2D'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        // Use axis to trigger tooltip
        type: 'shadow'
      }
    },
    color:sponsorPhaseColor,
    legend: {
      top: 10,
      left: 50,
      itemHeight:12,
      itemWidth:12,
      selectedMode:false,
      icon:'rect'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [{
      type: 'value'
    }],
    yAxis: [{
      type: 'category',
      data: chartData.study_sponsor_top10?chartData.study_sponsor_top10.phases:chartData.study_sponsor.phases, 
      // data: chartData.study_sponsor.phases, 
      axisLabel: {
        width: 150,
        overflow: "truncate"
      }
    }],
    series: sponsorSeriesDataTopTen
  };

  const dateOption = {
    title: {
      subtext: 'Phases',
      subtextStyle: {
        color: '#2D2D2D'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        // Use axis to trigger tooltip
        type: 'shadow'
      }
    },
    legend: {
      top: 10,
      left: 50,
      itemHeight:12,
      itemWidth:12,
      selectedMode:false,
      icon:'rect'
    },
    color:sponsorPhaseColor,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    yAxis: {
      type: 'value',
    },
    xAxis: {
      type: 'category',
      data: chartData.study_date.phases
    },
    series: dateSeriesData
  };

  const locationOption = {
  tooltip : {
      trigger: 'item',
      // formatter:'{b}<br/>{c}',
      // formatter : function (params) {
      //     var value = (params.value + '').split('.');
      //     value = value[0].replace(/(\d{1,3})(?=(?:\d{3})+(?!\d))/g, '$1,')
      //             + '.' + value[1];
      //     return params.seriesName + '<br/>' + params.name + ' : ' + value;
      // }
  },
  dataRange: {
      show: false,
      min: 0,
      max: 20,
      text:['High','Low'],
      realtime: false,
      calculable : true,
      color: locationColor
  },
  series : [
      {
          type: 'map',
          name: 'Location',
          mapType: 'world',
          roam: false,
          zoom: 1.2,
          mapLocation: {
              y : 60
          },
          itemStyle:{
              borderColor:'#fff'
          },
          emphasis:{
            label:{
              show:false
            },
            itemStyle:{
              areaColor:'#999',
            }
          },
          data:chartData.study_locaiton,
          nameMap:{}
      }
  ]
  }
  
  return (
    <>
      <div className="chart__container">
        <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24,color:'#d04a02' }} spin />} >
            <div className="header">
            <div className="selector-item">
                <label>THERAPEUTIC AREAS</label> <br />
                <Select
                  defaultValue="All"
                  value={area}
                  showSearch
                  style={{ width: 200 }}
                  onChange={handleAreaChange}
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {Therapeutic_Area_Map.map((o) => {
                    return (
                      <Option value={o} key={o}>
                        {o}
                      </Option>
                    );
                  })}
                </Select>
              </div>
              <div className="selector-item space">
                <label> PHASES</label>
                <br />
                <Select
                  value={phase}
                  defaultValue="All"
                  style={{ width: 200 }}
                  onChange={handlePhaseChange}
                >
                  {phase_options.map((o) => {
                    return (
                      <Option value={o} key={o}>
                        {o}
                      </Option>
                    );
                  })}
                </Select>
              </div>
            </div>
            <div className="top">
              <div className="left">
                <div className="chart__wrapper total_study">
                  <div className="title">TOTAL NO. OF STUDIES</div>
                  <div className="content">
                    <Statistic title="" value={chartData.total_study.count} valueStyle={{fontSize:42, color:'#1162B4', fontWeight: 600}}/>
                    <span style={{color:'#999999', fontSize:14}}>Last updated - {moment(new Date(chartData.total_study.date)).subtract('days').fromNow()}</span>
                  </div>
                </div>
                <div className="chart__wrapper total_sponsor">
                  <div className="title">TOTAL NO. OF SPONSORS</div>
                  <div className="content">
                    <Statistic title="" value={chartData.total_sponsor.count} valueStyle={{fontSize:42, color:'#333333', fontWeight: 600}}/>
                  </div>
                </div>
                <div className="chart__wrapper total_document">
                  <div className="title">TOTAL NO. OF CLINICAL DOCUMENTS</div>
                  <div className="content">
                    <Statistic title="" value={chartData.total_document.count} valueStyle={{fontSize:42, color:'#333333', fontWeight: 600}}/>
                  </div>
                </div>
              </div>
              <div className="middle">
                <div className="chart__wrapper indication">
                  <div className="title">STUDIES BY INDICATION</div>
                  <div className="showMore newLine">
                    <span>Showing 10 of {chartData.study_indication.length} Records. </span> 
                    <span className="link" onClick={() => setVisible(true)}>Click here</span>
                    <span> for more details.</span>
                  </div>
                  <div className="content">
                    <ReactECharts option={indicationOptionForTen} style={{height: 360}}/>
                  </div>
                </div>
              </div>
              <div className="right">
                <div className="chart__wrapper study_phases">
                  <div className="title">STUDIES BY PHASES</div>
                  <div className="content">
                    <ReactECharts option={phaseOption} style={{height: 300}}/>
                  </div>
                </div>
                <div className="chart__wrapper study_type">
                  <div className="title">STUDIES BY TYPE</div>
                  <div className="content">
                    <ReactECharts option={typeOption} style={{height: 300}}/>
                  </div>
                </div>
              </div>
            </div>
            <div className="below">
              <div className="chart__wrapper study_sponsor">
                  <div className="title">
                    STUDIES BY SPONSOR
                    <span className="showMore right">
                      <span>Showing 10 of {chartData.study_sponsor.phases.length} Records. </span> 
                      <span className="link" onClick={() => setSponsorVisible(true)}>Click here</span>
                      <span> for more details.</span>
                    </span>
                  </div>
                  <div className="content">
                    <ReactECharts option={sponsorOptionForTen} style={{}}/>
                  </div>
              </div>
              <div className="chart__wrapper study_location">
                  <div className="title">STUDIES BY LOCATION</div>
                  <div className="content">
                    <ReactECharts option={locationOption} style={{}}/>
                  </div>
              </div>
              <div className="chart__wrapper study_status">
                  <div className="title">STUDIES BY STATUS</div>
                  <div className="content">
                    <ReactECharts option={statusOption} style={{}}/>
                  </div>
              </div>
              <div className="chart__wrapper study_date">
                  <div className="title">STUDIES BY START DATE</div>
                  <div className="content">
                    <ReactECharts option={dateOption} style={{}}/>
                  </div>
              </div>
            </div>
        </Spin>
        <Modal
          centered
          visible={visible}
          onCancel={() => setVisible(false)}
          footer={null}
          width={1094}
        >
          <div className="chart__wrapper indication">
            <div className="title" style={{color:'#999999', fontSize: 16, fontWeight: 600}}>STUDIES BY INDICATION</div>
            <div className="showMore newLine">
              <span style={{color:'#999999'}}>Showing {chartData.study_indication.length} Records. </span> 
            </div>
            <div className="content">
              <ReactECharts option={indicationOption} style={{height: 360}}/>
            </div>
          </div>
        </Modal>
        <Modal
          centered
          visible={sponsorVisible}
          onCancel={() => setSponsorVisible(false)}
          footer={null}
          width={1094}
        >
          <div className="chart__wrapper study_sponsor" style={{height: 590}}>
              <div className="title" >
                <span style={{color:'#999999', fontSize: 16, fontWeight: 600}}>STUDIES BY SPONSOR</span>
              </div>
              <div className="showMore newLine">
              <span style={{color:'#999999'}}>Showing {chartData.study_sponsor.phases.length} Records. </span> 
            </div>
              <div className="content" style={{height: 500, overflowY: 'scroll'}}>
                <ReactECharts option={sponsorOption} style={{height: 7000}}/>
              </div>
          </div>
        </Modal>
      </div>
    </>
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
)(withRouter(ChartPage));

