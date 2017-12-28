import { FETCH_USER_INFO } from '../actions/user';
import { FETCH_USER_ORGANIZATIONS } from "../actions/organization";


const defaultState = {
    organizations: []
};

export default (state = defaultState, action) => {
    let nextState = Object.assign({}, state);
    switch(action.type){
        case FETCH_USER_INFO:
            return Object.assign(nextState, action.userInfo);
            break;
        case FETCH_USER_ORGANIZATIONS:
            nextState.organizations = action.organizations;
            break;
        default:
            return state;
    }

    return nextState;
}