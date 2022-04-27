import axios from "axios";
export default function twitterAuthStep3(params, callback) {
  var config = {
    method: "get",
    url: `${process.env.REACT_APP_SERVER}/twitter${params}`
  };

  axios(config)
    .then(function (response) {
      console.log(response.data);
      callback(response.data);
    })
    .catch(function (error) {
      console.log(error);
    });
}