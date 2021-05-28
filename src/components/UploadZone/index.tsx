import React, { useCallback, useState, useEffect } from "react";

import { connect } from "react-redux";
import { withRouter } from "react-router";
import * as fileActions from "../../actions/file";
import { Progress } from 'antd';
import { Spin } from "antd";
import { useDropzone } from "react-dropzone";
import { LoadingOutlined} from "@ant-design/icons";
import ImgUpload from "../../assets/img-upload.png";
import { uploadFile, extractText } from "../../utils/ajax-proxy";
import "./index.scss";

const PATH = "iso-service-dev/RawDocuments/";

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

  useEffect(() => {
    //mock progress
    let id;
    if (files.length > 0) {
      id = setInterval(() => {
        if (progress >= 100) {
          setProgress(100);
        } else {
          setProgress(progress + 5);
        }
      }, 1000);
    }
    return () => clearInterval(id);
  }, [progress, files]);

  const onDrop = useCallback(async (acceptedFiles) => {
    // props.setLoading(true);
    setLoading(true);
    setFiles(acceptedFiles);
    // Do something with the files
    const fileList = [];
    for (let f of acceptedFiles) {
      if (f.type !== "application/pdf") {
        continue;
      }
      const base64 = await toBase64(f);
      const res = await uploadFile(f.name, PATH, base64.split(",")[1]);
      if (res.body === "success") {
        // await sleep(5000)
        let extractedRes = null;
        let times = 1;
        do {
          console.log(`waiting ${10 + 10 * times}s`);
          await sleep(10000 + times * 5000);
          times++;
          extractedRes = await extractText(PATH + f.name);
          try {
            const result = JSON.parse(extractedRes.body);
            const availableTabs: string[] = [];
            props.readFile({
              file: result,
            });
            fileList.push({ filename: f.name, result, availableTabs });
            props.history.push("/protocol-sections");
          } catch (e) {
            console.error(e);
          }
          if (times > 5) {
            setshowError(true);
            break;
          }
        } while (extractedRes.statusCode !== 200);
      }
    }
    setLoading(false);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: loading,
  });

  return (
    <React.Fragment>
      <Spin
        spinning={loading}
        indicator={
          <LoadingOutlined style={{ fontSize: 24, color: "#d04a02" }} spin />
        }
      >
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
