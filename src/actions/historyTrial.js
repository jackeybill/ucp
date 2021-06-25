import { FETCH_HISTORY } from '../constants/index';

export function fetchHistory(data) {
	return{
		type:FETCH_HISTORY,
		data
	}
}