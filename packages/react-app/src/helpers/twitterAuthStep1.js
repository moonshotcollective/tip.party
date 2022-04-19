import axios from "axios";
export default function twitterAuthStep1() {
    var config = {
        method: 'post',
        url: 'https://api.twitter.com/oauth/request_token?oauth_consumer_key=eIMJo9jpzDOXIDytHVXVECgai&oauth_signature_method=HMAC-SHA1&oauth_timestamp=1650388603&oauth_nonce=6NUGrzafu0l&oauth_version=1.0&oauth_signature=Z5lvYNA2VIE4P3eCViuR7xD2go8%3D', 
        headers:{
            "Origin": "http://127.0.0.1:3000",
            'Access-Control-Request-Method' : 'POST',
            'Access-Control-Request-Headers' : 'Content-Type, Authorization'

        }
      };
      
      axios(config)
      .then(function (response) {
        console.log(JSON.stringify(response.data));
      })
      .catch(function (error) {
        console.log(error);
      });
}
