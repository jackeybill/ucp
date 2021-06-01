import React from "react";
import "./index.scss";

const ScenarioPage = () => {
  return (
    <div className="scenario-page-container">
      <div className="scenario-page-header">
        <div className="back-trial">Trial Page</div>
        <div className="scenario-tabs">
          <div className="step">
            <span className="num step1 active">1</span>

            <span className="name active">Scenario Details</span>
          </div>
          <div className="line"></div>
          <div className="step">
            <span>2</span>
            <span>Add Inclusion / Exclusion Criteria</span>
          </div>
          <div className="step">
            <span>3</span>
            <span>Add Schedule of Events</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioPage;
