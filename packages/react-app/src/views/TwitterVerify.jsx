import React, { useEffect, useState } from "react";
import twitterAuthStep3 from "../helpers/twitterAuthStep3";
import { useHistory } from "react-router-dom";

export default function TwitterVerify({address}) {
  let history = useHistory();

  const url = window.location.href;
  const params = url.substring(url.indexOf("?"));

  function callback(res) {
    const index = res.indexOf("screen_name=") + 12;
    const username = res.substring(index);
    localStorage.setItem("twitterName", username);
    const page = localStorage.getItem("lastPage");
    history.push(page);
  }

  useEffect(() => {
    twitterAuthStep3(params, callback);
  });

  return (
    <div>
      <h1>Verifying your Twitter</h1>
    </div>
  );
}
