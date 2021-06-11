import { SHOW_SEARCH } from '../constants/index';

const initialState = {
   showSearch:true
}

const trialReducer = ( state=initialState, action) => {
	switch(action.type){	
		case SHOW_SEARCH:
            state = {
                ...state,
                ...action.data
            }
			break
		default:			
    }
    return state
}
export default trialReducer ;