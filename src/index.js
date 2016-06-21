import matrix from '../matrix.json';
import inputs from './inputs';

const nameToSymbol = inputs.reduce((acc, curr) => {
  const simpleName = curr.name.split('[')[0].trim();
  const symbol = curr.symbol;
  acc[simpleName] = symbol;
  return acc;
}, {});

const symbolToName = inputs.reduce((acc, curr) => {
  const fullName = curr.name;
  const symbol = curr.symbol;
  acc[symbol] = fullName;
  return acc;
}, {});

const STATIONS = [
  'Labrador Park', 'Tai Seng', 'Raffles Place', 'King Albert Park', 'Bishan', 'Bukit Panjang'
].map(station => nameToSymbol[station]);

const timeToSTATIONS = Object.keys(matrix).map(station => {
  const times = STATIONS.map(from => parseInt(matrix[station][from], 10) || 0);
  const details = STATIONS.reduce((acc, from) => { acc[`to ${symbolToName[from]}`] = parseInt(matrix[station][from], 10) || 0; return acc; }, {});
  return { station: symbolToName[station], details, sumTimes: times.reduce((acc, time) => acc += time, 0) };
}).sort((a,b) => a.sumTimes - b.sumTimes);

console.log(JSON.stringify(timeToSTATIONS, null, 4));
