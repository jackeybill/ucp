import { BACKEND_HOST, PA_HOST, PROTOCOL_JOB_URL} from '../constants'
import moment from 'moment';

export const uploadFile = async (nctID: string, protocolName: string, filename: string, path: string, base64: any,part?:any) => {
  const response = await fetch(BACKEND_HOST, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 'nctID': nctID, 'protocolName': protocolName, 'file': filename, 'path': path, 'name': base64,'part':part })
  })

  return await response.json();
};

export const getOverviewList = async () => {
  const response = await fetch(PROTOCOL_JOB_URL, {
    method:'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "method": "list"
    })
  })

  return await response.json();
}

export const extractText = async (filepath: string, begin: number) => {
  const response = await fetch(BACKEND_HOST, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ "queryStringParameters": { "file": filepath ,"begin": begin} })
  })

  return await response.json();
}

export const login = async (params = {}) => {
  const response = await fetch(PA_HOST, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      method: 'login',
      body: params
    })
  })
  return await response.json();
};

export const verifyToken = async (token = "eyJraW") => {
  const response = await fetch(PA_HOST, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token: token })
  })
  return await response.json();
}

export const submitText = async (result: any, path: any,) => {
   const status = "Completed"
  const lastUpdate= moment().format('MM-DD-YYYY');   
  const response = await fetch(BACKEND_HOST, {
    method: "POST",
    headers: {
      "Access-Control-Request-Method": "POST",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ savelabel: { content: result, key:path, status, lastUpdate} }),
  });

  return await response.json();
};







