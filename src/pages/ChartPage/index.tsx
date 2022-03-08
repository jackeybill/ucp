import React, { useState, useEffect } from "react";
import { withRouter } from "react-router";
import {  Spin } from "antd";
import { connect } from "react-redux";
import * as fileActions from "../../actions/file.js";
import { LoadingOutlined } from '@ant-design/icons';

import { getOverviewList } from "../../utils/ajax-proxy";
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
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const resp = await getOverviewList();
      setLoading(false)
      if (resp.statusCode == 200) {
        const respData = JSON.parse(resp.body)
        console.log(respData);
        const tmpData = respData.length>0 && respData.map((d,idx) => {
          let obj: dataProps = {};
          obj.protocolName = d.protocolName||d["file_name"];
          obj.fileName = d["file_name"] ||""
          obj.nctID = d.nctID||"";
          obj.key = idx; 
          obj.status = d.status||"Not started";
          obj.lastUpdate = d.lastUpdate||"";
          return obj;
        });
        setData(tmpData);
      }
    };
    fetchData();
  }, []);

  

  return (
    <>
      <div className="chart__container">
        <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24,color:'#d04a02' }} spin />} >
            <div className="top">
              <div className="left">
                <div className="chart__wrapper total_study">1</div>
                <div className="chart__wrapper total_sponsor">1</div>
                <div className="chart__wrapper total_document">1</div>
              </div>
              <div className="middle">
                <div className="chart__wrapper indication">1</div>
              </div>
              <div className="right">
                <div className="chart__wrapper study_phases">1</div>
                <div className="chart__wrapper study_type">1</div>
              </div>
            </div>
            <div className="below">
              <div className="chart__wrapper study_sponsor">1</div>
              <div className="chart__wrapper study_location">1</div>
              <div className="chart__wrapper study_status">1</div>
              <div className="chart__wrapper study_date">1</div>
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

