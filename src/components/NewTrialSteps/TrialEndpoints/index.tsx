import React, { useState, useEffect } from "react";
import { Tabs, Radio, Space, Input, Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { connect } from "react-redux";
import * as createActions from "../../../actions/createTrial.js";

import "./index.scss";


const TrialEndpoits = (props: any) => {
  const [primary, setPrimary] = useState(props.newTrial.primary_endpoints);
  const [secondary, setSecondary] = useState(props.newTrial.secondary_endpoints);
  const [tertiary, setTertiary] = useState(props.newTrial.tertiary_endpoints);
  const [primaryValue, setPrimaryValue] = useState("");
  const [secondaryValue, setSecondaryValue] = useState("");
  const [tertiaryValue, setTertiaryValue] = useState("");

  const handleChange = (key, e) => {
    const val = e.target.value;
    if (key == "primary") setPrimaryValue(val);
    if (key == "secondary") setSecondaryValue(val);
    if (key == "tertiary") setTertiaryValue(val);
  };

  const handleAdd = (key) => {
    if (key == "primary") {
      const tmp = primary.slice(0);
      tmp.push(primaryValue);
      setPrimary(tmp);
      props.createTrial({
        primary_endpoints:tmp,
      })
    } else if (key == "secondary") {
      const tmp = secondary.slice(0);
      tmp.push(secondaryValue);
      setSecondary(tmp);
      props.createTrial({
        secondary_endpoints: tmp,    
      })
    } else if (key == "tertiary") {
      const tmp = tertiary.slice(0);
      tmp.push(tertiaryValue);
      setTertiary(tmp);
      props.createTrial({ 
        tertiary_endpoints:tmp
      })
    }
  };

  const handleRemove = (key, idx) => {
    if (key == "primary") {
      const tmp = primary.slice(0);
      tmp.splice(idx, 1);
      setPrimary(tmp);
       props.createTrial({
        primary_endpoints:tmp,
      })
    } else if (key == "secondary") {
      const tmp = secondary.slice(0);
      tmp.splice(idx, 1);
      setSecondary(tmp);
      props.createTrial({
        secondary_endpoints: tmp,    
      })
    } else if (key == "tertiary") {
      const tmp = tertiary.slice(0);
      tmp.splice(idx, 1);
      setTertiary(tmp);
      props.createTrial({ 
        tertiary_endpoints:tmp
      })
    }
  };

  return (
    <div className="trial-endpoints-cotainer">
      <div className="endpoints-item">
        <div className="add-box">
          <span className="endpoint-title">
            Primary Endpoints <i className={`count count-icon ${primary.length>0?"active-count":"inactive-count"}`}>{primary.length}</i>
          </span>
          <div className="add-endpoint">
            <Input
              allowClear
              placeholder="Add Trial Endpoints"
              value={primaryValue}
              style={{ width: 200, height: 30 }}
              onChange={(e) => handleChange("primary", e)}
              
            />
            <Button type="primary" onClick={() => handleAdd("primary")}>
              Add
            </Button>
          </div>
        </div>

        <div className="endpoint-list">
          {primary.map((p, idx) => {
            return (
              <div className="list-item" key={idx}>
                <span>{p}</span>
                <CloseOutlined onClick={() => handleRemove("primary", idx)} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="endpoints-item">
        <div className="add-box">
          <span className="endpoint-title">
            Secondary Endpoints <i className={`count count-icon ${secondary.length>0?"active-count":"inactive-count"}`}>{secondary.length}</i>
          </span>
          <div className="add-endpoint">
            <Input
              allowClear
              placeholder="Add Trial Endpoints"
              value={secondaryValue}
              style={{ width: 200, height: 30 }}
              onChange={(e) => handleChange("secondary", e)}
            />
            <Button type="primary" onClick={() => handleAdd("secondary")}>
              Add
            </Button>
          </div>
        </div>

        <div className="endpoint-list">
          {secondary.map((s, idx) => {
            return (
              <div className="list-item" key={idx}>
                <span>{s}</span>
                <CloseOutlined onClick={() => handleRemove("secondary", idx)} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="endpoints-item">
        <div className="add-box">
          <span className="endpoint-title">
            Tertiary/Exploratory Endpoints
            <i className={`count count-icon ${tertiary.length>0?"active-count":"inactive-count"}`}>{tertiary.length}</i>
          </span>
          <div className="add-endpoint">
            <Input
              allowClear
              placeholder="Add Trial Endpoints"
              value={tertiaryValue}
              style={{ width: 200, height: 30 }}
              onChange={(e) => handleChange("tertiary", e)}
            />
            <Button type="primary" onClick={() => handleAdd("tertiary")}>
              Add
            </Button>
          </div>
        </div>

        <div className="endpoint-list">
          {tertiary.map((t, idx) => {
            return (
              <div className="list-item" key={idx}>
                <span>{t}</span>
                <CloseOutlined onClick={() => handleRemove("tertiary", idx)} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


const mapDispatchToProps = (dispatch) => ({
  createTrial: (val) => dispatch(createActions.createTrial(val)),
});

const mapStateToProps = (state) => ({
  newTrial: state.trialReducer,

});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TrialEndpoits);
