import { TAuthenticationData, authenticationHolder } from "./auth";
import { TStatusResponsePayload } from "./types";
import Axios from "axios";
import { RETRIEVE_STATUS_URL, PERFORM_STRESS_URL } from "../../utils/constants";

export const getConfiguration = (authentication?: TAuthenticationData) => {
    authentication = authentication || authenticationHolder;
    return authentication && authentication.token ?
        {headers: { 'Authorization': `Bearer ${authentication.token}` }} : undefined;
};

export const retrieveStatus = (authentication?: TAuthenticationData) =>
    Axios.get<TStatusResponsePayload>(RETRIEVE_STATUS_URL, getConfiguration(authentication));

export const performRequest = (data: any, authentication?: TAuthenticationData) =>
    Axios.post(PERFORM_STRESS_URL, data, getConfiguration(authentication));