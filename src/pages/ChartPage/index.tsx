import React, { useState, useEffect } from "react";
import { withRouter } from "react-router";
import {  Spin, Statistic } from "antd";
import { connect } from "react-redux";
import * as fileActions from "../../actions/file.js";
import { LoadingOutlined } from '@ant-design/icons';
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


  const dummay_chart_data = {
    total_study: {
      count: 217440,
      date: '2022-3-7 8:8:8',
    },
    total_sponsor: {
      count: 20345,
    },
    total_document: {
      count:18123,
    },
    study_indication: [
      { value: 3500, name: "Type 2 Diabetes" },
      { value: 1500, name: "Alzheimer's" },
      { value: 1500, name: "Obesity" },
      { value: 1500, name: "NASH" },
      { value: 2000, name: "Oncology" }
    ]

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

  const studyIndicationOption = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      top: '5%',
      left: 'center'
    },
    series: [
      {
        name: 'Access From',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '40',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: dummay_chart_data.study_indication
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
                    
                  </div>
                </div>
              </div>
              <div className="right">
                <div className="chart__wrapper study_phases">
                  <div className="title">STUDIES BY PHASES</div>
                  <div className="content"></div>
                </div>
                <div className="chart__wrapper study_type">
                  <div className="title">STUDIES BY TYPE</div>
                  <div className="content"></div>
                </div>
              </div>
            </div>
            <div className="below">
              <div className="chart__wrapper study_sponsor">
                  <div className="title">STUDIES BY SPONSOR</div>
                  <div className="content"></div>
              </div>
              <div className="chart__wrapper study_location">
                  <div className="title">STUDIES BY LOCATION</div>
                  <div className="content"></div>
              </div>
              <div className="chart__wrapper study_status">
                  <div className="title">STUDIES BY STATUS</div>
                  <div className="content"></div>
              </div>
              <div className="chart__wrapper study_date">
                  <div className="title">STUDIES BY START DATE</div>
                  <div className="content"></div>
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

