const getRoverOrientation = (d) => {
  if (d === 'n') {
    return 180;
  } else if (d === 'e') {
    return -90;
  } else if (d === 'w') {
    return 90;
  } else if (d === 's') {
    return 0;
  }
};

export default getRoverOrientation;
