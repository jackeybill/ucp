import { CREATE_TRIAL } from '../constants/index';

export function createTrial(data) {
	console.log("createTrial:",data);
	return{
		type:CREATE_TRIAL,
		data
	}
}