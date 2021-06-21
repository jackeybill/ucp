import { SHOW_SEARCH, CREATE_TRIAL } from '../constants/index';

const testUsers = [
  {
    name: "user1",
    id: "001",
    role: "Trial Designer",
  },
  {
    name: "user2",
    id: "002",
    role: "Trial Designer",
  },
  {
    name: "user3",
    id: "003",
    role: "Trial Designer",
  },
];
const initialState = {
        trial_title: "",
        description: "",
        therapeutic_area: "",
        indication: "",
        trial_alias: "",
        study_type: "",
        study_phase: "",
        molecule_name: "",
        pediatric_study: "",
        study_country: "",
        scenarios: [],
        primary_endpoints: [],
        secondary_endpoints: [],
        tertiary_endpoints: [],
        similarHistoricalTrials: [],
        members:testUsers      
}

const trialReducer = (state = initialState, action) => {
	switch(action.type){	
        case CREATE_TRIAL:
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