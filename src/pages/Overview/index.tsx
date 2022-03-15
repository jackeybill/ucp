import React, { useState, useEffect } from "react";
import { withRouter } from "react-router";
import { Button, Drawer, Table, Spin, message, Tooltip } from "antd";
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
      sorter: (a, b) => a.nctID.substr(4,7) - b.nctID.substr(4,7),
      render: (text, row, index) => {
        return (
          <>
            <span className="nct_id_column">{text}</span>
          </>
        );   
      }
    },
    {
      title: "Protocol Name",
      dataIndex: "protocolName",
      key: "protocolName",
      sorter: (a, b) => a.protocolName.length - b.protocolName.length,
      ellipsis: {
        showTitle: false,
      },
      width: "700px",
      render: (text, row, index) => {
        if (text.length>98) {
          return (
            <Tooltip placement="topLeft" title={text} overlayStyle={{minWidth:690}}>
              {text}
            </Tooltip>
          );  
        } 
        else {
          return (
            <span>{text}</span>
          );  
        }
      }
    },
    {
      title: "Validation Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => {
        let numA;
        let numB;
        if (a.status==="Not started") {
           numA = 10
        } else if (a.status==="In progress") {
           numA = 20
        } else {
           numA = 30
        }
        if (b.status==="Not started") {
           numB = 10
        } else if (b.status==="In progress") {
           numB = 20
        } else {
           numB = 30
        }        
        return numA - numB
      },
      width: "164px",
      render: (text, row, index) => {
        return (
          <div className="status_column">
            {showStatusCircle(text)}
            <span>{text}</span>
          </div>
        );   
      }
    },
    {
      title: "Last Updated",
      dataIndex: "lastUpdate",
      key: "lastUpdate",
      defaultSortOrder: 'descend' as 'descend',
      sorter: (a, b) => { 
          let aTime = new Date(a.lastUpdate).getTime();
          let bTime = new Date(b.lastUpdate).getTime();
          return aTime - bTime;
      },
      render: (text, row, index) => {
        return (
          <>
            <span className="update_column">{moment(text).format('MM-DD-YYYY')}</span>
          </>
        )
      },
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
    // remove File_Path
    // const filepath = `${record.fileName}`
    const filepath = `iso-service-dev/RawDocuments/${record.fileName}`
    let begin = 0
    let resp = ""
    while (begin >= 0) {
      const respbegin = await extractText(filepath, begin)
      begin = respbegin.begin
      resp += respbegin.body
    }
    
    setLoading(false)

     props.readFile({
      file: JSON.parse(resp)
    })
    
     props.history.push({
       pathname: "/protocol-sections",
       state: {
         status: record.status,
         title: record.protocolName? record.protocolName: record.fileName
       }
     });
    // if (resp.statusCode == 200) {  
     
    // } else {
    //   message.error(resp.errorType)
    // }
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
            showSorterTooltip={false}
            pagination={{ position: ["bottomRight"], size: "small", pageSize: 6 }}
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
            disabled={props.fileReader.disabledButton}
            onClick={() => {
              props.history.push({
              pathname: "/protocol-sections",
              state: {
                status: "Not started",
                title: props.fileReader.protocolName !== ""? props.fileReader.protocolName: props.fileReader.fileName
              }
            })
            props.readFile({
              disabledButton:true
            });
          }}
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

