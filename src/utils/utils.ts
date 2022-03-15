/* eslint-disable */
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

export const getURLSearchParams = (locationSearch: string) => {
  const result: any = {};
  new URLSearchParams(locationSearch).forEach((v, k) => {
    result[k] = v;
  })
  return result;
}

function _objToStrMap(obj) {
  let strMap = new Map();
  for (let k of Object.keys(obj)) {
    strMap.set(k, obj[k]);
  }
  return strMap;
}

export const _jsonToMap = (jsonStr: string) => {
  return _objToStrMap(JSON.parse(jsonStr));
}

export const getUrlParams = (key: string) => {
  var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)", "i");
  var r = window.location.search.substr(1).match(reg);
  if (r != null) return unescape(r[2]); return null;
}


export function getFormatDate() {
    let date:any = new Date();
    let month:any = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentDate = month + "/" + strDate + "/" + date.getFullYear()
          
    return currentDate;
}






