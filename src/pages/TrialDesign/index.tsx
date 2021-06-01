import React from 'react';
import TrialDetails from '../TrialDesign';
import SceneriosDashbaord from '../../components/Scenarios';


import './index.scss';




const TrialDesign = () => {
    return(
        <div className="trial-design-container">
            <TrialDetails />
            <SceneriosDashbaord/>
        </div>
    )
}


export default TrialDesign;