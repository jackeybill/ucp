import React from "react";
import { withRouter } from 'react-router';
import { Tooltip } from "antd";
import Scatter from "../Chart";
import addIcon from "../../assets/add.svg";
import "./index.scss";

const SceneriosDashbaord = (props: any) => {

  const renderTitle = () => {
    return (
      <div>
        <span className="scatter-title">PROTOCOL AMENDMENT</span>
        <Scatter />
      </div>
    );
  };


  const Metrics = () => {
    return (
      <Tooltip
        overlayClassName="metric-scatter"
        color="#ffffff"
        // visible={true}
        placement="right"
        title={renderTitle()}
      >
        <div className="col-value average-value">
          <span className="percent poor">--%</span>
        </div>
      </Tooltip>
    )
  }

  return (
    <div className="scenarios-container">
      <div className="container-top">
        <span className="count">Scenarios({props.record.scenarios && props.record.scenarios.length || 0})</span>
        <br />
        <span>
          Summary of design scenarios and key metrics on predicted impact.
        </span>
      </div>

      <div className="scenario-dashboard">
        {props.record.scenarios && props.record.scenarios.length > 0 && (
          <div className="columns">
            <div className="title"></div>
            <div className="col-item">Protocol Amendment Rate</div>
            <div className="col-item">Screen Failure Rate</div>
            <div className="col-item">Patient Burden</div>
            <div className="col-item">Patient Burden</div>
            <div></div>
          </div>
        )}

        <div className="scenario-list">
          {props.record.scenarios &&
            props.record.scenarios.length > 0 &&
            props.record.scenarios.map((s) => {
              return (
                <div className="scenario">
                  <div className="title">
                    <span>{s["scenario_id"]}</span>
                    <br />
                    <span>{s["scenario_description"]}</span>
                  </div>
                  <div className="col-value  poor">
                    {
                      s["protocol_amendment_rate"] ? (
                        <>
                          <span className="percent poor">
                            {s["protocol_amendment_rate"]}
                          </span>
                          <br />
                          <i>POOR</i>
                        </>
                      ) : '-'
                    }
                  </div>
                  <div className="col-value fair">
                    {
                      s["screen_failure_rate"] ? (
                        <>
                          <span className="percent ">{s["screen_failure_rate"]}</span>
                          <br />
                          <i>FAIR</i>
                        </>
                      ) : '-'
                    }
                  </div>
                  <div className="col-value good">
                    {
                      s["patient_burden"] ? (
                        <>
                          <span className="percent">{s["patient_burden"]}</span>
                          <br />
                          <i>GOOD</i>
                        </>
                      ) : '-'
                    }
                  </div>
                  <div className="col-value good">
                    {
                      s["cost"] ? (
                        <>
                          <span className="percent ">{s["cost"]}</span>
                          <br />
                          <i>POOR</i>
                        </>
                      ) : '-'
                    }
                  </div>
                  <div className="footer btn-wrapper">
                    <div className="view-btn" onClick={() => props.history.push({
                      pathname: '/scenario',
                      state: { trial_id: props.record['_id'], scenario_id: s['scenario_id'] }
                    })}>View Scenario</div>
                  </div>
                </div>
              );
            })}
          {
            props.record.scenarios &&
            props.record.scenarios.length > 0 && (
              <div className="average scenario">
                <div className="title average-title">
                  <span>Therapeutic Area Average</span>
                  <br />
                  <span>Endocrinology, Type 2 Diabetes Phase 3 trials</span>
                </div>
                <Metrics />
                <Metrics />
                <Metrics />
                <Metrics />
                <div className="footer btn-wrapper">
                  <div className="view-btn">View Scenario</div>
                </div>
              </div>
            )
          } 
          <div className="create-btn-wrapper">
            <div className="create-btn" onClick={() => props.history.push({
              pathname: '/scenario',
              state: { trial_id: props.record['_id']}
            })}>
              <img src={addIcon} alt="" width="68px" height="68px" />
              <br />
              <span> ADD NEW SCENARIO</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withRouter(SceneriosDashbaord);
