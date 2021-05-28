import { createStore } from 'redux';
import rootReducer from '../reducers/index.js';

export default function configureStore(initialState) {
	const store = createStore(rootReducer, initialState,
		//触发redux-devtools
		window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__(): undefined
	)
	return store
}