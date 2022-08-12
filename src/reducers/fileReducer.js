import { FILE_READER } from '../constants/index';

const initialState = {
    file: {},
    activeTabKey:'ENTITY RECOGNITION', 
    updatedSection: {},
    updatedRelation: {},
    labels:[],
    protocolName:"",
    fileName:"",
    disabledButton:true,
    afterUpload:false,
}

const fileReducer = (state = initialState, action) => {
    console.log('=====',action.data)
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