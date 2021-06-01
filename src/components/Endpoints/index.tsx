import React,{useState, useEffect} from "react";
import { Tabs, Radio, Space, Input, Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";

import "./index.scss";

const { TabPane } = Tabs;

const Endpoits = (props:any) => {
    const { onInput } = props
    const [primary, setPrimary] = useState([])
    const [secondary, setSecondary] = useState([])
    const [tertiary, setTertiary] = useState([])

    const handleChange = (key, e) => {
        const val = e.target.value
        // if (key == 'primary') setPrimary(val)
        // if (key == 'secondary') setSecondary(val)
        // if (key == 'tertiary') setTertiary(val)
        

    };
    const handleAdd = () => {
        
    }

  return (
    <div className="add-endpoints-cotainer">
      <Tabs tabPosition="left">
        <TabPane
          tab={
            <div>
              <span>Primary Endpoints</span>
              <span>10</span>
            </div>
          }
          key="1"
        >
          <div className="endpoints">
            <div className="add-endpoint">
                <Input style={{ width: 200, height: 30 }} onChange={(e)=>handleChange ("primary",e)}/>
              <Button type="primary" onClick={handleAdd}>Add</Button>
            </div>
            <div className="endpoint-list">
              <div className="list-item">
                <span>#333333</span>

                <CloseOutlined />
              </div>
              <div className="list-item">
                <span>#333333</span>

                <CloseOutlined />
              </div>
            </div>
          </div>
        </TabPane>
        <TabPane
          tab={
            <div>
              <span>Secondary Endpoints</span>
              <span>10</span>
            </div>
          }
          key="2"
        >
          <div className="endpoints">
            <div className="add-endpoint">
              <Input style={{ width: 200, height: 30 }} onChange={(e)=>handleChange("secondary",e)}/>
              <Button type="primary">Add</Button>
            </div>
            <div className="endpoint-list">
              <div className="list-item">
                <span>#333333</span>

                <CloseOutlined />
              </div>
              <div className="list-item">
                <span>#333333</span>
                <CloseOutlined />
              </div>
            </div>
          </div>
        </TabPane>
        <TabPane
          tab={
            <div>
              <span>Tertiary / Exploratory Endpoints</span>
              <span>10</span>
            </div>
          }
          key="3"
        >
          <div className="endpoints">
            <div className="add-endpoint">
              <Input style={{ width: 200, height: 30 }} onChange={(e)=>handleChange("tertiary",e)}/>
              <Button type="primary">Add</Button>
            </div>
            <div className="endpoint-list">
              <div className="list-item">
                <span>#333333</span>

                <CloseOutlined />
              </div>
              <div className="list-item">
                <span>#333333</span>

                <CloseOutlined />
              </div>
            </div>
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Endpoits;
