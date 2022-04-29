import React, { useCallback, useState, useEffect } from "react";

import { connect } from "react-redux";
import { withRouter } from "react-router";
import * as fileActions from "../../actions/file";
import { Form, Input, Progress, Spin } from 'antd';
import { useDropzone } from "react-dropzone";
import { LoadingOutlined} from "@ant-design/icons";
import ImgUpload from "../../assets/img-upload.png";
import { uploadFile, extractText } from "../../utils/ajax-proxy";
import "./index.scss";

const PATH = "iso-service-dev/RawDocuments/";
let nctID = ""
let protocolName = ""

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result?.toString());
      }
    };
    reader.onerror = (error) => reject(error);
  });

const sleep = (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

const Dropzone = (props: any) => {
  const [showError, setshowError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileTypeError, setFileTypeError] = useState(false);
  // const [nctID, setNctID] = useState("");
  // const [protocolName, setProtocolName] = useState("");

  const [form] = Form.useForm();

  useEffect(() => {
    //mock progress
    let id;
    if (files.length > 0) {
      id = setInterval(() => {
        if (progress >= 100) {
          setProgress(100);
        } else {
          setProgress(progress + 2);
        }
      }, 1000);
    }
    return () => clearInterval(id);
  }, [progress, files]);

  const onDrop = useCallback(async (acceptedFiles) => {
    for (let f of acceptedFiles) {
      if (f.type !== "application/pdf") {
        // setLoading(false);
        setFileTypeError(true)
        return
      }
    }
    setFileTypeError(false)
    // props.setLoading(true);
    setLoading(true);
    setFiles(acceptedFiles);
    // Fetch the value of input boxes
    form.submit()
    // Do something with the files
    const fileList = [];
    for (let f of acceptedFiles) {
      const base64 = await toBase64(f);  
      const fileBytes = base64.split(",")[1]
      const byteLength = base64.split(",")[1].length
      console.log("File byte length: " + byteLength);

      if (nctID === "") {
        nctID = f.name.split(".")[0].toString()
      }
      // split file every 5MB if file larger than 5MB
      const byteBenchmark= 1024*1024*5
      let res ;

      if(byteLength>byteBenchmark){
        const fileParts = []      
        const parts = Math.ceil(byteLength/byteBenchmark) 
        for(let i = 0; i<=parts-1;i++){
          const section = fileBytes.slice(byteBenchmark*i,byteBenchmark*(i+1))
          fileParts.push(section)
        }
        console.log('file splited:',fileParts.join("").length)

        for(let i = 0; i<fileParts.length;i++){
          // remove File_Path,should be: f.name.split(".")[0].toString()
          res = await uploadFile(nctID, protocolName, f.name, PATH, fileParts[i], `${i}-${fileParts.length}`);
        }

      }else{          
        // remove File_Path,should be: f.name.split(".")[0].toString()
        res = await uploadFile(nctID, protocolName, f.name, PATH, fileBytes);
      }
      console.log(res);
        
        if (res.body === "success") {
          props.readFile({
            afterUpload:true,
          })
          // await sleep(5000)
          let extractedRes = "";
          let times = 1;
          let begin = 0;
          let resultbegin = null;
          while (begin >=0 ||resultbegin.statusCode !== 200) {
            // remove File_Path
            // resultbegin = await extractText(f.name.split(".")[0].toString(), begin);
            resultbegin = await extractText(PATH + f.name, begin);
            begin = resultbegin.begin
            if(resultbegin.statusCode === 200) {
              extractedRes += resultbegin.body
            }
            console.log("resultbegin.statusCode:",resultbegin.statusCode);
            if(resultbegin.statusCode !== 200){
              await sleep(20000)
            } 
          }
          do {
            console.log(`waiting ${10 + 10 * times}s`);
            await sleep(10000 + times * 5000 *2);
            times++;
            
            try {
              console.log("extractedRes",extractedRes);
              
              const result = JSON.parse(extractedRes);
              console.log("result",result);
              
              // console.log("--upload new file--", result);
              const availableTabs: string[] = [];
              form.setFieldsValue({
                nctID: nctID === ""?f.name.split(".")[0].toString():nctID,
                protocolName: protocolName === ""?(result[Object.keys(result)[0]]["protocolTitle"][0].briefTitle||result[Object.keys(result)[0]]["protocolTitle"][0].title):protocolName,
              });
              props.readFile({
                file: result,
                protocolName:protocolName === ""?(result[Object.keys(result)[0]]["protocolTitle"][0].briefTitle||result[Object.keys(result)[0]]["protocolTitle"][0].title):protocolName,
                fileName:f.name,
                disabledButton:false
              });
              fileList.push({ 'nctID': nctID, 'protocolName': protocolName, filename: f.name, result, availableTabs });
              // props.history.push("/protocol-sections");            
            } catch (e) {
              console.error(e);
            }
            if (times > 5) {
              setshowError(true);
              break;
            }
          } while (resultbegin.statusCode !== 200);
        }
    }
    setLoading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: loading,
  });

  const onFinish = (values: any) => {
    nctID = values.nctID || ""
    protocolName = values.protocolName || ""
  };
  
  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };

  const fetchInputValue = () => {
    form.submit()
  }

  return (
    <React.Fragment>
      <Spin
        tip="Your document has been submitted for processing..."
        style={{ fontSize: 16, color: "#d04a02" }}
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 24, color: "#d04a02" }} spin />
        }
      >
        <div>
          <div className="drawer-input-zone">
          <Form
            layout="vertical"
            form={form}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            onValuesChange={fetchInputValue}
          >
            <Form.Item
              label="NCT ID"
              name="nctID"
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="PROTOCOL NAME"
              name="protocolName"
            >
              <Input />
            </Form.Item>
            {
              fileTypeError?(<p className="pdf-file-type-error">The files you selected contain Non-PDF files, please try again.</p>):(null)
            }
          </Form>
          </div>
          <div
          className={`upload-zone-container ${loading ? "disabled" : ""}`}
          {...getRootProps()}
        >
          <input {...getInputProps()} />
          <p>
            <img src={ImgUpload} />
            Drag your PDF document here, or <span>browse</span> to choose files
          </p>
        </div>
        </div>
      </Spin>

      {files.length > 0 && (
        <div className="upload-progress-container">
          <p>Uploading</p>
          {files.map((file: any,idx:number) => {
            return (
              <div className="upload-progress" key={idx}>
                <div className="pdf-icon">PDF</div>
                <div className="progress-bar-box">
                  <span className="file-name">{file.name}</span>
                  <Progress percent={progress} status={progress ==100? !showError?"success":"exception":"normal"}/>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </React.Fragment>
  );
};

const mapDispatchToProps = (dispatch) => ({
  readFile: (val) => dispatch(fileActions.fileReader(val)),
});

const mapStateToProps = (state) => ({
  fileReader: state.fileReducer,
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(Dropzone));
