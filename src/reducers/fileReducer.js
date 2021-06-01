import { FILE_READER } from '../constants/index';
import textData from '../components/Extraction/testData.json';


const initialState = {
    file: {},
    // file: textData,
    activeTabKey:'ENTITY RECOGNITION', 
    updatedSection:{}
}

const fileReducer = ( state=initialState, action) => {
	switch(action.type){	
		case FILE_READER:
            state = {
                ...state,
                ...action.data
            }
			break
		default:			
    }
    return state
}
export default fileReducer ;