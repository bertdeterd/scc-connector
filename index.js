"use strict";
const OAuth2 = require("oauth").OAuth2;
const axios = require("axios");
const xsenv = require("@sap/xsenv");

module.exports = setup;

function setup(req, res, next) {
  try {
    /**
     * Get virtual host from env or ups
     */
    let host = getHost();
    axios.defaults.baseURL = "http://" + host;

    /**
     * Set header SAP-Connectivity-Authentication with usertoken (uaa)
     */
    axios.defaults.headers.common["SAP-Connectivity-Authentication"] =
      "Bearer " + req.authInfo.token;
     
    /**
     * Set header Proxy-Authorization for connectivity service 
     */
    const services = xsenv.getServices({connectivity: { tag: "connectivity" } });
    axios.defaults.proxy = { "host": services.connectivity.onpremise_proxy_host, "port": services.connectivity.onpremise_proxy_port };
   
    getAccessTokenForProxy()
      .then(data => {
        axios.defaults.headers.common["Proxy-Authorization"] = "Bearer " + data;
        req.axios = axios;
        next();
      })
      .catch(function() {
        next("Error");
      });
   
  } catch (e) {
    next("Error");
  }
}

function getHost() {
  let host = getHostByEnv();
  if (host == undefined) {
    host = getHostByUPS();
  }
  return host;
}

function getHostByEnv() {
  try {
    let vhosts = JSON.parse(process.env.SAP_SCC_VIRTUAL_HOSTS);
    vhost = vhosts[0];
    return vhost;
  } catch (e) {
    return undefined;
  }
}

function getHostByUPS() {
  let vcap_srv = JSON.parse(process.env.VCAP_SERVICES);
  let vcap_ups = vcap_srv["user-provided"];
  let host = undefined;

  for (var i = 0; i < vcap_ups.length; i++) {
    let srv = vcap_ups[i];
    if (
      srv.credentials.hasOwnProperty("sap_scc_virtual_host") &&
      srv.credentials.hasOwnProperty("sap_scc_virtual_port")
    ) {
      host =
        srv.credentials.sap_scc_virtual_host +
        ":" +
        srv.credentials.sap_scc_virtual_port;
    }
  }
  return host;
}

function getAccessTokenForProxy(host) {
  return new Promise(function(resolve, reject) {
    let vcap_srv = JSON.parse(process.env.VCAP_SERVICES);
    let vcap_con = vcap_srv["connectivity"][0];

    let oauth = new OAuth2(
      vcap_con.credentials.clientid,
      vcap_con.credentials.clientsecret,
      vcap_con.credentials.url + "/",
      null,
      "oauth/token",
      null
    );

    oauth.getOAuthAccessToken(
      "",
      { grant_type: "client_credentials" },
      function(e, access_token, refresh_token, results) {
        if (e) reject(e);
        resolve(access_token);
      }
    );
  });
}