import { SHOW_SEARCH } from '../constants/index';

export function showSearch(data) {
	return{
		type:SHOW_SEARCH,
		data
	}
}