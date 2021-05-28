import { FILE_READER } from '../constants/index';

export function fileReader(data) {
	return{
		type:FILE_READER,
		data
	}
}