"use strict";

module.exports = {
  setup: function(req, res, next) {
    const OAuth2 = require("oauth").OAuth2;
    const axios = require("axios");

    const vcap_services = JSON.parse(process.env.VCAP_SERVICES);
    const vcap_conn = vcap_services["connectivity"][0];
    const virtual_scc_hosts = JSON.parse(process.env.SAP_SCC_VIRTUAL_HOSTS);
    const virtual_scc_host = virtual_scc_hosts[0];
   
    const oauth2 = new OAuth2(
      vcap_conn.credentials.clientid,
      vcap_conn.credentials.clientsecret,
      vcap_conn.credentials.url + "/",
      null,
      "oauth/token",
      null
    );

    oauth2.getOAuthAccessToken(
      "",
      { grant_type: "client_credentials" },
      function(e, access_token, refresh_token, results) {
        axios.defaults.baseURL = "http://" + virtual_scc_host;
        axios.defaults.headers.common["Proxy-Authorization"] =
          "Bearer " + access_token;
        axios.defaults.proxy = {
          host: vcap_conn.credentials.onpremise_proxy_host,
          port: vcap_conn.credentials.onpremise_proxy_port
        };
        req.axios = axios;
        req.info = vcap_services;
        next();
      }
    );
  }
};