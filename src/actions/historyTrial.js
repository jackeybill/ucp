import { FETCH_HISTORY } from '../constants/index';

export function fetchHistory(data) {
	console.log('------',data)
	return{
		type:FETCH_HISTORY,
		data
	}
}