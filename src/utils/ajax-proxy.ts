import { BACKEND_HOST, TOPIC_ANALYSIS, RELATIONSHIP, PA_HOST, PA_HOST_EMAIL, PWC_LOGIN_URL } from '../constants'
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
  const response = await fetch('https://7dx4asj8xj.execute-api.us-east-2.amazonaws.com/dev/dean-dev-protocol-job', {
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

export const overrideText = async (filepath: string, updateData: Object) => {
  const response = await fetch(BACKEND_HOST, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ "path": filepath, updateData })
  })

  return await response.json();
}



export const topicAnalysis = async (filename) => {
  const response = await fetch(TOPIC_ANALYSIS, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "method": "getTopicAnalysis",
      "params": {
        "file_name": filename,
        "model": 'context-lda',
        "num_topics": 6,
        "target": '',
        "window_size": 6
      }
    })
  })
  return await response.json();
}

export const fileAnalysis = async (filename) => {
  const response = await fetch(TOPIC_ANALYSIS, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "method": "getComprehendMedical",
      "params": {
        "file_name": filename
      }
    })
  })
  return await response.json();
}

export const getRelationships = async () => {
  const response = await fetch(RELATIONSHIP, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "filename": "result.pdf"
    })
  })
  return await response.json();
}

export const pwcLogin = async () => {
  const response = await fetch(PWC_LOGIN_URL, {
    method: 'GET',
    headers: {
      'Access-Control-Request-Method': 'GET',
      'Content-Type': 'application/json'
    },
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

export const uploadPAFile = async (filename: string, path: string, base64: any) => {
  const response = await fetch(PA_HOST, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
      {
        'file': filename,         
        'name': base64,
        "path": "hiapaDev/RawDocuments/",
        "bucket": "hiapadev"
      })
  })

  return await response.json();
};


export const sendEmail = async () => {
  const response = await fetch(PA_HOST_EMAIL, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
      {
        "source": "jackey.xue@pwc.com",
        "receivers": ["jackey.xue@pwc.com", "jana.wolf@pwc.com", "qiaoqin.zhang@pwc.com"],
        "message": "Test",
        "subject": "Test"
      }
    )
  })

  return await response.json();
};

export const getData = async () => {
  const response = await fetch(PA_HOST, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
    "method": "listCases",
    "body": {
      "filters": "Registered Nurse"
    }
  })
  })

  return await response.json();
};

export const getCase = async (id) => {
  const response = await fetch(PA_HOST, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
    "method": "getCase",
    "body": {
      "caseID":id
    }
  })
  })

  return await response.json();
};

export const updateStatus = async (params = {}) => {
  const response = await fetch(PA_HOST, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "method": "updateStatus",
      "body": params
    })
  })

  return await response.json();
};

export const getTextractResult = async (params = {}) => {
  const response = await fetch(PA_HOST, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "method": "getTextractResult",
      "body": params
    })
  })

  return await response.json();
};

export const takeAction = async (action = "", params = {}) => {
  const response = await fetch(PA_HOST, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "method": "takeAction",
      "action": action,
      "body": params
    })
  })

  return await response.json();
};

// Save with status ""In progress""
export const saveText = async (result: any, path: any) => {
  const status = "In progress"
  const lastUpdate= moment().format('MM-DD-YYYY')
  const response = await fetch(BACKEND_HOST, {
    method: "POST",
    headers: {
      "Access-Control-Request-Method": "POST",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ savelabel: { content: result, key:path, status, lastUpdate } }),
  });

  return await response.json();
};

// Save with status "Completed"
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







