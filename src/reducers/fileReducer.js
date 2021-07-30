import { FILE_READER } from '../constants/index';

const initialState = {
    file: {},
    activeTabKey:'ENTITY RECOGNITION', 
    updatedSection: {},
    labels:[],
    protocolName:"",
    fileName:""
}

const fileReducer = (state = initialState, action) => {
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