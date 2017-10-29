"use strict";

module.exports = {
  setup: function(req, res, next) {
    const OAuth2 = require("oauth").OAuth2;
    const axios = require("axios");

    const vcap_services = JSON.parse(process.env.VCAP_SERVICES);
    const vcap_con = vcap_services["connectivity"][0];
    const vcap_uaa = vcap_services["xsuaa"][0];

    const virtual_scc_hosts = JSON.parse(process.env.SAP_SCC_VIRTUAL_HOSTS);
    const virtual_scc_host = virtual_scc_hosts[0];

    const oauthcon = new OAuth2(
      vcap_con.credentials.clientid,
      vcap_con.credentials.clientsecret,
      vcap_con.credentials.url + "/",
      null,
      "oauth/token",
      null
    );

    const oauthuaa = new OAuth2(
      vcap_uaa.credentials.clientid,
      vcap_uaa.credentials.clientsecret,
      vcap_uaa.credentials.url + "/",
      null,
      "oauth/token",
      null
    );

    oauthcon.getOAuthAccessToken(
      "",
      { grant_type: "client_credentials" },
      function(e, access_token, refresh_token, results) {
        axios.defaults.baseURL = "http://" + virtual_scc_host;
        axios.defaults.headers.common["Proxy-Authorization"] =
          "Bearer " + access_token;
        axios.defaults.proxy = {
          host: vcap_con.credentials.onpremise_proxy_host,
          port: vcap_con.credentials.onpremise_proxy_port
        };

        oauthuaa.getOAuthAccessToken(
          "",
          { grant_type: "client_credentials" },
          function(e, access_token, refresh_token, results) {
            axios.defaults.headers.common["SAP-Connectivity-Authentication"] =
              "Bearer " + access_token;

            req.axios = axios;
            next();
          }
        );

      }
    );
  }
};
