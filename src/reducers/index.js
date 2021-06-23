import { combineReducers } from 'redux';
import trialReducer from './trialReducer';
import historyReducer from './historyReducer';

export default combineReducers({
    trialReducer,
    historyReducer
})
