import React, { useState, useEffect } from "react";
import { withRouter } from "react-router";
import { Button, Drawer, Table, Spin, message } from "antd";
import { connect } from "react-redux";
import * as fileActions from "../../actions/file.js";
import { LoadingOutlined, CloseOutlined } from '@ant-design/icons';
import UplodZone from "../../components/UploadZone";
import moment from 'moment';

import { getOverviewList, extractText } from "../../utils/ajax-proxy";
import "./index.scss";

interface dataProps {
  nctID?: string;
  protocolName?: string;
  fileName?: string;
  status?: string;
  lastUpdate?: string;
  key?: string;
}

const columns = [
    {
      title: "NCT ID",
      dataIndex: "nctID",
      key: "nctID",
    },
    {
      title: "Protocol Name",
      dataIndex: "protocolName",
      key: "protocolName",
    },
    {
      title: "Validation Status",
      dataIndex: "status",
      key: "status",
      render: (text, row, index) => {
        return (
          <>
            {showStatusCircle(text)}
            <span>{text}</span>
          </>
        );   
      }
    },
    {
      title: "Last Updated",
      dataIndex: "lastUpdate",
      key: "lastUpdate",
      render: (text, row, index) => {
        return moment(text).format('MM-DD-YYYY');   
      }
    },
  ];

  const showStatusCircle = (text) => {
    if(text.toLowerCase().includes("complete")) {
      return <span className="status_circle complete_status"></span>
    } else if(text.toLowerCase().includes("progress")) {
      return <span className="status_circle inprogress_status"></span>
    } else {
      return <span className="status_circle"></span>
    }
  }

const Overview = (props: any) => {
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

  const showDrawer = () => {
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
  };

  const handleRowClick = async (record) => {
    setLoading(true)
    console.log(record);
    
    const filepath = `iso-service-dev/RawDocuments/${record.fileName}`
    const resp = await extractText(filepath)
    setLoading(false)
    if (resp.statusCode == 200) {  
      props.readFile({
        file: JSON.parse(resp.body)
      })
       props.history.push({
         pathname: "/protocol-sections",
         state: {
           status: record.status,
           title: record.protocolName? record.protocolName: record.fileName
         }
       });
    } else {
      message.error(resp.errorType)
    }
  }

  return (
    <>
      <div className="overview__container">
        <div className="top">
          <div className="title">Overview</div>
          <Button
            type="primary"
            className="upload__files-btn"
            onClick={showDrawer}
          >
            Data Upload
          </Button>
        </div>
        <div className="table__section">
          <div className="table__section_title">My Protocols</div>
          <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24,color:'#d04a02' }} spin />} >
          <Table
            columns={columns}
            dataSource={data}
            pagination={{ position: ["bottomRight"], size: "small" }}
              onRow={
                record => {
                  return {
                    onClick:()=>handleRowClick(record)
                  }
              }
            }
            />
          </Spin>
        </div>
      </div>

      <Drawer
        className="upload-drawer"
        title={
          <div className="upload-drawer-title">
            <span className="title">Protocol Reader - Data Upload</span>
            <span className="close-icon" onClick={onClose}>
              <CloseOutlined />
            </span>
          </div>
        }
        placement="right"
        closable={false}
        onClose={onClose}
        visible={visible}
      >
        <div className="upload-zone-section">
          <UplodZone/>
        </div>
        
        <div className="drawer-actions">
          <span className="discard" onClick={onClose}>
            {/* DISCARD UPLOAD */}
          </span>
          <Button
            type="primary"
            onClick={() => props.history.push("/protocol-sections")}
          >
            START EXTRACTION
          </Button>
        </div>
      </Drawer>
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
)(withRouter(Overview));

