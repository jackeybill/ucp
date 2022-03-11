import React, { useState, useEffect } from "react";
import { withRouter } from "react-router";
import {  Spin, Statistic } from "antd";
import { connect } from "react-redux";
import * as fileActions from "../../actions/file.js";
import { LoadingOutlined } from '@ant-design/icons';
import ReactECharts from "echarts-for-react";
import moment from 'moment';

import { getSummaryChart } from "../../utils/ajax-proxy";
import "./index.scss";

interface dataProps {
  nctID?: string;
  protocolName?: string;
  fileName?: string;
  status?: string;
  lastUpdate?: string;
  key?: string;
}

const ChartPage = (props: any) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false)

  const lightBlueColor = [
    "#2564DF",
    "#399DEF",
    "#58ADF2",
    "#B5DBF8",
    "#E1F1FD"
  ]

  const darkBlueColor = [
    "#1162B4",
    "#6090C2",
    "#89AACB",
    "#C0D3E5",
    "#E1F1FD"
  ]

  const locationColor = [
    "#1162B4",
    "#6090C2",
    "#89AACB",
    "#5D86E2",
    "#80C4F5",
    "#B5DBF8",
    "#C0D3E5",
    "#E1F1FD"
  ]

  const PurpleColor = [
    "#544F95",
    "#6E6AA2",
    "#8885AF",
    "#A4A2BE",
    "#BFBECC"
  ]

  const sponsorPhaseColor = [
    "#1162B4",
    "#FFDCA9",
    "#571F01",
    "#2C8646",
    "#8885AF",
    "#58ADF2",
    "#B5DBF8",
  ]

  const dummay_chart_data = {
    total_study: {
      count: 217440,
      // 注意字符串内日期格式，年月日用‘-’相连
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
    const fetchData = async () => {
      setLoading(true)
      const resp = await getSummaryChart();
      setLoading(false)
      console.log(JSON.parse(resp));
      
      // if (resp.statusCode == 200) {
      //   const respData = JSON.parse(resp.body)
      //   const tmpData = respData.length>0 && respData.map((d,idx) => {
      //     let obj: dataProps = {};
      //     obj.protocolName = d.protocolName||d["file_name"];
         
      //     return obj;
      //   });
      //   setData(tmpData);
      // }
    };
    fetchData();
  }, []);

  const indicationOption = {
    legend: {
      show: false,
      top: '5%',
      left: 'center'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '80%'],
        center: ['45%', '60%'],
        avoidLabelOverlap: false,
        color:lightBlueColor,
        cursor:"auto",
        emphasis: {
          scale: true,
          scaleSize: 1
        },
        labelLine: {
          lineStyle: {color:'#2D2D2D'},
          length: 0,
          length2: 80,
        },
        data: dummay_chart_data.study_indication
      }
    ]
  };
  const phaseOption = {
    legend: {
      top: '10%',
      left: '55%',
      orient: 'vertical',
    },
    series: [
      {
        name: 'Access From',
        type: 'pie',
        radius: ['30%', '50%'],
        center: ['25%', '30%'],
        avoidLabelOverlap: false,
        color:lightBlueColor,
        labelLine: {
          show: false
        },
        label: {
          show: false,
        },
        data: dummay_chart_data.study_phase
      }
    ]
  };
  const typeOption = {
    legend: {
      top: '10%',
      left: '55%',
      orient: 'vertical',
    },
    series: [
      {
        name: 'Access From',
        type: 'pie',
        radius: ['30%', '50%'],
        center: ['25%', '30%'],
        avoidLabelOverlap: false,
        color:darkBlueColor,
        labelLine: {
          show: false
        },
        label: {
          show: false,
        },
        data: dummay_chart_data.study_type
      }
    ]
  };
  const statusOption = {
    legend: {
      top: '30%',
      left: '65%',
      orient: 'vertical',
    },
    series: [
      {
        name: 'Access From',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['30%', '50%'],
        avoidLabelOverlap: false,
        color:PurpleColor,
        labelLine: {
          show: false
        },
        label: {
          show: false,
        },
        data: dummay_chart_data.study_status
      }
    ]
  };

  const sponsorOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        // Use axis to trigger tooltip
        type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
      }
    },
    legend: {},
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: ['Eli Lily', 'Mayo clinic', 'GSK', 'Merck', 'Pfizer', 'Astra Zeneca'],
    },
    series: [
      {
        name: 'Phase 0',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: [320, 302, 301, 334, 390, 330]
      },
      {
        name: 'Phase 1',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: [120, 132, 101, 134, 90, 230]
      },
      {
        name: 'Phase 2',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: [220, 182, 191, 234, 290, 330]
      },
      {
        name: 'Phase 3',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: [150, 212, 201, 154, 190, 330]
      },
      {
        name: 'Phase 4',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: [820, 832, 901, 934, 1290, 1330]
      }
    ]
  };
  
  const dateOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        // Use axis to trigger tooltip
        type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
      }
    },
    legend: {},
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    yAxis: {
      type: 'value'
    },
    xAxis: {
      type: 'category',
      data: ['2015', '2016', '2017', '2018', '2019', '2020', '2021']
    },
    series: [
      {
        name: 'Phase 0',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: [320, 302, 301, 334, 390, 330, 320]
      },
      {
        name: 'Phase 1',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: [120, 132, 101, 134, 90, 230, 210]
      },
      {
        name: 'Phase 2',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: [220, 182, 191, 234, 290, 330, 310]
      },
      {
        name: 'Phase 3',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: [150, 212, 201, 154, 190, 330, 410]
      },
      {
        name: 'Phase 4',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: [820, 832, 901, 934, 1290, 1330, 1320]
      }
    ]
  };
  
  

  return (
    <>
      <div className="chart__container">
        <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24,color:'#d04a02' }} spin />} >
            <div className="top">
              <div className="left">
                <div className="chart__wrapper total_study">
                  <div className="title">TOTAL NO. OF STUDIES</div>
                  <div className="content">
                    <Statistic title="" value={217440} valueStyle={{fontSize:42, color:'#1162B4', fontWeight: 600}}/>
                    <span style={{color:'#999999', fontSize:14}}>Last updated - {moment(new Date('2022-3-7 8:8:8')).subtract('days').fromNow()}</span>
                  </div>
                </div>
                <div className="chart__wrapper total_sponsor">
                  <div className="title">TOTAL NO. OF SPONSORS</div>
                  <div className="content">
                    <Statistic title="" value={20345} valueStyle={{fontSize:42, color:'#333333', fontWeight: 600}}/>
                  </div>
                </div>
                <div className="chart__wrapper total_document">
                  <div className="title">TOTAL NO. OF CLINICAL DOCUMENTS</div>
                  <div className="content">
                    <Statistic title="" value={18123} valueStyle={{fontSize:42, color:'#333333', fontWeight: 600}}/>
                  </div>
                </div>
              </div>
              <div className="middle">
                <div className="chart__wrapper indication">
                  <div className="title">STUDIES BY INDICATION</div>
                  <div className="content">
                    <ReactECharts option={indicationOption} style={{height: 350}}/>
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
                  <div className="title">STUDIES BY SPONSOR</div>
                  <div className="content">
                    <ReactECharts option={sponsorOption} style={{}}/>
                  </div>
              </div>
              <div className="chart__wrapper study_location">
                  <div className="title">STUDIES BY LOCATION</div>
                  <div className="content"></div>
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

