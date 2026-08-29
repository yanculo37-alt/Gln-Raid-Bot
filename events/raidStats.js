function getCount() {
  return Math.floor(Math.random() * 4000) + 1000;
}

function increment() {
  return getCount();
}

module.exports = { getCount, increment };
