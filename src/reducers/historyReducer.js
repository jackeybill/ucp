import { FETCH_HISTORY } from '../constants/index';

const initialState = {
    shouldFetch: true,
    historyData:[]
}

const historyReducer = (state = initialState, action) => {
    console.log(action.data)
	switch(action.type){	
        case FETCH_HISTORY:
            state = {
                ...state,
                ...action.data
            }
            
      break
		default:			
    }
    return state
}
export default historyReducer ;