import { request } from "node:http";
import { DocumentAttributeValue } from "./utils/kendraTypes";
export const PAGE_SIZE = 25;

export const CHARACTER_WIDTH = 13;

export const COLLAPSED_LINES = 2;

export const FAQ_MATCHES = "Kendra found questions like yours";

export interface FAQExpandedMapType {
  expanded: boolean;
}

export enum QueryResultType {
  All = "ALL",
  Answer = "ANSWER",
  QuestionAnswer = "QUESTION_ANSWER",
  Document = "DOCUMENT"
}

export enum DocumentAttributeKeys {
  Author = "Author",
  Category = "Category",
  CreatedAt = "CreatedAt",
  Format = "FileFormat",
  SourceUri = "SourceURI",
  UpdatedAt = "UpdatedAt",
  Version = "Version"
}

export type AttributeMap = {
  [key in DocumentAttributeKeys]: DocumentAttributeValue
};

export enum AdditionalResultAttributeKeys {
  QuestionText = "QuestionText",
  AnswerText = "AnswerText"
}

export type AdditionalResultAttributeMap = {
  [key in AdditionalResultAttributeKeys]: {};
};

export enum Relevance {
  Relevant = "RELEVANT",
  NotRelevant = "NOT_RELEVANT"
}

export const ROLE_MAPPING = [
  "Intake Staff",
  "PA Staff",
  "Admin",
  "Registered Nurse",
  "Medical Doctor",
];

export const MENUS = {
  "overview": "INTAKE",
  "member": "PA CASE INFO/ADMIN CHECK",
  // "outreach":"ADMIN CHECK STATUS",
  "clinical":"RN REVIEW",
  "doctor":"MD REVIEW",
  "initiate":"STATUS & NOTIFICATION",
  "archive":"HISTORY",
}
 {/* <Menu.Item key="overview">OVERVIEW</Menu.Item>
          <Menu.Item key="initiate">AUTHORIZATION INTAKE</Menu.Item>
          <Menu.Item key="member">MEMBER&amp;CLAIM INFO</Menu.Item>       
          <Menu.Item key="clinical">RN REVIEW</Menu.Item>
          <Menu.Item key="doctor">MD REVIEW</Menu.Item> 
           <Menu.Item key="outreach">FINAL DECISION</Menu.Item>
          <Menu.Item key="archive">ARCHIVE</Menu.Item> */}
          // <Menu.Item key="overview">INTAKE</Menu.Item>
          // <Menu.Item key="member">PA CASE INFO/ROUTING</Menu.Item>
          // <Menu.Item key="outreach">ADMIN CHECK STATUS</Menu.Item>
          // <Menu.Item key="clinical">RN REVIEW</Menu.Item>
          // <Menu.Item key="doctor">MD REVIEW</Menu.Item>
          // <Menu.Item key="initiate">STATUS&amp;NOTIFICATION</Menu.Item>
          // <Menu.Item key="archive">HISTORY</Menu.Item>

export const ROLE_MENUE_MAPPING = {
  "Intake Staff":["overview","member"],
  "PA Staff": ["overview", "member",],
  // "PA Staff": ["overview", "member", "outreach",],
  // "Admin": ["overview", "member", "outreach", "clinical", "doctor", "initiate", "archive"],
  "Admin":[ "overview","member","clinical","doctor","initiate","archive"],
  "Registered Nurse":["clinical","initiate", "archive"],
  "Medical Doctor":["clinical","doctor","initiate", "archive",],
}



export const BACKEND_HOST = "https://hp5pe11vg7.execute-api.us-east-1.amazonaws.com/prod/"
export const USER_LOGIN = "https://634sjwunbk.execute-api.us-east-2.amazonaws.com/default/data-profiling-service-dev-user"

export const TOPIC_ANALYSIS = "https://ey0cm39xd6.execute-api.us-east-2.amazonaws.com/prod"
export const RELATIONSHIP = "https://f7kkd4584m.execute-api.us-east-2.amazonaws.com/default/data-profiling-service-dev-relationship"


export const PA_HOST_EMAIL = "https://2biav84kz7.execute-api.us-east-2.amazonaws.com/default/prior-authorization-service-dev-sendEMail"



export const PWC_LOGIN_URL ="https://ac-studio.pwc.com/function/idam?state="+window.location.origin+"&bottoken=eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2NDY4ODEyMDAsInN1YiI6IkJvdFRva2VuIiwiQm90SW5mb0lkIjoiMWIzNTFlM2YtMzQ4YS00MDhjLThjNWEtYzFjYTQyOTc1MmI4IiwiQm90TmFtZSI6IkhJQTIifQ.YfFU3ClMxEF3tELv6sf9UA_5ENdBaZPO5Gh2tDDOI7I";
// export const PA_HOST = "https://uoz8c451m1.execute-api.us-west-2.amazonaws.com/dev/cases"
// export const PA_HOST = "https://ymd7qr4u4g.execute-api.us-east-1.amazonaws.com/master/cases"

export const PA_HOST = process.env.REACT_APP_API_BASE_URL+"/master/cases"
export const FILE_PATH = "RawDocuments/"
console.log('current env-----',process.env.REACT_APP_STAGE, process.env.REACT_APP_API_BASE_URL)

