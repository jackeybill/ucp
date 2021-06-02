import React, { useState, useReducer, useEffect} from 'react';
import {Input, Button, Tooltip} from "antd";
import "./index.scss";

const CriteriaOption = (props) => {
    const domain = props.demographic
    const [activeType, setActiveType] = useState(props.demographic.activeType)

    const handleOptionSelect = (domain, e) =>{
        if(activeType == 0){
            setActiveType(1)
            props.handleOptionSelect(domain, 1)
        } else {
            setActiveType(0)
            props.handleOptionSelect(domain, 0)
        }
    }

    return (
        <div style={{display: 'inline-block'}}>
            {activeType == 0?(
                <Tooltip title={'Frequency ' + domain.frequency}>
                <span className="select-option" onClick={(e) => handleOptionSelect(domain, e)}>{domain.title}</span>
            </Tooltip>
            ):(
                <div className="select-option selected">
                    <span className="tick-icon"></span>
                    <span onClick={(e) => handleOptionSelect(domain, e)}>{domain.title}</span>
                </div>
            )}
        </div>
    )
}


export default CriteriaOption;