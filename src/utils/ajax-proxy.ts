import { BACKEND_HOST, TOPIC_ANALYSIS, RELATIONSHIP, PA_HOST, PA_HOST_EMAIL,PWC_LOGIN_URL } from '../constants'

export const uploadFile = async (filename: string, path: string, base64: any) => {
  const response = await fetch(BACKEND_HOST, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 'file': filename, 'path': path, 'name': base64 })
  })

  return await response.json();
};

export const extractText = async (filepath: string) => {
  const response = await fetch(BACKEND_HOST, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ "queryStringParameters": { "file": filepath } })
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




export const getOverviewList = async () => {
  const response = await fetch(BACKEND_HOST, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ "queryStringParameters": { "file": "" } })
  })

  return await response.json();
}

export const saveText = async (result: any, path: any) => {
  const status = "In progress"
  const lastUpdate= new Date().toLocaleDateString()
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

export const submitText = async (result: any, path: any,) => {
   const status = "Completed"
  const lastUpdate= new Date().toLocaleDateString()
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

// criteria
const criteria_url="https://jtbey858h4.execute-api.us-west-2.amazonaws.com/main/cases"
export const getTrialList = async () => {
  const response = await fetch(criteria_url, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "module": "criteria",
      "method": "listStudies",
      "body": {
        "filters": {}
      }})
  })

  return await response.json();
}

export const addStudy = async (params:any) => {
  const response = await fetch(criteria_url, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "module": "criteria",
      "method": "addStudy",
      "body": params
      })
  })

  return await response.json();
}

export const getSummaryDefaultList = async () => {
  const response = await fetch(criteria_url, {
    method: 'POST',
  headers: {
    'Access-Control-Request-Method': 'POST',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "summary": "",
    "method": "default",
    "body": {
      "nct_ids": []
    }
    })
  })

  return await response.json();
}

export const addScenario = async (params:any) => {
  const response = await fetch(criteria_url, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "module": "criteria",
      "method": "updateStudy",
      "body": params
      })
  })

  return await response.json();
}


export const updateStudy = async (params:any) => {
  const response = await fetch(criteria_url, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "module": "criteria",
      "method": "updateStudy",
      "body": params
      })
  })

  return await response.json();
}

export const listStudy = async () => {
  const response = await fetch(criteria_url, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "studies": "",
      "method": "list"
      })
  })

  return await response.json();
}

export const getStudy = async (param: String) => {
  const response = await fetch(criteria_url, {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "module": "criteria",
      "method": "getStudy",
      "body": {
        "id": param
      }
    })
  })

  return await response.json();
}






