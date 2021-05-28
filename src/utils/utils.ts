import { } from "./kendraTypes";
import { AttributeMap, DocumentAttributeKeys } from "../constants";

interface HasLength {
  readonly length: number;
}

export const isNullOrUndefined = (it: any) => it === null || it === undefined;

export const isNullOrEmpty = (it: HasLength) =>
  isNullOrUndefined(it) || it.length === 0;

export function unionSortedHighlights(highlights: any) {
  if (isNullOrEmpty(highlights)) {
    return highlights;
  }

  let prev = highlights[0];
  const unioned = [prev];
  for (let i = 1; i < highlights.length; i++) {
    const h = highlights[i];
    if (prev.EndOffset >= h.BeginOffset) {
      // union
      prev.EndOffset = Math.max(h.EndOffset, prev.EndOffset);
      prev.TopAnswer = prev.TopAnswer || h.TopAnswer;
    } else {
      // disjoint, add to results
      unioned.push(h);
      prev = h;
    }
  }

  return unioned;
}

export function truncateString(str: string, maxLen: number) {
  if (maxLen < 5) {
    return `${str.substr(0, 3)}...`;
  }

  const half = Math.ceil(maxLen / 2);

  return str.length < maxLen
    ? str
    : `${str.substr(0, half)}...${str.substr(str.length - (half - 5))}`;
}

export const localizedDate = (
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    hour: "numeric",
    minute: "numeric",
    month: "short",
    timeZone: "UTC",
    timeZoneName: "short",
    year: "numeric"
  }
) => {
  return date ? date.toLocaleDateString("en", options) : "";
};

export const selectMostRecentUpdatedTimestamp = (
  documentAttributes: AttributeMap
): Date | undefined => {
  const updatedAt = documentAttributes[DocumentAttributeKeys.UpdatedAt];
  const createdAt = documentAttributes[DocumentAttributeKeys.CreatedAt];

  if (updatedAt && updatedAt.StringValue) {
    return new Date(updatedAt.StringValue);
  } else if (updatedAt && updatedAt.DateValue) {
    return updatedAt.DateValue;
  } else if (createdAt && createdAt.StringValue) {
    return new Date(createdAt.StringValue);
  } else if (createdAt && createdAt.DateValue) {
    return createdAt.DateValue;
  } else {
    return undefined;
  }
};

export const getURLSearchParams = (locationSearch: string) => {
  const result: any = {};
  new URLSearchParams(locationSearch).forEach((v, k) => {
    result[k] = v;
  })
  return result;
}

export const submitFeedback = async (queryId: string, resultId: string, relevance: string) => {
  const response = await fetch('https://hp5pe11vg7.execute-api.us-east-1.amazonaws.com/prod/', {
    method: 'POST',
    headers: {
      'Access-Control-Request-Method': 'POST',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 'QueryId': queryId, 'ResultId': resultId, 'RelevanceValue': relevance })
  })

  return await response.json();
}


function _objToStrMap(obj) {
  let strMap = new Map();
  for (let k of Object.keys(obj)) {
    strMap.set(k, obj[k]);
  }
  return strMap;
}
/**
 *json转换为map
 */
export const _jsonToMap = (jsonStr: string) => {
  return _objToStrMap(JSON.parse(jsonStr));
}

export const getUrlParams = (key: string) => {
  var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)", "i");
  var r = window.location.search.substr(1).match(reg);
  if (r != null) return unescape(r[2]); return null;
}





