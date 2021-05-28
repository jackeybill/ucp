import React, { useState, useEffect } from "react";
import { withRouter } from "react-router";
import { Button, Drawer, Table, Spin, message } from "antd";
import { connect } from "react-redux";
import * as fileActions from "../../actions/file.js";
import { LoadingOutlined } from '@ant-design/icons';
import UplodZone from "../../components/UploadZone";

import { getOverviewList,extractText } from "../../utils/ajax-proxy";
import "./index.scss";

interface dataProps {
  ntcID?: string;
  protocolName?: string;
  status?: string;
  lastUpdate?: string;
  key?: string;
}

const columns = [
    // {
    //   title: "NCT ID",
    //   dataIndex: "ntcID",
    //   key: "ntcID",
    // },
    {
      title: "Protocol Name",
      dataIndex: "protocolName",
      key: "protocolName",
    },
    {
      title: "Validation Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Last Updated",
      dataIndex: "lastUpdate",
      key: "lastUpdate",
    },
  ];

const Overview = (props: any) => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fethData = async () => {
      setLoading(true)
      const resp = await getOverviewList();
      setLoading(false)
      if (resp.statusCode == 200) {
        const respData = JSON.parse(resp.body)
        const tmpData = respData.length>0 && respData.map((d,idx) => {
          let obj: dataProps = {};
          obj.protocolName = d["file_name"];
          // obj.ntcID = d.ntc_id||"";
          obj.key = idx; 
          obj.status = d.status||"Not started";
          obj.lastUpdate = d.lastUpdate||"";
          return obj;
        });
        setData(tmpData);
      }
    };
    fethData();
  }, []);

  const showDrawer = () => {
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
  };
  const handleRowClick = async (record) => {
    setLoading(true)
    const filepath = `iso-service-dev/RawDocuments/${record.protocolName}`
    const resp = await extractText(filepath)
    setLoading(false)
    if (resp.statusCode == 200) {  
      props.readFile({
        file: JSON.parse(resp.body)
      })
       props.history.push("/protocol-sections");
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
              x
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
            {/* Discard Upload */}
          </span>
          {/* <Button
            type="primary"
            onClick={() => props.history.push("/protocol-sections")}
          >
            Start Extraction
          </Button> */}
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

