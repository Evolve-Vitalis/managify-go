// src/api/api.js
import axios from "axios";
import { BASE, VERSION } from "../../constants/urls";


export const api = axios.create({
  baseURL: `${BASE}${VERSION}`,
  headers: {
    "Content-Type": "application/json"
  }
});
