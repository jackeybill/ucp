import React, { useState, useReducer, useEffect } from "react";
import { Input, Button, Tooltip } from "antd";
import { CheckOutlined } from "@ant-design/icons";

const CriteriaOption = (props) => {
  const domain = props.demographic;
  const [activeType, setActiveType] = useState(0);

  useEffect(() => {
    const res = props.selectedEle.findIndex((e) => {
      return e["Eligibility Criteria"] == domain.Text;
    });
    setActiveType(res != -1 ? 1 : 0);
  }, [props.selectedEle, props.minValue, props.maxValue]);

  const handleOptionSelect = (domain, e) => {
    if (activeType == 0) {
      setActiveType(1);
      props.handleOptionSelect(domain, 1, props.index, props.idx);
    } else {
      setActiveType(0);
      props.handleOptionSelect(domain, 0, props.index, props.idx);
    }
  };

  return (
    // <div className="criteria-option-wrapper">
    //   {activeType == 0 ? (
    //     <Tooltip
    //       title={
    //         "Frequency " + Math.floor(domain.Frequency * 10000) / 100 + "%"
    //       }
    //     >
    //       <div
    //         className="select-option"
    //         onClick={(e) => handleOptionSelect(domain, e)}
    //       >
    //         <span className="select-text">
    //           {domain.Text}
    //          </span>
    //       </div>
    //     </Tooltip>
    //   ) : (
    //     <div className="select-option selected" onClick={(e) => handleOptionSelect(domain, e)}>
    //       <span className="select-text">
    //         {domain.Text}
    //       </span>
    //       <span className="right-icon">
    //         <CheckOutlined />
    //       </span>
    //     </div>
    //   )}
    // </div>

    <div style={{ display: "inline-block" }}>
      {activeType == 0 ? (
        <Tooltip
          title={
            "Frequency " + Math.floor(domain.Frequency * 10000) / 100 + "%"
          }
        >
          <span
            className="select-option"
            onClick={(e) => handleOptionSelect(domain, e)}
          >
            <span className="select-text">
              {domain.Text}
             </span>
          </span>
        </Tooltip>
      ) : (
        <div className="select-option selected" onClick={(e) => handleOptionSelect(domain, e)}>
          <span className="select-text">
            <CheckOutlined />
            {domain.Text}
          </span>
        </div>
      )}
    </div>
  );
};

export default CriteriaOption;
