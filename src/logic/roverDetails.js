function inverse(obj) {
  var retobj = {};
  for (var key in obj) {
    retobj[obj[key]] = key;
  }
  return retobj;
}

const orientationMap = {
  n: 180,
  e: -90,
  w: 90,
  s: 0,
};

export const getRoverOrientation = (d) => {
  return orientationMap[d];
};

export const getRoverDirection = (orientation) => {
  return inverse(orientationMap)[orientation.toString()];
};
