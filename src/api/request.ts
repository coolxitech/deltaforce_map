import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://deltaforce-api.coolxi.eu.org',
  timeout: 5000,
});

export default instance;