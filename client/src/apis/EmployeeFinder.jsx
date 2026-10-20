import axios from "axios";

export default axios.create({
  baseURL: "/backend/api/v1/employee",
});
